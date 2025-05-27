# 🚀 Development Setup Guide

## Quick Start - Single Command Development

You can now start the entire development environment with a single command!

### Option 1: Full Development Environment (Recommended)
```bash
npm run dev
```
This starts:
- ✅ Backend API Server (http://localhost:8000)
- ✅ Frontend Vite Server (http://localhost:5173)  
- ✅ Electron Desktop App

### Option 2: Servers Only (No Electron)
```bash
npm run dev:servers
```
This starts:
- ✅ Backend API Server (http://localhost:8000)
- ✅ Frontend Vite Server (http://localhost:5173)

### Option 3: Platform-Specific Scripts

**Windows:**
```cmd
start_dev.bat
```

**Linux/Mac:**
```bash
./start_dev.sh
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start full development environment (Backend + Frontend + Electron) |
| `npm run dev:servers` | Start only Backend + Frontend servers |
| `npm run dev:full` | Same as `npm run dev` (explicit full environment) |
| `npm run backend` | Start only the backend server |
| `npm run frontend` | Start only the frontend server |
| `npm run build` | Build the frontend for production |
| `npm run electron:build` | Build Electron app for distribution |

## 🎯 Server Information

### Backend API Server
- **URL**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Interactive API**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/health

### Frontend Development Server
- **URL**: http://localhost:5173
- **Hot Reload**: ✅ Enabled
- **Environment**: Development mode with debugging

### Electron Desktop App
- **Automatically opens** when using `npm run dev`
- **Window Size**: 1200x800
- **Dev Tools**: Available via F12

## 🔄 Startup Sequence

The new development setup ensures proper startup order:

1. **Backend Server** starts first
2. **Health check** waits for backend to be ready
3. **Frontend Server** starts after backend is healthy
4. **Electron App** launches after both servers are ready

## ⚡ Features

### Automatic Dependency Management
- Backend dependencies are automatically installed if missing
- No manual setup required for new developers

### Intelligent Startup Order
- Uses `wait-on` to ensure servers start in correct order
- Frontend waits for backend health check before starting
- Electron waits for both servers to be ready

### Unified Logging
- Color-coded output with prefixes:
  - 🔵 `[BACKEND]` - Backend server logs
  - 🟢 `[FRONTEND]` - Frontend server logs  
  - 🟣 `[ELECTRON]` - Electron app logs

### Graceful Shutdown
- `Ctrl+C` stops all servers simultaneously
- No orphaned processes left running

## 🛠️ Troubleshooting

### Port Already in Use
If you get port conflicts:

**Backend (Port 8000):**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

**Frontend (Port 5173):**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### Python Dependencies Issues
If backend fails to start:
```bash
cd backend
pip install -r requirements.txt
```

### Node Dependencies Issues
If frontend fails to start:
```bash
npm install
# or
npm ci
```

### Environment Variables
Ensure you have the required environment files:
- `.env.local` (Frontend configuration)
- `config/.env` (Backend configuration with OpenAI API key)

## 🔍 Development Workflow

### 1. Initial Setup
```bash
git clone <repository>
cd <project-directory>
npm install
```

### 2. Daily Development
```bash
npm run dev
```

### 3. Testing API Only
```bash
npm run dev:servers
# Then open http://localhost:5173 in browser
```

### 4. Backend Development
```bash
npm run backend
# Backend runs on http://localhost:8000
```

### 5. Frontend Development
```bash
npm run frontend
# Frontend runs on http://localhost:5173
```

## 📝 Configuration Files

### package.json Scripts
- `dev:servers` - Concurrent backend + frontend
- `dev:full` - Full environment with Electron
- `backend` - Backend server only
- `frontend` - Frontend server only

### Backend Configuration
- `backend/start_dev_server.py` - Development server script
- `backend/main.py` - FastAPI application
- `backend/requirements.txt` - Python dependencies

### Frontend Configuration
- `vite.config.js` - Vite configuration
- `.env.local` - Environment variables
- `src/services/apiService.js` - API client configuration

## 🎉 Success Indicators

You'll know everything is working when you see:

```
[BACKEND] 🚀 Starting Backend API Server...
[BACKEND] 📍 Backend URL: http://localhost:8000
[FRONTEND] VITE v5.4.19  ready in 235 ms
[FRONTEND] ➜  Local:   http://localhost:5173/
[ELECTRON] Electron app started successfully
```

The development environment is now ready for leads processing system development!
