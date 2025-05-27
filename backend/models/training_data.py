"""
Database models for fine-tuning training data collection
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class ProcessingJob(Base):
    """
    Enhanced processing job model with training data collection
    """
    __tablename__ = "processing_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    processing_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(String(100), index=True)  # Salesforce user ID
    file_name = Column(String(255), nullable=False)
    original_file_path = Column(String(500))  # Path to original uploaded file
    processed_file_path = Column(String(500))  # Path to processed file
    
    # Processing metadata
    status = Column(String(50), default="queued")
    progress = Column(Integer, default=0)
    current_stage = Column(String(100))
    message = Column(Text)
    
    # AI processing results
    ai_stats = Column(JSON)  # AI processing statistics
    api_usage = Column(JSON)  # OpenAI API usage data
    confidence_scores = Column(JSON)  # Field mapping confidence scores
    
    # File metadata
    record_count = Column(Integer)
    file_size = Column(Integer)  # File size in bytes
    file_encoding = Column(String(50))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    field_mappings = relationship("FieldMapping", back_populates="processing_job")
    user_corrections = relationship("UserCorrection", back_populates="processing_job")
    file_upload = relationship("FileUpload", back_populates="processing_job", uselist=False)

class FieldMapping(Base):
    """
    Store AI-generated field mappings for training data
    """
    __tablename__ = "field_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    processing_job_id = Column(Integer, ForeignKey("processing_jobs.id"), nullable=False)
    
    # Original column information
    original_column_name = Column(String(255), nullable=False)
    original_column_index = Column(Integer)
    sample_data = Column(JSON)  # Sample values from the column
    
    # AI mapping results
    mapped_field_name = Column(String(255))  # Target field name
    confidence_score = Column(Float)  # AI confidence (0-100)
    mapping_method = Column(String(50))  # 'ai' or 'rule_based'
    ai_reasoning = Column(Text)  # AI explanation for the mapping
    
    # Validation results
    is_validated = Column(Boolean, default=False)
    validation_status = Column(String(50))  # 'correct', 'incorrect', 'needs_review'
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    processing_job = relationship("ProcessingJob", back_populates="field_mappings")
    user_corrections = relationship("UserCorrection", back_populates="field_mapping")

class UserCorrection(Base):
    """
    Store user corrections to improve training data
    """
    __tablename__ = "user_corrections"
    
    id = Column(Integer, primary_key=True, index=True)
    processing_job_id = Column(Integer, ForeignKey("processing_jobs.id"), nullable=False)
    field_mapping_id = Column(Integer, ForeignKey("field_mappings.id"))
    user_id = Column(String(100), nullable=False)
    
    # Correction details
    correction_type = Column(String(50))  # 'field_mapping', 'data_validation', 'format_correction'
    original_value = Column(Text)
    corrected_value = Column(Text)
    correction_reason = Column(Text)
    
    # Context information
    field_name = Column(String(255))
    record_index = Column(Integer)  # Which record in the file
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    processing_job = relationship("ProcessingJob", back_populates="user_corrections")
    field_mapping = relationship("FieldMapping", back_populates="user_corrections")

class FileUpload(Base):
    """
    Store original uploaded files for training data
    """
    __tablename__ = "file_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    processing_job_id = Column(Integer, ForeignKey("processing_jobs.id"), nullable=False)
    
    # File information
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500))  # Path to stored file
    file_size = Column(Integer)
    file_type = Column(String(50))  # 'xlsx', 'xls', 'csv'
    file_encoding = Column(String(50))
    
    # File content metadata
    column_names = Column(JSON)  # List of original column names
    sample_rows = Column(JSON)  # First few rows for analysis
    total_rows = Column(Integer)
    
    # Data anonymization
    is_anonymized = Column(Boolean, default=False)
    anonymization_method = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    processing_job = relationship("ProcessingJob", back_populates="file_upload")

class TrainingDataset(Base):
    """
    Compiled training datasets for model improvement
    """
    __tablename__ = "training_datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    
    # Dataset metadata
    description = Column(Text)
    total_samples = Column(Integer)
    quality_score = Column(Float)  # Overall quality assessment
    
    # Training data
    training_data = Column(JSON)  # Compiled training examples
    validation_data = Column(JSON)  # Validation examples
    
    # Dataset statistics
    field_coverage = Column(JSON)  # Which fields are covered
    confidence_distribution = Column(JSON)  # Distribution of confidence scores
    
    # Status
    is_active = Column(Boolean, default=False)
    is_deployed = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ModelPerformance(Base):
    """
    Track model performance metrics over time
    """
    __tablename__ = "model_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(100), nullable=False)
    dataset_version = Column(String(50))
    
    # Performance metrics
    accuracy_score = Column(Float)
    precision_score = Column(Float)
    recall_score = Column(Float)
    f1_score = Column(Float)
    
    # Field-specific metrics
    field_accuracy = Column(JSON)  # Accuracy per field type
    confidence_calibration = Column(JSON)  # How well confidence scores match actual accuracy
    
    # API usage metrics
    avg_api_calls_per_file = Column(Float)
    avg_processing_time = Column(Float)  # Seconds
    avg_cost_per_file = Column(Float)  # USD
    
    # Test data information
    test_files_count = Column(Integer)
    test_records_count = Column(Integer)
    
    # Timestamps
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Additional metadata
    notes = Column(Text)
    evaluation_method = Column(String(100))
