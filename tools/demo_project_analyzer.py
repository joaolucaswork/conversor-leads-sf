#!/usr/bin/env python3
"""
Project Structure Analyzer Demo Script
Demonstrates the capabilities of the project structure analyzer.

This script shows how to:
1. Analyze the current project structure
2. Generate comprehensive reports
3. Preview reorganization changes
4. Apply improvements with backup

Author: AI Assistant
Date: 2024
"""

import sys
import os
from pathlib import Path

# Add the tools directory to the path so we can import the analyzer
sys.path.insert(0, str(Path(__file__).parent))

from project_structure_analyzer import ProjectStructureAnalyzer

def demo_analysis():
    """Demonstrate project structure analysis."""
    print("🔍 PROJECT STRUCTURE ANALYZER DEMO")
    print("=" * 50)
    
    # Initialize analyzer for current project
    analyzer = ProjectStructureAnalyzer()
    
    print("\n1. 📊 ANALYZING CURRENT PROJECT STRUCTURE...")
    print("-" * 40)
    
    # Perform comprehensive analysis
    structure = analyzer.analyze_current_structure()
    
    # Display basic project info
    project_info = structure['project_info']
    print(f"Project Name: {project_info['name']}")
    print(f"Project Type: {', '.join(project_info['project_type'])}")
    print(f"Total Files: {project_info['total_files']}")
    print(f"Total Directories: {project_info['total_directories']}")
    print(f"Project Size: {project_info['project_size_mb']} MB")
    
    # Display technology stack
    tech_stack = structure['technology_stack']
    print(f"\nTechnology Stack:")
    for category, technologies in tech_stack.items():
        if technologies:
            print(f"  {category.title()}: {', '.join(technologies)}")
    
    # Display organization patterns
    patterns = structure['organization_patterns']
    print(f"\nOrganization Score: {patterns['modularity_score']:.1f}%")
    print(f"Patterns Identified: {', '.join(patterns['patterns_identified'])}")
    
    # Display issues
    issues = structure['issues_identified']
    if issues:
        print(f"\n⚠️  Issues Found ({len(issues)}):")
        for issue in issues:
            print(f"  • {issue['type']}: {issue['description']}")
    else:
        print("\n✅ No structural issues detected!")
    
    print("\n2. 💡 GENERATING IMPROVEMENT PROPOSALS...")
    print("-" * 40)
    
    # Generate proposals
    proposals = analyzer.propose_organizational_improvements()
    
    # Display recommended structure
    recommended = proposals['recommended_structure']
    print(f"Recommended Structure Type: {recommended['type']}")
    print(f"Description: {recommended['description']}")
    
    # Display file relocations
    relocations = proposals['file_relocations']
    if relocations:
        print(f"\n📁 File Relocations Proposed ({len(relocations)}):")
        for relocation in relocations[:3]:  # Show first 3
            print(f"  • {relocation['current_path']} → {relocation['proposed_path']}")
            print(f"    Reason: {relocation['reason']}")
    
    # Display new directories
    new_dirs = proposals['new_directories']
    if new_dirs:
        print(f"\n📂 New Directories Proposed ({len(new_dirs)}):")
        for new_dir in new_dirs[:3]:  # Show first 3
            print(f"  • {new_dir['path']}: {new_dir['description']}")
    
    # Display cleanup suggestions
    cleanup = proposals['cleanup_suggestions']
    if cleanup:
        print(f"\n🧹 Cleanup Suggestions ({len(cleanup)}):")
        for suggestion in cleanup:
            print(f"  • {suggestion['type']}: {suggestion['reason']}")
    
    print("\n3. 🌳 DIRECTORY TREE VISUALIZATION")
    print("-" * 40)
    
    # Generate and display directory tree
    tree = analyzer.generate_directory_tree_visualization(max_depth=2)
    print(tree)
    
    print("\n4. 📋 PREVIEW REORGANIZATION CHANGES")
    print("-" * 40)
    
    # Preview changes without applying them
    preview_results = analyzer.apply_reorganization(preview_only=True)
    
    print(f"Total Changes Proposed: {preview_results['summary']['total_changes']}")
    print(f"Potential Errors: {preview_results['summary']['errors_count']}")
    
    if preview_results['changes_applied']:
        print("\nProposed Changes:")
        for change in preview_results['changes_applied'][:5]:  # Show first 5
            print(f"  • {change['action']}")
    
    print("\n5. 📄 GENERATING COMPREHENSIVE REPORT")
    print("-" * 40)
    
    # Generate JSON report
    json_report = analyzer.generate_comprehensive_report('json')
    print(f"JSON Report saved to: {json_report}")
    
    # Generate HTML report
    html_report = analyzer.generate_comprehensive_report('html')
    print(f"HTML Report saved to: {html_report}")
    
    print("\n✅ DEMO COMPLETED SUCCESSFULLY!")
    print("=" * 50)
    print("\nNext Steps:")
    print("1. Review the generated reports")
    print("2. Run 'python tools/project_structure_analyzer.py preview' to see detailed changes")
    print("3. Run 'python tools/project_structure_analyzer.py reorganize' to apply changes")
    print("4. Always backup your project before applying changes!")

def demo_command_line_usage():
    """Demonstrate command-line usage examples."""
    print("\n🖥️  COMMAND-LINE USAGE EXAMPLES")
    print("=" * 50)
    
    examples = [
        {
            'command': 'python tools/project_structure_analyzer.py analyze',
            'description': 'Analyze current project structure and generate JSON report'
        },
        {
            'command': 'python tools/project_structure_analyzer.py analyze --format html',
            'description': 'Generate HTML report with visual formatting'
        },
        {
            'command': 'python tools/project_structure_analyzer.py tree',
            'description': 'Display directory tree visualization'
        },
        {
            'command': 'python tools/project_structure_analyzer.py tree --max-depth 4',
            'description': 'Show directory tree with custom depth'
        },
        {
            'command': 'python tools/project_structure_analyzer.py preview',
            'description': 'Preview reorganization changes without applying them'
        },
        {
            'command': 'python tools/project_structure_analyzer.py reorganize',
            'description': 'Apply reorganization changes (creates backup automatically)'
        }
    ]
    
    for i, example in enumerate(examples, 1):
        print(f"\n{i}. {example['description']}")
        print(f"   Command: {example['command']}")

def main():
    """Main demo function."""
    try:
        # Run the main demo
        demo_analysis()
        
        # Show command-line examples
        demo_command_line_usage()
        
        print(f"\n📚 For more information, run:")
        print(f"   python tools/project_structure_analyzer.py --help")
        
    except Exception as e:
        print(f"❌ Demo failed with error: {str(e)}")
        print("Make sure you're running this from the project root directory.")
        sys.exit(1)

if __name__ == '__main__':
    main()
