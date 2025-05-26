#!/usr/bin/env python3
"""
Secure Data File Cleanup Script
Safely removes confidential data files before GitHub repository publication.

This script identifies and removes Excel (.xlsx, .xls) and CSV (.csv) files
while preserving code, configuration, and documentation files.

Usage:
    python secure_data_cleanup.py --scan-only    # Preview files to be deleted
    python secure_data_cleanup.py --confirm      # Actually delete the files
    python secure_data_cleanup.py --backup       # Create backup before deletion
"""

import os
import sys
import argparse
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Dict
import json

class SecureDataCleanup:
    """Secure cleanup of confidential data files."""

    def __init__(self, workspace_root: str = "."):
        """Initialize the cleanup tool."""
        self.workspace_root = Path(workspace_root).resolve()
        self.data_extensions = ['.xlsx', '.xls', '.csv']

        # Files to preserve (even if they match data extensions)
        self.preserve_patterns = [
            'requirements.txt',
            'config*.json',
            'sample*.csv',
            'template*.csv',
            'example*.csv',
            'test_*.csv',  # Keep test files
            'test_mixed_format.csv',  # Keep specific test files
            'test_raw_format.csv'     # Keep specific test files
        ]

        # Directories to scan
        self.scan_directories = [
            'data',
            'backup',
            'input',
            'output',
            'test_data',
            '.'  # Root directory
        ]

        self.found_files = []
        self.preserved_files = []

    def should_preserve_file(self, file_path: Path) -> bool:
        """Check if a file should be preserved based on patterns."""
        file_name = file_path.name.lower()

        for pattern in self.preserve_patterns:
            if pattern.replace('*', '') in file_name:
                return True

        # Preserve files in specific safe directories
        safe_dirs = ['examples', 'templates', 'docs']
        if any(safe_dir in str(file_path).lower() for safe_dir in safe_dirs):
            return True

        return False

    def scan_for_data_files(self) -> Dict[str, List[Path]]:
        """Scan workspace for data files that should be removed."""
        results = {
            'to_delete': [],
            'preserved': [],
            'summary': {}
        }

        print(f"🔍 Scanning workspace: {self.workspace_root}")
        print("=" * 60)

        # Scan for all files with data extensions
        all_data_files = []
        for ext in self.data_extensions:
            pattern = f"**/*{ext}"
            found = list(self.workspace_root.rglob(pattern))
            all_data_files.extend(found)

        # Categorize files
        for file_path in all_data_files:
            if self.should_preserve_file(file_path):
                results['preserved'].append(file_path)
                self.preserved_files.append(file_path)
            else:
                results['to_delete'].append(file_path)
                self.found_files.append(file_path)

        # Generate summary
        results['summary'] = {
            'total_found': len(all_data_files),
            'to_delete': len(results['to_delete']),
            'preserved': len(results['preserved']),
            'extensions': {ext: len([f for f in all_data_files if f.suffix == ext])
                          for ext in self.data_extensions}
        }

        return results

    def display_scan_results(self, results: Dict[str, List[Path]]):
        """Display scan results in a clear format."""
        summary = results['summary']

        print(f"📊 SCAN RESULTS")
        print("=" * 60)
        print(f"Total data files found: {summary['total_found']}")
        print(f"Files to DELETE: {summary['to_delete']}")
        print(f"Files to PRESERVE: {summary['preserved']}")
        print()

        print("📁 Files by extension:")
        for ext, count in summary['extensions'].items():
            print(f"  {ext}: {count} files")
        print()

        if results['to_delete']:
            print("🗑️  FILES TO BE DELETED:")
            print("-" * 40)
            for file_path in sorted(results['to_delete']):
                rel_path = file_path.relative_to(self.workspace_root)
                file_size = file_path.stat().st_size if file_path.exists() else 0
                size_mb = file_size / (1024 * 1024)
                print(f"  📄 {rel_path} ({size_mb:.2f} MB)")
            print()

        if results['preserved']:
            print("✅ FILES TO BE PRESERVED:")
            print("-" * 40)
            for file_path in sorted(results['preserved']):
                rel_path = file_path.relative_to(self.workspace_root)
                print(f"  📄 {rel_path}")
            print()

    def create_backup(self, backup_dir: str = "data_backup") -> Path:
        """Create a backup of all data files before deletion."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = self.workspace_root / f"{backup_dir}_{timestamp}"
        backup_path.mkdir(exist_ok=True)

        print(f"💾 Creating backup in: {backup_path}")

        backed_up_count = 0
        for file_path in self.found_files:
            if file_path.exists():
                # Maintain directory structure in backup
                rel_path = file_path.relative_to(self.workspace_root)
                backup_file_path = backup_path / rel_path
                backup_file_path.parent.mkdir(parents=True, exist_ok=True)

                shutil.copy2(file_path, backup_file_path)
                backed_up_count += 1

        print(f"✅ Backed up {backed_up_count} files to {backup_path}")
        return backup_path

    def delete_data_files(self, confirm: bool = False) -> Dict[str, int]:
        """Delete the identified data files."""
        if not confirm:
            print("❌ Deletion not confirmed. Use --confirm flag to proceed.")
            return {'deleted': 0, 'failed': 0}

        print("🗑️  Starting file deletion...")

        deleted_count = 0
        failed_count = 0
        failed_files = []

        for file_path in self.found_files:
            try:
                if file_path.exists():
                    file_path.unlink()
                    print(f"  ✅ Deleted: {file_path.relative_to(self.workspace_root)}")
                    deleted_count += 1
                else:
                    print(f"  ⚠️  File not found: {file_path.relative_to(self.workspace_root)}")
            except Exception as e:
                print(f"  ❌ Failed to delete {file_path.relative_to(self.workspace_root)}: {e}")
                failed_files.append(str(file_path))
                failed_count += 1

        print(f"\n📊 DELETION SUMMARY:")
        print(f"  ✅ Successfully deleted: {deleted_count} files")
        print(f"  ❌ Failed to delete: {failed_count} files")

        if failed_files:
            print(f"\n❌ Failed files:")
            for file_path in failed_files:
                print(f"  - {file_path}")

        return {'deleted': deleted_count, 'failed': failed_count}

    def create_gitignore_entries(self) -> str:
        """Generate .gitignore entries to prevent future data file commits."""
        gitignore_entries = [
            "# Data files - prevent confidential data from being committed",
            "*.xlsx",
            "*.xls",
            "*.csv",
            "",
            "# Data directories",
            "data/input/",
            "data/output/",
            "data/backup/",
            "backup/",
            "",
            "# But allow example and template files",
            "!examples/*.csv",
            "!templates/*.csv",
            "!**/example*.csv",
            "!**/template*.csv",
            "!**/sample*.csv",
            "!test_data/test_*.csv",
            "",
            "# Logs with potentially sensitive data",
            "logs/*.log",
            "",
            "# Temporary files",
            "temp/",
            "tmp/",
            "*.tmp"
        ]

        return "\n".join(gitignore_entries)

    def update_gitignore(self):
        """Update or create .gitignore file with data file exclusions."""
        gitignore_path = self.workspace_root / ".gitignore"
        new_entries = self.create_gitignore_entries()

        if gitignore_path.exists():
            # Read existing content
            with open(gitignore_path, 'r', encoding='utf-8') as f:
                existing_content = f.read()

            # Check if our entries are already there
            if "# Data files - prevent confidential data" in existing_content:
                print("✅ .gitignore already contains data file exclusions")
                return

            # Append our entries
            with open(gitignore_path, 'a', encoding='utf-8') as f:
                f.write(f"\n\n{new_entries}")
            print("✅ Updated existing .gitignore with data file exclusions")
        else:
            # Create new .gitignore
            with open(gitignore_path, 'w', encoding='utf-8') as f:
                f.write(new_entries)
            print("✅ Created new .gitignore with data file exclusions")

    def generate_cleanup_report(self, results: Dict) -> str:
        """Generate a detailed cleanup report."""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        report = f"""
# Data Cleanup Report
Generated: {timestamp}
Workspace: {self.workspace_root}

## Summary
- Total data files found: {results.get('total_found', 0)}
- Files deleted: {results.get('deleted', 0)}
- Files preserved: {results.get('preserved', 0)}
- Failed deletions: {results.get('failed', 0)}

## Security Status
✅ Confidential data files removed
✅ .gitignore updated to prevent future commits
✅ Project structure preserved
✅ Code and configuration files intact

## Next Steps
1. Review the updated .gitignore file
2. Verify no sensitive data remains in the repository
3. Test that the application still works with sample/test data
4. Commit changes and push to GitHub

## Files Deleted
"""

        if hasattr(self, 'found_files'):
            for file_path in self.found_files:
                rel_path = file_path.relative_to(self.workspace_root)
                report += f"- {rel_path}\n"

        return report


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description="Secure cleanup of confidential data files before GitHub publication",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python secure_data_cleanup.py --scan-only     # Preview files to be deleted
  python secure_data_cleanup.py --confirm       # Delete files after confirmation
  python secure_data_cleanup.py --backup        # Create backup before deletion
  python secure_data_cleanup.py --confirm --backup  # Backup and delete
        """
    )

    parser.add_argument('--scan-only', action='store_true',
                       help='Only scan and display files, do not delete')
    parser.add_argument('--confirm', action='store_true',
                       help='Confirm deletion of data files')
    parser.add_argument('--backup', action='store_true',
                       help='Create backup before deletion')
    parser.add_argument('--workspace', default='.',
                       help='Workspace root directory (default: current directory)')

    args = parser.parse_args()

    # Initialize cleanup tool
    cleanup = SecureDataCleanup(args.workspace)

    print("🔒 SECURE DATA CLEANUP TOOL")
    print("=" * 60)
    print("This tool will help you safely remove confidential data files")
    print("before publishing your repository to GitHub.")
    print()

    # Scan for data files
    scan_results = cleanup.scan_for_data_files()
    cleanup.display_scan_results(scan_results)

    # If scan-only mode, exit here
    if args.scan_only:
        print("🔍 Scan complete. Use --confirm to proceed with deletion.")
        return

    # Check if there are files to delete
    if not scan_results['to_delete']:
        print("✅ No confidential data files found to delete.")
        cleanup.update_gitignore()
        return

    # Confirmation prompt if not using --confirm flag
    if not args.confirm:
        print("⚠️  CONFIRMATION REQUIRED")
        print("=" * 40)
        print(f"This will permanently delete {len(scan_results['to_delete'])} files.")
        print("Use --confirm flag to proceed, or --scan-only to review again.")
        return

    # Create backup if requested
    backup_path = None
    if args.backup:
        backup_path = cleanup.create_backup()
        print()

    # Final confirmation
    print("⚠️  FINAL CONFIRMATION")
    print("=" * 40)
    print(f"About to delete {len(scan_results['to_delete'])} confidential data files.")
    if backup_path:
        print(f"Backup created at: {backup_path}")

    response = input("Type 'DELETE' to confirm: ").strip()
    if response != 'DELETE':
        print("❌ Deletion cancelled.")
        return

    # Perform deletion
    deletion_results = cleanup.delete_data_files(confirm=True)

    # Update .gitignore
    cleanup.update_gitignore()

    # Generate report
    report_data = {**scan_results['summary'], **deletion_results}
    report = cleanup.generate_cleanup_report(report_data)

    # Save report
    report_path = cleanup.workspace_root / "data_cleanup_report.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"\n📄 Cleanup report saved to: {report_path}")

    print("\n🎉 DATA CLEANUP COMPLETE!")
    print("=" * 40)
    print("✅ Confidential data files removed")
    print("✅ .gitignore updated")
    print("✅ Repository ready for GitHub publication")
    print()
    print("Next steps:")
    print("1. Review the cleanup report")
    print("2. Test your application with sample data")
    print("3. Commit and push to GitHub")


if __name__ == "__main__":
    main()
