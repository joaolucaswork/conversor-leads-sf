#!/usr/bin/env python3
"""
Master Leads Processing Script
Comprehensive script that combines all lead processing functionality.

This script can:
1. Auto-detect input file formats
2. Standardize data to the target format
3. Clean and format data (phones, names, emails)
4. Distribute leads according to requirements
5. Generate standardized output files
6. Create backups automatically
7. Log all operations

Author: AI Assistant
Date: 2024
"""

import pandas as pd
import re
import os
import sys
import logging
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any

class LeadsProcessor:
    """Main class for processing leads data."""

    def __init__(self, config_file: str = None):
        """Initialize the processor with configuration."""
        self.setup_logging()
        self.config = self.load_config(config_file)
        self.standard_columns = [
            'Last Name', 'Telefone Adcional', 'Phone', 'Email',
            'Description', 'Patrimônio Financeiro', 'Tipo',
            'State/Province', 'OwnerId', 'maisdeMilhao__c'
        ]

    def setup_logging(self):
        """Setup logging configuration."""
        log_dir = Path('logs')
        log_dir.mkdir(exist_ok=True)

        log_filename = f"leads_processing_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        log_path = log_dir / log_filename

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_path, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        self.logger.info("Leads Processor initialized")

    def load_config(self, config_file: str = None) -> Dict[str, Any]:
        """Load configuration from file or use defaults."""
        default_config = {
            "lead_distribution": {
                "guic": 100,
                "cmilfont": 100,
                "ctint": 70,
                "pnilo": 30
            },
            "default_values": {
                "patrimonio_financeiro": 1300000,
                "tipo": "Pessoa Física",
                "maisdeMilhao__c": 1
            },
            "output_encoding": "utf-8",
            "backup_enabled": True
        }

        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                default_config.update(user_config)
                self.logger.info(f"Loaded configuration from {config_file}")
            except Exception as e:
                self.logger.warning(f"Could not load config file {config_file}: {e}")
                self.logger.info("Using default configuration")

        return default_config

    def detect_file_format(self, file_path: str) -> Tuple[str, str]:
        """Detect the format and separator of the input file."""
        self.logger.info(f"Detecting format for file: {file_path}")

        file_extension = Path(file_path).suffix.lower()

        # Handle Excel files
        if file_extension in ['.xlsx', '.xls']:
            self.logger.info("Detected Excel file format")
            return self._detect_excel_format_basic(file_path)

        # Handle CSV files
        return self._detect_csv_format_basic(file_path)

    def _detect_excel_format_basic(self, file_path: str) -> Tuple[str, str]:
        """Basic Excel format detection."""
        try:
            # Read first few rows to detect format
            df_sample = pd.read_excel(file_path, nrows=5)
            column_names = [str(col).lower() for col in df_sample.columns]

            if any(keyword in ' '.join(column_names) for keyword in ['cliente', 'telefone', 'e-mail']):
                self.logger.info("Detected raw format in Excel file")
                return 'raw', ','
            elif any(keyword in ' '.join(column_names) for keyword in ['last name', 'phone', 'email']):
                self.logger.info("Detected standard/pernambuco format in Excel file")
                return 'standard', ','
            else:
                self.logger.info("Detected unknown format in Excel file")
                return 'unknown', ','

        except Exception as e:
            self.logger.error(f"Error detecting Excel format: {e}")
            return 'unknown', ','

    def _detect_csv_format_basic(self, file_path: str) -> Tuple[str, str]:
        """Basic CSV format detection."""
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252']

        for encoding in encodings:
            try:
                # Read first few lines to detect separator and format
                with open(file_path, 'r', encoding=encoding) as f:
                    first_line = f.readline().strip()

                # Check for semicolon separator (raw format)
                if ';' in first_line and 'Cliente' in first_line:
                    self.logger.info("Detected raw format with semicolon separator")
                    return 'raw', ';'

                # Check for comma separator (standard format)
                elif ',' in first_line and 'Last Name' in first_line:
                    self.logger.info("Detected standard format with comma separator")
                    return 'standard', ','

                # Check for Pernambuco batch format
                elif ',' in first_line and any(col in first_line for col in ['Last Name', 'Phone', 'Email']):
                    self.logger.info("Detected Pernambuco/processed format")
                    return 'pernambuco', ','

            except UnicodeDecodeError:
                continue

        # Default fallback
        self.logger.warning("Could not detect format, using default comma separator")
        return 'unknown', ','

    def clean_phone_number(self, phone: Any) -> str:
        """Clean phone numbers by removing non-digit characters."""
        if pd.isna(phone) or phone == '' or phone == 'NA':
            return ''

        # Convert to string and remove decimal points
        phone_str = str(phone).replace('.0', '')
        # Remove any non-digit characters
        cleaned = re.sub(r'[^0-9]', '', phone_str)
        return cleaned

    def format_name(self, name: Any) -> str:
        """Format names to Title Case."""
        if pd.isna(name) or not isinstance(name, str):
            return str(name) if not pd.isna(name) else ''

        # Split by spaces and handle each part
        parts = name.strip().split()
        formatted_parts = []

        for part in parts:
            # Handle hyphenated names
            if '-' in part:
                hyphen_parts = part.split('-')
                formatted_part = '-'.join(p.capitalize() for p in hyphen_parts)
            else:
                formatted_part = part.capitalize()
            formatted_parts.append(formatted_part)

        return ' '.join(formatted_parts)

    def format_email(self, email: Any) -> str:
        """Format email addresses to lowercase."""
        if pd.isna(email) or not isinstance(email, str):
            return str(email) if not pd.isna(email) else ''
        return email.lower().strip()

    def convert_money_to_numeric(self, value: Any) -> int:
        """Convert money values to numeric format."""
        if pd.isna(value):
            return self.config["default_values"]["patrimonio_financeiro"]

        # Check if it's already numeric
        if isinstance(value, (int, float)):
            return int(value)

        # Handle string money values
        if isinstance(value, str) and "R$" in value:
            # Remove R$, commas, periods, and spaces
            value_str = str(value).replace('R$', '').replace(',', '').replace('.', '').replace(' ', '')
            try:
                return int(value_str)
            except ValueError:
                return self.config["default_values"]["patrimonio_financeiro"]

        # Default value
        return self.config["default_values"]["patrimonio_financeiro"]

    def standardize_raw_format(self, df: pd.DataFrame) -> pd.DataFrame:
        """Convert raw format to standard format."""
        self.logger.info("Converting raw format to standard format")

        # Column mapping for raw format
        column_mapping = {
            'Cliente': 'Last Name',
            'Telefone Adicional': 'Telefone Adcional',
            'Telefone': 'Phone',
            'E-mail': 'Email',
            'Volume Aproximado': 'Volume Aproximado_temp',
            'Descrição': 'Description',
            'Estado': 'State/Province',
            'Tipo': 'Tipo',
            'Alias': 'OwnerId'
        }

        # Rename columns
        df_standard = df.rename(columns=column_mapping)

        # Convert Volume Aproximado to Patrimônio Financeiro
        if 'Volume Aproximado_temp' in df_standard.columns:
            df_standard['Patrimônio Financeiro'] = df_standard['Volume Aproximado_temp'].apply(
                self.convert_money_to_numeric
            )
            df_standard = df_standard.drop(columns=['Volume Aproximado_temp'])
        else:
            df_standard['Patrimônio Financeiro'] = self.config["default_values"]["patrimonio_financeiro"]

        # Add missing columns with default values
        for col in self.standard_columns:
            if col not in df_standard.columns:
                if col == 'maisdeMilhao__c':
                    df_standard[col] = self.config["default_values"]["maisdeMilhao__c"]
                elif col == 'Tipo':
                    df_standard[col] = self.config["default_values"]["tipo"]
                else:
                    df_standard[col] = ''

        # Process Description field (replace comma with semicolon)
        if 'Description' in df_standard.columns:
            df_standard['Description'] = df_standard['Description'].astype(str).str.replace(',', ';')

        # Reorder columns to match standard format
        df_standard = df_standard[self.standard_columns]

        self.logger.info(f"Converted {len(df_standard)} records to standard format")
        return df_standard

    def clean_and_format_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and format all data fields."""
        self.logger.info("Cleaning and formatting data")

        df_clean = df.copy()

        # Clean phone numbers
        if 'Phone' in df_clean.columns:
            df_clean['Phone'] = df_clean['Phone'].apply(self.clean_phone_number)
        if 'Telefone Adcional' in df_clean.columns:
            df_clean['Telefone Adcional'] = df_clean['Telefone Adcional'].apply(self.clean_phone_number)

        # Format names
        if 'Last Name' in df_clean.columns:
            df_clean['Last Name'] = df_clean['Last Name'].apply(self.format_name)

        # Format emails
        if 'Email' in df_clean.columns:
            df_clean['Email'] = df_clean['Email'].apply(self.format_email)

        # Ensure numeric fields are properly formatted
        if 'Patrimônio Financeiro' in df_clean.columns:
            df_clean['Patrimônio Financeiro'] = df_clean['Patrimônio Financeiro'].apply(
                lambda x: int(x) if pd.notna(x) and str(x).replace('.', '').isdigit() else self.config["default_values"]["patrimonio_financeiro"]
            )

        self.logger.info("Data cleaning and formatting completed")
        return df_clean

    def distribute_leads(self, df: pd.DataFrame) -> pd.DataFrame:
        """Distribute leads according to configuration."""
        self.logger.info("Distributing leads according to configuration")

        df_distributed = df.copy()
        distribution = self.config["lead_distribution"]

        # Reset index to ensure sequential assignment
        df_distributed = df_distributed.reset_index(drop=True)

        # Create lead assignment list
        owner_assignments = []
        for alias, count in distribution.items():
            owner_assignments.extend([alias] * count)

        # Assign OwnerId based on distribution
        for i, row_idx in enumerate(df_distributed.index):
            if i < len(owner_assignments):
                df_distributed.at[row_idx, 'OwnerId'] = owner_assignments[i]
            else:
                # If more leads than distribution, leave empty or assign to default
                df_distributed.at[row_idx, 'OwnerId'] = ''

        # Log distribution summary
        distribution_summary = df_distributed['OwnerId'].value_counts().to_dict()
        self.logger.info("Lead distribution summary:")
        for alias, count in distribution_summary.items():
            if alias:  # Don't show empty values
                self.logger.info(f"  {alias}: {count} leads")

        return df_distributed

    def create_backup(self, file_path: str) -> str:
        """Create a backup of the original file."""
        if not self.config["backup_enabled"]:
            return ""

        backup_dir = Path('data/backup')
        backup_dir.mkdir(parents=True, exist_ok=True)

        file_name = Path(file_path).name
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"{Path(file_name).stem}_backup_{timestamp}{Path(file_name).suffix}"
        backup_path = backup_dir / backup_name

        try:
            import shutil
            shutil.copy2(file_path, backup_path)
            self.logger.info(f"Backup created: {backup_path}")
            return str(backup_path)
        except Exception as e:
            self.logger.error(f"Failed to create backup: {e}")
            return ""

    def process_file(self, input_file: str, output_file: str = None) -> str:
        """Main method to process a leads file."""
        self.logger.info(f"Starting processing of file: {input_file}")

        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Input file not found: {input_file}")

        # Create backup
        backup_path = self.create_backup(input_file)

        # Detect file format
        file_format, separator = self.detect_file_format(input_file)

        # Read the file based on file type
        file_extension = Path(input_file).suffix.lower()

        if file_extension in ['.xlsx', '.xls']:
            # Read Excel file
            try:
                df = pd.read_excel(input_file)
                self.logger.info(f"Successfully read Excel file with {len(df)} records")
            except Exception as e:
                self.logger.error(f"Failed to read Excel file: {e}")
                raise
        else:
            # Read CSV file
            try:
                df = pd.read_csv(input_file, sep=separator, encoding='utf-8')
                self.logger.info(f"Successfully read CSV file with {len(df)} records")
            except UnicodeDecodeError:
                # Try with different encoding
                df = pd.read_csv(input_file, sep=separator, encoding='latin-1')
                self.logger.info(f"Read CSV file with latin-1 encoding, {len(df)} records")
            except Exception as e:
                self.logger.error(f"Failed to read CSV file: {e}")
                raise

        # Process based on format
        if file_format == 'raw':
            df = self.standardize_raw_format(df)
        elif file_format == 'pernambuco':
            # Already in standard format, just ensure all columns exist
            for col in self.standard_columns:
                if col not in df.columns:
                    if col == 'maisdeMilhao__c':
                        df[col] = self.config["default_values"]["maisdeMilhao__c"]
                    elif col == 'Tipo':
                        df[col] = self.config["default_values"]["tipo"]
                    else:
                        df[col] = ''
            df = df[self.standard_columns]

        # Clean and format data
        df = self.clean_and_format_data(df)

        # Distribute leads
        df = self.distribute_leads(df)

        # Generate output file name if not provided
        if output_file is None:
            input_path = Path(input_file)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"data/output/{input_path.stem}_processed_{timestamp}.csv"

        # Ensure output directory exists
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)

        # Save processed file
        df.to_csv(output_file, index=False, encoding=self.config["output_encoding"])
        self.logger.info(f"Processed file saved to: {output_file}")

        # Generate summary
        self.generate_summary(df, input_file, output_file, backup_path)

        return output_file

    def generate_summary(self, df: pd.DataFrame, input_file: str, output_file: str, backup_path: str):
        """Generate a processing summary."""
        summary = {
            "processing_date": datetime.now().isoformat(),
            "input_file": input_file,
            "output_file": output_file,
            "backup_file": backup_path,
            "total_records": len(df),
            "lead_distribution": df['OwnerId'].value_counts().to_dict(),
            "columns": list(df.columns)
        }

        # Save summary to JSON
        summary_file = f"{Path(output_file).stem}_summary.json"
        summary_path = Path(output_file).parent / summary_file

        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)

        self.logger.info(f"Processing summary saved to: {summary_path}")

        # Print summary to console
        try:
            print("\n" + "="*50)
            print("PROCESSING SUMMARY")
            print("="*50)
            print(f"Input file: {input_file}")
            print(f"Output file: {output_file}")
            print(f"Backup file: {backup_path}")
            print(f"Total records processed: {len(df)}")
            print("\nLead Distribution:")
            for alias, count in summary["lead_distribution"].items():
                if alias:
                    print(f"  {alias}: {count} leads")
            print("="*50)
        except UnicodeEncodeError:
            # Fallback for systems with encoding issues
            self.logger.info("Processing summary completed - check log files for details")

def main():
    """Main CLI interface."""
    import argparse

    parser = argparse.ArgumentParser(description='Master Leads Processing Script')
    parser.add_argument('input_file', help='Input CSV file to process')
    parser.add_argument('-o', '--output', help='Output file path (optional)')
    parser.add_argument('-c', '--config', help='Configuration file path (optional)')
    parser.add_argument('--organize', action='store_true', help='Organize workspace first')

    args = parser.parse_args()

    try:
        # Initialize processor
        processor = LeadsProcessor(config_file=args.config)

        # Process the file
        output_file = processor.process_file(args.input_file, args.output)

        try:
            print(f"\nProcessing completed successfully!")
            print(f"Output file: {output_file}")
        except UnicodeEncodeError:
            print(f"\nProcessing completed successfully!")
            print(f"Output file: {output_file}")

    except Exception as e:
        try:
            print(f"\nError during processing: {e}")
        except UnicodeEncodeError:
            print(f"\nError during processing: {e}")
        sys.exit(1)

# Wrapper function for backend API integration
def process_leads_traditional(input_file: str, output_file: str = None, config_file: str = None) -> str:
    """
    Wrapper function for traditional leads processing.

    Args:
        input_file: Path to input file
        output_file: Optional output file path
        config_file: Optional configuration file path

    Returns:
        Path to processed output file
    """
    processor = LeadsProcessor(config_file=config_file)
    return processor.process_file(input_file, output_file)

if __name__ == "__main__":
    main()
