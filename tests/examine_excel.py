#!/usr/bin/env python3
"""
Examine the Excel file structure to identify column names.
"""

import pandas as pd
import sys
from pathlib import Path

def examine_excel_file():
    """Examine the Excel file structure."""
    excel_file = "data/input/leads_vinteseismaio.xlsx"
    
    if not Path(excel_file).exists():
        print(f"❌ File not found: {excel_file}")
        return
    
    try:
        # Read Excel file
        df = pd.read_excel(excel_file)
        
        print("📊 EXCEL FILE ANALYSIS")
        print("=" * 50)
        print(f"📄 File: {excel_file}")
        print(f"📋 Total rows: {len(df)}")
        print(f"📋 Total columns: {len(df.columns)}")
        
        print(f"\n🏷️  COLUMN NAMES:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i:2d}. '{col}'")
        
        print(f"\n📄 FIRST 3 ROWS:")
        print(df.head(3).to_string())
        
        print(f"\n🔍 COLUMN DATA TYPES:")
        for col in df.columns:
            print(f"  {col}: {df[col].dtype}")
        
        print(f"\n📊 SAMPLE DATA FOR EACH COLUMN:")
        for col in df.columns:
            sample_values = df[col].dropna().head(3).tolist()
            print(f"  {col}: {sample_values}")
        
        # Check for potential name columns
        print(f"\n🔍 POTENTIAL NAME COLUMNS:")
        name_keywords = ['cliente', 'name', 'nome', 'customer', 'lead']
        for col in df.columns:
            col_lower = col.lower()
            if any(keyword in col_lower for keyword in name_keywords):
                print(f"  ✅ '{col}' - likely contains names")
                sample_values = df[col].dropna().head(5).tolist()
                print(f"     Sample values: {sample_values}")
        
    except Exception as e:
        print(f"❌ Error reading Excel file: {e}")

if __name__ == "__main__":
    examine_excel_file()
