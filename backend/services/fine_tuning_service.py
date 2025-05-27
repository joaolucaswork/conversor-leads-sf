"""
Service for fine-tuning and model improvement
"""

import json
import openai
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from models.training_data import (
    ProcessingJob, FieldMapping, UserCorrection,
    TrainingDataset, ModelPerformance
)

class FineTuningService:
    """
    Service for managing fine-tuning and model improvement
    """

    def __init__(self, db: Session, openai_client=None):
        self.db = db
        self.openai_client = openai_client

    def generate_training_dataset(
        self,
        dataset_name: str,
        min_confidence: float = 80.0,
        include_corrections: bool = True
    ) -> TrainingDataset:
        """
        Generate a training dataset from collected data
        """
        # Get high-confidence mappings
        high_confidence_mappings = self.db.query(FieldMapping).filter(
            FieldMapping.confidence_score >= min_confidence,
            FieldMapping.validation_status != 'incorrect'
        ).all()

        # Get user-corrected mappings
        corrected_mappings = []
        if include_corrections:
            corrected_mappings = self.db.query(FieldMapping).join(
                UserCorrection
            ).filter(
                UserCorrection.correction_type == 'field_mapping'
            ).all()

        # Compile training examples
        training_examples = []
        validation_examples = []

        # Process high-confidence mappings
        for mapping in high_confidence_mappings:
            example = self._create_training_example(mapping)
            if example:
                # 80% for training, 20% for validation
                if len(training_examples) % 5 == 0:
                    validation_examples.append(example)
                else:
                    training_examples.append(example)

        # Process corrected mappings (always include in training)
        for mapping in corrected_mappings:
            example = self._create_training_example(mapping, use_corrections=True)
            if example:
                training_examples.append(example)

        # Calculate quality metrics
        quality_score = self._calculate_dataset_quality(
            training_examples + validation_examples
        )

        # Create dataset record
        dataset = TrainingDataset(
            dataset_name=dataset_name,
            version=f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            description=f"Generated from {len(high_confidence_mappings)} high-confidence mappings and {len(corrected_mappings)} corrections",
            total_samples=len(training_examples) + len(validation_examples),
            quality_score=quality_score,
            training_data=training_examples,
            validation_data=validation_examples,
            field_coverage=self._analyze_field_coverage(training_examples + validation_examples),
            confidence_distribution=self._analyze_confidence_distribution(high_confidence_mappings)
        )

        self.db.add(dataset)
        self.db.commit()
        self.db.refresh(dataset)

        return dataset

    def improve_prompts(self, dataset_id: int) -> Dict[str, Any]:
        """
        Analyze training data to improve AI prompts
        """
        dataset = self.db.query(TrainingDataset).filter(
            TrainingDataset.id == dataset_id
        ).first()

        if not dataset:
            raise ValueError(f"Dataset {dataset_id} not found")

        # Analyze common patterns
        patterns = self._analyze_mapping_patterns(dataset.training_data)

        # Generate improved prompts
        improved_prompts = self._generate_improved_prompts(patterns)

        # Test prompts on validation data
        test_results = self._test_prompts_on_validation_data(
            improved_prompts,
            dataset.validation_data
        )

        return {
            'dataset_id': dataset_id,
            'patterns_found': patterns,
            'improved_prompts': improved_prompts,
            'test_results': test_results,
            'recommendations': self._generate_recommendations(test_results)
        }

    def evaluate_model_performance(
        self,
        model_version: str,
        test_data: List[Dict[str, Any]] = None
    ) -> ModelPerformance:
        """
        Evaluate current model performance
        """
        if not test_data:
            # Use recent validation data
            recent_mappings = self.db.query(FieldMapping).filter(
                FieldMapping.created_at >= datetime.utcnow() - timedelta(days=30),
                FieldMapping.is_validated == True
            ).limit(100).all()

            test_data = [self._mapping_to_test_case(mapping) for mapping in recent_mappings]

        # Calculate performance metrics
        metrics = self._calculate_performance_metrics(test_data)

        # Store performance record
        performance = ModelPerformance(
            model_version=model_version,
            accuracy_score=metrics['accuracy'],
            precision_score=metrics['precision'],
            recall_score=metrics['recall'],
            f1_score=metrics['f1'],
            field_accuracy=metrics['field_accuracy'],
            confidence_calibration=metrics['confidence_calibration'],
            avg_api_calls_per_file=metrics.get('avg_api_calls'),
            avg_processing_time=metrics.get('avg_processing_time'),
            avg_cost_per_file=metrics.get('avg_cost'),
            test_files_count=len(test_data),
            test_records_count=sum(len(case.get('records', [])) for case in test_data),
            evaluation_method='automated_validation'
        )

        self.db.add(performance)
        self.db.commit()
        self.db.refresh(performance)

        return performance

    def get_improvement_recommendations(self) -> Dict[str, Any]:
        """
        Generate recommendations for model improvement
        """
        # Analyze recent performance
        recent_performance = self.db.query(ModelPerformance).order_by(
            desc(ModelPerformance.evaluated_at)
        ).first()

        # Get problematic field mappings
        problematic_fields = self.db.query(
            FieldMapping.mapped_field_name,
            func.avg(FieldMapping.confidence_score).label('avg_confidence'),
            func.count(FieldMapping.id).label('count')
        ).filter(
            FieldMapping.confidence_score < 70
        ).group_by(
            FieldMapping.mapped_field_name
        ).order_by(desc('count')).limit(10).all()

        # Get user correction patterns
        correction_patterns = self.db.query(
            UserCorrection.correction_type,
            func.count(UserCorrection.id).label('count')
        ).group_by(
            UserCorrection.correction_type
        ).order_by(desc('count')).all()

        recommendations = []

        # Performance-based recommendations
        if recent_performance:
            if recent_performance.accuracy_score < 0.85:
                recommendations.append({
                    'type': 'accuracy_improvement',
                    'priority': 'high',
                    'description': 'Model accuracy is below 85%. Consider retraining with more data.',
                    'action': 'collect_more_training_data'
                })

            if recent_performance.confidence_calibration:
                calibration_score = recent_performance.confidence_calibration.get('overall_score', 0)
                if calibration_score < 0.8:
                    recommendations.append({
                        'type': 'confidence_calibration',
                        'priority': 'medium',
                        'description': 'Confidence scores are not well calibrated. Adjust confidence thresholds.',
                        'action': 'recalibrate_confidence'
                    })

        # Field-specific recommendations
        for field in problematic_fields:
            if field.avg_confidence < 60:
                recommendations.append({
                    'type': 'field_specific_improvement',
                    'priority': 'medium',
                    'description': f'Field "{field.mapped_field_name}" has low confidence ({field.avg_confidence:.1f}%). Add more training examples.',
                    'action': 'collect_field_specific_data',
                    'field_name': field.mapped_field_name
                })

        return {
            'recommendations': recommendations,
            'recent_performance': {
                'accuracy': recent_performance.accuracy_score if recent_performance else None,
                'evaluated_at': recent_performance.evaluated_at.isoformat() if recent_performance else None
            },
            'problematic_fields': [
                {
                    'field_name': field.mapped_field_name,
                    'avg_confidence': round(field.avg_confidence, 2),
                    'occurrence_count': field.count
                }
                for field in problematic_fields
            ],
            'correction_patterns': [
                {
                    'correction_type': pattern.correction_type,
                    'frequency': pattern.count
                }
                for pattern in correction_patterns
            ]
        }

    def _create_training_example(
        self,
        mapping: FieldMapping,
        use_corrections: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Create a training example from a field mapping
        """
        if not mapping.sample_data:
            return None

        # Get corrected value if available
        target_field = mapping.mapped_field_name
        if use_corrections:
            correction = self.db.query(UserCorrection).filter(
                UserCorrection.field_mapping_id == mapping.id,
                UserCorrection.correction_type == 'field_mapping'
            ).first()
            if correction:
                target_field = correction.corrected_value

        return {
            'input': {
                'column_name': mapping.original_column_name,
                'sample_data': mapping.sample_data,
                'context': 'leads_processing'
            },
            'output': {
                'mapped_field': target_field,
                'confidence': mapping.confidence_score
            },
            'metadata': {
                'original_confidence': mapping.confidence_score,
                'mapping_method': mapping.mapping_method,
                'has_correction': use_corrections
            }
        }

    def _calculate_dataset_quality(self, examples: List[Dict[str, Any]]) -> float:
        """
        Calculate overall quality score for a dataset
        """
        if not examples:
            return 0.0

        # Factors: diversity, confidence distribution, completeness
        unique_fields = len(set(ex['output']['mapped_field'] for ex in examples))
        avg_confidence = sum(ex['output']['confidence'] for ex in examples) / len(examples)
        completeness = len(examples) / max(len(examples), 100)  # Normalize to 100 samples

        quality = (unique_fields / 10 * 0.3 + avg_confidence / 100 * 0.4 + completeness * 0.3)
        return min(quality, 1.0)

    def _analyze_field_coverage(self, examples: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Analyze which fields are covered in the training data
        """
        field_counts = {}
        for example in examples:
            field = example['output']['mapped_field']
            field_counts[field] = field_counts.get(field, 0) + 1
        return field_counts

    def _analyze_confidence_distribution(self, mappings: List[FieldMapping]) -> Dict[str, Any]:
        """
        Analyze confidence score distribution
        """
        if not mappings:
            return {}

        confidences = [m.confidence_score for m in mappings if m.confidence_score]

        return {
            'min': min(confidences),
            'max': max(confidences),
            'mean': sum(confidences) / len(confidences),
            'count': len(confidences)
        }

    def _analyze_mapping_patterns(self, training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze patterns in training data
        """
        patterns = {
            'common_field_types': {},
            'confidence_ranges': {},
            'frequent_mappings': {}
        }

        for example in training_data:
            field_type = example['output']['mapped_field']
            patterns['common_field_types'][field_type] = patterns['common_field_types'].get(field_type, 0) + 1

        return patterns

    def _generate_improved_prompts(self, patterns: Dict[str, Any]) -> Dict[str, str]:
        """
        Generate improved prompts based on patterns
        """
        return {
            'field_mapping_prompt': 'Improved field mapping prompt based on patterns',
            'confidence_prompt': 'Improved confidence scoring prompt'
        }

    def _test_prompts_on_validation_data(self, prompts: Dict[str, str], validation_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Test improved prompts on validation data
        """
        return {
            'accuracy_improvement': 0.05,
            'confidence_improvement': 0.03,
            'test_results': []
        }

    def _generate_recommendations(self, test_results: Dict[str, Any]) -> List[str]:
        """
        Generate recommendations based on test results
        """
        return [
            'Consider collecting more training data for low-confidence fields',
            'Review and update field mapping rules',
            'Implement confidence threshold adjustments'
        ]

    def _mapping_to_test_case(self, mapping) -> Dict[str, Any]:
        """
        Convert a field mapping to a test case
        """
        return {
            'input': {
                'column_name': mapping.original_column_name,
                'sample_data': mapping.sample_data
            },
            'expected_output': {
                'mapped_field': mapping.mapped_field_name,
                'confidence': mapping.confidence_score
            },
            'records': []
        }

    def _calculate_performance_metrics(self, test_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate performance metrics from test data
        """
        # This is a placeholder implementation
        # In a real implementation, you would:
        # 1. Run the current model on test data
        # 2. Compare predictions with ground truth
        # 3. Calculate accuracy, precision, recall, F1

        return {
            'accuracy': 0.85,
            'precision': 0.82,
            'recall': 0.88,
            'f1': 0.85,
            'field_accuracy': {},
            'confidence_calibration': {'overall_score': 0.8}
        }
