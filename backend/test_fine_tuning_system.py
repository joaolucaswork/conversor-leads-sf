#!/usr/bin/env python3
"""
Test script for the fine-tuning system
Verifies database connectivity, API endpoints, and basic functionality
"""

import os
import sys
import json
import requests
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))
sys.path.append(str(project_root / "backend"))

def test_database_connection():
    """Test database connectivity"""
    print("🔍 Testing database connection...")
    
    try:
        from models.database import check_db_connection, SessionLocal
        from models.training_data import ProcessingJob
        
        if not check_db_connection():
            print("❌ Database connection failed")
            return False
        
        # Test basic query
        db = SessionLocal()
        try:
            count = db.query(ProcessingJob).count()
            print(f"✅ Database connected successfully. Found {count} processing jobs.")
            return True
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def test_training_data_service():
    """Test training data service functionality"""
    print("\n🔍 Testing training data service...")
    
    try:
        from models.database import SessionLocal
        from services.training_data_service import TrainingDataService
        
        db = SessionLocal()
        try:
            service = TrainingDataService(db)
            
            # Test summary generation
            summary = service.get_training_data_summary()
            print(f"✅ Training data summary generated:")
            print(f"   - Total jobs: {summary['total_processing_jobs']}")
            print(f"   - Total mappings: {summary['total_field_mappings']}")
            print(f"   - Accuracy: {summary['mapping_accuracy_percent']}%")
            
            # Test pattern analysis
            patterns = service.get_field_mapping_patterns()
            print(f"✅ Field patterns analyzed:")
            print(f"   - Common mappings: {len(patterns['common_mappings'])}")
            print(f"   - Problematic mappings: {len(patterns['problematic_mappings'])}")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Training data service test failed: {e}")
        return False

def test_fine_tuning_service():
    """Test fine-tuning service functionality"""
    print("\n🔍 Testing fine-tuning service...")
    
    try:
        from models.database import SessionLocal
        from services.fine_tuning_service import FineTuningService
        
        db = SessionLocal()
        try:
            service = FineTuningService(db)
            
            # Test recommendations
            recommendations = service.get_improvement_recommendations()
            print(f"✅ Improvement recommendations generated:")
            print(f"   - Recommendations: {len(recommendations['recommendations'])}")
            print(f"   - Problematic fields: {len(recommendations['problematic_fields'])}")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Fine-tuning service test failed: {e}")
        return False

def test_api_endpoints(base_url="http://localhost:8000"):
    """Test API endpoints (requires running server)"""
    print(f"\n🔍 Testing API endpoints at {base_url}...")
    
    # Test endpoints that don't require authentication
    test_endpoints = [
        "/api/v1/health",  # Basic health check
    ]
    
    # Test endpoints that require authentication (mock token)
    auth_endpoints = [
        "/api/v1/training/summary",
        "/api/v1/training/recommendations",
        "/api/v1/training/field-patterns"
    ]
    
    success_count = 0
    total_tests = len(test_endpoints) + len(auth_endpoints)
    
    # Test public endpoints
    for endpoint in test_endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                print(f"✅ {endpoint} - OK")
                success_count += 1
            else:
                print(f"⚠️  {endpoint} - Status {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")
    
    # Test authenticated endpoints (expect 401 without token)
    for endpoint in auth_endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code in [401, 403]:
                print(f"✅ {endpoint} - Authentication required (expected)")
                success_count += 1
            elif response.status_code == 200:
                print(f"✅ {endpoint} - OK (no auth required)")
                success_count += 1
            else:
                print(f"⚠️  {endpoint} - Status {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")
    
    print(f"\n📊 API Tests: {success_count}/{total_tests} passed")
    return success_count == total_tests

def create_sample_training_data():
    """Create sample training data for testing"""
    print("\n🔍 Creating sample training data...")
    
    try:
        from models.database import SessionLocal
        from services.training_data_service import TrainingDataService
        
        db = SessionLocal()
        try:
            service = TrainingDataService(db)
            
            # Create sample processing job
            job = service.create_processing_job(
                processing_id="test_job_001",
                user_id="test_user",
                file_name="sample_leads.xlsx",
                file_path="/tmp/sample_leads.xlsx",
                status="completed",
                record_count=100,
                ai_stats={"confidence_avg": 85.5, "api_calls": 3}
            )
            
            # Create sample field mappings
            sample_mappings = [
                {
                    "original_column": "Nome",
                    "column_index": 0,
                    "sample_data": ["João Silva", "Maria Santos", "Pedro Costa"],
                    "mapped_field": "FirstName",
                    "confidence": 92.5,
                    "method": "ai",
                    "reasoning": "Column contains person names"
                },
                {
                    "original_column": "Email",
                    "column_index": 1,
                    "sample_data": ["joao@email.com", "maria@test.com", "pedro@company.com"],
                    "mapped_field": "Email",
                    "confidence": 98.0,
                    "method": "ai",
                    "reasoning": "Column contains email addresses"
                }
            ]
            
            mappings = service.store_field_mappings(job.id, sample_mappings)
            
            print(f"✅ Created sample training data:")
            print(f"   - Processing job: {job.processing_id}")
            print(f"   - Field mappings: {len(mappings)}")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Sample data creation failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Fine-Tuning System Test Suite")
    print("=" * 50)
    
    tests = [
        ("Database Connection", test_database_connection),
        ("Training Data Service", test_training_data_service),
        ("Fine-Tuning Service", test_fine_tuning_service),
        ("Sample Data Creation", create_sample_training_data),
    ]
    
    # Run database tests
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    # Test API endpoints if server might be running
    if os.getenv("TEST_API_ENDPOINTS", "false").lower() == "true":
        print(f"\n{'='*20} API Endpoints {'='*20}")
        if test_api_endpoints():
            passed += 1
        total += 1
    
    # Summary
    print(f"\n{'='*50}")
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Fine-tuning system is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
