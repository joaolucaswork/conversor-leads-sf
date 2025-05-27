#!/usr/bin/env python3
"""
AI Optimization Test Script
Demonstrates the AI cost optimization features and generates sample data for testing.
"""

import os
import sys
import json
import pandas as pd
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "core"))

def create_sample_data():
    """Create sample lead data files for testing."""
    data_dir = project_root / "data" / "input"
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # Sample 1: Standard format (should have high cache hit rate)
    sample1_data = {
        'Cliente': ['Maria Silva Santos', 'João Pedro Oliveira', 'Ana Costa Lima'],
        'Telefone': ['(11)987654321', '(21)876543210', '(31)765432109'],
        'Email': ['maria@email.com', 'joao@email.com', 'ana@email.com'],
        'Estado': ['SP', 'RJ', 'MG'],
        'Descrição': ['ModeradoRegular', 'ArrojadoQualificado', 'ConservadorIniciante'],
        'Alias': ['user1', 'user2', 'user3']
    }
    
    df1 = pd.DataFrame(sample1_data)
    sample1_path = data_dir / "sample_leads_standard.xlsx"
    df1.to_excel(sample1_path, index=False)
    print(f"✓ Created sample file: {sample1_path}")
    
    # Sample 2: Similar format (should benefit from cache)
    sample2_data = {
        'Lead': ['Carlos Mendes', 'Lucia Fernandes', 'Roberto Silva'],
        'Tel. Fixo': ['(11)123456789', '(21)234567890', '(31)345678901'],
        'E-mail': ['carlos@test.com', 'lucia@test.com', 'roberto@test.com'],
        'Province': ['São Paulo', 'Rio de Janeiro', 'Minas Gerais'],
        'Description': ['ModerateRegular', 'AggressiveQualified', 'ConservativeBeginning'],
        'Owner': ['agent1', 'agent2', 'agent3']
    }
    
    df2 = pd.DataFrame(sample2_data)
    sample2_path = data_dir / "sample_leads_similar.xlsx"
    df2.to_excel(sample2_path, index=False)
    print(f"✓ Created sample file: {sample2_path}")
    
    # Sample 3: Complex format (should require AI processing)
    sample3_data = {
        'Customer_Name_Full': ['Patricia Rodrigues Santos', 'Fernando Lima Costa'],
        'Primary_Contact_Number': ['+55 11 98765-4321', '+55 21 87654-3210'],
        'Electronic_Mail_Address': ['patricia.rodrigues@company.com', 'fernando.lima@business.com'],
        'Geographic_Region': ['Southeast Brazil', 'Southeast Brazil'],
        'Investment_Profile_Details': ['HighRiskHighReturn', 'ModerateRiskBalanced'],
        'Account_Manager_ID': ['mgr001', 'mgr002']
    }
    
    df3 = pd.DataFrame(sample3_data)
    sample3_path = data_dir / "sample_leads_complex.xlsx"
    df3.to_excel(sample3_path, index=False)
    print(f"✓ Created sample file: {sample3_path}")
    
    return [sample1_path, sample2_path, sample3_path]

def test_ai_optimization():
    """Test AI optimization features."""
    print("🤖 Testing AI Optimization Features")
    print("=" * 50)
    
    try:
        from core.ai_field_mapper import AIFieldMapper
        from core.master_leads_processor_ai import AIEnhancedLeadsProcessor
        
        # Initialize AI components
        config = {
            'ai_processing': {
                'enabled': True,
                'confidence_threshold': 80.0,
                'optimization': {
                    'enable_caching': True,
                    'smart_ai_usage': True,
                    'rule_based_threshold': 0.8
                }
            }
        }
        
        ai_mapper = AIFieldMapper(config)
        processor = AIEnhancedLeadsProcessor()
        
        print(f"✓ AI Field Mapper initialized")
        print(f"✓ AI Enhanced Processor initialized")
        
        # Test column mapping with caching
        test_columns = ['Cliente', 'Telefone', 'Email', 'Estado']
        
        print(f"\n📊 Testing Column Mapping:")
        print(f"Columns: {test_columns}")
        
        # First mapping (should use AI or rules)
        mappings1 = ai_mapper.analyze_columns(test_columns)
        stats1 = ai_mapper.get_api_usage_stats()
        
        print(f"✓ First mapping completed")
        print(f"  - API calls: {stats1.get('total_calls', 0)}")
        print(f"  - Cache hits: {stats1.get('cache_hits', 0)}")
        print(f"  - AI skipped: {stats1.get('ai_skipped', 0)}")
        
        # Second mapping (should use cache)
        mappings2 = ai_mapper.analyze_columns(test_columns)
        stats2 = ai_mapper.get_api_usage_stats()
        
        print(f"✓ Second mapping completed")
        print(f"  - API calls: {stats2.get('total_calls', 0)}")
        print(f"  - Cache hits: {stats2.get('cache_hits', 0)}")
        print(f"  - Cache hit ratio: {stats2.get('cache_hit_ratio', 0):.1%}")
        
        # Test with different columns
        complex_columns = ['Customer_Name_Full', 'Primary_Contact_Number', 'Electronic_Mail_Address']
        mappings3 = ai_mapper.analyze_columns(complex_columns)
        stats3 = ai_mapper.get_api_usage_stats()
        
        print(f"✓ Complex mapping completed")
        print(f"  - Total API calls: {stats3.get('total_calls', 0)}")
        print(f"  - Total cache hits: {stats3.get('cache_hits', 0)}")
        print(f"  - Final cache hit ratio: {stats3.get('cache_hit_ratio', 0):.1%}")
        print(f"  - AI skip ratio: {stats3.get('ai_skip_ratio', 0):.1%}")
        print(f"  - Estimated cost: ${stats3.get('estimated_cost', 0):.4f}")
        
        # Generate optimization report
        optimization_score = calculate_optimization_score(stats3)
        print(f"\n🎯 Optimization Score: {optimization_score}/100")
        
        if optimization_score >= 80:
            print("✅ Excellent optimization!")
        elif optimization_score >= 60:
            print("⚠️ Good optimization, room for improvement")
        else:
            print("❌ Optimization needs work")
            
        return stats3
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure all dependencies are installed and the project is properly set up.")
        return None
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return None

def calculate_optimization_score(stats):
    """Calculate optimization score from API usage stats."""
    if not stats:
        return 0
        
    cache_score = (stats.get('cache_hit_ratio', 0)) * 30
    ai_skip_score = (stats.get('ai_skip_ratio', 0)) * 25
    cost_score = max(0, 25 - (stats.get('estimated_cost', 0)) * 500)
    base_score = 20
    
    return min(100, round(cache_score + ai_skip_score + cost_score + base_score))

def generate_demo_summary():
    """Generate a demo processing summary with AI statistics."""
    demo_summary = {
        "processing_date": datetime.now().isoformat(),
        "input_file": "demo_leads.xlsx",
        "output_file": "demo_leads_processed.csv",
        "total_records": 150,
        "ai_processing": {
            "ai_enabled": True,
            "mapping_summary": {
                "total_columns": 6,
                "mapped_columns": 6,
                "confidence_scores": [95.0, 98.0, 92.0, 88.0, 85.0, 90.0]
            },
            "validation_summary": {
                "fields_validated": 6,
                "total_issues_found": 2,
                "total_suggestions": 3
            },
            "ai_stats": {
                "mappings_attempted": 1,
                "mappings_successful": 1,
                "validations_attempted": 6,
                "fallbacks_to_rules": 0
            },
            "api_usage": {
                "total_calls": 2,
                "mapping_calls": 1,
                "validation_calls": 1,
                "total_tokens_used": 450,
                "estimated_cost": 0.0009,
                "cache_hits": 4,
                "cache_misses": 2,
                "ai_skipped": 3,
                "cache_hit_ratio": 0.67,
                "ai_skip_ratio": 0.50
            }
        }
    }
    
    # Save demo summary
    output_dir = project_root / "data" / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    summary_file = output_dir / "demo_ai_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(demo_summary, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Demo summary saved to: {summary_file}")
    return demo_summary

def main():
    """Main test function."""
    print("🚀 AI Optimization Test Suite")
    print("=" * 50)
    
    # Create sample data
    print("\n📁 Creating Sample Data Files...")
    sample_files = create_sample_data()
    
    # Test AI optimization
    print("\n🧪 Testing AI Optimization...")
    stats = test_ai_optimization()
    
    # Generate demo summary
    print("\n📊 Generating Demo Summary...")
    demo_summary = generate_demo_summary()
    
    # Print final results
    print("\n🎉 Test Results Summary:")
    print("=" * 30)
    print(f"✓ Sample files created: {len(sample_files)}")
    
    if stats:
        print(f"✓ AI optimization tested successfully")
        print(f"  - API calls made: {stats.get('total_calls', 0)}")
        print(f"  - Cache effectiveness: {stats.get('cache_hit_ratio', 0):.1%}")
        print(f"  - Cost efficiency: ${stats.get('estimated_cost', 0):.4f}")
        print(f"  - Optimization score: {calculate_optimization_score(stats)}/100")
    else:
        print("❌ AI optimization test failed")
    
    print(f"✓ Demo summary generated")
    
    print("\n💡 Next Steps:")
    print("1. Start the backend server: python backend/main.py")
    print("2. Start the frontend: npm run dev")
    print("3. Upload the sample files to see AI optimization in action")
    print("4. Check the cost tracking dashboard for optimization metrics")

if __name__ == "__main__":
    main()
