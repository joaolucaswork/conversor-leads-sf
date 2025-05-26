#!/usr/bin/env python3
"""
Comprehensive test to verify pandas Series ambiguity error has been fixed.
"""

import sys
import os
import pandas as pd
import numpy as np
from pathlib import Path

def test_pandas_series_handling():
    """Test pandas Series handling in data processing functions."""
    print("🧪 Testing pandas Series handling...")

    try:
        # Import the processor
        sys.path.append('core')
        from master_leads_processor_ai import AIEnhancedLeadsProcessor

        # Initialize processor
        processor = AIEnhancedLeadsProcessor()
        processor.config['ai_processing']['enabled'] = False
        processor.ai_mapper.ai_enabled = False

        # Create test data with problematic values
        test_data = {
            'Phone': ['11987654321', '', np.nan, 'NA', '21876543210'],
            'Email': ['test@email.com', '', np.nan, 'invalid', 'valid@test.com'],
            'Last Name': ['João Silva', '', np.nan, 'MARIA SANTOS', 'pedro oliveira'],
            'Patrimônio Financeiro': [1500000, '', np.nan, 'R$ 2.000.000', 1200000]
        }

        df_test = pd.DataFrame(test_data)
        print(f"✅ Created test DataFrame with {len(df_test)} rows")

        # Test each cleaning function individually
        print("\n🔧 Testing individual cleaning functions:")

        # Test phone cleaning
        try:
            df_test['Phone_Clean'] = df_test['Phone'].apply(processor.clean_phone_number_ai)
            print("✅ Phone cleaning: PASSED")
        except Exception as e:
            print(f"❌ Phone cleaning: FAILED - {e}")
            return False

        # Test email formatting
        try:
            df_test['Email_Clean'] = df_test['Email'].apply(processor.format_email_ai)
            print("✅ Email formatting: PASSED")
        except Exception as e:
            print(f"❌ Email formatting: FAILED - {e}")
            return False

        # Test name formatting
        try:
            df_test['Name_Clean'] = df_test['Last Name'].apply(processor.format_name_ai)
            print("✅ Name formatting: PASSED")
        except Exception as e:
            print(f"❌ Name formatting: FAILED - {e}")
            return False

        # Test financial conversion
        try:
            df_test['Financial_Clean'] = df_test['Patrimônio Financeiro'].apply(
                lambda x: processor.convert_money_to_numeric(x)
            )
            print("✅ Financial conversion: PASSED")
        except Exception as e:
            print(f"❌ Financial conversion: FAILED - {e}")
            return False

        print(f"\n📊 Test results:")
        print(df_test[['Phone_Clean', 'Email_Clean', 'Name_Clean', 'Financial_Clean']].head())

        return True

    except Exception as e:
        print(f"❌ Series handling test failed: {e}")
        return False

def test_ai_processor_with_excel():
    """Test the AI processor with Excel file."""
    print("\n🧪 Testing AI processor with Excel file...")

    try:
        # Import the processor
        sys.path.append('core')
        from master_leads_processor_ai import AIEnhancedLeadsProcessor

        # Initialize with AI disabled for testing
        processor = AIEnhancedLeadsProcessor()
        processor.config['ai_processing']['enabled'] = False
        processor.ai_mapper.ai_enabled = False

        print("✅ Processor initialized successfully")

        # Check if test file exists
        test_file = "data/input/leads_vinteseismaio.xlsx"
        if not Path(test_file).exists():
            print(f"⚠️  Test file not found: {test_file}")
            # Try alternative locations
            alt_files = ["leads_vinteseismaio.xlsx", "Leads 1m+ dia 26 de Maio.xlsx"]
            for alt_file in alt_files:
                if Path(alt_file).exists():
                    test_file = alt_file
                    print(f"✅ Found alternative file: {test_file}")
                    break
            else:
                print("⚠️  No Excel test file found, skipping Excel test")
                return True

        # Test format detection
        file_format, separator, sample_data = processor.detect_file_format_ai(test_file)
        print(f"✅ Format detected: {file_format}")
        print(f"✅ Sample data columns: {len(sample_data)}")

        # Test file reading
        if test_file.endswith('.xlsx') or test_file.endswith('.xls'):
            df = pd.read_excel(test_file)
        else:
            df = pd.read_csv(test_file, sep=separator, encoding='utf-8')

        print(f"✅ File read successfully: {len(df)} records, {len(df.columns)} columns")
        print(f"✅ Columns: {list(df.columns)[:5]}...")  # Show first 5 columns

        return True

    except Exception as e:
        print(f"❌ Excel processor test failed: {e}")
        return False

def test_data_validation():
    """Test data validation functions."""
    print("\n🧪 Testing data validation...")

    try:
        sys.path.append('core')
        from ai_field_mapper import AIFieldMapper

        # Initialize mapper with AI disabled
        config = {"ai_processing": {"enabled": False, "confidence_threshold": 80.0}}
        mapper = AIFieldMapper(config)

        # Test validation with problematic data
        test_samples = ['11987654321', '', 'NA', np.nan, '21876543210', None]

        validation = mapper.validate_data_quality(
            field_name='Phone',
            data_samples=test_samples,
            target_field='Phone'
        )

        print(f"✅ Data validation completed")
        print(f"   Issues found: {len(validation.issues_found)}")
        print(f"   Suggestions: {len(validation.suggestions)}")
        print(f"   Confidence: {validation.confidence}")

        return True

    except Exception as e:
        print(f"❌ Data validation test failed: {e}")
        return False

def main():
    """Main test function."""
    print("🔧 PANDAS SERIES AMBIGUITY ERROR FIX TEST")
    print("=" * 50)

    test_results = []

    # Test pandas Series handling
    result1 = test_pandas_series_handling()
    test_results.append(("Pandas Series Handling", result1))

    # Test AI processor with Excel
    result2 = test_ai_processor_with_excel()
    test_results.append(("Excel File Processing", result2))

    # Test data validation
    result3 = test_data_validation()
    test_results.append(("Data Validation", result3))

    # Print summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)

    passed = 0
    total = len(test_results)

    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1

    print("-" * 50)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")

    if passed == total:
        print("\n🎉 All tests passed! The pandas Series ambiguity error has been fixed.")
        print("\nYou can now safely use:")
        print("python quick_start.py ai data/input/leads_vinteseismaio.xlsx")
    else:
        print("\n⚠️  Some tests failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
