#!/usr/bin/env python3
"""
AI-Powered Field Mapping Module
Uses OpenAI's ChatGPT API for intelligent column mapping and data validation.

This module provides AI-enhanced capabilities for:
- Automatic field detection and mapping
- Data quality validation
- Confidence scoring for mappings
- Smart data conversion suggestions
"""

import os
import json
import logging
import re
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from dotenv import load_dotenv

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logging.warning("OpenAI package not installed. AI features will be disabled.")

@dataclass
class FieldMapping:
    """Represents a field mapping with confidence score."""
    source_field: str
    target_field: str
    confidence: float
    reasoning: str
    suggested_transformation: Optional[str] = None

@dataclass
class DataValidation:
    """Represents AI validation results for data quality."""
    field_name: str
    issues_found: List[str]
    suggestions: List[str]
    confidence: float
    sample_data: List[str]

class AIFieldMapper:
    """AI-powered field mapping and data validation system."""

    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the AI field mapper."""
        self.logger = logging.getLogger(__name__)
        self.config = config or {}
        self.ai_enabled = self.config.get('ai_processing', {}).get('enabled', False)
        self.confidence_threshold = self.config.get('ai_processing', {}).get('confidence_threshold', 80.0)

        # Load environment variables
        load_dotenv()

        # Initialize OpenAI client
        self.openai_client = None
        if OPENAI_AVAILABLE and self.ai_enabled:
            self._initialize_openai()

        # Standard target fields for lead processing
        self.target_fields = [
            'Last Name', 'Telefone Adcional', 'Phone', 'Email',
            'Description', 'Patrimônio Financeiro', 'Tipo',
            'State/Province', 'OwnerId', 'maisdeMilhao__c'
        ]

    def _initialize_openai(self):
        """Initialize OpenAI client with API key from environment."""
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            self.logger.error("OPENAI_API_KEY not found in environment variables")
            self.ai_enabled = False
            return

        try:
            openai.api_key = api_key
            self.openai_client = openai
            self.logger.info("OpenAI client initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize OpenAI client: {e}")
            self.ai_enabled = False

    def analyze_columns(self, column_names: List[str], sample_data: Dict[str, List[str]] = None) -> List[FieldMapping]:
        """
        Analyze column names and suggest mappings to target fields.

        Args:
            column_names: List of source column names
            sample_data: Optional sample data for each column

        Returns:
            List of FieldMapping objects with confidence scores
        """
        if not self.ai_enabled or not self.openai_client:
            self.logger.info("AI processing disabled, using rule-based mapping")
            return self._rule_based_mapping(column_names)

        try:
            return self._ai_powered_mapping(column_names, sample_data)
        except Exception as e:
            self.logger.error(f"AI mapping failed, falling back to rule-based: {e}")
            return self._rule_based_mapping(column_names)

    def _ai_powered_mapping(self, column_names: List[str], sample_data: Dict[str, List[str]] = None) -> List[FieldMapping]:
        """Use AI to analyze and map column names."""
        self.logger.info("Using AI-powered column mapping")

        # Prepare the prompt for ChatGPT
        prompt = self._create_mapping_prompt(column_names, sample_data)

        try:
            response = self.openai_client.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert data analyst specializing in lead data processing and field mapping."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )

            # Parse the AI response
            ai_response = response.choices[0].message.content
            return self._parse_ai_mapping_response(ai_response, column_names)

        except Exception as e:
            self.logger.error(f"OpenAI API call failed: {e}")
            raise

    def _create_mapping_prompt(self, column_names: List[str], sample_data: Dict[str, List[str]] = None) -> str:
        """Create a detailed prompt for AI field mapping."""
        prompt = f"""
Analyze the following column names from a lead/customer data file and map them to the standard target fields.

SOURCE COLUMNS:
{json.dumps(column_names, indent=2)}

TARGET FIELDS (map to these):
{json.dumps(self.target_fields, indent=2)}

"""

        if sample_data:
            prompt += "\nSAMPLE DATA:\n"
            for col, samples in sample_data.items():
                if samples:
                    prompt += f"{col}: {samples[:3]}\n"  # Show first 3 samples

        prompt += """
INSTRUCTIONS:
1. Map each source column to the most appropriate target field
2. Provide a confidence score (0-100%) for each mapping
3. Explain your reasoning for each mapping
4. Suggest any data transformations needed
5. If no good match exists, suggest "UNMAPPED"

RESPONSE FORMAT (JSON):
{
  "mappings": [
    {
      "source_field": "source_column_name",
      "target_field": "target_field_name_or_UNMAPPED",
      "confidence": 95.0,
      "reasoning": "explanation of why this mapping makes sense",
      "suggested_transformation": "optional transformation description"
    }
  ]
}

Consider these mapping patterns:
- Cliente/Customer/Nome/Lead → Last Name
- Telefone/Phone/Tel/Celular → Phone
- E-mail/Email → Email
- Volume/Patrimônio/Financial → Patrimônio Financeiro
- Estado/State/Province → State/Province
- Descrição/Description → Description
- Alias/Owner/Atribuir → OwnerId

Respond with valid JSON only.
"""
        return prompt

    def _parse_ai_mapping_response(self, ai_response: str, column_names: List[str]) -> List[FieldMapping]:
        """Parse the AI response and create FieldMapping objects."""
        try:
            # Extract JSON from the response
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if not json_match:
                raise ValueError("No JSON found in AI response")

            response_data = json.loads(json_match.group())
            mappings = []

            for mapping_data in response_data.get('mappings', []):
                mapping = FieldMapping(
                    source_field=mapping_data['source_field'],
                    target_field=mapping_data['target_field'],
                    confidence=float(mapping_data['confidence']),
                    reasoning=mapping_data['reasoning'],
                    suggested_transformation=mapping_data.get('suggested_transformation')
                )
                mappings.append(mapping)

                # Log the mapping decision
                self.logger.info(f"AI Mapping: {mapping.source_field} → {mapping.target_field} "
                               f"(confidence: {mapping.confidence}%)")

            return mappings

        except Exception as e:
            self.logger.error(f"Failed to parse AI response: {e}")
            raise

    def _rule_based_mapping(self, column_names: List[str]) -> List[FieldMapping]:
        """Fallback rule-based mapping when AI is not available."""
        self.logger.info("Using rule-based column mapping")

        # Define mapping rules
        mapping_rules = {
            # Name fields
            r'cliente|customer|nome|name|last.*name|lead': 'Last Name',
            # Phone fields
            r'telefone|phone|tel|celular|mobile': 'Phone',
            r'telefone.*adicional|additional.*phone|phone.*2': 'Telefone Adcional',
            # Email fields
            r'e-?mail|email': 'Email',
            # Financial fields
            r'volume|patrimonio|patrimônio|financial|valor|value': 'Patrimônio Financeiro',
            # Location fields
            r'estado|state|province|provincia': 'State/Province',
            # Description fields
            r'descri[çc][aã]o|description|obs|observa[çc][aã]o': 'Description',
            # Owner fields
            r'alias|owner|respons[aá]vel|vendedor|atribuir': 'OwnerId',
            # Type fields
            r'tipo|type|categoria|category': 'Tipo'
        }

        mappings = []
        for col_name in column_names:
            best_match = None
            best_confidence = 0.0

            col_lower = col_name.lower()
            for pattern, target_field in mapping_rules.items():
                if re.search(pattern, col_lower):
                    confidence = 85.0  # High confidence for rule-based matches
                    if confidence > best_confidence:
                        best_match = target_field
                        best_confidence = confidence

            if best_match:
                mapping = FieldMapping(
                    source_field=col_name,
                    target_field=best_match,
                    confidence=best_confidence,
                    reasoning=f"Rule-based match using pattern recognition",
                    suggested_transformation=None
                )
            else:
                mapping = FieldMapping(
                    source_field=col_name,
                    target_field="UNMAPPED",
                    confidence=0.0,
                    reasoning="No matching pattern found in rule-based mapping",
                    suggested_transformation=None
                )

            mappings.append(mapping)
            self.logger.info(f"Rule Mapping: {mapping.source_field} → {mapping.target_field} "
                           f"(confidence: {mapping.confidence}%)")

        return mappings

    def validate_data_quality(self, field_name: str, data_samples: List[str], target_field: str = None) -> DataValidation:
        """
        Use AI to validate data quality and suggest improvements.

        Args:
            field_name: Name of the field being validated
            data_samples: Sample data from the field
            target_field: Target field this data will be mapped to

        Returns:
            DataValidation object with issues and suggestions
        """
        if not self.ai_enabled or not self.openai_client:
            return self._rule_based_validation(field_name, data_samples, target_field)

        try:
            return self._ai_powered_validation(field_name, data_samples, target_field)
        except Exception as e:
            self.logger.error(f"AI validation failed, falling back to rule-based: {e}")
            return self._rule_based_validation(field_name, data_samples, target_field)

    def _ai_powered_validation(self, field_name: str, data_samples: List[str], target_field: str = None) -> DataValidation:
        """Use AI to validate data quality."""
        self.logger.info(f"Using AI-powered validation for field: {field_name}")

        prompt = self._create_validation_prompt(field_name, data_samples, target_field)

        try:
            response = self.openai_client.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert data quality analyst specializing in lead/customer data validation."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=1500
            )

            ai_response = response.choices[0].message.content
            return self._parse_validation_response(ai_response, field_name, data_samples)

        except Exception as e:
            self.logger.error(f"OpenAI validation API call failed: {e}")
            raise

    def _create_validation_prompt(self, field_name: str, data_samples: List[str], target_field: str = None) -> str:
        """Create a prompt for AI data validation."""
        prompt = f"""
Analyze the following data samples from field "{field_name}" and identify quality issues.

FIELD NAME: {field_name}
TARGET FIELD: {target_field or "Unknown"}

DATA SAMPLES:
{json.dumps(data_samples[:10], indent=2)}

VALIDATION CRITERIA:
- Check for formatting consistency
- Identify invalid or suspicious entries
- Look for missing or incomplete data
- Validate against expected data types
- Check for common data entry errors

For specific field types:
- Phone numbers: Should be numeric, proper length, valid format
- Emails: Should have valid email format
- Names: Should be properly capitalized, no numbers/symbols
- Financial data: Should be numeric, reasonable ranges
- Addresses/States: Should be valid locations

RESPONSE FORMAT (JSON):
{{
  "issues_found": ["list of specific issues identified"],
  "suggestions": ["list of specific improvement suggestions"],
  "confidence": 85.0,
  "data_quality_score": 75.0
}}

Respond with valid JSON only.
"""
        return prompt

    def _parse_validation_response(self, ai_response: str, field_name: str, data_samples: List[str]) -> DataValidation:
        """Parse AI validation response."""
        try:
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if not json_match:
                raise ValueError("No JSON found in AI validation response")

            response_data = json.loads(json_match.group())

            validation = DataValidation(
                field_name=field_name,
                issues_found=response_data.get('issues_found', []),
                suggestions=response_data.get('suggestions', []),
                confidence=float(response_data.get('confidence', 0.0)),
                sample_data=data_samples[:5]
            )

            self.logger.info(f"AI Validation for {field_name}: {len(validation.issues_found)} issues found")
            return validation

        except Exception as e:
            self.logger.error(f"Failed to parse AI validation response: {e}")
            raise

    def _rule_based_validation(self, field_name: str, data_samples: List[str], target_field: str = None) -> DataValidation:
        """Fallback rule-based validation."""
        self.logger.info(f"Using rule-based validation for field: {field_name}")

        issues = []
        suggestions = []

        if not data_samples:
            issues.append("No data samples provided")
            return DataValidation(field_name, issues, suggestions, 0.0, [])

        # Remove empty/null values for analysis - handle pandas Series safely
        valid_samples = []
        for s in data_samples:
            try:
                # Convert to string safely
                s_str = str(s) if s is not None else ''
                # Check if it's a valid non-empty value
                if s is not None and s_str.strip() and s_str.lower() not in ['nan', 'null', 'none', 'nat']:
                    valid_samples.append(s)
            except (ValueError, TypeError):
                # Skip problematic values
                continue

        if len(valid_samples) < len(data_samples) * 0.5:
            issues.append(f"High percentage of empty values: {len(data_samples) - len(valid_samples)}/{len(data_samples)}")
            suggestions.append("Consider data cleaning to handle missing values")

        # Field-specific validation
        if target_field == 'Phone' or 'phone' in field_name.lower() or 'telefone' in field_name.lower():
            phone_issues, phone_suggestions = self._validate_phone_data(valid_samples)
            issues.extend(phone_issues)
            suggestions.extend(phone_suggestions)

        elif target_field == 'Email' or 'email' in field_name.lower():
            email_issues, email_suggestions = self._validate_email_data(valid_samples)
            issues.extend(email_issues)
            suggestions.extend(email_suggestions)

        elif target_field == 'Last Name' or 'name' in field_name.lower() or 'cliente' in field_name.lower():
            name_issues, name_suggestions = self._validate_name_data(valid_samples)
            issues.extend(name_issues)
            suggestions.extend(name_suggestions)

        confidence = max(0.0, 100.0 - len(issues) * 10)

        return DataValidation(
            field_name=field_name,
            issues_found=issues,
            suggestions=suggestions,
            confidence=confidence,
            sample_data=data_samples[:5]
        )

    def _validate_phone_data(self, samples: List[str]) -> Tuple[List[str], List[str]]:
        """Validate phone number data."""
        issues = []
        suggestions = []

        for sample in samples[:5]:
            sample_str = str(sample).strip()

            if not re.match(r'^[\d\s\-\(\)\+\.]*$', sample_str):
                issues.append(f"Non-numeric characters in phone: {sample_str}")
                suggestions.append("Remove non-numeric characters from phone numbers")
                break

            digits_only = re.sub(r'[^\d]', '', sample_str)
            if len(digits_only) < 8 or len(digits_only) > 15:
                issues.append(f"Invalid phone length: {sample_str} ({len(digits_only)} digits)")
                suggestions.append("Ensure phone numbers have 8-15 digits")
                break

        return issues, suggestions

    def _validate_email_data(self, samples: List[str]) -> Tuple[List[str], List[str]]:
        """Validate email data."""
        issues = []
        suggestions = []

        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        for sample in samples[:5]:
            sample_str = str(sample).strip()

            if not re.match(email_pattern, sample_str):
                issues.append(f"Invalid email format: {sample_str}")
                suggestions.append("Ensure emails follow standard format (user@domain.com)")
                break

        return issues, suggestions

    def _validate_name_data(self, samples: List[str]) -> Tuple[List[str], List[str]]:
        """Validate name data."""
        issues = []
        suggestions = []

        for sample in samples[:5]:
            sample_str = str(sample).strip()

            if re.search(r'\d', sample_str):
                issues.append(f"Numbers found in name: {sample_str}")
                suggestions.append("Remove numbers from name fields")
                break

            if sample_str.isupper() and len(sample_str) > 3:
                issues.append(f"All caps name detected: {sample_str}")
                suggestions.append("Convert names to proper Title Case")
                break

            if sample_str.islower() and len(sample_str) > 3:
                issues.append(f"All lowercase name detected: {sample_str}")
                suggestions.append("Convert names to proper Title Case")
                break

        return issues, suggestions

    def get_mapping_summary(self, mappings: List[FieldMapping]) -> Dict[str, Any]:
        """Generate a summary of mapping results."""
        high_confidence = [m for m in mappings if m.confidence >= self.confidence_threshold]
        low_confidence = [m for m in mappings if m.confidence < self.confidence_threshold and m.target_field != "UNMAPPED"]
        unmapped = [m for m in mappings if m.target_field == "UNMAPPED"]

        return {
            "total_fields": len(mappings),
            "high_confidence_mappings": len(high_confidence),
            "low_confidence_mappings": len(low_confidence),
            "unmapped_fields": len(unmapped),
            "average_confidence": sum(m.confidence for m in mappings) / len(mappings) if mappings else 0,
            "ai_enabled": self.ai_enabled,
            "confidence_threshold": self.confidence_threshold
        }
