#!/usr/bin/env python3
"""
Test script to verify that the name mapping fix works correctly.
"""

import sys
import os
import pandas as pd
from pathlib import Path

def test_mapping_patterns():
    """Test the updated mapping patterns."""
    print("🧪 Testing mapping patterns...")
    
    try:
        sys.path.append('core')
        from ai_field_mapper import AIFieldMapper
        
        # Initialize mapper with AI disabled to test rule-based mapping
        config = {"ai_processing": {"enabled": False, "confidence_threshold": 80.0}}
        mapper = AIFieldMapper(config)
        
        # Test column names from the Excel file
        test_columns = ['Lead', 'Tel. Fixo', 'Celular', 'E-mail', 'Descrição', 'Volume Aproximado', 'Tipo', 'Estado', 'Atribuir']
        
        print(f"Testing columns: {test_columns}")
        
        # Get mappings
        mappings = mapper._rule_based_mapping(test_columns)
        
        print(f"\n📋 MAPPING RESULTS:")
        for mapping in mappings:
            status = "✅" if mapping.target_field != "UNMAPPED" else "❌"
            print(f"  {status} {mapping.source_field} → {mapping.target_field} (confidence: {mapping.confidence}%)")
        
        # Check if "Lead" is now mapped correctly
        lead_mapping = next((m for m in mappings if m.source_field == "Lead"), None)
        if lead_mapping and lead_mapping.target_field == "Last Name":
            print(f"\n✅ SUCCESS: 'Lead' correctly mapped to 'Last Name'")
            return True
        else:
            print(f"\n❌ FAILED: 'Lead' not mapped correctly")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_excel_processing():
    """Test processing the actual Excel file."""
    print(f"\n🧪 Testing Excel file processing...")
    
    try:
        sys.path.append('core')
        from master_leads_processor_ai import AIEnhancedLeadsProcessor
        
        # Initialize processor with AI disabled for testing
        processor = AIEnhancedLeadsProcessor()
        processor.config['ai_processing']['enabled'] = False
        processor.ai_mapper.ai_enabled = False
        
        excel_file = "data/input/leads_vinteseismaio.xlsx"
        if not Path(excel_file).exists():
            print(f"⚠️  Excel file not found: {excel_file}")
            return False
        
        # Read the Excel file
        df = pd.read_excel(excel_file)
        print(f"✅ Read Excel file: {len(df)} records, {len(df.columns)} columns")
        print(f"   Columns: {list(df.columns)}")
        
        # Test column mapping
        df_mapped, field_mappings = processor.intelligent_column_mapping(df)
        print(f"✅ Column mapping completed")
        print(f"   Mapped columns: {list(df_mapped.columns)}")
        
        # Check if names are in the Last Name column
        if 'Last Name' in df_mapped.columns:
            name_samples = df_mapped['Last Name'].dropna().head(3).tolist()
            if name_samples and any(name_samples):
                print(f"✅ Names found in 'Last Name' column: {name_samples}")
                return True
            else:
                print(f"❌ 'Last Name' column is empty")
                return False
        else:
            print(f"❌ 'Last Name' column not found in mapped data")
            return False
            
    except Exception as e:
        print(f"❌ Excel processing test failed: {e}")
        return False

def test_full_processing():
    """Test full processing pipeline."""
    print(f"\n🧪 Testing full processing pipeline...")
    
    try:
        sys.path.append('core')
        from master_leads_processor_ai import AIEnhancedLeadsProcessor
        
        # Initialize processor with AI disabled for testing
        processor = AIEnhancedLeadsProcessor()
        processor.config['ai_processing']['enabled'] = False
        processor.ai_mapper.ai_enabled = False
        
        excel_file = "data/input/leads_vinteseismaio.xlsx"
        if not Path(excel_file).exists():
            print(f"⚠️  Excel file not found: {excel_file}")
            return False
        
        # Process the file
        output_file = processor.process_file_ai(excel_file)
        print(f"✅ File processed successfully: {output_file}")
        
        # Check the output
        df_output = pd.read_csv(output_file)
        print(f"✅ Output file read: {len(df_output)} records")
        
        # Check if names are properly populated
        if 'Last Name' in df_output.columns:
            non_empty_names = df_output['Last Name'].dropna()
            non_empty_names = non_empty_names[non_empty_names != '']
            
            if len(non_empty_names) > 0:
                print(f"✅ Names found in output: {len(non_empty_names)} records")
                print(f"   Sample names: {non_empty_names.head(3).tolist()}")
                return True
            else:
                print(f"❌ No names found in output 'Last Name' column")
                return False
        else:
            print(f"❌ 'Last Name' column not found in output")
            return False
            
    except Exception as e:
        print(f"❌ Full processing test failed: {e}")
        return False

def main():
    """Main test function."""
    print("🔧 NAME MAPPING FIX VERIFICATION")
    print("=" * 50)
    
    test_results = []
    
    # Test mapping patterns
    result1 = test_mapping_patterns()
    test_results.append(("Mapping Patterns", result1))
    
    # Test Excel processing
    result2 = test_excel_processing()
    test_results.append(("Excel Processing", result2))
    
    # Test full processing
    result3 = test_full_processing()
    test_results.append(("Full Processing", result3))
    
    # Print summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<20} {status}")
        if result:
            passed += 1
    
    print("-" * 50)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    
    if passed == total:
        print("\n🎉 All tests passed! The name mapping fix is working correctly.")
        print("\nThe 'Lead' column should now be properly mapped to 'Last Name'.")
        print("\nYou can now process your Excel file with:")
        print("python quick_start.py ai data/input/leads_vinteseismaio.xlsx")
    else:
        print("\n⚠️  Some tests failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
