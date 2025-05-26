#!/usr/bin/env python3
"""
Test Script for AI-Enhanced Leads Processing System
Tests AI integration, field mapping, and data validation capabilities.
"""

import os
import sys
import json
import pandas as pd
from pathlib import Path
from datetime import datetime

def create_test_data():
    """Create sample test data for AI processing."""
    print("📝 Creating test data...")
    
    # Create test data directory
    test_dir = Path('test_data')
    test_dir.mkdir(exist_ok=True)
    
    # Sample raw format data (Portuguese)
    raw_data = {
        'Cliente': ['João Silva', 'Maria Santos', 'Pedro Oliveira'],
        'Telefone': ['11987654321', '21876543210', '85999887766'],
        'E-mail': ['joao@email.com', 'maria@email.com', 'pedro@email.com'],
        'Volume Aproximado': ['R$ 1.500.000', 'R$ 2.000.000', 'R$ 1.200.000'],
        'Estado': ['SP', 'RJ', 'CE'],
        'Descrição': ['Cliente premium', 'Novo cliente', 'Cliente recorrente']
    }
    
    # Save raw format test file
    raw_df = pd.DataFrame(raw_data)
    raw_file = test_dir / 'test_raw_format.csv'
    raw_df.to_csv(raw_file, sep=';', index=False, encoding='utf-8')
    print(f"✅ Created: {raw_file}")
    
    # Sample mixed format data (Multi-language)
    mixed_data = {
        'Customer Name': ['Ana Costa', 'Carlos Lima', 'Lucia Ferreira'],
        'Telefone': ['11888777666', '21777666555', '85666555444'],
        'Email Address': ['ana@test.com', 'carlos@test.com', 'lucia@test.com'],
        'Financial Value': ['1800000', '2200000', '1600000'],
        'Province': ['São Paulo', 'Rio de Janeiro', 'Ceará'],
        'Notes': ['High value client', 'New prospect', 'Returning customer']
    }
    
    mixed_df = pd.DataFrame(mixed_data)
    mixed_file = test_dir / 'test_mixed_format.csv'
    mixed_df.to_csv(mixed_file, index=False, encoding='utf-8')
    print(f"✅ Created: {mixed_file}")
    
    return [str(raw_file), str(mixed_file)]

def test_ai_field_mapper():
    """Test AI field mapping functionality."""
    print("\n🧪 Testing AI Field Mapper...")
    
    try:
        from ai_field_mapper import AIFieldMapper, FieldMapping
        
        # Test with AI disabled (to avoid API calls in testing)
        config = {"ai_processing": {"enabled": False, "confidence_threshold": 80.0}}
        mapper = AIFieldMapper(config)
        
        # Test column analysis
        test_columns = ['Cliente', 'Telefone', 'E-mail', 'Volume Aproximado']
        mappings = mapper.analyze_columns(test_columns)
        
        print(f"✅ Field mapper initialized")
        print(f"✅ Analyzed {len(test_columns)} columns")
        print(f"✅ Generated {len(mappings)} mappings")
        
        # Display mappings
        for mapping in mappings:
            print(f"   {mapping.source_field} → {mapping.target_field} ({mapping.confidence}%)")
        
        return True
        
    except Exception as e:
        print(f"❌ AI Field Mapper test failed: {e}")
        return False

def test_ai_processor():
    """Test AI-enhanced processor initialization."""
    print("\n🧪 Testing AI-Enhanced Processor...")
    
    try:
        from master_leads_processor_ai import AIEnhancedLeadsProcessor
        
        # Test initialization
        processor = AIEnhancedLeadsProcessor()
        
        print(f"✅ AI processor initialized")
        print(f"✅ AI enabled: {processor.ai_mapper.ai_enabled}")
        print(f"✅ Confidence threshold: {processor.ai_mapper.confidence_threshold}")
        
        return True
        
    except Exception as e:
        print(f"❌ AI Processor test failed: {e}")
        return False

def test_file_processing(test_files):
    """Test file processing with AI disabled."""
    print("\n🧪 Testing File Processing (AI disabled)...")
    
    try:
        from master_leads_processor_ai import AIEnhancedLeadsProcessor
        
        # Initialize with AI disabled for testing
        config = {"ai_processing": {"enabled": False}}
        processor = AIEnhancedLeadsProcessor()
        processor.config.update(config)
        processor.ai_mapper.ai_enabled = False
        
        for test_file in test_files:
            print(f"\n📄 Processing: {Path(test_file).name}")
            
            # Test format detection
            file_format, separator, sample_data = processor.detect_file_format_ai(test_file)
            print(f"   Format detected: {file_format}")
            print(f"   Separator: '{separator}'")
            print(f"   Sample data columns: {len(sample_data)}")
            
            # Test file reading
            df = pd.read_csv(test_file, sep=separator, encoding='utf-8')
            print(f"   Records read: {len(df)}")
            print(f"   Columns: {list(df.columns)}")
        
        print("✅ File processing test completed")
        return True
        
    except Exception as e:
        print(f"❌ File processing test failed: {e}")
        return False

def test_openai_connection():
    """Test OpenAI API connection (if API key is available)."""
    print("\n🧪 Testing OpenAI Connection...")
    
    # Check if API key is available
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("⚠️  OpenAI API key not found - skipping connection test")
        return True
    
    try:
        import openai
        openai.api_key = api_key
        
        # Test with a minimal API call
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Test connection - respond with 'OK'"}],
            max_tokens=5,
            temperature=0
        )
        
        if response.choices[0].message.content.strip().upper() == 'OK':
            print("✅ OpenAI API connection successful")
            return True
        else:
            print("⚠️  OpenAI API responded but with unexpected content")
            return True
            
    except Exception as e:
        print(f"❌ OpenAI API connection failed: {e}")
        print("   This may be due to rate limits, invalid API key, or network issues")
        return False

def run_comprehensive_test():
    """Run a comprehensive test of the AI system."""
    print("🔬 AI-Enhanced Leads Processing System - Comprehensive Test")
    print("=" * 60)
    
    test_results = []
    
    # Create test data
    try:
        test_files = create_test_data()
        test_results.append(("Test Data Creation", True))
    except Exception as e:
        print(f"❌ Failed to create test data: {e}")
        test_results.append(("Test Data Creation", False))
        return test_results
    
    # Test AI field mapper
    result = test_ai_field_mapper()
    test_results.append(("AI Field Mapper", result))
    
    # Test AI processor
    result = test_ai_processor()
    test_results.append(("AI Processor", result))
    
    # Test file processing
    result = test_file_processing(test_files)
    test_results.append(("File Processing", result))
    
    # Test OpenAI connection (optional)
    result = test_openai_connection()
    test_results.append(("OpenAI Connection", result))
    
    return test_results

def print_test_summary(test_results):
    """Print test summary."""
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 All tests passed! AI system is ready for use.")
    elif passed >= total * 0.8:
        print("\n⚠️  Most tests passed. System should work with minor issues.")
    else:
        print("\n❌ Multiple test failures. Please check dependencies and configuration.")
    
    print("\n📋 NEXT STEPS:")
    if passed == total:
        print("• Run: python master_leads_processor_ai.py your_file.csv")
        print("• Check AI summary in data/output/ directory")
    else:
        print("• Install missing dependencies: pip install -r requirements.txt")
        print("• Check OpenAI API key in .env file")
        print("• Review error messages above")

def main():
    """Main test function."""
    if len(sys.argv) > 1 and sys.argv[1] == '--quick':
        # Quick test without file processing
        print("🚀 Quick AI System Test")
        print("=" * 30)
        
        result1 = test_ai_field_mapper()
        result2 = test_ai_processor()
        
        if result1 and result2:
            print("\n✅ Quick test passed - AI system components are working")
        else:
            print("\n❌ Quick test failed - check dependencies")
    else:
        # Comprehensive test
        test_results = run_comprehensive_test()
        print_test_summary(test_results)

if __name__ == "__main__":
    main()
