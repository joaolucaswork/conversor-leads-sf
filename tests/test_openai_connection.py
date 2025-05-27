#!/usr/bin/env python3
"""
Simple OpenAI API connection test script for the leads processing application.
This script tests if the OpenAI API key is properly configured and working.
"""

import os
import sys
import json
from pathlib import Path

def test_openai_connection():
    """Test OpenAI API connection and return status."""
    try:
        # Check if API key is available
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("[WARNING] OpenAI API key not found in environment variables")
            return False

        # Try to import openai
        try:
            from openai import OpenAI
        except ImportError:
            print("[ERROR] OpenAI package not installed. Run: pip install openai")
            return False

        # Set up the client with new v1.0+ API
        try:
            client = OpenAI(api_key=api_key)
        except Exception as e:
            print(f"[ERROR] Failed to initialize OpenAI client: {e}")
            return False

        # Test with a simple completion
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": "Say 'API test successful' if you can read this."}
                ],
                max_tokens=10,
                temperature=0
            )

            if response and response.choices:
                print("[SUCCESS] OpenAI API connection successful")
                print(f"Model: {response.model}")
                print(f"Response: {response.choices[0].message.content.strip()}")
                return True
            else:
                print("[ERROR] OpenAI API returned empty response")
                return False

        except Exception as e:
            error_str = str(e).lower()
            if "authentication" in error_str or "invalid" in error_str or "api key" in error_str:
                print("[ERROR] OpenAI API authentication failed - invalid API key")
                return False
            elif "rate limit" in error_str or "quota" in error_str:
                print("[WARNING] OpenAI API rate limit exceeded - but API key is valid")
                return True  # API key is valid, just rate limited
            elif "api" in error_str:
                print(f"[ERROR] OpenAI API error: {e}")
                return False
            else:
                print(f"[ERROR] Unexpected error testing OpenAI API: {e}")
                return False

    except Exception as e:
        print(f"[ERROR] Error during OpenAI connection test: {e}")
        return False

def main():
    """Main function to run the test."""
    print("Testing OpenAI API connection...")

    # Add the project root to Python path so we can import modules
    project_root = Path(__file__).parent.parent
    sys.path.insert(0, str(project_root))

    success = test_openai_connection()

    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
