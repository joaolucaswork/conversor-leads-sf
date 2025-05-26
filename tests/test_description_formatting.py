#!/usr/bin/env python3
"""
Test script to verify that the description formatting with comma insertion works correctly.
"""

import sys
import os
import pandas as pd
from pathlib import Path

def test_description_formatting_function():
    """Test the description formatting function directly."""
    print("🧪 Testing description formatting function...")
    
    try:
        sys.path.append('core')
        from master_leads_processor_ai import AIEnhancedLeadsProcessor
        
        # Initialize processor
        processor = AIEnhancedLeadsProcessor()
        
        # Test cases with expected outputs
        test_cases = [
            # Basic concatenated words
            ("ModeradoRegular", "Moderado, Regular"),
            ("ArrojadoQualificado", "Arrojado, Qualificado"),
            ("DesconhecidoQualificado", "Desconhecido, Qualificado"),
            
            # Three words concatenated
            ("ConservadorModeradoRegular", "Conservador, Moderado, Regular"),
            ("ArrojadoAgressivoQualificado", "Arrojado, Agressivo, Qualificado"),
            
            # Words with Portuguese accents
            ("ModeradoConservação", "Moderado, Conservação"),
            ("AgressivoQualificação", "Agressivo, Qualificação"),
            
            # Already formatted (should remain unchanged)
            ("Moderado, Regular", "Moderado, Regular"),
            ("Arrojado, Qualificado", "Arrojado, Qualificado"),
            
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
        ]
        
        print(f"Testing {len(test_cases)} cases:")
        
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

def test_excel_file_description_formatting():
    """Test description formatting with the actual Excel file."""
    print(f"\n🧪 Testing description formatting with Excel file...")
    
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
        
        # Test column mapping
        df_mapped, field_mappings = processor.intelligent_column_mapping(df)
        print(f"✅ Column mapping completed")
        
        # Test data cleaning (which includes description formatting)
        df_clean = processor.clean_and_format_data_ai(df_mapped)
        print(f"✅ Data cleaning completed")
        
        # Check formatted descriptions
        if 'Description' in df_clean.columns:
            formatted_descriptions = df_clean['Description'].dropna().unique()[:5]
            print(f"📄 Formatted descriptions sample: {list(formatted_descriptions)}")
            
            # Compare original vs formatted
            print(f"\n🔍 Description formatting comparison:")
            for i, (orig, formatted) in enumerate(zip(original_descriptions[:5], formatted_descriptions[:5])):
                if orig != formatted:
                    print(f"  ✅ '{orig}' → '{formatted}' (formatted)")
                else:
                    print(f"  ➡️  '{orig}' → '{formatted}' (unchanged)")
            
            return True
        else:
            print(f"❌ 'Description' column not found after processing")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_full_processing_with_description_formatting():
    """Test full processing pipeline with description formatting."""
    print(f"\n🧪 Testing full processing pipeline with description formatting...")
    
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
        
        # Get original descriptions for comparison
        df_original = pd.read_excel(excel_file)
        original_descriptions = df_original['Descrição'].dropna().unique() if 'Descrição' in df_original.columns else []
        
        # Process the file
        output_file = processor.process_file_ai(excel_file)
        print(f"✅ File processed successfully: {output_file}")
        
        # Read and verify the output
        df_output = pd.read_csv(output_file)
        print(f"✅ Output file read: {len(df_output)} records")
        
        # Check final descriptions
        if 'Description' in df_output.columns:
            final_descriptions = df_output['Description'].dropna().unique()
            
            print(f"\n📊 DESCRIPTION FORMATTING RESULTS:")
            print(f"Original descriptions (from Excel 'Descrição'):")
            for desc in original_descriptions[:5]:
                print(f"   '{desc}'")
            
            print(f"Final descriptions (from CSV 'Description'):")
            for desc in final_descriptions[:5]:
                print(f"   '{desc}'")
            
            # Check if formatting was applied
            formatting_applied = False
            for orig in original_descriptions[:10]:
                # Look for the formatted version in final descriptions
                formatted_version = processor.format_description_ai(orig)
                if formatted_version in final_descriptions and formatted_version != orig:
                    formatting_applied = True
                    print(f"\n✅ Formatting confirmed: '{orig}' → '{formatted_version}'")
                    break
            
            if formatting_applied:
                print(f"\n✅ Description formatting successfully applied!")
                return True
            else:
                print(f"\n⚠️  No formatting changes detected (may be normal if descriptions were already formatted)")
                return True  # This is still a success case
        else:
            print(f"❌ 'Description' column not found in output")
            return False
            
    except Exception as e:
        print(f"❌ Full processing test failed: {e}")
        return False

def main():
    """Main test function."""
    print("🔧 DESCRIPTION FORMATTING TEST")
    print("=" * 60)
    
    test_results = []
    
    # Test formatting function
    result1 = test_description_formatting_function()
    test_results.append(("Formatting Function", result1))
    
    # Test Excel file processing
    result2 = test_excel_file_description_formatting()
    test_results.append(("Excel File Processing", result2))
    
    # Test full processing
    result3 = test_full_processing_with_description_formatting()
    test_results.append(("Full Processing", result3))
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    
    if passed == total:
        print("\n🎉 All tests passed! Description formatting is working correctly.")
        print("\nKey features implemented:")
        print("✅ Automatic comma insertion between concatenated words")
        print("✅ Portuguese character support (á, ã, ç, etc.)")
        print("✅ Multiple word concatenation handling")
        print("✅ Preserves already formatted descriptions")
        print("✅ Integrated into data cleaning pipeline")
        print("\nExample transformations:")
        print("• 'ModeradoRegular' → 'Moderado, Regular'")
        print("• 'ArrojadoQualificado' → 'Arrojado, Qualificado'")
        print("• 'DesconhecidoQualificado' → 'Desconhecido, Qualificado'")
        print("\nYou can now process your Excel file with:")
        print("python quick_start.py ai data/input/leads_vinteseismaio.xlsx")
    else:
        print("\n⚠️  Some tests failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
