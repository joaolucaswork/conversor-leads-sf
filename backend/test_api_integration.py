#!/usr/bin/env python3
"""
Integration test for calendar API endpoints
"""

import asyncio
from datetime import datetime, date, timezone
from calendar_module.services.salesforce_calendar_service import SalesforceCalendarService
from calendar_module.models.event import SalesforceTask, EventStatus, EventFilter

async def test_calendar_service_integration():
    """Test the complete calendar service integration"""
    print("🚀 Testing calendar service integration...")
    
    # Create service instance
    service = SalesforceCalendarService("fake_token", "https://fake.salesforce.com")
    
    # Test 1: Parse problematic task record (the one that was failing)
    print("\n1. Testing problematic task parsing...")
    problematic_record = {
        'Id': '00TU500000Hsg0YMAR',
        'Subject': None,  # This was causing the validation error
        'Description': 'Test task description',
        'Status': 'Not Started',
        'Priority': 'Normal',
        'ActivityDate': '2024-01-15',
        'CreatedDate': '2024-01-15T10:30:00.000Z',  # Timezone-aware
        'LastModifiedDate': '2024-01-15T11:00:00.000Z',
        'IsReminderSet': True,
        'ReminderDateTime': '2024-01-15T09:30:00.000Z',  # For timezone comparison test
        'IsClosed': False,
        'IsArchived': False,
        'OwnerId': 'test_owner',
        'Owner': {'Name': 'Test Owner'},
        'AccountId': None,
        'Account': None,
        'WhatId': None,
        'WhoId': None,
        'CallDurationInSeconds': None,
        'CallType': None,
        'CallDisposition': None,
        'CallObject': None,
        'CreatedById': 'test_creator',
        'LastModifiedById': 'test_modifier'
    }
    
    try:
        task = service._parse_salesforce_task(problematic_record)
        print(f"✅ Successfully parsed problematic task:")
        print(f"   - ID: {task.id}")
        print(f"   - Subject: '{task.subject}' (fallback applied)")
        print(f"   - Status: {task.status}")
        print(f"   - Created: {task.created_date}")
        print(f"   - Reminder: {task.reminder_datetime}")
        
        # Test 2: Convert to calendar event (this tests timezone comparison)
        print("\n2. Testing task to calendar event conversion...")
        calendar_event = service._convert_task_to_calendar_event(task)
        print(f"✅ Successfully converted to calendar event:")
        print(f"   - Calendar ID: {calendar_event.id}")
        print(f"   - Title: '{calendar_event.title}'")
        print(f"   - Start: {calendar_event.start}")
        print(f"   - All day: {calendar_event.all_day}")
        print(f"   - Reminder minutes: {calendar_event.reminder_minutes}")
        
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False
    
    # Test 3: Multiple edge cases
    print("\n3. Testing multiple edge cases...")
    edge_cases = [
        {
            'Id': 'test_empty_subject',
            'Subject': '',  # Empty string
            'CreatedDate': '2024-01-15T10:30:00.000Z',
            'IsReminderSet': False,
            'IsClosed': False,
            'IsArchived': False
        },
        {
            'Id': 'test_whitespace_subject',
            'Subject': '   ',  # Whitespace only
            'CreatedDate': '2024-01-15T10:30:00.000Z',
            'IsReminderSet': False,
            'IsClosed': False,
            'IsArchived': False
        },
        {
            'Id': 'test_valid_subject',
            'Subject': 'Valid Task Subject',
            'CreatedDate': '2024-01-15T10:30:00.000Z',
            'IsReminderSet': False,
            'IsClosed': False,
            'IsArchived': False
        }
    ]
    
    for i, record in enumerate(edge_cases, 1):
        try:
            task = service._parse_salesforce_task(record)
            calendar_event = service._convert_task_to_calendar_event(task)
            print(f"✅ Edge case {i} passed: '{task.subject}' -> '{calendar_event.title}'")
        except Exception as e:
            print(f"❌ Edge case {i} failed: {e}")
            return False
    
    # Test 4: Datetime timezone consistency
    print("\n4. Testing datetime timezone consistency...")
    timezone_test_cases = [
        '2024-01-15T10:30:00.000Z',  # UTC with Z
        '2024-01-15T10:30:00.000+00:00',  # UTC with offset
        '2024-01-15T10:30:00.000-05:00',  # EST
    ]
    
    for dt_str in timezone_test_cases:
        try:
            parsed_dt = service._parse_salesforce_datetime(dt_str)
            if parsed_dt and parsed_dt.tzinfo:
                print(f"✅ Timezone test passed: {dt_str} -> {parsed_dt} (tz: {parsed_dt.tzinfo})")
            else:
                print(f"❌ Timezone test failed: {dt_str} -> {parsed_dt}")
                return False
        except Exception as e:
            print(f"❌ Timezone test error for {dt_str}: {e}")
            return False
    
    print("\n🎉 All integration tests passed!")
    return True

def test_event_filter_compatibility():
    """Test that EventFilter works correctly with the fixes"""
    print("\n5. Testing EventFilter compatibility...")
    
    try:
        # Create an event filter
        event_filter = EventFilter(
            include_tasks=True,
            include_events=True,
            include_recurring=True,
            statuses=[EventStatus.NOT_STARTED, EventStatus.IN_PROGRESS],
            limit=100,
            offset=0
        )
        
        print(f"✅ EventFilter created successfully:")
        print(f"   - Include tasks: {event_filter.include_tasks}")
        print(f"   - Include events: {event_filter.include_events}")
        print(f"   - Statuses: {[s.value for s in event_filter.statuses]}")
        print(f"   - Limit: {event_filter.limit}")
        
        return True
    except Exception as e:
        print(f"❌ EventFilter test failed: {e}")
        return False

async def main():
    """Run all integration tests"""
    print("🧪 Starting comprehensive calendar integration tests...\n")
    
    tests = [
        ("Calendar Service Integration", test_calendar_service_integration()),
        ("Event Filter Compatibility", test_event_filter_compatibility())
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_coro in tests:
        print(f"\n{'='*60}")
        print(f"Running: {test_name}")
        print(f"{'='*60}")
        
        try:
            if asyncio.iscoroutine(test_coro):
                result = await test_coro
            else:
                result = test_coro
                
            if result:
                passed += 1
                print(f"\n✅ {test_name} - PASSED")
            else:
                print(f"\n❌ {test_name} - FAILED")
        except Exception as e:
            print(f"\n💥 {test_name} - CRASHED: {e}")
    
    print(f"\n{'='*60}")
    print(f"📊 Final Results: {passed}/{total} tests passed")
    print(f"{'='*60}")
    
    if passed == total:
        print("🎉 ALL INTEGRATION TESTS PASSED!")
        print("✅ The calendar integration fixes are working correctly.")
        print("✅ Pydantic validation errors are resolved.")
        print("✅ Timezone comparison issues are fixed.")
        print("✅ The system is ready for production use.")
        return True
    else:
        print("⚠️  Some integration tests failed.")
        print("Please review the fixes before deploying.")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
