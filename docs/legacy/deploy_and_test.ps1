# 🚀 Deploy Fine-Tuning Fix and Test Script (PowerShell)
# This script deploys the fine-tuning data collection fix to Heroku and tests it

Write-Host "🚀 Deploying Fine-Tuning Data Collection Fix" -ForegroundColor Blue
Write-Host "==============================================" -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "backend/main.py")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

# Check if changes are committed
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warning "You have uncommitted changes. Please commit them first."
    Write-Host "Uncommitted files:"
    git status --porcelain
    exit 1
}

Write-Status "Starting deployment process..."

# Step 1: Deploy to Heroku
Write-Status "Deploying to Heroku..."
try {
    git push heroku private-product:main
    Write-Success "Deployment completed successfully"
} catch {
    Write-Error "Deployment failed: $_"
    exit 1
}

# Step 2: Wait for deployment to complete
Write-Status "Waiting for deployment to complete..."
Start-Sleep -Seconds 10

# Step 3: Check application status
Write-Status "Checking application status..."
try {
    $appStatus = heroku ps --app ia-reinocapital 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application is running"
        heroku ps --app ia-reinocapital
    } else {
        Write-Warning "Could not check application status"
    }
} catch {
    Write-Warning "Could not check application status (heroku CLI might not be configured)"
}

# Step 4: Check database connection
Write-Status "Checking database connection..."
try {
    $dbUrl = heroku config:get DATABASE_URL --app ia-reinocapital 2>$null
    if ($LASTEXITCODE -eq 0 -and $dbUrl) {
        Write-Success "Database URL is configured"
    } else {
        Write-Warning "Could not verify database configuration"
    }
} catch {
    Write-Warning "Could not verify database configuration"
}

# Step 5: Show recent logs
Write-Status "Showing recent application logs..."
Write-Host "Looking for fine-tuning related messages..."
try {
    $logs = heroku logs --lines 50 --app ia-reinocapital 2>$null
    $fineTuningLogs = $logs | Select-String -Pattern "fine-tuning|training|field mapping" -CaseSensitive:$false
    
    if ($fineTuningLogs) {
        Write-Success "Found fine-tuning related messages:"
        $fineTuningLogs | ForEach-Object { Write-Host $_.Line -ForegroundColor Green }
    } else {
        Write-Warning "No fine-tuning messages found in recent logs"
    }
} catch {
    Write-Warning "Could not retrieve logs"
}

# Step 6: Instructions for testing
Write-Host ""
Write-Host "🧪 TESTING INSTRUCTIONS" -ForegroundColor Blue
Write-Host "=======================" -ForegroundColor Blue
Write-Status "To test the fine-tuning data collection:"
Write-Host "1. Go to your application: https://ia.reinocapital.com.br"
Write-Host "2. Upload and process a new file with AI enhancement enabled"
Write-Host "3. Check the logs for these messages:"
Write-Host "   - [INFO] Training data stored for processing job <id>"
Write-Host "   - [INFO] Stored X field mappings for fine-tuning"
Write-Host "   - [INFO] Updated processing job status and AI statistics for fine-tuning"

Write-Host ""
Write-Host "📊 MONITORING COMMANDS" -ForegroundColor Blue
Write-Host "=====================" -ForegroundColor Blue
Write-Host "# Watch real-time logs:"
Write-Host "heroku logs --tail --app ia-reinocapital" -ForegroundColor Gray
Write-Host ""
Write-Host "# Check for fine-tuning messages:"
Write-Host "heroku logs --lines 100 --app ia-reinocapital | Select-String 'fine-tuning|training'" -ForegroundColor Gray
Write-Host ""
Write-Host "# Access admin dashboard:"
Write-Host "https://ia.reinocapital.com.br/admin" -ForegroundColor Gray

Write-Host ""
Write-Host "🔍 VERIFICATION CHECKLIST" -ForegroundColor Blue
Write-Host "=========================" -ForegroundColor Blue
Write-Host "After processing a file, verify:"
Write-Host "□ File processes successfully"
Write-Host "□ Fine-tuning log messages appear"
Write-Host "□ No error messages in logs"
Write-Host "□ Admin dashboard shows new training data"

Write-Host ""
Write-Success "Deployment completed! Please test by processing a new file."
Write-Status "Monitor the logs to verify fine-tuning data collection is working."
