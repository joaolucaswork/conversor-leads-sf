#!/usr/bin/env python3
"""
Test script for Salesforce field mapping functionality.

This script tests the field mapping solution that resolves the "LastName" vs "Last Name" 
field mismatch between processed lead data and Salesforce Lead object requirements.
"""

import sys
import os
import pandas as pd
import json

# Add the core directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

def test_field_mapping():
    """Test the field mapping functionality."""
    print("🧪 Testing Salesforce Field Mapping Solution")
    print("=" * 60)
    
    try:
        from salesforce_field_mapper import SalesforceFieldMapper
        
        # Initialize the field mapper
        mapper = SalesforceFieldMapper()
        print("✅ Field mapper initialized successfully")
        
        # Create test data that matches our processed lead format
        test_data = {
            'Last Name': ['João Silva', 'Maria Santos', 'Pedro Costa'],
            'Telefone Adcional': ['+55 11 99999-1111', '+55 21 88888-2222', '+55 31 77777-3333'],
            'Phone': ['+55 11 1234-5678', '+55 21 2345-6789', '+55 31 3456-7890'],
            'Email': ['joao@email.com', 'maria@email.com', 'pedro@email.com'],
            'Description': ['Lead interessado; Patrimônio alto', 'Cliente potencial; Moderado', 'Prospect qualificado; Regular'],
            'Patrimônio Financeiro': [2500000, 1800000, 1200000],
            'Tipo': ['Pessoa Física', 'Pessoa Física', 'Pessoa Física'],
            'State/Province': ['SP', 'RJ', 'MG'],
            'OwnerId': ['guic', 'cmilfont', 'ctint'],
            'maisdeMilhao__c': [1, 1, 1]
        }
        
        df = pd.DataFrame(test_data)
        print(f"📊 Created test DataFrame with {len(df)} records")
        print(f"📋 Original columns: {list(df.columns)}")
        
        # Test field mapping for Lead object
        print("\n🔄 Testing field mapping for Lead object...")
        df_mapped, mapping_info = mapper.map_dataframe_fields(df, 'Lead')
        
        print(f"✅ Field mapping completed successfully")
        print(f"📈 Mapping results:")
        print(f"   • Mapped fields: {mapping_info['mapped_fields']}")
        print(f"   • Unmapped fields: {len(mapping_info['unmapped_fields'])}")
        print(f"   • Missing required: {len(mapping_info['missing_required_fields'])}")
        
        print(f"\n📋 Final columns after mapping: {list(df_mapped.columns)}")
        
        # Verify the critical mapping: "Last Name" → "LastName"
        if 'LastName' in df_mapped.columns:
            print("✅ CRITICAL SUCCESS: 'Last Name' correctly mapped to 'LastName'")
        else:
            print("❌ CRITICAL FAILURE: 'Last Name' not mapped to 'LastName'")
            return False
        
        # Check mapping details
        print(f"\n🔍 Detailed mapping information:")
        for source, target in mapping_info['mapping_details'].items():
            print(f"   • '{source}' → '{target}'")
        
        if mapping_info['unmapped_fields']:
            print(f"\n⚠️  Unmapped fields: {mapping_info['unmapped_fields']}")
        
        if mapping_info['missing_required_fields']:
            print(f"\n❌ Missing required fields: {mapping_info['missing_required_fields']}")
            return False
        else:
            print(f"\n✅ All required fields present after mapping")
        
        # Test validation
        print(f"\n🔍 Testing field validation...")
        validation_result = mapper.validate_field_mapping(df, 'Lead')
        
        if validation_result['valid']:
            print("✅ Field validation passed")
        else:
            print(f"❌ Field validation failed: {validation_result['validation_errors']}")
            return False
        
        # Test with Contact object
        print(f"\n🔄 Testing field mapping for Contact object...")
        df_contact, contact_mapping = mapper.map_dataframe_fields(df, 'Contact')
        print(f"✅ Contact mapping completed: {contact_mapping['mapped_fields']} fields mapped")
        
        # Test field suggestions
        print(f"\n💡 Testing field suggestions...")
        suggestions = mapper.get_field_suggestions(df, 'Lead')
        if suggestions:
            print(f"📝 Field suggestions found: {len(suggestions)}")
            for field, suggestion in suggestions.items():
                print(f"   • {field}: {suggestion}")
        else:
            print("ℹ️  No field suggestions needed (all fields mapped)")
        
        print(f"\n🎉 All tests passed successfully!")
        print(f"✅ The field mapping solution correctly resolves the 'LastName' vs 'Last Name' issue")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure the salesforce_field_mapper.py file exists in the core directory")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_configuration_loading():
    """Test configuration file loading."""
    print(f"\n🔧 Testing configuration loading...")
    
    try:
        from salesforce_field_mapper import SalesforceFieldMapper
        
        # Test with default config
        mapper = SalesforceFieldMapper()
        
        # Check supported objects
        objects = mapper.get_supported_objects()
        print(f"📋 Supported objects: {objects}")
        
        if 'Lead' in objects:
            print("✅ Lead object configuration found")
        else:
            print("❌ Lead object configuration missing")
            return False
        
        # Get Lead field info
        lead_info = mapper.get_object_field_info('Lead')
        if 'field_mappings' in lead_info:
            print(f"✅ Lead field mappings loaded: {len(lead_info['field_mappings'])} mappings")
        else:
            print("❌ Lead field mappings not found")
            return False
        
        # Check for the critical mapping
        mappings = lead_info['field_mappings']
        if mappings.get('Last Name') == 'LastName':
            print("✅ Critical mapping 'Last Name' → 'LastName' found in configuration")
        else:
            print("❌ Critical mapping 'Last Name' → 'LastName' missing from configuration")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Salesforce Field Mapping Tests")
    print("=" * 60)
    
    # Test configuration loading
    config_success = test_configuration_loading()
    
    # Test field mapping functionality
    mapping_success = test_field_mapping()
    
    print("\n" + "=" * 60)
    if config_success and mapping_success:
        print("🎉 ALL TESTS PASSED! Field mapping solution is working correctly.")
        print("✅ The 'LastName' vs 'Last Name' issue has been resolved.")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED! Please check the errors above.")
        sys.exit(1)
