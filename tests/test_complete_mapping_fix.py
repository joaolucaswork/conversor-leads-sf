#!/usr/bin/env python3
"""
Comprehensive test to verify both name and description mapping fixes work correctly.
"""

import sys
import os
import pandas as pd
from pathlib import Path

def test_all_column_mappings():
    """Test all column mappings from the Excel file."""
    print("🧪 Testing all column mappings...")
    
    try:
        sys.path.append('core')
        from ai_field_mapper import AIFieldMapper
        
        # Initialize mapper
        config = {"ai_processing": {"enabled": False, "confidence_threshold": 80.0}}
        mapper = AIFieldMapper(config)
        
        # Test with actual Excel column names
        excel_columns = ['Lead', 'Tel. Fixo', 'Celular', 'E-mail', 'Descrição', 'Volume Aproximado', 'Tipo', 'Estado', 'Atribuir']
        
        print(f"Testing columns: {excel_columns}")
        
        # Get mappings
        mappings = mapper._rule_based_mapping(excel_columns)
        
        print(f"\n📋 MAPPING RESULTS:")
        mapped_count = 0
        critical_mappings = {
            'Lead': 'Last Name',
            'Descrição': 'Description',
            'E-mail': 'Email',
            'Tel. Fixo': 'Phone',
            'Celular': 'Phone',
            'Volume Aproximado': 'Patrimônio Financeiro',
            'Estado': 'State/Province',
            'Tipo': 'Tipo'
        }
        
        for mapping in mappings:
            status = "✅" if mapping.target_field != "UNMAPPED" else "❌"
            print(f"  {status} {mapping.source_field} → {mapping.target_field} (confidence: {mapping.confidence}%)")
            
            if mapping.target_field != "UNMAPPED":
                mapped_count += 1
        
        print(f"\n📊 Summary: {mapped_count}/{len(excel_columns)} columns mapped")
        
        # Check critical mappings
        print(f"\n🔍 Critical mapping verification:")
        all_critical_ok = True
        for source, expected_target in critical_mappings.items():
            mapping = next((m for m in mappings if m.source_field == source), None)
            if mapping and mapping.target_field == expected_target:
                print(f"  ✅ {source} → {expected_target}")
            else:
                actual_target = mapping.target_field if mapping else "NOT_FOUND"
                print(f"  ❌ {source} → {actual_target} (expected: {expected_target})")
                all_critical_ok = False
        
        return all_critical_ok
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_excel_file_processing():
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
        
        # Test column mapping
        df_mapped, field_mappings = processor.intelligent_column_mapping(df)
        print(f"✅ Column mapping completed")
        print(f"   Mapped columns: {list(df_mapped.columns)}")
        
        # Check specific mappings
        checks = {
            'Last Name': 'Lead',
            'Description': 'Descrição',
            'Email': 'E-mail',
            'Phone': ['Tel. Fixo', 'Celular'],
            'State/Province': 'Estado'
        }
        
        print(f"\n🔍 Data verification:")
        all_checks_passed = True
        
        for target_col, source_info in checks.items():
            if target_col in df_mapped.columns:
                # Get sample data
                sample_data = df_mapped[target_col].dropna().head(3).tolist()
                
                if sample_data and any(str(x).strip() for x in sample_data if x):
                    print(f"  ✅ {target_col}: {sample_data}")
                else:
                    print(f"  ❌ {target_col}: Empty or no data")
                    all_checks_passed = False
            else:
                print(f"  ❌ {target_col}: Column not found")
                all_checks_passed = False
        
        return all_checks_passed
        
    except Exception as e:
        print(f"❌ Excel processing test failed: {e}")
        return False

def test_full_processing_pipeline():
    """Test the complete processing pipeline."""
    print(f"\n🧪 Testing complete processing pipeline...")
    
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
        
        # Check critical fields
        critical_fields = ['Last Name', 'Description', 'Email', 'Phone']
        
        print(f"\n📊 Output verification:")
        all_fields_ok = True
        
        for field in critical_fields:
            if field in df_output.columns:
                non_empty = df_output[field].dropna()
                non_empty = non_empty[non_empty.astype(str).str.strip() != '']
                
                if len(non_empty) > 0:
                    print(f"  ✅ {field}: {len(non_empty)} records with data")
                    print(f"      Sample: {non_empty.head(2).tolist()}")
                else:
                    print(f"  ❌ {field}: No data found")
                    all_fields_ok = False
            else:
                print(f"  ❌ {field}: Column missing")
                all_fields_ok = False
        
        return all_fields_ok
        
    except Exception as e:
        print(f"❌ Full processing test failed: {e}")
        return False

def main():
    """Main test function."""
    print("🔧 COMPLETE MAPPING FIX VERIFICATION")
    print("=" * 60)
    
    test_results = []
    
    # Test column mappings
    result1 = test_all_column_mappings()
    test_results.append(("Column Mappings", result1))
    
    # Test Excel processing
    result2 = test_excel_file_processing()
    test_results.append(("Excel Processing", result2))
    
    # Test full pipeline
    result3 = test_full_processing_pipeline()
    test_results.append(("Full Pipeline", result3))
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<20} {status}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    
    if passed == total:
        print("\n🎉 All tests passed! Both name and description mapping fixes are working correctly.")
        print("\nKey fixes implemented:")
        print("✅ 'Lead' → 'Last Name' mapping")
        print("✅ 'Descrição' → 'Description' mapping")
        print("✅ Duplicate phone field handling")
        print("✅ Portuguese character support")
        print("\nYou can now process your Excel file with:")
        print("python quick_start.py ai data/input/leads_vinteseismaio.xlsx")
    else:
        print("\n⚠️  Some tests failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
