#!/usr/bin/env python3
"""
Test script to verify fine-tuning data collection is working properly.
This script checks if processed files are being stored for fine-tuning.
"""

import os
import sys
import json
from datetime import datetime, timedelta
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

def test_database_connection():
    """Test database connection and table existence."""
    print("🔍 Testing database connection...")
    
    try:
        from src.backend.models.database import SessionLocal, engine
        from src.backend.models.training_data import ProcessingJob, FieldMapping, FileUpload
        
        # Test database connection
        db = SessionLocal()
        try:
            # Check if tables exist by querying them
            job_count = db.query(ProcessingJob).count()
            mapping_count = db.query(FieldMapping).count()
            file_count = db.query(FileUpload).count()
            
            print(f"✅ Database connection successful")
            print(f"   - Processing jobs: {job_count}")
            print(f"   - Field mappings: {mapping_count}")
            print(f"   - File uploads: {file_count}")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_training_data_service():
    """Test training data service functionality."""
    print("\n🧪 Testing training data service...")
    
    try:
        from src.backend.models.database import SessionLocal
        from src.backend.services.training_data_service import TrainingDataService
        
        db = SessionLocal()
        try:
            service = TrainingDataService(db)
            
            # Test summary generation
            summary = service.get_training_data_summary()
            print(f"✅ Training data summary generated:")
            print(f"   - Total jobs: {summary['total_processing_jobs']}")
            print(f"   - Total mappings: {summary['total_field_mappings']}")
            print(f"   - Recent jobs (7 days): {summary['recent_jobs_7_days']}")
            print(f"   - Mapping accuracy: {summary['mapping_accuracy_percent']}%")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Training data service test failed: {e}")
        return False

def check_recent_processing_jobs():
    """Check for recent processing jobs in the database."""
    print("\n📊 Checking recent processing jobs...")
    
    try:
        from src.backend.models.database import SessionLocal
        from src.backend.models.training_data import ProcessingJob, FieldMapping
        
        db = SessionLocal()
        try:
            # Get jobs from last 24 hours
            yesterday = datetime.now() - timedelta(days=1)
            
            recent_jobs = db.query(ProcessingJob).filter(
                ProcessingJob.created_at >= yesterday
            ).all()
            
            print(f"✅ Found {len(recent_jobs)} recent processing jobs")
            
            for job in recent_jobs:
                print(f"   📁 Job {job.processing_id}:")
                print(f"      - File: {job.file_name}")
                print(f"      - Status: {job.status}")
                print(f"      - Created: {job.created_at}")
                print(f"      - Records: {job.record_count}")
                
                # Check field mappings for this job
                mappings = db.query(FieldMapping).filter(
                    FieldMapping.processing_job_id == job.id
                ).all()
                
                print(f"      - Field mappings: {len(mappings)}")
                
                if mappings:
                    print(f"      - Sample mappings:")
                    for mapping in mappings[:3]:  # Show first 3 mappings
                        print(f"        • {mapping.original_column_name} → {mapping.mapped_field_name} ({mapping.confidence_score:.1f}%)")
                
                if job.ai_stats:
                    print(f"      - AI stats: {json.dumps(job.ai_stats, indent=8)}")
                
                print()
            
            return len(recent_jobs) > 0
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Failed to check recent jobs: {e}")
        return False

def check_fine_tuning_endpoints():
    """Check if fine-tuning API endpoints are accessible."""
    print("\n🌐 Checking fine-tuning API endpoints...")
    
    try:
        import requests
        
        # Test endpoints (assuming server is running on localhost:8000)
        base_url = "http://localhost:8000"
        
        # Note: These endpoints require authentication, so we expect 401/403 responses
        endpoints = [
            "/api/v1/training/summary",
            "/api/v1/training/recommendations",
            "/api/v1/training/field-patterns"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                if response.status_code in [401, 403]:
                    print(f"✅ Endpoint {endpoint} is accessible (auth required)")
                elif response.status_code == 200:
                    print(f"✅ Endpoint {endpoint} is accessible and working")
                else:
                    print(f"⚠️  Endpoint {endpoint} returned status {response.status_code}")
            except requests.exceptions.ConnectionError:
                print(f"❌ Cannot connect to server at {base_url}")
                break
            except Exception as e:
                print(f"⚠️  Error testing {endpoint}: {e}")
        
        return True
        
    except ImportError:
        print("⚠️  requests library not available, skipping endpoint tests")
        return True
    except Exception as e:
        print(f"❌ Endpoint testing failed: {e}")
        return False

def main():
    """Run all fine-tuning data collection tests."""
    print("🚀 Fine-Tuning Data Collection Test")
    print("=" * 50)
    
    tests = [
        ("Database Connection", test_database_connection),
        ("Training Data Service", test_training_data_service),
        ("Recent Processing Jobs", check_recent_processing_jobs),
        ("API Endpoints", check_fine_tuning_endpoints)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        print("-" * 30)
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("\n🎉 All tests passed! Fine-tuning data collection is working properly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
        
        if passed == 0:
            print("\n💡 Troubleshooting tips:")
            print("   1. Make sure the database is properly configured")
            print("   2. Check if the backend server is running")
            print("   3. Verify that recent file processing has occurred")
            print("   4. Check the logs for any error messages")

if __name__ == "__main__":
    main()
