#!/usr/bin/env python3
"""
Batch Leads Processing Script
Process multiple lead files in batch mode.

Usage:
    python batch_processor.py [directory] [--config config.json]
    
Examples:
    python batch_processor.py data/input/
    python batch_processor.py . --config custom_config.json
"""

import os
import sys
import argparse
from pathlib import Path
from master_leads_processor import LeadsProcessor

def find_csv_files(directory: str) -> list:
    """Find all CSV files in the specified directory."""
    csv_files = []
    directory_path = Path(directory)
    
    if not directory_path.exists():
        print(f"❌ Directory not found: {directory}")
        return csv_files
    
    # Find all CSV files
    for file_path in directory_path.glob("*.csv"):
        # Skip already processed files and backups
        if any(keyword in file_path.name.lower() for keyword in ['processed', 'backup', 'output']):
            continue
        csv_files.append(str(file_path))
    
    return csv_files

def process_files_batch(files: list, config_file: str = None) -> dict:
    """Process multiple files in batch mode."""
    results = {
        'successful': [],
        'failed': [],
        'total_files': len(files),
        'total_records': 0
    }
    
    if not files:
        print("⚠️  No CSV files found to process.")
        return results
    
    print(f"📁 Found {len(files)} CSV files to process:")
    for i, file in enumerate(files, 1):
        print(f"  {i}. {file}")
    
    print("\n" + "="*60)
    print("STARTING BATCH PROCESSING")
    print("="*60)
    
    # Initialize processor
    try:
        processor = LeadsProcessor(config_file=config_file)
    except Exception as e:
        print(f"❌ Failed to initialize processor: {e}")
        return results
    
    # Process each file
    for i, file_path in enumerate(files, 1):
        print(f"\n📄 Processing file {i}/{len(files)}: {Path(file_path).name}")
        print("-" * 40)
        
        try:
            # Process the file
            output_file = processor.process_file(file_path)
            
            # Count records in output file
            import pandas as pd
            df = pd.read_csv(output_file)
            record_count = len(df)
            
            results['successful'].append({
                'input_file': file_path,
                'output_file': output_file,
                'records': record_count
            })
            results['total_records'] += record_count
            
            print(f"✅ Successfully processed: {record_count} records")
            
        except Exception as e:
            print(f"❌ Failed to process {file_path}: {e}")
            results['failed'].append({
                'input_file': file_path,
                'error': str(e)
            })
    
    return results

def print_batch_summary(results: dict):
    """Print a summary of batch processing results."""
    print("\n" + "="*60)
    print("BATCH PROCESSING SUMMARY")
    print("="*60)
    
    print(f"📊 Total files processed: {results['total_files']}")
    print(f"✅ Successful: {len(results['successful'])}")
    print(f"❌ Failed: {len(results['failed'])}")
    print(f"📈 Total records processed: {results['total_records']}")
    
    if results['successful']:
        print("\n🎉 Successfully processed files:")
        for item in results['successful']:
            file_name = Path(item['input_file']).name
            output_name = Path(item['output_file']).name
            print(f"  ✓ {file_name} → {output_name} ({item['records']} records)")
    
    if results['failed']:
        print("\n⚠️  Failed files:")
        for item in results['failed']:
            file_name = Path(item['input_file']).name
            print(f"  ✗ {file_name}: {item['error']}")
    
    print("="*60)

def main():
    """Main function for batch processing."""
    parser = argparse.ArgumentParser(
        description='Batch process multiple lead CSV files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python batch_processor.py data/input/
  python batch_processor.py . --config custom_config.json
  python batch_processor.py /path/to/files --config config.json
        """
    )
    
    parser.add_argument(
        'directory',
        nargs='?',
        default='.',
        help='Directory containing CSV files to process (default: current directory)'
    )
    
    parser.add_argument(
        '-c', '--config',
        help='Configuration file path (optional)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show files that would be processed without actually processing them'
    )
    
    args = parser.parse_args()
    
    print("🔄 Batch Leads Processing System")
    print("=" * 40)
    
    # Find CSV files
    csv_files = find_csv_files(args.directory)
    
    if not csv_files:
        print(f"⚠️  No CSV files found in directory: {args.directory}")
        print("Make sure the directory contains CSV files that are not already processed.")
        sys.exit(1)
    
    # Dry run mode
    if args.dry_run:
        print(f"🔍 DRY RUN MODE - Files that would be processed:")
        for i, file in enumerate(csv_files, 1):
            print(f"  {i}. {file}")
        print(f"\nTotal: {len(csv_files)} files")
        return
    
    # Confirm processing
    print(f"📁 Directory: {args.directory}")
    print(f"📄 Files found: {len(csv_files)}")
    if args.config:
        print(f"⚙️  Config file: {args.config}")
    
    response = input(f"\nProceed with processing {len(csv_files)} files? (y/n): ")
    if response.lower() != 'y':
        print("❌ Processing cancelled.")
        return
    
    # Process files
    try:
        results = process_files_batch(csv_files, args.config)
        print_batch_summary(results)
        
        if results['failed']:
            sys.exit(1)
        else:
            print("\n🎉 All files processed successfully!")
            
    except KeyboardInterrupt:
        print("\n⚠️  Processing interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error during batch processing: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
