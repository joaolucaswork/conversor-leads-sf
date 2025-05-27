"""
Service for managing training data collection and storage
"""

import json
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from models.training_data import (
    ProcessingJob, FieldMapping, UserCorrection,
    FileUpload, TrainingDataset, ModelPerformance
)

class TrainingDataService:
    """
    Service for collecting and managing training data for fine-tuning
    """

    def __init__(self, db: Session):
        self.db = db
        self.storage_path = Path("data/training_storage")
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def create_processing_job(
        self,
        processing_id: str,
        user_id: str,
        file_name: str,
        file_path: str,
        **kwargs
    ) -> ProcessingJob:
        """
        Create a new processing job record
        """
        job = ProcessingJob(
            processing_id=processing_id,
            user_id=user_id,
            file_name=file_name,
            original_file_path=file_path,
            **kwargs
        )

        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        return job

    def update_processing_job(
        self,
        processing_id: str,
        **updates
    ) -> Optional[ProcessingJob]:
        """
        Update processing job with new information
        """
        job = self.db.query(ProcessingJob).filter(
            ProcessingJob.processing_id == processing_id
        ).first()

        if job:
            for key, value in updates.items():
                setattr(job, key, value)

            job.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(job)

        return job

    def store_field_mappings(
        self,
        processing_job_id: int,
        mappings: List[Dict[str, Any]]
    ) -> List[FieldMapping]:
        """
        Store AI-generated field mappings
        """
        field_mappings = []

        for mapping_data in mappings:
            field_mapping = FieldMapping(
                processing_job_id=processing_job_id,
                original_column_name=mapping_data.get('original_column'),
                original_column_index=mapping_data.get('column_index'),
                sample_data=mapping_data.get('sample_data'),
                mapped_field_name=mapping_data.get('mapped_field'),
                confidence_score=mapping_data.get('confidence'),
                mapping_method=mapping_data.get('method', 'ai'),
                ai_reasoning=mapping_data.get('reasoning')
            )

            self.db.add(field_mapping)
            field_mappings.append(field_mapping)

        self.db.commit()
        return field_mappings

    def store_file_upload(
        self,
        processing_job_id: int,
        file_info: Dict[str, Any],
        store_file: bool = True
    ) -> FileUpload:
        """
        Store uploaded file information and optionally the file itself
        """
        # Store file if requested
        stored_path = None
        if store_file and file_info.get('file_path'):
            stored_path = self._store_training_file(
                file_info['file_path'],
                file_info['original_filename']
            )

        file_upload = FileUpload(
            processing_job_id=processing_job_id,
            original_filename=file_info['original_filename'],
            file_path=stored_path,
            file_size=file_info.get('file_size'),
            file_type=file_info.get('file_type'),
            file_encoding=file_info.get('file_encoding'),
            column_names=file_info.get('column_names'),
            sample_rows=file_info.get('sample_rows'),
            total_rows=file_info.get('total_rows')
        )

        self.db.add(file_upload)
        self.db.commit()
        self.db.refresh(file_upload)

        return file_upload

    def add_user_correction(
        self,
        processing_job_id: int,
        user_id: str,
        correction_data: Dict[str, Any]
    ) -> UserCorrection:
        """
        Store user correction for training data improvement
        """
        correction = UserCorrection(
            processing_job_id=processing_job_id,
            user_id=user_id,
            field_mapping_id=correction_data.get('field_mapping_id'),
            correction_type=correction_data['correction_type'],
            original_value=correction_data['original_value'],
            corrected_value=correction_data['corrected_value'],
            correction_reason=correction_data.get('correction_reason'),
            field_name=correction_data.get('field_name'),
            record_index=correction_data.get('record_index')
        )

        self.db.add(correction)
        self.db.commit()
        self.db.refresh(correction)

        return correction

    def get_training_data_summary(self) -> Dict[str, Any]:
        """
        Get summary statistics of collected training data
        """
        total_jobs = self.db.query(ProcessingJob).count()
        total_mappings = self.db.query(FieldMapping).count()
        total_corrections = self.db.query(UserCorrection).count()

        # Get recent activity
        recent_jobs = self.db.query(ProcessingJob).filter(
            ProcessingJob.created_at >= func.date_trunc('day', func.now()) - func.interval('7 days')
        ).count()

        # Get accuracy metrics
        validated_mappings = self.db.query(FieldMapping).filter(
            FieldMapping.is_validated == True
        ).count()

        correct_mappings = self.db.query(FieldMapping).filter(
            FieldMapping.validation_status == 'correct'
        ).count()

        accuracy = (correct_mappings / validated_mappings * 100) if validated_mappings > 0 else 0

        return {
            'total_processing_jobs': total_jobs,
            'total_field_mappings': total_mappings,
            'total_user_corrections': total_corrections,
            'recent_jobs_7_days': recent_jobs,
            'mapping_accuracy_percent': round(accuracy, 2),
            'validated_mappings': validated_mappings,
            'storage_path': str(self.storage_path),
            'last_updated': datetime.utcnow().isoformat()
        }

    def get_field_mapping_patterns(self) -> Dict[str, Any]:
        """
        Analyze field mapping patterns for training data generation
        """
        # Get most common mappings
        common_mappings = self.db.query(
            FieldMapping.original_column_name,
            FieldMapping.mapped_field_name,
            func.count(FieldMapping.id).label('count'),
            func.avg(FieldMapping.confidence_score).label('avg_confidence')
        ).group_by(
            FieldMapping.original_column_name,
            FieldMapping.mapped_field_name
        ).order_by(desc('count')).limit(50).all()

        # Get problematic mappings (low confidence or corrected)
        problematic_mappings = self.db.query(FieldMapping).filter(
            (FieldMapping.confidence_score < 70) |
            (FieldMapping.validation_status == 'incorrect')
        ).limit(20).all()

        return {
            'common_mappings': [
                {
                    'original_column': mapping.original_column_name,
                    'mapped_field': mapping.mapped_field_name,
                    'frequency': mapping.count,
                    'avg_confidence': round(mapping.avg_confidence, 2)
                }
                for mapping in common_mappings
            ],
            'problematic_mappings': [
                {
                    'id': mapping.id,
                    'original_column': mapping.original_column_name,
                    'mapped_field': mapping.mapped_field_name,
                    'confidence': mapping.confidence_score,
                    'status': mapping.validation_status
                }
                for mapping in problematic_mappings
            ]
        }

    def _store_training_file(self, source_path: str, filename: str) -> str:
        """
        Store file in training data storage with anonymization
        """
        # Create timestamped directory
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        storage_dir = self.storage_path / timestamp
        storage_dir.mkdir(exist_ok=True)

        # Copy file to storage
        dest_path = storage_dir / filename
        shutil.copy2(source_path, dest_path)

        return str(dest_path)

    def cleanup_old_training_data(self, days_to_keep: int = 90):
        """
        Clean up old training data files (keeping database records)
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

        old_uploads = self.db.query(FileUpload).filter(
            FileUpload.created_at < cutoff_date,
            FileUpload.file_path.isnot(None)
        ).all()

        cleaned_count = 0
        for upload in old_uploads:
            if upload.file_path and os.path.exists(upload.file_path):
                try:
                    os.remove(upload.file_path)
                    upload.file_path = None  # Mark as cleaned
                    cleaned_count += 1
                except Exception as e:
                    print(f"Failed to remove {upload.file_path}: {e}")

        self.db.commit()
        return cleaned_count
