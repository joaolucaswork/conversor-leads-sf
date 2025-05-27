#!/usr/bin/env python3
"""
Test script to verify the Salesforce integration fixes for NaN handling and OwnerId resolution.
"""

import sys
import os
import json
import pandas as pd
import numpy as np
from pathlib import Path

# Add the core directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

from salesforce_integration import SafeJSONEncoder, SalesforceIntegration


def test_safe_json_encoder():
    """Test the SafeJSONEncoder with various problematic values."""
    print("=== Testing SafeJSONEncoder ===")

    test_data = {
        'normal_string': 'Hello World',
        'normal_number': 42,
        'nan_value': np.nan,
        'inf_value': np.inf,
        'neg_inf_value': -np.inf,
        'none_value': None,
        'empty_string': '',
        'numpy_int': np.int64(123),
        'numpy_float': np.float64(45.67),
        'numpy_nan': np.float64('nan'),
        'nested_dict': {
            'inner_nan': np.nan,
            'inner_normal': 'test',
            'inner_list': [1, np.nan, 3, np.inf]
        },
        'list_with_nans': [1, 2, np.nan, 4, np.inf, 'test']
    }

    try:
        # Test with SafeJSONEncoder
        safe_json = json.dumps(test_data, cls=SafeJSONEncoder, indent=2)
        print("[PASS] SafeJSONEncoder successfully handled problematic values")
        print("Sample output:")
        print(safe_json[:200] + "..." if len(safe_json) > 200 else safe_json)

        # Verify it can be parsed back
        parsed = json.loads(safe_json)
        print("[PASS] Generated JSON can be parsed successfully")

        # Test with regular JSON encoder (should fail)
        try:
            regular_json = json.dumps(test_data)
            print("[FAIL] Regular JSON encoder should have failed but didn't")
        except (ValueError, TypeError) as e:
            print(f"[PASS] Regular JSON encoder failed as expected: {type(e).__name__}")

    except Exception as e:
        print(f"[FAIL] SafeJSONEncoder test failed: {e}")
        return False

    return True


def test_phone_number_cleaning():
    """Test phone number cleaning with various problematic inputs."""
    print("\n=== Testing Phone Number Cleaning ===")

    # Import the AI processor for phone cleaning
    from master_leads_processor_ai import AIEnhancedLeadsProcessor

    processor = AIEnhancedLeadsProcessor()

    test_phones = [
        '11999887766',  # Normal phone
        '(11) 99988-7766',  # Formatted phone
        '+5511999887766',  # International
        '',  # Empty
        np.nan,  # NaN
        None,  # None
        'nan',  # String 'nan'
        '123',  # Too short
        '11999887766.0',  # Float representation
        'invalid',  # Invalid
    ]

    print("Testing phone number cleaning:")
    for phone in test_phones:
        try:
            cleaned = processor.clean_phone_number_ai(phone)
            print(f"  {repr(phone)} -> '{cleaned}'")
        except Exception as e:
            print(f"  {repr(phone)} -> ERROR: {e}")
            return False

    print("[PASS] Phone number cleaning tests passed")
    return True


def test_dataframe_nan_handling():
    """Test DataFrame with NaN values and conversion to records."""
    print("\n=== Testing DataFrame NaN Handling ===")

    # Create test DataFrame with various NaN scenarios
    test_data = {
        'LastName': ['Smith', 'Johnson', 'Brown'],
        'Phone': ['11999887766', np.nan, '11888776655'],
        'Email': ['test@example.com', 'user@test.com', np.nan],
        'OwnerId': ['pmarques', 'jsilva', np.nan],
        'AnnualRevenue': [100000.0, np.nan, 250000.0]
    }

    df = pd.DataFrame(test_data)
    print("Original DataFrame:")
    print(df)
    print(f"DataFrame dtypes:\n{df.dtypes}")

    # Test conversion with NaN replacement
    df_clean = df.replace({np.nan: None})
    records = df_clean.to_dict('records')

    print("\nConverted records:")
    for i, record in enumerate(records):
        print(f"Record {i+1}: {record}")

    # Test JSON serialization
    try:
        json_output = json.dumps(records, cls=SafeJSONEncoder, indent=2)
        print("[PASS] Records successfully serialized to JSON")

        # Verify parsing
        parsed_records = json.loads(json_output)
        print("[PASS] JSON successfully parsed back")

    except Exception as e:
        print(f"[FAIL] JSON serialization failed: {e}")
        return False

    return True


def create_test_csv():
    """Create a test CSV file with problematic data for integration testing."""
    print("\n=== Creating Test CSV ===")

    test_data = {
        'Lead': ['João Silva', 'Maria Santos', 'Pedro Costa'],
        'Telefone': ['11999887766', np.nan, '11888776655.0'],
        'E-mail': ['joao@test.com', 'maria@test.com', np.nan],
        'Atribuir': ['pmarques', 'jsilva', 'admin'],
        'Patrimônio Financeiro': [100000.0, np.nan, 250000.0],
        'Estado': ['SP', 'RJ', np.nan],
        'Descrição': ['Lead qualificado', np.nan, 'Prospect interessante']
    }

    df = pd.DataFrame(test_data)

    # Create test file
    test_file = Path('data/test_leads_with_nans.csv')
    test_file.parent.mkdir(exist_ok=True)

    df.to_csv(test_file, index=False)
    print(f"[PASS] Test CSV created: {test_file}")
    print("Test data preview:")
    print(df)

    return str(test_file)


def main():
    """Run all tests."""
    print("Testing Salesforce Integration Fixes")
    print("=" * 50)

    tests_passed = 0
    total_tests = 4

    # Test 1: SafeJSONEncoder
    if test_safe_json_encoder():
        tests_passed += 1

    # Test 2: Phone number cleaning
    if test_phone_number_cleaning():
        tests_passed += 1

    # Test 3: DataFrame NaN handling
    if test_dataframe_nan_handling():
        tests_passed += 1

    # Test 4: Create test CSV
    try:
        test_file = create_test_csv()
        tests_passed += 1
        print(f"\nTest file created for manual testing: {test_file}")
    except Exception as e:
        print(f"[FAIL] Test CSV creation failed: {e}")

    # Summary
    print("\n" + "=" * 50)
    print(f"Test Results: {tests_passed}/{total_tests} tests passed")

    if tests_passed == total_tests:
        print("All tests passed! The fixes should resolve the JSON parsing and NaN issues.")
        print("\nNext steps:")
        print("1. Test the complete upload flow with the created test CSV")
        print("2. Verify OwnerId resolution works with your Salesforce instance")
        print("3. Check that phone numbers are properly cleaned")
    else:
        print("Some tests failed. Please review the errors above.")

    return tests_passed == total_tests


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
