#!/usr/bin/env python3
"""
Comprehensive test script for Admin Panel functionality
Tests both API endpoints and certificate setup
"""

import requests
import json
import sys
import os
from pathlib import Path

def test_api_endpoints():
    """Test all admin API endpoints"""
    print("🧪 Testing Admin API Endpoints")
    print("=" * 40)
    
    base_url = "http://localhost:8000"
    headers = {
        "Authorization": "Bearer demo-token-12345",
        "Content-Type": "application/json"
    }
    
    # Test health check first
    try:
        response = requests.get(f"{base_url}/api/v1/health", timeout=5)
        if response.status_code != 200:
            print("❌ Backend server is not responding")
            return False
        print("✅ Backend server is running")
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to backend server")
        print("   Please start the server: cd backend && python start_server.py")
        return False
    
    # Test admin endpoints
    endpoints = [
        ("/api/v1/training/summary", "Training Data Summary"),
        ("/api/v1/training/recommendations", "Improvement Recommendations"),
        ("/api/v1/training/field-patterns", "Field Mapping Patterns"),
    ]
    
    all_passed = True
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", headers=headers, timeout=10)
            if response.status_code == 200:
                print(f"✅ {description}: Working")
            else:
                print(f"❌ {description}: Status {response.status_code}")
                all_passed = False
        except requests.exceptions.RequestException as e:
            print(f"❌ {description}: Request failed - {e}")
            all_passed = False
    
    return all_passed

def test_certificate_files():
    """Test if certificate files exist"""
    print("\n🔐 Testing Certificate Files")
    print("=" * 40)
    
    cert_files = [
        "certificates/ca.pem",
        "certificates/ca-key.pem", 
        "certificates/client-cert.pem",
        "certificates/client-key.pem",
        "certificates/admin-client.p12"
    ]
    
    all_exist = True
    
    for cert_file in cert_files:
        if Path(cert_file).exists():
            print(f"✅ {cert_file}: Found")
        else:
            print(f"❌ {cert_file}: Missing")
            all_exist = False
    
    # Check public certificate
    public_cert = "public/certificates/admin-client.p12"
    if Path(public_cert).exists():
        print(f"✅ {public_cert}: Available for download")
    else:
        print(f"⚠️  {public_cert}: Not available for download")
    
    return all_exist

def test_frontend_access():
    """Test frontend accessibility"""
    print("\n🌐 Testing Frontend Access")
    print("=" * 40)
    
    # Check if frontend is running
    try:
        response = requests.get("http://localhost:5173", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend server is running")
            
            # Test admin route accessibility
            admin_response = requests.get("http://localhost:5173/admin", timeout=5)
            if admin_response.status_code == 200:
                print("✅ Admin panel route is accessible")
                return True
            else:
                print(f"⚠️  Admin panel returned status: {admin_response.status_code}")
                return False
        else:
            print(f"❌ Frontend server returned status: {response.status_code}")
            return False
    except requests.exceptions.RequestException:
        print("❌ Frontend server is not running")
        print("   Please start the frontend: npm run dev")
        return False

def print_summary(api_ok, certs_ok, frontend_ok):
    """Print test summary and next steps"""
    print("\n📊 Test Summary")
    print("=" * 40)
    
    print(f"API Endpoints: {'✅ PASS' if api_ok else '❌ FAIL'}")
    print(f"Certificates: {'✅ PASS' if certs_ok else '❌ FAIL'}")
    print(f"Frontend Access: {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    
    if api_ok and certs_ok and frontend_ok:
        print("\n🎉 All tests passed! Admin panel is ready to use.")
        print("\n📋 Next Steps:")
        print("1. Install the client certificate (certificates/admin-client.p12)")
        print("2. Password: admin123")
        print("3. Access admin panel: http://localhost:5173/admin")
        print("4. Browser will prompt for certificate selection")
        
    else:
        print("\n⚠️  Some tests failed. Please check the issues above.")
        
        if not api_ok:
            print("• API Issues: Check backend server logs")
        if not certs_ok:
            print("• Certificate Issues: Run 'python generate-certificates-simple.py'")
        if not frontend_ok:
            print("• Frontend Issues: Run 'npm run dev'")

def main():
    """Main test function"""
    print("🔍 Admin Panel Complete Test Suite")
    print("=" * 50)
    print("Testing API endpoints, certificates, and frontend access...")
    
    # Run all tests
    api_ok = test_api_endpoints()
    certs_ok = test_certificate_files()
    frontend_ok = test_frontend_access()
    
    # Print summary
    print_summary(api_ok, certs_ok, frontend_ok)
    
    # Exit with appropriate code
    if api_ok and certs_ok and frontend_ok:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
