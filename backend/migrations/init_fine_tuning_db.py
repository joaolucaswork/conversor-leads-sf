#!/usr/bin/env python3
"""
Database initialization script for fine-tuning system
Creates all necessary tables for training data collection
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))
sys.path.append(str(project_root / "backend"))

def init_database():
    """Initialize the fine-tuning database"""
    try:
        print("[INFO] Initializing fine-tuning database...")

        # Import database components
        from models.database import init_db, check_db_connection, engine
        from models.training_data import Base

        # Check database connection
        if not check_db_connection():
            print("[ERROR] Database connection failed")
            return False

        # Check if tables already exist
        from sqlalchemy import inspect
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        expected_tables = [
            'processing_jobs',
            'field_mappings',
            'user_corrections',
            'file_uploads',
            'training_datasets',
            'model_performance'
        ]

        # Check if all tables already exist
        missing_tables = [table for table in expected_tables if table not in existing_tables]

        if not missing_tables:
            print("[INFO] All fine-tuning tables already exist. Skipping initialization.")
            return True

        print(f"[INFO] Creating missing tables: {missing_tables}")

        # Create all tables
        print("[INFO] Creating database tables...")
        Base.metadata.create_all(bind=engine)

        # Verify tables were created
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        created_tables = [table for table in expected_tables if table in tables]

        print(f"[SUCCESS] Created {len(created_tables)} tables:")
        for table in created_tables:
            print(f"  ✓ {table}")

        if len(created_tables) == len(expected_tables):
            print("[SUCCESS] All fine-tuning tables created successfully!")
            return True
        else:
            missing_tables = set(expected_tables) - set(created_tables)
            print(f"[WARNING] Missing tables: {missing_tables}")
            return False

    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
        return False

def check_database_status():
    """Check the current status of the database"""
    try:
        from models.database import check_db_connection, engine
        from sqlalchemy import inspect, text

        if not check_db_connection():
            print("[ERROR] Cannot connect to database")
            return False

        inspector = inspect(engine)
        tables = inspector.get_table_names()

        print(f"[INFO] Database connection successful")
        print(f"[INFO] Found {len(tables)} tables in database:")

        for table in sorted(tables):
            print(f"  • {table}")

        # Check if fine-tuning tables exist
        fine_tuning_tables = [
            'processing_jobs', 'field_mappings', 'user_corrections',
            'file_uploads', 'training_datasets', 'model_performance'
        ]

        existing_ft_tables = [t for t in fine_tuning_tables if t in tables]

        if existing_ft_tables:
            print(f"\n[INFO] Fine-tuning tables found: {len(existing_ft_tables)}/{len(fine_tuning_tables)}")
            for table in existing_ft_tables:
                print(f"  ✓ {table}")
        else:
            print("\n[INFO] No fine-tuning tables found")

        return True

    except Exception as e:
        print(f"[ERROR] Database status check failed: {e}")
        return False

def main():
    """Main function"""
    import argparse

    parser = argparse.ArgumentParser(description="Fine-tuning database management")
    parser.add_argument("--init", action="store_true", help="Initialize database tables")
    parser.add_argument("--status", action="store_true", help="Check database status")
    parser.add_argument("--force", action="store_true", help="Force initialization (recreate tables)")

    args = parser.parse_args()

    if args.status:
        print("🔍 Checking database status...")
        check_database_status()
    elif args.init:
        print("🚀 Initializing fine-tuning database...")
        if args.force:
            print("⚠️  Force mode: Will recreate existing tables")

        success = init_database()
        if success:
            print("✅ Database initialization completed successfully!")
        else:
            print("❌ Database initialization failed!")
            sys.exit(1)
    else:
        print("Fine-tuning Database Management")
        print("Usage:")
        print("  python init_fine_tuning_db.py --status   # Check database status")
        print("  python init_fine_tuning_db.py --init     # Initialize database")
        print("  python init_fine_tuning_db.py --init --force  # Force recreate tables")

if __name__ == "__main__":
    main()
