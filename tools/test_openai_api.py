#!/usr/bin/env python3
"""
OpenAI API Test Script
Tests the OpenAI API connection and functionality for the leads processing system.
"""

import os
import sys
import json
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "core"))

def test_openai_api_key():
    """Test OpenAI API key from environment variables"""
    print("🔑 Testing OpenAI API key from environment...")

    # Get API key from environment variables
    api_key = os.getenv('OPENAI_API_KEY')

    if not api_key:
        print("❌ OPENAI_API_KEY not found in environment variables")
        return False

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        print("✅ OpenAI client initialized successfully")

        # Test a simple API call
        print("🧪 Testing API call...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'API test successful' if you can read this."}
            ],
            max_tokens=10,
            temperature=0.1
        )

        result = response.choices[0].message.content
        print(f"✅ API Response: {result}")

        # Check usage information
        if hasattr(response, 'usage'):
            print(f"📊 Token usage: {response.usage.total_tokens} tokens")
            print(f"💰 Estimated cost: ${response.usage.total_tokens * 0.000002:.6f}")

        return True

    except Exception as e:
        print(f"❌ API test failed: {e}")

        # Check for specific error types
        if "invalid_api_key" in str(e).lower():
            print("🔑 Error: Invalid API key")
        elif "quota" in str(e).lower():
            print("💳 Error: API quota exceeded")
        elif "rate_limit" in str(e).lower():
            print("⏱️ Error: Rate limit exceeded")
        elif "network" in str(e).lower() or "connection" in str(e).lower():
            print("🌐 Error: Network connection issue")
        else:
            print(f"🔍 Error details: {type(e).__name__}: {e}")

        return False

def test_ai_field_mapper():
    """Test the AI field mapper module directly"""
    print("\n🧠 Testing AI Field Mapper module...")

    try:
        from ai_field_mapper import AIFieldMapper

        # Initialize the mapper with AI enabled config
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

        if mapper.ai_enabled and mapper.openai_client:
            # Test column mapping
            test_columns = ["Cliente", "Telefone", "Email", "Estado"]
            print(f"\n🧪 Testing column mapping with: {test_columns}")

            mappings = mapper.analyze_columns(test_columns)

            print("📋 Mapping results:")
            for mapping in mappings:
                print(f"  {mapping.source_field} → {mapping.target_field} (confidence: {mapping.confidence}%)")

            # Get API usage stats
            stats = mapper.get_api_usage_stats()
            print(f"\n📊 API Usage Stats:")
            print(f"  Total calls: {stats['total_calls']}")
            print(f"  Total tokens: {stats['total_tokens_used']}")
            print(f"  Estimated cost: ${stats['estimated_cost']:.6f}")
            print(f"  Cache hit ratio: {stats['cache_hit_ratio']:.2%}")
            print(f"  AI skip ratio: {stats['ai_skip_ratio']:.2%}")

            return True
        else:
            print("❌ AI Field Mapper not properly initialized")
            print(f"   AI enabled: {mapper.ai_enabled}")
            print(f"   OpenAI client: {mapper.openai_client}")
            return False

    except Exception as e:
        print(f"❌ AI Field Mapper test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_environment_variables():
    """Test environment variable configuration"""
    print("\n🌍 Testing environment variables...")

    # Check for OpenAI API key in environment
    env_key = os.getenv('OPENAI_API_KEY')
    if env_key:
        print(f"✅ OPENAI_API_KEY found in environment: {env_key[:10]}...")
    else:
        print("⚠️ OPENAI_API_KEY not found in environment variables")

    # Check .env files
    env_files = [
        project_root / ".env",
        project_root / "config" / ".env"
    ]

    for env_file in env_files:
        if env_file.exists():
            print(f"📄 Found .env file: {env_file}")
            with open(env_file, 'r') as f:
                content = f.read()
                if 'OPENAI_API_KEY' in content:
                    print(f"✅ OPENAI_API_KEY found in {env_file}")
                else:
                    print(f"⚠️ OPENAI_API_KEY not found in {env_file}")
        else:
            print(f"❌ .env file not found: {env_file}")

def main():
    """Run all tests"""
    print("🧪 OpenAI API Test Suite")
    print("=" * 50)

    # Test environment variables
    test_environment_variables()

    # Test API key from environment
    api_test_passed = test_openai_api_key()

    # Test AI field mapper
    mapper_test_passed = test_ai_field_mapper()

    print("\n" + "=" * 50)
    print("📋 Test Summary:")
    print(f"  API Key Test: {'✅ PASSED' if api_test_passed else '❌ FAILED'}")
    print(f"  AI Mapper Test: {'✅ PASSED' if mapper_test_passed else '❌ FAILED'}")

    if api_test_passed and mapper_test_passed:
        print("\n🎉 All tests passed! OpenAI integration is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Check the errors above for details.")

        # Provide troubleshooting suggestions
        print("\n🔧 Troubleshooting suggestions:")
        if not api_test_passed:
            print("  - Check if the OpenAI API key is valid and has sufficient quota")
            print("  - Verify network connectivity to OpenAI servers")
            print("  - Check if the API key has the correct permissions")

        if not mapper_test_passed:
            print("  - Ensure the ai_field_mapper.py module is properly configured")
            print("  - Check if all required dependencies are installed")
            print("  - Verify the project structure and imports")

if __name__ == "__main__":
    main()
