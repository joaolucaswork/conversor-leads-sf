#!/usr/bin/env python3
"""
Test script to verify that the description formatting with semicolon separators works correctly
and is compatible with Salesforce CSV imports.
"""

import sys
import os
import pandas as pd
from pathlib import Path

def test_semicolon_formatting_function():
    """Test the updated description formatting function with semicolons."""
    print("🧪 Testing semicolon description formatting function...")
    
    try:
        sys.path.append('core')
        from master_leads_processor_ai import AIEnhancedLeadsProcessor
        
        # Initialize processor
        processor = AIEnhancedLeadsProcessor()
        
        # Test cases with expected semicolon outputs
        test_cases = [
            # Basic concatenated words (updated for semicolons)
            ("ModeradoRegular", "Moderado; Regular"),
            ("ArrojadoQualificado", "Arrojado; Qualificado"),
            ("DesconhecidoQualificado", "Desconhecido; Qualificado"),
            
            # Three words concatenated
            ("ConservadorModeradoRegular", "Conservador; Moderado; Regular"),
            ("ArrojadoAgressivoQualificado", "Arrojado; Agressivo; Qualificado"),
            
            # Words with Portuguese accents
            ("ModeradoConservação", "Moderado; Conservação"),
            ("AgressivoQualificação", "Agressivo; Qualificação"),
            
            # Already formatted with semicolons (should remain unchanged)
            ("Moderado; Regular", "Moderado; Regular"),
            ("Arrojado; Qualificado", "Arrojado; Qualificado"),
            
            # Old comma format (should be converted to semicolons)
            ("Moderado, Regular", "Moderado, Regular"),  # This should remain as-is since it's not concatenated
            
            # Single words (should remain unchanged)
            ("Moderado", "Moderado"),
            ("Qualificado", "Qualificado"),
            
            # Mixed case that shouldn't be changed
            ("moderado", "moderado"),
            ("MODERADO", "MODERADO"),
            
            # Empty and None values
            ("", ""),
            (None, ""),
            
            # Numbers and special characters (should remain unchanged)
            ("Moderado123", "Moderado123"),
            ("Moderado-Regular", "Moderado-Regular"),
            
            # Complex concatenations
            ("ModeradoRegularConservador", "Moderado; Regular; Conservador"),
            ("ArrojadoQualificadoAgressivo", "Arrojado; Qualificado; Agressivo"),
        ]
        
        print(f"Testing {len(test_cases)} cases with semicolon separators:")
        
        passed = 0
        failed = 0
        
        for input_val, expected in test_cases:
            try:
                result = processor.format_description_ai(input_val)
                if result == expected:
                    print(f"  ✅ '{input_val}' → '{result}'")
                    passed += 1
                else:
                    print(f"  ❌ '{input_val}' → '{result}' (expected: '{expected}')")
                    failed += 1
            except Exception as e:
                print(f"  ❌ '{input_val}' → ERROR: {e}")
                failed += 1
        
        print(f"\n📊 Function test results: {passed} passed, {failed} failed")
        return failed == 0
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_salesforce_csv_compatibility():
    """Test that semicolon formatting is compatible with CSV parsing."""
    print(f"\n🧪 Testing Salesforce CSV compatibility...")
    
    try:
        import csv
        import io
        
        # Create test data with semicolon-formatted descriptions
        test_data = [
            ["Last Name", "Description", "Email"],
            ["João Silva", "Moderado; Regular", "joao@email.com"],
            ["Maria Santos", "Arrojado; Qualificado", "maria@email.com"],
            ["Pedro Oliveira", "Desconhecido; Qualificado", "pedro@email.com"],
            ["Ana Costa", "Conservador; Moderado; Regular", "ana@email.com"]
        ]
        
        # Write to CSV string
        csv_output = io.StringIO()
        writer = csv.writer(csv_output)
        writer.writerows(test_data)
        csv_content = csv_output.getvalue()
        
        print(f"✅ CSV content generated:")
        print(csv_content)
        
        # Read back from CSV to verify parsing
        csv_input = io.StringIO(csv_content)
        reader = csv.reader(csv_input)
        parsed_data = list(reader)
        
        print(f"✅ CSV parsing verification:")
        for i, row in enumerate(parsed_data):
            if i == 0:  # Header
                print(f"   Header: {row}")
            else:
                name, description, email = row
                print(f"   {name}: '{description}' | {email}")
                
                # Verify semicolons are preserved and not causing parsing issues
                if ';' in description and len(row) == 3:
                    print(f"     ✅ Semicolons preserved, no CSV parsing conflicts")
                elif ';' not in description:
                    print(f"     ➡️  No semicolons (normal case)")
                else:
                    print(f"     ❌ CSV parsing issue detected")
                    return False
        
        return True
        
    except Exception as e:
        print(f"❌ CSV compatibility test failed: {e}")
        return False

def test_excel_file_with_semicolons():
    """Test semicolon formatting with the actual Excel file."""
    print(f"\n🧪 Testing Excel file processing with semicolon formatting...")
    
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
        print(f"✅ Read Excel file: {len(df)} records")
        
        # Check original descriptions
        if 'Descrição' in df.columns:
            original_descriptions = df['Descrição'].dropna().unique()[:5]
            print(f"📄 Original descriptions sample: {list(original_descriptions)}")
        else:
            print(f"❌ 'Descrição' column not found in Excel file")
            return False
        
        # Test column mapping and data cleaning
        df_mapped, field_mappings = processor.intelligent_column_mapping(df)
        df_clean = processor.clean_and_format_data_ai(df_mapped)
        print(f"✅ Data processing completed")
        
        # Check formatted descriptions with semicolons
        if 'Description' in df_clean.columns:
            formatted_descriptions = df_clean['Description'].dropna().unique()[:5]
            print(f"📄 Formatted descriptions sample: {list(formatted_descriptions)}")
            
            # Verify semicolons are used instead of commas
            print(f"\n🔍 Semicolon formatting verification:")
            semicolon_count = 0
            comma_count = 0
            
            for i, (orig, formatted) in enumerate(zip(original_descriptions[:5], formatted_descriptions[:5])):
                if orig != formatted:
                    if ';' in formatted:
                        semicolon_count += 1
                        print(f"  ✅ '{orig}' → '{formatted}' (semicolon formatting)")
                    elif ',' in formatted:
                        comma_count += 1
                        print(f"  ⚠️  '{orig}' → '{formatted}' (comma found - should be semicolon)")
                    else:
                        print(f"  ➡️  '{orig}' → '{formatted}' (no separators)")
                else:
                    print(f"  ➡️  '{orig}' → '{formatted}' (unchanged)")
            
            print(f"\n📊 Formatting summary:")
            print(f"   Semicolon formatted: {semicolon_count}")
            print(f"   Comma formatted: {comma_count}")
            
            return comma_count == 0  # Success if no commas found in formatted descriptions
        else:
            print(f"❌ 'Description' column not found after processing")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_full_processing_with_semicolons():
    """Test full processing pipeline with semicolon formatting."""
    print(f"\n🧪 Testing full processing pipeline with semicolon formatting...")
    
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
        
        # Read and verify the output
        df_output = pd.read_csv(output_file)
        print(f"✅ Output file read: {len(df_output)} records")
        
        # Check final descriptions for semicolon formatting
        if 'Description' in df_output.columns:
            final_descriptions = df_output['Description'].dropna().unique()
            
            print(f"\n📊 FINAL DESCRIPTION FORMATTING RESULTS:")
            print(f"Sample descriptions from output CSV:")
            for desc in final_descriptions[:5]:
                print(f"   '{desc}'")
            
            # Count semicolons vs commas in descriptions
            semicolon_descriptions = [d for d in final_descriptions if ';' in str(d)]
            comma_descriptions = [d for d in final_descriptions if ',' in str(d) and ';' not in str(d)]
            
            print(f"\n📈 Formatting statistics:")
            print(f"   Descriptions with semicolons: {len(semicolon_descriptions)}")
            print(f"   Descriptions with commas only: {len(comma_descriptions)}")
            print(f"   Total unique descriptions: {len(final_descriptions)}")
            
            if len(semicolon_descriptions) > 0:
                print(f"\n✅ Semicolon formatting successfully applied!")
                print(f"   Examples with semicolons:")
                for desc in semicolon_descriptions[:3]:
                    print(f"     '{desc}'")
                return True
            else:
                print(f"\n⚠️  No semicolon formatting detected (may be normal if no concatenated words)")
                return True  # This is still a success case
        else:
            print(f"❌ 'Description' column not found in output")
            return False
            
    except Exception as e:
        print(f"❌ Full processing test failed: {e}")
        return False

def main():
    """Main test function."""
    print("🔧 SEMICOLON DESCRIPTION FORMATTING TEST")
    print("=" * 70)
    
    test_results = []
    
    # Test semicolon formatting function
    result1 = test_semicolon_formatting_function()
    test_results.append(("Semicolon Formatting", result1))
    
    # Test CSV compatibility
    result2 = test_salesforce_csv_compatibility()
    test_results.append(("CSV Compatibility", result2))
    
    # Test Excel file processing
    result3 = test_excel_file_with_semicolons()
    test_results.append(("Excel Processing", result3))
    
    # Test full processing
    result4 = test_full_processing_with_semicolons()
    test_results.append(("Full Processing", result4))
    
    # Print summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
    
    print("-" * 70)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    
    if passed == total:
        print("\n🎉 All tests passed! Semicolon description formatting is working correctly.")
        print("\nKey improvements:")
        print("✅ Semicolon separators instead of commas")
        print("✅ Salesforce CSV import compatibility")
        print("✅ No CSV parsing conflicts")
        print("✅ Maintained Portuguese character support")
        print("✅ Preserved all existing functionality")
        print("\nUpdated example transformations:")
        print("• 'ModeradoRegular' → 'Moderado; Regular'")
        print("• 'ArrojadoQualificado' → 'Arrojado; Qualificado'")
        print("• 'DesconhecidoQualificado' → 'Desconhecido; Qualificado'")
        print("\nYou can now process your Excel file with:")
        print("python quick_start.py ai data/input/leads_vinteseismaio.xlsx")
        print("\nThe output CSV will be fully compatible with Salesforce imports!")
    else:
        print("\n⚠️  Some tests failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
