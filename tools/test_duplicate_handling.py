#!/usr/bin/env python3
"""
Test script for duplicate handling functionality.
Tests the complete duplicate detection and resolution workflow.
"""

import sys
import os
import json
import pandas as pd
import numpy as np
from pathlib import Path

# Add the core directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

from duplicate_handler import DuplicateHandler
from salesforce_integration import SafeJSONEncoder


def create_test_duplicate_data():
    """Create test data that simulates duplicate detection results."""
    print("=== Creating Test Duplicate Data ===")
    
    # Simulate duplicate detection results from Salesforce upload
    test_duplicates = [
        {
            'recordNumber': 1,
            'newRecord': {
                'LastName': 'Silva',
                'Email': 'joao.silva@newcompany.com',
                'Phone': '11999887766',
                'Company': 'New Company Ltd'
            },
            'existingRecordIds': ['00Q000000123456AAA'],
            'errorMessage': 'DUPLICATES_DETECTED: You\'re creating a duplicate record. We recommend you use an existing record instead.',
            'matchedFields': ['Email', 'LastName']
        },
        {
            'recordNumber': 3,
            'newRecord': {
                'LastName': 'Santos',
                'Email': 'maria.santos@example.com',
                'Phone': '11888776655',
                'Company': 'Example Corp'
            },
            'existingRecordIds': ['00Q000000789012BBB'],
            'errorMessage': 'DUPLICATES_DETECTED: You\'re creating a duplicate record. We recommend you use an existing record instead.',
            'matchedFields': ['Email']
        }
    ]
    
    print(f"Created {len(test_duplicates)} test duplicate records")
    return test_duplicates


def test_duplicate_handler_initialization():
    """Test DuplicateHandler initialization."""
    print("\n=== Testing DuplicateHandler Initialization ===")
    
    # Use dummy credentials for testing
    access_token = "test_access_token_12345"
    instance_url = "https://test.salesforce.com"
    
    try:
        handler = DuplicateHandler(access_token, instance_url)
        print("[PASS] DuplicateHandler initialized successfully")
        return handler
    except Exception as e:
        print(f"[FAIL] DuplicateHandler initialization failed: {e}")
        return None


def test_fetch_existing_records_structure():
    """Test the structure of fetch existing records without actual Salesforce calls."""
    print("\n=== Testing Fetch Existing Records Structure ===")
    
    handler = test_duplicate_handler_initialization()
    if not handler:
        return False
    
    test_duplicates = create_test_duplicate_data()
    
    try:
        # This will fail due to invalid credentials, but we can test the structure
        result = handler.fetch_existing_records(test_duplicates)
        
        # Check result structure
        required_keys = ['success', 'existingRecords', 'fetchErrors', 'totalRequested', 'totalFetched']
        for key in required_keys:
            if key not in result:
                print(f"[FAIL] Missing key '{key}' in fetch result")
                return False
        
        print("[PASS] Fetch existing records structure is correct")
        print(f"Result structure: {list(result.keys())}")
        return True
        
    except Exception as e:
        print(f"[FAIL] Fetch existing records test failed: {e}")
        return False


def test_duplicate_resolution_actions():
    """Test different duplicate resolution actions."""
    print("\n=== Testing Duplicate Resolution Actions ===")
    
    handler = test_duplicate_handler_initialization()
    if not handler:
        return False
    
    test_duplicates = create_test_duplicate_data()
    
    # Test different resolution actions
    test_cases = [
        {
            'name': 'Cancel Action',
            'data': {
                'action': 'cancel',
                'duplicates': test_duplicates,
                'selectedFields': {},
                'objectType': 'Lead'
            },
            'expected_action': 'cancel'
        },
        {
            'name': 'Skip Action',
            'data': {
                'action': 'skip',
                'duplicates': test_duplicates,
                'selectedFields': {},
                'objectType': 'Lead'
            },
            'expected_action': 'skip'
        },
        {
            'name': 'Update Action (No Fields Selected)',
            'data': {
                'action': 'update',
                'duplicates': test_duplicates,
                'selectedFields': {},
                'objectType': 'Lead'
            },
            'expected_action': 'update'
        },
        {
            'name': 'Update Action (With Selected Fields)',
            'data': {
                'action': 'update',
                'duplicates': test_duplicates,
                'selectedFields': {
                    '1': {'Email': True, 'Phone': True},
                    '3': {'Company': True}
                },
                'objectType': 'Lead'
            },
            'expected_action': 'update'
        }
    ]
    
    passed_tests = 0
    
    for test_case in test_cases:
        try:
            print(f"\nTesting: {test_case['name']}")
            result = handler.process_duplicate_resolution(test_case['data'])
            
            # Check basic structure
            if 'success' not in result:
                print(f"[FAIL] Missing 'success' key in result")
                continue
            
            if 'action' not in result:
                print(f"[FAIL] Missing 'action' key in result")
                continue
            
            if result['action'] != test_case['expected_action']:
                print(f"[FAIL] Expected action '{test_case['expected_action']}', got '{result['action']}'")
                continue
            
            print(f"[PASS] {test_case['name']} - Action: {result['action']}")
            if 'message' in result:
                print(f"  Message: {result['message']}")
            
            passed_tests += 1
            
        except Exception as e:
            print(f"[FAIL] {test_case['name']} failed: {e}")
    
    print(f"\nDuplicate resolution tests: {passed_tests}/{len(test_cases)} passed")
    return passed_tests == len(test_cases)


def test_json_serialization():
    """Test JSON serialization of duplicate handling results."""
    print("\n=== Testing JSON Serialization ===")
    
    test_data = {
        'success': True,
        'action': 'update',
        'duplicates': create_test_duplicate_data(),
        'selectedFields': {
            '1': {'Email': True, 'Phone': False},
            '3': {'Company': True}
        },
        'existingRecords': {
            '1': {
                'Id': '00Q000000123456AAA',
                'LastName': 'Silva',
                'Email': 'joao.silva@oldcompany.com',
                'Phone': '11999887766',
                'Company': 'Old Company Inc',
                'CreatedDate': '2024-01-15T10:30:00.000Z'
            }
        },
        'updateResults': {
            'totalUpdates': 2,
            'successfulUpdates': 1,
            'failedUpdates': 1,
            'successRate': 50.0
        }
    }
    
    try:
        # Test with SafeJSONEncoder
        json_output = json.dumps(test_data, cls=SafeJSONEncoder, indent=2)
        print("[PASS] JSON serialization successful")
        
        # Test parsing
        parsed_data = json.loads(json_output)
        print("[PASS] JSON parsing successful")
        
        # Verify structure preservation
        if parsed_data['success'] == test_data['success']:
            print("[PASS] Data structure preserved")
        else:
            print("[FAIL] Data structure not preserved")
            return False
        
        print(f"JSON output size: {len(json_output)} characters")
        return True
        
    except Exception as e:
        print(f"[FAIL] JSON serialization test failed: {e}")
        return False


def test_field_comparison_logic():
    """Test field comparison logic for duplicate records."""
    print("\n=== Testing Field Comparison Logic ===")
    
    # Simulate new record vs existing record comparison
    new_record = {
        'LastName': 'Silva',
        'Email': 'joao.silva@newcompany.com',
        'Phone': '11999887766',
        'Company': 'New Company Ltd'
    }
    
    existing_record = {
        'LastName': 'Silva',
        'Email': 'joao.silva@oldcompany.com',
        'Phone': '11999887766',
        'Company': 'Old Company Inc'
    }
    
    # Test field comparison
    fields_to_compare = ['LastName', 'Email', 'Phone', 'Company']
    differences = []
    
    for field in fields_to_compare:
        new_value = new_record.get(field, '')
        existing_value = existing_record.get(field, '')
        
        if new_value != existing_value:
            differences.append({
                'field': field,
                'newValue': new_value,
                'existingValue': existing_value,
                'isDifferent': True
            })
        else:
            differences.append({
                'field': field,
                'newValue': new_value,
                'existingValue': existing_value,
                'isDifferent': False
            })
    
    print("Field comparison results:")
    for diff in differences:
        status = "DIFFERENT" if diff['isDifferent'] else "SAME"
        print(f"  {diff['field']}: {status}")
        if diff['isDifferent']:
            print(f"    New: '{diff['newValue']}'")
            print(f"    Existing: '{diff['existingValue']}'")
    
    # Verify expected differences
    expected_different_fields = ['Email', 'Company']
    actual_different_fields = [d['field'] for d in differences if d['isDifferent']]
    
    if set(expected_different_fields) == set(actual_different_fields):
        print("[PASS] Field comparison logic works correctly")
        return True
    else:
        print(f"[FAIL] Expected different fields: {expected_different_fields}")
        print(f"[FAIL] Actual different fields: {actual_different_fields}")
        return False


def main():
    """Run all duplicate handling tests."""
    print("Testing Duplicate Handling Functionality")
    print("=" * 50)
    
    tests = [
        test_duplicate_handler_initialization,
        test_fetch_existing_records_structure,
        test_duplicate_resolution_actions,
        test_json_serialization,
        test_field_comparison_logic
    ]
    
    passed_tests = 0
    
    for test_func in tests:
        try:
            if test_func():
                passed_tests += 1
        except Exception as e:
            print(f"[ERROR] Test {test_func.__name__} crashed: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print(f"Test Results: {passed_tests}/{len(tests)} tests passed")
    
    if passed_tests == len(tests):
        print("All tests passed! Duplicate handling functionality is working correctly.")
        print("\nNext steps:")
        print("1. Test with actual Salesforce credentials")
        print("2. Test the complete frontend integration")
        print("3. Verify user experience with real duplicate scenarios")
    else:
        print("Some tests failed. Please review the errors above.")
    
    return passed_tests == len(tests)


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
