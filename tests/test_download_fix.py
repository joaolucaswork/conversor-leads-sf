#!/usr/bin/env python3
"""
Test script to verify that the download functionality returns CSV files
with correct filenames regardless of the original file format.
"""

import requests
import json
import time
import os
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_TOKEN = "test-token-123"  # Using the test token from the backend

def test_download_fix():
    """Test that XLSX uploads result in CSV downloads with correct filenames."""
    
    print("🧪 Testing Download Fix - XLSX to CSV Conversion")
    print("=" * 60)
    
    # Test file path
    test_file = Path("data/input/lead-planilha-teste.xlsx")
    
    if not test_file.exists():
        print(f"❌ Test file not found: {test_file}")
        return False
    
    print(f"📁 Using test file: {test_file}")
    
    # Step 1: Upload the XLSX file
    print("\n📤 Step 1: Uploading XLSX file...")
    
    with open(test_file, 'rb') as f:
        files = {'file': (test_file.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        data = {
            'useAiEnhancement': 'false',  # Use traditional processing for faster testing
        }
        headers = {'Authorization': f'Bearer {TEST_TOKEN}'}
        
        response = requests.post(f"{BASE_URL}/leads/upload", files=files, data=data, headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Upload failed: {response.status_code} - {response.text}")
        return False
    
    upload_result = response.json()
    processing_id = upload_result['processingId']
    print(f"✅ Upload successful! Processing ID: {processing_id}")
    
    # Step 2: Wait for processing to complete
    print("\n⏳ Step 2: Waiting for processing to complete...")
    
    max_wait = 30  # seconds
    wait_time = 0
    
    while wait_time < max_wait:
        headers = {'Authorization': f'Bearer {TEST_TOKEN}'}
        status_response = requests.get(f"{BASE_URL}/leads/status/{processing_id}", headers=headers)
        
        if status_response.status_code != 200:
            print(f"❌ Status check failed: {status_response.status_code}")
            return False
        
        status_data = status_response.json()
        status = status_data['status']
        progress = status_data.get('progress', 0)
        
        print(f"   Status: {status} ({progress}%)")
        
        if status == 'completed':
            print("✅ Processing completed!")
            break
        elif status == 'failed':
            print(f"❌ Processing failed: {status_data.get('message', 'Unknown error')}")
            return False
        
        time.sleep(2)
        wait_time += 2
    
    if wait_time >= max_wait:
        print("❌ Processing timed out")
        return False
    
    # Step 3: Test the download endpoint
    print("\n📥 Step 3: Testing download endpoint...")
    
    result_url = status_data.get('resultUrl')
    if not result_url:
        print("❌ No result URL found")
        return False
    
    print(f"   Download URL: {result_url}")
    
    # Make download request
    headers = {'Authorization': f'Bearer {TEST_TOKEN}'}
    download_response = requests.get(f"{BASE_URL}{result_url}", headers=headers)
    
    if download_response.status_code != 200:
        print(f"❌ Download failed: {download_response.status_code}")
        return False
    
    # Step 4: Verify the response headers and content
    print("\n🔍 Step 4: Verifying download response...")
    
    # Check Content-Type
    content_type = download_response.headers.get('content-type', '')
    print(f"   Content-Type: {content_type}")
    
    if 'text/csv' not in content_type:
        print(f"❌ Expected CSV content type, got: {content_type}")
        return False
    
    # Check Content-Disposition header for filename
    content_disposition = download_response.headers.get('content-disposition', '')
    print(f"   Content-Disposition: {content_disposition}")
    
    if 'filename=' not in content_disposition:
        print("❌ No filename in Content-Disposition header")
        return False
    
    # Extract filename
    import re
    filename_match = re.search(r'filename="?([^"]+)"?', content_disposition)
    if not filename_match:
        print("❌ Could not extract filename from Content-Disposition")
        return False
    
    filename = filename_match.group(1)
    print(f"   Downloaded filename: {filename}")
    
    # Verify filename has .csv extension
    if not filename.endswith('.csv'):
        print(f"❌ Expected .csv extension, got: {filename}")
        return False
    
    # Verify filename doesn't have .xlsx extension
    if '.xlsx' in filename:
        print(f"❌ Filename still contains .xlsx: {filename}")
        return False
    
    # Check that content is actually CSV
    content = download_response.text
    lines = content.strip().split('\n')
    
    if len(lines) < 1:
        print("❌ Downloaded content is empty")
        return False
    
    # Check first line looks like CSV headers
    first_line = lines[0]
    print(f"   First line: {first_line[:100]}...")
    
    if ',' not in first_line:
        print("❌ First line doesn't look like CSV (no commas)")
        return False
    
    # Expected CSV headers for processed leads
    expected_headers = ['Last Name', 'Phone', 'Email']
    if not any(header in first_line for header in expected_headers):
        print(f"❌ CSV headers don't match expected format. Got: {first_line}")
        return False
    
    print("✅ All checks passed!")
    print(f"\n📊 Summary:")
    print(f"   Original file: {test_file.name} (XLSX)")
    print(f"   Downloaded file: {filename} (CSV)")
    print(f"   Content-Type: {content_type}")
    print(f"   Content lines: {len(lines)}")
    
    return True

if __name__ == "__main__":
    try:
        success = test_download_fix()
        if success:
            print("\n🎉 TEST PASSED: Download fix is working correctly!")
            exit(0)
        else:
            print("\n💥 TEST FAILED: Download fix needs more work")
            exit(1)
    except Exception as e:
        print(f"\n💥 TEST ERROR: {e}")
        exit(1)
