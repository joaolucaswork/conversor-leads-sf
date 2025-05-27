# OAuth Redirect URI Troubleshooting Guide

## Overview

This guide helps resolve "redirect_uri_mismatch" errors in the Leads Processing System OAuth flow.

## Common Error Messages

- `redirect_uri_mismatch`
- `invalid_request: redirect_uri value is invalid`
- `OAuth authorization error: redirect_uri_mismatch`

## Root Cause Analysis

The redirect URI mismatch occurs when:

1. **Frontend sends one redirect URI** to Salesforce during OAuth initiation
2. **Backend uses a different redirect URI** during token exchange
3. **Salesforce Connected App** expects specific callback URLs

## Environment-Specific Redirect URIs

### Development Environment
- **Expected URI**: `http://localhost:5173/oauth/callback`
- **Source**: `.env` file or fallback configuration

### Production Environment (Heroku)
- **Expected URI**: `https://your-app-name.herokuapp.com/oauth/callback`
- **Source**: `SALESFORCE_REDIRECT_URI` environment variable

## Diagnostic Steps

### 1. Check Current Configuration

**Backend Configuration:**
```bash
# Check what redirect URI the backend is using
curl https://your-app-name.herokuapp.com/api/v1/oauth/config
```

**Environment Variables:**
```bash
# Check Heroku environment variables
heroku config --app your-app-name | grep SALESFORCE
```

### 2. Verify Frontend Behavior

Open browser developer tools and check console logs during OAuth flow:
- Look for "Browser OAuth: Using redirect URI:" messages
- Verify the redirect URI matches the backend configuration

### 3. Check Salesforce Connected App

1. Login to [reino-capital.my.salesforce.com](https://reino-capital.my.salesforce.com)
2. Go to Setup → App Manager
3. Find "Leads Processing App" → Edit
4. Check "Callback URL" field contains both:
   - `http://localhost:5173/oauth/callback` (development)
   - `https://your-app-name.herokuapp.com/oauth/callback` (production)

## Fix Procedures

### Fix 1: Update Heroku Environment Variables

```bash
# Set the correct redirect URI for production
heroku config:set SALESFORCE_REDIRECT_URI=https://your-app-name.herokuapp.com/oauth/callback --app your-app-name

# Set the app name for automatic URI generation
heroku config:set HEROKU_APP_NAME=your-app-name --app your-app-name

# Restart the app
heroku restart --app your-app-name
```

### Fix 2: Update Salesforce Connected App

1. **Access Salesforce Setup**:
   - Login to [reino-capital.my.salesforce.com](https://reino-capital.my.salesforce.com)
   - Click gear icon → Setup

2. **Find Connected App**:
   - Quick Find: "App Manager"
   - Locate "Leads Processing App"
   - Click dropdown → Edit

3. **Update Callback URLs**:
   - In "Callback URL" field, add both URLs (one per line):
   ```text
   http://localhost:5173/oauth/callback
   https://your-app-name.herokuapp.com/oauth/callback
   ```

4. **Save Changes**: Click "Save"

### Fix 3: Verify Backend Configuration

The backend now automatically detects the environment and uses the appropriate redirect URI:

- **Development**: Uses `http://localhost:5173/oauth/callback`
- **Production**: Uses `https://{HEROKU_APP_NAME}.herokuapp.com/oauth/callback`

## Testing the Fix

### 1. Test Development Environment

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
# Try OAuth login and check console logs
```

### 2. Test Production Environment

```bash
# Deploy to Heroku
git push heroku main

# Open production app
heroku open --app your-app-name

# Try OAuth login and check browser console
```

## Verification Checklist

- [ ] Backend `/api/v1/oauth/config` returns correct redirect URI
- [ ] Frontend console shows matching redirect URI
- [ ] Salesforce Connected App has both callback URLs
- [ ] Heroku environment variables are set correctly
- [ ] OAuth login works in both development and production

## Advanced Debugging

### Enable Detailed Logging

Add these environment variables for more detailed OAuth logging:

```bash
heroku config:set DEBUG_OAUTH=true --app your-app-name
```

### Check Network Requests

In browser developer tools:
1. Go to Network tab
2. Attempt OAuth login
3. Check the OAuth authorization request URL
4. Verify `redirect_uri` parameter matches expected value

### Manual Token Exchange Test

```bash
# Test token exchange endpoint directly
curl -X POST https://your-app-name.herokuapp.com/api/v1/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code",
    "code_verifier": "test_verifier",
    "redirect_uri": "https://your-app-name.herokuapp.com/oauth/callback"
  }'
```

## Prevention

### For New Deployments

1. **Always set redirect URI environment variable**:
   ```bash
   heroku config:set SALESFORCE_REDIRECT_URI=https://your-app-name.herokuapp.com/oauth/callback
   ```

2. **Update Salesforce Connected App before first OAuth test**

3. **Use deployment scripts** that automatically set correct environment variables

### For Development

1. **Keep `.env` file updated** with correct development redirect URI
2. **Test OAuth flow** after any environment changes
3. **Check console logs** for redirect URI mismatches

## Contact Support

If issues persist after following this guide:

1. **Collect diagnostic information**:
   - Backend OAuth config response
   - Frontend console logs
   - Heroku environment variables
   - Salesforce Connected App callback URLs

2. **Provide error details**:
   - Exact error message
   - Environment (development/production)
   - Steps to reproduce

3. **Include configuration**:
   - Heroku app name
   - Deployment method used
   - Recent changes made
