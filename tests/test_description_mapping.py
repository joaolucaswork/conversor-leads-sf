#!/usr/bin/env python3
"""
Test script to debug the description mapping issue.
"""

import re
import unicodedata

def test_regex_patterns():
    """Test regex patterns with Portuguese characters."""
    print("🧪 Testing regex patterns with Portuguese characters...")
    
    # Test string
    test_string = "Descrição"
    test_string_lower = test_string.lower()
    
    print(f"Original: '{test_string}'")
    print(f"Lowercase: '{test_string_lower}'")
    print(f"Unicode representation: {[ord(c) for c in test_string_lower]}")
    
    # Test different regex patterns
    patterns = [
        r'descri[çc]ao',
        r'descri[çc]ão',
        r'descri[çc][aã]o',
        r'descri.*ao',
        r'descri.*ão',
        r'descri.*[aã]o',
        r'descrição',
        r'descricao'
    ]
    
    print(f"\n📋 Testing patterns against '{test_string_lower}':")
    for pattern in patterns:
        match = re.search(pattern, test_string_lower)
        status = "✅" if match else "❌"
        print(f"  {status} {pattern}")
    
    # Test normalization
    normalized = unicodedata.normalize('NFD', test_string_lower)
    print(f"\nNormalized (NFD): '{normalized}'")
    print(f"Unicode representation: {[ord(c) for c in normalized]}")
    
    return True

def test_current_mapping():
    """Test the current mapping logic."""
    print(f"\n🧪 Testing current mapping logic...")
    
    try:
        import sys
        sys.path.append('core')
        from ai_field_mapper import AIFieldMapper
        
        # Initialize mapper
        config = {"ai_processing": {"enabled": False, "confidence_threshold": 80.0}}
        mapper = AIFieldMapper(config)
        
        # Test with the actual column name
        test_columns = ['Descrição']
        mappings = mapper._rule_based_mapping(test_columns)
        
        for mapping in mappings:
            status = "✅" if mapping.target_field != "UNMAPPED" else "❌"
            print(f"  {status} '{mapping.source_field}' → '{mapping.target_field}' (confidence: {mapping.confidence}%)")
            print(f"      Reasoning: {mapping.reasoning}")
        
        return mappings[0].target_field == "Description" if mappings else False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_improved_pattern():
    """Test an improved regex pattern."""
    print(f"\n🧪 Testing improved regex pattern...")
    
    # Improved pattern that handles Unicode better
    improved_pattern = r'descri[çc][aã]o|description|obs|observa[çc][aã]o'
    
    test_strings = ['descrição', 'descricao', 'description', 'Descrição', 'DESCRIÇÃO']
    
    print(f"Pattern: {improved_pattern}")
    for test_str in test_strings:
        test_lower = test_str.lower()
        match = re.search(improved_pattern, test_lower)
        status = "✅" if match else "❌"
        print(f"  {status} '{test_str}' (lowercase: '{test_lower}')")
    
    return True

def main():
    """Main test function."""
    print("🔧 DESCRIPTION MAPPING DEBUG")
    print("=" * 50)
    
    # Test regex patterns
    test_regex_patterns()
    
    # Test current mapping
    current_works = test_current_mapping()
    
    # Test improved pattern
    test_improved_pattern()
    
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    
    if current_works:
        print("✅ Current mapping works correctly")
    else:
        print("❌ Current mapping needs fixing")
        print("\nRecommended fix:")
        print("Update the regex pattern to: r'descri[çc][aã]o|description|obs|observa[çc][aã]o'")

if __name__ == "__main__":
    main()
