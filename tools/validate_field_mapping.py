#!/usr/bin/env python3
"""
Field Mapping Validation Tool

This tool validates that processed lead files will work correctly with the new
Salesforce field mapping solution before attempting actual uploads.
"""

import sys
import os
import pandas as pd
import argparse
from pathlib import Path

# Add the core directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

def validate_file_mapping(file_path: str, salesforce_object: str = 'Lead') -> bool:
    """
    Validate that a processed file can be properly mapped for Salesforce upload.
    
    Args:
        file_path: Path to the processed CSV file
        salesforce_object: Target Salesforce object (Lead, Contact, Account)
        
    Returns:
        bool: True if validation passes, False otherwise
    """
    print(f"🔍 Validating field mapping for: {file_path}")
    print(f"📋 Target Salesforce object: {salesforce_object}")
    print("-" * 60)
    
    try:
        from salesforce_field_mapper import SalesforceFieldMapper
        
        # Initialize field mapper
        mapper = SalesforceFieldMapper()
        
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            return False
        
        # Read the CSV file
        try:
            df = pd.read_csv(file_path)
            print(f"✅ Successfully read {len(df)} records from file")
        except Exception as e:
            print(f"❌ Failed to read CSV file: {e}")
            return False
        
        if len(df) == 0:
            print(f"⚠️  File is empty - no records to validate")
            return True
        
        print(f"📊 Original columns ({len(df.columns)}): {list(df.columns)}")
        
        # Validate field mapping
        validation_result = mapper.validate_field_mapping(df, salesforce_object)
        
        print(f"\n🔍 Field Mapping Validation Results:")
        print(f"   • Valid: {'✅ Yes' if validation_result['valid'] else '❌ No'}")
        print(f"   • Mappable fields: {len(validation_result['mappable_fields'])}")
        print(f"   • Unmappable fields: {len(validation_result['unmappable_fields'])}")
        print(f"   • Required fields: {len(validation_result['required_fields'])}")
        print(f"   • Missing required: {len(validation_result['missing_required_fields'])}")
        
        # Show mappable fields
        if validation_result['mappable_fields']:
            print(f"\n✅ Mappable fields:")
            for source, target in validation_result['mappable_fields']:
                print(f"   • '{source}' → '{target}'")
        
        # Show unmappable fields
        if validation_result['unmappable_fields']:
            print(f"\n⚠️  Unmappable fields:")
            for field in validation_result['unmappable_fields']:
                print(f"   • '{field}' (will be ignored)")
        
        # Show missing required fields
        if validation_result['missing_required_fields']:
            print(f"\n❌ Missing required fields:")
            for field in validation_result['missing_required_fields']:
                print(f"   • '{field}' (REQUIRED for {salesforce_object})")
        
        # Get field suggestions for unmappable fields
        if validation_result['unmappable_fields']:
            print(f"\n💡 Field suggestions:")
            suggestions = mapper.get_field_suggestions(df, salesforce_object)
            if suggestions:
                for field, suggestion in suggestions.items():
                    confidence = suggestion.get('confidence', 'unknown')
                    mapping = suggestion.get('suggested_mapping', 'unknown')
                    print(f"   • '{field}' → '{mapping}' (confidence: {confidence})")
            else:
                print(f"   • No suggestions available")
        
        # Test actual mapping
        print(f"\n🔄 Testing actual field mapping...")
        try:
            df_mapped, mapping_info = mapper.map_dataframe_fields(df, salesforce_object)
            print(f"✅ Field mapping successful")
            print(f"📋 Final columns ({len(df_mapped.columns)}): {list(df_mapped.columns)}")
            
            # Check for the critical LastName field
            if salesforce_object == 'Lead' and 'LastName' in df_mapped.columns:
                print(f"✅ CRITICAL: 'LastName' field present (required for Lead)")
            elif salesforce_object == 'Lead':
                print(f"❌ CRITICAL: 'LastName' field missing (required for Lead)")
                
        except Exception as e:
            print(f"❌ Field mapping failed: {e}")
            return False
        
        print(f"\n" + "=" * 60)
        if validation_result['valid']:
            print(f"🎉 VALIDATION PASSED: File is ready for Salesforce upload")
            return True
        else:
            print(f"❌ VALIDATION FAILED: File needs corrections before upload")
            return False
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure the salesforce_field_mapper.py file exists in the core directory")
        return False
    except Exception as e:
        print(f"❌ Validation failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(
        description='Validate field mapping for Salesforce uploads',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python validate_field_mapping.py processed_leads.csv
  python validate_field_mapping.py data/output/leads_processed.csv --object Contact
  python validate_field_mapping.py *.csv --object Lead
        """
    )
    
    parser.add_argument('files', nargs='+', help='CSV file(s) to validate')
    parser.add_argument('--object', '-o', default='Lead', 
                       choices=['Lead', 'Contact', 'Account'],
                       help='Target Salesforce object (default: Lead)')
    
    args = parser.parse_args()
    
    print("🚀 Salesforce Field Mapping Validation Tool")
    print("=" * 60)
    
    all_valid = True
    
    for file_pattern in args.files:
        # Handle glob patterns
        if '*' in file_pattern or '?' in file_pattern:
            from glob import glob
            files = glob(file_pattern)
            if not files:
                print(f"⚠️  No files found matching pattern: {file_pattern}")
                continue
        else:
            files = [file_pattern]
        
        for file_path in files:
            if not validate_file_mapping(file_path, args.object):
                all_valid = False
            print()  # Add spacing between files
    
    print("=" * 60)
    if all_valid:
        print("🎉 ALL FILES VALIDATED SUCCESSFULLY")
        print("✅ All files are ready for Salesforce upload")
        sys.exit(0)
    else:
        print("❌ SOME FILES FAILED VALIDATION")
        print("⚠️  Please fix the issues above before uploading to Salesforce")
        sys.exit(1)

if __name__ == "__main__":
    main()
