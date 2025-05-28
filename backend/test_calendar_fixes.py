#!/usr/bin/env python3
"""
Simple test to verify calendar integration fixes
"""

from calendar_module.services.salesforce_calendar_service import SalesforceCalendarService
from calendar_module.models.event import SalesforceTask, EventStatus
from datetime import datetime, date, timezone

def main():
    print("🚀 Testing calendar integration fixes...")

    # Create service instance
    service = SalesforceCalendarService("fake_token", "https://fake.salesforce.com")

    # Test 1: None subject handling
    print("\n1. Testing None subject handling...")
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
        'IsArchived': False,
        'OwnerId': None,
        'Owner': None,
        'AccountId': None,
        'Account': None,
        'WhatId': None,
        'WhoId': None,
        'CallDurationInSeconds': None,
        'CallType': None,
        'CallDisposition': None,
        'CallObject': None,
        'CreatedById': None,
        'LastModifiedById': None
    }

    try:
        task = service._parse_salesforce_task(record_with_none_subject)
        print(f"✅ Successfully parsed task with None subject: '{task.subject}'")
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

    # Test 2: Datetime parsing
    print("\n2. Testing datetime parsing...")
    try:
        dt = service._parse_salesforce_datetime('2024-01-15T10:30:00.000Z')
        print(f"✅ Successfully parsed datetime: {dt} (timezone: {dt.tzinfo})")
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

    # Test 3: Task to calendar event conversion
    print("\n3. Testing task to calendar event conversion...")
    try:
        task = SalesforceTask(
            id="test_task",
            subject="Test Task",
            activity_date=date(2024, 1, 15),
            reminder_datetime=datetime(2024, 1, 15, 9, 0, 0, tzinfo=timezone.utc),
            is_reminder_set=True,
            created_date=datetime(2024, 1, 15, 8, 0, 0, tzinfo=timezone.utc)
        )

        calendar_event = service._convert_task_to_calendar_event(task)
        print(f"✅ Successfully converted task: {calendar_event.title}")
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

    print("\n🎉 All tests passed! The fixes should work correctly.")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
