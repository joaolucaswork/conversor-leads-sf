"""
Database configuration and connection management
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator

# Database URL from environment variable (Heroku sets DATABASE_URL)
DATABASE_URL = os.getenv("DATABASE_URL")

# Handle Heroku's postgres:// URL format (needs to be postgresql://)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Fallback for local development
if not DATABASE_URL:
    DATABASE_URL = "postgresql://localhost/leads_processing_dev"
    print("[WARNING] DATABASE_URL not found, using local development database")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,    # Recycle connections every 5 minutes
    echo=False           # Set to True for SQL debugging
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

def get_db() -> Generator:
    """
    Dependency to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database tables
    """
    try:
        Base.metadata.create_all(bind=engine)
        print("[SUCCESS] Database tables created successfully")
    except Exception as e:
        print(f"[ERROR] Failed to create database tables: {e}")
        raise

def check_db_connection():
    """
    Check if database connection is working
    """
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        print("[SUCCESS] Database connection verified")
        return True
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        return False
