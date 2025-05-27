# Leads Processing Backend Server

This is the FastAPI backend server that provides REST API endpoints for the React/Electron frontend.

## Quick Start

### Option 1: Using the Startup Script (Recommended)
```bash
# From the project root directory
python backend/start_server.py
```

### Option 2: Using the Batch File (Windows)
```bash
# From the project root directory
start_backend.bat
```

### Option 3: Manual Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py
```

## Server Information

- **URL**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Interactive API**: http://localhost:8000/redoc (ReDoc)

## API Endpoints

### Core Endpoints
- `GET /` - Health check
- `GET /api/v1/health` - Detailed health check
- `POST /api/v1/leads/upload` - Upload and process leads file
- `GET /api/v1/leads/status/{processing_id}` - Get processing status
- `GET /api/v1/leads/history` - Get processing history (paginated)
- `GET /api/v1/leads/download/{processing_id}` - Download processed file
- `GET /api/v1/leads/history/{processing_id}/logs` - Get processing logs

### Authentication
The server accepts Bearer tokens in the Authorization header. For development, it accepts any token that starts with "Bearer".

## Requirements

- Python 3.8 or higher
- FastAPI
- Uvicorn
- Other dependencies listed in `requirements.txt`

## Environment Variables

The server will automatically load environment variables from `config/.env` if available, including:
- `OPENAI_API_KEY` - For AI-enhanced processing

## Development

The server runs with auto-reload enabled, so changes to the code will automatically restart the server.

## Troubleshooting

### Common Issues

1. **Port 8000 already in use**
   - Stop any other services running on port 8000
   - Or modify the port in `main.py` and `start_server.py`

2. **Import errors for processing modules**
   - Make sure you're running from the project root directory
   - Ensure the `core/` and `tools/` directories exist with the processing scripts

3. **Permission errors**
   - Make sure the `data/` directory is writable
   - Check file permissions for uploaded files

### Logs
Server logs are displayed in the console. Check for any error messages during startup or request processing.
