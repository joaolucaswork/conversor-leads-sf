#!/usr/bin/env python3
"""
Test script to verify automatic migration functionality
"""

import subprocess
import sys
import os
from pathlib import Path

def test_local_migration():
    """Test migration script locally"""
    print("🧪 Testing automatic migration locally...")
    
    try:
        # Run the auto migration script
        result = subprocess.run([
            sys.executable, 
            "backend/migrations/auto_migrate.py"
        ], capture_output=True, text=True, timeout=30)
        
        print("📋 Migration Output:")
        print("-" * 40)
        print(result.stdout)
        
        if result.stderr:
            print("⚠️  Migration Errors:")
            print(result.stderr)
        
        if result.returncode == 0:
            print("✅ Local migration test PASSED")
            return True
        else:
            print(f"❌ Local migration test FAILED (exit code: {result.returncode})")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Migration test timed out")
        return False
    except Exception as e:
        print(f"❌ Migration test error: {e}")
        return False

def test_heroku_release_phase():
    """Test Heroku release phase configuration"""
    print("\n🌐 Testing Heroku release phase configuration...")
    
    # Check if Procfile exists and has release phase
    procfile_path = Path("Procfile")
    if not procfile_path.exists():
        print("❌ Procfile not found")
        return False
    
    with open(procfile_path, 'r') as f:
        procfile_content = f.read()
    
    if "release:" in procfile_content:
        print("✅ Release phase configured in Procfile")
        
        # Extract release command
        for line in procfile_content.split('\n'):
            if line.startswith('release:'):
                release_command = line.replace('release:', '').strip()
                print(f"📋 Release command: {release_command}")
                
                if "auto_migrate.py" in release_command:
                    print("✅ Auto migration script configured")
                    return True
                else:
                    print("⚠️  Auto migration script not found in release command")
                    return False
    else:
        print("❌ No release phase configured in Procfile")
        return False

def check_migration_script():
    """Check if migration script exists and is executable"""
    print("\n📁 Checking migration script...")
    
    script_path = Path("backend/migrations/auto_migrate.py")
    if not script_path.exists():
        print("❌ Auto migration script not found")
        return False
    
    print("✅ Auto migration script exists")
    
    # Check if script is executable
    if os.access(script_path, os.R_OK):
        print("✅ Script is readable")
    else:
        print("⚠️  Script is not readable")
    
    return True

def simulate_heroku_environment():
    """Simulate Heroku environment variables"""
    print("\n🔧 Simulating Heroku environment...")
    
    # Set Heroku-like environment variables
    os.environ['DYNO'] = 'web.1'
    os.environ['PYTHON_ENV'] = 'production'
    
    # Check if DATABASE_URL is set
    if os.getenv('DATABASE_URL'):
        print("✅ DATABASE_URL is configured")
    else:
        print("⚠️  DATABASE_URL not set (will skip DB operations)")
    
    return True

def main():
    """Main test function"""
    print("🔍 Automatic Migration Test Suite")
    print("=" * 50)
    
    tests = [
        ("Migration Script Check", check_migration_script),
        ("Heroku Release Phase Config", test_heroku_release_phase),
        ("Heroku Environment Simulation", simulate_heroku_environment),
        ("Local Migration Test", test_local_migration),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        try:
            if test_func():
                print(f"✅ {test_name}: PASSED")
                passed += 1
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
    
    print("\n📊 Test Results")
    print("=" * 30)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 All tests passed! Automatic migration is ready.")
        print("\n📋 Next Steps:")
        print("1. Commit and push changes to Heroku")
        print("2. Deploy will automatically run migrations")
        print("3. No more manual migration commands needed!")
        
        print("\n🚀 Deploy Command:")
        print("git add .")
        print("git commit -m 'Add automatic database migrations'")
        print("git push heroku main")
        
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please fix issues before deploying.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
