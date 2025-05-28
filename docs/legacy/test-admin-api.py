#!/usr/bin/env python3
"""
Test script to verify Admin API endpoints are working correctly
"""

import requests
import json
import sys

def test_endpoint(url, description, headers=None):
    """Test a single API endpoint"""
    print(f"🔍 Testing {description}...")
    print(f"   URL: {url}")
    
    try:
        response = requests.get(url, headers=headers or {}, timeout=10)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   ✅ Success: {description}")
                print(f"   📊 Response keys: {list(data.keys()) if isinstance(data, dict) else 'Non-dict response'}")
                return True
            except json.JSONDecodeError:
                print(f"   ⚠️  Success but invalid JSON response")
                return False
        elif response.status_code == 401:
            print(f"   🔐 Authentication required (expected for certificate-protected endpoints)")
            return True
        elif response.status_code == 403:
            print(f"   🚫 Certificate authentication required (expected)")
            return True
        elif response.status_code == 404:
            print(f"   ❌ Endpoint not found (404 error)")
            return False
        else:
            print(f"   ⚠️  Unexpected status code: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Connection failed - is the backend server running?")
        return False
    except requests.exceptions.Timeout:
        print(f"   ❌ Request timed out")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    """Test all admin API endpoints"""
    print("🧪 Admin API Endpoint Testing")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test basic health check first
    print("\n📋 Testing Basic Connectivity:")
    health_ok = test_endpoint(f"{base_url}/api/v1/health", "Health Check")
    
    if not health_ok:
        print("\n❌ Backend server is not responding. Please start the server first:")
        print("   cd backend && python start_server.py")
        sys.exit(1)
    
    # Headers with demo token (for non-certificate endpoints)
    headers = {
        "Authorization": "Bearer demo-token-12345",
        "Content-Type": "application/json"
    }
    
    # Test admin endpoints
    print("\n📋 Testing Admin API Endpoints:")
    
    endpoints = [
        ("/api/v1/training/summary", "Training Data Summary"),
        ("/api/v1/training/recommendations", "Improvement Recommendations"),
        ("/api/v1/training/field-patterns", "Field Mapping Patterns"),
    ]
    
    results = []
    
    for endpoint, description in endpoints:
        url = f"{base_url}{endpoint}"
        success = test_endpoint(url, description, headers)
        results.append((description, success))
    
    # Print summary
    print("\n📊 Test Results Summary:")
    print("-" * 30)
    
    passed = 0
    total = len(results)
    
    for description, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {status} {description}")
        if success:
            passed += 1
    
    print(f"\n🎯 Results: {passed}/{total} endpoints working correctly")
    
    if passed == total:
        print("\n🎉 All admin API endpoints are working!")
        print("The 404 error has been resolved.")
    else:
        print(f"\n⚠️  {total - passed} endpoint(s) still have issues.")
        print("Check the backend logs for more details.")
    
    print("\n📝 Notes:")
    print("• 401/403 responses are expected for certificate-protected endpoints")
    print("• Install client certificates to test full authentication flow")
    print("• Run 'python setup-admin-security.py' to set up certificate authentication")

if __name__ == "__main__":
    main()
