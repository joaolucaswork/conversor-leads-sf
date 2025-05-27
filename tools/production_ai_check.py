#!/usr/bin/env python3
"""
Production AI Check Script
Quick script to verify AI functionality in production environment.
"""

import os
import sys
import json
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "core"))

def quick_ai_test():
    """Quick test to verify AI is working"""
    print("🚀 Quick AI Production Test")
    print("=" * 40)
    
    try:
        from ai_field_mapper import AIFieldMapper
        
        # Force AI usage with very ambiguous columns
        config = {
            'ai_processing': {
                'enabled': True,
                'confidence_threshold': 80.0,
                'model': 'gpt-3.5-turbo'
            }
        }
        
        mapper = AIFieldMapper(config)
        
        print(f"✅ AI Field Mapper initialized")
        print(f"🤖 AI enabled: {mapper.ai_enabled}")
        print(f"🔧 OpenAI client: {'Available' if mapper.openai_client else 'Not available'}")
        
        if not mapper.ai_enabled or not mapper.openai_client:
            print("❌ AI not properly initialized")
            return False
        
        # Test with columns that will force AI usage
        test_columns = ["Unknown_Col_1", "Mystery_Field_2", "Ambiguous_Data_3"]
        sample_data = {
            "Unknown_Col_1": ["João Silva", "Maria Santos"],
            "Mystery_Field_2": ["11999887766", "11888776655"], 
            "Ambiguous_Data_3": ["joao@email.com", "maria@email.com"]
        }
        
        print(f"\n🧪 Testing AI with: {test_columns}")
        
        # Force AI call directly
        try:
            ai_mappings = mapper._ai_powered_mapping(test_columns, sample_data)
            
            print("📋 AI Results:")
            for mapping in ai_mappings:
                print(f"  {mapping.source_field} → {mapping.target_field} (confidence: {mapping.confidence}%)")
            
            # Get stats
            stats = mapper.get_api_usage_stats()
            print(f"\n📊 API Usage:")
            print(f"  Calls made: {stats['total_calls']}")
            print(f"  Tokens used: {stats['total_tokens_used']}")
            print(f"  Cost: ${stats['estimated_cost']:.6f}")
            
            if stats['total_calls'] > 0:
                print("\n✅ AI is working correctly in production!")
                return True
            else:
                print("\n⚠️ No AI calls were made")
                return False
                
        except Exception as e:
            print(f"\n❌ AI call failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def check_production_logs():
    """Check for AI-related logs"""
    print("\n📋 Production Environment Check")
    print("-" * 40)
    
    # Check environment variables
    env_vars = ['NODE_ENV', 'PYTHON_ENV', 'PORT']
    for var in env_vars:
        value = os.getenv(var)
        print(f"  {var}: {value or 'Not set'}")
    
    # Check if we're in production
    is_production = (
        os.getenv('NODE_ENV') == 'production' or 
        os.getenv('PYTHON_ENV') == 'production' or
        os.getenv('PORT') is not None
    )
    
    print(f"\n🏭 Production environment: {'Yes' if is_production else 'No'}")
    
    return is_production

def main():
    """Run production AI check"""
    print("🔍 Production AI Verification")
    print("=" * 50)
    
    # Check environment
    is_prod = check_production_logs()
    
    # Run AI test
    ai_working = quick_ai_test()
    
    print("\n" + "=" * 50)
    print("📋 Summary")
    print("-" * 50)
    
    if ai_working:
        print("✅ AI is working correctly!")
        print("\n💡 If you're not seeing AI usage in your application:")
        print("  1. The system may be using rule-based mapping (which is more efficient)")
        print("  2. Check the confidence threshold in your configuration")
        print("  3. Look for 'AI skip ratio' in processing logs")
        print("  4. AI is used only when rule-based mapping confidence < 80%")
        
        if is_prod:
            print("\n🏭 Production recommendations:")
            print("  - Monitor API usage costs in OpenAI dashboard")
            print("  - Check application logs for AI processing statistics")
            print("  - Verify that complex column names trigger AI usage")
    else:
        print("❌ AI is not working properly")
        print("\n🔧 Troubleshooting steps:")
        print("  1. Check network connectivity to OpenAI servers")
        print("  2. Verify API key is valid and has sufficient quota")
        print("  3. Check application logs for specific error messages")
        print("  4. Ensure OpenAI package is properly installed")

if __name__ == "__main__":
    main()
