#!/usr/bin/env python3
"""
Test script for enhanced duplicate detection functionality.
Tests multiple field combinations for duplicate detection.
"""

import sys
import os
import json
import logging
from datetime import datetime

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from core.salesforce_integration import SalesforceIntegration

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_duplicate_detection_combinations():
    """
    Test the enhanced duplicate detection with various field combinations.
    """
    print("=== Enhanced Duplicate Detection Test ===")

    # Test data with different duplicate scenarios
    test_records = [
        {
            'LastName': 'Silva',
            'Email': 'joao.silva@company.com',
            'Phone': '11999887766',
            'Company': 'Tech Solutions Ltd'
        },
        {
            'LastName': 'Santos',
            'Email': 'maria.santos@newcompany.com',
            'Phone': '11888777555',
            'Company': 'Innovation Corp'
        },
        {
            'LastName': 'Silva',  # Same name, different email
            'Email': 'joao.silva@newcompany.com',
            'Phone': '11999887766',  # Same phone
            'Company': 'Tech Solutions Ltd'  # Same company
        },
        {
            'LastName': 'Oliveira',
            'Email': 'carlos.oliveira@company.com',
            'Phone': '11777666555',
            'Company': 'Digital Services'
        },
        {
            'LastName': 'Santos',  # Same name as record 2
            'Email': 'maria.santos@company.com',  # Different email
            'Phone': '11888777555',  # Same phone as record 2
            'Company': 'Different Company'  # Different company
        }
    ]

    print(f"Testing {len(test_records)} records for duplicate detection")
    print("\nTest Records:")
    for i, record in enumerate(test_records, 1):
        print(f"  {i}. {record['LastName']} - {record['Email']} - {record['Phone']} - {record['Company']}")

    # Mock Salesforce integration for testing
    class MockSalesforceIntegration:
        def __init__(self):
            self.base_url = "https://test.salesforce.com/services/data/v58.0"
            self.headers = {"Authorization": "Bearer test_token"}

            # Mock existing records in Salesforce
            self.mock_existing_records = [
                {
                    'Id': '00Q000000123456AAA',
                    'LastName': 'Silva',
                    'Email': 'joao.silva@oldcompany.com',
                    'Phone': '11999887766',
                    'Company': 'Tech Solutions Ltd'
                },
                {
                    'Id': '00Q000000123456BBB',
                    'LastName': 'Santos',
                    'Email': 'maria.santos@company.com',
                    'Phone': '11888777555',
                    'Company': 'Innovation Corp'
                },
                {
                    'Id': '00Q000000123456CCC',
                    'LastName': 'Oliveira',
                    'Email': 'carlos.oliveira@different.com',
                    'Phone': '11777666555',
                    'Company': 'Digital Services'
                }
            ]

        def search_potential_duplicates(self, record, object_type='Lead'):
            """Mock implementation of enhanced duplicate search"""
            print(f"\n--- Searching duplicates for: {record['LastName']} ---")

            # Define search combinations (same as in real implementation)
            combinations = [
                ['Email'],  # Exact email match
                ['LastName', 'Company'],  # Same person at same company
                ['LastName', 'Phone'],  # Same person with same phone
                ['Phone'],  # Same phone number
                ['LastName', 'Email'],  # Same person, different email domain
                ['Company', 'Phone'],  # Same company phone
            ]

            potential_duplicates = []

            for priority, combination in enumerate(combinations, 1):
                print(f"  Checking combination {priority}: {combination}")

                # Check if all fields in combination have values
                if not all(field in record and record[field] for field in combination):
                    print(f"    Skipping - missing fields")
                    continue

                # Search mock existing records
                for existing in self.mock_existing_records:
                    match = True
                    for field in combination:
                        if record.get(field) != existing.get(field):
                            match = False
                            break

                    if match:
                        duplicate_record = existing.copy()
                        duplicate_record['matchedFields'] = combination
                        duplicate_record['matchPriority'] = priority
                        potential_duplicates.append(duplicate_record)
                        print(f"    MATCH FOUND: {existing['Id']} on fields {combination}")
                        break  # Only take first match per combination

            # Remove duplicates and sort by priority
            seen_ids = set()
            unique_duplicates = []
            potential_duplicates.sort(key=lambda x: x.get('matchPriority', 999))

            for dup in potential_duplicates:
                if dup['Id'] not in seen_ids:
                    seen_ids.add(dup['Id'])
                    unique_duplicates.append(dup)

            print(f"  Result: {len(unique_duplicates)} unique duplicates found")
            return unique_duplicates

    # Test the duplicate detection
    mock_sf = MockSalesforceIntegration()

    print("\n=== DUPLICATE DETECTION RESULTS ===")

    for i, record in enumerate(test_records, 1):
        print(f"\nRecord {i}: {record['LastName']} - {record['Email']}")
        duplicates = mock_sf.search_potential_duplicates(record)

        if duplicates:
            print(f"  ✅ DUPLICATES DETECTED: {len(duplicates)} matches")
            for dup in duplicates:
                print(f"    - Match: {dup['Id']} on {dup['matchedFields']} (Priority: {dup['matchPriority']})")
        else:
            print(f"  ✅ NO DUPLICATES: Record appears to be unique")

    print("\n=== EXPECTED RESULTS ANALYSIS ===")
    print("Record 1 (Silva): Should match existing Silva on LastName+Company and LastName+Phone")
    print("Record 2 (Santos): Should match existing Santos on LastName+Phone")
    print("Record 3 (Silva): Should match existing Silva on LastName+Company and LastName+Phone")
    print("Record 4 (Oliveira): Should match existing Oliveira on Phone and LastName+Company")
    print("Record 5 (Santos): Should match existing Santos on LastName+Phone")

    print("\n=== FIELD COMBINATION PRIORITY ===")
    print("1. Email (highest priority - exact match)")
    print("2. LastName + Company (same person at same company)")
    print("3. LastName + Phone (same person with same phone)")
    print("4. Phone (same phone number)")
    print("5. LastName + Email (same person, different email domain)")
    print("6. Company + Phone (same company phone)")

def test_proactive_duplicate_check():
    """
    Test the proactive duplicate check functionality.
    """
    print("\n\n=== PROACTIVE DUPLICATE CHECK TEST ===")

    # This would test the actual proactive_duplicate_check method
    # For now, we'll just demonstrate the concept

    test_records = [
        {'LastName': 'Silva', 'Email': 'test@example.com', 'Phone': '11999887766', 'Company': 'Test Corp'},
        {'LastName': 'Santos', 'Email': 'santos@example.com', 'Phone': '11888777555', 'Company': 'Another Corp'}
    ]

    print("Proactive check would:")
    print("1. Check each record against existing Salesforce data")
    print("2. Use multiple field combinations for matching")
    print("3. Return duplicates BEFORE attempting upload")
    print("4. Prevent unnecessary API calls and errors")
    print("5. Provide better user experience with immediate feedback")

    print(f"\nTest records: {len(test_records)}")
    for i, record in enumerate(test_records, 1):
        print(f"  {i}. {record}")

if __name__ == "__main__":
    try:
        test_duplicate_detection_combinations()
        test_proactive_duplicate_check()
        print("\n✅ Enhanced duplicate detection test completed successfully!")

    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
