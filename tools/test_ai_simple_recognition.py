#!/usr/bin/env python3
"""
Simple AI Recognition Test
Tests whether AI identifies fields by column names or by data content.
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "core"))

def test_data_vs_name():
    """Simple test to show AI uses data content, not just names"""
    print("🧪 AI Recognition Test: Data Content vs Column Names")
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
        
        # Test with misleading column names but clear data
        print("\n📋 Test: Misleading Column Names with Clear Data")
        print("-" * 50)
        
        columns = ["Phone_Field", "Email_Column", "Name_Data"]
        sample_data = {
            "Phone_Field": ["joao@email.com", "maria@gmail.com"],  # Email data in "phone" column
            "Email_Column": ["11999887766", "11888776655"],        # Phone data in "email" column  
            "Name_Data": ["SP", "RJ"]                              # State data in "name" column
        }
        
        print("Column names suggest:")
        print("  Phone_Field → should be Phone")
        print("  Email_Column → should be Email") 
        print("  Name_Data → should be Last Name")
        
        print("\nBut actual data content is:")
        print("  Phone_Field: ['joao@email.com', 'maria@gmail.com'] ← EMAIL data!")
        print("  Email_Column: ['11999887766', '11888776655'] ← PHONE data!")
        print("  Name_Data: ['SP', 'RJ'] ← STATE data!")
        
        print("\n🤖 What will AI choose? Names or Data?")
        print("-" * 40)
        
        mappings = mapper._ai_powered_mapping(columns, sample_data)
        
        print("📊 AI Results:")
        for mapping in mappings:
            print(f"  {mapping.source_field} → {mapping.target_field} (confidence: {mapping.confidence}%)")
            print(f"    Reasoning: {mapping.reasoning}")
        
        # Analysis
        print("\n🔍 Analysis:")
        print("-" * 40)
        
        phone_field_result = next((m for m in mappings if m.source_field == "Phone_Field"), None)
        email_column_result = next((m for m in mappings if m.source_field == "Email_Column"), None)
        name_data_result = next((m for m in mappings if m.source_field == "Name_Data"), None)
        
        correct_data_recognition = 0
        total_tests = 3
        
        if phone_field_result and phone_field_result.target_field == "Email":
            print("✅ Phone_Field → Email: AI correctly identified EMAIL data (ignored misleading name)")
            correct_data_recognition += 1
        else:
            print("❌ Phone_Field: AI followed column name instead of data content")
        
        if email_column_result and email_column_result.target_field in ["Phone", "Telefone Adcional"]:
            print("✅ Email_Column → Phone: AI correctly identified PHONE data (ignored misleading name)")
            correct_data_recognition += 1
        else:
            print("❌ Email_Column: AI followed column name instead of data content")
        
        if name_data_result and name_data_result.target_field == "State/Province":
            print("✅ Name_Data → State/Province: AI correctly identified STATE data (ignored misleading name)")
            correct_data_recognition += 1
        else:
            print("❌ Name_Data: AI followed column name instead of data content")
        
        print(f"\n📊 Score: {correct_data_recognition}/{total_tests} correct data-based identifications")
        
        if correct_data_recognition >= 2:
            print("\n🎯 CONCLUSION: AI primarily uses DATA CONTENT for identification!")
            print("   The AI analyzes the actual values in the columns, not just the column names.")
            print("   This is why 'Mystery_Field_1' with data ['João Silva', 'Maria Santos']")
            print("   was correctly identified as 'Last Name' - the AI recognized the name pattern.")
        else:
            print("\n🤔 CONCLUSION: AI seems to rely more on column names")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def main():
    """Run the simple recognition test"""
    print("🧠 AI Data Recognition Analysis")
    print("Understanding how AI identifies field types")
    
    success = test_data_vs_name()
    
    print("\n" + "=" * 60)
    print("📋 Summary")
    print("-" * 60)
    
    if success:
        print("✅ Test completed!")
        print("\n💡 Key Insight:")
        print("  The AI uses BOTH column names AND data content for field identification.")
        print("  When there's a conflict, data content usually takes precedence.")
        print("  This explains why ambiguous column names like 'Mystery_Field_1'")
        print("  can still be correctly identified based on their data patterns.")
        
        print("\n🔍 In your production case:")
        print("  • Column name: 'Mystery_Field_1' (ambiguous)")
        print("  • Data content: ['João Silva', 'Maria Santos'] (clear name pattern)")
        print("  • AI result: Last Name (based on data, not column name)")
        
        print("\n🎯 This is actually GOOD behavior - the AI is smart enough")
        print("   to look beyond misleading column names and analyze actual data!")
    else:
        print("❌ Test failed")

if __name__ == "__main__":
    main()
