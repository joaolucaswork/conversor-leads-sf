#!/usr/bin/env python3
"""
Test script to verify that the "Atribuir" column mapping and lead distribution preservation works correctly.
"""

import sys
import os
import pandas as pd
from pathlib import Path

def test_atribuir_mapping():
    """Test that 'Atribuir' maps to 'OwnerId'."""
    print("🧪 Testing 'Atribuir' column mapping...")
    
    try:
        sys.path.append('core')
        from ai_field_mapper import AIFieldMapper
        
        # Initialize mapper
        config = {"ai_processing": {"enabled": False, "confidence_threshold": 80.0}}
        mapper = AIFieldMapper(config)
        
        # Test with 'Atribuir' column
        test_columns = ['Atribuir']
        mappings = mapper._rule_based_mapping(test_columns)
        
        print(f"Testing column: 'Atribuir'")
        
        for mapping in mappings:
            status = "✅" if mapping.target_field == "OwnerId" else "❌"
            print(f"  {status} '{mapping.source_field}' → '{mapping.target_field}' (confidence: {mapping.confidence}%)")
            print(f"      Reasoning: {mapping.reasoning}")
        
        # Check if mapping is correct
        atribuir_mapping = mappings[0] if mappings else None
        if atribuir_mapping and atribuir_mapping.target_field == "OwnerId":
            print(f"✅ 'Atribuir' correctly mapped to 'OwnerId'")
            return True
        else:
            print(f"❌ 'Atribuir' not mapped correctly")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_complete_excel_mapping():
    """Test complete Excel file mapping including Atribuir."""
    print(f"\n🧪 Testing complete Excel file mapping...")
    
    try:
        sys.path.append('core')
        from ai_field_mapper import AIFieldMapper
        
        # Initialize mapper
        config = {"ai_processing": {"enabled": False, "confidence_threshold": 80.0}}
        mapper = AIFieldMapper(config)
        
        # Test with all Excel columns
        excel_columns = ['Lead', 'Tel. Fixo', 'Celular', 'E-mail', 'Descrição', 'Volume Aproximado', 'Tipo', 'Estado', 'Atribuir']
        mappings = mapper._rule_based_mapping(excel_columns)
        
        print(f"Testing all Excel columns: {excel_columns}")
        
        print(f"\n📋 COMPLETE MAPPING RESULTS:")
        mapped_count = 0
        atribuir_mapped = False
        
        for mapping in mappings:
            status = "✅" if mapping.target_field != "UNMAPPED" else "❌"
            print(f"  {status} {mapping.source_field} → {mapping.target_field} (confidence: {mapping.confidence}%)")
            
            if mapping.target_field != "UNMAPPED":
                mapped_count += 1
            
            if mapping.source_field == "Atribuir" and mapping.target_field == "OwnerId":
                atribuir_mapped = True
        
        print(f"\n📊 Summary: {mapped_count}/{len(excel_columns)} columns mapped")
        print(f"🎯 Atribuir mapping: {'✅ SUCCESS' if atribuir_mapped else '❌ FAILED'}")
        
        return mapped_count == len(excel_columns) and atribuir_mapped
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_lead_distribution_preservation():
    """Test that original lead assignments are preserved."""
    print(f"\n🧪 Testing lead distribution preservation...")
    
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
        
        # Read the Excel file to check original assignments
        df_original = pd.read_excel(excel_file)
        print(f"✅ Read Excel file: {len(df_original)} records")
        
        if 'Atribuir' in df_original.columns:
            original_assignments = df_original['Atribuir'].value_counts().to_dict()
            print(f"📊 Original assignments in Excel:")
            for alias, count in original_assignments.items():
                print(f"   {alias}: {count} leads")
        else:
            print(f"❌ 'Atribuir' column not found in Excel file")
            return False
        
        # Test column mapping
        df_mapped, field_mappings = processor.intelligent_column_mapping(df_original)
        print(f"✅ Column mapping completed")
        
        # Check if Atribuir was mapped to OwnerId
        atribuir_mapping = next((m for m in field_mappings if m.source_field == "Atribuir"), None)
        if atribuir_mapping and atribuir_mapping.target_field == "OwnerId":
            print(f"✅ 'Atribuir' successfully mapped to 'OwnerId'")
        else:
            print(f"❌ 'Atribuir' not mapped to 'OwnerId'")
            return False
        
        # Test lead distribution (should preserve original assignments)
        df_distributed = processor.distribute_leads(df_mapped)
        
        if 'OwnerId' in df_distributed.columns:
            final_assignments = df_distributed['OwnerId'].value_counts().to_dict()
            print(f"📊 Final assignments after processing:")
            for alias, count in final_assignments.items():
                if alias and alias != '':
                    print(f"   {alias}: {count} leads")
            
            # Compare original vs final
            print(f"\n🔍 Assignment preservation check:")
            preserved = True
            for alias, original_count in original_assignments.items():
                final_count = final_assignments.get(alias, 0)
                if original_count == final_count:
                    print(f"   ✅ {alias}: {original_count} → {final_count} (preserved)")
                else:
                    print(f"   ❌ {alias}: {original_count} → {final_count} (changed)")
                    preserved = False
            
            return preserved
        else:
            print(f"❌ 'OwnerId' column not found after processing")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_full_processing_with_preservation():
    """Test full processing pipeline with assignment preservation."""
    print(f"\n🧪 Testing full processing pipeline with assignment preservation...")
    
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
        
        # Get original assignments for comparison
        df_original = pd.read_excel(excel_file)
        original_assignments = df_original['Atribuir'].value_counts().to_dict() if 'Atribuir' in df_original.columns else {}
        
        # Process the file
        output_file = processor.process_file_ai(excel_file)
        print(f"✅ File processed successfully: {output_file}")
        
        # Read and verify the output
        df_output = pd.read_csv(output_file)
        print(f"✅ Output file read: {len(df_output)} records")
        
        # Check final assignments
        if 'OwnerId' in df_output.columns:
            final_assignments = df_output['OwnerId'].value_counts().to_dict()
            
            print(f"\n📊 ASSIGNMENT COMPARISON:")
            print(f"Original (Excel 'Atribuir'):")
            for alias, count in original_assignments.items():
                print(f"   {alias}: {count}")
            
            print(f"Final (CSV 'OwnerId'):")
            for alias, count in final_assignments.items():
                if alias and alias != '':
                    print(f"   {alias}: {count}")
            
            # Check if assignments were preserved
            assignments_preserved = True
            for alias, original_count in original_assignments.items():
                final_count = final_assignments.get(alias, 0)
                if original_count != final_count:
                    assignments_preserved = False
                    break
            
            if assignments_preserved:
                print(f"\n✅ Original lead assignments successfully preserved!")
                return True
            else:
                print(f"\n❌ Lead assignments were not preserved correctly")
                return False
        else:
            print(f"❌ 'OwnerId' column not found in output")
            return False
            
    except Exception as e:
        print(f"❌ Full processing test failed: {e}")
        return False

def main():
    """Main test function."""
    print("🔧 ATRIBUIR MAPPING AND ASSIGNMENT PRESERVATION TEST")
    print("=" * 70)
    
    test_results = []
    
    # Test Atribuir mapping
    result1 = test_atribuir_mapping()
    test_results.append(("Atribuir Mapping", result1))
    
    # Test complete Excel mapping
    result2 = test_complete_excel_mapping()
    test_results.append(("Complete Excel Mapping", result2))
    
    # Test lead distribution preservation
    result3 = test_lead_distribution_preservation()
    test_results.append(("Assignment Preservation", result3))
    
    # Test full processing
    result4 = test_full_processing_with_preservation()
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
        print("\n🎉 All tests passed! Atribuir mapping and assignment preservation are working correctly.")
        print("\nKey fixes implemented:")
        print("✅ 'Atribuir' → 'OwnerId' mapping")
        print("✅ Original lead assignments preserved")
        print("✅ No automatic distribution override")
        print("✅ All Excel columns properly mapped")
        print("\nYou can now process your Excel file with:")
        print("python quick_start.py ai data/input/leads_vinteseismaio.xlsx")
    else:
        print("\n⚠️  Some tests failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
