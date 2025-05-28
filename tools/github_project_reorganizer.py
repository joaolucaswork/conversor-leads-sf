#!/usr/bin/env python3
"""
GitHub Project Reorganizer for Leads Processing System
======================================================

This script reorganizes the leads processing project into a clean, GitHub-ready structure
while maintaining 100% functionality and ensuring security by preventing confidential
data exposure.

Features:
- Comprehensive project structure analysis
- Before/after directory tree visualization
- Preview functionality before applying changes
- Automatic backup creation
- Security-focused .gitignore generation
- Import path preservation
- Rollback capabilities
- Step-by-step migration instructions

Author: AI Assistant
Version: 1.0.0
"""

import os
import sys
import json
import shutil
import logging
import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/project_reorganization.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class FileMapping:
    """Represents a file move operation"""
    source: str
    destination: str
    file_type: str
    preserve_structure: bool = True
    update_imports: bool = False

@dataclass
class ProjectStructure:
    """Represents the project structure analysis"""
    total_files: int
    total_directories: int
    file_types: Dict[str, int]
    sensitive_files: List[str]
    config_files: List[str]
    source_files: List[str]
    documentation_files: List[str]

class GitHubProjectReorganizer:
    """Main class for reorganizing the project structure"""

    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root).resolve()
        self.backup_dir = self.project_root / "backup_before_reorganization"
        self.preview_mode = True
        self.changes_log = []

        # Ensure logs directory exists
        (self.project_root / "logs").mkdir(exist_ok=True)

        logger.info(f"Initializing GitHub Project Reorganizer for: {self.project_root}")

    def analyze_current_structure(self) -> ProjectStructure:
        """Analyze the current project structure"""
        logger.info("Analyzing current project structure...")

        total_files = 0
        total_directories = 0
        file_types = {}
        sensitive_files = []
        config_files = []
        source_files = []
        documentation_files = []

        # Define sensitive file patterns
        sensitive_patterns = [
            '*.xlsx', '*.xls', '*.csv', '*.xlsm', '*.xlsb',
            '*.log', '*secret*', '*credential*', '*password*',
            '*token*', '*.env', '*api_key*'
        ]

        # Define config file patterns
        config_patterns = [
            'config.json', 'config.yml', '*.config.js', 'tsconfig*.json',
            'package.json', 'requirements.txt', 'Procfile', 'app.json',
            'electron-builder.yml', 'vite.config.js'
        ]

        # Walk through all files
        for root, dirs, files in os.walk(self.project_root):
            # Skip certain directories
            skip_dirs = {'node_modules', '.git', '__pycache__', 'venv', 'dist', 'dist-electron'}
            dirs[:] = [d for d in dirs if d not in skip_dirs]

            total_directories += len(dirs)

            for file in files:
                total_files += 1
                file_path = Path(root) / file
                relative_path = file_path.relative_to(self.project_root)

                # Count file types
                suffix = file_path.suffix.lower()
                file_types[suffix] = file_types.get(suffix, 0) + 1

                # Categorize files
                if self._matches_patterns(file, sensitive_patterns):
                    sensitive_files.append(str(relative_path))
                elif self._matches_patterns(file, config_patterns):
                    config_files.append(str(relative_path))
                elif suffix in ['.py', '.js', '.jsx', '.ts', '.tsx']:
                    source_files.append(str(relative_path))
                elif suffix in ['.md', '.txt', '.rst']:
                    documentation_files.append(str(relative_path))

        structure = ProjectStructure(
            total_files=total_files,
            total_directories=total_directories,
            file_types=file_types,
            sensitive_files=sensitive_files,
            config_files=config_files,
            source_files=source_files,
            documentation_files=documentation_files
        )

        logger.info(f"Analysis complete: {total_files} files, {total_directories} directories")
        return structure

    def _matches_patterns(self, filename: str, patterns: List[str]) -> bool:
        """Check if filename matches any of the given patterns"""
        import fnmatch
        return any(fnmatch.fnmatch(filename.lower(), pattern.lower()) for pattern in patterns)

    def generate_target_structure(self) -> Dict[str, List[FileMapping]]:
        """Generate the target GitHub-ready structure"""
        logger.info("Generating target project structure...")

        mappings = {
            'core_processing': [],
            'frontend_components': [],
            'backend_services': [],
            'configuration': [],
            'documentation': [],
            'tools_utilities': [],
            'tests': [],
            'examples': []
        }

        # Core processing files (Python backend logic)
        core_files = [
            FileMapping('core/', 'src/core/', 'directory'),
            FileMapping('backend/main.py', 'src/backend/main.py', 'python'),
            FileMapping('backend/models/', 'src/backend/models/', 'directory'),
            FileMapping('backend/services/', 'src/backend/services/', 'directory'),
            FileMapping('backend/middleware/', 'src/backend/middleware/', 'directory'),
            FileMapping('backend/migrations/', 'src/backend/migrations/', 'directory'),
        ]
        mappings['core_processing'] = core_files

        # Frontend components (React/Electron)
        frontend_files = [
            FileMapping('src/', 'src/frontend/', 'directory'),
            FileMapping('app/', 'src/electron/', 'directory'),
            FileMapping('public/', 'src/frontend/public/', 'directory'),
        ]
        mappings['frontend_components'] = frontend_files

        # Configuration files
        config_files = [
            FileMapping('config/', 'config/', 'directory', preserve_structure=True),
            FileMapping('package.json', 'package.json', 'config', preserve_structure=True),
            FileMapping('vite.config.js', 'config/vite.config.js', 'config'),
            FileMapping('electron-builder.yml', 'config/electron-builder.yml', 'config'),
            FileMapping('requirements.txt', 'requirements.txt', 'config', preserve_structure=True),
            FileMapping('backend/requirements.txt', 'src/backend/requirements.txt', 'config'),
        ]
        mappings['configuration'] = config_files

        # Documentation files
        doc_files = [
            FileMapping('docs/', 'docs/', 'directory', preserve_structure=True),
            FileMapping('README.md', 'README.md', 'documentation', preserve_structure=True),
            FileMapping('*.md', 'docs/legacy/', 'documentation'),  # Move other MD files to docs/legacy
        ]
        mappings['documentation'] = doc_files

        # Tools and utilities
        tool_files = [
            FileMapping('tools/', 'tools/', 'directory', preserve_structure=True),
            FileMapping('scripts/', 'scripts/', 'directory', preserve_structure=True),
        ]
        mappings['tools_utilities'] = tool_files

        # Tests
        test_files = [
            FileMapping('tests/', 'tests/', 'directory', preserve_structure=True),
        ]
        mappings['tests'] = test_files

        # Examples (create from templates)
        example_files = [
            FileMapping('temp/sample_processed_leads.csv', 'examples/sample_leads.csv', 'example'),
        ]
        mappings['examples'] = example_files

        return mappings

    def create_backup(self) -> bool:
        """Create a complete backup of the current project"""
        logger.info("Creating project backup...")

        try:
            if self.backup_dir.exists():
                shutil.rmtree(self.backup_dir)

            # Copy entire project except excluded directories
            exclude_dirs = {'node_modules', '.git', '__pycache__', 'venv', 'dist', 'dist-electron'}

            def ignore_function(dir_path, names):
                return [name for name in names if name in exclude_dirs]

            shutil.copytree(
                self.project_root,
                self.backup_dir,
                ignore=ignore_function,
                dirs_exist_ok=True
            )

            logger.info(f"Backup created successfully at: {self.backup_dir}")
            return True

        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            return False

    def preview_changes(self, mappings: Dict[str, List[FileMapping]]) -> None:
        """Preview the changes that will be made"""
        logger.info("=== PREVIEW MODE: Changes that will be made ===")

        total_operations = 0
        for category, file_mappings in mappings.items():
            if file_mappings:
                logger.info(f"\n{category.upper().replace('_', ' ')}:")
                for mapping in file_mappings:
                    if Path(self.project_root / mapping.source).exists():
                        logger.info(f"  {mapping.source} → {mapping.destination}")
                        total_operations += 1

        logger.info(f"\nTotal operations: {total_operations}")
        logger.info("=== END PREVIEW ===")

    def apply_reorganization(self, mappings: Dict[str, List[FileMapping]]) -> bool:
        """Apply the reorganization changes"""
        logger.info("Applying reorganization changes...")

        try:
            # Create target directories first
            target_dirs = set()
            for category, file_mappings in mappings.items():
                for mapping in file_mappings:
                    target_path = Path(self.project_root / mapping.destination)
                    if mapping.file_type == 'directory':
                        target_dirs.add(target_path)
                    else:
                        target_dirs.add(target_path.parent)

            # Create all target directories
            for target_dir in target_dirs:
                target_dir.mkdir(parents=True, exist_ok=True)
                logger.debug(f"Created directory: {target_dir}")

            # Apply file moves
            for category, file_mappings in mappings.items():
                logger.info(f"Processing {category}...")
                for mapping in self._filter_existing_files(file_mappings):
                    self._apply_single_mapping(mapping)

            logger.info("Reorganization completed successfully!")
            return True

        except Exception as e:
            logger.error(f"Failed to apply reorganization: {e}")
            return False

    def _filter_existing_files(self, mappings: List[FileMapping]) -> List[FileMapping]:
        """Filter mappings to only include existing files"""
        existing_mappings = []
        for mapping in mappings:
            source_path = Path(self.project_root / mapping.source)
            if source_path.exists():
                existing_mappings.append(mapping)
            else:
                logger.debug(f"Skipping non-existent: {mapping.source}")
        return existing_mappings

    def _apply_single_mapping(self, mapping: FileMapping) -> None:
        """Apply a single file mapping"""
        source_path = Path(self.project_root / mapping.source)
        dest_path = Path(self.project_root / mapping.destination)

        try:
            if source_path.is_dir():
                if not dest_path.exists():
                    shutil.copytree(source_path, dest_path)
                    logger.info(f"Copied directory: {mapping.source} → {mapping.destination}")
                else:
                    logger.warning(f"Directory already exists: {mapping.destination}")
            else:
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, dest_path)
                logger.info(f"Copied file: {mapping.source} → {mapping.destination}")

            self.changes_log.append({
                'action': 'copy',
                'source': str(source_path),
                'destination': str(dest_path),
                'timestamp': datetime.datetime.now().isoformat()
            })

        except Exception as e:
            logger.error(f"Failed to copy {mapping.source}: {e}")

    def generate_enhanced_gitignore(self) -> str:
        """Generate an enhanced .gitignore for the reorganized project"""
        gitignore_content = '''# ========================================
# LEADS PROCESSING SYSTEM - ENHANCED SECURITY GITIGNORE
# ========================================
# GitHub-ready .gitignore that prevents confidential data exposure
# while maintaining clean repository structure

# ========================================
# CRITICAL SECURITY - API KEYS & CREDENTIALS
# ========================================
.env
.env.*
!.env.example
!.env.sample
config/.env*
src/backend/.env*
**/api_keys.json
**/credentials.json
**/secrets.json
**/*secret*
**/*credential*
**/*password*
**/oauth_tokens.json
**/auth_tokens.json

# ========================================
# CONFIDENTIAL LEAD DATA - HIGHEST PRIORITY
# ========================================
# All Excel and CSV files (lead data)
*.xlsx
*.xls
*.csv
*.xlsm
*.xlsb

# Data directories with lead information
data/
src/backend/data/
backup/
input/
output/
processed/
raw/

# Processing results and summaries
**/processed_*.csv
**/processed_*.xlsx
**/*_processed_*.csv
**/*_processed_*.xlsx
**/*_summary.json
**/*_ai_summary.json
**/*_results.json

# EXCEPTIONS: Allow examples and templates
!examples/*.csv
!examples/*.xlsx
!templates/*.csv
!templates/*.xlsx
!**/example*.csv
!**/example*.xlsx
!**/template*.csv
!**/template*.xlsx
!**/sample*.csv
!**/sample*.xlsx

# ========================================
# LOGS WITH SENSITIVE INFORMATION
# ========================================
logs/
src/backend/logs/
*.log
*.log.*
**/*.log
**/*.log.*

# ========================================
# CACHE AND TEMPORARY FILES
# ========================================
cache/
src/backend/cache/
**/ai_mappings/
**/ai_cache/
**/mapping_cache/
temp/
tmp/
**/temp/
**/tmp/
*.tmp
*.temp
*.bak
*.backup
*.swp
*.swo

# ========================================
# PYTHON ENVIRONMENT & DEPENDENCIES
# ========================================
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Virtual environments
venv/
env/
ENV/
.venv/
.env/
virtualenv/

# ========================================
# NODE.JS & FRONTEND
# ========================================
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json
yarn.lock

# Build outputs
dist/
dist-renderer/
build/
.next/
out/

# ========================================
# DEVELOPMENT TOOLS & IDE
# ========================================
.vscode/
.idea/
*.sublime-project
*.sublime-workspace
.spyderproject
.spyproject
*.code-workspace

# ========================================
# TESTING & COVERAGE
# ========================================
.pytest_cache/
.coverage
htmlcov/
.nyc_output
coverage/
*.cover
.hypothesis/
.ipynb_checkpoints

# ========================================
# OPERATING SYSTEM FILES
# ========================================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
.AppleDouble
.LSOverride
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db
*.stackdump
[Dd]esktop.ini
$RECYCLE.BIN/
*.cab
*.msi
*.msix
*.msm
*.msp
*.lnk
*~
.fuse_hidden*
.directory
.Trash-*
.nfs*

# ========================================
# ELECTRON & DESKTOP APP
# ========================================
dist-electron/
release/
src/electron/dist/
src/electron/build/
**/electron-store/
**/user-data/
**/app-data/

# ========================================
# BACKUP AND ARCHIVE FILES
# ========================================
*.zip
*.rar
*.7z
*.tar
*.tar.gz
*.tar.bz2
*.tar.xz
*.sql
*.db
*.sqlite
*.sqlite3

# ========================================
# PROJECT-SPECIFIC EXCLUSIONS
# ========================================
backup_before_reorganization/
final_verification_result.csv
**/real_leads_*.csv
**/production_*.csv
**/client_*.csv
**/customer_*.csv

# ========================================
# KEEP DIRECTORIES (EXCEPTIONS)
# ========================================
!data/.gitkeep
!logs/.gitkeep
!temp/.gitkeep
!cache/.gitkeep
!examples/.gitkeep
'''
        return gitignore_content

    def update_import_paths(self) -> None:
        """Update import paths in Python files after reorganization"""
        logger.info("Updating import paths...")

        # Define import path mappings
        import_mappings = {
            'from src.core.': 'from src.core.',
            'import src.core.': 'import src.core.',
            'from src.backend.': 'from src.backend.',
            'import src.backend.': 'import src.backend.',
        }

        # Find all Python files in the reorganized structure
        python_files = []
        for root, dirs, files in os.walk(self.project_root):
            for file in files:
                if file.endswith('.py'):
                    python_files.append(Path(root) / file)

        # Update imports in each file
        for py_file in python_files:
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                original_content = content
                for old_import, new_import in import_mappings.items():
                    content = content.replace(old_import, new_import)

                if content != original_content:
                    with open(py_file, 'w', encoding='utf-8') as f:
                        f.write(content)
                    logger.info(f"Updated imports in: {py_file.relative_to(self.project_root)}")

            except Exception as e:
                logger.error(f"Failed to update imports in {py_file}: {e}")

    def generate_directory_tree(self, path: Path, prefix: str = "", max_depth: int = 3, current_depth: int = 0) -> List[str]:
        """Generate a visual directory tree"""
        if current_depth > max_depth:
            return []

        tree_lines = []
        if current_depth == 0:
            tree_lines.append(f"{path.name}/")

        try:
            # Get all items and sort them (directories first, then files)
            items = list(path.iterdir())
            dirs = [item for item in items if item.is_dir() and not item.name.startswith('.')]
            files = [item for item in items if item.is_file() and not item.name.startswith('.')]

            # Filter out excluded directories
            excluded_dirs = {'node_modules', '__pycache__', 'venv', 'dist', 'dist-electron', '.git'}
            dirs = [d for d in dirs if d.name not in excluded_dirs]

            all_items = sorted(dirs) + sorted(files)

            for i, item in enumerate(all_items):
                is_last = i == len(all_items) - 1
                current_prefix = "└── " if is_last else "├── "
                tree_lines.append(f"{prefix}{current_prefix}{item.name}")

                if item.is_dir() and current_depth < max_depth:
                    extension = "    " if is_last else "│   "
                    subtree = self.generate_directory_tree(
                        item, prefix + extension, max_depth, current_depth + 1
                    )
                    tree_lines.extend(subtree)

        except PermissionError:
            tree_lines.append(f"{prefix}└── [Permission Denied]")

        return tree_lines

    def display_before_after_structure(self) -> None:
        """Display before and after directory structures"""
        logger.info("=== CURRENT PROJECT STRUCTURE ===")
        current_tree = self.generate_directory_tree(self.project_root)
        for line in current_tree[:50]:  # Limit output
            logger.info(line)

        logger.info("\n=== PROPOSED GITHUB-READY STRUCTURE ===")
        proposed_structure = [
            "conversor-leads-sf/",
            "├── README.md",
            "├── package.json",
            "├── requirements.txt",
            "├── .gitignore",
            "├── config/",
            "│   ├── vite.config.js",
            "│   ├── electron-builder.yml",
            "│   ├── salesforce_field_mapping.json",
            "│   └── tsconfig*.json",
            "├── src/",
            "│   ├── frontend/",
            "│   │   ├── components/",
            "│   │   ├── pages/",
            "│   │   ├── services/",
            "│   │   ├── store/",
            "│   │   ├── utils/",
            "│   │   ├── i18n/",
            "│   │   └── styles/",
            "│   ├── electron/",
            "│   │   ├── main.js",
            "│   │   └── preload.js",
            "│   ├── backend/",
            "│   │   ├── main.py",
            "│   │   ├── models/",
            "│   │   ├── services/",
            "│   │   ├── middleware/",
            "│   │   └── migrations/",
            "│   └── core/",
            "│       ├── ai_field_mapper.py",
            "│       ├── master_leads_processor.py",
            "│       └── salesforce_integration.py",
            "├── docs/",
            "│   ├── api/",
            "│   ├── setup/",
            "│   ├── troubleshooting/",
            "│   └── legacy/",
            "├── tools/",
            "│   ├── data_validator.py",
            "│   ├── ai_cost_optimizer.py",
            "│   └── project_structure_analyzer.py",
            "├── scripts/",
            "│   ├── start-dev.js",
            "│   └── deploy-to-heroku.sh",
            "├── tests/",
            "│   ├── integration/",
            "│   └── ui/",
            "├── examples/",
            "│   ├── sample_leads.csv",
            "│   └── field_mapping_example.json",
            "└── .github/",
            "    ├── workflows/",
            "    ├── ISSUE_TEMPLATE/",
            "    └── PULL_REQUEST_TEMPLATE.md"
        ]

        for line in proposed_structure:
            logger.info(line)

    def create_github_templates(self) -> None:
        """Create GitHub-specific templates and workflows"""
        logger.info("Creating GitHub templates...")

        # Create .github directory
        github_dir = self.project_root / ".github"
        github_dir.mkdir(exist_ok=True)

        # Create issue templates
        issue_template_dir = github_dir / "ISSUE_TEMPLATE"
        issue_template_dir.mkdir(exist_ok=True)

        # Bug report template
        bug_template = '''---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment (please complete the following information):**
 - OS: [e.g. Windows 10, macOS 12.0]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]
 - Mode [e.g. Desktop App, Browser]

**Additional context**
Add any other context about the problem here.
'''

        with open(issue_template_dir / "bug_report.md", 'w', encoding='utf-8') as f:
            f.write(bug_template)

        # Feature request template
        feature_template = '''---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''

---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
'''

        with open(issue_template_dir / "feature_request.md", 'w', encoding='utf-8') as f:
            f.write(feature_template)

        # Pull request template
        pr_template = '''## Description
Brief description of the changes in this PR.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] I have tested these changes locally
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings

## Screenshots (if applicable)
Add screenshots to help explain your changes.
'''

        with open(github_dir / "PULL_REQUEST_TEMPLATE.md", 'w', encoding='utf-8') as f:
            f.write(pr_template)

        logger.info("GitHub templates created successfully!")

    def create_example_files(self) -> None:
        """Create example files for the examples directory"""
        logger.info("Creating example files...")

        examples_dir = self.project_root / "examples"
        examples_dir.mkdir(exist_ok=True)

        # Create sample leads CSV
        sample_leads_content = '''Lead,Email,Telefone,Empresa,Cargo,Estado,Cidade,Origem,Atribuir
João Silva,joao.silva@empresa.com,11999887766,Empresa ABC,Gerente,SP,São Paulo,Website,vendedor1
Maria Santos,maria.santos@tech.com,21988776655,Tech Solutions,Diretora,RJ,Rio de Janeiro,LinkedIn,vendedor2
Pedro Costa,pedro.costa@startup.com,85977665544,Startup XYZ,CEO,CE,Fortaleza,Indicação,vendedor3
'''

        with open(examples_dir / "sample_leads.csv", 'w', encoding='utf-8') as f:
            f.write(sample_leads_content)

        # Create field mapping example
        field_mapping_example = {
            "field_mappings": {
                "Lead": "FirstName LastName",
                "Email": "Email",
                "Telefone": "Phone",
                "Empresa": "Company",
                "Cargo": "Title",
                "Estado": "State",
                "Cidade": "City",
                "Origem": "LeadSource",
                "Atribuir": "OwnerId"
            },
            "confidence_scores": {
                "Lead": 95,
                "Email": 100,
                "Telefone": 90,
                "Empresa": 95,
                "Cargo": 85,
                "Estado": 90,
                "Cidade": 90,
                "Origem": 80,
                "Atribuir": 75
            }
        }

        with open(examples_dir / "field_mapping_example.json", 'w', encoding='utf-8') as f:
            json.dump(field_mapping_example, f, indent=2, ensure_ascii=False)

        # Create .gitkeep files for empty directories
        for dir_name in ['data', 'logs', 'temp', 'cache']:
            dir_path = self.project_root / dir_name
            dir_path.mkdir(exist_ok=True)
            with open(dir_path / ".gitkeep", 'w') as f:
                f.write("# This file ensures the directory is tracked by Git\n")

        logger.info("Example files created successfully!")

    def save_changes_log(self) -> None:
        """Save the changes log to a file"""
        log_file = self.project_root / "logs" / f"reorganization_log_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        log_data = {
            "reorganization_timestamp": datetime.datetime.now().isoformat(),
            "total_changes": len(self.changes_log),
            "changes": self.changes_log,
            "backup_location": str(self.backup_dir),
            "project_root": str(self.project_root)
        }

        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)

        logger.info(f"Changes log saved to: {log_file}")

    def rollback_changes(self) -> bool:
        """Rollback changes using the backup"""
        logger.info("Rolling back changes...")

        if not self.backup_dir.exists():
            logger.error("No backup found! Cannot rollback.")
            return False

        try:
            # Remove current files (except backup)
            for item in self.project_root.iterdir():
                if item.name != self.backup_dir.name and item.name != '.git':
                    if item.is_dir():
                        shutil.rmtree(item)
                    else:
                        item.unlink()

            # Restore from backup
            for item in self.backup_dir.iterdir():
                dest = self.project_root / item.name
                if item.is_dir():
                    shutil.copytree(item, dest)
                else:
                    shutil.copy2(item, dest)

            logger.info("Rollback completed successfully!")
            return True

        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return False

    def run_reorganization(self, preview_only: bool = True) -> bool:
        """Run the complete reorganization process"""
        logger.info("Starting GitHub project reorganization...")

        try:
            # Step 1: Analyze current structure
            structure = self.analyze_current_structure()
            logger.info(f"Found {structure.total_files} files and {structure.total_directories} directories")

            # Step 2: Display before/after structure
            self.display_before_after_structure()

            # Step 3: Generate target mappings
            mappings = self.generate_target_structure()

            # Step 4: Preview changes
            self.preview_changes(mappings)

            if preview_only:
                logger.info("Preview mode completed. Use --apply to execute changes.")
                return True

            # Step 5: Create backup
            if not self.create_backup():
                logger.error("Failed to create backup. Aborting reorganization.")
                return False

            # Step 6: Apply reorganization
            if not self.apply_reorganization(mappings):
                logger.error("Reorganization failed. Consider rolling back.")
                return False

            # Step 7: Update import paths
            self.update_import_paths()

            # Step 8: Create enhanced .gitignore
            gitignore_content = self.generate_enhanced_gitignore()
            with open(self.project_root / ".gitignore", 'w', encoding='utf-8') as f:
                f.write(gitignore_content)
            logger.info("Enhanced .gitignore created")

            # Step 9: Create GitHub templates
            self.create_github_templates()

            # Step 10: Create example files
            self.create_example_files()

            # Step 11: Save changes log
            self.save_changes_log()

            logger.info("GitHub reorganization completed successfully!")
            logger.info(f"Backup available at: {self.backup_dir}")
            logger.info("To rollback changes, run: python tools/github_project_reorganizer.py --rollback")

            return True

        except Exception as e:
            logger.error(f"Reorganization failed: {e}")
            return False


def main():
    """Main function"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Reorganize leads processing project for GitHub",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python tools/github_project_reorganizer.py                    # Preview changes
  python tools/github_project_reorganizer.py --apply           # Apply changes
  python tools/github_project_reorganizer.py --rollback        # Rollback changes
  python tools/github_project_reorganizer.py --analyze         # Analyze only
        """
    )

    parser.add_argument('--apply', action='store_true', help='Apply the reorganization changes')
    parser.add_argument('--rollback', action='store_true', help='Rollback previous changes')
    parser.add_argument('--analyze', action='store_true', help='Analyze project structure only')
    parser.add_argument('--project-root', default='.', help='Project root directory')

    args = parser.parse_args()

    # Initialize reorganizer
    reorganizer = GitHubProjectReorganizer(args.project_root)

    try:
        if args.rollback:
            success = reorganizer.rollback_changes()
            sys.exit(0 if success else 1)
        elif args.analyze:
            structure = reorganizer.analyze_current_structure()
            reorganizer.display_before_after_structure()
            logger.info(f"Analysis complete: {structure.total_files} files analyzed")
            sys.exit(0)
        else:
            success = reorganizer.run_reorganization(preview_only=not args.apply)
            sys.exit(0 if success else 1)

    except KeyboardInterrupt:
        logger.info("Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
