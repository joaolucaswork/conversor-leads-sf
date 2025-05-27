#!/usr/bin/env python3
"""
Project Structure Analyzer and Reorganization Tool
Comprehensive script for analyzing current project structure and proposing improvements.

This script:
1. Analyzes current directory structure and file organization
2. Identifies file types, purposes, and relationships
3. Proposes organizational improvements based on best practices
4. Generates detailed reports with before/after comparisons
5. Provides automated reorganization capabilities with backup mechanisms

Author: AI Assistant
Date: 2024
"""

import os
import sys
import json
import shutil
import logging
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from collections import defaultdict, Counter
import re

class ProjectStructureAnalyzer:
    """Comprehensive project structure analysis and reorganization tool."""

    def __init__(self, project_root: str = None):
        """Initialize the analyzer with project root directory."""
        self.project_root = Path(project_root) if project_root else Path.cwd()
        self.setup_logging()

        # File type categories for analysis
        self.file_categories = {
            'source_code': {
                'extensions': ['.py', '.js', '.jsx', '.ts', '.tsx', '.vue', '.html', '.css', '.scss', '.sass'],
                'description': 'Source code files'
            },
            'configuration': {
                'extensions': ['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf'],
                'description': 'Configuration files'
            },
            'documentation': {
                'extensions': ['.md', '.rst', '.txt', '.pdf'],
                'description': 'Documentation files'
            },
            'data': {
                'extensions': ['.csv', '.xlsx', '.xls', '.json', '.xml'],
                'description': 'Data files'
            },
            'media': {
                'extensions': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.lottie'],
                'description': 'Media and asset files'
            },
            'build_artifacts': {
                'extensions': ['.exe', '.msi', '.dmg', '.deb', '.rpm', '.zip', '.tar.gz'],
                'description': 'Build and distribution artifacts'
            },
            'logs': {
                'extensions': ['.log'],
                'description': 'Log files'
            }
        }

        # Directories to ignore during analysis
        self.ignore_dirs = {
            'node_modules', '__pycache__', '.git', '.vscode', '.idea',
            'venv', 'env', 'dist', 'build', 'coverage', '.pytest_cache',
            'dist-renderer', 'dist-electron', '.next', 'out'
        }

        # Current structure analysis results
        self.current_structure = {}
        self.file_analysis = {}
        self.dependency_analysis = {}

    def setup_logging(self):
        """Set up logging configuration."""
        log_dir = self.project_root / 'logs'
        log_dir.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_file = log_dir / f'project_analysis_{timestamp}.log'

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)

    def analyze_current_structure(self) -> Dict[str, Any]:
        """Analyze the current project structure comprehensively."""
        self.logger.info("Starting comprehensive project structure analysis...")

        structure_analysis = {
            'project_info': self._get_project_info(),
            'directory_tree': self._build_directory_tree(),
            'file_distribution': self._analyze_file_distribution(),
            'technology_stack': self._identify_technology_stack(),
            'dependency_analysis': self._analyze_dependencies(),
            'naming_conventions': self._analyze_naming_conventions(),
            'organization_patterns': self._identify_organization_patterns(),
            'issues_identified': self._identify_structural_issues()
        }

        self.current_structure = structure_analysis
        return structure_analysis

    def _get_project_info(self) -> Dict[str, Any]:
        """Extract basic project information."""
        info = {
            'name': self.project_root.name,
            'root_path': str(self.project_root),
            'analysis_date': datetime.now().isoformat(),
            'total_files': 0,
            'total_directories': 0,
            'project_size_mb': 0
        }

        # Count files and directories
        for root, dirs, files in os.walk(self.project_root):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]

            info['total_directories'] += len(dirs)
            info['total_files'] += len(files)

            # Calculate size
            for file in files:
                try:
                    file_path = Path(root) / file
                    info['project_size_mb'] += file_path.stat().st_size
                except (OSError, FileNotFoundError):
                    continue

        info['project_size_mb'] = round(info['project_size_mb'] / (1024 * 1024), 2)

        # Identify project type
        info['project_type'] = self._identify_project_type()

        return info

    def _identify_project_type(self) -> List[str]:
        """Identify the type of project based on files present."""
        project_types = []

        # Check for different project indicators
        indicators = {
            'electron': ['app/main.js', 'electron-builder.yml', 'package.json'],
            'react': ['src/App.jsx', 'src/index.jsx', 'vite.config.js'],
            'python': ['requirements.txt', '*.py files', 'setup.py'],
            'fastapi': ['backend/main.py', 'uvicorn'],
            'salesforce': ['salesforce_integration.py', 'oauth'],
            'ai_ml': ['openai', 'ai_field_mapper.py', 'machine learning']
        }

        for project_type, files in indicators.items():
            if any(self._file_exists_pattern(pattern) for pattern in files):
                project_types.append(project_type)

        return project_types

    def _file_exists_pattern(self, pattern: str) -> bool:
        """Check if files matching pattern exist."""
        if pattern.endswith('.py files'):
            return any(self.project_root.rglob('*.py'))
        elif pattern in ['uvicorn', 'openai', 'oauth', 'machine learning']:
            # Check in requirements.txt or package.json
            return self._check_dependency(pattern)
        else:
            return (self.project_root / pattern).exists()

    def _check_dependency(self, dep_name: str) -> bool:
        """Check if dependency exists in project files."""
        # Check requirements.txt
        req_file = self.project_root / 'requirements.txt'
        if req_file.exists():
            content = req_file.read_text()
            if dep_name.lower() in content.lower():
                return True

        # Check package.json
        pkg_file = self.project_root / 'package.json'
        if pkg_file.exists():
            try:
                pkg_data = json.loads(pkg_file.read_text())
                deps = {**pkg_data.get('dependencies', {}), **pkg_data.get('devDependencies', {})}
                return any(dep_name.lower() in dep.lower() for dep in deps.keys())
            except json.JSONDecodeError:
                pass

        return False

    def _build_directory_tree(self) -> Dict[str, Any]:
        """Build a comprehensive directory tree structure."""
        def build_tree(path: Path, max_depth: int = 3, current_depth: int = 0) -> Dict[str, Any]:
            if current_depth >= max_depth:
                return {'type': 'directory', 'truncated': True}

            tree = {
                'type': 'directory',
                'children': {},
                'file_count': 0,
                'dir_count': 0
            }

            try:
                for item in sorted(path.iterdir()):
                    if item.name.startswith('.') and item.name not in ['.env.example', '.gitignore']:
                        continue
                    if item.name in self.ignore_dirs:
                        continue

                    if item.is_dir():
                        tree['children'][item.name] = build_tree(item, max_depth, current_depth + 1)
                        tree['dir_count'] += 1
                    else:
                        tree['children'][item.name] = {
                            'type': 'file',
                            'size': item.stat().st_size,
                            'extension': item.suffix,
                            'category': self._categorize_file(item)
                        }
                        tree['file_count'] += 1
            except PermissionError:
                tree['error'] = 'Permission denied'

            return tree

        return build_tree(self.project_root)

    def _categorize_file(self, file_path: Path) -> str:
        """Categorize a file based on its extension and location."""
        extension = file_path.suffix.lower()

        for category, info in self.file_categories.items():
            if extension in info['extensions']:
                return category

        return 'other'

    def _analyze_file_distribution(self) -> Dict[str, Any]:
        """Analyze the distribution of files across categories and directories."""
        distribution = {
            'by_category': defaultdict(int),
            'by_directory': defaultdict(int),
            'by_extension': defaultdict(int),
            'large_files': [],
            'empty_directories': []
        }

        for root, dirs, files in os.walk(self.project_root):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]

            root_path = Path(root)
            relative_root = root_path.relative_to(self.project_root)

            # Check for empty directories
            if not files and not dirs:
                distribution['empty_directories'].append(str(relative_root))

            for file in files:
                file_path = root_path / file
                try:
                    file_size = file_path.stat().st_size
                    extension = file_path.suffix.lower()
                    category = self._categorize_file(file_path)

                    distribution['by_category'][category] += 1
                    distribution['by_directory'][str(relative_root)] += 1
                    distribution['by_extension'][extension] += 1

                    # Track large files (>10MB)
                    if file_size > 10 * 1024 * 1024:
                        distribution['large_files'].append({
                            'path': str(file_path.relative_to(self.project_root)),
                            'size_mb': round(file_size / (1024 * 1024), 2)
                        })

                except (OSError, FileNotFoundError):
                    continue

        return dict(distribution)

    def _identify_technology_stack(self) -> Dict[str, Any]:
        """Identify the technology stack used in the project."""
        stack = {
            'frontend': [],
            'backend': [],
            'desktop': [],
            'ai_ml': [],
            'databases': [],
            'build_tools': [],
            'testing': [],
            'deployment': []
        }

        # Analyze package.json for frontend technologies
        pkg_file = self.project_root / 'package.json'
        if pkg_file.exists():
            try:
                pkg_data = json.loads(pkg_file.read_text())
                deps = {**pkg_data.get('dependencies', {}), **pkg_data.get('devDependencies', {})}

                frontend_techs = {
                    'react': ['react', 'react-dom'],
                    'vite': ['vite'],
                    'mui': ['@mui/material', '@mui/icons-material'],
                    'axios': ['axios'],
                    'i18next': ['i18next', 'react-i18next'],
                    'zustand': ['zustand'],
                    'lottie': ['lottie-react', '@lottiefiles/dotlottie-react']
                }

                desktop_techs = {
                    'electron': ['electron', 'electron-builder'],
                    'electron-store': ['electron-store']
                }

                build_techs = {
                    'vite': ['vite', '@vitejs/plugin-react'],
                    'concurrently': ['concurrently'],
                    'cross-env': ['cross-env']
                }

                for tech, packages in frontend_techs.items():
                    if any(pkg in deps for pkg in packages):
                        stack['frontend'].append(tech)

                for tech, packages in desktop_techs.items():
                    if any(pkg in deps for pkg in packages):
                        stack['desktop'].append(tech)

                for tech, packages in build_techs.items():
                    if any(pkg in deps for pkg in packages):
                        stack['build_tools'].append(tech)

            except json.JSONDecodeError:
                pass

        # Analyze requirements.txt for backend technologies
        req_file = self.project_root / 'requirements.txt'
        if req_file.exists():
            content = req_file.read_text().lower()

            backend_techs = {
                'fastapi': ['fastapi'],
                'uvicorn': ['uvicorn'],
                'pandas': ['pandas'],
                'requests': ['requests'],
                'httpx': ['httpx'],
                'pydantic': ['pydantic']
            }

            ai_techs = {
                'openai': ['openai'],
                'machine_learning': ['scikit-learn', 'tensorflow', 'pytorch']
            }

            for tech, packages in backend_techs.items():
                if any(pkg in content for pkg in packages):
                    stack['backend'].append(tech)

            for tech, packages in ai_techs.items():
                if any(pkg in content for pkg in packages):
                    stack['ai_ml'].append(tech)

        return stack

    def _analyze_dependencies(self) -> Dict[str, Any]:
        """Analyze project dependencies and their relationships."""
        dependencies = {
            'frontend_deps': {},
            'backend_deps': {},
            'dev_dependencies': {},
            'dependency_issues': []
        }

        # Analyze package.json
        pkg_file = self.project_root / 'package.json'
        if pkg_file.exists():
            try:
                pkg_data = json.loads(pkg_file.read_text())
                dependencies['frontend_deps'] = pkg_data.get('dependencies', {})
                dependencies['dev_dependencies'] = pkg_data.get('devDependencies', {})
            except json.JSONDecodeError:
                dependencies['dependency_issues'].append('Invalid package.json format')

        # Analyze requirements.txt
        req_file = self.project_root / 'requirements.txt'
        if req_file.exists():
            try:
                content = req_file.read_text()
                backend_deps = {}
                for line in content.strip().split('\n'):
                    if line and not line.startswith('#'):
                        if '==' in line:
                            name, version = line.split('==', 1)
                            backend_deps[name.strip()] = version.strip()
                        else:
                            backend_deps[line.strip()] = 'latest'
                dependencies['backend_deps'] = backend_deps
            except Exception as e:
                dependencies['dependency_issues'].append(f'Error reading requirements.txt: {str(e)}')

        return dependencies

    def _analyze_naming_conventions(self) -> Dict[str, Any]:
        """Analyze naming conventions used throughout the project."""
        conventions = {
            'file_naming': defaultdict(int),
            'directory_naming': defaultdict(int),
            'inconsistencies': [],
            'recommendations': []
        }

        # Analyze file and directory naming patterns
        for root, dirs, files in os.walk(self.project_root):
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]

            # Analyze directory naming
            for dir_name in dirs:
                if '_' in dir_name:
                    conventions['directory_naming']['snake_case'] += 1
                elif '-' in dir_name:
                    conventions['directory_naming']['kebab_case'] += 1
                elif dir_name.islower():
                    conventions['directory_naming']['lowercase'] += 1
                elif any(c.isupper() for c in dir_name):
                    conventions['directory_naming']['camelCase'] += 1

            # Analyze file naming
            for file_name in files:
                name_without_ext = Path(file_name).stem
                if '_' in name_without_ext:
                    conventions['file_naming']['snake_case'] += 1
                elif '-' in name_without_ext:
                    conventions['file_naming']['kebab_case'] += 1
                elif name_without_ext.islower():
                    conventions['file_naming']['lowercase'] += 1
                elif any(c.isupper() for c in name_without_ext):
                    conventions['file_naming']['camelCase'] += 1

        return dict(conventions)

    def _identify_organization_patterns(self) -> Dict[str, Any]:
        """Identify current organization patterns and structures."""
        patterns = {
            'structure_type': 'mixed',
            'separation_of_concerns': {},
            'modularity_score': 0,
            'patterns_identified': []
        }

        # Check for common organizational patterns
        directories = [d.name for d in self.project_root.iterdir() if d.is_dir() and d.name not in self.ignore_dirs]

        # Frontend/Backend separation
        if 'src' in directories and 'backend' in directories:
            patterns['patterns_identified'].append('frontend_backend_separation')
            patterns['separation_of_concerns']['frontend_backend'] = True

        # Component-based structure (React)
        src_dir = self.project_root / 'src'
        if src_dir.exists():
            src_subdirs = [d.name for d in src_dir.iterdir() if d.is_dir()]
            if 'components' in src_subdirs and 'pages' in src_subdirs:
                patterns['patterns_identified'].append('component_based_architecture')
                patterns['separation_of_concerns']['components_pages'] = True

        # Configuration separation
        if 'config' in directories:
            patterns['patterns_identified'].append('configuration_separation')
            patterns['separation_of_concerns']['configuration'] = True

        # Documentation organization
        if 'docs' in directories:
            patterns['patterns_identified'].append('documentation_organization')
            patterns['separation_of_concerns']['documentation'] = True

        # Testing organization
        if 'tests' in directories or 'test' in directories:
            patterns['patterns_identified'].append('testing_organization')
            patterns['separation_of_concerns']['testing'] = True

        # Tools and utilities
        if 'tools' in directories or 'utils' in directories:
            patterns['patterns_identified'].append('utilities_organization')
            patterns['separation_of_concerns']['utilities'] = True

        # Calculate modularity score
        patterns['modularity_score'] = len(patterns['patterns_identified']) / 6 * 100

        return patterns

    def _identify_structural_issues(self) -> List[Dict[str, Any]]:
        """Identify structural issues and areas for improvement."""
        issues = []

        # Check for deep nesting
        max_depth = 0
        deep_paths = []
        for root, dirs, files in os.walk(self.project_root):
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
            depth = len(Path(root).relative_to(self.project_root).parts)
            if depth > max_depth:
                max_depth = depth
            if depth > 5:  # Arbitrary threshold
                deep_paths.append(str(Path(root).relative_to(self.project_root)))

        if deep_paths:
            issues.append({
                'type': 'deep_nesting',
                'severity': 'medium',
                'description': f'Deep directory nesting detected (max depth: {max_depth})',
                'affected_paths': deep_paths[:5],  # Show first 5
                'recommendation': 'Consider flattening directory structure'
            })

        # Check for scattered configuration files
        config_files = []
        for root, dirs, files in os.walk(self.project_root):
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
            for file in files:
                if any(file.endswith(ext) for ext in ['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg']):
                    if 'config' not in file.lower() and root == str(self.project_root):
                        config_files.append(file)

        if len(config_files) > 3:
            issues.append({
                'type': 'scattered_config',
                'severity': 'low',
                'description': f'Multiple configuration files in root directory ({len(config_files)} files)',
                'affected_paths': config_files,
                'recommendation': 'Consider consolidating configuration files in a config/ directory'
            })

        # Check for mixed file types in directories
        mixed_dirs = []
        for root, dirs, files in os.walk(self.project_root):
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
            if len(files) > 5:  # Only check directories with multiple files
                categories = set()
                for file in files:
                    categories.add(self._categorize_file(Path(file)))
                if len(categories) > 2:
                    mixed_dirs.append(str(Path(root).relative_to(self.project_root)))

        if mixed_dirs:
            issues.append({
                'type': 'mixed_file_types',
                'severity': 'low',
                'description': f'Directories with mixed file types detected ({len(mixed_dirs)} directories)',
                'affected_paths': mixed_dirs[:5],
                'recommendation': 'Consider organizing files by type or purpose'
            })

        # Check for large directories
        large_dirs = []
        for root, dirs, files in os.walk(self.project_root):
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
            if len(files) > 20:  # Arbitrary threshold
                large_dirs.append({
                    'path': str(Path(root).relative_to(self.project_root)),
                    'file_count': len(files)
                })

        if large_dirs:
            issues.append({
                'type': 'large_directories',
                'severity': 'medium',
                'description': f'Large directories detected ({len(large_dirs)} directories)',
                'affected_paths': [d['path'] for d in large_dirs[:5]],
                'recommendation': 'Consider breaking down large directories into subdirectories'
            })

        return issues

    def propose_organizational_improvements(self) -> Dict[str, Any]:
        """Propose organizational improvements based on analysis."""
        self.logger.info("Generating organizational improvement proposals...")

        proposals = {
            'recommended_structure': self._generate_recommended_structure(),
            'file_relocations': self._propose_file_relocations(),
            'directory_consolidations': self._propose_directory_consolidations(),
            'naming_improvements': self._propose_naming_improvements(),
            'new_directories': self._propose_new_directories(),
            'cleanup_suggestions': self._propose_cleanup_suggestions(),
            'migration_plan': self._generate_migration_plan()
        }

        return proposals

    def _generate_recommended_structure(self) -> Dict[str, Any]:
        """Generate recommended project structure based on best practices."""
        # Determine project type for structure recommendation
        project_types = self.current_structure['project_info']['project_type']

        if 'electron' in project_types and 'react' in project_types:
            return self._electron_react_structure()
        elif 'react' in project_types:
            return self._react_structure()
        elif 'python' in project_types:
            return self._python_structure()
        else:
            return self._generic_structure()

    def _react_structure(self) -> Dict[str, Any]:
        """Recommended structure for React projects."""
        return {
            'type': 'react',
            'description': 'Optimized structure for React applications',
            'structure': {
                'src/': 'React source code',
                'src/components/': 'Reusable React components',
                'src/pages/': 'Page-level components',
                'src/hooks/': 'Custom React hooks',
                'src/services/': 'API and service layer',
                'src/utils/': 'Utility functions',
                'src/styles/': 'Styling files',
                'public/': 'Static assets',
                'tests/': 'Test files',
                'docs/': 'Documentation'
            }
        }

    def _python_structure(self) -> Dict[str, Any]:
        """Recommended structure for Python projects."""
        return {
            'type': 'python',
            'description': 'Optimized structure for Python applications',
            'structure': {
                'src/': 'Source code',
                'tests/': 'Test files',
                'docs/': 'Documentation',
                'scripts/': 'Utility scripts',
                'config/': 'Configuration files',
                'requirements.txt': 'Dependencies'
            }
        }

    def _generic_structure(self) -> Dict[str, Any]:
        """Generic recommended structure."""
        return {
            'type': 'generic',
            'description': 'Generic project structure',
            'structure': {
                'src/': 'Source code',
                'docs/': 'Documentation',
                'tests/': 'Test files',
                'config/': 'Configuration files',
                'scripts/': 'Utility scripts'
            }
        }

    def _generate_html_report(self, report_data: Dict[str, Any]) -> str:
        """Generate HTML report from analysis data."""
        html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Structure Analysis Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
        .header {{ background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .section {{ margin-bottom: 30px; }}
        .section h2 {{ color: #333; border-bottom: 2px solid #007acc; padding-bottom: 5px; }}
        .section h3 {{ color: #555; }}
        .metric {{ display: inline-block; margin: 10px; padding: 15px; background: #f9f9f9; border-radius: 5px; }}
        .issue {{ padding: 10px; margin: 5px 0; border-left: 4px solid #ff6b6b; background: #fff5f5; }}
        .recommendation {{ padding: 10px; margin: 5px 0; border-left: 4px solid #51cf66; background: #f3fff3; }}
        .tree {{ font-family: monospace; background: #f8f8f8; padding: 15px; border-radius: 5px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
        th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #f2f2f2; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Project Structure Analysis Report</h1>
        <p><strong>Project:</strong> {project_name}</p>
        <p><strong>Generated:</strong> {generated_at}</p>
        <p><strong>Type:</strong> {project_type}</p>
    </div>

    <div class="section">
        <h2>📊 Project Overview</h2>
        <div class="metric">
            <strong>Total Files:</strong> {total_files}
        </div>
        <div class="metric">
            <strong>Total Directories:</strong> {total_directories}
        </div>
        <div class="metric">
            <strong>Project Size:</strong> {project_size} MB
        </div>
        <div class="metric">
            <strong>Organization Score:</strong> {organization_score}%
        </div>
        <div class="metric">
            <strong>Overall Rating:</strong> {overall_rating}
        </div>
    </div>

    <div class="section">
        <h2>🔍 Key Findings</h2>
        <ul>
            {key_findings}
        </ul>
    </div>

    <div class="section">
        <h2>⚠️ Issues Identified</h2>
        {issues_html}
    </div>

    <div class="section">
        <h2>💡 Recommendations</h2>
        {recommendations_html}
    </div>

    <div class="section">
        <h2>🌳 Current Directory Structure</h2>
        <div class="tree">
            {directory_tree}
        </div>
    </div>
</body>
</html>
        """

        # Extract data for template
        project_info = report_data['current_structure']['project_info']
        summary = report_data['summary']

        # Format key findings
        key_findings_html = '\n'.join([f'<li>{finding}</li>' for finding in summary['key_findings']])

        # Format issues
        issues_html = ''
        for issue in report_data['current_structure']['issues_identified']:
            issues_html += f'''
            <div class="issue">
                <strong>{issue['type'].replace('_', ' ').title()}:</strong> {issue['description']}<br>
                <em>Recommendation:</em> {issue['recommendation']}
            </div>
            '''

        # Format recommendations
        recommendations_html = ''
        for rec in report_data['recommendations']:
            recommendations_html += f'''
            <div class="recommendation">
                <strong>{rec['title']}:</strong> {rec['description']}<br>
                <em>Benefits:</em> {', '.join(rec['benefits'])}
            </div>
            '''

        # Generate directory tree
        analyzer = ProjectStructureAnalyzer(report_data['analysis_metadata']['project_root'])
        directory_tree = analyzer.generate_directory_tree_visualization().replace('\n', '<br>')

        # Fill template
        return html_template.format(
            project_name=project_info['name'],
            generated_at=report_data['analysis_metadata']['generated_at'],
            project_type=', '.join(project_info['project_type']),
            total_files=project_info['total_files'],
            total_directories=project_info['total_directories'],
            project_size=project_info['project_size_mb'],
            organization_score=round(summary['organization_score']['modularity']),
            overall_rating=summary['organization_score']['overall_rating'],
            key_findings=key_findings_html,
            issues_html=issues_html,
            recommendations_html=recommendations_html,
            directory_tree=directory_tree
        )

    def _electron_react_structure(self) -> Dict[str, Any]:
        """Recommended structure for Electron + React + Python projects."""
        return {
            'type': 'electron_react_python',
            'description': 'Optimized structure for Electron desktop app with React frontend and Python backend',
            'structure': {
                'app/': 'Electron main process files',
                'src/': 'React frontend source code',
                'src/components/': 'Reusable React components',
                'src/pages/': 'Page-level React components',
                'src/hooks/': 'Custom React hooks',
                'src/services/': 'API and service layer',
                'src/store/': 'State management (Zustand stores)',
                'src/utils/': 'Frontend utility functions',
                'src/styles/': 'Styling and theme files',
                'src/i18n/': 'Internationalization files',
                'backend/': 'Python FastAPI backend',
                'backend/core/': 'Core business logic',
                'backend/api/': 'API route handlers',
                'backend/models/': 'Data models and schemas',
                'backend/services/': 'Business service layer',
                'backend/utils/': 'Backend utility functions',
                'core/': 'Shared Python processing logic',
                'tools/': 'Development and utility scripts',
                'config/': 'Configuration files',
                'docs/': 'Documentation',
                'tests/': 'Test files',
                'tests/unit/': 'Unit tests',
                'tests/integration/': 'Integration tests',
                'tests/e2e/': 'End-to-end tests',
                'scripts/': 'Build and deployment scripts',
                'public/': 'Static assets for frontend',
                'data/': 'Data files (with .gitkeep only)',
                'logs/': 'Log files (with .gitkeep only)',
                'temp/': 'Temporary files (with .gitkeep only)'
            },
            'benefits': [
                'Clear separation of frontend, backend, and desktop concerns',
                'Scalable component organization',
                'Proper separation of business logic and API layers',
                'Organized testing structure',
                'Clear data flow and state management'
            ]
        }

    def _propose_file_relocations(self) -> List[Dict[str, Any]]:
        """Propose specific file relocations for better organization."""
        relocations = []

        # Check for misplaced files in root directory
        root_files = [f for f in self.project_root.iterdir() if f.is_file()]

        for file_path in root_files:
            if file_path.suffix == '.py' and file_path.name not in ['quick_start.py', 'setup.py']:
                relocations.append({
                    'current_path': str(file_path.relative_to(self.project_root)),
                    'proposed_path': f'tools/{file_path.name}',
                    'reason': 'Python scripts should be organized in tools/ directory',
                    'priority': 'medium'
                })

            elif file_path.suffix in ['.html', '.js'] and 'test' in file_path.name.lower():
                relocations.append({
                    'current_path': str(file_path.relative_to(self.project_root)),
                    'proposed_path': f'tests/debug/{file_path.name}',
                    'reason': 'Test and debug files should be in tests/ directory',
                    'priority': 'low'
                })

        # Check for configuration files that could be consolidated
        config_files = []
        for root, dirs, files in os.walk(self.project_root):
            if Path(root).name in self.ignore_dirs:
                continue
            for file in files:
                if file.endswith(('.json', '.yaml', '.yml')) and 'config' in file.lower():
                    if 'config' not in Path(root).name:
                        config_files.append(Path(root) / file)

        for config_file in config_files:
            relocations.append({
                'current_path': str(config_file.relative_to(self.project_root)),
                'proposed_path': f'config/{config_file.name}',
                'reason': 'Configuration files should be centralized in config/ directory',
                'priority': 'low'
            })

        return relocations

    def _propose_directory_consolidations(self) -> List[Dict[str, Any]]:
        """Propose directory consolidations for better organization."""
        consolidations = []

        # Look for similar directories that could be merged
        directories = []
        for root, dirs, files in os.walk(self.project_root):
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
            for dir_name in dirs:
                dir_path = Path(root) / dir_name
                directories.append({
                    'path': str(dir_path.relative_to(self.project_root)),
                    'name': dir_name,
                    'file_count': len(list(dir_path.rglob('*')))
                })

        # Find directories with similar purposes
        similar_groups = defaultdict(list)
        for directory in directories:
            name = directory['name'].lower()
            if 'test' in name:
                similar_groups['testing'].append(directory)
            elif 'util' in name or 'helper' in name:
                similar_groups['utilities'].append(directory)
            elif 'config' in name or 'setting' in name:
                similar_groups['configuration'].append(directory)

        for group_type, dirs in similar_groups.items():
            if len(dirs) > 1:
                consolidations.append({
                    'type': f'{group_type}_consolidation',
                    'directories': [d['path'] for d in dirs],
                    'proposed_location': f'{group_type}/',
                    'reason': f'Multiple {group_type} directories could be consolidated',
                    'priority': 'medium'
                })

        return consolidations

    def _propose_naming_improvements(self) -> List[Dict[str, Any]]:
        """Propose naming convention improvements."""
        improvements = []

        # Analyze current naming patterns
        conventions = self.current_structure['naming_conventions']

        # Check for inconsistent naming
        if len(conventions['file_naming']) > 2:
            improvements.append({
                'type': 'file_naming_consistency',
                'issue': 'Multiple naming conventions detected',
                'current_patterns': dict(conventions['file_naming']),
                'recommendation': 'Standardize on snake_case for Python files, camelCase for React components',
                'priority': 'low'
            })

        if len(conventions['directory_naming']) > 2:
            improvements.append({
                'type': 'directory_naming_consistency',
                'issue': 'Multiple directory naming conventions detected',
                'current_patterns': dict(conventions['directory_naming']),
                'recommendation': 'Standardize on lowercase with underscores for directories',
                'priority': 'low'
            })

        return improvements

    def _propose_new_directories(self) -> List[Dict[str, Any]]:
        """Propose new directories that should be created."""
        new_dirs = []

        # Check if standard directories are missing
        standard_dirs = {
            'tests/unit': 'Unit test files',
            'tests/integration': 'Integration test files',
            'scripts': 'Build and deployment scripts',
            'docs/api': 'API documentation',
            'config/examples': 'Example configuration files',
            'backend/models': 'Data models and schemas',
            'backend/services': 'Business service layer'
        }

        for dir_path, description in standard_dirs.items():
            full_path = self.project_root / dir_path
            if not full_path.exists():
                new_dirs.append({
                    'path': dir_path,
                    'description': description,
                    'reason': 'Standard directory for project type',
                    'priority': 'medium'
                })

        return new_dirs

    def _propose_cleanup_suggestions(self) -> List[Dict[str, Any]]:
        """Propose cleanup suggestions for better organization."""
        suggestions = []

        # Check for empty directories
        empty_dirs = self.current_structure['file_distribution']['empty_directories']
        if empty_dirs:
            suggestions.append({
                'type': 'remove_empty_directories',
                'directories': empty_dirs,
                'reason': 'Empty directories add no value and clutter the structure',
                'priority': 'low'
            })

        # Check for large files that might need attention
        large_files = self.current_structure['file_distribution']['large_files']
        if large_files:
            suggestions.append({
                'type': 'review_large_files',
                'files': large_files,
                'reason': 'Large files should be reviewed for optimization or relocation',
                'priority': 'medium'
            })

        # Check for duplicate file patterns
        file_patterns = defaultdict(list)
        for root, dirs, files in os.walk(self.project_root):
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
            for file in files:
                pattern = Path(file).stem.lower()
                if 'test' in pattern or 'debug' in pattern:
                    file_patterns[pattern].append(str(Path(root) / file))

        for pattern, files in file_patterns.items():
            if len(files) > 3:
                suggestions.append({
                    'type': 'consolidate_similar_files',
                    'pattern': pattern,
                    'files': files,
                    'reason': f'Multiple files with similar names ({pattern}) could be consolidated',
                    'priority': 'low'
                })

        return suggestions

    def _generate_migration_plan(self) -> Dict[str, Any]:
        """Generate a step-by-step migration plan."""
        return {
            'phases': [
                {
                    'phase': 1,
                    'name': 'Preparation',
                    'description': 'Create backup and prepare for reorganization',
                    'steps': [
                        'Create full project backup',
                        'Commit all current changes to version control',
                        'Create new directory structure',
                        'Update .gitignore if necessary'
                    ],
                    'estimated_time': '15 minutes'
                },
                {
                    'phase': 2,
                    'name': 'Directory Creation',
                    'description': 'Create new directories according to recommended structure',
                    'steps': [
                        'Create missing standard directories',
                        'Set up proper directory hierarchy',
                        'Add .gitkeep files to empty directories'
                    ],
                    'estimated_time': '10 minutes'
                },
                {
                    'phase': 3,
                    'name': 'File Relocation',
                    'description': 'Move files to their new locations',
                    'steps': [
                        'Move configuration files to config/',
                        'Relocate utility scripts to tools/',
                        'Organize test files in tests/',
                        'Update import statements and references'
                    ],
                    'estimated_time': '30 minutes'
                },
                {
                    'phase': 4,
                    'name': 'Cleanup',
                    'description': 'Clean up old structure and validate changes',
                    'steps': [
                        'Remove empty directories',
                        'Update documentation',
                        'Test application functionality',
                        'Update build scripts and paths'
                    ],
                    'estimated_time': '20 minutes'
                }
            ],
            'total_estimated_time': '75 minutes',
            'prerequisites': [
                'Version control system (Git) available',
                'No uncommitted changes',
                'Backup storage available',
                'Development environment ready for testing'
            ],
            'risks': [
                'Import path changes may break functionality',
                'Build scripts may need updates',
                'IDE configurations may need adjustment'
            ]
        }

    def generate_comprehensive_report(self, output_format: str = 'json') -> str:
        """Generate a comprehensive analysis report."""
        self.logger.info("Generating comprehensive project structure report...")

        # Perform analysis if not already done
        if not self.current_structure:
            self.analyze_current_structure()

        # Generate proposals
        proposals = self.propose_organizational_improvements()

        report = {
            'analysis_metadata': {
                'generated_at': datetime.now().isoformat(),
                'analyzer_version': '1.0.0',
                'project_root': str(self.project_root),
                'analysis_scope': 'comprehensive'
            },
            'current_structure': self.current_structure,
            'improvement_proposals': proposals,
            'summary': self._generate_summary(),
            'recommendations': self._generate_recommendations()
        }

        # Save report
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        if output_format.lower() == 'json':
            report_file = self.project_root / f'project_analysis_report_{timestamp}.json'
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
        elif output_format.lower() == 'html':
            report_file = self.project_root / f'project_analysis_report_{timestamp}.html'
            html_content = self._generate_html_report(report)
            with open(report_file, 'w', encoding='utf-8') as f:
                f.write(html_content)

        self.logger.info(f"Report generated: {report_file}")
        return str(report_file)

    def _generate_summary(self) -> Dict[str, Any]:
        """Generate a summary of the analysis."""
        structure = self.current_structure

        return {
            'project_overview': {
                'name': structure['project_info']['name'],
                'type': ', '.join(structure['project_info']['project_type']),
                'size_mb': structure['project_info']['project_size_mb'],
                'total_files': structure['project_info']['total_files'],
                'total_directories': structure['project_info']['total_directories']
            },
            'organization_score': {
                'modularity': structure['organization_patterns']['modularity_score'],
                'issues_count': len(structure['issues_identified']),
                'overall_rating': self._calculate_overall_rating()
            },
            'key_findings': self._extract_key_findings(),
            'priority_actions': self._identify_priority_actions()
        }

    def _calculate_overall_rating(self) -> str:
        """Calculate overall organization rating."""
        score = self.current_structure['organization_patterns']['modularity_score']
        issues = len(self.current_structure['issues_identified'])

        # Adjust score based on issues
        adjusted_score = score - (issues * 10)

        if adjusted_score >= 80:
            return 'Excellent'
        elif adjusted_score >= 60:
            return 'Good'
        elif adjusted_score >= 40:
            return 'Fair'
        else:
            return 'Needs Improvement'

    def _extract_key_findings(self) -> List[str]:
        """Extract key findings from the analysis."""
        findings = []

        structure = self.current_structure

        # Technology stack findings
        tech_stack = structure['technology_stack']
        if tech_stack['frontend'] and tech_stack['backend']:
            findings.append(f"Multi-tier architecture detected: {', '.join(tech_stack['frontend'])} frontend with {', '.join(tech_stack['backend'])} backend")

        # Organization findings
        patterns = structure['organization_patterns']['patterns_identified']
        if len(patterns) >= 4:
            findings.append("Well-organized project structure with good separation of concerns")
        elif len(patterns) >= 2:
            findings.append("Moderately organized structure with some separation of concerns")
        else:
            findings.append("Limited organizational structure - significant improvements possible")

        # File distribution findings
        file_dist = structure['file_distribution']
        largest_category = max(file_dist['by_category'].items(), key=lambda x: x[1])
        findings.append(f"Primary file type: {largest_category[0]} ({largest_category[1]} files)")

        # Issues findings
        issues = structure['issues_identified']
        if issues:
            high_priority = [i for i in issues if i['severity'] == 'high']
            if high_priority:
                findings.append(f"Critical issues detected: {len(high_priority)} high-priority structural problems")

        return findings

    def _identify_priority_actions(self) -> List[Dict[str, Any]]:
        """Identify priority actions based on analysis."""
        actions = []

        issues = self.current_structure['issues_identified']

        # High priority issues first
        for issue in issues:
            if issue['severity'] == 'high':
                actions.append({
                    'action': f"Address {issue['type']}",
                    'description': issue['description'],
                    'priority': 'high',
                    'estimated_effort': 'medium'
                })

        # Medium priority issues
        for issue in issues:
            if issue['severity'] == 'medium':
                actions.append({
                    'action': f"Resolve {issue['type']}",
                    'description': issue['description'],
                    'priority': 'medium',
                    'estimated_effort': 'low'
                })

        # Add general improvement actions
        if self.current_structure['organization_patterns']['modularity_score'] < 60:
            actions.append({
                'action': 'Improve project organization',
                'description': 'Implement recommended directory structure and file organization',
                'priority': 'medium',
                'estimated_effort': 'high'
            })

        return actions[:5]  # Return top 5 priority actions

    def _generate_recommendations(self) -> List[Dict[str, Any]]:
        """Generate specific recommendations based on analysis."""
        recommendations = []

        # Structure recommendations
        if self.current_structure['organization_patterns']['modularity_score'] < 70:
            recommendations.append({
                'category': 'Structure',
                'title': 'Implement Recommended Directory Structure',
                'description': 'Reorganize project according to best practices for your technology stack',
                'benefits': ['Improved maintainability', 'Better developer experience', 'Easier onboarding'],
                'effort': 'medium'
            })

        # Naming recommendations
        naming_issues = any('naming' in issue['type'] for issue in self.current_structure['issues_identified'])
        if naming_issues:
            recommendations.append({
                'category': 'Naming',
                'title': 'Standardize Naming Conventions',
                'description': 'Adopt consistent naming patterns across files and directories',
                'benefits': ['Better code readability', 'Reduced confusion', 'Professional appearance'],
                'effort': 'low'
            })

        # Documentation recommendations
        if not (self.project_root / 'README.md').exists():
            recommendations.append({
                'category': 'Documentation',
                'title': 'Create Project Documentation',
                'description': 'Add comprehensive README and documentation structure',
                'benefits': ['Better project understanding', 'Easier collaboration', 'Professional presentation'],
                'effort': 'medium'
            })

        return recommendations

    def create_backup(self) -> str:
        """Create a backup of the current project structure."""
        self.logger.info("Creating project backup...")

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_dir = self.project_root / f'backup_before_reorganization_{timestamp}'
        backup_dir.mkdir(exist_ok=True)

        # Copy important files and directories
        important_items = [
            'src', 'backend', 'core', 'tools', 'config', 'docs', 'tests',
            'package.json', 'requirements.txt', 'vite.config.js', 'electron-builder.yml'
        ]

        for item_name in important_items:
            item_path = self.project_root / item_name
            if item_path.exists():
                if item_path.is_dir():
                    shutil.copytree(item_path, backup_dir / item_name, ignore=shutil.ignore_patterns('node_modules', '__pycache__', '.git'))
                else:
                    shutil.copy2(item_path, backup_dir / item_name)

        self.logger.info(f"Backup created at: {backup_dir}")
        return str(backup_dir)

    def apply_reorganization(self, preview_only: bool = True) -> Dict[str, Any]:
        """Apply the proposed reorganization changes."""
        self.logger.info(f"{'Previewing' if preview_only else 'Applying'} reorganization changes...")

        if not self.current_structure:
            self.analyze_current_structure()

        proposals = self.propose_organizational_improvements()
        results = {
            'backup_location': None,
            'changes_applied': [],
            'errors': [],
            'summary': {}
        }

        if not preview_only:
            # Create backup first
            try:
                results['backup_location'] = self.create_backup()
            except Exception as e:
                results['errors'].append(f"Failed to create backup: {str(e)}")
                return results

        # Apply file relocations
        for relocation in proposals['file_relocations']:
            try:
                current_path = self.project_root / relocation['current_path']
                proposed_path = self.project_root / relocation['proposed_path']

                if preview_only:
                    results['changes_applied'].append({
                        'type': 'file_relocation',
                        'action': f"Would move {relocation['current_path']} to {relocation['proposed_path']}",
                        'reason': relocation['reason']
                    })
                else:
                    # Create target directory if it doesn't exist
                    proposed_path.parent.mkdir(parents=True, exist_ok=True)

                    # Move the file
                    shutil.move(str(current_path), str(proposed_path))
                    results['changes_applied'].append({
                        'type': 'file_relocation',
                        'action': f"Moved {relocation['current_path']} to {relocation['proposed_path']}",
                        'reason': relocation['reason']
                    })

            except Exception as e:
                results['errors'].append(f"Failed to relocate {relocation['current_path']}: {str(e)}")

        # Create new directories
        for new_dir in proposals['new_directories']:
            try:
                dir_path = self.project_root / new_dir['path']

                if preview_only:
                    results['changes_applied'].append({
                        'type': 'directory_creation',
                        'action': f"Would create directory {new_dir['path']}",
                        'reason': new_dir['reason']
                    })
                else:
                    dir_path.mkdir(parents=True, exist_ok=True)
                    # Add .gitkeep file
                    (dir_path / '.gitkeep').touch()
                    results['changes_applied'].append({
                        'type': 'directory_creation',
                        'action': f"Created directory {new_dir['path']}",
                        'reason': new_dir['reason']
                    })

            except Exception as e:
                results['errors'].append(f"Failed to create directory {new_dir['path']}: {str(e)}")

        # Apply cleanup suggestions
        for suggestion in proposals['cleanup_suggestions']:
            if suggestion['type'] == 'remove_empty_directories':
                for empty_dir in suggestion['directories']:
                    try:
                        dir_path = self.project_root / empty_dir

                        if preview_only:
                            results['changes_applied'].append({
                                'type': 'cleanup',
                                'action': f"Would remove empty directory {empty_dir}",
                                'reason': suggestion['reason']
                            })
                        else:
                            if dir_path.exists() and dir_path.is_dir():
                                dir_path.rmdir()
                                results['changes_applied'].append({
                                    'type': 'cleanup',
                                    'action': f"Removed empty directory {empty_dir}",
                                    'reason': suggestion['reason']
                                })

                    except Exception as e:
                        results['errors'].append(f"Failed to remove directory {empty_dir}: {str(e)}")

        # Generate summary
        results['summary'] = {
            'total_changes': len(results['changes_applied']),
            'errors_count': len(results['errors']),
            'status': 'preview' if preview_only else 'completed',
            'backup_created': results['backup_location'] is not None
        }

        return results

    def generate_directory_tree_visualization(self, max_depth: int = 3) -> str:
        """Generate a visual representation of the directory tree."""
        def build_tree_string(path: Path, prefix: str = "", max_depth: int = 3, current_depth: int = 0) -> str:
            if current_depth >= max_depth:
                return ""

            tree_str = ""
            try:
                items = sorted([item for item in path.iterdir()
                              if not item.name.startswith('.') and item.name not in self.ignore_dirs])

                for i, item in enumerate(items):
                    is_last = i == len(items) - 1
                    current_prefix = "└── " if is_last else "├── "
                    tree_str += f"{prefix}{current_prefix}{item.name}\n"

                    if item.is_dir() and current_depth < max_depth - 1:
                        extension = "    " if is_last else "│   "
                        tree_str += build_tree_string(item, prefix + extension, max_depth, current_depth + 1)

            except PermissionError:
                tree_str += f"{prefix}├── [Permission Denied]\n"

            return tree_str

        tree_visualization = f"{self.project_root.name}/\n"
        tree_visualization += build_tree_string(self.project_root, "", max_depth)

        return tree_visualization


def main():
    """Main execution function with command-line interface."""
    parser = argparse.ArgumentParser(
        description="Project Structure Analyzer and Reorganization Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python project_structure_analyzer.py analyze                    # Analyze current structure
  python project_structure_analyzer.py analyze --format html     # Generate HTML report
  python project_structure_analyzer.py preview                   # Preview reorganization changes
  python project_structure_analyzer.py reorganize               # Apply reorganization changes
  python project_structure_analyzer.py tree                     # Show directory tree
        """
    )

    parser.add_argument(
        'action',
        choices=['analyze', 'preview', 'reorganize', 'tree'],
        help='Action to perform'
    )

    parser.add_argument(
        '--project-root',
        type=str,
        default='.',
        help='Project root directory (default: current directory)'
    )

    parser.add_argument(
        '--format',
        choices=['json', 'html'],
        default='json',
        help='Output format for analysis report (default: json)'
    )

    parser.add_argument(
        '--max-depth',
        type=int,
        default=3,
        help='Maximum depth for directory tree visualization (default: 3)'
    )

    parser.add_argument(
        '--backup',
        action='store_true',
        help='Create backup before applying changes (default: True for reorganize)'
    )

    args = parser.parse_args()

    try:
        # Initialize analyzer
        analyzer = ProjectStructureAnalyzer(args.project_root)

        if args.action == 'analyze':
            print("🔍 Analyzing project structure...")
            report_file = analyzer.generate_comprehensive_report(args.format)
            print(f"✅ Analysis complete! Report saved to: {report_file}")

        elif args.action == 'preview':
            print("👀 Previewing reorganization changes...")
            results = analyzer.apply_reorganization(preview_only=True)

            print(f"\n📋 Preview Results:")
            print(f"   Total changes: {results['summary']['total_changes']}")
            print(f"   Errors: {results['summary']['errors_count']}")

            if results['changes_applied']:
                print("\n🔄 Proposed Changes:")
                for change in results['changes_applied']:
                    print(f"   • {change['action']}")
                    print(f"     Reason: {change['reason']}")

            if results['errors']:
                print("\n❌ Potential Issues:")
                for error in results['errors']:
                    print(f"   • {error}")

        elif args.action == 'reorganize':
            print("🚀 Applying reorganization changes...")

            # Confirm action
            response = input("This will modify your project structure. Continue? (y/N): ")
            if response.lower() != 'y':
                print("❌ Operation cancelled.")
                return

            results = analyzer.apply_reorganization(preview_only=False)

            print(f"\n✅ Reorganization Results:")
            print(f"   Total changes applied: {results['summary']['total_changes']}")
            print(f"   Errors: {results['summary']['errors_count']}")

            if results['backup_location']:
                print(f"   Backup created at: {results['backup_location']}")

            if results['errors']:
                print("\n❌ Errors encountered:")
                for error in results['errors']:
                    print(f"   • {error}")

        elif args.action == 'tree':
            print("🌳 Generating directory tree visualization...")
            tree = analyzer.generate_directory_tree_visualization(args.max_depth)
            print(f"\n{tree}")

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()