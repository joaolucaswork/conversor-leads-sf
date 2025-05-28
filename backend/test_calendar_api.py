#!/usr/bin/env python3
"""
Test script to debug the calendar API 422 error
"""
import requests
import json
from datetime import datetime

def test_calendar_api():
    """Test the calendar API with different data formats"""
    
    base_url = "http://localhost:8001/api/v1/calendar"
    
    # Test 1: Correct backend format
    print("🧪 Test 1: Correct backend format")
    test_data_1 = {
        "request": {
            "subject": "Test Event 1",
            "description": "Test description",
            "start_datetime": "2024-01-15T10:00:00",
            "end_datetime": "2024-01-15T11:00:00",
            "is_all_day": False,
            "location": "Test location",
            "event_type": "Event",  # Backend format
            "status": "Planned",    # Backend format
            "is_reminder_set": False,
            "reminder_minutes": None,
            "account_id": None,
            "contact_id": None,
            "lead_id": None,
            "opportunity_id": None
        },
        "auth": {
            "access_token": "test_token",
            "instance_url": "https://test.salesforce.com"
        }
    }
    
    try:
        response = requests.post(f"{base_url}/events/create", json=test_data_1, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 422:
            print(f"   Error: {response.text}")
        else:
            print(f"   ✅ Success: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 2: Frontend format (should fail without transformation)
    print("🧪 Test 2: Frontend format (should fail)")
    test_data_2 = {
        "request": {
            "subject": "Test Event 2",
            "description": "Test description",
            "start_datetime": "2024-01-15T10:00:00",
            "end_datetime": "2024-01-15T11:00:00",
            "is_all_day": False,
            "location": "Test location",
            "event_type": "event",    # Frontend format (lowercase)
            "status": "planned",      # Frontend format (lowercase)
            "is_reminder_set": False,
            "reminder_minutes": None,
            "account_id": None,
            "contact_id": None,
            "lead_id": None,
            "opportunity_id": None
        },
        "auth": {
            "access_token": "test_token",
            "instance_url": "https://test.salesforce.com"
        }
    }
    
    try:
        response = requests.post(f"{base_url}/events/create", json=test_data_2, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 422:
            print(f"   Expected 422 error: {response.text}")
        else:
            print(f"   Unexpected success: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 3: Missing required fields
    print("🧪 Test 3: Missing required fields")
    test_data_3 = {
        "request": {
            "subject": "",  # Empty subject should fail
            "start_datetime": "2024-01-15T10:00:00",
            "end_datetime": "2024-01-15T11:00:00",
            "event_type": "Event",
            "status": "Planned"
        },
        "auth": {
            "access_token": "test_token",
            "instance_url": "https://test.salesforce.com"
        }
    }
    
    try:
        response = requests.post(f"{base_url}/events/create", json=test_data_3, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 422:
            print(f"   Expected validation error: {response.text}")
        else:
            print(f"   Unexpected success: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    test_calendar_api()
