# Salesforce Upload Connection Error - Diagnostic and Fix Guide

## Problem Summary

**Error**: `POST http://localhost:8000/api/v1/salesforce/upload net::ERR_CONNECTION_REFUSED`
**Function**: `uploadToSalesforceInBrowser` in browser environment
**Result**: Upload fails with "Failed to fetch" error

## Root Cause Analysis

The error indicates that the frontend cannot connect to the backend API server. This can happen for several reasons:

1. **Backend server not running**
2. **Wrong API base URL configuration**
3. **Port conflicts or firewall issues**
4. **CORS configuration problems**

## Diagnostic Steps

### Step 1: Check if Backend is Running

Run the diagnostic script to check backend connectivity:

```bash
# Run the diagnostic script
node scripts/diagnose-backend-connection.js
```

### Step 2: Manual Backend Check

Open your browser and navigate to:
- http://localhost:8000/docs (FastAPI documentation)
- http://localhost:8000/api/v1/health (Health check endpoint)

If these don't load, the backend is not running.

### Step 3: Check Browser Network Tab

1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try the Salesforce upload
4. Look for the failed request to see the exact error

## Fix Procedures

### Fix 1: Start the Backend Server

If the backend is not running, start it:

**Option A: Start Everything (Recommended)**
```bash
# From project root - starts backend, frontend, and Electron
npm run dev
```

**Option B: Start Backend Only**
```bash
# From project root
cd backend
python start_server.py
```

**Option C: Start Backend with Development Script**
```bash
# From project root
npm run dev:backend
```

### Fix 2: Verify Environment Variables

Check your `.env` file in the project root:

```env
# Frontend environment variables
VITE_API_BASE_URL=http://localhost:8000

# Backend environment variables
SALESFORCE_CLIENT_ID=3MVG9Xl3BC6VHB.ajXGO2p2AGuOr2p1I_mxjPmJw8uFTvwEI8rIePoU83kIrsyhrnpZT1K0YroRcMde21OIiy
SALESFORCE_CLIENT_SECRET=4EBCE02C0690F74155B64AED84DA821DA02966E0C041D6360C7ED8A29045A00E
SALESFORCE_REDIRECT_URI=http://localhost:5173/oauth/callback
SALESFORCE_LOGIN_URL=https://reino-capital.my.salesforce.com
```

### Fix 3: Check Port Conflicts

If port 8000 is in use by another application:

```bash
# Windows - Check what's using port 8000
netstat -ano | findstr :8000

# Mac/Linux - Check what's using port 8000
lsof -i :8000
```

If another process is using port 8000, either:
1. Stop that process
2. Change the backend port in `backend/start_server.py`

### Fix 4: Update API Base URL Configuration

If you need to use a different port, update the environment variable:

```bash
# In .env file
VITE_API_BASE_URL=http://localhost:8001
```

Then restart the frontend:
```bash
npm run dev:frontend
```

### Fix 5: CORS Configuration Check

Ensure the backend CORS configuration includes your frontend URL. In `backend/main.py`, verify:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    # ... rest of CORS config
)
```

## Testing the Fix

### 1. Verify Backend is Running

```bash
# Test health endpoint
curl http://localhost:8000/api/v1/health

# Expected response:
# {"message": "Leads Processing API is running", "version": "1.0.0"}
```

### 2. Test OAuth Configuration

```bash
# Test OAuth config endpoint
curl http://localhost:8000/api/v1/oauth/config

# Expected response should include redirect_uri
```

### 3. Test Salesforce Upload Endpoint

```bash
# Test upload endpoint (should return 422 validation error, which means it's working)
curl -X POST http://localhost:8000/api/v1/salesforce/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-token" \
  -d '{}'
```

### 4. Test in Browser

1. Open browser to http://localhost:5173
2. Complete OAuth authentication with Salesforce
3. Process a leads file
4. Try uploading to Salesforce
5. Check browser console for any remaining errors

## Advanced Troubleshooting

### Check Backend Logs

When running the backend, watch for error messages:

```bash
# Start backend with verbose logging
cd backend
python start_server.py
```

Look for:
- Import errors (missing dependencies)
- Port binding errors
- Salesforce integration errors

### Check Frontend Console

In browser Developer Tools Console, look for:
- Network connection errors
- CORS errors
- Authentication errors
- API response errors

### Verify Dependencies

Ensure all backend dependencies are installed:

```bash
cd backend
pip install -r requirements.txt
```

Ensure all frontend dependencies are installed:

```bash
npm install
```

## Prevention

### 1. Use Unified Development Startup

Always use the unified startup command to ensure all services start correctly:

```bash
npm run dev
```

### 2. Check Service Status

Before testing uploads, verify all services are running:
- Backend API: http://localhost:8000/docs
- Frontend: http://localhost:5173
- Electron (if using): Should open automatically

### 3. Monitor Logs

Keep terminal windows open to monitor logs from both frontend and backend during development.

## Quick Resolution Checklist

- [ ] Backend server is running on http://localhost:8000
- [ ] Frontend can access http://localhost:8000/api/v1/health
- [ ] OAuth authentication is working
- [ ] File processing is completing successfully
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows successful API requests

## Contact Support

If the issue persists after following this guide:

1. Run the diagnostic script: `node scripts/diagnose-backend-connection.js`
2. Provide the diagnostic output
3. Include browser console errors
4. Include backend terminal logs
5. Specify your operating system and Node.js version
