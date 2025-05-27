#!/usr/bin/env python3
"""
AI Cost Optimization Utility
Analyzes API usage patterns and provides cost optimization recommendations.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime, timedelta
import argparse

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "core"))

class AICostOptimizer:
    """Utility for analyzing and optimizing AI API costs."""
    
    def __init__(self):
        self.cache_dir = Path("cache/ai_mappings")
        self.reports_dir = Path("reports/cost_analysis")
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        
    def analyze_cache_effectiveness(self) -> Dict[str, Any]:
        """Analyze cache hit rates and effectiveness."""
        cache_stats = {
            'mapping_cache_size': 0,
            'validation_cache_size': 0,
            'cache_age_days': 0,
            'estimated_savings': 0.0
        }
        
        try:
            if self.cache_dir.exists():
                mapping_cache_file = self.cache_dir / "mapping_cache.pkl"
                validation_cache_file = self.cache_dir / "validation_cache.pkl"
                
                if mapping_cache_file.exists():
                    import pickle
                    with open(mapping_cache_file, 'rb') as f:
                        mapping_cache = pickle.load(f)
                    cache_stats['mapping_cache_size'] = len(mapping_cache)
                    
                    # Calculate cache age
                    cache_age = datetime.now() - datetime.fromtimestamp(mapping_cache_file.stat().st_mtime)
                    cache_stats['cache_age_days'] = cache_age.days
                
                if validation_cache_file.exists():
                    with open(validation_cache_file, 'rb') as f:
                        validation_cache = pickle.load(f)
                    cache_stats['validation_cache_size'] = len(validation_cache)
                
                # Estimate savings (assuming $0.002 per 1K tokens, avg 200 tokens per call)
                total_cached_calls = cache_stats['mapping_cache_size'] + cache_stats['validation_cache_size']
                cache_stats['estimated_savings'] = total_cached_calls * 0.0004  # $0.0004 per cached call
                
        except Exception as e:
            print(f"Warning: Could not analyze cache: {e}")
            
        return cache_stats
    
    def analyze_processing_summaries(self, days_back: int = 7) -> Dict[str, Any]:
        """Analyze recent processing summaries for cost patterns."""
        summaries_dir = Path("data/output")
        cost_analysis = {
            'total_files_processed': 0,
            'total_api_calls': 0,
            'total_tokens_used': 0,
            'total_estimated_cost': 0.0,
            'avg_cost_per_file': 0.0,
            'cache_hit_rates': [],
            'ai_skip_rates': [],
            'recommendations': []
        }
        
        if not summaries_dir.exists():
            return cost_analysis
            
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        for summary_file in summaries_dir.glob("*_ai_summary.json"):
            try:
                file_date = datetime.fromtimestamp(summary_file.stat().st_mtime)
                if file_date < cutoff_date:
                    continue
                    
                with open(summary_file, 'r', encoding='utf-8') as f:
                    summary = json.load(f)
                
                ai_info = summary.get('ai_processing', {})
                api_usage = ai_info.get('api_usage', {})
                
                if api_usage:
                    cost_analysis['total_files_processed'] += 1
                    cost_analysis['total_api_calls'] += api_usage.get('total_calls', 0)
                    cost_analysis['total_tokens_used'] += api_usage.get('total_tokens_used', 0)
                    cost_analysis['total_estimated_cost'] += api_usage.get('estimated_cost', 0.0)
                    
                    if api_usage.get('cache_hit_ratio') is not None:
                        cost_analysis['cache_hit_rates'].append(api_usage['cache_hit_ratio'])
                    if api_usage.get('ai_skip_ratio') is not None:
                        cost_analysis['ai_skip_rates'].append(api_usage['ai_skip_ratio'])
                        
            except Exception as e:
                print(f"Warning: Could not process {summary_file}: {e}")
                continue
        
        # Calculate averages
        if cost_analysis['total_files_processed'] > 0:
            cost_analysis['avg_cost_per_file'] = cost_analysis['total_estimated_cost'] / cost_analysis['total_files_processed']
            
        if cost_analysis['cache_hit_rates']:
            avg_cache_hit_rate = sum(cost_analysis['cache_hit_rates']) / len(cost_analysis['cache_hit_rates'])
            cost_analysis['avg_cache_hit_rate'] = avg_cache_hit_rate
            
        if cost_analysis['ai_skip_rates']:
            avg_ai_skip_rate = sum(cost_analysis['ai_skip_rates']) / len(cost_analysis['ai_skip_rates'])
            cost_analysis['avg_ai_skip_rate'] = avg_ai_skip_rate
        
        return cost_analysis
    
    def generate_recommendations(self, cost_analysis: Dict[str, Any], cache_stats: Dict[str, Any]) -> List[str]:
        """Generate cost optimization recommendations."""
        recommendations = []
        
        # Cache effectiveness recommendations
        if cache_stats.get('mapping_cache_size', 0) < 10:
            recommendations.append("LOW CACHE USAGE: Process more files to build up cache and reduce future API calls")
        
        if cache_stats.get('cache_age_days', 0) > 30:
            recommendations.append("OLD CACHE: Consider clearing cache if data patterns have changed significantly")
        
        # API usage recommendations
        avg_cache_hit_rate = cost_analysis.get('avg_cache_hit_rate', 0)
        if avg_cache_hit_rate < 0.3:
            recommendations.append("LOW CACHE HIT RATE: Enable caching or process similar file structures to improve cache effectiveness")
        
        avg_ai_skip_rate = cost_analysis.get('avg_ai_skip_rate', 0)
        if avg_ai_skip_rate < 0.5:
            recommendations.append("LOW AI SKIP RATE: Improve rule-based mapping patterns to reduce AI dependency")
        
        # Cost-based recommendations
        avg_cost = cost_analysis.get('avg_cost_per_file', 0)
        if avg_cost > 0.05:  # More than 5 cents per file
            recommendations.append("HIGH COST PER FILE: Consider using smaller sample sizes or more aggressive AI skipping")
        
        total_cost = cost_analysis.get('total_estimated_cost', 0)
        if total_cost > 1.0:  # More than $1 total
            recommendations.append("HIGH TOTAL COST: Review AI usage patterns and consider batch processing")
        
        # Token usage recommendations
        total_tokens = cost_analysis.get('total_tokens_used', 0)
        if total_tokens > 50000:  # More than 50K tokens
            recommendations.append("HIGH TOKEN USAGE: Optimize prompts and reduce sample data sizes")
        
        if not recommendations:
            recommendations.append("OPTIMIZED: Current AI usage appears well-optimized for cost efficiency")
        
        return recommendations
    
    def generate_report(self, days_back: int = 7) -> str:
        """Generate a comprehensive cost optimization report."""
        print("Analyzing AI cost optimization...")
        
        cache_stats = self.analyze_cache_effectiveness()
        cost_analysis = self.analyze_processing_summaries(days_back)
        recommendations = self.generate_recommendations(cost_analysis, cache_stats)
        
        report = {
            'report_date': datetime.now().isoformat(),
            'analysis_period_days': days_back,
            'cache_analysis': cache_stats,
            'cost_analysis': cost_analysis,
            'recommendations': recommendations,
            'summary': {
                'total_estimated_savings': cache_stats.get('estimated_savings', 0),
                'optimization_score': self._calculate_optimization_score(cost_analysis, cache_stats)
            }
        }
        
        # Save report
        report_file = self.reports_dir / f"cost_optimization_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        return str(report_file)
    
    def _calculate_optimization_score(self, cost_analysis: Dict[str, Any], cache_stats: Dict[str, Any]) -> float:
        """Calculate an optimization score from 0-100."""
        score = 100.0
        
        # Deduct points for poor cache performance
        cache_hit_rate = cost_analysis.get('avg_cache_hit_rate', 0)
        score -= (1 - cache_hit_rate) * 30  # Up to 30 points for cache hits
        
        # Deduct points for low AI skip rate
        ai_skip_rate = cost_analysis.get('avg_ai_skip_rate', 0)
        score -= (1 - ai_skip_rate) * 25  # Up to 25 points for AI skipping
        
        # Deduct points for high cost per file
        avg_cost = cost_analysis.get('avg_cost_per_file', 0)
        if avg_cost > 0.01:  # More than 1 cent per file
            score -= min(25, avg_cost * 500)  # Up to 25 points for cost
        
        # Bonus points for good cache size
        cache_size = cache_stats.get('mapping_cache_size', 0) + cache_stats.get('validation_cache_size', 0)
        if cache_size > 50:
            score += 10
        
        return max(0, min(100, score))
    
    def print_report_summary(self, report_file: str):
        """Print a summary of the optimization report."""
        with open(report_file, 'r', encoding='utf-8') as f:
            report = json.load(f)
        
        print(f"\n{'='*60}")
        print("AI COST OPTIMIZATION REPORT")
        print(f"{'='*60}")
        print(f"Report Date: {report['report_date']}")
        print(f"Analysis Period: {report['analysis_period_days']} days")
        print(f"Optimization Score: {report['summary']['optimization_score']:.1f}/100")
        
        print(f"\n📊 COST ANALYSIS:")
        cost = report['cost_analysis']
        print(f"  • Files processed: {cost['total_files_processed']}")
        print(f"  • Total API calls: {cost['total_api_calls']}")
        print(f"  • Total tokens used: {cost['total_tokens_used']:,}")
        print(f"  • Total estimated cost: ${cost['total_estimated_cost']:.4f}")
        print(f"  • Average cost per file: ${cost['avg_cost_per_file']:.4f}")
        
        if 'avg_cache_hit_rate' in cost:
            print(f"  • Average cache hit rate: {cost['avg_cache_hit_rate']:.1%}")
        if 'avg_ai_skip_rate' in cost:
            print(f"  • Average AI skip rate: {cost['avg_ai_skip_rate']:.1%}")
        
        print(f"\n💾 CACHE ANALYSIS:")
        cache = report['cache_analysis']
        print(f"  • Mapping cache entries: {cache['mapping_cache_size']}")
        print(f"  • Validation cache entries: {cache['validation_cache_size']}")
        print(f"  • Cache age: {cache['cache_age_days']} days")
        print(f"  • Estimated savings: ${cache['estimated_savings']:.4f}")
        
        print(f"\n💡 RECOMMENDATIONS:")
        for i, rec in enumerate(report['recommendations'], 1):
            print(f"  {i}. {rec}")
        
        print(f"\n📄 Full report saved to: {report_file}")

def main():
    parser = argparse.ArgumentParser(description="AI Cost Optimization Analyzer")
    parser.add_argument('--days', type=int, default=7, help='Number of days to analyze (default: 7)')
    parser.add_argument('--quiet', action='store_true', help='Only save report, don\'t print summary')
    
    args = parser.parse_args()
    
    optimizer = AICostOptimizer()
    report_file = optimizer.generate_report(args.days)
    
    if not args.quiet:
        optimizer.print_report_summary(report_file)
    else:
        print(f"Cost optimization report saved to: {report_file}")

if __name__ == "__main__":
    main()
