# 🤖 Fine-Tuning System Deployment Guide

## Overview

This guide covers the deployment of the comprehensive fine-tuning system for the leads processing application. The system includes:

- **Database Models**: PostgreSQL tables for training data collection
- **Training Data Service**: Automated collection of field mappings and user corrections
- **Fine-Tuning Service**: Model improvement and dataset generation
- **Admin Dashboard**: Web interface for monitoring and management
- **API Endpoints**: RESTful APIs for training data operations

## 🚀 Quick Deployment (Heroku)

### Prerequisites

1. **Heroku PostgreSQL Add-on**: Already configured in your `app.json`
2. **OpenAI API Key**: Required for AI processing
3. **Existing Heroku App**: Your leads processing app

### Step 1: Deploy Updated Code

```bash
# Ensure you're in the project root
cd /path/to/your/leads-processing-app

# Add and commit the new fine-tuning code
git add .
git commit -m "Add fine-tuning system with admin dashboard"

# Deploy to Heroku
git push heroku main
```

### Step 2: Initialize Database

```bash
# Run the database initialization script
heroku run python backend/migrations/init_fine_tuning_db.py --init

# Check database status
heroku run python backend/migrations/init_fine_tuning_db.py --status
```

### Step 3: Verify Deployment

1. **Check Application Logs**:
   ```bash
   heroku logs --tail
   ```

2. **Test API Endpoints**:
   ```bash
   # Test training summary endpoint
   curl -H "Authorization: Bearer your-token" \
        https://your-app.herokuapp.com/api/v1/training/summary
   ```

3. **Access Admin Dashboard**:
   - Navigate to: `https://your-app.herokuapp.com/admin`
   - Login with your Salesforce credentials
   - Verify dashboard loads with training data summary

## 📊 Features Overview

### 1. Automated Training Data Collection

**What it does**: Automatically captures and stores:
- Original Excel files and their metadata
- AI-generated field mappings with confidence scores
- User corrections and feedback
- Processing statistics and API usage

**How it works**: 
- Every file upload is stored in the database
- Field mappings are captured during AI processing
- User corrections can be submitted via API
- Data is anonymized for privacy

### 2. Fine-Tuning Pipeline

**What it does**: 
- Generates training datasets from collected data
- Analyzes mapping patterns and identifies improvements
- Provides recommendations for model enhancement
- Tracks performance metrics over time

**Key Features**:
- Configurable confidence thresholds
- Automatic dataset versioning
- Quality scoring for training data
- Performance trend analysis

### 3. Admin Dashboard

**What it does**: Provides a comprehensive interface for:
- Viewing training data statistics
- Monitoring mapping accuracy
- Generating training datasets
- Reviewing improvement recommendations
- Analyzing field mapping patterns

**Access**: Navigate to `/admin` in your application

### 4. API Endpoints

**Training Data Management**:
- `GET /api/v1/training/summary` - Get training data statistics
- `POST /api/v1/training/corrections` - Submit user corrections
- `GET /api/v1/training/field-patterns` - Analyze mapping patterns

**Fine-Tuning Operations**:
- `POST /api/v1/training/generate-dataset` - Create training datasets
- `GET /api/v1/training/recommendations` - Get improvement suggestions

## 🔧 Configuration

### Environment Variables

The system uses your existing environment variables:

```bash
# Required (already configured)
DATABASE_URL=postgresql://...
OPENAI_API_KEY=your_openai_key

# Optional fine-tuning settings
TRAINING_DATA_RETENTION_DAYS=90  # How long to keep training files
MIN_CONFIDENCE_THRESHOLD=70      # Minimum confidence for training data
```

### Database Configuration

The system automatically creates these tables:
- `processing_jobs` - Processing job records
- `field_mappings` - AI field mapping results
- `user_corrections` - User feedback and corrections
- `file_uploads` - Original file metadata
- `training_datasets` - Generated training datasets
- `model_performance` - Performance tracking

## 📈 Usage Workflow

### 1. Data Collection (Automatic)

Every time a user uploads a file:
1. File metadata is stored in `file_uploads`
2. Processing job is created in `processing_jobs`
3. AI field mappings are stored in `field_mappings`
4. User corrections can be submitted to `user_corrections`

### 2. Training Dataset Generation

Administrators can generate training datasets:
1. Access Admin Dashboard (`/admin`)
2. Click "Generate Training Dataset"
3. Configure minimum confidence threshold
4. System creates dataset from high-quality mappings

### 3. Model Improvement

The system provides recommendations:
1. Analyzes mapping accuracy trends
2. Identifies problematic field types
3. Suggests data collection priorities
4. Tracks improvement over time

## 🛡️ Security & Privacy

### Data Protection

- **File Anonymization**: Personal data is anonymized in training datasets
- **Secure Storage**: Files stored with restricted access
- **Data Retention**: Configurable cleanup of old training data
- **Access Control**: Admin dashboard requires authentication

### Privacy Compliance

- Training data can be anonymized
- Original files can be automatically deleted after processing
- User corrections are stored without personal identifiers
- Audit trails for all training data operations

## 🔍 Monitoring & Maintenance

### Health Checks

```bash
# Check database connection
heroku run python -c "from models.database import check_db_connection; print('DB OK' if check_db_connection() else 'DB FAIL')"

# Check training data status
heroku run python backend/migrations/init_fine_tuning_db.py --status
```

### Performance Monitoring

The admin dashboard provides:
- Training data collection rates
- Mapping accuracy trends
- API usage statistics
- Storage utilization metrics

### Maintenance Tasks

```bash
# Clean up old training data (optional)
heroku run python -c "
from models.database import SessionLocal
from services.training_data_service import TrainingDataService
db = SessionLocal()
service = TrainingDataService(db)
cleaned = service.cleanup_old_training_data(days_to_keep=90)
print(f'Cleaned {cleaned} old files')
db.close()
"
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   ```bash
   # Check DATABASE_URL is set
   heroku config:get DATABASE_URL
   
   # Verify PostgreSQL add-on
   heroku addons
   ```

2. **Missing Tables**:
   ```bash
   # Reinitialize database
   heroku run python backend/migrations/init_fine_tuning_db.py --init --force
   ```

3. **Admin Dashboard Not Loading**:
   - Check authentication is working
   - Verify `/admin` route is accessible
   - Check browser console for errors

### Logs and Debugging

```bash
# View application logs
heroku logs --tail

# Check specific component logs
heroku logs --tail | grep "training"
heroku logs --tail | grep "fine-tuning"
```

## 📚 Next Steps

### Phase 2 Enhancements (Future)

1. **Advanced Analytics**: More detailed performance metrics
2. **Custom Model Training**: Integration with OpenAI fine-tuning API
3. **A/B Testing**: Compare different model versions
4. **Automated Retraining**: Scheduled model improvements
5. **Multi-tenant Support**: Separate training data per organization

### Integration Opportunities

1. **Salesforce Integration**: Store training insights in Salesforce
2. **Slack Notifications**: Alert on model performance changes
3. **Email Reports**: Weekly training data summaries
4. **API Webhooks**: Real-time training data events

## 🎯 Success Metrics

Track these KPIs to measure fine-tuning success:

- **Mapping Accuracy**: Target >90% for common field types
- **User Corrections**: Decreasing trend indicates improvement
- **Processing Speed**: Faster processing with better models
- **User Satisfaction**: Fewer manual corrections needed

---

**🎉 Congratulations!** Your fine-tuning system is now deployed and ready to continuously improve your leads processing accuracy through machine learning.
