#!/usr/bin/env python3
"""
Production AI Diagnostics Script
Diagnoses AI issues specifically in production environment.
"""

import os
import sys
import json
import logging
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "core"))

def setup_logging():
    """Setup detailed logging for diagnostics"""
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

def diagnose_environment():
    """Diagnose environment configuration"""
    print("🌍 Diagnosing Environment Configuration")
    print("-" * 40)
    
    # Check Python version
    print(f"Python version: {sys.version}")
    
    # Check OpenAI package
    try:
        import openai
        print(f"✅ OpenAI package version: {openai.__version__}")
    except ImportError as e:
        print(f"❌ OpenAI package not available: {e}")
        return False
    
    # Check environment variables
    env_vars = ['OPENAI_API_KEY', 'NODE_ENV', 'PYTHON_ENV']
    for var in env_vars:
        value = os.getenv(var)
        if value:
            if 'API_KEY' in var:
                print(f"✅ {var}: {value[:10]}...")
            else:
                print(f"✅ {var}: {value}")
        else:
            print(f"⚠️ {var}: Not set")
    
    return True

def diagnose_ai_field_mapper():
    """Diagnose AI Field Mapper specifically"""
    print("\n🧠 Diagnosing AI Field Mapper")
    print("-" * 40)
    
    try:
        from ai_field_mapper import AIFieldMapper
        
        # Test with different configurations
        configs = [
            {},  # Empty config
            {'ai_processing': {'enabled': True}},  # Basic AI config
            {'ai_processing': {'enabled': True, 'model': 'gpt-3.5-turbo'}}  # Full config
        ]
        
        for i, config in enumerate(configs):
            print(f"\n📋 Test {i+1}: Config = {config}")
            try:
                mapper = AIFieldMapper(config)
                print(f"  ✅ Initialized successfully")
                print(f"  🤖 AI enabled: {mapper.ai_enabled}")
                print(f"  🔧 OpenAI client: {'Available' if mapper.openai_client else 'Not available'}")
                
                if mapper.openai_client:
                    # Test a simple mapping
                    test_result = mapper.analyze_columns(['test_column'])
                    print(f"  📊 Test mapping successful: {len(test_result)} mappings")
                
            except Exception as e:
                print(f"  ❌ Failed: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ AI Field Mapper import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def diagnose_backend_integration():
    """Diagnose backend integration"""
    print("\n🔗 Diagnosing Backend Integration")
    print("-" * 40)
    
    try:
        # Test backend imports
        from master_leads_processor_ai import AIEnhancedLeadsProcessor, process_leads_with_ai
        print("✅ Backend imports successful")
        
        # Test processor initialization
        processor = AIEnhancedLeadsProcessor()
        print("✅ AI Enhanced Processor initialized")
        print(f"🤖 AI mapper enabled: {processor.ai_mapper.ai_enabled}")
        
        # Test wrapper function
        print("✅ Wrapper function available for API calls")
        
        return True
        
    except Exception as e:
        print(f"❌ Backend integration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def diagnose_production_config():
    """Diagnose production configuration files"""
    print("\n⚙️ Diagnosing Production Configuration")
    print("-" * 40)
    
    config_files = [
        'config/config.json',
        'config/config_ai.json',
        'config/.env',
        '.env'
    ]
    
    for config_file in config_files:
        file_path = project_root / config_file
        if file_path.exists():
            print(f"✅ Found: {config_file}")
            
            if config_file.endswith('.json'):
                try:
                    with open(file_path, 'r') as f:
                        config_data = json.load(f)
                    
                    if 'ai_processing' in config_data:
                        ai_config = config_data['ai_processing']
                        print(f"  🤖 AI enabled: {ai_config.get('enabled', False)}")
                        print(f"  🎯 Confidence threshold: {ai_config.get('confidence_threshold', 'Not set')}")
                        print(f"  🧠 Model: {ai_config.get('model', 'Not set')}")
                    else:
                        print(f"  ⚠️ No AI configuration found")
                        
                except Exception as e:
                    print(f"  ❌ Error reading {config_file}: {e}")
            
            elif config_file.endswith('.env'):
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    
                    if 'OPENAI_API_KEY' in content:
                        print(f"  ✅ Contains OpenAI API key")
                    else:
                        print(f"  ⚠️ No OpenAI API key found")
                        
                except Exception as e:
                    print(f"  ❌ Error reading {config_file}: {e}")
        else:
            print(f"⚠️ Missing: {config_file}")

def diagnose_api_connectivity():
    """Test actual API connectivity"""
    print("\n🌐 Diagnosing API Connectivity")
    print("-" * 40)
    
    try:
        from ai_field_mapper import AIFieldMapper
        
        mapper = AIFieldMapper({'ai_processing': {'enabled': True}})
        
        if not mapper.openai_client:
            print("❌ OpenAI client not available")
            return False
        
        # Test actual API call
        print("🧪 Testing actual API call...")
        response = mapper.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a test assistant."},
                {"role": "user", "content": "Respond with 'API_TEST_SUCCESS' if you receive this."}
            ],
            max_tokens=10,
            temperature=0.1
        )
        
        result = response.choices[0].message.content
        print(f"✅ API Response: {result}")
        
        if hasattr(response, 'usage'):
            print(f"📊 Tokens used: {response.usage.total_tokens}")
        
        return True
        
    except Exception as e:
        print(f"❌ API connectivity test failed: {e}")
        
        # Check for specific error types
        error_str = str(e).lower()
        if "invalid_api_key" in error_str:
            print("🔑 Issue: Invalid API key")
        elif "quota" in error_str:
            print("💳 Issue: API quota exceeded")
        elif "rate_limit" in error_str:
            print("⏱️ Issue: Rate limit exceeded")
        elif "network" in error_str or "connection" in error_str:
            print("🌐 Issue: Network connectivity problem")
        
        return False

def main():
    """Run comprehensive production diagnostics"""
    print("🔍 Production AI Diagnostics")
    print("=" * 50)
    
    setup_logging()
    
    # Run all diagnostic tests
    tests = [
        ("Environment", diagnose_environment),
        ("AI Field Mapper", diagnose_ai_field_mapper),
        ("Backend Integration", diagnose_backend_integration),
        ("Production Config", diagnose_production_config),
        ("API Connectivity", diagnose_api_connectivity)
    ]
    
    results = {}
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} diagnostic failed: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Diagnostic Summary")
    print("-" * 50)
    
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {test_name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All diagnostics passed! AI should be working in production.")
        print("\n💡 If you're still experiencing issues, check:")
        print("  - Network connectivity in production environment")
        print("  - Environment variables are properly set")
        print("  - Application logs for specific error messages")
    else:
        print("⚠️ Some diagnostics failed. Review the issues above.")
        print("\n🔧 Common solutions:")
        print("  - Ensure OpenAI package is installed: pip install openai")
        print("  - Check API key is valid and has sufficient quota")
        print("  - Verify network connectivity to OpenAI servers")
        print("  - Check application configuration files")

if __name__ == "__main__":
    main()
