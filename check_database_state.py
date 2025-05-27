#!/usr/bin/env python3
"""
Script to check the current state of the fine-tuning database.
Shows existing processing jobs, field mappings, and training data.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

def check_database_tables():
    """Check if all required database tables exist."""
    print("🔍 Checking database tables...")
    
    try:
        from backend.models.database import SessionLocal, engine
        from backend.models.training_data import ProcessingJob, FieldMapping, FileUpload, UserCorrection, TrainingDataset, ModelPerformance
        
        # Check table existence by querying each one
        db = SessionLocal()
        try:
            tables_info = []
            
            # Processing Jobs
            job_count = db.query(ProcessingJob).count()
            tables_info.append(("processing_jobs", job_count))
            
            # Field Mappings
            mapping_count = db.query(FieldMapping).count()
            tables_info.append(("field_mappings", mapping_count))
            
            # File Uploads
            file_count = db.query(FileUpload).count()
            tables_info.append(("file_uploads", file_count))
            
            # User Corrections
            correction_count = db.query(UserCorrection).count()
            tables_info.append(("user_corrections", correction_count))
            
            # Training Datasets
            dataset_count = db.query(TrainingDataset).count()
            tables_info.append(("training_datasets", dataset_count))
            
            # Model Performance
            performance_count = db.query(ModelPerformance).count()
            tables_info.append(("model_performance", performance_count))
            
            print("✅ All database tables accessible:")
            for table_name, count in tables_info:
                print(f"   📊 {table_name}: {count} records")
            
            return True, tables_info
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Database check failed: {e}")
        return False, []

def show_recent_processing_jobs():
    """Show recent processing jobs with details."""
    print("\n📁 Recent Processing Jobs:")
    print("-" * 40)
    
    try:
        from backend.models.database import SessionLocal
        from backend.models.training_data import ProcessingJob, FieldMapping, FileUpload
        
        db = SessionLocal()
        try:
            # Get all processing jobs, ordered by creation date
            jobs = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).limit(10).all()
            
            if not jobs:
                print("   No processing jobs found in database")
                return
            
            for i, job in enumerate(jobs, 1):
                print(f"\n{i}. Job ID: {job.processing_id}")
                print(f"   📄 File: {job.file_name}")
                print(f"   📊 Status: {job.status}")
                print(f"   👤 User: {job.user_id}")
                print(f"   📅 Created: {job.created_at}")
                print(f"   📈 Records: {job.record_count or 'N/A'}")
                
                if job.completed_at:
                    print(f"   ✅ Completed: {job.completed_at}")
                
                # Show AI stats if available
                if job.ai_stats:
                    print(f"   🤖 AI Stats:")
                    for key, value in job.ai_stats.items():
                        print(f"      - {key}: {value}")
                
                # Show API usage if available
                if job.api_usage:
                    print(f"   💰 API Usage:")
                    for key, value in job.api_usage.items():
                        print(f"      - {key}: {value}")
                
                # Check field mappings for this job
                mappings = db.query(FieldMapping).filter(
                    FieldMapping.processing_job_id == job.id
                ).all()
                
                print(f"   🗺️  Field Mappings: {len(mappings)}")
                if mappings:
                    print(f"      Sample mappings:")
                    for mapping in mappings[:3]:  # Show first 3
                        confidence = mapping.confidence_score or 0
                        print(f"      • {mapping.original_column_name} → {mapping.mapped_field_name} ({confidence:.1f}%)")
                    if len(mappings) > 3:
                        print(f"      ... and {len(mappings) - 3} more")
                
                # Check file uploads for this job
                file_uploads = db.query(FileUpload).filter(
                    FileUpload.processing_job_id == job.id
                ).all()
                
                if file_uploads:
                    print(f"   📎 File Uploads: {len(file_uploads)}")
                    for upload in file_uploads:
                        size_mb = (upload.file_size / 1024 / 1024) if upload.file_size else 0
                        print(f"      • {upload.original_filename} ({size_mb:.2f} MB)")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Failed to show processing jobs: {e}")

def show_field_mapping_patterns():
    """Show field mapping patterns and statistics."""
    print("\n🗺️  Field Mapping Patterns:")
    print("-" * 40)
    
    try:
        from backend.models.database import SessionLocal
        from backend.models.training_data import FieldMapping
        from sqlalchemy import func
        
        db = SessionLocal()
        try:
            # Get mapping statistics
            total_mappings = db.query(FieldMapping).count()
            
            if total_mappings == 0:
                print("   No field mappings found in database")
                return
            
            print(f"📊 Total field mappings: {total_mappings}")
            
            # Most common source columns
            print(f"\n📥 Most common source columns:")
            source_stats = db.query(
                FieldMapping.original_column_name,
                func.count(FieldMapping.id).label('count')
            ).group_by(FieldMapping.original_column_name).order_by(func.count(FieldMapping.id).desc()).limit(10).all()
            
            for column, count in source_stats:
                print(f"   • {column}: {count} times")
            
            # Most common target fields
            print(f"\n📤 Most common target fields:")
            target_stats = db.query(
                FieldMapping.mapped_field_name,
                func.count(FieldMapping.id).label('count')
            ).group_by(FieldMapping.mapped_field_name).order_by(func.count(FieldMapping.id).desc()).limit(10).all()
            
            for field, count in target_stats:
                print(f"   • {field}: {count} times")
            
            # Confidence score distribution
            print(f"\n📈 Confidence score distribution:")
            high_confidence = db.query(FieldMapping).filter(FieldMapping.confidence_score >= 80).count()
            medium_confidence = db.query(FieldMapping).filter(
                FieldMapping.confidence_score >= 60,
                FieldMapping.confidence_score < 80
            ).count()
            low_confidence = db.query(FieldMapping).filter(FieldMapping.confidence_score < 60).count()
            
            print(f"   • High confidence (≥80%): {high_confidence}")
            print(f"   • Medium confidence (60-79%): {medium_confidence}")
            print(f"   • Low confidence (<60%): {low_confidence}")
            
            # Average confidence by mapping method
            print(f"\n🤖 Average confidence by method:")
            method_stats = db.query(
                FieldMapping.mapping_method,
                func.avg(FieldMapping.confidence_score).label('avg_confidence'),
                func.count(FieldMapping.id).label('count')
            ).group_by(FieldMapping.mapping_method).all()
            
            for method, avg_conf, count in method_stats:
                avg_conf = avg_conf or 0
                print(f"   • {method}: {avg_conf:.1f}% average ({count} mappings)")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Failed to show field mapping patterns: {e}")

def check_training_data_readiness():
    """Check if there's enough data for training."""
    print("\n🎯 Training Data Readiness:")
    print("-" * 40)
    
    try:
        from backend.models.database import SessionLocal
        from backend.services.training_data_service import TrainingDataService
        
        db = SessionLocal()
        try:
            service = TrainingDataService(db)
            summary = service.get_training_data_summary()
            
            print(f"📊 Training Data Summary:")
            print(f"   • Total processing jobs: {summary['total_processing_jobs']}")
            print(f"   • Total field mappings: {summary['total_field_mappings']}")
            print(f"   • User corrections: {summary['total_user_corrections']}")
            print(f"   • Recent jobs (7 days): {summary['recent_jobs_7_days']}")
            print(f"   • Mapping accuracy: {summary['mapping_accuracy_percent']:.1f}%")
            
            # Recommendations for training readiness
            print(f"\n💡 Training Readiness Assessment:")
            
            if summary['total_field_mappings'] < 50:
                print(f"   ⚠️  Need more field mappings (have {summary['total_field_mappings']}, recommend 50+)")
            else:
                print(f"   ✅ Sufficient field mappings ({summary['total_field_mappings']})")
            
            if summary['total_processing_jobs'] < 10:
                print(f"   ⚠️  Need more processing jobs (have {summary['total_processing_jobs']}, recommend 10+)")
            else:
                print(f"   ✅ Sufficient processing jobs ({summary['total_processing_jobs']})")
            
            if summary['mapping_accuracy_percent'] < 80:
                print(f"   ⚠️  Mapping accuracy could be improved ({summary['mapping_accuracy_percent']:.1f}%)")
            else:
                print(f"   ✅ Good mapping accuracy ({summary['mapping_accuracy_percent']:.1f}%)")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Failed to check training readiness: {e}")

def main():
    """Main function to check database state."""
    print("🔍 Fine-Tuning Database State Check")
    print("=" * 50)
    
    # Check database tables
    success, table_info = check_database_tables()
    
    if not success:
        print("\n❌ Cannot access database. Please check your database configuration.")
        return
    
    # Show detailed information if there's data
    total_records = sum(count for _, count in table_info)
    
    if total_records == 0:
        print("\n📭 Database is empty - no training data collected yet.")
        print("\n💡 To start collecting training data:")
        print("   1. Upload and process some files through the application")
        print("   2. Make sure AI enhancement is enabled")
        print("   3. Check that the database connection is working")
    else:
        print(f"\n📊 Found {total_records} total records in training database")
        
        # Show detailed information
        show_recent_processing_jobs()
        show_field_mapping_patterns()
        check_training_data_readiness()
    
    print("\n" + "=" * 50)
    print("✅ Database state check completed")

if __name__ == "__main__":
    main()
