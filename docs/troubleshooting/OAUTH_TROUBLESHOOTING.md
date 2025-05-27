# OAuth Troubleshooting Guide

## Current Issue: 400 Bad Request During Token Exchange

The application was experiencing repeated `400 Bad Request` errors during the OAuth token exchange process with Salesforce, specifically:

**Error:** "scope parameter not supported"
**Root Cause:** Salesforce OAuth token exchange requests must NOT include the `scope` parameter. The scope is only used in the authorization URL, not in the token exchange request.

## Fixes Implemented

### 1. **CRITICAL FIX: Removed Scope Parameter from Token Exchange**

- **Issue:** Salesforce OAuth token exchange requests reject the `scope` parameter
- **Fix:** Removed `scope: "api id web refresh_token"` from token exchange request
- **Result:** Token exchange now only includes required parameters: `code`, `redirect_uri`, `code_verifier`

### 2. Enhanced Error Logging

- Added detailed logging for token exchange parameters
- Logs all request parameters including redirect_uri, code_verifier, etc.
- Shows full error context and response body from Salesforce

### 3. Prevented Multiple Event Listeners

- Added `listenersSetup` flag to prevent duplicate OAuth event listeners
- Prevents multiple simultaneous callback processing with `isProcessingCallback` flag

### 4. Improved PKCE Handling

- Added validation for code verifier presence
- Clear code verifier after use (success or failure) to prevent reuse
- Enhanced logging for PKCE parameter lengths and values

### 5. Callback Deduplication

- Prevents multiple simultaneous OAuth callback processing
- Resets processing flag in finally block to ensure cleanup

### 6. Configuration Validation

- Added checks for OAuth2 client initialization
- Validates redirect URI configuration
- Enhanced logging for OAuth URL generation

## Testing Steps

### 1. Run Configuration Test

```bash
node test-oauth-config.js
```

This will validate:

- Environment variables are set correctly
- PKCE implementation works
- OAuth URL generation succeeds
- Redirect URI format is valid

### 2. Check Console Output During OAuth Flow

Look for these log messages in the console:

**Expected Success Flow:**

```text
Generating OAuth URL with parameters:
- redirect_uri: http://localhost:5173/oauth/callback
- code_challenge length: 43
- code_verifier length: 43

Processing OAuth callback URL: http://localhost:5173/oauth/callback?code=...

Token exchange request parameters:
- redirect_uri: http://localhost:5173/oauth/callback
- scope: NOT INCLUDED (Salesforce doesn't support scope in token exchange)
- code_verifier length: 43
- code length: [some number]
- client_id: 3MVG9Xl3BC...

Attempting token exchange with Salesforce...
Token data stored successfully
authStore observed salesforce:oauth-success: [tokenData]
App.jsx: Authentication state changed: { isAuthenticated: true, isAuthLoading: false, hasError: false }
```

**Error Indicators:**

```text
=== TOKEN EXCHANGE ERROR DETAILS ===
Error message: [specific error]
Error status: 400
Response body: [Salesforce error details]
```

## Common 400 Bad Request Causes

### 1. Scope Parameter in Token Exchange (FIXED)

**Problem:** Including `scope` parameter in token exchange request causes "scope parameter not supported" error.

**Solution:**

- ✅ **FIXED:** Removed scope parameter from token exchange request
- Scope is only used in authorization URL, not in token exchange
- Token exchange now only includes: `code`, `redirect_uri`, `code_verifier`

### 2. Redirect URI Mismatch

**Problem:** The redirect_uri in the token exchange request doesn't exactly match what's configured in Salesforce.

**Solution:**

⚠️ **For comprehensive redirect URI troubleshooting, see**: [OAuth Redirect URI Troubleshooting Guide](./OAUTH_REDIRECT_URI_TROUBLESHOOTING.md)

**Quick checks:**

- Verify Salesforce Connected App callback URLs include both development and production URLs
- Check environment variables are set correctly for your deployment environment
- Ensure frontend and backend use the same redirect URI

**Current expected configurations:**

- Development: `http://localhost:5173/oauth/callback`
- Production: `https://your-app-name.herokuapp.com/oauth/callback`

### 2. Invalid Authorization Code

**Problem:** The authorization code has expired or been used already.

**Solution:**

- Authorization codes expire quickly (usually 10 minutes)
- Ensure no duplicate callback processing
- Check for multiple event listeners

### 3. PKCE Verification Failure

**Problem:** The code_verifier doesn't match the code_challenge sent in the authorization request.

**Solution:**

- Ensure code_verifier is not being overwritten between requests
- Verify PKCE implementation generates correct challenge/verifier pairs

### 4. Invalid Client Credentials

**Problem:** Client ID or Client Secret is incorrect.

**Solution:**

- Verify credentials in .env file match Salesforce Connected App
- Check for extra spaces or quotes in environment variables

### 5. Scope Issues

**Problem:** Requested scopes are not enabled in the Connected App.

**Solution:**

- Ensure these scopes are enabled in your Salesforce Connected App:
  - `api` - Access and manage your data
  - `id` - Access your basic information
  - `web` - Access the identity URL service
  - `refresh_token` - Perform requests on your behalf at any time

## Salesforce Connected App Configuration

Ensure your Salesforce Connected App has these settings:

### OAuth Settings

- ✅ Enable OAuth Settings
- ✅ Enable for Device Flow
- ✅ Require Secret for Web Server Flow
- ✅ Enable PKCE

### Callback URL

- Must exactly match: `http://localhost:5173/oauth/callback`

### Selected OAuth Scopes

- Access your basic information (id)
- Access and manage your data (api)
- Access the identity URL service (web)
- Perform requests on your behalf at any time (refresh_token, offline_access)

## Next Steps for Debugging

1. **Run the configuration test:**

   ```bash
   node test-oauth-config.js
   ```

2. **Start the application with enhanced logging:**

   ```bash
   npm run dev
   ```

3. **Attempt OAuth login and check console for detailed error information**

4. **If 400 error persists, check the "Response body" in the error logs for specific Salesforce error details**

5. **Verify Salesforce Connected App configuration matches exactly**

## Environment Variables Reference

```env
SALESFORCE_CLIENT_ID="your_client_id_here"
SALESFORCE_CLIENT_SECRET="your_client_secret_here"
SALESFORCE_REDIRECT_URI="http://localhost:5173/oauth/callback"
SALESFORCE_LOGIN_URL="https://login.salesforce.com"  # Optional
```

## Contact Information

If the issue persists after following these steps, provide:

1. Output from `node test-oauth-config.js`
2. Console logs from the OAuth attempt
3. Salesforce Connected App configuration screenshots
4. The specific error message from the "Response body" in the logs
