"""
Salesforce Field Mapping Utility

This module provides field mapping functionality to transform processed lead data
field names to match Salesforce object field requirements.
"""

import json
import logging
import os
from typing import Dict, List, Tuple, Optional, Any
import pandas as pd

logger = logging.getLogger(__name__)

class SalesforceFieldMapper:
    """
    Utility class for mapping processed lead data fields to Salesforce object fields.
    """
    
    def __init__(self, config_path: str = None):
        """
        Initialize the field mapper with configuration.
        
        Args:
            config_path: Path to the field mapping configuration file
        """
        self.config_path = config_path or os.path.join('config', 'salesforce_field_mapping.json')
        self.mapping_config = self._load_mapping_config()
        
    def _load_mapping_config(self) -> Dict:
        """Load field mapping configuration from JSON file."""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                logger.info(f"Loaded field mapping configuration from {self.config_path}")
                return config
            else:
                logger.warning(f"Field mapping config not found at {self.config_path}, using defaults")
                return self._get_default_config()
        except Exception as e:
            logger.error(f"Failed to load field mapping config: {e}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict:
        """Get default field mapping configuration."""
        return {
            "Lead": {
                "field_mappings": {
                    "Last Name": "LastName",
                    "Telefone Adcional": "MobilePhone", 
                    "Phone": "Phone",
                    "Email": "Email",
                    "Description": "Description",
                    "Patrimônio Financeiro": "AnnualRevenue",
                    "Tipo": "LeadSource",
                    "State/Province": "State",
                    "OwnerId": "OwnerId",
                    "maisdeMilhao__c": "maisdeMilhao__c"
                },
                "required_fields": ["LastName"]
            }
        }
    
    def map_dataframe_fields(self, df: pd.DataFrame, salesforce_object: str) -> Tuple[pd.DataFrame, Dict]:
        """
        Map DataFrame column names to Salesforce field names.
        
        Args:
            df: DataFrame with processed lead data
            salesforce_object: Target Salesforce object (Lead, Contact, Account)
            
        Returns:
            Tuple of (mapped_dataframe, mapping_info)
        """
        logger.info(f"Mapping fields for Salesforce object: {salesforce_object}")
        logger.info(f"Input columns: {list(df.columns)}")
        
        # Get mapping configuration for the object
        object_config = self.mapping_config.get(salesforce_object, {})
        field_mappings = object_config.get('field_mappings', {})
        
        if not field_mappings:
            logger.warning(f"No field mappings found for {salesforce_object}")
            return df, {'mapped_fields': 0, 'unmapped_fields': list(df.columns)}
        
        # Create a copy of the dataframe for mapping
        df_mapped = df.copy()
        
        # Track mapping results
        mapped_fields = []
        unmapped_fields = []
        mapping_details = {}
        
        # Apply field mappings
        for source_field, target_field in field_mappings.items():
            if source_field in df_mapped.columns:
                # Rename the column
                df_mapped = df_mapped.rename(columns={source_field: target_field})
                mapped_fields.append((source_field, target_field))
                mapping_details[source_field] = target_field
                logger.debug(f"Mapped: '{source_field}' → '{target_field}'")
            else:
                logger.debug(f"Source field '{source_field}' not found in data")
        
        # Identify unmapped fields
        for col in df.columns:
            if col not in field_mappings:
                unmapped_fields.append(col)
                logger.debug(f"Unmapped field: '{col}'")
        
        # Validate required fields
        required_fields = object_config.get('required_fields', [])
        missing_required = [field for field in required_fields if field not in df_mapped.columns]
        
        mapping_info = {
            'mapped_fields': len(mapped_fields),
            'unmapped_fields': unmapped_fields,
            'mapping_details': mapping_details,
            'required_fields': required_fields,
            'missing_required_fields': missing_required,
            'target_columns': list(df_mapped.columns)
        }
        
        logger.info(f"Field mapping completed:")
        logger.info(f"  - Mapped fields: {len(mapped_fields)}")
        logger.info(f"  - Unmapped fields: {len(unmapped_fields)}")
        logger.info(f"  - Missing required: {len(missing_required)}")
        logger.info(f"  - Final columns: {list(df_mapped.columns)}")
        
        if missing_required:
            logger.error(f"Missing required fields: {missing_required}")
        
        return df_mapped, mapping_info
    
    def validate_field_mapping(self, df: pd.DataFrame, salesforce_object: str) -> Dict:
        """
        Validate field mapping without modifying the DataFrame.
        
        Args:
            df: DataFrame to validate
            salesforce_object: Target Salesforce object
            
        Returns:
            Dict with validation results
        """
        object_config = self.mapping_config.get(salesforce_object, {})
        field_mappings = object_config.get('field_mappings', {})
        required_fields = object_config.get('required_fields', [])
        
        # Check which fields can be mapped
        mappable_fields = []
        unmappable_fields = []
        
        for col in df.columns:
            if col in field_mappings:
                mappable_fields.append((col, field_mappings[col]))
            else:
                unmappable_fields.append(col)
        
        # Check required fields after mapping
        mapped_target_fields = [field_mappings[col] for col in df.columns if col in field_mappings]
        missing_required = [field for field in required_fields if field not in mapped_target_fields]
        
        return {
            'valid': len(missing_required) == 0,
            'mappable_fields': mappable_fields,
            'unmappable_fields': unmappable_fields,
            'required_fields': required_fields,
            'missing_required_fields': missing_required,
            'validation_errors': missing_required
        }
    
    def get_field_suggestions(self, df: pd.DataFrame, salesforce_object: str) -> Dict:
        """
        Get suggestions for unmapped fields based on common aliases.
        
        Args:
            df: DataFrame with fields to analyze
            salesforce_object: Target Salesforce object
            
        Returns:
            Dict with field suggestions
        """
        common_aliases = self.mapping_config.get('common_field_aliases', {})
        object_mappings = self.mapping_config.get(salesforce_object, {}).get('field_mappings', {})
        
        suggestions = {}
        
        for col in df.columns:
            if col not in object_mappings:
                # Check if column matches a common alias
                for alias, standard_field in common_aliases.items():
                    if col.lower() == alias.lower() and standard_field in object_mappings:
                        suggestions[col] = {
                            'suggested_mapping': object_mappings[standard_field],
                            'via_alias': alias,
                            'confidence': 'high'
                        }
                        break
                
                # Check for partial matches
                if col not in suggestions:
                    for standard_field in object_mappings:
                        if col.lower() in standard_field.lower() or standard_field.lower() in col.lower():
                            suggestions[col] = {
                                'suggested_mapping': object_mappings[standard_field],
                                'via_similarity': standard_field,
                                'confidence': 'medium'
                            }
                            break
        
        return suggestions
    
    def get_supported_objects(self) -> List[str]:
        """Get list of supported Salesforce objects."""
        return [obj for obj in self.mapping_config.keys() if obj not in ['mapping_rules', 'common_field_aliases']]
    
    def get_object_field_info(self, salesforce_object: str) -> Dict:
        """
        Get detailed field information for a Salesforce object.
        
        Args:
            salesforce_object: Salesforce object name
            
        Returns:
            Dict with field information
        """
        return self.mapping_config.get(salesforce_object, {})
