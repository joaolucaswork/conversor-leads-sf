#!/usr/bin/env python3
"""
Test script to verify the calendar integration fixes
"""

import sys
import os
import asyncio
from datetime import datetime, date, timezone
from unittest.mock import Mock, patch

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from calendar_module.services.salesforce_calendar_service import SalesforceCalendarService
from calendar_module.models.event import SalesforceTask, EventStatus


def test_subject_field_handling():
    """Test that None subject fields are handled properly"""
    print("🧪 Testing subject field handling...")
    
    service = SalesforceCalendarService("fake_token", "https://fake.salesforce.com")
    
    # Test case 1: None subject
    record_with_none_subject = {
        'Id': '00TU500000Hsg0YMAR',
        'Subject': None,
        'Description': 'Test task description',
        'Status': 'Not Started',
        'Priority': 'Normal',
        'ActivityDate': None,
        'CreatedDate': '2024-01-15T10:30:00.000Z',
        'LastModifiedDate': '2024-01-15T10:30:00.000Z',
        'IsReminderSet': False,
        'IsClosed': False,
        'IsArchived': False
    }
    
    try:
        task = service._parse_salesforce_task(record_with_none_subject)
        print(f"✅ Successfully parsed task with None subject: '{task.subject}'")
        assert task.subject == "Task 00TU500000Hsg0YMAR"
        assert task.id == "00TU500000Hsg0YMAR"
    except Exception as e:
        print(f"❌ Failed to parse task with None subject: {e}")
        return False
    
    # Test case 2: Empty string subject
    record_with_empty_subject = record_with_none_subject.copy()
    record_with_empty_subject['Subject'] = ''
    
    try:
        task = service._parse_salesforce_task(record_with_empty_subject)
        print(f"✅ Successfully parsed task with empty subject: '{task.subject}'")
        assert task.subject == "Task 00TU500000Hsg0YMAR"
    except Exception as e:
        print(f"❌ Failed to parse task with empty subject: {e}")
        return False
    
    # Test case 3: Whitespace-only subject
    record_with_whitespace_subject = record_with_none_subject.copy()
    record_with_whitespace_subject['Subject'] = '   '
    
    try:
        task = service._parse_salesforce_task(record_with_whitespace_subject)
        print(f"✅ Successfully parsed task with whitespace subject: '{task.subject}'")
        assert task.subject == "Task 00TU500000Hsg0YMAR"
    except Exception as e:
        print(f"❌ Failed to parse task with whitespace subject: {e}")
        return False
    
    # Test case 4: Valid subject
    record_with_valid_subject = record_with_none_subject.copy()
    record_with_valid_subject['Subject'] = 'Valid Task Subject'
    
    try:
        task = service._parse_salesforce_task(record_with_valid_subject)
        print(f"✅ Successfully parsed task with valid subject: '{task.subject}'")
        assert task.subject == "Valid Task Subject"
    except Exception as e:
        print(f"❌ Failed to parse task with valid subject: {e}")
        return False
    
    return True


def test_datetime_timezone_handling():
    """Test that datetime timezone handling works properly"""
    print("\n🧪 Testing datetime timezone handling...")
    
    service = SalesforceCalendarService("fake_token", "https://fake.salesforce.com")
    
    # Test parsing Salesforce datetime strings
    test_cases = [
        ('2024-01-15T10:30:00.000Z', 'UTC with Z suffix'),
        ('2024-01-15T10:30:00.000+00:00', 'UTC with +00:00'),
        ('2024-01-15T10:30:00.000-05:00', 'EST timezone'),
    ]
    
    for datetime_str, description in test_cases:
        try:
            parsed_dt = service._parse_salesforce_datetime(datetime_str)
            print(f"✅ Successfully parsed {description}: {parsed_dt}")
            assert parsed_dt.tzinfo is not None, f"Datetime should be timezone-aware: {parsed_dt}"
        except Exception as e:
            print(f"❌ Failed to parse {description}: {e}")
            return False
    
    # Test timezone comparison in reminder calculation
    print("\n🧪 Testing timezone-aware datetime comparison...")
    
    # Create a mock task with timezone-aware datetimes
    task = SalesforceTask(
        id="test_task",
        subject="Test Task",
        activity_date=date(2024, 1, 15),
        reminder_datetime=datetime(2024, 1, 15, 9, 0, 0, tzinfo=timezone.utc),
        is_reminder_set=True,
        created_date=datetime(2024, 1, 15, 8, 0, 0, tzinfo=timezone.utc)
    )
    
    try:
        calendar_event = service._convert_task_to_calendar_event(task)
        print(f"✅ Successfully converted task to calendar event: {calendar_event.title}")
        print(f"   Start: {calendar_event.start}")
        print(f"   Reminder minutes: {calendar_event.reminder_minutes}")
    except Exception as e:
        print(f"❌ Failed to convert task to calendar event: {e}")
        return False
    
    return True


def test_error_handling():
    """Test error handling for malformed records"""
    print("\n🧪 Testing error handling...")
    
    service = SalesforceCalendarService("fake_token", "https://fake.salesforce.com")
    
    # Test case 1: Missing ID
    record_without_id = {
        'Subject': 'Test Task',
        'Description': 'Test description'
    }
    
    try:
        task = service._parse_salesforce_task(record_without_id)
        print("❌ Should have failed for record without ID")
        return False
    except ValueError as e:
        print(f"✅ Correctly caught error for missing ID: {e}")
    except Exception as e:
        print(f"❌ Unexpected error type for missing ID: {e}")
        return False
    
    # Test case 2: Invalid datetime
    record_with_invalid_datetime = {
        'Id': 'test_id',
        'Subject': 'Test Task',
        'CreatedDate': 'invalid_datetime'
    }
    
    try:
        task = service._parse_salesforce_task(record_with_invalid_datetime)
        print("✅ Successfully handled invalid datetime (should return None)")
        assert task.created_date is None
    except Exception as e:
        print(f"❌ Failed to handle invalid datetime gracefully: {e}")
        return False
    
    return True


def main():
    """Run all tests"""
    print("🚀 Starting calendar integration fix tests...\n")
    
    tests = [
        test_subject_field_handling,
        test_datetime_timezone_handling,
        test_error_handling
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
                print("✅ Test passed\n")
            else:
                print("❌ Test failed\n")
        except Exception as e:
            print(f"❌ Test crashed: {e}\n")
    
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The fixes should resolve the calendar integration issues.")
        return 0
    else:
        print("⚠️  Some tests failed. Please review the fixes.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
