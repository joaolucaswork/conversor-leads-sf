#!/usr/bin/env python3
"""
Script to test admin dashboard API endpoints and identify why the frontend
is not showing files and statistics.
"""

import requests
import json
import os
from datetime import datetime

def test_admin_endpoints():
    """Test admin API endpoints to identify the issue."""
    
    print("🔍 Testing Admin Dashboard API Endpoints")
    print("=" * 50)
    
    # Base URL for your Heroku app
    base_url = "https://ia.reinocapital.com.br/api/v1"
    
    # Test endpoints
    endpoints = [
        ("/training/summary", "Training Data Summary"),
        ("/training/recommendations", "Improvement Recommendations"),
        ("/training/field-patterns", "Field Mapping Patterns"),
        ("/leads/history?page=1&limit=10", "Processing History"),
        ("/admin/verify", "Admin Verification")
    ]
    
    print("📋 Testing endpoints without authentication:")
    print("-" * 40)
    
    for endpoint, description in endpoints:
        url = f"{base_url}{endpoint}"
        try:
            response = requests.get(url, timeout=10)
            print(f"🌐 {description}:")
            print(f"   URL: {endpoint}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                print(f"   ✅ Correctly requires authentication")
            elif response.status_code == 403:
                print(f"   ⚠️  Forbidden - admin access required")
            elif response.status_code == 200:
                print(f"   ⚠️  Unexpectedly accessible without auth")
                try:
                    data = response.json()
                    print(f"   📊 Data preview: {str(data)[:100]}...")
                except:
                    print(f"   📄 Response: {response.text[:100]}...")
            else:
                print(f"   ❌ Unexpected status: {response.status_code}")
                print(f"   📄 Response: {response.text[:100]}...")
            
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")
        
        print()

def test_with_mock_auth():
    """Test endpoints with mock authentication headers."""
    
    print("🔐 Testing with Mock Authentication Headers:")
    print("-" * 40)
    
    base_url = "https://ia.reinocapital.com.br/api/v1"
    
    # Mock headers (these won't work but will show auth flow)
    headers = {
        'Authorization': 'Bearer mock_token',
        'X-Admin-Token': 'mock_admin_token',
        'Content-Type': 'application/json'
    }
    
    endpoints = [
        ("/training/summary", "Training Data Summary"),
        ("/leads/history?page=1&limit=10", "Processing History")
    ]
    
    for endpoint, description in endpoints:
        url = f"{base_url}{endpoint}"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            print(f"🌐 {description}:")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                print(f"   ✅ Authentication required (expected)")
            elif response.status_code == 403:
                print(f"   ✅ Admin access required (expected)")
            elif response.status_code == 200:
                print(f"   ⚠️  Unexpectedly successful")
            else:
                print(f"   ❌ Unexpected status")
            
            # Show error details
            try:
                error_data = response.json()
                print(f"   📄 Error: {error_data.get('detail', 'No detail')}")
            except:
                print(f"   📄 Response: {response.text[:100]}...")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")
        
        print()

def check_environment_config():
    """Check if admin authentication is properly configured."""
    
    print("⚙️  Environment Configuration Check:")
    print("-" * 40)
    
    # Check if we can determine the admin token requirement
    base_url = "https://ia.reinocapital.com.br/api/v1"
    
    try:
        # Test admin authenticate endpoint
        auth_url = f"{base_url}/admin/authenticate"
        response = requests.post(auth_url, 
                               json={"admin_token": "test"}, 
                               headers={'Authorization': 'Bearer test'},
                               timeout=10)
        
        print(f"🔐 Admin Authentication Endpoint:")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 401:
            try:
                error_data = response.json()
                detail = error_data.get('detail', '')
                if 'not configured' in detail.lower():
                    print(f"   ❌ Admin authentication not configured")
                    print(f"   💡 Need to set ADMIN_ACCESS_TOKEN environment variable")
                else:
                    print(f"   ✅ Admin authentication configured")
                    print(f"   📄 Error: {detail}")
            except:
                print(f"   ⚠️  Unexpected response format")
        elif response.status_code == 500:
            print(f"   ❌ Server error - admin auth may not be configured")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Cannot reach admin auth endpoint: {e}")
    
    print()

def analyze_frontend_backend_mismatch():
    """Analyze potential frontend-backend integration issues."""
    
    print("🔍 Frontend-Backend Integration Analysis:")
    print("-" * 40)
    
    issues = []
    
    # Check if the admin dashboard is accessible
    try:
        admin_page_url = "https://ia.reinocapital.com.br/admin"
        response = requests.get(admin_page_url, timeout=10)
        
        if response.status_code == 200:
            print("✅ Admin dashboard page is accessible")
        else:
            print(f"❌ Admin dashboard page returns {response.status_code}")
            issues.append("Admin dashboard page not accessible")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot reach admin dashboard page: {e}")
        issues.append("Admin dashboard page unreachable")
    
    # Check API base path
    print(f"\n📡 API Endpoint Analysis:")
    print(f"   Expected base: https://ia.reinocapital.com.br/api/v1")
    print(f"   Admin endpoints require both:")
    print(f"   - Salesforce authentication (Bearer token)")
    print(f"   - Admin authentication (X-Admin-Token header)")
    
    # Common issues
    print(f"\n🔧 Common Issues to Check:")
    print(f"   1. ADMIN_ACCESS_TOKEN environment variable not set")
    print(f"   2. Frontend not sending admin token in headers")
    print(f"   3. Database connection issues preventing data retrieval")
    print(f"   4. Admin authentication component not working")
    print(f"   5. CORS issues preventing API calls")
    
    if issues:
        print(f"\n❌ Issues Found:")
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
    else:
        print(f"\n✅ No obvious issues detected")

def provide_troubleshooting_steps():
    """Provide specific troubleshooting steps."""
    
    print("\n🛠️  Troubleshooting Steps:")
    print("=" * 50)
    
    steps = [
        "1. Check Heroku environment variables:",
        "   heroku config --app ia-reinocapital | grep ADMIN",
        "",
        "2. Set admin access token if missing:",
        "   heroku config:set ADMIN_ACCESS_TOKEN=your_secure_token --app ia-reinocapital",
        "",
        "3. Check recent Heroku logs for admin-related errors:",
        "   heroku logs --tail --app ia-reinocapital | grep -i admin",
        "",
        "4. Test admin authentication manually:",
        "   - Go to https://ia.reinocapital.com.br/admin",
        "   - Check browser console for JavaScript errors",
        "   - Check Network tab for failed API requests",
        "",
        "5. Verify database has training data:",
        "   heroku pg:psql --app ia-reinocapital",
        "   SELECT COUNT(*) FROM processing_jobs;",
        "   SELECT COUNT(*) FROM field_mappings;",
        "",
        "6. Check if admin endpoints work with proper auth:",
        "   - Use browser dev tools to copy working auth headers",
        "   - Test API endpoints directly with curl/Postman"
    ]
    
    for step in steps:
        print(step)

def main():
    """Main testing function."""
    
    print("🚀 Admin Dashboard Issue Diagnosis")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Target: https://ia.reinocapital.com.br")
    print()
    
    # Run all tests
    test_admin_endpoints()
    test_with_mock_auth()
    check_environment_config()
    analyze_frontend_backend_mismatch()
    provide_troubleshooting_steps()
    
    print("\n" + "=" * 50)
    print("📋 Summary:")
    print("The admin dashboard is not showing data because:")
    print("1. API endpoints require both Salesforce + Admin authentication")
    print("2. Frontend may not be sending admin tokens properly")
    print("3. ADMIN_ACCESS_TOKEN may not be configured in Heroku")
    print("4. Database may not have the expected training data")
    print()
    print("Next steps: Check Heroku config and browser console errors")

if __name__ == "__main__":
    main()
