@echo off
REM Heroku Deployment Script for Leads Processing System (Windows)
REM This script automates the deployment process to Heroku

setlocal enabledelayedexpansion

echo ==========================================
echo   Heroku Deployment Script
echo   Leads Processing System
echo ==========================================
echo.

REM Check if Heroku CLI is installed
heroku --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Heroku CLI is not installed. Please install it from https://devcenter.heroku.com/articles/heroku-cli
    pause
    exit /b 1
)
echo [SUCCESS] Heroku CLI is installed

REM Check if user is logged in to Heroku
heroku auth:whoami >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Not logged in to Heroku. Please run 'heroku login' first.
    pause
    exit /b 1
)
echo [SUCCESS] Logged in to Heroku

REM Get app name from user
if "%1"=="" (
    set /p APP_NAME="Enter your Heroku app name: "
) else (
    set APP_NAME=%1
)

if "!APP_NAME!"=="" (
    echo [ERROR] App name is required
    pause
    exit /b 1
)

echo [INFO] Using app name: !APP_NAME!

REM Create Heroku app if it doesn't exist
heroku apps:info !APP_NAME! >nul 2>&1
if errorlevel 1 (
    echo [INFO] Creating new Heroku app: !APP_NAME!
    heroku create !APP_NAME!
    echo [SUCCESS] Created app: !APP_NAME!
) else (
    echo [SUCCESS] App '!APP_NAME!' already exists
)

REM Set up buildpacks
echo [INFO] Setting up buildpacks...
heroku buildpacks:clear --app !APP_NAME! >nul 2>&1
heroku buildpacks:add heroku/nodejs --app !APP_NAME!
heroku buildpacks:add heroku/python --app !APP_NAME!
echo [SUCCESS] Buildpacks configured

REM Get OpenAI API key from user
set /p OPENAI_API_KEY="Enter your OpenAI API key: "
if "!OPENAI_API_KEY!"=="" (
    echo [ERROR] OpenAI API key is required
    pause
    exit /b 1
)

REM Set environment variables
echo [INFO] Setting up environment variables...
heroku config:set NODE_ENV=production PYTHON_ENV=production OPENAI_API_KEY=!OPENAI_API_KEY! SALESFORCE_CLIENT_ID=3MVG9Xl3BC6VHB.ajXGO2p2AGuOr2p1I_mxjPmJw8uFTvwEI8rIePoU83kIrsyhrnpZT1K0YroRcMde21OIiy SALESFORCE_CLIENT_SECRET=4EBCE02C0690F74155B64AED84DA821DA02966E0C041D6360C7ED8A29045A00E SALESFORCE_REDIRECT_URI=https://!APP_NAME!.herokuapp.com/oauth/callback SALESFORCE_LOGIN_URL=https://reino-capital.my.salesforce.com HEROKU_APP_NAME=!APP_NAME! WEB_CONCURRENCY=1 DEBUG=False --app !APP_NAME!
echo [SUCCESS] Environment variables configured

REM Add Heroku remote if it doesn't exist
git remote get-url heroku >nul 2>&1
if errorlevel 1 (
    heroku git:remote --app !APP_NAME!
    echo [INFO] Added Heroku git remote
)

REM Deploy to Heroku
echo [INFO] Deploying to Heroku...
git push heroku main
echo [SUCCESS] Deployment completed

REM Verify deployment
echo [INFO] Verifying deployment...
timeout /t 10 /nobreak >nul

heroku ps --app !APP_NAME! | findstr "up" >nul
if not errorlevel 1 (
    echo [SUCCESS] App is running

    REM Get app URL
    for /f "tokens=3" %%i in ('heroku info --app !APP_NAME! ^| findstr "Web URL"') do set APP_URL=%%i
    echo [SUCCESS] App is available at: !APP_URL!
) else (
    echo [WARNING] App may not be running properly. Check logs with: heroku logs --tail --app !APP_NAME!
)

echo.
echo ==========================================
echo [SUCCESS] Deployment completed successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Visit your app: https://!APP_NAME!.herokuapp.com
echo 2. Test the API: https://!APP_NAME!.herokuapp.com/api/v1/health
echo 3. Monitor logs: heroku logs --tail --app !APP_NAME!
echo 4. Scale if needed: heroku ps:scale web=1:standard-1x --app !APP_NAME!
echo.

pause
