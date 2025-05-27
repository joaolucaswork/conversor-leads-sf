#!/usr/bin/env python3
"""
Salesforce Integration Module
Handles uploading leads and other data to Salesforce using the Salesforce REST API
"""

import os
import sys
import json
import argparse
import requests
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from salesforce_field_mapper import SalesforceFieldMapper

# Set up enhanced logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr),  # Send logs to stderr for better debugging
    ]
)
logger = logging.getLogger(__name__)

# Also log to a file for persistent debugging
file_handler = logging.FileHandler('salesforce_integration.log')
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s')
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)


class SafeJSONEncoder(json.JSONEncoder):
    """
    Custom JSON encoder that safely handles NaN, infinity, and other problematic values.
    """
    def encode(self, obj):
        if isinstance(obj, dict):
            obj = self._clean_dict(obj)
        elif isinstance(obj, list):
            obj = self._clean_list(obj)
        return super().encode(obj)

    def _clean_dict(self, d):
        """Clean dictionary values recursively."""
        cleaned = {}
        for key, value in d.items():
            cleaned[key] = self._clean_value(value)
        return cleaned

    def _clean_list(self, lst):
        """Clean list values recursively."""
        return [self._clean_value(item) for item in lst]

    def _clean_value(self, value):
        """Clean individual values."""
        if isinstance(value, dict):
            return self._clean_dict(value)
        elif isinstance(value, list):
            return self._clean_list(value)
        elif pd.isna(value):
            return None
        elif isinstance(value, (np.integer, np.floating)):
            if np.isnan(value) or np.isinf(value):
                return None
            return value.item()  # Convert numpy types to Python types
        elif isinstance(value, float):
            if np.isnan(value) or np.isinf(value):
                return None
            return value
        else:
            return value

class SalesforceIntegration:
    """
    Handles Salesforce API operations including uploading leads,
    retrieving objects, and validating connections.
    """

    def __init__(self, access_token: str, instance_url: str):
        """
        Initialize Salesforce integration with authentication credentials.

        Args:
            access_token (str): Salesforce access token
            instance_url (str): Salesforce instance URL
        """
        self.access_token = access_token
        self.instance_url = instance_url.rstrip('/')
        self.api_version = "v58.0"  # Use a recent API version
        self.base_url = f"{self.instance_url}/services/data/{self.api_version}"

        # Set up headers for API requests
        self.headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        # Initialize field mapper for data transformation
        self.field_mapper = SalesforceFieldMapper()

        # Cache for user ID mappings to avoid repeated API calls
        self.user_id_cache = {}

    def validate_connection(self) -> Dict[str, Any]:
        """
        Validate the Salesforce connection and get user info.

        Returns:
            Dict containing validation results
        """
        try:
            # Get user info to validate connection
            response = requests.get(
                f"{self.base_url}/sobjects/User/{self._get_user_id()}",
                headers=self.headers,
                timeout=30
            )

            if response.status_code == 200:
                user_data = response.json()

                # Get organization limits
                limits_response = requests.get(
                    f"{self.base_url}/limits",
                    headers=self.headers,
                    timeout=30
                )

                limits_data = limits_response.json() if limits_response.status_code == 200 else {}

                return {
                    'success': True,
                    'userInfo': {
                        'id': user_data.get('Id'),
                        'username': user_data.get('Username'),
                        'display_name': user_data.get('Name'),
                        'organization_id': user_data.get('CompanyName')
                    },
                    'permissions': ['api', 'refresh_token'],
                    'limits': limits_data,
                    'message': 'Connection validated successfully'
                }
            else:
                return {
                    'success': False,
                    'error': f'Failed to validate connection: {response.status_code} - {response.text}'
                }

        except Exception as e:
            logger.error(f"Error validating Salesforce connection: {str(e)}")
            return {
                'success': False,
                'error': f'Connection validation failed: {str(e)}'
            }

    def get_objects(self) -> Dict[str, Any]:
        """
        Get available Salesforce objects that can be used for import.

        Returns:
            Dict containing list of available objects
        """
        try:
            response = requests.get(
                f"{self.base_url}/sobjects",
                headers=self.headers,
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                objects = []

                # Filter for commonly used objects that are createable
                common_objects = ['Lead', 'Contact', 'Account', 'Opportunity', 'Case', 'Campaign']

                for obj in data.get('sobjects', []):
                    if obj.get('name') in common_objects and obj.get('createable', False):
                        objects.append({
                            'name': obj.get('name'),
                            'label': obj.get('label'),
                            'createable': obj.get('createable', False)
                        })

                return {
                    'success': True,
                    'objects': objects
                }
            else:
                return {
                    'success': False,
                    'error': f'Failed to get objects: {response.status_code} - {response.text}'
                }

        except Exception as e:
            logger.error(f"Error getting Salesforce objects: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get objects: {str(e)}'
            }

    def get_field_mapping(self, object_type: str) -> Dict[str, Any]:
        """
        Get field mapping for a specific Salesforce object.

        Args:
            object_type (str): Salesforce object type (e.g., 'Lead', 'Contact')

        Returns:
            Dict containing field mapping information
        """
        try:
            response = requests.get(
                f"{self.base_url}/sobjects/{object_type}/describe",
                headers=self.headers,
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                fields = []

                for field in data.get('fields', []):
                    if field.get('createable', False) or field.get('updateable', False):
                        fields.append({
                            'name': field.get('name'),
                            'label': field.get('label'),
                            'type': field.get('type'),
                            'required': not field.get('nillable', True),
                            'length': field.get('length'),
                            'picklistValues': field.get('picklistValues', [])
                        })

                return {
                    'success': True,
                    'fields': fields
                }
            else:
                return {
                    'success': False,
                    'error': f'Failed to get field mapping: {response.status_code} - {response.text}'
                }

        except Exception as e:
            logger.error(f"Error getting field mapping for {object_type}: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get field mapping: {str(e)}'
            }

    def upload_leads(self, file_path: str, object_type: str = 'Lead') -> Dict[str, Any]:
        """
        Upload leads from a CSV file to Salesforce.

        Args:
            file_path (str): Path to the CSV file containing leads
            object_type (str): Salesforce object type to create

        Returns:
            Dict containing upload results
        """
        logger.info(f"=== STARTING SALESFORCE UPLOAD ===")
        logger.info(f"File path: {file_path}")
        logger.info(f"Object type: {object_type}")
        logger.info(f"Instance URL: {self.instance_url}")
        logger.info(f"API Version: {self.api_version}")

        try:
            # Validate file exists
            if not os.path.exists(file_path):
                error_msg = f'File not found: {file_path}'
                logger.error(error_msg)
                return {
                    'success': False,
                    'error': error_msg,
                    'errorType': 'FILE_NOT_FOUND'
                }

            # Read and validate CSV file
            logger.info(f"Reading CSV file: {file_path}")
            try:
                df = pd.read_csv(file_path)
                logger.info(f"Successfully read {len(df)} records from CSV")
                logger.debug(f"CSV columns: {list(df.columns)}")
                logger.debug(f"CSV shape: {df.shape}")

                # Log sample data (first 3 rows, masked for privacy)
                if len(df) > 0:
                    sample_data = df.head(3).to_dict('records')
                    logger.debug(f"Sample data (first 3 rows): {sample_data}")

            except Exception as csv_error:
                error_msg = f'Failed to read CSV file: {str(csv_error)}'
                logger.error(error_msg)
                return {
                    'success': False,
                    'error': error_msg,
                    'errorType': 'CSV_READ_ERROR'
                }

            # Validate data is not empty
            if len(df) == 0:
                error_msg = 'CSV file is empty - no records to upload'
                logger.warning(error_msg)
                return {
                    'success': False,
                    'error': error_msg,
                    'errorType': 'EMPTY_FILE'
                }

            # Apply field mapping to transform column names to Salesforce field names
            logger.info(f"Applying field mapping for {object_type} object")
            logger.info(f"Original columns: {list(df.columns)}")

            try:
                df_mapped, mapping_info = self.field_mapper.map_dataframe_fields(df, object_type)
                logger.info(f"Field mapping completed successfully")
                logger.info(f"Mapped {mapping_info['mapped_fields']} fields")
                logger.info(f"Final columns: {mapping_info['target_columns']}")

                if mapping_info['unmapped_fields']:
                    logger.warning(f"Unmapped fields: {mapping_info['unmapped_fields']}")

                # Check for missing required fields after mapping
                if mapping_info['missing_required_fields']:
                    error_msg = f'Missing required fields for {object_type} object: {mapping_info["missing_required_fields"]}'
                    logger.error(error_msg)
                    logger.error(f'Available columns after mapping: {mapping_info["target_columns"]}')
                    logger.error(f'Original columns: {list(df.columns)}')
                    logger.error(f'Mapping details: {mapping_info["mapping_details"]}')

                    return {
                        'success': False,
                        'error': error_msg,
                        'errorType': 'MISSING_REQUIRED_FIELDS',
                        'missingFields': mapping_info['missing_required_fields'],
                        'availableFields': mapping_info['target_columns'],
                        'originalFields': list(df.columns),
                        'mappingInfo': mapping_info
                    }

                # Use the mapped dataframe for upload
                df = df_mapped

            except Exception as mapping_error:
                error_msg = f'Field mapping failed: {str(mapping_error)}'
                logger.error(error_msg, exc_info=True)
                return {
                    'success': False,
                    'error': error_msg,
                    'errorType': 'FIELD_MAPPING_ERROR'
                }

            # Resolve OwnerId values to actual Salesforce User IDs
            logger.info("Resolving OwnerId values to Salesforce User IDs")
            df = self.resolve_owner_ids(df)

            # Convert DataFrame to records, ensuring NaN values are handled
            logger.info("Converting DataFrame to records with safe NaN handling")
            df_clean = df.replace({np.nan: None})  # Replace NaN with None for JSON serialization
            records = df_clean.to_dict('records')
            logger.info(f"Converted to {len(records)} record dictionaries")

            # Proactive duplicate check before upload
            logger.info("Performing proactive duplicate check before upload")
            proactive_check_result = self.proactive_duplicate_check(records, object_type)

            proactive_duplicates = []
            if proactive_check_result.get('success') and proactive_check_result.get('hasDuplicates'):
                proactive_duplicates = proactive_check_result.get('duplicates', [])
                logger.info(f"Proactive check found {len(proactive_duplicates)} potential duplicates")

                # If duplicates found, return them immediately for user handling
                # This prevents unnecessary upload attempts and provides better user experience
                if proactive_duplicates:
                    logger.info("Returning proactive duplicates for user resolution")
                    return {
                        'success': False,  # Mark as failed to trigger duplicate handling dialog
                        'recordsProcessed': len(records),
                        'recordsSuccessful': 0,
                        'recordsFailed': len(records),
                        'duplicatesDetected': proactive_duplicates,
                        'totalDuplicates': len(proactive_duplicates),
                        'hasDuplicates': True,
                        'errors': [f'Potential duplicates detected for {len(proactive_duplicates)} records'],
                        'detailedErrors': [],
                        'successRate': 0,
                        'jobId': f"proactive_check_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                        'message': f'Proactive duplicate check found {len(proactive_duplicates)} potential duplicates. Please resolve them before proceeding.',
                        'csvInfo': {
                            'totalRows': len(df),
                            'columns': list(df.columns),
                            'filePath': file_path
                        },
                        'proactiveCheck': True  # Flag to indicate this was from proactive check
                    }
            else:
                logger.info("No duplicates found in proactive check, proceeding with upload")

            # Upload records in batches
            batch_size = 200  # Salesforce REST API limit
            total_processed = 0
            total_successful = 0
            total_failed = 0
            errors = []
            detailed_errors = []
            all_duplicates_detected = []

            logger.info(f"Starting batch upload with batch size: {batch_size}")

            for i in range(0, len(records), batch_size):
                batch_num = i//batch_size + 1
                batch = records[i:i + batch_size]
                logger.info(f"Processing batch {batch_num}: records {i+1} to {min(i+len(batch), len(records))}")

                batch_result = self._upload_batch(batch, object_type, batch_num)

                total_processed += len(batch)
                total_successful += batch_result.get('successful', 0)
                total_failed += batch_result.get('failed', 0)
                errors.extend(batch_result.get('errors', []))
                detailed_errors.extend(batch_result.get('detailedErrors', []))
                all_duplicates_detected.extend(batch_result.get('duplicatesDetected', []))

                logger.info(f"Batch {batch_num} completed: {batch_result.get('successful', 0)} successful, {batch_result.get('failed', 0)} failed")

                # Log duplicate detection summary
                duplicates_in_batch = len(batch_result.get('duplicatesDetected', []))
                if duplicates_in_batch > 0:
                    logger.info(f"Batch {batch_num}: {duplicates_in_batch} duplicates detected")

            # Final results
            success_rate = (total_successful / total_processed * 100) if total_processed > 0 else 0
            total_duplicates = len(all_duplicates_detected)

            logger.info(f"=== UPLOAD COMPLETED ===")
            logger.info(f"Total processed: {total_processed}")
            logger.info(f"Total successful: {total_successful}")
            logger.info(f"Total failed: {total_failed}")
            logger.info(f"Total duplicates detected: {total_duplicates}")
            logger.info(f"Success rate: {success_rate:.1f}%")

            if detailed_errors:
                logger.error(f"Detailed errors encountered: {len(detailed_errors)}")
                for error in detailed_errors[:5]:  # Log first 5 detailed errors
                    logger.error(f"Error detail: {error}")

            # Determine if duplicates were detected
            has_duplicates = total_duplicates > 0

            # Create appropriate message
            if has_duplicates:
                message = f'Upload completed with {total_duplicates} duplicates detected: {total_successful} successful, {total_failed} failed ({success_rate:.1f}% success rate)'
            else:
                message = f'Upload completed: {total_successful} successful, {total_failed} failed ({success_rate:.1f}% success rate)'

            return {
                'success': total_successful > 0,  # Success if at least one record uploaded
                'recordsProcessed': total_processed,
                'recordsSuccessful': total_successful,
                'recordsFailed': total_failed,
                'duplicatesDetected': all_duplicates_detected,
                'totalDuplicates': total_duplicates,
                'hasDuplicates': has_duplicates,
                'errors': errors,
                'detailedErrors': detailed_errors,
                'successRate': success_rate,
                'jobId': f"job_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                'message': message,
                'csvInfo': {
                    'totalRows': len(df),
                    'columns': list(df.columns),
                    'filePath': file_path
                }
            }

        except Exception as e:
            error_msg = f'Unexpected error during upload: {str(e)}'
            logger.error(error_msg, exc_info=True)
            return {
                'success': False,
                'error': error_msg,
                'errorType': 'UNEXPECTED_ERROR'
            }

    def _upload_batch(self, records: List[Dict], object_type: str, batch_num: int = 1) -> Dict[str, Any]:
        """
        Upload a batch of records to Salesforce with duplicate detection.

        Args:
            records (List[Dict]): List of records to upload
            object_type (str): Salesforce object type
            batch_num (int): Batch number for logging

        Returns:
            Dict containing batch upload results with duplicate information
        """
        logger.debug(f"=== BATCH {batch_num} UPLOAD START ===")
        logger.debug(f"Batch size: {len(records)}")
        logger.debug(f"Object type: {object_type}")

        try:
            # Prepare composite request for batch upload
            composite_request = {
                "allOrNone": False,
                "records": []
            }

            # Process each record
            for i, record in enumerate(records):
                logger.debug(f"Processing record {i+1} in batch {batch_num}: {record}")

                # Clean the record (remove empty values, format data)
                cleaned_record = self._clean_record(record)
                logger.debug(f"Cleaned record {i+1}: {cleaned_record}")

                # Validate cleaned record has required data
                if not cleaned_record:
                    logger.warning(f"Record {i+1} in batch {batch_num} is empty after cleaning")

                composite_request["records"].append({
                    "attributes": {"type": object_type},
                    **cleaned_record
                })

            logger.debug(f"Composite request for batch {batch_num}: {composite_request}")

            # Send batch request
            api_url = f"{self.base_url}/composite/sobjects"
            logger.info(f"Sending batch {batch_num} to Salesforce API: {api_url}")
            logger.debug(f"Request headers: {self.headers}")

            response = requests.post(
                api_url,
                headers=self.headers,
                json=composite_request,
                timeout=60
            )

            logger.info(f"Batch {batch_num} API response: Status {response.status_code}")
            logger.debug(f"Response headers: {dict(response.headers)}")

            if response.status_code == 200:
                results = response.json()
                logger.debug(f"Batch {batch_num} response body: {results}")

                successful = 0
                failed = 0
                errors = []
                detailed_errors = []
                duplicates_detected = []

                for i, result in enumerate(results):
                    record_num = i + 1
                    if result.get('success'):
                        successful += 1
                        logger.debug(f"Record {record_num} in batch {batch_num}: SUCCESS - ID: {result.get('id')}")
                    else:
                        failed += 1
                        error_messages = []
                        detailed_error_info = {
                            'batchNumber': batch_num,
                            'recordNumber': record_num,
                            'originalRecord': records[i],
                            'cleanedRecord': composite_request["records"][i],
                            'salesforceErrors': result.get('errors', [])
                        }

                        # Check for duplicate detection
                        is_duplicate = False
                        for err in result.get('errors', []):
                            error_msg = err.get('message', 'Unknown error')
                            error_code = err.get('statusCode', 'UNKNOWN')
                            error_fields = err.get('fields', [])

                            # Detect duplicate errors
                            if error_code == 'DUPLICATES_DETECTED':
                                is_duplicate = True
                                duplicate_info = self._extract_duplicate_info(err, records[i], record_num)
                                duplicates_detected.append(duplicate_info)
                                logger.info(f"Record {record_num} in batch {batch_num}: DUPLICATE DETECTED")

                            error_messages.append(f"{error_code}: {error_msg}")
                            if error_fields:
                                error_messages.append(f"Fields: {', '.join(error_fields)}")

                            logger.error(f"Record {record_num} in batch {batch_num}: ERROR - {error_code}: {error_msg}")
                            if error_fields:
                                logger.error(f"  Affected fields: {error_fields}")

                        # Mark as duplicate in detailed error info
                        if is_duplicate:
                            detailed_error_info['isDuplicate'] = True

                        errors.append({
                            'row': record_num,
                            'message': '; '.join(error_messages)
                        })
                        detailed_errors.append(detailed_error_info)

                logger.info(f"Batch {batch_num} results: {successful} successful, {failed} failed")

                return {
                    'successful': successful,
                    'failed': failed,
                    'errors': errors,
                    'detailedErrors': detailed_errors,
                    'duplicatesDetected': duplicates_detected
                }
            else:
                # Handle non-200 responses
                error_msg = f'Batch upload failed: HTTP {response.status_code}'
                response_text = response.text
                logger.error(f"Batch {batch_num} failed with status {response.status_code}")
                logger.error(f"Response body: {response_text}")

                # Try to parse error response for more details
                try:
                    error_data = response.json()
                    if isinstance(error_data, list) and len(error_data) > 0:
                        error_detail = error_data[0]
                        error_msg += f" - {error_detail.get('message', 'Unknown error')}"
                        if 'errorCode' in error_detail:
                            error_msg += f" (Code: {error_detail['errorCode']})"
                except:
                    error_msg += f" - {response_text}"

                return {
                    'successful': 0,
                    'failed': len(records),
                    'errors': [{'row': 'all', 'message': error_msg}],
                    'detailedErrors': [{
                        'batchNumber': batch_num,
                        'httpStatus': response.status_code,
                        'responseBody': response_text,
                        'requestUrl': api_url,
                        'requestPayload': composite_request
                    }]
                }

        except Exception as e:
            error_msg = f'Batch upload error: {str(e)}'
            logger.error(f"Exception in batch {batch_num}: {error_msg}", exc_info=True)
            return {
                'successful': 0,
                'failed': len(records),
                'errors': [{'row': 'all', 'message': error_msg}],
                'detailedErrors': [{
                    'batchNumber': batch_num,
                    'exception': str(e),
                    'exceptionType': type(e).__name__
                }]
            }

    def _clean_record(self, record: Dict) -> Dict:
        """
        Clean a record for Salesforce upload with enhanced NaN handling.

        Args:
            record (Dict): Raw record data

        Returns:
            Dict: Cleaned record data
        """
        cleaned = {}
        skipped_fields = []

        for key, value in record.items():
            original_value = value

            # Skip empty values and NaN values
            if value is None or pd.isna(value) or value == '':
                skipped_fields.append(f"{key}='{original_value}' (empty/null/NaN)")
                continue

            # Handle numpy types and convert to Python types
            if isinstance(value, (np.integer, np.floating)):
                if np.isnan(value) or np.isinf(value):
                    skipped_fields.append(f"{key}='{original_value}' (NaN/Inf)")
                    continue
                value = value.item()  # Convert to Python type

            # Handle regular float values that might be NaN
            if isinstance(value, float):
                if np.isnan(value) or np.isinf(value):
                    skipped_fields.append(f"{key}='{original_value}' (NaN/Inf)")
                    continue

            # Convert to string and strip whitespace for string values
            if isinstance(value, str):
                value = value.strip()
                if value == '' or value.lower() in ['nan', 'null', 'none']:
                    skipped_fields.append(f"{key}='{original_value}' (empty after strip)")
                    continue

            # Special handling for phone numbers - ensure they're clean
            if key in ['Phone', 'MobilePhone', 'Telefone Adcional'] and isinstance(value, str):
                # Remove any non-digit characters except + for international numbers
                import re
                cleaned_phone = re.sub(r'[^\d+]', '', value)
                if len(cleaned_phone) < 8:  # Minimum reasonable phone number length
                    skipped_fields.append(f"{key}='{original_value}' (invalid phone)")
                    continue
                value = cleaned_phone

            cleaned[key] = value

        if skipped_fields:
            logger.debug(f"Skipped empty/invalid fields: {skipped_fields}")

        logger.debug(f"Record cleaning: {len(record)} original fields -> {len(cleaned)} cleaned fields")

        return cleaned

    def _get_user_id(self) -> str:
        """
        Get the current user ID from the access token.

        Returns:
            str: User ID
        """
        try:
            # Use the identity URL to get user info
            response = requests.get(
                f"{self.instance_url}/services/oauth2/userinfo",
                headers={'Authorization': f'Bearer {self.access_token}'},
                timeout=30
            )

            if response.status_code == 200:
                user_info = response.json()
                return user_info.get('user_id', '')
            else:
                return ''

        except Exception:
            return ''

    def resolve_owner_ids(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Resolve OwnerId values from usernames/aliases to actual Salesforce User IDs.

        Args:
            df: DataFrame containing OwnerId column with usernames/aliases

        Returns:
            DataFrame with resolved User IDs in OwnerId column
        """
        if 'OwnerId' not in df.columns:
            logger.info("No OwnerId column found, skipping owner ID resolution")
            return df

        df_resolved = df.copy()
        unique_owners = df_resolved['OwnerId'].dropna().unique()

        if len(unique_owners) == 0:
            logger.info("No owner values to resolve")
            return df_resolved

        logger.info(f"Resolving {len(unique_owners)} unique owner values: {list(unique_owners)}")

        # Get all users from Salesforce to build mapping
        try:
            # Query for active users, looking for matches by Username, Alias, or Name
            user_mapping = {}

            for owner_value in unique_owners:
                if not owner_value or pd.isna(owner_value):
                    continue

                # Skip if already looks like a Salesforce ID (15 or 18 characters)
                if isinstance(owner_value, str) and len(owner_value) in [15, 18] and owner_value.startswith('005'):
                    user_mapping[owner_value] = owner_value
                    logger.debug(f"Owner value '{owner_value}' already appears to be a Salesforce User ID")
                    continue

                # Check cache first
                if owner_value in self.user_id_cache:
                    user_mapping[owner_value] = self.user_id_cache[owner_value]
                    logger.debug(f"Using cached User ID for '{owner_value}': {self.user_id_cache[owner_value]}")
                    continue

                # Query Salesforce for this user
                resolved_id = self._query_user_id(owner_value)
                if resolved_id:
                    user_mapping[owner_value] = resolved_id
                    self.user_id_cache[owner_value] = resolved_id
                    logger.info(f"Resolved '{owner_value}' to User ID: {resolved_id}")
                else:
                    logger.warning(f"Could not resolve owner '{owner_value}' to a Salesforce User ID")
                    # Keep the original value and let Salesforce handle the error
                    user_mapping[owner_value] = owner_value

            # Apply the mapping to the DataFrame
            df_resolved['OwnerId'] = df_resolved['OwnerId'].map(lambda x: user_mapping.get(x, x) if pd.notna(x) else x)

            # Log the resolution summary
            resolved_count = sum(1 for original, resolved in user_mapping.items()
                               if resolved != original and resolved != original)
            logger.info(f"Owner ID resolution completed: {resolved_count}/{len(unique_owners)} values resolved")

            return df_resolved

        except Exception as e:
            logger.error(f"Error during owner ID resolution: {str(e)}")
            logger.warning("Continuing with original owner values - Salesforce will validate them")
            return df_resolved

    def _query_user_id(self, owner_value: str) -> Optional[str]:
        """
        Query Salesforce to find a User ID for the given owner value.

        Args:
            owner_value: Username, alias, or name to search for

        Returns:
            Salesforce User ID if found, None otherwise
        """
        try:
            # Try multiple query strategies
            queries = [
                f"SELECT Id FROM User WHERE Username = '{owner_value}' AND IsActive = true LIMIT 1",
                f"SELECT Id FROM User WHERE Alias = '{owner_value}' AND IsActive = true LIMIT 1",
                f"SELECT Id FROM User WHERE Name = '{owner_value}' AND IsActive = true LIMIT 1",
                f"SELECT Id FROM User WHERE (Username LIKE '%{owner_value}%' OR Alias LIKE '%{owner_value}%' OR Name LIKE '%{owner_value}%') AND IsActive = true LIMIT 1"
            ]

            for query in queries:
                try:
                    response = requests.get(
                        f"{self.base_url}/query",
                        headers=self.headers,
                        params={'q': query},
                        timeout=30
                    )

                    if response.status_code == 200:
                        data = response.json()
                        if data.get('totalSize', 0) > 0:
                            user_id = data['records'][0]['Id']
                            logger.debug(f"Found User ID '{user_id}' for '{owner_value}' using query: {query}")
                            return user_id
                    else:
                        logger.debug(f"Query failed with status {response.status_code}: {query}")

                except Exception as query_error:
                    logger.debug(f"Query error for '{owner_value}': {str(query_error)}")
                    continue

            logger.debug(f"No User ID found for owner value: {owner_value}")
            return None

        except Exception as e:
            logger.error(f"Error querying User ID for '{owner_value}': {str(e)}")
            return None

    def _extract_duplicate_info(self, error: Dict, new_record: Dict, record_number: int) -> Dict[str, Any]:
        """
        Extract duplicate information from Salesforce error response.

        Args:
            error: Salesforce error object
            new_record: The new record that caused the duplicate
            record_number: Record number in the batch

        Returns:
            Dict containing duplicate information
        """
        duplicate_info = {
            'recordNumber': record_number,
            'newRecord': new_record,
            'errorMessage': error.get('message', ''),
            'duplicateRuleId': None,
            'existingRecordIds': [],
            'matchedFields': error.get('fields', [])
        }

        # Try to extract existing record IDs from the error message
        # Salesforce duplicate error messages often contain record IDs
        error_message = error.get('message', '')

        # Look for Salesforce IDs in the error message (15 or 18 character IDs)
        import re

        # More comprehensive patterns for different Salesforce object IDs
        id_patterns = [
            r'\b(00Q[0-9A-Za-z]{12,15})\b',  # Lead IDs
            r'\b(003[0-9A-Za-z]{12,15})\b',  # Contact IDs
            r'\b(001[0-9A-Za-z]{12,15})\b',  # Account IDs
            r'\b(00[0-9A-Za-z][0-9A-Za-z]{12,15})\b'  # General Salesforce ID pattern
        ]

        found_ids = []
        for pattern in id_patterns:
            ids = re.findall(pattern, error_message)
            found_ids.extend(ids)

        # Remove duplicates while preserving order
        unique_ids = []
        seen = set()
        for id_val in found_ids:
            if id_val not in seen:
                unique_ids.append(id_val)
                seen.add(id_val)

        if unique_ids:
            duplicate_info['existingRecordIds'] = unique_ids
            logger.debug(f"Extracted existing record IDs from duplicate error: {unique_ids}")
        else:
            logger.warning(f"No existing record IDs found in duplicate error message: {error_message}")
            # Try to search for potential duplicates based on the new record data
            potential_duplicates = self.search_potential_duplicates(new_record)
            if potential_duplicates:
                duplicate_info['existingRecordIds'] = [dup['Id'] for dup in potential_duplicates[:3]]  # Limit to first 3
                logger.info(f"Found potential duplicate IDs through search: {duplicate_info['existingRecordIds']}")

        return duplicate_info

    def proactive_duplicate_check(self, records: List[Dict], object_type: str = 'Lead') -> Optional[Dict[str, Any]]:
        """
        Proactively check for duplicates before attempting upload to Salesforce.
        This catches duplicates that Salesforce's built-in rules might miss.

        Args:
            records: List of records to check for duplicates
            object_type: Salesforce object type

        Returns:
            Dict containing duplicate check results
        """
        try:
            logger.info(f"Starting proactive duplicate check for {len(records)} {object_type} records")

            duplicates_found = []
            records_checked = 0

            for i, record in enumerate(records):
                records_checked += 1
                record_number = i + 1

                logger.debug(f"Checking record {record_number} for duplicates: {record}")

                # Search for potential duplicates
                potential_duplicates = self.search_potential_duplicates(record, object_type)

                if potential_duplicates:
                    # Create duplicate info for each potential duplicate found
                    for dup in potential_duplicates:
                        duplicate_info = {
                            'recordNumber': record_number,
                            'newRecord': record,
                            'existingRecordIds': [dup['Id']],
                            'matchedFields': dup.get('matchedFields', []),
                            'matchPriority': dup.get('matchPriority', 999),
                            'errorMessage': f"POTENTIAL_DUPLICATE: Record matches existing {object_type} on fields: {', '.join(dup.get('matchedFields', []))}",
                            'duplicateRuleId': 'PROACTIVE_CHECK',
                            'existingRecord': dup
                        }
                        duplicates_found.append(duplicate_info)

                    logger.info(f"Record {record_number}: Found {len(potential_duplicates)} potential duplicates")
                else:
                    logger.debug(f"Record {record_number}: No duplicates found")

            # Group duplicates by record number to avoid multiple entries for the same new record
            grouped_duplicates = {}
            for dup in duplicates_found:
                record_num = dup['recordNumber']
                if record_num not in grouped_duplicates:
                    grouped_duplicates[record_num] = dup
                elif dup['matchPriority'] < grouped_duplicates[record_num]['matchPriority']:
                    # Keep the higher priority match (lower number = higher priority)
                    grouped_duplicates[record_num] = dup

            final_duplicates = list(grouped_duplicates.values())

            logger.info(f"Proactive duplicate check completed: {len(final_duplicates)} duplicates found out of {records_checked} records checked")

            return {
                'success': True,
                'recordsChecked': records_checked,
                'duplicatesFound': len(final_duplicates),
                'duplicates': final_duplicates,
                'hasDuplicates': len(final_duplicates) > 0,
                'message': f'Duplicate check completed: {len(final_duplicates)} potential duplicates found'
            }

        except Exception as e:
            logger.error(f"Error during proactive duplicate check: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'recordsChecked': 0,
                'duplicatesFound': 0,
                'duplicates': [],
                'hasDuplicates': False,
                'message': f'Duplicate check failed: {str(e)}'
            }

    def fetch_existing_record(self, record_id: str, object_type: str = 'Lead') -> Dict[str, Any]:
        """
        Fetch an existing record from Salesforce by ID.

        Args:
            record_id: Salesforce record ID
            object_type: Salesforce object type

        Returns:
            Dict containing record data or None if not found
        """
        try:
            response = requests.get(
                f"{self.base_url}/sobjects/{object_type}/{record_id}",
                headers=self.headers,
                timeout=30
            )

            if response.status_code == 200:
                record_data = response.json()
                logger.debug(f"Fetched existing {object_type} record: {record_id}")
                return record_data
            else:
                logger.warning(f"Could not fetch {object_type} record {record_id}: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Error fetching {object_type} record {record_id}: {str(e)}")
            return None

    def search_potential_duplicates(self, record: Dict, object_type: str = 'Lead') -> List[Dict[str, Any]]:
        """
        Search for potential duplicate records based on multiple field combinations.

        Args:
            record: Record to search for duplicates
            object_type: Salesforce object type

        Returns:
            List of potential duplicate records with match information
        """
        try:
            # Define search fields and combinations based on object type
            search_config = {
                'Lead': {
                    'fields': ['Email', 'Phone', 'LastName', 'Company'],
                    'combinations': [
                        # High priority combinations (most likely duplicates)
                        ['Email'],  # Exact email match
                        ['LastName', 'Company'],  # Same person at same company
                        ['LastName', 'Phone'],  # Same person with same phone
                        ['Phone'],  # Same phone number
                        # Lower priority combinations
                        ['LastName', 'Email'],  # Same person, different email domain
                        ['Company', 'Phone'],  # Same company phone
                    ]
                },
                'Contact': {
                    'fields': ['Email', 'Phone', 'LastName', 'FirstName'],
                    'combinations': [
                        ['Email'],
                        ['LastName', 'FirstName'],
                        ['Phone'],
                        ['LastName', 'Phone']
                    ]
                },
                'Account': {
                    'fields': ['Name', 'Phone', 'Website'],
                    'combinations': [
                        ['Name'],
                        ['Phone'],
                        ['Website']
                    ]
                }
            }

            config = search_config.get(object_type, {
                'fields': ['Email', 'Phone'],
                'combinations': [['Email'], ['Phone']]
            })

            fields_to_search = config['fields']
            field_combinations = config['combinations']

            potential_duplicates = []
            queries_executed = []

            # Build and execute SOQL queries for each field combination
            for combination in field_combinations:
                # Check if all fields in combination have values
                if not all(field in record and record[field] and str(record[field]).strip() for field in combination):
                    continue

                # Build WHERE clause for this combination
                where_conditions = []
                for field in combination:
                    value = str(record[field]).strip()
                    # Escape single quotes in SOQL
                    escaped_value = value.replace("'", "\\'")
                    where_conditions.append(f"{field} = '{escaped_value}'")

                where_clause = " AND ".join(where_conditions)
                query = f"SELECT Id, {', '.join(fields_to_search)} FROM {object_type} WHERE {where_clause} LIMIT 10"

                logger.debug(f"Executing duplicate search query: {query}")
                queries_executed.append({
                    'combination': combination,
                    'query': query
                })

                try:
                    response = requests.get(
                        f"{self.base_url}/query",
                        headers=self.headers,
                        params={'q': query},
                        timeout=30
                    )

                    if response.status_code == 200:
                        data = response.json()
                        if data.get('totalSize', 0) > 0:
                            # Add match information to each duplicate found
                            for dup_record in data['records']:
                                dup_record['matchedFields'] = combination
                                dup_record['matchPriority'] = field_combinations.index(combination) + 1
                                potential_duplicates.append(dup_record)

                            logger.info(f"Found {data['totalSize']} potential duplicates using combination {combination}")
                    else:
                        logger.warning(f"Query failed with status {response.status_code}: {query}")

                except Exception as query_error:
                    logger.debug(f"Query error for combination {combination}: {str(query_error)}")
                    continue

            # Remove duplicates from results and sort by match priority
            seen_ids = set()
            unique_duplicates = []

            # Sort by match priority (lower number = higher priority)
            potential_duplicates.sort(key=lambda x: x.get('matchPriority', 999))

            for dup in potential_duplicates:
                if dup['Id'] not in seen_ids:
                    seen_ids.add(dup['Id'])
                    unique_duplicates.append(dup)

            logger.info(f"Found {len(unique_duplicates)} unique potential duplicates for {object_type}")
            logger.debug(f"Executed {len(queries_executed)} duplicate search queries")

            # Log summary of matches found
            if unique_duplicates:
                match_summary = {}
                for dup in unique_duplicates:
                    matched_fields = tuple(dup.get('matchedFields', []))
                    match_summary[matched_fields] = match_summary.get(matched_fields, 0) + 1

                logger.info(f"Duplicate match summary: {dict(match_summary)}")

            return unique_duplicates

        except Exception as e:
            logger.error(f"Error searching for duplicates: {str(e)}")
            return []

    def update_existing_records(self, updates: List[Dict[str, Any]], object_type: str = 'Lead') -> Dict[str, Any]:
        """
        Update existing records in Salesforce with new data.

        Args:
            updates: List of update operations, each containing:
                - recordId: Salesforce record ID to update
                - fields: Dict of fields to update
                - originalRecord: Original record data for logging
            object_type: Salesforce object type

        Returns:
            Dict containing update results
        """
        try:
            logger.info(f"Starting update of {len(updates)} existing {object_type} records")

            successful_updates = 0
            failed_updates = 0
            update_errors = []

            for i, update_info in enumerate(updates):
                record_id = update_info.get('recordId')
                fields_to_update = update_info.get('fields', {})
                original_record = update_info.get('originalRecord', {})

                if not record_id or not fields_to_update:
                    logger.warning(f"Update {i+1}: Missing recordId or fields, skipping")
                    failed_updates += 1
                    update_errors.append({
                        'updateNumber': i+1,
                        'error': 'Missing recordId or fields to update'
                    })
                    continue

                try:
                    # Perform the update
                    response = requests.patch(
                        f"{self.base_url}/sobjects/{object_type}/{record_id}",
                        headers=self.headers,
                        json=fields_to_update,
                        timeout=30
                    )

                    if response.status_code == 204:  # Success - No Content
                        successful_updates += 1
                        logger.info(f"Update {i+1}: Successfully updated record {record_id}")
                        logger.debug(f"Updated fields: {fields_to_update}")
                    else:
                        failed_updates += 1
                        error_msg = f"HTTP {response.status_code}"
                        try:
                            error_data = response.json()
                            if isinstance(error_data, list) and len(error_data) > 0:
                                error_msg = error_data[0].get('message', error_msg)
                        except:
                            pass

                        update_errors.append({
                            'updateNumber': i+1,
                            'recordId': record_id,
                            'error': error_msg,
                            'statusCode': response.status_code
                        })
                        logger.error(f"Update {i+1}: Failed to update record {record_id}: {error_msg}")

                except Exception as update_error:
                    failed_updates += 1
                    error_msg = str(update_error)
                    update_errors.append({
                        'updateNumber': i+1,
                        'recordId': record_id,
                        'error': error_msg
                    })
                    logger.error(f"Update {i+1}: Exception updating record {record_id}: {error_msg}")

            # Calculate success rate
            total_updates = len(updates)
            success_rate = (successful_updates / total_updates * 100) if total_updates > 0 else 0

            logger.info(f"Update operation completed: {successful_updates}/{total_updates} successful ({success_rate:.1f}%)")

            return {
                'success': successful_updates > 0,
                'totalUpdates': total_updates,
                'successfulUpdates': successful_updates,
                'failedUpdates': failed_updates,
                'successRate': success_rate,
                'updateErrors': update_errors,
                'message': f'Update completed: {successful_updates} successful, {failed_updates} failed ({success_rate:.1f}% success rate)'
            }

        except Exception as e:
            logger.error(f"Error during record update operation: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': f'Update operation failed: {str(e)}'
            }


def main():
    """
    Command-line interface for Salesforce integration.
    """
    parser = argparse.ArgumentParser(description='Salesforce Integration Tool')
    parser.add_argument('--action', required=True, choices=['upload', 'validate', 'objects', 'fields'],
                        help='Action to perform')
    parser.add_argument('--access-token', required=True, help='Salesforce access token')
    parser.add_argument('--instance-url', required=True, help='Salesforce instance URL')
    parser.add_argument('--file-path', help='Path to CSV file for upload')
    parser.add_argument('--object-type', default='Lead', help='Salesforce object type')

    args = parser.parse_args()

    # Initialize Salesforce integration
    sf = SalesforceIntegration(args.access_token, args.instance_url)

    # Perform the requested action
    if args.action == 'upload':
        if not args.file_path:
            print(json.dumps({'success': False, 'error': 'File path is required for upload'}))
            sys.exit(1)
        result = sf.upload_leads(args.file_path, args.object_type)
    elif args.action == 'validate':
        result = sf.validate_connection()
    elif args.action == 'objects':
        result = sf.get_objects()
    elif args.action == 'fields':
        result = sf.get_field_mapping(args.object_type)
    else:
        result = {'success': False, 'error': 'Invalid action'}

    # Output result as JSON using safe encoder
    print(json.dumps(result, indent=2, cls=SafeJSONEncoder))


if __name__ == '__main__':
    main()
