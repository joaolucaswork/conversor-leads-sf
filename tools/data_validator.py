#!/usr/bin/env python3
"""
Data Validation Script
Validates processed lead files for data quality and consistency.

Usage:
    python data_validator.py file.csv
    python data_validator.py file.csv --config config.json --report
"""

import pandas as pd
import re
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any

class DataValidator:
    """Class for validating lead data quality."""

    def __init__(self, config_file: str = None):
        """Initialize validator with configuration."""
        self.config = self.load_config(config_file)
        self.validation_results = {
            'file_info': {},
            'column_validation': {},
            'data_quality': {},
            'distribution_analysis': {},
            'errors': [],
            'warnings': [],
            'summary': {}
        }

    def load_config(self, config_file: str = None) -> Dict[str, Any]:
        """Load validation configuration."""
        default_config = {
            "required_columns": [
                "Last Name", "Phone", "Email", "OwnerId"
            ],
            "optional_columns": [
                "Telefone Adcional", "Description", "Patrimônio Financeiro",
                "Tipo", "State/Province", "maisdeMilhao__c"
            ],
            "validation_rules": {
                "phone_min_length": 8,
                "phone_max_length": 15,
                "email_pattern": r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
                "name_min_length": 2,
                "patrimonio_min": 100000,
                "patrimonio_max": 100000000
            },
            "expected_aliases": ["guic", "cmilfont", "ctint", "pnilo"]
        }

        if config_file and Path(config_file).exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                # Merge configurations
                if 'validation_rules' in user_config:
                    default_config['validation_rules'].update(user_config['validation_rules'])
                default_config.update({k: v for k, v in user_config.items() if k != 'validation_rules'})
            except Exception as e:
                print(f"Warning: Could not load config file {config_file}: {e}")

        return default_config

    def validate_file_structure(self, df: pd.DataFrame, file_path: str):
        """Validate basic file structure."""
        self.validation_results['file_info'] = {
            'file_path': file_path,
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'columns': list(df.columns),
            'file_size_mb': round(Path(file_path).stat().st_size / (1024*1024), 2)
        }

        # Check required columns
        missing_required = []
        for col in self.config['required_columns']:
            if col not in df.columns:
                missing_required.append(col)

        if missing_required:
            self.validation_results['errors'].append(
                f"Missing required columns: {', '.join(missing_required)}"
            )

        # Check for unexpected columns
        expected_cols = self.config['required_columns'] + self.config['optional_columns']
        unexpected_cols = [col for col in df.columns if col not in expected_cols]

        if unexpected_cols:
            self.validation_results['warnings'].append(
                f"Unexpected columns found: {', '.join(unexpected_cols)}"
            )

    def validate_phone_numbers(self, df: pd.DataFrame):
        """Validate phone number format and quality."""
        phone_validation = {
            'phone_column': {},
            'telefone_adicional_column': {}
        }

        rules = self.config['validation_rules']

        # Validate Phone column
        if 'Phone' in df.columns:
            phone_col = df['Phone'].astype(str)
            phone_validation['phone_column'] = {
                'total_entries': len(phone_col),
                'empty_entries': len(phone_col[phone_col.isin(['', 'nan', 'None'])]),
                'too_short': len(phone_col[phone_col.str.len() < rules['phone_min_length']]),
                'too_long': len(phone_col[phone_col.str.len() > rules['phone_max_length']]),
                'non_numeric': len(phone_col[~phone_col.str.isdigit() & ~phone_col.isin(['', 'nan', 'None'])])
            }

        # Validate Telefone Adcional column
        if 'Telefone Adcional' in df.columns:
            tel_col = df['Telefone Adcional'].astype(str)
            phone_validation['telefone_adicional_column'] = {
                'total_entries': len(tel_col),
                'empty_entries': len(tel_col[tel_col.isin(['', 'nan', 'None'])]),
                'too_short': len(tel_col[tel_col.str.len() < rules['phone_min_length']]),
                'too_long': len(tel_col[tel_col.str.len() > rules['phone_max_length']]),
                'non_numeric': len(tel_col[~tel_col.str.isdigit() & ~tel_col.isin(['', 'nan', 'None'])])
            }

        self.validation_results['data_quality']['phone_validation'] = phone_validation

    def validate_emails(self, df: pd.DataFrame):
        """Validate email format and quality."""
        if 'Email' not in df.columns:
            return

        email_col = df['Email'].astype(str)
        email_pattern = self.config['validation_rules']['email_pattern']

        email_validation = {
            'total_entries': len(email_col),
            'empty_entries': len(email_col[email_col.isin(['', 'nan', 'None'])]),
            'invalid_format': 0,
            'duplicate_emails': 0
        }

        # Check email format
        valid_emails = email_col[email_col.str.match(email_pattern, na=False)]
        email_validation['invalid_format'] = len(email_col) - len(valid_emails) - email_validation['empty_entries']

        # Check for duplicates
        email_validation['duplicate_emails'] = len(email_col) - len(email_col.drop_duplicates())

        self.validation_results['data_quality']['email_validation'] = email_validation

    def validate_names(self, df: pd.DataFrame):
        """Validate name format and quality."""
        if 'Last Name' not in df.columns:
            return

        name_col = df['Last Name'].astype(str)
        min_length = self.config['validation_rules']['name_min_length']

        name_validation = {
            'total_entries': len(name_col),
            'empty_entries': len(name_col[name_col.isin(['', 'nan', 'None'])]),
            'too_short': len(name_col[name_col.str.len() < min_length]),
            'all_uppercase': len(name_col[name_col.str.isupper()]),
            'all_lowercase': len(name_col[name_col.str.islower()]),
            'proper_case': 0
        }

        # Count properly formatted names (Title Case)
        for name in name_col:
            if isinstance(name, str) and name and name.istitle():
                name_validation['proper_case'] += 1

        self.validation_results['data_quality']['name_validation'] = name_validation

    def validate_financial_data(self, df: pd.DataFrame):
        """Validate financial data (Patrimônio Financeiro)."""
        if 'Patrimônio Financeiro' not in df.columns:
            return

        fin_col = pd.to_numeric(df['Patrimônio Financeiro'], errors='coerce')
        rules = self.config['validation_rules']

        financial_validation = {
            'total_entries': len(fin_col),
            'null_entries': fin_col.isnull().sum(),
            'below_minimum': (fin_col < rules['patrimonio_min']).sum(),
            'above_maximum': (fin_col > rules['patrimonio_max']).sum(),
            'average_value': fin_col.mean(),
            'median_value': fin_col.median()
        }

        self.validation_results['data_quality']['financial_validation'] = financial_validation

    def analyze_distribution(self, df: pd.DataFrame):
        """Analyze lead distribution by OwnerId."""
        if 'OwnerId' not in df.columns:
            return

        distribution = df['OwnerId'].value_counts().to_dict()
        expected_aliases = self.config['expected_aliases']

        distribution_analysis = {
            'total_assigned': len(df[df['OwnerId'] != '']),
            'total_unassigned': len(df[df['OwnerId'] == '']),
            'distribution_by_alias': distribution,
            'unexpected_aliases': []
        }

        # Check for unexpected aliases
        for alias in distribution.keys():
            if alias and alias not in expected_aliases:
                distribution_analysis['unexpected_aliases'].append(alias)

        self.validation_results['distribution_analysis'] = distribution_analysis

    def generate_summary(self):
        """Generate validation summary."""
        errors_count = len(self.validation_results['errors'])
        warnings_count = len(self.validation_results['warnings'])

        # Calculate quality score
        total_checks = 0
        passed_checks = 0

        # Phone validation score
        if 'phone_validation' in self.validation_results['data_quality']:
            phone_val = self.validation_results['data_quality']['phone_validation']
            for col_data in phone_val.values():
                if isinstance(col_data, dict):
                    total_checks += 4  # 4 checks per phone column
                    passed_checks += sum(1 for v in col_data.values() if isinstance(v, int) and v == 0)

        # Email validation score
        if 'email_validation' in self.validation_results['data_quality']:
            email_val = self.validation_results['data_quality']['email_validation']
            total_checks += 2
            passed_checks += (1 if email_val['invalid_format'] == 0 else 0)
            passed_checks += (1 if email_val['duplicate_emails'] == 0 else 0)

        quality_score = (passed_checks / total_checks * 100) if total_checks > 0 else 0

        self.validation_results['summary'] = {
            'validation_status': 'PASSED' if errors_count == 0 else 'FAILED',
            'quality_score': round(quality_score, 1),
            'total_errors': errors_count,
            'total_warnings': warnings_count,
            'total_records': self.validation_results['file_info'].get('total_rows', 0)
        }

    def validate_file(self, file_path: str) -> Dict[str, Any]:
        """Main validation method."""
        try:
            # Read the file
            df = pd.read_csv(file_path, encoding='utf-8')
        except UnicodeDecodeError:
            df = pd.read_csv(file_path, encoding='latin-1')
        except Exception as e:
            self.validation_results['errors'].append(f"Could not read file: {e}")
            return self.validation_results

        # Run all validations
        self.validate_file_structure(df, file_path)
        self.validate_phone_numbers(df)
        self.validate_emails(df)
        self.validate_names(df)
        self.validate_financial_data(df)
        self.analyze_distribution(df)
        self.generate_summary()

        return self.validation_results

    def print_validation_report(self, results: Dict[str, Any]):
        """Print a detailed validation report."""
        print("\n" + "="*60)
        print("DATA VALIDATION REPORT")
        print("="*60)

        # File info
        file_info = results['file_info']
        print(f"📄 File: {Path(file_info['file_path']).name}")
        print(f"📊 Records: {file_info['total_rows']:,}")
        print(f"📋 Columns: {file_info['total_columns']}")
        print(f"💾 Size: {file_info['file_size_mb']} MB")

        # Summary
        summary = results['summary']
        status_emoji = "✅" if summary['validation_status'] == 'PASSED' else "❌"
        print(f"\n{status_emoji} Status: {summary['validation_status']}")
        print(f"🎯 Quality Score: {summary['quality_score']}%")
        print(f"❌ Errors: {summary['total_errors']}")
        print(f"⚠️  Warnings: {summary['total_warnings']}")

        # Errors and warnings
        if results['errors']:
            print(f"\n❌ ERRORS:")
            for error in results['errors']:
                print(f"  • {error}")

        if results['warnings']:
            print(f"\n⚠️  WARNINGS:")
            for warning in results['warnings']:
                print(f"  • {warning}")

        # Data quality details
        if 'data_quality' in results:
            print(f"\n📋 DATA QUALITY DETAILS:")

            # Phone validation
            if 'phone_validation' in results['data_quality']:
                phone_val = results['data_quality']['phone_validation']
                print(f"\n📞 Phone Number Validation:")

                for col_name, col_data in phone_val.items():
                    if isinstance(col_data, dict):
                        col_display = col_name.replace('_', ' ').title()
                        print(f"  {col_display}:")
                        print(f"    • Total entries: {col_data['total_entries']}")
                        print(f"    • Empty: {col_data['empty_entries']}")
                        print(f"    • Too short: {col_data['too_short']}")
                        print(f"    • Too long: {col_data['too_long']}")
                        print(f"    • Non-numeric: {col_data['non_numeric']}")

            # Email validation
            if 'email_validation' in results['data_quality']:
                email_val = results['data_quality']['email_validation']
                print(f"\n📧 Email Validation:")
                print(f"  • Total entries: {email_val['total_entries']}")
                print(f"  • Empty: {email_val['empty_entries']}")
                print(f"  • Invalid format: {email_val['invalid_format']}")
                print(f"  • Duplicates: {email_val['duplicate_emails']}")

            # Name validation
            if 'name_validation' in results['data_quality']:
                name_val = results['data_quality']['name_validation']
                print(f"\n👤 Name Validation:")
                print(f"  • Total entries: {name_val['total_entries']}")
                print(f"  • Empty: {name_val['empty_entries']}")
                print(f"  • Too short: {name_val['too_short']}")
                print(f"  • All uppercase: {name_val['all_uppercase']}")
                print(f"  • All lowercase: {name_val['all_lowercase']}")
                print(f"  • Proper case: {name_val['proper_case']}")

            # Financial validation
            if 'financial_validation' in results['data_quality']:
                fin_val = results['data_quality']['financial_validation']
                print(f"\n💰 Financial Data Validation:")
                print(f"  • Total entries: {fin_val['total_entries']}")
                print(f"  • Null entries: {fin_val['null_entries']}")
                print(f"  • Below minimum: {fin_val['below_minimum']}")
                print(f"  • Above maximum: {fin_val['above_maximum']}")
                print(f"  • Average value: R$ {fin_val['average_value']:,.2f}")
                print(f"  • Median value: R$ {fin_val['median_value']:,.2f}")

        # Distribution analysis
        if 'distribution_analysis' in results:
            dist_analysis = results['distribution_analysis']
            print(f"\n📈 LEAD DISTRIBUTION ANALYSIS:")
            print(f"  • Total assigned: {dist_analysis['total_assigned']}")
            print(f"  • Total unassigned: {dist_analysis['total_unassigned']}")

            if dist_analysis['distribution_by_alias']:
                print(f"  • Distribution by alias:")
                for alias, count in dist_analysis['distribution_by_alias'].items():
                    if alias:  # Skip empty aliases
                        print(f"    - {alias}: {count} leads")

            if dist_analysis['unexpected_aliases']:
                print(f"  • Unexpected aliases: {', '.join(dist_analysis['unexpected_aliases'])}")

        print("="*60)

def main():
    """Main CLI interface for data validation."""
    parser = argparse.ArgumentParser(description='Validate lead data files')
    parser.add_argument('file_path', help='CSV file to validate')
    parser.add_argument('-c', '--config', help='Configuration file path')
    parser.add_argument('-r', '--report', help='Save detailed report to file')
    parser.add_argument('--json', action='store_true', help='Output results as JSON')

    args = parser.parse_args()

    if not Path(args.file_path).exists():
        print(f"❌ File not found: {args.file_path}")
        sys.exit(1)

    try:
        # Initialize validator and run validation
        validator = DataValidator(config_file=args.config)
        results = validator.validate_file(args.file_path)

        # Output results
        if args.json:
            print(json.dumps(results, indent=2, ensure_ascii=False))
        else:
            validator.print_validation_report(results)

        # Save report if requested
        if args.report:
            with open(args.report, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"\n📄 Detailed report saved to: {args.report}")

        # Exit with appropriate code
        if results['summary']['validation_status'] == 'FAILED':
            sys.exit(1)

    except Exception as e:
        print(f"❌ Validation failed: {e}")
        sys.exit(1)

# Wrapper function for backend API integration
def validate_data(file_path: str, config_file: str = None) -> Dict[str, Any]:
    """
    Wrapper function for data validation.

    Args:
        file_path: Path to file to validate
        config_file: Optional configuration file path

    Returns:
        Validation results dictionary
    """
    validator = DataValidator(config_file=config_file)
    return validator.validate_file(file_path)

if __name__ == "__main__":
    main()
