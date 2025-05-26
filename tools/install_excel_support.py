#!/usr/bin/env python3
"""
Quick installer for Excel file support in the leads processing system.
"""

import subprocess
import sys

def install_excel_dependencies():
    """Install required packages for Excel support."""
    print("📦 Installing Excel file support dependencies...")
    
    packages = [
        'openpyxl>=3.0.0',
        'xlrd>=2.0.0'
    ]
    
    for package in packages:
        try:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e}")
            return False
    
    return True

def test_excel_imports():
    """Test if Excel-related imports work."""
    print("\n🧪 Testing Excel imports...")
    
    try:
        import openpyxl
        print("✅ openpyxl imported successfully")
    except ImportError:
        print("❌ openpyxl import failed")
        return False
    
    try:
        import xlrd
        print("✅ xlrd imported successfully")
    except ImportError:
        print("❌ xlrd import failed")
        return False
    
    try:
        import pandas as pd
        # Test Excel reading capability
        print("✅ pandas Excel support available")
    except ImportError:
        print("❌ pandas not available")
        return False
    
    return True

def main():
    """Main installation function."""
    print("🔧 Excel File Support Installer")
    print("=" * 40)
    
    # Install dependencies
    install_ok = install_excel_dependencies()
    
    if install_ok:
        # Test imports
        import_ok = test_excel_imports()
        
        if import_ok:
            print("\n🎉 Excel support installed successfully!")
            print("\nYou can now process Excel files (.xlsx, .xls) with:")
            print("python master_leads_processor_ai.py your_file.xlsx")
            print("python master_leads_processor.py your_file.xlsx")
            
            print("\nTo test Excel support:")
            print("python test_excel_support.py")
        else:
            print("\n⚠️  Installation completed but imports failed.")
            print("You may need to restart your Python environment.")
    else:
        print("\n❌ Installation failed. Please install manually:")
        print("pip install openpyxl xlrd")

if __name__ == "__main__":
    main()
