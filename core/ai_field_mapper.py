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
import hashlib
import pickle
from pathlib import Path
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
        # Always enable AI initially since we have hardcoded API key
        self.ai_enabled = True
        self.confidence_threshold = self.config.get('ai_processing', {}).get('confidence_threshold', 80.0)

        # Load environment variables
        load_dotenv()

        # Initialize OpenAI client
        self.openai_client = None
        if OPENAI_AVAILABLE:
            self._initialize_openai()
        else:
            self.logger.warning("OpenAI package not available, AI features disabled")
            self.ai_enabled = False

        # Standard target fields for lead processing
        self.target_fields = [
            'Last Name', 'Telefone Adcional', 'Phone', 'Email',
            'Description', 'Patrimônio Financeiro', 'Tipo',
            'State/Province', 'OwnerId', 'maisdeMilhao__c'
        ]

        # Initialize caching system
        self.cache_dir = Path("cache/ai_mappings")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.mapping_cache = {}
        self.validation_cache = {}
        self._load_cache()

        # Initialize API usage tracking
        self.api_usage_stats = {
            'total_calls': 0,
            'mapping_calls': 0,
            'validation_calls': 0,
            'total_tokens_used': 0,
            'estimated_cost': 0.0,
            'cache_hits': 0,
            'cache_misses': 0,
            'ai_skipped': 0
        }

    def _initialize_openai(self):
        """Initialize OpenAI client with hardcoded API key for Reino Capital."""
        # Hardcoded API key for production use at Reino Capital
        api_key = "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"

        try:
            from openai import OpenAI
            self.openai_client = OpenAI(api_key=api_key)
            self.logger.info("OpenAI client initialized successfully with Reino Capital's API key")
            # Always enable AI processing since the key is hardcoded
            self.ai_enabled = True
        except Exception as e:
            self.logger.error(f"Failed to initialize OpenAI client: {e}")
            self.ai_enabled = False

    def _load_cache(self):
        """Load cached mappings and validations from disk."""
        try:
            mapping_cache_file = self.cache_dir / "mapping_cache.pkl"
            validation_cache_file = self.cache_dir / "validation_cache.pkl"

            if mapping_cache_file.exists():
                with open(mapping_cache_file, 'rb') as f:
                    self.mapping_cache = pickle.load(f)
                self.logger.info(f"Loaded {len(self.mapping_cache)} cached mappings")

            if validation_cache_file.exists():
                with open(validation_cache_file, 'rb') as f:
                    self.validation_cache = pickle.load(f)
                self.logger.info(f"Loaded {len(self.validation_cache)} cached validations")
        except Exception as e:
            self.logger.warning(f"Failed to load cache: {e}")
            self.mapping_cache = {}
            self.validation_cache = {}

    def _save_cache(self):
        """Save cached mappings and validations to disk."""
        try:
            mapping_cache_file = self.cache_dir / "mapping_cache.pkl"
            validation_cache_file = self.cache_dir / "validation_cache.pkl"

            with open(mapping_cache_file, 'wb') as f:
                pickle.dump(self.mapping_cache, f)

            with open(validation_cache_file, 'wb') as f:
                pickle.dump(self.validation_cache, f)

            self.logger.debug("Cache saved successfully")
        except Exception as e:
            self.logger.warning(f"Failed to save cache: {e}")

    def _get_cache_key(self, data: Any) -> str:
        """Generate a cache key for the given data."""
        return hashlib.md5(str(data).encode()).hexdigest()

    def _should_use_ai(self, column_names: List[str]) -> bool:
        """Determine if AI processing is needed based on rule-based confidence."""
        if not self.ai_enabled or not self.openai_client:
            return False

        # Check if rule-based mapping can handle most columns with high confidence
        rule_based_mappings = self._rule_based_mapping(column_names)
        high_confidence_count = sum(1 for m in rule_based_mappings if m.confidence >= 85.0)

        # Use AI only if less than 80% of columns can be mapped with high confidence
        confidence_ratio = high_confidence_count / len(column_names) if column_names else 0
        return confidence_ratio < 0.8

    def _track_api_usage(self, response, call_type: str):
        """Track API usage statistics and estimated costs."""
        if hasattr(response, 'usage'):
            tokens_used = response.usage.total_tokens
            self.api_usage_stats['total_tokens_used'] += tokens_used

            # Estimate cost (GPT-3.5-turbo pricing: ~$0.002 per 1K tokens)
            cost_per_token = 0.000002  # $0.002 / 1000 tokens
            self.api_usage_stats['estimated_cost'] += tokens_used * cost_per_token

        self.api_usage_stats['total_calls'] += 1
        self.api_usage_stats[f'{call_type}_calls'] += 1

        self.logger.debug(f"API usage - {call_type}: {self.api_usage_stats[f'{call_type}_calls']} calls, "
                         f"Total tokens: {self.api_usage_stats['total_tokens_used']}, "
                         f"Estimated cost: ${self.api_usage_stats['estimated_cost']:.4f}")

    def get_api_usage_stats(self) -> Dict[str, Any]:
        """Get comprehensive API usage statistics."""
        return {
            **self.api_usage_stats,
            'cache_hit_ratio': self.api_usage_stats['cache_hits'] / max(1, self.api_usage_stats['cache_hits'] + self.api_usage_stats['cache_misses']),
            'ai_skip_ratio': self.api_usage_stats['ai_skipped'] / max(1, self.api_usage_stats['total_calls'] + self.api_usage_stats['ai_skipped'])
        }

    def analyze_columns(self, column_names: List[str], sample_data: Dict[str, List[str]] = None) -> List[FieldMapping]:
        """
        Analyze column names and suggest mappings to target fields with caching and smart AI usage.

        Args:
            column_names: List of source column names
            sample_data: Optional sample data for each column

        Returns:
            List of FieldMapping objects with confidence scores
        """
        # Generate cache key for this mapping request
        cache_key = self._get_cache_key((column_names, list(sample_data.keys()) if sample_data else None))

        # Check cache first
        if cache_key in self.mapping_cache:
            self.logger.info("Using cached mapping result")
            self.api_usage_stats['cache_hits'] += 1
            return self.mapping_cache[cache_key]

        self.api_usage_stats['cache_misses'] += 1

        # Determine if AI is needed
        if not self._should_use_ai(column_names):
            self.logger.info("Rule-based mapping sufficient, skipping AI")
            self.api_usage_stats['ai_skipped'] += 1
            mappings = self._rule_based_mapping(column_names)
        else:
            try:
                mappings = self._ai_powered_mapping(column_names, sample_data)
            except Exception as e:
                self.logger.error(f"AI mapping failed, falling back to rule-based: {e}")
                mappings = self._rule_based_mapping(column_names)

        # Cache the result
        self.mapping_cache[cache_key] = mappings
        self._save_cache()

        return mappings

    def _ai_powered_mapping(self, column_names: List[str], sample_data: Dict[str, List[str]] = None) -> List[FieldMapping]:
        """Use AI to analyze and map column names."""
        self.logger.info("Using AI-powered column mapping")

        # Prepare the prompt for ChatGPT
        prompt = self._create_mapping_prompt(column_names, sample_data)

        try:
            response = self.openai_client.chat.completions.create(
                model=self.config.get('ai_processing', {}).get('model', 'gpt-3.5-turbo'),
                messages=[
                    {"role": "system", "content": "Expert data analyst. Map columns to targets."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=min(500, len(column_names) * 50),  # Dynamic token limit
                stop=["}\n\n", "```"]  # Stop sequences to prevent over-generation
            )

            # Track API usage
            self._track_api_usage(response, 'mapping')

            # Parse the AI response
            ai_response = response.choices[0].message.content
            return self._parse_ai_mapping_response(ai_response, column_names)

        except Exception as e:
            self.logger.error(f"OpenAI API call failed: {e}")
            raise

    def _create_mapping_prompt(self, column_names: List[str], sample_data: Dict[str, List[str]] = None) -> str:
        """Create an optimized, concise prompt for AI field mapping."""
        # Build sample data string efficiently
        sample_str = ""
        if sample_data:
            sample_str = "\nSamples: " + "; ".join([f"{col}:{samples[0] if samples else 'N/A'}" for col, samples in sample_data.items()])

        prompt = f"""Map columns to targets. Return JSON only.

Columns: {column_names}
Targets: {self.target_fields}{sample_str}

Patterns: Cliente/Nome→Last Name, Telefone→Phone, Email→Email, Volume/Patrimônio→Patrimônio Financeiro, Estado→State/Province, Descrição→Description, Atribuir/Owner→OwnerId

JSON format:
{{"mappings":[{{"source_field":"col","target_field":"target","confidence":95,"reasoning":"brief reason"}}]}}"""
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

        # Enhanced mapping rules with comprehensive patterns and fuzzy matching
        mapping_rules = {
            # Name fields (more comprehensive)
            r'(cliente|customer|nome|name|last.*name|lead|client|person|pessoa|individual|contato)': 'Last Name',

            # Phone fields (primary phone) - exclude additional phone patterns
            r'(telefone|phone|tel|celular|mobile|fone|contact)(?!.*(adicional|additional|extra|segundo|second|2))': 'Phone',

            # Additional phone fields
            r'(telefone.*(adicional|extra|segundo|2)|phone.*(additional|extra|second|2)|tel.*(adicional|extra|2))': 'Telefone Adcional',

            # Email fields
            r'(e-?mail|email|correio|electronic.*mail)': 'Email',

            # Financial/wealth fields (expanded)
            r'(volume|patrimonio|patrimônio|financial|wealth|assets|valor|value|renda|income|capital|money|dinheiro)': 'Patrimônio Financeiro',

            # Location fields (expanded)
            r'(estado|state|province|provincia|uf|region|regiao|location|local|endereco|address)': 'State/Province',

            # Description fields (expanded)
            r'(descri[çc][aã]o|description|desc|notes|obs|observa[çc][aã]o|comment|comentario|detalhes|details)': 'Description',

            # Owner/assignment fields (expanded)
            r'(alias|owner|respons[aá]vel|vendedor|atribuir|assigned|agent|agente|seller|consultor|advisor)': 'OwnerId',

            # Type/category fields (expanded)
            r'(tipo|type|categoria|category|class|classe|segment|segmento|classification)': 'Tipo',

            # Millionaire flag (new)
            r'(mais.*milhao|maismilhao|millionaire|million|rico|wealthy|high.*net)': 'maisdeMilhao__c'
        }

        mappings = []
        for col_name in column_names:
            best_match = None
            best_confidence = 0.0

            col_lower = col_name.lower().strip()
            for pattern, target_field in mapping_rules.items():
                match = re.search(pattern, col_lower)
                if match:
                    # Calculate confidence based on match quality
                    match_length = len(match.group())
                    col_length = len(col_lower)

                    # Base confidence for pattern match
                    confidence = 85.0

                    # Boost confidence for exact or near-exact matches
                    if match_length / col_length > 0.8:
                        confidence = 95.0
                    elif match_length / col_length > 0.6:
                        confidence = 90.0

                    # Boost confidence for common exact matches
                    exact_matches = {
                        'cliente': 'Last Name', 'telefone': 'Phone', 'email': 'Email',
                        'estado': 'State/Province', 'tipo': 'Tipo', 'alias': 'OwnerId'
                    }
                    if col_lower in exact_matches and exact_matches[col_lower] == target_field:
                        confidence = 98.0

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
        Use AI to validate data quality with caching and smart fallbacks.

        Args:
            field_name: Name of the field being validated
            data_samples: Sample data from the field
            target_field: Target field this data will be mapped to

        Returns:
            DataValidation object with issues and suggestions
        """
        # Generate cache key for this validation request
        cache_key = self._get_cache_key((field_name, target_field, tuple(data_samples[:3])))

        # Check cache first
        if cache_key in self.validation_cache:
            self.logger.debug(f"Using cached validation for {field_name}")
            self.api_usage_stats['cache_hits'] += 1
            return self.validation_cache[cache_key]

        self.api_usage_stats['cache_misses'] += 1

        # Use rule-based validation for simple cases or when AI is disabled
        if not self.ai_enabled or not self.openai_client or self._should_skip_ai_validation(field_name, target_field):
            self.api_usage_stats['ai_skipped'] += 1
            validation = self._rule_based_validation(field_name, data_samples, target_field)
        else:
            try:
                validation = self._ai_powered_validation(field_name, data_samples, target_field)
            except Exception as e:
                self.logger.error(f"AI validation failed, falling back to rule-based: {e}")
                validation = self._rule_based_validation(field_name, data_samples, target_field)

        # Cache the result
        self.validation_cache[cache_key] = validation
        self._save_cache()

        return validation

    def _should_skip_ai_validation(self, field_name: str, target_field: str = None) -> bool:
        """Determine if AI validation can be skipped for simple cases."""
        # Skip AI for standard fields that rule-based validation handles well
        simple_fields = ['Phone', 'Email', 'Last Name', 'State/Province']
        if target_field in simple_fields:
            return True

        # Skip AI for fields with obvious patterns
        field_lower = field_name.lower()
        if any(pattern in field_lower for pattern in ['phone', 'telefone', 'email', 'nome', 'name']):
            return True

        return False

    def _ai_powered_validation(self, field_name: str, data_samples: List[str], target_field: str = None) -> DataValidation:
        """Use AI to validate data quality."""
        self.logger.info(f"Using AI-powered validation for field: {field_name}")

        prompt = self._create_validation_prompt(field_name, data_samples, target_field)

        try:
            response = self.openai_client.chat.completions.create(
                model=self.config.get('ai_processing', {}).get('model', 'gpt-3.5-turbo'),
                messages=[
                    {"role": "system", "content": "Data quality analyst. Validate and suggest fixes."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=200,  # Reduced token limit for validation
                stop=["}\n\n", "```"]  # Stop sequences
            )

            # Track API usage
            self._track_api_usage(response, 'validation')

            ai_response = response.choices[0].message.content
            return self._parse_validation_response(ai_response, field_name, data_samples)

        except Exception as e:
            self.logger.error(f"OpenAI validation API call failed: {e}")
            raise

    def _create_validation_prompt(self, field_name: str, data_samples: List[str], target_field: str = None) -> str:
        """Create an optimized, concise prompt for AI data validation."""
        prompt = f"""Validate data quality. Return JSON only.

Field: {field_name} → {target_field or 'Unknown'}
Samples: {data_samples[:3]}

Check: formats, missing values, patterns, types, encoding

JSON: {{"issues_found":["issue"],"suggestions":["fix"],"confidence":85}}"""
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
