#!/usr/bin/env python3
"""
Duplicate Handler Module
Handles duplicate record resolution operations for Salesforce integration
"""

import os
import sys
import json
import argparse
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from salesforce_integration import SalesforceIntegration, SafeJSONEncoder

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class DuplicateHandler:
    """
    Handles duplicate record resolution operations.
    """

    def __init__(self, access_token: str, instance_url: str):
        """
        Initialize the duplicate handler.

        Args:
            access_token: Salesforce access token
            instance_url: Salesforce instance URL
        """
        self.sf_integration = SalesforceIntegration(access_token, instance_url)
        logger.info("DuplicateHandler initialized")

    def fetch_existing_records(self, duplicate_info: List[Dict[str, Any]], object_type: str = 'Lead') -> Dict[str, Any]:
        """
        Fetch existing records for comparison with duplicates.

        Args:
            duplicate_info: List of duplicate information from upload
            object_type: Salesforce object type

        Returns:
            Dict containing existing record data
        """
        try:
            logger.info(f"Fetching existing records for {len(duplicate_info)} duplicates")

            existing_records = {}
            fetch_errors = []

            for duplicate in duplicate_info:
                record_number = duplicate.get('recordNumber')
                existing_record_ids = duplicate.get('existingRecordIds', [])
                new_record = duplicate.get('newRecord', {})

                if not existing_record_ids:
                    logger.warning(f"No existing record IDs found for duplicate {record_number}")

                    # Try to search for potential duplicates based on the new record data
                    try:
                        potential_duplicates = self.sf_integration.search_potential_duplicates(new_record, object_type)
                        if potential_duplicates:
                            existing_record_ids = [dup['Id'] for dup in potential_duplicates[:1]]  # Use first match
                            logger.info(f"Found potential duplicate through search for record {record_number}: {existing_record_ids}")
                        else:
                            fetch_errors.append({
                                'recordNumber': record_number,
                                'recordId': None,
                                'error': 'No existing record IDs found and no potential duplicates located'
                            })
                            continue
                    except Exception as search_error:
                        fetch_errors.append({
                            'recordNumber': record_number,
                            'recordId': None,
                            'error': f'Failed to search for potential duplicates: {str(search_error)}'
                        })
                        continue

                # Fetch the first existing record (primary match)
                primary_record_id = existing_record_ids[0]

                try:
                    existing_record = self.sf_integration.fetch_existing_record(primary_record_id, object_type)
                    if existing_record:
                        existing_records[record_number] = existing_record
                        logger.debug(f"Fetched existing record for duplicate {record_number}: {primary_record_id}")
                    else:
                        fetch_errors.append({
                            'recordNumber': record_number,
                            'recordId': primary_record_id,
                            'error': 'Record not found or access denied'
                        })

                except Exception as e:
                    fetch_errors.append({
                        'recordNumber': record_number,
                        'recordId': primary_record_id,
                        'error': str(e)
                    })
                    logger.error(f"Error fetching record {primary_record_id}: {str(e)}")

            return {
                'success': len(existing_records) > 0,
                'existingRecords': existing_records,
                'fetchErrors': fetch_errors,
                'totalRequested': len(duplicate_info),
                'totalFetched': len(existing_records)
            }

        except Exception as e:
            logger.error(f"Error fetching existing records: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'existingRecords': {},
                'fetchErrors': []
            }

    def process_duplicate_resolution(self, resolution_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process duplicate resolution based on user choice.

        Args:
            resolution_data: Contains action, duplicates, and selected fields

        Returns:
            Dict containing resolution results
        """
        try:
            action = resolution_data.get('action')
            duplicates = resolution_data.get('duplicates', [])
            selected_fields = resolution_data.get('selectedFields', {})
            object_type = resolution_data.get('objectType', 'Lead')

            logger.info(f"Processing duplicate resolution: action={action}, duplicates={len(duplicates)}")

            if action == 'cancel':
                return {
                    'success': True,
                    'action': 'cancel',
                    'message': 'Upload operation cancelled by user'
                }

            if action == 'skip':
                return {
                    'success': True,
                    'action': 'skip',
                    'skippedCount': len(duplicates),
                    'message': f'Skipped {len(duplicates)} duplicate records'
                }

            if action == 'update':
                return self._process_updates(duplicates, selected_fields, object_type)

            return {
                'success': False,
                'error': f'Unknown action: {action}'
            }

        except Exception as e:
            logger.error(f"Error processing duplicate resolution: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def _process_updates(self, duplicates: List[Dict[str, Any]], selected_fields: Dict[str, Dict[str, bool]], object_type: str) -> Dict[str, Any]:
        """
        Process record updates for duplicate resolution.

        Args:
            duplicates: List of duplicate information
            selected_fields: Dict mapping record numbers to selected fields
            object_type: Salesforce object type

        Returns:
            Dict containing update results
        """
        try:
            logger.info(f"Processing updates for {len(duplicates)} duplicate records")

            updates_to_perform = []

            for duplicate in duplicates:
                record_number = duplicate.get('recordNumber')
                new_record = duplicate.get('newRecord', {})
                existing_record_ids = duplicate.get('existingRecordIds', [])

                if not existing_record_ids:
                    logger.warning(f"No existing record IDs for duplicate {record_number}, skipping")
                    continue

                # Get selected fields for this record
                record_selected_fields = selected_fields.get(str(record_number), {})

                if not record_selected_fields:
                    logger.info(f"No fields selected for update on record {record_number}, skipping")
                    continue

                # Build update data with only selected fields
                fields_to_update = {}
                for field, is_selected in record_selected_fields.items():
                    if is_selected and field in new_record:
                        fields_to_update[field] = new_record[field]

                if fields_to_update:
                    updates_to_perform.append({
                        'recordId': existing_record_ids[0],  # Update the primary match
                        'fields': fields_to_update,
                        'originalRecord': new_record,
                        'recordNumber': record_number
                    })
                    logger.debug(f"Prepared update for record {record_number}: {fields_to_update}")

            if not updates_to_perform:
                return {
                    'success': True,
                    'action': 'update',
                    'totalUpdates': 0,
                    'successfulUpdates': 0,
                    'message': 'No updates to perform - no fields were selected'
                }

            # Perform the updates
            update_result = self.sf_integration.update_existing_records(updates_to_perform, object_type)

            # Add action info to result
            update_result['action'] = 'update'

            return update_result

        except Exception as e:
            logger.error(f"Error processing updates: {str(e)}")
            return {
                'success': False,
                'action': 'update',
                'error': str(e)
            }


def main():
    """
    Main function for command-line usage.
    """
    parser = argparse.ArgumentParser(description='Handle duplicate record resolution')
    parser.add_argument('--action', required=True, choices=['fetch', 'resolve'],
                       help='Action to perform')
    parser.add_argument('--access-token', required=True, help='Salesforce access token')
    parser.add_argument('--instance-url', required=True, help='Salesforce instance URL')
    parser.add_argument('--data', required=True, help='JSON data for the operation')
    parser.add_argument('--object-type', default='Lead', help='Salesforce object type')

    args = parser.parse_args()

    try:
        # Parse input data
        data = json.loads(args.data)

        # Initialize handler
        handler = DuplicateHandler(args.access_token, args.instance_url)

        if args.action == 'fetch':
            # Fetch existing records for comparison
            result = handler.fetch_existing_records(data, args.object_type)
        elif args.action == 'resolve':
            # Process duplicate resolution
            result = handler.process_duplicate_resolution(data)
        else:
            result = {'success': False, 'error': f'Unknown action: {args.action}'}

        # Output result as JSON
        print(json.dumps(result, cls=SafeJSONEncoder, indent=2))

    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        result = {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(result, cls=SafeJSONEncoder, indent=2))
        sys.exit(1)


if __name__ == '__main__':
    main()
