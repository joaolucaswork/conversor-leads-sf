# OAuth Redirect URI Mismatch Fix - Implementation Summary

## Problem Identified

The Salesforce OAuth authentication was failing with a "redirect_uri_mismatch" error due to inconsistent redirect URI handling between development and production environments.

### Root Cause Analysis

1. **Backend Configuration**: Used hardcoded development fallback (`http://localhost:5173/oauth/callback`) even in production
2. **Frontend Configuration**: Dynamically generated production URL (`https://app-name.herokuapp.com/oauth/callback`) 
3. **Environment Variables**: Missing `SALESFORCE_REDIRECT_URI` in production deployment scripts
4. **Salesforce Connected App**: Potentially missing production callback URL configuration

## Solution Implemented

### 1. Backend Changes (`backend/main.py`)

**Enhanced `get_salesforce_oauth_config()` function:**
- Added environment-aware redirect URI detection
- Automatic production environment detection using:
  - `NODE_ENV=production`
  - `PYTHON_ENV=production` 
  - `PORT` environment variable (Heroku indicator)
- Dynamic Heroku URL generation using `HEROKU_APP_NAME` environment variable
- Fallback to development URL when not in production

**Updated OAuth config endpoint:**
- Now includes `redirect_uri` in the response for frontend consumption
- Ensures frontend and backend use identical redirect URIs

### 2. Frontend Changes (`src/utils/browserOAuth.js`)

**OAuth URL Generation:**
- Now uses redirect URI from backend configuration instead of hardcoded values
- Consistent redirect URI between authorization and token exchange requests

**Token Exchange:**
- Updated to fetch and use backend-provided redirect URI
- Enhanced logging for redirect URI verification

### 3. Deployment Script Updates

**Linux/Mac (`scripts/deploy-to-heroku.sh`):**
- Added `SALESFORCE_REDIRECT_URI` environment variable
- Added `HEROKU_APP_NAME` for automatic URL generation
- Dynamic redirect URI based on app name

**Windows (`scripts/deploy-to-heroku.bat`):**
- Added same environment variables as Linux script
- Consistent deployment configuration across platforms

### 4. Documentation Updates

**Heroku Deployment Guide (`HEROKU_DEPLOYMENT_GUIDE.md`):**
- Added Salesforce Connected App configuration section
- Detailed callback URL setup instructions
- Environment variable configuration for redirect URI

**App Configuration (`app.json`):**
- Added `SALESFORCE_REDIRECT_URI` and `HEROKU_APP_NAME` environment variables
- Proper descriptions for Heroku one-click deployment

### 5. Troubleshooting Documentation

**New Guide (`docs/troubleshooting/OAUTH_REDIRECT_URI_TROUBLESHOOTING.md`):**
- Comprehensive redirect URI troubleshooting guide
- Environment-specific diagnostic steps
- Fix procedures for common scenarios
- Verification checklist

**Updated Main Guide (`docs/troubleshooting/OAUTH_TROUBLESHOOTING.md`):**
- Added reference to new redirect URI troubleshooting guide
- Enhanced redirect URI mismatch section

## Environment-Specific Behavior

### Development Environment
- **Redirect URI**: `http://localhost:5173/oauth/callback`
- **Source**: `.env` file or automatic fallback
- **Detection**: Absence of production environment variables

### Production Environment (Heroku)
- **Redirect URI**: `https://{HEROKU_APP_NAME}.herokuapp.com/oauth/callback`
- **Source**: `SALESFORCE_REDIRECT_URI` environment variable or automatic generation
- **Detection**: Presence of `NODE_ENV=production`, `PYTHON_ENV=production`, or `PORT`

## Required Salesforce Configuration

The Salesforce Connected App must include both callback URLs:

```text
http://localhost:5173/oauth/callback
https://your-app-name.herokuapp.com/oauth/callback
```

**Configuration Steps:**
1. Login to [reino-capital.my.salesforce.com](https://reino-capital.my.salesforce.com)
2. Setup → App Manager → Edit "Leads Processing App"
3. Add both URLs to "Callback URL" field (one per line)
4. Save changes

## Deployment Instructions

### For New Deployments

```bash
# Using automated script (recommended)
npm run deploy:heroku your-app-name

# Manual deployment
heroku create your-app-name
heroku config:set SALESFORCE_REDIRECT_URI=https://your-app-name.herokuapp.com/oauth/callback
heroku config:set HEROKU_APP_NAME=your-app-name
# ... other environment variables
git push heroku main
```

### For Existing Deployments

```bash
# Update environment variables
heroku config:set SALESFORCE_REDIRECT_URI=https://your-app-name.herokuapp.com/oauth/callback --app your-app-name
heroku config:set HEROKU_APP_NAME=your-app-name --app your-app-name

# Restart application
heroku restart --app your-app-name
```

## Verification Steps

### 1. Backend Configuration Check
```bash
curl https://your-app-name.herokuapp.com/api/v1/oauth/config
```

Expected response should include:
```json
{
  "client_id": "3MVG9Xl3BC6VHB...",
  "redirect_uri": "https://your-app-name.herokuapp.com/oauth/callback",
  "login_url": "https://reino-capital.my.salesforce.com",
  "authorize_url": "https://reino-capital.my.salesforce.com/services/oauth2/authorize",
  "scope": "api id web refresh_token"
}
```

### 2. Frontend Console Verification
During OAuth flow, check browser console for:
```text
Browser OAuth: Using redirect URI: https://your-app-name.herokuapp.com/oauth/callback
Browser OAuth: Using redirect URI for token exchange: https://your-app-name.herokuapp.com/oauth/callback
```

### 3. Environment Variables Check
```bash
heroku config --app your-app-name | grep SALESFORCE
```

Should show:
```text
SALESFORCE_CLIENT_ID:     3MVG9Xl3BC6VHB...
SALESFORCE_CLIENT_SECRET: 4EBCE02C0690F74...
SALESFORCE_REDIRECT_URI:  https://your-app-name.herokuapp.com/oauth/callback
SALESFORCE_LOGIN_URL:     https://reino-capital.my.salesforce.com
```

## Testing Checklist

- [ ] Development OAuth works with `http://localhost:5173/oauth/callback`
- [ ] Production OAuth works with `https://app-name.herokuapp.com/oauth/callback`
- [ ] Backend `/api/v1/oauth/config` returns correct redirect URI for environment
- [ ] Frontend console shows matching redirect URIs
- [ ] Salesforce Connected App has both callback URLs configured
- [ ] No "redirect_uri_mismatch" errors in any environment

## Files Modified

### Core Implementation
- `backend/main.py` - Environment-aware redirect URI logic
- `src/utils/browserOAuth.js` - Consistent redirect URI usage

### Deployment Configuration  
- `scripts/deploy-to-heroku.sh` - Linux/Mac deployment script
- `scripts/deploy-to-heroku.bat` - Windows deployment script
- `app.json` - Heroku app configuration
- `HEROKU_DEPLOYMENT_GUIDE.md` - Updated deployment instructions

### Documentation
- `docs/troubleshooting/OAUTH_REDIRECT_URI_TROUBLESHOOTING.md` - New comprehensive guide
- `docs/troubleshooting/OAUTH_TROUBLESHOOTING.md` - Updated with redirect URI section
- `OAUTH_REDIRECT_URI_FIX_SUMMARY.md` - This summary document

## Benefits

1. **Automatic Environment Detection**: No manual configuration needed for different environments
2. **Consistent Redirect URIs**: Frontend and backend always use the same redirect URI
3. **Simplified Deployment**: Deployment scripts automatically set correct environment variables
4. **Comprehensive Documentation**: Clear troubleshooting guides for future issues
5. **Production Ready**: Works seamlessly in both development and Heroku production environments

## Future Considerations

1. **Multiple Environments**: The solution can be extended for staging environments by adding environment detection logic
2. **Custom Domains**: For custom domain deployments, set `SALESFORCE_REDIRECT_URI` explicitly
3. **Other Cloud Providers**: The environment detection logic can be adapted for AWS, Azure, etc.
4. **Security**: Consider implementing redirect URI validation for additional security
