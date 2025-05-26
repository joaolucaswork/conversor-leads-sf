#!/usr/bin/env python3
"""
AI-Enhanced Leads Processing System Setup Script
Installs dependencies and configures the AI-enhanced system.
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version}")
    return True

def install_dependencies():
    """Install required Python packages."""
    print("\n📦 Installing dependencies...")
    
    try:
        # Install packages from requirements.txt
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def check_openai_api_key():
    """Check if OpenAI API key is configured."""
    print("\n🔑 Checking OpenAI API key...")
    
    # Check .env file
    env_file = Path('.env')
    if env_file.exists():
        with open(env_file, 'r') as f:
            content = f.read()
            if 'OPENAI_API_KEY=' in content and len(content.split('OPENAI_API_KEY=')[1].split('\n')[0].strip()) > 10:
                print("✅ OpenAI API key found in .env file")
                return True
    
    # Check environment variable
    if os.getenv('OPENAI_API_KEY'):
        print("✅ OpenAI API key found in environment variables")
        return True
    
    print("⚠️  OpenAI API key not found")
    print("Please ensure your .env file contains: OPENAI_API_KEY=your_api_key_here")
    return False

def create_directories():
    """Create necessary directories."""
    print("\n📁 Creating directory structure...")
    
    directories = [
        'data/input',
        'data/output', 
        'data/backup',
        'logs',
        'config'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created: {directory}/")

def test_ai_integration():
    """Test AI integration without making API calls."""
    print("\n🧪 Testing AI integration...")
    
    try:
        # Test imports
        from ai_field_mapper import AIFieldMapper
        from master_leads_processor_ai import AIEnhancedLeadsProcessor
        
        # Test initialization (without API calls)
        config = {"ai_processing": {"enabled": False}}  # Disable for testing
        mapper = AIFieldMapper(config)
        processor = AIEnhancedLeadsProcessor()
        
        print("✅ AI modules imported and initialized successfully")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Initialization error: {e}")
        return False

def create_sample_config():
    """Create a sample configuration file if it doesn't exist."""
    config_file = Path('config_ai_sample.json')
    
    if not config_file.exists():
        print("\n⚙️  Creating sample AI configuration...")
        
        sample_config = {
            "lead_distribution": {
                "guic": 100,
                "cmilfont": 100,
                "ctint": 70,
                "pnilo": 30
            },
            "default_values": {
                "patrimonio_financeiro": 1300000,
                "tipo": "Pessoa Física",
                "maisdeMilhao__c": 1
            },
            "output_encoding": "utf-8",
            "backup_enabled": True,
            "ai_processing": {
                "enabled": True,
                "confidence_threshold": 80.0,
                "use_ai_for_mapping": True,
                "use_ai_for_validation": True,
                "use_ai_for_data_conversion": True,
                "fallback_to_rules": True,
                "max_retries": 3,
                "api_timeout": 30,
                "model": "gpt-3.5-turbo",
                "temperature": 0.1,
                "max_tokens": 2000
            },
            "validation_rules": {
                "required_fields": ["Last Name", "Email"],
                "phone_number_min_length": 8,
                "email_validation": True
            }
        }
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(sample_config, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Sample configuration created: {config_file}")

def print_usage_instructions():
    """Print usage instructions for the AI system."""
    print("\n" + "="*60)
    print("🚀 AI-ENHANCED LEADS PROCESSING SYSTEM READY!")
    print("="*60)
    
    print("\n📋 QUICK START:")
    print("1. Basic AI processing:")
    print("   python master_leads_processor_ai.py input_file.csv")
    
    print("\n2. With custom configuration:")
    print("   python master_leads_processor_ai.py input_file.csv -c config.json")
    
    print("\n3. Disable AI (fallback to rules):")
    print("   python master_leads_processor_ai.py input_file.csv --disable-ai")
    
    print("\n4. Custom confidence threshold:")
    print("   python master_leads_processor_ai.py input_file.csv --confidence-threshold 90")
    
    print("\n🤖 AI FEATURES:")
    print("• Intelligent column mapping with confidence scoring")
    print("• AI-powered data validation and quality assessment")
    print("• Smart data conversion with cultural awareness")
    print("• Automatic fallback to rule-based processing")
    print("• Comprehensive logging of AI decisions")
    
    print("\n⚙️  CONFIGURATION:")
    print("• Edit config.json to customize AI settings")
    print("• Set confidence_threshold (0-100) for mapping accuracy")
    print("• Enable/disable specific AI features")
    print("• Configure OpenAI model and parameters")
    
    print("\n📁 OUTPUT FILES:")
    print("• Processed CSV with standardized data")
    print("• AI summary JSON with confidence scores and decisions")
    print("• Detailed logs with AI reasoning")
    print("• Automatic backups of original files")
    
    print("\n🔧 TROUBLESHOOTING:")
    print("• Check logs/ directory for detailed processing logs")
    print("• Verify OpenAI API key in .env file")
    print("• Use --disable-ai flag if API is unavailable")
    print("• Review AI summary JSON for mapping decisions")
    
    print("="*60)

def main():
    """Main setup function."""
    print("🔧 AI-Enhanced Leads Processing System Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("\n⚠️  Dependency installation failed. You may need to install manually:")
        print("pip install -r requirements.txt")
    
    # Create directories
    create_directories()
    
    # Check OpenAI API key
    api_key_ok = check_openai_api_key()
    
    # Test AI integration
    if not test_ai_integration():
        print("\n⚠️  AI integration test failed. Please check dependencies.")
    
    # Create sample configuration
    create_sample_config()
    
    # Print usage instructions
    print_usage_instructions()
    
    if not api_key_ok:
        print("\n⚠️  IMPORTANT: Configure your OpenAI API key in .env file to enable AI features")
        print("Without the API key, the system will use rule-based processing as fallback.")

if __name__ == "__main__":
    main()
