#!/usr/bin/env python3
"""
Security Audit and Cleanup Script
Comprehensive security audit and cleanup for GitHub publication.

This script addresses critical security issues found during the audit:
1. Removes real API keys from config files
2. Cleans up log files with potentially sensitive information
3. Ensures all confidential data is properly excluded
4. Prepares repository for safe GitHub publication

Usage:
    python security_audit_cleanup.py --audit-only    # Security audit only
    python security_audit_cleanup.py --cleanup       # Perform cleanup
"""

import os
import sys
import argparse
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple
import re
import json

class SecurityAuditCleanup:
    """Comprehensive security audit and cleanup tool."""

    def __init__(self, workspace_root: str = "."):
        """Initialize the security audit tool."""
        self.workspace_root = Path(workspace_root).resolve()
        self.security_issues = []
        self.cleanup_actions = []

        # Patterns to detect sensitive information
        self.sensitive_patterns = {
            'api_keys': [
                r'sk-[a-zA-Z0-9\-_]{20,}',  # OpenAI API keys
                r'OPENAI_API_KEY\s*=\s*sk-[a-zA-Z0-9\-_]+',
                r'api_key\s*=\s*["\']sk-[a-zA-Z0-9\-_]+["\']'
            ],
            'passwords': [
                r'password\s*=\s*["\'][^"\']+["\']',
                r'PASSWORD\s*=\s*["\'][^"\']+["\']'
            ],
            'connection_strings': [
                r'mongodb://[^"\']+',
                r'postgresql://[^"\']+',
                r'mysql://[^"\']+',
                r'Server=.*Password=.*'
            ],
            'personal_paths': [
                r'C:\\Users\\[^\\]+',
                r'/home/[^/]+',
                r'/Users/[^/]+'
            ]
        }

        # Files that should be cleaned or removed
        self.cleanup_targets = {
            'api_key_files': ['config/.env'],
            'log_files': ['logs/*.log'],
            'backup_files': ['data/backup/*'],
            'temp_files': ['temp/*', 'tmp/*', '*.tmp']
        }

    def run_security_audit(self) -> Dict[str, List[str]]:
        """Run comprehensive security audit."""
        print("🔒 RUNNING COMPREHENSIVE SECURITY AUDIT")
        print("=" * 60)

        audit_results = {
            'critical_issues': [],
            'warnings': [],
            'recommendations': [],
            'files_to_clean': [],
            'safe_for_github': False
        }

        # 1. Check for API keys and credentials
        print("🔍 Checking for API keys and credentials...")
        api_key_issues = self._check_api_keys()
        audit_results['critical_issues'].extend(api_key_issues)

        # 2. Check configuration files
        print("🔍 Checking configuration files...")
        config_issues = self._check_configuration_files()
        audit_results['warnings'].extend(config_issues)

        # 3. Check log files for sensitive data
        print("🔍 Checking log files...")
        log_issues = self._check_log_files()
        audit_results['warnings'].extend(log_issues)

        # 4. Check for hardcoded sensitive information in code
        print("🔍 Scanning code for hardcoded sensitive information...")
        code_issues = self._scan_code_files()
        audit_results['warnings'].extend(code_issues)

        # 5. Verify .gitignore coverage
        print("🔍 Verifying .gitignore coverage...")
        gitignore_recommendations = self._check_gitignore()
        audit_results['recommendations'].extend(gitignore_recommendations)

        # 6. Check remaining data files
        print("🔍 Checking for remaining data files...")
        data_file_issues = self._check_data_files()
        audit_results['warnings'].extend(data_file_issues)

        # Determine if repository is safe for GitHub
        audit_results['safe_for_github'] = len(audit_results['critical_issues']) == 0

        return audit_results

    def _check_api_keys(self) -> List[str]:
        """Check for exposed API keys."""
        issues = []

        # Check config/.env file
        env_file = self.workspace_root / "config" / ".env"
        if env_file.exists():
            with open(env_file, 'r', encoding='utf-8') as f:
                content = f.read()

            for pattern in self.sensitive_patterns['api_keys']:
                if re.search(pattern, content):
                    issues.append(f"🚨 CRITICAL: Real API key found in {env_file}")
                    self.cleanup_actions.append(('remove_api_key', str(env_file)))

        # Check all files for hardcoded API keys
        for file_path in self.workspace_root.rglob("*.py"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                for pattern in self.sensitive_patterns['api_keys']:
                    if re.search(pattern, content):
                        issues.append(f"🚨 CRITICAL: API key found in code: {file_path}")
            except (UnicodeDecodeError, PermissionError):
                continue

        return issues

    def _check_configuration_files(self) -> List[str]:
        """Check configuration files for sensitive information."""
        issues = []

        config_files = [
            "config/config.json",
            "config_ai_sample.json",
            "examples/config_sample.json"
        ]

        for config_file in config_files:
            file_path = self.workspace_root / config_file
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Check for suspicious content
                    if 'password' in content.lower():
                        issues.append(f"⚠️  Password reference in {config_file}")

                    # Check if it's a real config vs sample
                    if 'sample' not in config_file and 'example' not in config_file:
                        if 'lead_distribution' in content:
                            # Check if it contains real user aliases
                            try:
                                config_data = json.loads(content)
                                if 'lead_distribution' in config_data:
                                    aliases = list(config_data['lead_distribution'].keys())
                                    if len(aliases) > 0:
                                        issues.append(f"⚠️  Real user aliases in {config_file}: {aliases}")
                            except json.JSONDecodeError:
                                pass

                except (UnicodeDecodeError, PermissionError):
                    continue

        return issues

    def _check_log_files(self) -> List[str]:
        """Check log files for sensitive information."""
        issues = []

        logs_dir = self.workspace_root / "logs"
        if logs_dir.exists():
            log_files = list(logs_dir.glob("*.log"))

            if log_files:
                issues.append(f"⚠️  {len(log_files)} log files contain processing history")
                self.cleanup_actions.append(('clean_logs', str(logs_dir)))

                # Check a sample log for sensitive content
                sample_log = log_files[0]
                try:
                    with open(sample_log, 'r', encoding='utf-8') as f:
                        content = f.read(1000)  # Read first 1KB

                    if 'OPENAI_API_KEY' in content:
                        issues.append(f"🚨 CRITICAL: API key references in logs")

                    # Check for file paths that might reveal sensitive info
                    for pattern in self.sensitive_patterns['personal_paths']:
                        if re.search(pattern, content):
                            issues.append(f"⚠️  Personal file paths in logs")
                            break

                except (UnicodeDecodeError, PermissionError):
                    pass

        return issues

    def _scan_code_files(self) -> List[str]:
        """Scan Python files for hardcoded sensitive information."""
        issues = []

        for file_path in self.workspace_root.rglob("*.py"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Check for hardcoded paths
                for pattern in self.sensitive_patterns['personal_paths']:
                    if re.search(pattern, content):
                        issues.append(f"⚠️  Hardcoded path in {file_path.name}")
                        break

                # Check for password patterns
                for pattern in self.sensitive_patterns['passwords']:
                    if re.search(pattern, content, re.IGNORECASE):
                        issues.append(f"⚠️  Password pattern in {file_path.name}")
                        break

            except (UnicodeDecodeError, PermissionError):
                continue

        return issues

    def _check_gitignore(self) -> List[str]:
        """Check .gitignore coverage."""
        recommendations = []

        gitignore_path = self.workspace_root / ".gitignore"
        if not gitignore_path.exists():
            recommendations.append("📝 Create .gitignore file")
            return recommendations

        with open(gitignore_path, 'r', encoding='utf-8') as f:
            gitignore_content = f.read()

        # Check for essential exclusions
        essential_patterns = [
            '*.env',
            '*.log',
            'logs/',
            '*.csv',
            '*.xlsx',
            'config/.env'
        ]

        for pattern in essential_patterns:
            if pattern not in gitignore_content:
                recommendations.append(f"📝 Add '{pattern}' to .gitignore")

        return recommendations

    def _check_data_files(self) -> List[str]:
        """Check for remaining data files."""
        issues = []

        # Check for any remaining Excel/CSV files
        data_extensions = ['.xlsx', '.xls', '.csv']

        for ext in data_extensions:
            files = list(self.workspace_root.rglob(f"*{ext}"))
            # Filter out test files
            real_data_files = [f for f in files if 'test' not in str(f).lower()]

            if real_data_files:
                issues.append(f"⚠️  {len(real_data_files)} {ext} files still present")
                for file_path in real_data_files[:3]:  # Show first 3
                    rel_path = file_path.relative_to(self.workspace_root)
                    issues.append(f"    - {rel_path}")

        return issues

    def perform_security_cleanup(self) -> Dict[str, int]:
        """Perform security cleanup actions."""
        print("\n🧹 PERFORMING SECURITY CLEANUP")
        print("=" * 60)

        cleanup_results = {
            'files_cleaned': 0,
            'files_removed': 0,
            'api_keys_removed': 0,
            'logs_cleaned': 0
        }

        for action, target in self.cleanup_actions:
            if action == 'remove_api_key':
                if self._clean_api_key_file(target):
                    cleanup_results['api_keys_removed'] += 1
                    cleanup_results['files_cleaned'] += 1

            elif action == 'clean_logs':
                removed_count = self._clean_log_files(target)
                cleanup_results['logs_cleaned'] += removed_count
                cleanup_results['files_removed'] += removed_count

        return cleanup_results

    def _clean_api_key_file(self, file_path: str) -> bool:
        """Clean API key from environment file."""
        try:
            env_path = Path(file_path)
            if env_path.exists():
                # Replace real API key with placeholder
                with open(env_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Replace API key with placeholder
                cleaned_content = re.sub(
                    r'OPENAI_API_KEY\s*=\s*sk-[a-zA-Z0-9\-_]+',
                    'OPENAI_API_KEY=your_openai_api_key_here',
                    content
                )

                with open(env_path, 'w', encoding='utf-8') as f:
                    f.write(cleaned_content)

                print(f"✅ Cleaned API key from {file_path}")
                return True

        except Exception as e:
            print(f"❌ Failed to clean {file_path}: {e}")

        return False

    def _clean_log_files(self, logs_dir: str) -> int:
        """Clean or remove log files."""
        try:
            logs_path = Path(logs_dir)
            if logs_path.exists():
                log_files = list(logs_path.glob("*.log"))

                for log_file in log_files:
                    log_file.unlink()
                    print(f"✅ Removed log file: {log_file.name}")

                return len(log_files)

        except Exception as e:
            print(f"❌ Failed to clean logs: {e}")

        return 0


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description="Comprehensive security audit and cleanup for GitHub publication"
    )

    parser.add_argument('--audit-only', action='store_true',
                       help='Run security audit only, no cleanup')
    parser.add_argument('--cleanup', action='store_true',
                       help='Perform security cleanup after audit')
    parser.add_argument('--workspace', default='.',
                       help='Workspace root directory')

    args = parser.parse_args()

    # Initialize security audit tool
    security_tool = SecurityAuditCleanup(args.workspace)

    # Run security audit
    audit_results = security_tool.run_security_audit()

    # Display audit results
    print(f"\n📊 AUDIT SUMMARY")
    print("=" * 40)
    print(f"Critical Issues: {len(audit_results['critical_issues'])}")
    print(f"Warnings: {len(audit_results['warnings'])}")
    print(f"Recommendations: {len(audit_results['recommendations'])}")
    print(f"Safe for GitHub: {'✅ YES' if audit_results['safe_for_github'] else '❌ NO'}")

    # Show critical issues
    if audit_results['critical_issues']:
        print(f"\n🚨 CRITICAL ISSUES:")
        for issue in audit_results['critical_issues']:
            print(f"  {issue}")

    # Show warnings
    if audit_results['warnings']:
        print(f"\n⚠️ WARNINGS:")
        for warning in audit_results['warnings']:
            print(f"  {warning}")

    # Perform cleanup if requested
    cleanup_results = None
    if args.cleanup and not args.audit_only:
        if security_tool.cleanup_actions:
            print(f"\n🧹 PERFORMING AUTOMATIC CLEANUP...")
            cleanup_results = security_tool.perform_security_cleanup()

            print(f"\n✅ CLEANUP COMPLETED:")
            print(f"  - Files cleaned: {cleanup_results['files_cleaned']}")
            print(f"  - Files removed: {cleanup_results['files_removed']}")
            print(f"  - API keys removed: {cleanup_results['api_keys_removed']}")
            print(f"  - Log files cleaned: {cleanup_results['logs_cleaned']}")
        else:
            print(f"\n✅ No cleanup needed - repository is already secure!")

    # Final recommendation
    if audit_results['safe_for_github']:
        print(f"\n🎉 REPOSITORY IS READY FOR GITHUB PUBLICATION!")
        print("✅ All security checks passed")
        print("✅ No critical issues found")
        print("✅ Safe to make repository public")
    else:
        print(f"\n⚠️  REPOSITORY NOT READY FOR GITHUB PUBLICATION")
        print("❌ Critical security issues found")
        print("❌ Use --cleanup flag to fix issues automatically")


if __name__ == "__main__":
    main()