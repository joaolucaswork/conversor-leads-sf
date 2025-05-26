#!/usr/bin/env python3
"""
Test Excel file support for the AI-enhanced leads processing system.
"""

import pandas as pd
from pathlib import Path
import sys

def test_excel_reading():
    """Test if we can read Excel files properly."""
    print("🧪 Testing Excel file support...")
    
    # Check if the Excel file exists
    excel_file = "leads_vinteseismaio.xlsx"
    if not Path(excel_file).exists():
        print(f"❌ Excel file not found: {excel_file}")
        return False
    
    try:
        # Try to read the Excel file
        df = pd.read_excel(excel_file)
        print(f"✅ Successfully read Excel file")
        print(f"📊 Records: {len(df)}")
        print(f"📋 Columns: {len(df.columns)}")
        print(f"🏷️  Column names: {list(df.columns)}")
        
        # Show first few rows
        print(f"\n📄 First 3 rows:")
        print(df.head(3).to_string())
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to read Excel file: {e}")
        return False

def test_ai_processor_with_excel():
    """Test the AI processor with Excel file."""
    print(f"\n🤖 Testing AI processor with Excel file...")
    
    try:
        from master_leads_processor_ai import AIEnhancedLeadsProcessor
        
        # Initialize processor with AI disabled for testing
        processor = AIEnhancedLeadsProcessor()
        processor.config['ai_processing']['enabled'] = False
        processor.ai_mapper.ai_enabled = False
        
        excel_file = "leads_vinteseismaio.xlsx"
        if not Path(excel_file).exists():
            print(f"❌ Excel file not found: {excel_file}")
            return False
        
        # Test format detection
        file_format, separator, sample_data = processor.detect_file_format_ai(excel_file)
        print(f"✅ Format detected: {file_format}")
        print(f"✅ Sample data columns: {len(sample_data)}")
        
        # Show sample data
        for col, samples in list(sample_data.items())[:3]:  # Show first 3 columns
            print(f"   {col}: {samples[:2]}")  # Show first 2 samples
        
        return True
        
    except Exception as e:
        print(f"❌ AI processor test failed: {e}")
        return False

def main():
    """Main test function."""
    print("📊 Excel File Support Test")
    print("=" * 40)
    
    # Test basic Excel reading
    excel_ok = test_excel_reading()
    
    # Test AI processor with Excel
    ai_ok = test_ai_processor_with_excel()
    
    print("\n" + "=" * 40)
    print("TEST RESULTS:")
    print(f"Excel Reading: {'✅ PASS' if excel_ok else '❌ FAIL'}")
    print(f"AI Processor:  {'✅ PASS' if ai_ok else '❌ FAIL'}")
    
    if excel_ok and ai_ok:
        print("\n🎉 Excel support is working! You can now process Excel files.")
        print("\nTry running:")
        print("python master_leads_processor_ai.py leads_vinteseismaio.xlsx")
    else:
        print("\n⚠️  Excel support needs attention. Check the errors above.")
        
        if not excel_ok:
            print("• Make sure openpyxl is installed: pip install openpyxl")
            print("• Check if the Excel file exists and is not corrupted")
        
        if not ai_ok:
            print("• Check if the AI processor modules are properly installed")

if __name__ == "__main__":
    main()
