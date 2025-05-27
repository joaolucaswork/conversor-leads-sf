#!/usr/bin/env python3
"""
Simple automatic migration script for Heroku release phase
No emojis or special characters for maximum compatibility
"""

import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))
sys.path.append(str(project_root / "backend"))

def safe_database_init():
    """
    Safely initialize database with comprehensive error handling
    """
    try:
        print("[AUTO-MIGRATE] Starting automatic database migration...")
        
        # Check if we're in Heroku environment
        is_heroku = os.getenv('DYNO') is not None
        database_url = os.getenv('DATABASE_URL')
        
        if is_heroku:
            print("[AUTO-MIGRATE] Detected Heroku environment")
        else:
            print("[AUTO-MIGRATE] Detected local environment")
        
        if not database_url:
            print("[AUTO-MIGRATE] No DATABASE_URL found, skipping migration")
            return True  # Don't fail deployment for missing DB in development
        
        print("[AUTO-MIGRATE] Database URL configured")
        
        # Import database components with error handling
        try:
            from models.database import check_db_connection, engine
            from models.training_data import Base
        except ImportError as e:
            print(f"[AUTO-MIGRATE] Database modules not available: {e}")
            print("[AUTO-MIGRATE] Skipping migration (modules not ready)")
            return True  # Don't fail deployment
        
        # Test database connection
        print("[AUTO-MIGRATE] Testing database connection...")
        if not check_db_connection():
            print("[AUTO-MIGRATE] Database connection failed")
            if is_heroku:
                print("[AUTO-MIGRATE] Retrying in 5 seconds...")
                import time
                time.sleep(5)
                if not check_db_connection():
                    print("[AUTO-MIGRATE] Database still not available")
                    return False
            else:
                return False
        
        print("[AUTO-MIGRATE] Database connection successful")
        
        # Check existing tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        print(f"[AUTO-MIGRATE] Found {len(existing_tables)} existing tables")
        
        # Define expected tables
        expected_tables = [
            'processing_jobs',
            'field_mappings', 
            'user_corrections',
            'file_uploads',
            'training_datasets',
            'model_performance'
        ]
        
        # Check which tables are missing
        missing_tables = [table for table in expected_tables if table not in existing_tables]
        
        if not missing_tables:
            print("[AUTO-MIGRATE] All fine-tuning tables already exist")
            print("[AUTO-MIGRATE] Migration completed successfully (no changes needed)")
            return True
        
        print(f"[AUTO-MIGRATE] Creating {len(missing_tables)} missing tables")
        for table in missing_tables:
            print(f"[AUTO-MIGRATE]   - {table}")
        
        # Create missing tables
        try:
            Base.metadata.create_all(bind=engine)
            print("[AUTO-MIGRATE] Tables created successfully")
        except Exception as e:
            print(f"[AUTO-MIGRATE] Failed to create tables: {e}")
            return False
        
        # Verify tables were created
        inspector = inspect(engine)
        updated_tables = inspector.get_table_names()
        
        created_tables = [table for table in expected_tables if table in updated_tables and table not in existing_tables]
        
        if created_tables:
            print(f"[AUTO-MIGRATE] Successfully created {len(created_tables)} tables")
            for table in created_tables:
                print(f"[AUTO-MIGRATE]   + {table}")
        
        # Final verification
        all_present = all(table in updated_tables for table in expected_tables)
        
        if all_present:
            print("[AUTO-MIGRATE] Migration completed successfully!")
            print(f"[AUTO-MIGRATE] Database now has {len(updated_tables)} total tables")
            return True
        else:
            missing_after = [table for table in expected_tables if table not in updated_tables]
            print(f"[AUTO-MIGRATE] Some tables still missing: {missing_after}")
            return False
            
    except Exception as e:
        print(f"[AUTO-MIGRATE] Unexpected error during migration: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function for automatic migration"""
    print("=" * 60)
    print("HEROKU RELEASE PHASE - DATABASE MIGRATION")
    print("=" * 60)
    
    # Set environment for migration
    os.environ.setdefault('PYTHON_ENV', 'production')
    
    success = safe_database_init()
    
    if success:
        print("")
        print("[AUTO-MIGRATE] Database migration completed successfully!")
        print("[AUTO-MIGRATE] Application is ready to start")
        sys.exit(0)
    else:
        print("")
        print("[AUTO-MIGRATE] Database migration failed!")
        print("[AUTO-MIGRATE] Deployment will be aborted")
        sys.exit(1)

if __name__ == "__main__":
    main()
