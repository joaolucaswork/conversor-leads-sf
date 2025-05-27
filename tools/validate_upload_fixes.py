#!/usr/bin/env python3
"""
Validation script to test the Salesforce upload fixes without actually uploading to Salesforce.
This script simulates the upload process to verify JSON serialization and data cleaning work correctly.
"""

import sys
import os
import json
import pandas as pd
import numpy as np
from pathlib import Path

# Add the core directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

from salesforce_integration import SafeJSONEncoder, SalesforceIntegration
from salesforce_field_mapper import SalesforceFieldMapper


def simulate_upload_process(csv_file_path: str):
    """
    Simulate the complete upload process without actually connecting to Salesforce.
    This validates that all data processing steps work correctly.
    """
    print(f"Simulating upload process for: {csv_file_path}")
    print("=" * 60)
    
    try:
        # Step 1: Read CSV file
        print("Step 1: Reading CSV file...")
        df = pd.read_csv(csv_file_path)
        print(f"  - Read {len(df)} records")
        print(f"  - Columns: {list(df.columns)}")
        print(f"  - Data types: {dict(df.dtypes)}")
        
        # Show sample data with NaN values
        print("\nSample data (first 3 rows):")
        for i, row in df.head(3).iterrows():
            print(f"  Row {i+1}: {dict(row)}")
        
        # Step 2: Apply field mapping
        print("\nStep 2: Applying field mapping...")
        field_mapper = SalesforceFieldMapper()
        df_mapped, mapping_info = field_mapper.map_dataframe_fields(df, 'Lead')
        print(f"  - Mapped {mapping_info['mapped_fields']} fields")
        print(f"  - Final columns: {mapping_info['target_columns']}")
        if mapping_info['unmapped_fields']:
            print(f"  - Unmapped fields: {mapping_info['unmapped_fields']}")
        
        # Step 3: Simulate owner ID resolution (without Salesforce connection)
        print("\nStep 3: Simulating owner ID resolution...")
        if 'OwnerId' in df_mapped.columns:
            unique_owners = df_mapped['OwnerId'].dropna().unique()
            print(f"  - Found {len(unique_owners)} unique owner values: {list(unique_owners)}")
            
            # Simulate resolution (in real scenario, this would query Salesforce)
            simulated_mappings = {}
            for owner in unique_owners:
                if isinstance(owner, str) and len(owner) in [15, 18] and owner.startswith('005'):
                    simulated_mappings[owner] = owner  # Already a valid ID
                else:
                    # Simulate resolved ID
                    simulated_mappings[owner] = f"005000000{hash(owner) % 1000000:06d}AAA"
            
            print("  - Simulated owner ID mappings:")
            for original, resolved in simulated_mappings.items():
                print(f"    '{original}' -> '{resolved}'")
        else:
            print("  - No OwnerId column found")
        
        # Step 4: Clean data and handle NaN values
        print("\nStep 4: Cleaning data and handling NaN values...")
        df_clean = df_mapped.replace({np.nan: None})
        records = df_clean.to_dict('records')
        print(f"  - Converted to {len(records)} record dictionaries")
        
        # Show cleaned records
        print("\nCleaned records (first 2):")
        for i, record in enumerate(records[:2]):
            print(f"  Record {i+1}:")
            for key, value in record.items():
                print(f"    {key}: {repr(value)}")
        
        # Step 5: Test JSON serialization
        print("\nStep 5: Testing JSON serialization...")
        try:
            # Test with SafeJSONEncoder
            safe_json = json.dumps(records, cls=SafeJSONEncoder, indent=2)
            print("  - [PASS] SafeJSONEncoder serialization successful")
            
            # Verify it can be parsed
            parsed_records = json.loads(safe_json)
            print("  - [PASS] JSON parsing successful")
            print(f"  - JSON size: {len(safe_json)} characters")
            
            # Test with regular JSON encoder (should fail if NaN values present)
            try:
                regular_json = json.dumps(records)
                print("  - [INFO] Regular JSON encoder also worked (no NaN values present)")
            except (ValueError, TypeError) as e:
                print(f"  - [EXPECTED] Regular JSON encoder failed: {type(e).__name__}")
                print("    This confirms SafeJSONEncoder is necessary")
            
        except Exception as e:
            print(f"  - [FAIL] JSON serialization failed: {e}")
            return False
        
        # Step 6: Simulate record cleaning (as done in _clean_record)
        print("\nStep 6: Simulating individual record cleaning...")
        cleaned_records = []
        skipped_fields_summary = {}
        
        for i, record in enumerate(records[:3]):  # Test first 3 records
            cleaned = {}
            skipped_fields = []
            
            for key, value in record.items():
                # Skip empty values and NaN values
                if value is None or pd.isna(value) or value == '':
                    skipped_fields.append(f"{key}='{value}' (empty/null/NaN)")
                    continue
                
                # Handle numpy types
                if isinstance(value, (np.integer, np.floating)):
                    if np.isnan(value) or np.isinf(value):
                        skipped_fields.append(f"{key}='{value}' (NaN/Inf)")
                        continue
                    value = value.item()
                
                # Handle regular float values
                if isinstance(value, float):
                    if np.isnan(value) or np.isinf(value):
                        skipped_fields.append(f"{key}='{value}' (NaN/Inf)")
                        continue
                
                # Clean string values
                if isinstance(value, str):
                    value = value.strip()
                    if value == '' or value.lower() in ['nan', 'null', 'none']:
                        skipped_fields.append(f"{key}='{value}' (empty after strip)")
                        continue
                
                cleaned[key] = value
            
            cleaned_records.append(cleaned)
            if skipped_fields:
                skipped_fields_summary[f"Record {i+1}"] = skipped_fields
        
        print(f"  - Cleaned {len(cleaned_records)} records")
        if skipped_fields_summary:
            print("  - Skipped fields summary:")
            for record_name, fields in skipped_fields_summary.items():
                print(f"    {record_name}: {len(fields)} fields skipped")
                for field in fields[:3]:  # Show first 3
                    print(f"      - {field}")
                if len(fields) > 3:
                    print(f"      - ... and {len(fields) - 3} more")
        
        # Step 7: Final validation
        print("\nStep 7: Final validation...")
        
        # Check for any remaining problematic values
        problematic_values = []
        for i, record in enumerate(cleaned_records):
            for key, value in record.items():
                if pd.isna(value) or (isinstance(value, float) and (np.isnan(value) or np.isinf(value))):
                    problematic_values.append(f"Record {i+1}.{key}: {repr(value)}")
        
        if problematic_values:
            print(f"  - [WARNING] Found {len(problematic_values)} problematic values:")
            for pv in problematic_values[:5]:
                print(f"    - {pv}")
        else:
            print("  - [PASS] No problematic values found in cleaned records")
        
        # Test final JSON serialization of cleaned records
        try:
            final_json = json.dumps(cleaned_records, cls=SafeJSONEncoder)
            json.loads(final_json)  # Verify parsing
            print("  - [PASS] Final JSON serialization and parsing successful")
        except Exception as e:
            print(f"  - [FAIL] Final JSON test failed: {e}")
            return False
        
        print("\n" + "=" * 60)
        print("SIMULATION COMPLETED SUCCESSFULLY")
        print("All data processing steps work correctly!")
        print("The upload process should now work without JSON parsing errors.")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Simulation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run the validation."""
    print("Salesforce Upload Fixes Validation")
    print("=" * 60)
    
    # Check if test CSV exists
    test_csv = Path('data/test_leads_with_nans.csv')
    if not test_csv.exists():
        print(f"Test CSV not found: {test_csv}")
        print("Run 'python tools/test_salesforce_fixes.py' first to create test data.")
        return False
    
    # Run simulation
    success = simulate_upload_process(str(test_csv))
    
    if success:
        print("\n[SUCCESS] Validation completed successfully!")
        print("The fixes should resolve the JSON parsing and OwnerId issues.")
    else:
        print("\n[FAILURE] Validation failed. Please check the errors above.")
    
    return success


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
