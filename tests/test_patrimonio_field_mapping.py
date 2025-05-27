#!/usr/bin/env python3
"""
Test script for Patrimônio Financeiro field mapping correction.

This script tests that "Patrimônio Financeiro" is correctly mapped to 
"PatrimonioFinanceiro_Lead__c" instead of "AnnualRevenue".
"""

import sys
import os
import pandas as pd

# Add the core directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

def test_patrimonio_field_mapping():
    """Test that Patrimônio Financeiro maps to the correct custom field."""
    print("🧪 Testing Patrimônio Financeiro Field Mapping Correction")
    print("=" * 70)
    
    try:
        from salesforce_field_mapper import SalesforceFieldMapper
        
        # Initialize the field mapper
        mapper = SalesforceFieldMapper()
        print("✅ Field mapper initialized successfully")
        
        # Create test data with Patrimônio Financeiro field
        test_data = {
            'Last Name': ['João Silva', 'Maria Santos'],
            'Telefone Adcional': ['+55 11 99999-1111', '+55 21 88888-2222'],
            'Phone': ['+55 11 1234-5678', '+55 21 2345-6789'],
            'Email': ['joao@email.com', 'maria@email.com'],
            'Description': ['Lead interessado; Patrimônio alto', 'Cliente potencial; Moderado'],
            'Patrimônio Financeiro': [2500000, 1800000],  # This is the field we're testing
            'Tipo': ['Pessoa Física', 'Pessoa Física'],
            'State/Province': ['SP', 'RJ'],
            'OwnerId': ['guic', 'cmilfont'],
            'maisdeMilhao__c': [1, 1]
        }
        
        df = pd.DataFrame(test_data)
        print(f"📊 Created test DataFrame with {len(df)} records")
        print(f"📋 Original columns: {list(df.columns)}")
        print(f"💰 Patrimônio Financeiro values: {df['Patrimônio Financeiro'].tolist()}")
        
        # Test field mapping for Lead object
        print("\n🔄 Testing field mapping for Lead object...")
        df_mapped, mapping_info = mapper.map_dataframe_fields(df, 'Lead')
        
        print(f"✅ Field mapping completed successfully")
        print(f"📋 Final columns after mapping: {list(df_mapped.columns)}")
        
        # Critical test: Check that Patrimônio Financeiro is mapped to PatrimonioFinanceiro_Lead__c
        if 'PatrimonioFinanceiro_Lead__c' in df_mapped.columns:
            print("✅ CRITICAL SUCCESS: 'Patrimônio Financeiro' correctly mapped to 'PatrimonioFinanceiro_Lead__c'")
            
            # Verify the data values are preserved
            original_values = df['Patrimônio Financeiro'].tolist()
            mapped_values = df_mapped['PatrimonioFinanceiro_Lead__c'].tolist()
            
            if original_values == mapped_values:
                print(f"✅ Data integrity verified: Values preserved during mapping")
                print(f"   Original: {original_values}")
                print(f"   Mapped:   {mapped_values}")
            else:
                print(f"❌ Data integrity issue: Values changed during mapping")
                print(f"   Original: {original_values}")
                print(f"   Mapped:   {mapped_values}")
                return False
                
        else:
            print("❌ CRITICAL FAILURE: 'Patrimônio Financeiro' not mapped to 'PatrimonioFinanceiro_Lead__c'")
            print(f"Available columns: {list(df_mapped.columns)}")
            return False
        
        # Verify that AnnualRevenue is NOT present (old incorrect mapping)
        if 'AnnualRevenue' in df_mapped.columns:
            print("❌ ERROR: 'AnnualRevenue' field found - old mapping still active")
            return False
        else:
            print("✅ Confirmed: 'AnnualRevenue' field not present (old mapping removed)")
        
        # Check mapping details
        print(f"\n🔍 Detailed mapping information:")
        for source, target in mapping_info['mapping_details'].items():
            if source == 'Patrimônio Financeiro':
                print(f"   • '{source}' → '{target}' ✅ CRITICAL MAPPING")
            else:
                print(f"   • '{source}' → '{target}'")
        
        # Verify custom fields configuration
        lead_config = mapper.get_object_field_info('Lead')
        custom_fields = lead_config.get('custom_fields', [])
        
        if 'PatrimonioFinanceiro_Lead__c' in custom_fields:
            print(f"✅ Custom field 'PatrimonioFinanceiro_Lead__c' properly configured")
        else:
            print(f"❌ Custom field 'PatrimonioFinanceiro_Lead__c' missing from configuration")
            return False
        
        if 'maisdeMilhao__c' in custom_fields:
            print(f"✅ Custom field 'maisdeMilhao__c' still properly configured")
        else:
            print(f"❌ Custom field 'maisdeMilhao__c' missing from configuration")
            return False
        
        # Test data transformations configuration
        transformations = lead_config.get('data_transformations', {})
        patrimonio_transform = transformations.get('Patrimônio Financeiro', {})
        
        if patrimonio_transform.get('target_field') == 'PatrimonioFinanceiro_Lead__c':
            print(f"✅ Data transformation correctly configured for PatrimonioFinanceiro_Lead__c")
        else:
            print(f"❌ Data transformation incorrectly configured: {patrimonio_transform}")
            return False
        
        print(f"\n🎉 All tests passed successfully!")
        print(f"✅ Patrimônio Financeiro field mapping correction verified")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_configuration_consistency():
    """Test that the configuration is internally consistent."""
    print(f"\n🔧 Testing configuration consistency...")
    
    try:
        from salesforce_field_mapper import SalesforceFieldMapper
        
        mapper = SalesforceFieldMapper()
        lead_config = mapper.get_object_field_info('Lead')
        
        # Check field mappings
        field_mappings = lead_config.get('field_mappings', {})
        custom_fields = lead_config.get('custom_fields', [])
        optional_fields = lead_config.get('optional_fields', [])
        
        # Verify PatrimonioFinanceiro_Lead__c is in custom_fields
        patrimonio_target = field_mappings.get('Patrimônio Financeiro')
        if patrimonio_target == 'PatrimonioFinanceiro_Lead__c':
            print(f"✅ Field mapping: 'Patrimônio Financeiro' → 'PatrimonioFinanceiro_Lead__c'")
        else:
            print(f"❌ Incorrect field mapping: 'Patrimônio Financeiro' → '{patrimonio_target}'")
            return False
        
        if 'PatrimonioFinanceiro_Lead__c' in custom_fields:
            print(f"✅ Custom field 'PatrimonioFinanceiro_Lead__c' listed in custom_fields")
        else:
            print(f"❌ Custom field 'PatrimonioFinanceiro_Lead__c' missing from custom_fields")
            return False
        
        # Verify AnnualRevenue is not in optional_fields anymore
        if 'AnnualRevenue' not in optional_fields:
            print(f"✅ 'AnnualRevenue' correctly removed from optional_fields")
        else:
            print(f"❌ 'AnnualRevenue' still present in optional_fields")
            return False
        
        print(f"✅ Configuration consistency verified")
        return True
        
    except Exception as e:
        print(f"❌ Configuration consistency test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Patrimônio Financeiro Field Mapping Tests")
    print("=" * 70)
    
    # Test the corrected field mapping
    mapping_success = test_patrimonio_field_mapping()
    
    # Test configuration consistency
    config_success = test_configuration_consistency()
    
    print("\n" + "=" * 70)
    if mapping_success and config_success:
        print("🎉 ALL TESTS PASSED! Patrimônio Financeiro field mapping correction verified.")
        print("✅ Financial data will now be sent to PatrimonioFinanceiro_Lead__c custom field.")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED! Please check the errors above.")
        sys.exit(1)
