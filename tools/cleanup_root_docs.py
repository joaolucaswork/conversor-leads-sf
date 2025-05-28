#!/usr/bin/env python3
"""
Root Documentation Cleanup Script
=================================

Move all documentation files from project root to organized docs structure
while maintaining the main README.md in the root.

Author: AI Assistant
Version: 1.0.0
"""

import os
import shutil
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def cleanup_root_documentation():
    """Move documentation files from root to docs/legacy/"""
    
    project_root = Path(".")
    docs_legacy_dir = project_root / "docs" / "legacy"
    
    # Create docs/legacy directory if it doesn't exist
    docs_legacy_dir.mkdir(parents=True, exist_ok=True)
    
    # Files to keep in root (essential project files)
    keep_in_root = {
        'README.md',
        'package.json',
        'requirements.txt',
        'Procfile',
        'app.json',
        'runtime.txt',
        'vite.config.js',
        'electron-builder.yml'
    }
    
    # Find all documentation and configuration files in root
    root_files = [f for f in project_root.iterdir() if f.is_file()]
    
    moved_files = []
    
    for file_path in root_files:
        filename = file_path.name
        
        # Skip files that should stay in root
        if filename in keep_in_root:
            continue
            
        # Skip hidden files and directories
        if filename.startswith('.'):
            continue
            
        # Skip Python cache and other system files
        if filename.endswith(('.pyc', '.pyo', '.log')):
            continue
            
        # Move documentation files (.md), configuration files, and scripts
        should_move = (
            filename.endswith('.md') or
            filename.endswith('.py') and filename not in ['quick_start.py'] or
            filename.endswith('.html') or
            filename.endswith('.sh') or
            filename.endswith('.ps1') or
            filename.endswith('.bat') or
            filename.endswith('.csv') and 'verification' in filename.lower()
        )
        
        if should_move:
            try:
                destination = docs_legacy_dir / filename
                
                # If file already exists in destination, add a suffix
                if destination.exists():
                    base_name = destination.stem
                    suffix = destination.suffix
                    counter = 1
                    while destination.exists():
                        destination = docs_legacy_dir / f"{base_name}_{counter}{suffix}"
                        counter += 1
                
                shutil.move(str(file_path), str(destination))
                moved_files.append(f"{filename} → docs/legacy/{destination.name}")
                logger.info(f"Moved: {filename} → docs/legacy/{destination.name}")
                
            except Exception as e:
                logger.error(f"Failed to move {filename}: {e}")
    
    # Create a summary of moved files
    summary_file = docs_legacy_dir / "MOVED_FILES_SUMMARY.md"
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write("# Moved Files Summary\n\n")
        f.write("This directory contains files that were moved from the project root during reorganization.\n\n")
        f.write("## Files Moved:\n\n")
        for moved_file in moved_files:
            f.write(f"- {moved_file}\n")
        f.write(f"\nTotal files moved: {len(moved_files)}\n")
    
    logger.info(f"Cleanup completed! Moved {len(moved_files)} files to docs/legacy/")
    logger.info("Summary created at docs/legacy/MOVED_FILES_SUMMARY.md")
    
    return len(moved_files)

def update_gitignore_for_clean_root():
    """Update .gitignore to prevent future root clutter"""
    
    gitignore_path = Path(".gitignore")
    
    # Additional rules to keep root clean
    additional_rules = """

# ========================================
# KEEP PROJECT ROOT CLEAN
# ========================================
# Prevent documentation files in root (except README.md)
/*.md
!README.md

# Prevent scripts in root
/*.py
!quick_start.py

# Prevent temporary files in root
/*.html
/*.csv
/*.log
/*.tmp
/*.temp

# Prevent deployment scripts in root
/*.sh
/*.bat
/*.ps1
"""
    
    try:
        with open(gitignore_path, 'a', encoding='utf-8') as f:
            f.write(additional_rules)
        logger.info("Updated .gitignore to keep root clean")
    except Exception as e:
        logger.error(f"Failed to update .gitignore: {e}")

def create_clean_root_structure():
    """Show the clean root structure after cleanup"""
    
    logger.info("=== CLEAN PROJECT ROOT STRUCTURE ===")
    
    essential_files = [
        "README.md",
        "package.json", 
        "requirements.txt",
        "Procfile",
        "app.json",
        "runtime.txt"
    ]
    
    essential_dirs = [
        "src/",
        "config/", 
        "docs/",
        "tools/",
        "scripts/",
        "tests/",
        "examples/",
        "backend/",
        "core/",
        ".github/"
    ]
    
    logger.info("Essential files in root:")
    for file in essential_files:
        if Path(file).exists():
            logger.info(f"  ✓ {file}")
        else:
            logger.info(f"  ✗ {file} (missing)")
    
    logger.info("\nEssential directories:")
    for dir_name in essential_dirs:
        if Path(dir_name).exists():
            logger.info(f"  ✓ {dir_name}")
        else:
            logger.info(f"  ✗ {dir_name} (missing)")

def main():
    """Main function"""
    logger.info("Starting root documentation cleanup...")
    
    try:
        # Move documentation files to docs/legacy
        moved_count = cleanup_root_documentation()
        
        # Update .gitignore to prevent future clutter
        update_gitignore_for_clean_root()
        
        # Show clean structure
        create_clean_root_structure()
        
        logger.info(f"✅ Root cleanup completed successfully!")
        logger.info(f"📁 {moved_count} files moved to docs/legacy/")
        logger.info("🔒 .gitignore updated to prevent future root clutter")
        
    except Exception as e:
        logger.error(f"❌ Root cleanup failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
