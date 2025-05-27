#!/usr/bin/env python3
"""
Simple test script to verify the API is working correctly
"""

import requests
import json

def test_api():
    base_url = "http://localhost:8000"
    headers = {"Authorization": "Bearer test-token"}
    
    print("Testing API endpoints...")
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/api/v1/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"Health data: {response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
    
    # Test processing history
    try:
        response = requests.get(f"{base_url}/api/v1/leads/history", headers=headers)
        print(f"Processing history: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"History data: {json.dumps(data, indent=2)}")
            print(f"Number of history items: {len(data.get('history', []))}")
            
            # Check for completed files with outputPath
            completed_files = [item for item in data.get('history', []) 
                             if item.get('status') == 'completed' and item.get('outputPath')]
            print(f"Completed files with outputPath: {len(completed_files)}")
            for file in completed_files:
                print(f"  - {file.get('fileName')}: {file.get('outputPath')}")
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Processing history failed: {e}")

if __name__ == "__main__":
    test_api()
