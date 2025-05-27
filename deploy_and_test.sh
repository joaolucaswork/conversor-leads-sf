#!/bin/bash

# 🚀 Deploy Fine-Tuning Fix and Test Script
# This script deploys the fine-tuning data collection fix to Heroku and tests it

set -e  # Exit on any error

echo "🚀 Deploying Fine-Tuning Data Collection Fix"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend/main.py" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if changes are committed
if ! git diff --quiet HEAD; then
    print_warning "You have uncommitted changes. Please commit them first."
    echo "Uncommitted files:"
    git status --porcelain
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Deploy to Heroku
print_status "Deploying to Heroku..."
if git push heroku private-product:main; then
    print_success "Deployment completed successfully"
else
    print_error "Deployment failed"
    exit 1
fi

# Step 2: Wait for deployment to complete
print_status "Waiting for deployment to complete..."
sleep 10

# Step 3: Check application status
print_status "Checking application status..."
if heroku ps --app ia-reinocapital > /dev/null 2>&1; then
    print_success "Application is running"
    heroku ps --app ia-reinocapital
else
    print_warning "Could not check application status (heroku CLI might not be configured)"
fi

# Step 4: Check database connection
print_status "Checking database connection..."
if heroku config:get DATABASE_URL --app ia-reinocapital > /dev/null 2>&1; then
    print_success "Database URL is configured"
else
    print_warning "Could not verify database configuration"
fi

# Step 5: Show recent logs
print_status "Showing recent application logs..."
echo "Looking for fine-tuning related messages..."
heroku logs --lines 50 --app ia-reinocapital | grep -i "fine-tuning\|training\|field mapping" || print_warning "No fine-tuning messages found in recent logs"

# Step 6: Instructions for testing
echo ""
echo "🧪 TESTING INSTRUCTIONS"
echo "======================="
print_status "To test the fine-tuning data collection:"
echo "1. Go to your application: https://ia.reinocapital.com.br"
echo "2. Upload and process a new file with AI enhancement enabled"
echo "3. Check the logs for these messages:"
echo "   - [INFO] Training data stored for processing job <id>"
echo "   - [INFO] Stored X field mappings for fine-tuning"
echo "   - [INFO] Updated processing job status and AI statistics for fine-tuning"

echo ""
echo "📊 MONITORING COMMANDS"
echo "====================="
echo "# Watch real-time logs:"
echo "heroku logs --tail --app ia-reinocapital"
echo ""
echo "# Check for fine-tuning messages:"
echo "heroku logs --lines 100 --app ia-reinocapital | grep -i 'fine-tuning\\|training'"
echo ""
echo "# Access admin dashboard:"
echo "https://ia.reinocapital.com.br/admin"

echo ""
echo "🔍 VERIFICATION CHECKLIST"
echo "========================="
echo "After processing a file, verify:"
echo "□ File processes successfully"
echo "□ Fine-tuning log messages appear"
echo "□ No error messages in logs"
echo "□ Admin dashboard shows new training data"

echo ""
print_success "Deployment completed! Please test by processing a new file."
print_status "Monitor the logs to verify fine-tuning data collection is working."
