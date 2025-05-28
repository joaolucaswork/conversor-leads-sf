# Quick Start Troubleshooting Guide

## 🚨 "Failed to fetch" Error When Uploading to Salesforce

If you're getting a `POST http://localhost:8000/api/v1/salesforce/upload net::ERR_CONNECTION_REFUSED` error, follow these steps:

### Step 1: Check if Backend is Running ⚡

**Quick Check:**
Open your browser and go to: http://localhost:8000/docs

- ✅ **If it loads**: Backend is running, go to Step 3
- ❌ **If it doesn't load**: Backend is not running, continue to Step 2

### Step 2: Start the Backend Server 🚀

**Option A: Start Everything (Recommended)**
```bash
npm run dev
```
This starts both frontend and backend servers.

**Option B: Start Backend Only**
```bash
npm run dev:backend
```

**Option C: Manual Backend Start**
```bash
cd backend
python start_server.py
```

### Step 3: Verify Backend is Working 🔍

Run the diagnostic tool:
```bash
npm run diagnose
```

This will check:
- ✅ Backend connectivity
- ✅ API endpoints
- ✅ Environment configuration

### Step 4: Test the Upload Again 🎯

1. Go to http://localhost:5173
2. Login with Salesforce OAuth
3. Process a leads file
4. Try uploading to Salesforce

## Common Issues and Quick Fixes

### Issue: Port 8000 Already in Use
**Error**: `Address already in use`

**Fix**: Kill the process using port 8000
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID_NUMBER>
```

### Issue: Python Not Found
**Error**: `python: command not found`

**Fix**: Install Python or use python3
```bash
# Try python3 instead
cd backend
python3 start_server.py

# Or install Python from python.org
```

### Issue: Missing Dependencies
**Error**: `ModuleNotFoundError`

**Fix**: Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Issue: Frontend Can't Connect
**Error**: `VITE_API_BASE_URL not set`

**Fix**: Check your .env file
```env
VITE_API_BASE_URL=http://localhost:8000
```

## Environment Setup Checklist

- [ ] Node.js installed (v16 or higher)
- [ ] Python installed (v3.8 or higher)
- [ ] All npm dependencies installed (`npm install`)
- [ ] All Python dependencies installed (`pip install -r backend/requirements.txt`)
- [ ] `.env` file exists with correct variables
- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 5173

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start everything (frontend + backend + electron) |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run diagnose` | Run connection diagnostic |
| `npm install` | Install frontend dependencies |
| `pip install -r backend/requirements.txt` | Install backend dependencies |

## Still Having Issues?

### 1. Check Browser Console
- Open Developer Tools (F12)
- Go to Console tab
- Look for detailed error messages

### 2. Check Network Tab
- Open Developer Tools (F12)
- Go to Network tab
- Try the upload again
- Look for failed requests

### 3. Check Backend Logs
- Look at the terminal where you started the backend
- Check for error messages or stack traces

### 4. Run Full Diagnostic
```bash
npm run diagnose
```

### 5. Restart Everything
```bash
# Stop all processes (Ctrl+C in terminals)
# Then restart
npm run dev
```

## Getting Help

If none of these steps work:

1. **Run the diagnostic**: `npm run diagnose`
2. **Copy the output** and any error messages
3. **Include your system info**:
   - Operating System
   - Node.js version (`node --version`)
   - Python version (`python --version`)
4. **Describe what you were trying to do** when the error occurred

## Success Indicators

You'll know everything is working when:

- ✅ http://localhost:8000/docs loads (backend running)
- ✅ http://localhost:5173 loads (frontend running)
- ✅ OAuth login to Salesforce works
- ✅ File processing completes successfully
- ✅ Upload to Salesforce works without errors
- ✅ Browser console shows no connection errors

## Pro Tips

1. **Always use `npm run dev`** to start everything at once
2. **Keep terminal windows open** to monitor logs
3. **Check the diagnostic tool first** when troubleshooting
4. **Restart services** if you change environment variables
5. **Use the browser's Network tab** to debug API calls
