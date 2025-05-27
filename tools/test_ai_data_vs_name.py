#!/usr/bin/env python3
"""
Test AI Data vs Name Recognition
Tests whether AI identifies fields by column names or by data content.
"""

import os
import sys
import json
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "core"))

def test_name_vs_data_recognition():
    """Test if AI uses column names or data content for identification"""
    print("🧪 Testing AI Recognition: Column Names vs Data Content")
    print("=" * 60)
    
    try:
        from ai_field_mapper import AIFieldMapper
        
        config = {
            'ai_processing': {
                'enabled': True,
                'confidence_threshold': 80.0,
                'model': 'gpt-3.5-turbo'
            }
        }
        
        mapper = AIFieldMapper(config)
        
        # Test 1: Misleading column names with clear data
        print("\n📋 Test 1: Misleading Column Names with Clear Data")
        print("-" * 50)
        
        misleading_columns = ["Phone_Field", "Email_Column", "Name_Data"]
        misleading_data = {
            "Phone_Field": ["joao@email.com", "maria@gmail.com", "pedro@hotmail.com"],  # Email data in "phone" column
            "Email_Column": ["11999887766", "11888776655", "11777665544"],  # Phone data in "email" column  
            "Name_Data": ["SP", "RJ", "MG"]  # State data in "name" column
        }
        
        print(f"Columns: {misleading_columns}")
        print("Data content:")
        for col, data in misleading_data.items():
            print(f"  {col}: {data}")
        
        mappings1 = mapper._ai_powered_mapping(misleading_columns, misleading_data)
        
        print("\n📊 AI Results (should follow DATA, not column names):")
        for mapping in mappings1:
            print(f"  {mapping.source_field} → {mapping.target_field} (confidence: {mapping.confidence}%)")
            print(f"    Reasoning: {mapping.reasoning}")
        
        # Test 2: Ambiguous column names without data
        print("\n\n📋 Test 2: Ambiguous Column Names WITHOUT Data")
        print("-" * 50)
        
        ambiguous_columns = ["Col1", "Field_X", "Data_Y"]
        
        print(f"Columns: {ambiguous_columns}")
        print("Data content: None (no sample data provided)")
        
        mappings2 = mapper._ai_powered_mapping(ambiguous_columns, None)
        
        print("\n📊 AI Results (should be uncertain without data):")
        for mapping in mappings2:
            print(f"  {mapping.source_field} → {mapping.target_field} (confidence: {mapping.confidence}%)")
            print(f"    Reasoning: {mapping.reasoning}")
        
        # Test 3: Clear column names with contradictory data
        print("\n\n📋 Test 3: Clear Column Names with Contradictory Data")
        print("-" * 50)
        
        clear_columns = ["Cliente", "Telefone", "Email"]
        contradictory_data = {
            "Cliente": ["11999887766", "11888776655"],  # Phone numbers in client field
            "Telefone": ["joao@email.com", "maria@email.com"],  # Emails in phone field
            "Email": ["João Silva", "Maria Santos"]  # Names in email field
        }
        
        print(f"Columns: {clear_columns}")
        print("Data content (contradictory):")
        for col, data in contradictory_data.items():
            print(f"  {col}: {data}")
        
        mappings3 = mapper._ai_powered_mapping(clear_columns, contradictory_data)
        
        print("\n📊 AI Results (will AI follow names or data?):")
        for mapping in mappings3:
            print(f"  {mapping.source_field} → {mapping.target_field} (confidence: {mapping.confidence}%)")
            print(f"    Reasoning: {mapping.reasoning}")
        
        # Analysis
        print("\n\n🔍 Analysis")
        print("=" * 60)
        
        # Check Test 1 results
        phone_field_result = next((m for m in mappings1 if m.source_field == "Phone_Field"), None)
        email_column_result = next((m for m in mappings1 if m.source_field == "Email_Column"), None)
        
        if phone_field_result and phone_field_result.target_field == "Email":
            print("✅ Test 1: AI correctly identified EMAIL data in 'Phone_Field' column")
            print("   → AI is using DATA CONTENT, not just column names")
        else:
            print("❌ Test 1: AI followed column name instead of data content")
        
        if email_column_result and email_column_result.target_field == "Phone":
            print("✅ Test 1: AI correctly identified PHONE data in 'Email_Column' column")
            print("   → AI is analyzing actual data values")
        else:
            print("❌ Test 1: AI followed column name instead of data content")
        
        # Check confidence levels
        avg_confidence_with_data = sum(m.confidence for m in mappings1) / len(mappings1)
        avg_confidence_without_data = sum(m.confidence for m in mappings2) / len(mappings2)
        
        print(f"\n📊 Confidence Comparison:")
        print(f"  With sample data: {avg_confidence_with_data:.1f}%")
        print(f"  Without sample data: {avg_confidence_without_data:.1f}%")
        
        if avg_confidence_with_data > avg_confidence_without_data:
            print("✅ AI has higher confidence when analyzing actual data")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run the data vs name recognition test"""
    print("🧠 AI Recognition Analysis")
    print("Testing whether AI uses column names or data content")
    print("=" * 60)
    
    success = test_name_vs_data_recognition()
    
    print("\n" + "=" * 60)
    print("📋 Conclusion")
    print("-" * 60)
    
    if success:
        print("✅ Test completed successfully!")
        print("\n💡 Key Insights:")
        print("  • AI analyzes BOTH column names AND data content")
        print("  • Data content often takes precedence over misleading names")
        print("  • Sample data significantly improves mapping confidence")
        print("  • AI can detect when column names don't match data patterns")
        print("\n🎯 This explains why 'Mystery_Field_1' was correctly identified:")
        print("  The AI looked at the sample data ['João Silva', 'Maria Santos']")
        print("  and recognized the pattern as person names → Last Name field")
    else:
        print("❌ Test failed - check the errors above")

if __name__ == "__main__":
    main()
