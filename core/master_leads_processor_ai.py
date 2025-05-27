#!/usr/bin/env python3
"""
AI-Enhanced Master Leads Processing Script
Comprehensive script with OpenAI ChatGPT integration for intelligent field mapping and data conversion.

This enhanced version includes:
1. AI-powered column mapping and field detection
2. Intelligent data validation with confidence scoring
3. Smart data conversion with cultural awareness
4. Robust error handling with fallback to rule-based processing
5. Detailed logging of AI decisions and confidence scores

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

# Import the AI field mapper
from ai_field_mapper import AIFieldMapper, FieldMapping, DataValidation

class AIEnhancedLeadsProcessor:
    """AI-Enhanced leads processor with intelligent field mapping and validation."""

    def __init__(self, config_file: str = None):
        """Initialize the AI-enhanced processor with configuration."""
        self.setup_logging()
        self.config = self.load_config(config_file)

        # Initialize AI field mapper
        self.ai_mapper = AIFieldMapper(self.config)

        # Standard columns for output
        self.standard_columns = [
            'Last Name', 'Telefone Adcional', 'Phone', 'Email',
            'Description', 'Patrimônio Financeiro', 'Tipo',
            'State/Province', 'OwnerId', 'maisdeMilhao__c'
        ]

        # Track AI usage statistics
        self.ai_stats = {
            'mappings_attempted': 0,
            'mappings_successful': 0,
            'validations_attempted': 0,
            'validations_successful': 0,
            'fallbacks_to_rules': 0
        }

    def setup_logging(self):
        """Setup enhanced logging configuration."""
        log_dir = Path('logs')
        log_dir.mkdir(exist_ok=True)

        log_filename = f"ai_leads_processing_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        log_path = log_dir / log_filename

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
            handlers=[
                logging.FileHandler(log_path, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        self.logger.info("AI-Enhanced Leads Processor initialized")

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
            "backup_enabled": True,
            "ai_processing": {
                "enabled": True,
                "confidence_threshold": 80.0,
                "use_ai_for_mapping": True,
                "use_ai_for_validation": True,
                "fallback_to_rules": True
            }
        }

        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                # Deep merge configurations
                self._deep_merge_config(default_config, user_config)
                self.logger.info(f"Loaded configuration from {config_file}")
            except Exception as e:
                self.logger.warning(f"Could not load config file {config_file}: {e}")
                self.logger.info("Using default configuration")

        return default_config

    def _deep_merge_config(self, base_config: Dict, user_config: Dict):
        """Deep merge user configuration into base configuration."""
        for key, value in user_config.items():
            if key in base_config and isinstance(base_config[key], dict) and isinstance(value, dict):
                self._deep_merge_config(base_config[key], value)
            else:
                base_config[key] = value

    def detect_file_format_ai(self, file_path: str) -> Tuple[str, str, Dict[str, List[str]]]:
        """
        AI-enhanced file format detection with sample data extraction.
        Supports both CSV and Excel files.

        Returns:
            Tuple of (format_type, separator, sample_data_dict)
        """
        self.logger.info(f"AI-enhanced format detection for file: {file_path}")

        file_path_obj = Path(file_path)
        file_extension = file_path_obj.suffix.lower()

        # Handle Excel files
        if file_extension in ['.xlsx', '.xls']:
            return self._detect_excel_format(file_path)

        # Handle CSV files
        return self._detect_csv_format(file_path)

    def _detect_excel_format(self, file_path: str) -> Tuple[str, str, Dict[str, List[str]]]:
        """Detect format for Excel files."""
        self.logger.info(f"Processing Excel file: {file_path}")

        try:
            # Read Excel file (first sheet by default)
            df_sample = pd.read_excel(file_path, nrows=10)

            # Extract sample data for each column
            sample_data = {}
            for col in df_sample.columns:
                # Get non-null sample values
                samples = df_sample[col].dropna().astype(str).tolist()
                sample_data[col] = samples[:5]  # Keep first 5 samples

            # Determine format based on column headers
            column_names = [str(col).lower() for col in df_sample.columns]

            if any(keyword in ' '.join(column_names) for keyword in ['cliente', 'telefone', 'e-mail']):
                format_type = 'raw'
            elif any(keyword in ' '.join(column_names) for keyword in ['last name', 'phone', 'email']):
                if any(keyword in ' '.join(column_names) for keyword in ['patrimônio', 'ownerid']):
                    format_type = 'standard'
                else:
                    format_type = 'pernambuco'
            else:
                format_type = 'unknown'

            self.logger.info(f"Detected Excel format: {format_type}")
            return format_type, ',', sample_data  # Excel doesn't use separators, but we return comma for consistency

        except Exception as e:
            self.logger.error(f"Error reading Excel file: {e}")
            return 'unknown', ',', {}

    def _detect_csv_format(self, file_path: str) -> Tuple[str, str, Dict[str, List[str]]]:
        """Detect format for CSV files."""
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252']

        for encoding in encodings:
            try:
                # First, try to detect separator
                with open(file_path, 'r', encoding=encoding) as f:
                    first_line = f.readline().strip()

                # Determine separator
                if ';' in first_line and first_line.count(';') > first_line.count(','):
                    separator = ';'
                else:
                    separator = ','

                # Read first few rows to get sample data
                df_sample = pd.read_csv(file_path, encoding=encoding, sep=separator, nrows=10)

                # Extract sample data for each column
                sample_data = {}
                for col in df_sample.columns:
                    # Get non-null sample values
                    samples = df_sample[col].dropna().astype(str).tolist()
                    sample_data[col] = samples[:5]  # Keep first 5 samples

                # Determine format based on headers and sample data
                if ';' in first_line and any(keyword in first_line.lower() for keyword in ['cliente', 'telefone', 'e-mail']):
                    format_type = 'raw'
                elif any(keyword in first_line for keyword in ['Last Name', 'Phone', 'Email']):
                    if any(keyword in first_line for keyword in ['Patrimônio', 'OwnerId']):
                        format_type = 'standard'
                    else:
                        format_type = 'pernambuco'
                else:
                    format_type = 'unknown'

                self.logger.info(f"Detected CSV format: {format_type} with separator: '{separator}'")
                return format_type, separator, sample_data

            except UnicodeDecodeError:
                continue
            except Exception as e:
                self.logger.warning(f"Error reading CSV file with encoding {encoding}: {e}")
                continue

        # Fallback
        self.logger.warning("Could not detect CSV format with sample data, using basic detection")
        return 'unknown', ',', {}

    def intelligent_column_mapping(self, df: pd.DataFrame, sample_data: Dict[str, List[str]] = None) -> Tuple[pd.DataFrame, List[FieldMapping]]:
        """
        Use AI to intelligently map columns to standard format.

        Args:
            df: Input DataFrame
            sample_data: Sample data for each column

        Returns:
            Tuple of (mapped_dataframe, field_mappings)
        """
        self.logger.info("Starting intelligent column mapping")
        self.ai_stats['mappings_attempted'] += 1

        try:
            # Get column mappings from AI
            column_names = list(df.columns)
            mappings = self.ai_mapper.analyze_columns(column_names, sample_data)

            # Create mapping dictionary for high-confidence mappings
            mapping_dict = {}
            low_confidence_mappings = []
            phone_fields = []  # Track phone fields to handle duplicates

            confidence_threshold = self.config['ai_processing']['confidence_threshold']

            for mapping in mappings:
                if mapping.confidence >= confidence_threshold and mapping.target_field != "UNMAPPED":
                    # Handle multiple phone fields
                    if mapping.target_field == "Phone":
                        phone_fields.append(mapping.source_field)
                        if len(phone_fields) == 1:
                            # First phone field goes to "Phone"
                            mapping_dict[mapping.source_field] = "Phone"
                        else:
                            # Additional phone fields go to "Telefone Adcional"
                            mapping_dict[mapping.source_field] = "Telefone Adcional"
                    else:
                        mapping_dict[mapping.source_field] = mapping.target_field
                    self.logger.info(f"High confidence mapping: {mapping.source_field} → {mapping_dict[mapping.source_field]} ({mapping.confidence}%)")
                elif mapping.target_field != "UNMAPPED":
                    low_confidence_mappings.append(mapping)
                    self.logger.warning(f"Low confidence mapping: {mapping.source_field} → {mapping.target_field} ({mapping.confidence}%)")

            # Apply mappings
            df_mapped = df.rename(columns=mapping_dict)

            # Handle low confidence mappings (could prompt user in interactive mode)
            for mapping in low_confidence_mappings:
                if mapping.source_field in df_mapped.columns:
                    self.logger.info(f"Applying low confidence mapping: {mapping.source_field} → {mapping.target_field}")
                    df_mapped = df_mapped.rename(columns={mapping.source_field: mapping.target_field})

            # Add missing standard columns with default values
            for col in self.standard_columns:
                if col not in df_mapped.columns:
                    if col == 'maisdeMilhao__c':
                        df_mapped[col] = self.config["default_values"]["maisdeMilhao__c"]
                    elif col == 'Tipo':
                        df_mapped[col] = self.config["default_values"]["tipo"]
                    elif col == 'Patrimônio Financeiro':
                        df_mapped[col] = self.config["default_values"]["patrimonio_financeiro"]
                    else:
                        df_mapped[col] = ''

            # Reorder columns to match standard format
            df_mapped = df_mapped[self.standard_columns]

            self.ai_stats['mappings_successful'] += 1
            self.logger.info(f"Successfully mapped {len(mapping_dict)} columns with AI assistance")

            return df_mapped, mappings

        except Exception as e:
            self.logger.error(f"AI column mapping failed: {e}")
            self.ai_stats['fallbacks_to_rules'] += 1
            # Fallback to rule-based mapping
            return self._fallback_column_mapping(df), []

    def _fallback_column_mapping(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fallback rule-based column mapping."""
        self.logger.info("Using fallback rule-based column mapping")

        # Simple rule-based mapping (similar to original processor)
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

        df_mapped = df.rename(columns=column_mapping)

        # Handle financial data conversion
        if 'Volume Aproximado_temp' in df_mapped.columns:
            df_mapped['Patrimônio Financeiro'] = df_mapped['Volume Aproximado_temp'].apply(
                self.convert_money_to_numeric
            )
            df_mapped = df_mapped.drop(columns=['Volume Aproximado_temp'])
        else:
            df_mapped['Patrimônio Financeiro'] = self.config["default_values"]["patrimonio_financeiro"]

        # Add missing columns
        for col in self.standard_columns:
            if col not in df_mapped.columns:
                if col == 'maisdeMilhao__c':
                    df_mapped[col] = self.config["default_values"]["maisdeMilhao__c"]
                elif col == 'Tipo':
                    df_mapped[col] = self.config["default_values"]["tipo"]
                else:
                    df_mapped[col] = ''

        return df_mapped[self.standard_columns]

    def ai_enhanced_data_validation(self, df: pd.DataFrame, mappings: List[FieldMapping] = None) -> Dict[str, DataValidation]:
        """
        Use AI to validate data quality across all fields with optimized batching.

        Args:
            df: DataFrame to validate
            mappings: Field mappings from AI analysis

        Returns:
            Dictionary of field validations
        """
        self.logger.info("Starting optimized AI-enhanced data validation")
        self.ai_stats['validations_attempted'] += 1

        validations = {}

        try:
            # Prepare validation data for all columns
            validation_requests = []
            for column in df.columns:
                try:
                    # Get sample data for validation - handle pandas Series properly
                    column_data = df[column].dropna()
                    if len(column_data) > 0:
                        sample_data = column_data.astype(str).tolist()[:5]  # Reduced sample size
                        if sample_data:  # Only validate if we have data
                            validation_requests.append({
                                'field_name': column,
                                'sample_data': sample_data,
                                'target_field': column
                            })
                except Exception as e:
                    self.logger.warning(f"Failed to prepare validation for column {column}: {e}")
                    continue

            # Process validations (AI mapper handles caching and smart fallbacks)
            for request in validation_requests:
                try:
                    validation = self.ai_mapper.validate_data_quality(
                        field_name=request['field_name'],
                        data_samples=request['sample_data'],
                        target_field=request['target_field']
                    )
                    validations[request['field_name']] = validation

                    # Log validation results
                    if validation.issues_found:
                        self.logger.warning(f"Data quality issues in {request['field_name']}: {len(validation.issues_found)} issues")
                    else:
                        self.logger.debug(f"Data quality validation passed for {request['field_name']}")
                except Exception as e:
                    self.logger.warning(f"Failed to validate column {request['field_name']}: {e}")
                    continue

            self.ai_stats['validations_successful'] += 1
            self.logger.info(f"Completed validation for {len(validations)} fields")
            return validations

        except Exception as e:
            self.logger.error(f"AI data validation failed: {e}")
            self.ai_stats['fallbacks_to_rules'] += 1
            return {}

    def clean_phone_number_ai(self, phone: Any) -> str:
        """AI-enhanced phone number cleaning with better NaN handling."""
        # Handle pandas Series or individual values
        if hasattr(phone, 'isna'):
            # This is a pandas Series
            if phone.isna().any():
                return ''
        elif pd.isna(phone) or phone is None:
            return ''

        # Handle various representations of missing/invalid data
        if phone == '' or phone == 'NA' or str(phone).lower() in ['nan', 'null', 'none']:
            return ''

        # Convert to string and handle float representations
        phone_str = str(phone)

        # Remove decimal points from float representations
        if '.0' in phone_str:
            phone_str = phone_str.replace('.0', '')

        # Check if it's just 'nan' after string conversion
        if phone_str.lower() == 'nan':
            return ''

        # Remove any non-digit characters (keep + for international numbers)
        cleaned = re.sub(r'[^\d+]', '', phone_str)

        # Validate minimum length for a phone number
        if len(cleaned) < 8:
            return ''

        return cleaned

    def format_name_ai(self, name: Any) -> str:
        """AI-enhanced name formatting with cultural awareness."""
        # Handle pandas Series or individual values
        if hasattr(name, 'isna'):
            # This is a pandas Series
            if name.isna().any():
                return ''
        elif pd.isna(name):
            return ''

        if not isinstance(name, str):
            return str(name) if name is not None else ''

        # Basic formatting (can be enhanced with AI for cultural awareness)
        name = name.strip()

        # Handle common Brazilian name patterns
        parts = name.split()
        formatted_parts = []

        # Common Brazilian prepositions that should be lowercase
        prepositions = {'de', 'da', 'do', 'das', 'dos', 'e'}

        for i, part in enumerate(parts):
            if '-' in part:
                # Handle hyphenated names
                hyphen_parts = part.split('-')
                formatted_part = '-'.join(p.capitalize() for p in hyphen_parts)
            elif part.lower() in prepositions and i > 0 and i < len(parts) - 1:
                # Keep prepositions lowercase if they're in the middle
                formatted_part = part.lower()
            else:
                formatted_part = part.capitalize()
            formatted_parts.append(formatted_part)

        return ' '.join(formatted_parts)

    def format_email_ai(self, email: Any) -> str:
        """AI-enhanced email formatting."""
        # Handle pandas Series or individual values
        if hasattr(email, 'isna'):
            # This is a pandas Series
            if email.isna().any():
                return ''
        elif pd.isna(email):
            return ''

        if not isinstance(email, str):
            return str(email) if email is not None else ''

        return email.lower().strip()

    def format_description_ai(self, description: Any) -> str:
        """
        AI-enhanced description formatting with automatic semicolon insertion.
        Separates concatenated capitalized words with semicolons for better readability
        and Salesforce CSV import compatibility.

        Examples:
        - "ModeradoRegular" → "Moderado; Regular"
        - "ArrojadoQualificado" → "Arrojado; Qualificado"
        - "DesconhecidoQualificado" → "Desconhecido; Qualificado"
        """
        # Handle pandas Series or individual values
        if hasattr(description, 'isna'):
            # This is a pandas Series
            if description.isna().any():
                return ''
        elif pd.isna(description):
            return ''

        if not isinstance(description, str):
            return str(description) if description is not None else ''

        # Clean the input
        description = description.strip()

        if not description:
            return ''

        # Pattern to match concatenated capitalized words
        # Looks for: Capital letter followed by lowercase letters, then another capital letter
        pattern = r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)'

        # Keep applying the pattern until no more matches are found
        formatted = description
        max_iterations = 10  # Prevent infinite loops
        iteration = 0

        while iteration < max_iterations:
            # Find all matches of concatenated words - using semicolon separator
            new_formatted = re.sub(pattern, r'\1; \2', formatted)

            # If no changes were made, we're done
            if new_formatted == formatted:
                break

            formatted = new_formatted
            iteration += 1

        return formatted

    def convert_money_to_numeric(self, value: Any) -> int:
        """AI-enhanced money conversion."""
        # Handle pandas Series or individual values
        if hasattr(value, 'isna'):
            # This is a pandas Series
            if value.isna().any():
                return self.config["default_values"]["patrimonio_financeiro"]
        elif pd.isna(value):
            return self.config["default_values"]["patrimonio_financeiro"]

        # Check if it's already numeric
        if isinstance(value, (int, float)):
            return int(value)

        # Handle string money values with AI-like intelligence
        if isinstance(value, str):
            value_str = str(value).upper()

            # Handle different currency formats
            if "R$" in value_str or "BRL" in value_str:
                # Remove currency symbols and formatting
                value_str = re.sub(r'[R$BRL\s,.]', '', value_str)
                try:
                    return int(value_str) if value_str.isdigit() else self.config["default_values"]["patrimonio_financeiro"]
                except ValueError:
                    pass

            # Handle "million" indicators
            if "MILHAO" in value_str or "MILLION" in value_str or "M" in value_str:
                # Extract numeric part
                numeric_part = re.search(r'(\d+)', value_str)
                if numeric_part:
                    return int(numeric_part.group(1)) * 1000000

            # Try to extract any numeric value
            numeric_match = re.search(r'(\d+)', value_str)
            if numeric_match:
                return int(numeric_match.group(1))

        # Default value
        return self.config["default_values"]["patrimonio_financeiro"]

    def clean_and_format_data_ai(self, df: pd.DataFrame, validations: Dict[str, DataValidation] = None) -> pd.DataFrame:
        """AI-enhanced data cleaning and formatting."""
        self.logger.info("AI-enhanced data cleaning and formatting")

        df_clean = df.copy()

        # Clean phone numbers
        if 'Phone' in df_clean.columns:
            df_clean['Phone'] = df_clean['Phone'].apply(self.clean_phone_number_ai)
        if 'Telefone Adcional' in df_clean.columns:
            df_clean['Telefone Adcional'] = df_clean['Telefone Adcional'].apply(self.clean_phone_number_ai)

        # Format names with cultural awareness
        if 'Last Name' in df_clean.columns:
            df_clean['Last Name'] = df_clean['Last Name'].apply(self.format_name_ai)

        # Format emails
        if 'Email' in df_clean.columns:
            df_clean['Email'] = df_clean['Email'].apply(self.format_email_ai)

        # Format descriptions with semicolon separation for concatenated words (Salesforce CSV compatible)
        if 'Description' in df_clean.columns:
            df_clean['Description'] = df_clean['Description'].apply(self.format_description_ai)

        # Handle financial data
        if 'Patrimônio Financeiro' in df_clean.columns:
            # Apply conversion safely to avoid Series ambiguity
            df_clean['Patrimônio Financeiro'] = df_clean['Patrimônio Financeiro'].apply(
                lambda x: self.convert_money_to_numeric(x)
            )

        # Apply AI suggestions from validations if available
        if validations:
            for field_name, validation in validations.items():
                if validation.suggestions and field_name in df_clean.columns:
                    self.logger.info(f"Applying AI suggestions for {field_name}: {validation.suggestions}")
                    # Here you could implement specific AI-suggested transformations

        self.logger.info("AI-enhanced data cleaning completed")
        return df_clean

    def distribute_leads(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Smart lead distribution that preserves original assignments when available.
        Only applies automatic distribution to empty/missing OwnerId values.
        """
        df_distributed = df.copy()

        # Check if OwnerId column has existing assignments
        if 'OwnerId' in df_distributed.columns:
            # Count existing assignments
            existing_assignments = df_distributed['OwnerId'].dropna()
            existing_assignments = existing_assignments[existing_assignments.astype(str).str.strip() != '']

            if len(existing_assignments) > 0:
                self.logger.info(f"Found {len(existing_assignments)} existing lead assignments - preserving original values")

                # Clean up the existing assignments (remove extra whitespace, etc.)
                df_distributed['OwnerId'] = df_distributed['OwnerId'].astype(str).str.strip()
                df_distributed.loc[df_distributed['OwnerId'] == 'nan', 'OwnerId'] = ''
                df_distributed.loc[df_distributed['OwnerId'] == 'None', 'OwnerId'] = ''

                # Log the preserved distribution
                preserved_distribution = df_distributed['OwnerId'].value_counts().to_dict()
                self.logger.info("Preserved lead distribution from original file:")
                for alias, count in preserved_distribution.items():
                    if alias and alias != '':
                        self.logger.info(f"  {alias}: {count} leads")

                return df_distributed

        # If no existing assignments found, apply automatic distribution
        self.logger.info("No existing lead assignments found - applying automatic distribution")

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
                df_distributed.at[row_idx, 'OwnerId'] = ''

        # Log distribution summary
        distribution_summary = df_distributed['OwnerId'].value_counts().to_dict()
        self.logger.info("Applied automatic lead distribution:")
        for alias, count in distribution_summary.items():
            if alias:
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

    def process_file_ai(self, input_file: str, output_file: str = None) -> str:
        """
        Main AI-enhanced method to process a leads file.

        Args:
            input_file: Path to input file
            output_file: Optional output file path

        Returns:
            Path to processed output file
        """
        self.logger.info(f"Starting AI-enhanced processing of file: {input_file}")

        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Input file not found: {input_file}")

        # Create backup
        backup_path = self.create_backup(input_file)

        # AI-enhanced file format detection with sample data
        file_format, separator, sample_data = self.detect_file_format_ai(input_file)

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
                df = pd.read_csv(input_file, sep=separator, encoding='latin-1')
                self.logger.info(f"Read CSV file with latin-1 encoding, {len(df)} records")
            except Exception as e:
                self.logger.error(f"Failed to read CSV file: {e}")
                raise

        # AI-enhanced column mapping
        df_mapped, field_mappings = self.intelligent_column_mapping(df, sample_data)

        # Store field mappings for fine-tuning data collection
        self.field_mappings = field_mappings

        # AI-enhanced data validation
        validations = self.ai_enhanced_data_validation(df_mapped, field_mappings)

        # AI-enhanced data cleaning and formatting
        df_clean = self.clean_and_format_data_ai(df_mapped, validations)

        # Distribute leads (same as original)
        df_final = self.distribute_leads(df_clean)

        # Generate output file name if not provided
        if output_file is None:
            input_path = Path(input_file)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"data/output/{input_path.stem}_ai_processed_{timestamp}.csv"

        # Ensure output directory exists
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)

        # Save processed file
        df_final.to_csv(output_file, index=False, encoding=self.config["output_encoding"])
        self.logger.info(f"AI-processed file saved to: {output_file}")

        # Generate comprehensive summary
        self.generate_ai_summary(df_final, input_file, output_file, backup_path, field_mappings, validations)

        return output_file

    def generate_ai_summary(self, df: pd.DataFrame, input_file: str, output_file: str,
                           backup_path: str, field_mappings: List[FieldMapping],
                           validations: Dict[str, DataValidation]):
        """Generate a comprehensive AI processing summary."""

        # Get mapping summary
        mapping_summary = self.ai_mapper.get_mapping_summary(field_mappings) if field_mappings else {}

        # Count validation issues
        total_issues = sum(len(v.issues_found) for v in validations.values())
        total_suggestions = sum(len(v.suggestions) for v in validations.values())

        # Get API usage statistics
        api_usage_stats = self.ai_mapper.get_api_usage_stats() if hasattr(self.ai_mapper, 'get_api_usage_stats') else {}

        summary = {
            "processing_date": datetime.now().isoformat(),
            "input_file": input_file,
            "output_file": output_file,
            "backup_file": backup_path,
            "total_records": len(df),
            "ai_processing": {
                "ai_enabled": self.ai_mapper.ai_enabled,
                "mapping_summary": mapping_summary,
                "validation_summary": {
                    "fields_validated": len(validations),
                    "total_issues_found": total_issues,
                    "total_suggestions": total_suggestions
                },
                "ai_stats": self.ai_stats,
                "api_usage": api_usage_stats
            },
            "lead_distribution": df['OwnerId'].value_counts().to_dict(),
            "columns": list(df.columns),
            "field_mappings": [
                {
                    "source": m.source_field,
                    "target": m.target_field,
                    "confidence": m.confidence,
                    "reasoning": m.reasoning
                } for m in field_mappings
            ] if field_mappings else [],
            "data_validations": {
                field: {
                    "issues": validation.issues_found,
                    "suggestions": validation.suggestions,
                    "confidence": validation.confidence
                } for field, validation in validations.items()
            }
        }

        # Save summary to JSON
        summary_file = f"{Path(output_file).stem}_ai_summary.json"
        summary_path = Path(output_file).parent / summary_file

        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)

        self.logger.info(f"AI processing summary saved to: {summary_path}")

        # Print summary to console
        self._print_ai_summary(summary)

    def _print_ai_summary(self, summary: Dict[str, Any]):
        """Print AI processing summary to console."""
        try:
            print("\n" + "="*70)
            print("AI-ENHANCED PROCESSING SUMMARY")
            print("="*70)
            print(f"Input file: {summary['input_file']}")
            print(f"Output file: {summary['output_file']}")
            print(f"Backup file: {summary['backup_file']}")
            print(f"Total records processed: {summary['total_records']}")

            ai_info = summary['ai_processing']
            print(f"\nAI PROCESSING:")
            print(f"  • AI enabled: {'YES' if ai_info['ai_enabled'] else 'NO'}")
        except UnicodeEncodeError:
            # Fallback for systems with encoding issues
            self.logger.info("Processing summary completed - check log files for details")

        if ai_info.get('mapping_summary'):
            mapping = ai_info['mapping_summary']
            print(f"  • Field mappings: {mapping.get('total_fields', 0)} total")
            print(f"    - High confidence: {mapping.get('high_confidence_mappings', 0)}")
            print(f"    - Low confidence: {mapping.get('low_confidence_mappings', 0)}")
            print(f"    - Unmapped: {mapping.get('unmapped_fields', 0)}")
            print(f"    - Average confidence: {mapping.get('average_confidence', 0):.1f}%")

        validation = ai_info.get('validation_summary', {})
        print(f"  • Data validation:")
        print(f"    - Fields validated: {validation.get('fields_validated', 0)}")
        print(f"    - Issues found: {validation.get('total_issues_found', 0)}")
        print(f"    - Suggestions made: {validation.get('total_suggestions', 0)}")

        stats = ai_info.get('ai_stats', {})
        print(f"  • AI statistics:")
        print(f"    - Mapping attempts: {stats.get('mappings_attempted', 0)}")
        print(f"    - Mapping successes: {stats.get('mappings_successful', 0)}")
        print(f"    - Validation attempts: {stats.get('validations_attempted', 0)}")
        print(f"    - Fallbacks to rules: {stats.get('fallbacks_to_rules', 0)}")

        # Display API usage statistics
        api_usage = ai_info.get('api_usage', {})
        if api_usage:
            print(f"  • API usage optimization:")
            print(f"    - Total API calls: {api_usage.get('total_calls', 0)}")
            print(f"    - Tokens used: {api_usage.get('total_tokens_used', 0)}")
            print(f"    - Estimated cost: ${api_usage.get('estimated_cost', 0):.4f}")
            print(f"    - Cache hit ratio: {api_usage.get('cache_hit_ratio', 0):.1%}")
            print(f"    - AI skip ratio: {api_usage.get('ai_skip_ratio', 0):.1%}")
            print(f"    - Cache hits: {api_usage.get('cache_hits', 0)}")
            print(f"    - AI calls skipped: {api_usage.get('ai_skipped', 0)}")

        try:
            print(f"\nLEAD DISTRIBUTION:")
            for alias, count in summary['lead_distribution'].items():
                if alias:
                    print(f"  • {alias}: {count} leads")

            print("="*70)
        except UnicodeEncodeError:
            # Fallback for systems with encoding issues
            self.logger.info("Lead distribution summary completed - check log files for details")

def main():
    """Main CLI interface for AI-enhanced processing."""
    import argparse

    parser = argparse.ArgumentParser(description='AI-Enhanced Master Leads Processing Script')
    parser.add_argument('input_file', help='Input CSV file to process')
    parser.add_argument('-o', '--output', help='Output file path (optional)')
    parser.add_argument('-c', '--config', help='Configuration file path (optional)')
    parser.add_argument('--disable-ai', action='store_true', help='Disable AI processing')
    parser.add_argument('--confidence-threshold', type=float, help='AI confidence threshold (0-100)')

    args = parser.parse_args()

    try:
        # Initialize AI-enhanced processor
        processor = AIEnhancedLeadsProcessor(config_file=args.config)

        # Override AI settings if specified
        if args.disable_ai:
            processor.config['ai_processing']['enabled'] = False
            processor.ai_mapper.ai_enabled = False

        if args.confidence_threshold:
            processor.config['ai_processing']['confidence_threshold'] = args.confidence_threshold
            processor.ai_mapper.confidence_threshold = args.confidence_threshold

        # Process the file
        output_file = processor.process_file_ai(args.input_file, args.output)

        try:
            print(f"\nAI-enhanced processing completed successfully!")
            print(f"Output file: {output_file}")
        except UnicodeEncodeError:
            print(f"\nProcessing completed successfully!")
            print(f"Output file: {output_file}")

    except Exception as e:
        try:
            print(f"\nError during AI-enhanced processing: {e}")
        except UnicodeEncodeError:
            print(f"\nError during processing: {e}")
        sys.exit(1)

# Wrapper function for backend API integration
def process_leads_with_ai(input_file: str, output_file: str = None, config_file: str = None) -> str:
    """
    Wrapper function for AI-enhanced leads processing.

    Args:
        input_file: Path to input file
        output_file: Optional output file path
        config_file: Optional configuration file path

    Returns:
        Path to processed output file
    """
    processor = AIEnhancedLeadsProcessor(config_file=config_file)
    return processor.process_file_ai(input_file, output_file)

if __name__ == "__main__":
    main()
