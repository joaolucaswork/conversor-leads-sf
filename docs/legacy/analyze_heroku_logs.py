#!/usr/bin/env python3
"""
Script to analyze Heroku logs and check for fine-tuning data collection.
"""

import re
from datetime import datetime

def analyze_logs():
    """Analyze the provided Heroku logs for fine-tuning data collection."""
    
    # Sample logs from the user's message
    sample_logs = """
2025-05-27T21:17:14.148213+00:00 app[web.1]: [SUCCESS] File processing completed: /app/data/output/Leads - 19 de Mai de 25 (1)_processed_34ad5858-d8fa-4745-801f-35cf41aae3fa.csv
2025-05-27T21:17:14.148213+00:00 app[web.1]: [INFO] Processed 150 records
2025-05-27T21:17:14.386348+00:00 app[web.1]: 45.235.2.209:0 - "GET /api/v1/leads/status/34ad5858-d8fa-4745-801f-35cf41aae3fa HTTP/1.1" 200
2025-05-27T21:17:15.562837+00:00 heroku[router]: at=info method=GET path="/api/v1/leads/history?page=1&limit=50" host=ia.reinocapital.com.br request_id=fec27cf5-ab1b-2497-6f71-7c2731c1344d fwd="45.235.2.209" dyno=web.1 connect=0ms service=1ms status=200 bytes=974 protocol=http2.0 tls=true tls_version=tls1.3
2025-05-27T21:17:15.561915+00:00 app[web.1]: [INFO] Processing history request - Page: 1, Limit: 50
2025-05-27T21:17:15.561942+00:00 app[web.1]: [INFO] Token received: 00DHp00000DynwY!AQEA...
2025-05-27T21:17:15.561942+00:00 app[web.1]: [INFO] Returning 2 items out of 2 total
2025-05-27T21:17:15.562330+00:00 app[web.1]: 45.235.2.209:0 - "GET /api/v1/leads/history?page=1&limit=50 HTTP/1.1" 200
"""
    
    print("🔍 Analyzing Heroku Logs for Fine-Tuning Data Collection")
    print("=" * 60)
    
    # Look for key indicators
    indicators = {
        "file_processing_completed": r"\[SUCCESS\] File processing completed:",
        "records_processed": r"\[INFO\] Processed (\d+) records",
        "training_data_stored": r"\[INFO\] Training data stored for processing job",
        "field_mappings_stored": r"\[INFO\] Stored (\d+) field mappings for fine-tuning",
        "job_status_updated": r"\[INFO\] Updated processing job status and AI statistics for fine-tuning",
        "fine_tuning_warning": r"\[WARNING\] Failed to store fine-tuning data:",
        "database_error": r"Database.*error|database.*failed",
    }
    
    findings = {}
    
    for key, pattern in indicators.items():
        matches = re.findall(pattern, sample_logs, re.IGNORECASE)
        findings[key] = matches
    
    # Analysis
    print("📊 Log Analysis Results:")
    print("-" * 30)
    
    # Check if file processing is working
    if findings["file_processing_completed"]:
        print("✅ File processing is working")
        processing_id = "34ad5858-d8fa-4745-801f-35cf41aae3fa"  # From the logs
        print(f"   📁 Latest processed file ID: {processing_id}")
    else:
        print("❌ No file processing completion found")
    
    # Check record count
    if findings["records_processed"]:
        record_count = findings["records_processed"][0]
        print(f"✅ Records processed: {record_count}")
    else:
        print("❌ No record count information found")
    
    # Check fine-tuning data collection
    print(f"\n🎯 Fine-Tuning Data Collection Status:")
    
    if findings["training_data_stored"]:
        print("✅ Training data storage is working")
    else:
        print("❌ No training data storage messages found")
    
    if findings["field_mappings_stored"]:
        mapping_count = findings["field_mappings_stored"][0] if findings["field_mappings_stored"] else "unknown"
        print(f"✅ Field mappings stored: {mapping_count}")
    else:
        print("❌ No field mapping storage messages found")
    
    if findings["job_status_updated"]:
        print("✅ Processing job status updates working")
    else:
        print("❌ No job status update messages found")
    
    # Check for errors
    print(f"\n⚠️  Error Analysis:")
    
    if findings["fine_tuning_warning"]:
        print("⚠️  Fine-tuning storage warnings found")
        for warning in findings["fine_tuning_warning"]:
            print(f"   - {warning}")
    else:
        print("✅ No fine-tuning storage warnings")
    
    if findings["database_error"]:
        print("❌ Database errors found")
        for error in findings["database_error"]:
            print(f"   - {error}")
    else:
        print("✅ No database errors detected")
    
    # Recommendations
    print(f"\n💡 Recommendations:")
    
    missing_indicators = []
    if not findings["training_data_stored"]:
        missing_indicators.append("training data storage")
    if not findings["field_mappings_stored"]:
        missing_indicators.append("field mapping storage")
    if not findings["job_status_updated"]:
        missing_indicators.append("job status updates")
    
    if missing_indicators:
        print("❌ Missing fine-tuning indicators:")
        for indicator in missing_indicators:
            print(f"   - {indicator}")
        
        print(f"\n🔧 Troubleshooting steps:")
        print("1. Check if the database is properly connected in Heroku")
        print("2. Verify that the fine-tuning code changes have been deployed")
        print("3. Process a new file and check the logs for fine-tuning messages")
        print("4. Check Heroku config vars for DATABASE_URL")
        print("5. Run database migrations if needed")
    else:
        print("✅ All fine-tuning indicators present - system appears to be working")
    
    return findings

def check_expected_log_messages():
    """Show what log messages we should expect to see."""
    print(f"\n📋 Expected Log Messages for Working Fine-Tuning:")
    print("-" * 50)
    
    expected_messages = [
        "[INFO] Training data stored for processing job <processing_id>",
        "[INFO] Stored X field mappings for fine-tuning",
        "[INFO] Updated processing job status and AI statistics for fine-tuning",
        "[SUCCESS] File processing completed: <file_path>",
        "[INFO] Processed X records"
    ]
    
    print("When fine-tuning data collection is working, you should see:")
    for i, message in enumerate(expected_messages, 1):
        print(f"{i}. {message}")
    
    print(f"\n⚠️  Warning messages to watch for:")
    warning_messages = [
        "[WARNING] Failed to store training data: <error>",
        "[WARNING] Failed to store fine-tuning data: <error>",
        "[WARNING] Could not count records for fine-tuning: <error>"
    ]
    
    for i, message in enumerate(warning_messages, 1):
        print(f"{i}. {message}")

def main():
    """Main analysis function."""
    findings = analyze_logs()
    check_expected_log_messages()
    
    print(f"\n" + "=" * 60)
    print("📝 Summary:")
    
    # Count positive indicators
    positive_count = 0
    total_indicators = 5  # training_data_stored, field_mappings_stored, job_status_updated, file_processing_completed, records_processed
    
    if findings["file_processing_completed"]:
        positive_count += 1
    if findings["records_processed"]:
        positive_count += 1
    if findings["training_data_stored"]:
        positive_count += 1
    if findings["field_mappings_stored"]:
        positive_count += 1
    if findings["job_status_updated"]:
        positive_count += 1
    
    percentage = (positive_count / total_indicators) * 100
    
    print(f"Fine-tuning readiness: {positive_count}/{total_indicators} indicators present ({percentage:.0f}%)")
    
    if percentage >= 80:
        print("🎉 Fine-tuning data collection appears to be working well!")
    elif percentage >= 60:
        print("⚠️  Fine-tuning data collection is partially working - some issues to address")
    else:
        print("❌ Fine-tuning data collection needs attention - multiple issues detected")

if __name__ == "__main__":
    main()
