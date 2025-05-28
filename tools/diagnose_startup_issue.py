#!/usr/bin/env python3
"""
Diagnose startup issues after reorganization
"""

import os
import sys
import subprocess
from pathlib import Path
import json

def check_python_environment():
    """Check Python environment and dependencies"""
    print("=== PYTHON ENVIRONMENT ===")
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {sys.path[:3]}...")  # Show first 3 entries
    
    # Check if we can import key modules
    modules_to_check = [
        'fastapi', 'uvicorn', 'pandas', 'openpyxl', 'requests'
    ]
    
    print("\n=== PYTHON MODULES ===")
    for module in modules_to_check:
        try:
            __import__(module)
            print(f"✓ {module} - OK")
        except ImportError as e:
            print(f"✗ {module} - MISSING: {e}")

def check_project_structure():
    """Check if project structure is correct"""
    print("\n=== PROJECT STRUCTURE ===")
    
    project_root = Path(".")
    
    # Essential files and directories
    essential_items = [
        "package.json",
        "requirements.txt", 
        "backend/main.py",
        "backend/requirements.txt",
        "src/App.jsx",
        "core/ai_field_mapper.py",
        "config/vite.config.js",
        "scripts/start-dev.js"
    ]
    
    for item in essential_items:
        path = project_root / item
        if path.exists():
            print(f"✓ {item}")
        else:
            print(f"✗ {item} - MISSING")

def check_node_environment():
    """Check Node.js environment"""
    print("\n=== NODE.JS ENVIRONMENT ===")
    
    try:
        # Check Node.js version
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ Node.js version: {result.stdout.strip()}")
        else:
            print("✗ Node.js not found")
    except FileNotFoundError:
        print("✗ Node.js not installed")
    
    try:
        # Check npm version
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ npm version: {result.stdout.strip()}")
        else:
            print("✗ npm not found")
    except FileNotFoundError:
        print("✗ npm not installed")
    
    # Check if node_modules exists
    if Path("node_modules").exists():
        print("✓ node_modules directory exists")
    else:
        print("✗ node_modules directory missing - run 'npm install'")

def check_ports():
    """Check if required ports are available"""
    print("\n=== PORT AVAILABILITY ===")
    
    import socket
    
    ports_to_check = [5173, 8000]
    
    for port in ports_to_check:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        
        if result == 0:
            print(f"✗ Port {port} is already in use")
        else:
            print(f"✓ Port {port} is available")

def check_vite_config():
    """Check Vite configuration"""
    print("\n=== VITE CONFIGURATION ===")
    
    vite_config_paths = [
        "vite.config.js",
        "config/vite.config.js"
    ]
    
    for config_path in vite_config_paths:
        if Path(config_path).exists():
            print(f"✓ Found Vite config: {config_path}")
            try:
                with open(config_path, 'r') as f:
                    content = f.read()
                    if 'electron' in content.lower():
                        print("✓ Electron configuration detected")
                    if '5173' in content:
                        print("✓ Port 5173 configured")
            except Exception as e:
                print(f"✗ Error reading config: {e}")
            break
    else:
        print("✗ No Vite config found")

def test_backend_startup():
    """Test if backend can start"""
    print("\n=== BACKEND STARTUP TEST ===")
    
    backend_main = Path("backend/main.py")
    if not backend_main.exists():
        print("✗ backend/main.py not found")
        return
    
    try:
        # Try to import the main module
        sys.path.insert(0, str(Path(".").resolve()))
        sys.path.insert(0, str(Path("core").resolve()))
        
        # Change to backend directory temporarily
        original_cwd = os.getcwd()
        os.chdir("backend")
        
        try:
            import main
            print("✓ Backend main module imports successfully")
            
            # Check if FastAPI app exists
            if hasattr(main, 'app'):
                print("✓ FastAPI app found")
            else:
                print("✗ FastAPI app not found in main module")
                
        except Exception as e:
            print(f"✗ Error importing backend: {e}")
        finally:
            os.chdir(original_cwd)
            
    except Exception as e:
        print(f"✗ Backend test failed: {e}")

def suggest_fixes():
    """Suggest potential fixes"""
    print("\n=== SUGGESTED FIXES ===")
    
    fixes = [
        "1. Install Node.js dependencies: npm install",
        "2. Install Python dependencies: pip install -r requirements.txt",
        "3. Install backend dependencies: pip install -r backend/requirements.txt", 
        "4. Check if any process is using ports 5173 or 8000",
        "5. Try starting services individually:",
        "   - Backend: python backend/start_dev_server.py",
        "   - Frontend: npm run frontend",
        "   - Electron: npm run electron:start",
        "6. If imports fail, check Python path configuration",
        "7. Verify all files were moved correctly during reorganization"
    ]
    
    for fix in fixes:
        print(fix)

def main():
    """Main diagnostic function"""
    print("STARTUP DIAGNOSTIC TOOL")
    print("=" * 50)
    
    check_python_environment()
    check_project_structure()
    check_node_environment()
    check_ports()
    check_vite_config()
    test_backend_startup()
    suggest_fixes()
    
    print("\n" + "=" * 50)
    print("Diagnostic complete!")

if __name__ == "__main__":
    main()
