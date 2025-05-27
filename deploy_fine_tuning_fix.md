# 🚀 Deploy Fine-Tuning Data Collection Fix

## Overview

This guide will help you deploy the fix for fine-tuning data collection to Heroku. The issue was that processed files were not being stored in the database for algorithm improvement.

## What Was Fixed

### 1. **Field Mapping Storage** 
- AI-generated field mappings are now stored in the database after processing
- Includes confidence scores, reasoning, and mapping methods

### 2. **Processing Job Updates**
- Database records are updated when processing completes
- AI statistics and API usage data are stored
- Record counts and completion timestamps are tracked

### 3. **Error Handling**
- Proper error handling for database operations
- Graceful fallback if fine-tuning storage fails
- Detailed logging for troubleshooting

## Files Modified

- `backend/main.py` - Added fine-tuning data collection in background processing
- `backend/services/training_data_service.py` - Added `update_processing_job` method
- `core/master_leads_processor_ai.py` - Store field mappings for data collection

## Deployment Steps

### Step 1: Push Changes to Heroku

```bash
# Push the committed changes to Heroku
git push heroku private-product:main
```

### Step 2: Verify Database Tables

The fine-tuning system uses these database tables:
- `processing_jobs` - Processing job records
- `field_mappings` - AI field mapping results  
- `file_uploads` - Original file metadata
- `user_corrections` - User feedback
- `training_datasets` - Generated training datasets
- `model_performance` - Performance tracking

These should already exist from the previous fine-tuning system deployment.

### Step 3: Test the Fix

After deployment, process a new file and check the logs for these messages:

**Expected Success Messages:**
```
[INFO] Training data stored for processing job <processing_id>
[INFO] Stored X field mappings for fine-tuning
[INFO] Updated processing job status and AI statistics for fine-tuning
```

**Warning Messages to Watch For:**
```
[WARNING] Failed to store fine-tuning data: <error>
[WARNING] Could not count records for fine-tuning: <error>
```

### Step 4: Monitor Heroku Logs

```bash
# Watch real-time logs
heroku logs --tail --app your-app-name

# Check recent logs
heroku logs --lines 100 --app your-app-name
```

### Step 5: Verify Data Collection

Use the admin dashboard to verify data is being collected:
- Navigate to `/admin` in your application
- Check training data summary
- Verify field mapping patterns
- Review processing job statistics

## Troubleshooting

### If Fine-Tuning Messages Don't Appear

1. **Check Database Connection**
   ```bash
   heroku config:get DATABASE_URL --app your-app-name
   ```

2. **Check Database Tables**
   ```bash
   heroku pg:psql --app your-app-name
   \dt  # List tables
   SELECT COUNT(*) FROM processing_jobs;
   ```

3. **Check Application Logs**
   ```bash
   heroku logs --tail --app your-app-name | grep -i "fine-tuning\|training"
   ```

### If Database Errors Occur

1. **Run Database Migrations**
   ```bash
   heroku run python -c "
   from backend.models.database import engine
   from backend.models.training_data import Base
   Base.metadata.create_all(bind=engine)
   print('Database tables created/updated')
   " --app your-app-name
   ```

2. **Check Database Status**
   ```bash
   heroku pg:info --app your-app-name
   ```

### If Processing Fails

1. **Check Environment Variables**
   ```bash
   heroku config --app your-app-name
   ```

2. **Check Application Status**
   ```bash
   heroku ps --app your-app-name
   ```

## Verification Checklist

After deployment, verify these items:

- [ ] Application deploys successfully
- [ ] File processing still works normally
- [ ] Fine-tuning log messages appear
- [ ] Database records are created
- [ ] Admin dashboard shows training data
- [ ] No error messages in logs

## Expected Log Output

When working correctly, you should see logs like this:

```
[INFO] Training data stored for processing job abc123
[INFO] Stored 8 field mappings for fine-tuning
[INFO] Updated processing job status and AI statistics for fine-tuning
[SUCCESS] File processing completed: /app/data/output/file_processed.csv
[INFO] Processed 150 records
```

## Next Steps

Once the fix is deployed and working:

1. **Monitor Data Collection** - Check that new files generate training data
2. **Review Admin Dashboard** - Use `/admin` to monitor training data quality
3. **Generate Training Datasets** - Use the fine-tuning API to create training datasets
4. **Analyze Patterns** - Review field mapping patterns for improvement opportunities

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Heroku logs for specific error messages
3. Use the admin dashboard to verify database state
4. Test with a small sample file first

The fine-tuning system is now properly collecting data from processed files for algorithm improvement!
