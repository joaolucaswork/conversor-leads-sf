#!/usr/bin/env python3
"""
Test script for admin authentication flow in production
Tests the complete admin authentication chain:
1. Admin token authentication
2. Session verification  
3. Admin endpoint access
"""

import requests
import json
import os
import sys

def test_admin_auth_flow():
    """Test the complete admin authentication flow"""
    
    # Configuration
    base_url = "https://ia.reinocapital.com.br"  # Your Heroku app URL
    admin_token = os.getenv("ADMIN_ACCESS_TOKEN", "test-admin-token")
    
    print("🔐 Testing Admin Authentication Flow")
    print("=" * 50)
    print(f"🌐 Base URL: {base_url}")
    print(f"🔑 Admin Token: {admin_token[:8]}..." if admin_token else "❌ No admin token")
    print()
    
    # Step 1: Test admin authentication endpoint
    print("📋 Step 1: Testing Admin Authentication")
    print("-" * 30)
    
    auth_url = f"{base_url}/api/v1/admin/authenticate"
    auth_payload = {
        "admin_token": admin_token
    }
    
    # We need a valid Salesforce token for the backend auth
    # For testing, we'll use a dummy token
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer dummy-salesforce-token"
    }
    
    try:
        print(f"🚀 POST {auth_url}")
        auth_response = requests.post(auth_url, json=auth_payload, headers=headers, timeout=10)
        
        print(f"📊 Status: {auth_response.status_code}")
        
        if auth_response.status_code == 200:
            auth_data = auth_response.json()
            session_token = auth_data.get("session_token")
            print(f"✅ Authentication successful!")
            print(f"🎫 Session token: {session_token[:16]}..." if session_token else "❌ No session token")
            
            # Step 2: Test session verification
            print("\n📋 Step 2: Testing Session Verification")
            print("-" * 30)
            
            verify_url = f"{base_url}/api/v1/admin/verify"
            verify_headers = {
                **headers,
                "X-Admin-Token": session_token or admin_token
            }
            
            print(f"🚀 GET {verify_url}")
            verify_response = requests.get(verify_url, headers=verify_headers, timeout=10)
            
            print(f"📊 Status: {verify_response.status_code}")
            
            if verify_response.status_code == 200:
                print("✅ Session verification successful!")
                
                # Step 3: Test admin endpoint access
                print("\n📋 Step 3: Testing Admin Endpoint Access")
                print("-" * 30)
                
                admin_endpoints = [
                    "/api/v1/training/summary",
                    "/api/v1/training/recommendations", 
                    "/api/v1/training/field-patterns"
                ]
                
                for endpoint in admin_endpoints:
                    test_url = f"{base_url}{endpoint}"
                    print(f"🚀 GET {test_url}")
                    
                    try:
                        endpoint_response = requests.get(test_url, headers=verify_headers, timeout=10)
                        print(f"📊 Status: {endpoint_response.status_code}")
                        
                        if endpoint_response.status_code == 200:
                            print(f"✅ {endpoint} - Success")
                        elif endpoint_response.status_code == 401:
                            print(f"🔐 {endpoint} - Authentication required (401)")
                        elif endpoint_response.status_code == 403:
                            print(f"🚫 {endpoint} - Access forbidden (403)")
                        else:
                            print(f"⚠️ {endpoint} - Unexpected status: {endpoint_response.status_code}")
                            
                    except requests.exceptions.RequestException as e:
                        print(f"❌ {endpoint} - Request failed: {e}")
                    
                    print()
                
            else:
                print(f"❌ Session verification failed: {verify_response.status_code}")
                try:
                    error_data = verify_response.json()
                    print(f"📄 Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"📄 Error: {verify_response.text}")
                    
        else:
            print(f"❌ Authentication failed: {auth_response.status_code}")
            try:
                error_data = auth_response.json()
                print(f"📄 Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"📄 Error: {auth_response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Admin Authentication Flow Test Complete")

def test_environment_variables():
    """Test if required environment variables are set"""
    print("🔧 Testing Environment Variables")
    print("-" * 30)
    
    required_vars = [
        "ADMIN_ACCESS_TOKEN",
        "NODE_ENV", 
        "PYTHON_ENV",
        "PORT"
    ]
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            display_value = value[:8] + "..." if len(value) > 8 else value
            print(f"✅ {var}: {display_value}")
        else:
            print(f"❌ {var}: Not set")
    
    print()

if __name__ == "__main__":
    print("🧪 Admin Authentication Test Suite")
    print("=" * 50)
    
    # Test environment variables first
    test_environment_variables()
    
    # Test the authentication flow
    test_admin_auth_flow()
    
    print("\n💡 Troubleshooting Tips:")
    print("- Ensure ADMIN_ACCESS_TOKEN is set in Heroku config")
    print("- Check Heroku logs: heroku logs --tail")
    print("- Verify backend is running: heroku ps")
    print("- Test basic connectivity: curl https://ia.reinocapital.com.br/health")
