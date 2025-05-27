#!/usr/bin/env python3
"""
FastAPI Backend Server for Leads Processing System
Provides REST API endpoints for the React/Electron frontend
"""

import os
import sys
import uuid
import json
import asyncio
import base64
import hashlib
import secrets
import urllib.parse
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import httpx

# Database imports
from sqlalchemy.orm import Session
from models.database import get_db, init_db, check_db_connection
from models.training_data import ProcessingJob
from services.training_data_service import TrainingDataService
from services.fine_tuning_service import FineTuningService

# Certificate authentication imports
from middleware.certificate_auth import verify_admin_certificate

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Load from project root .env file
    project_root = Path(__file__).parent.parent
    env_path = project_root / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        print(f"[SUCCESS] Environment variables loaded from {env_path}")
    else:
        print(f"[WARNING] .env file not found at {env_path}")
except ImportError:
    print("[WARNING] python-dotenv not installed, loading environment variables manually")
    # Fallback: manual .env loading
    project_root = Path(__file__).parent.parent
    env_path = project_root / ".env"
    if env_path.exists():
        print(f"[INFO] Loading environment variables manually from {env_path}")
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        # Remove quotes if present
                        value = value.strip('"').strip("'")
                        os.environ[key] = value
        print("[SUCCESS] Environment variables loaded manually")
    else:
        print(f"[WARNING] .env file not found at {env_path}")

# Add the core directory to Python path for imports (project_root already defined above)
core_dir = project_root / "core"
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(core_dir))

# Import our existing processing modules
try:
    # First try to import the AI field mapper to check if it's available
    try:
        from ai_field_mapper import AIFieldMapper
        print("[SUCCESS] AI field mapper imported successfully")
    except ImportError as ai_import_error:
        print(f"[WARNING] Could not import ai_field_mapper: {ai_import_error}")
        print("[INFO] AI features will be limited")

    from core.master_leads_processor_ai import process_leads_with_ai
    from core.master_leads_processor import process_leads_traditional
    from tools.data_validator import validate_data
    PROCESSING_MODULES_AVAILABLE = True
    print("[SUCCESS] Processing modules imported successfully")
except ImportError as e:
    print(f"[WARNING] Could not import processing modules: {e}")
    print("[INFO] Make sure you're running from the project root directory")
    print("[INFO] Server will continue with limited functionality")
    PROCESSING_MODULES_AVAILABLE = False

    # Define fallback functions
    def process_leads_with_ai(*args, **kwargs):
        raise HTTPException(status_code=503, detail="AI processing module not available")

    def process_leads_traditional(*args, **kwargs):
        raise HTTPException(status_code=503, detail="Traditional processing module not available")

    def validate_data(*args, **kwargs):
        return {"valid": True, "message": "Validation module not available"}

# Initialize FastAPI app
app = FastAPI(
    title="Leads Processing API",
    description="Backend API for AI-enhanced leads processing system with fine-tuning",
    version="1.0.0"
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and check connections on startup"""
    try:
        print("[INFO] Initializing database...")
        init_db()

        if check_db_connection():
            print("[SUCCESS] Database initialized and connected successfully")
        else:
            print("[WARNING] Database connection check failed - continuing with in-memory fallback")
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
        print("[INFO] Continuing with in-memory storage fallback")

# Configure CORS for frontend access
def get_cors_origins():
    """Get CORS origins based on environment"""
    # Always include localhost for development
    origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ]

    # In production, also allow the current domain
    is_production = (
        os.getenv("NODE_ENV") == "production" or
        os.getenv("PYTHON_ENV") == "production" or
        os.getenv("PORT")  # Heroku sets PORT
    )

    if is_production:
        # Get the Heroku app URL
        heroku_app_name = os.getenv("HEROKU_APP_NAME")
        if heroku_app_name:
            heroku_url = f"https://{heroku_app_name}.herokuapp.com"
            origins.append(heroku_url)
            print(f"[INFO] Added production origin: {heroku_url}")

        print(f"[INFO] Production CORS configured with origins: {origins}")

    return origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    expose_headers=["*"],
)

# Mount static files for production (React build)
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    # Mount assets directory for JS/CSS files
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
        print(f"[INFO] Assets mounted from {assets_dir}")

    # Mount static files for other resources
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
    print(f"[INFO] Static files mounted from {static_dir}")

# Security scheme
security = HTTPBearer()

# In-memory storage for demo (replace with database in production)
processing_jobs: Dict[str, Dict[str, Any]] = {}
processing_history: List[Dict[str, Any]] = []

# Processing history starts empty - no sample data
# Users will only see files they have actually processed

# Data models
class ProcessingStatus(BaseModel):
    processingId: str
    fileName: str
    status: str
    progress: int
    currentStage: str
    message: str
    resultUrl: Optional[str] = None
    previewUrl: Optional[str] = None
    aiStats: Optional[Dict[str, Any]] = None
    apiUsage: Optional[Dict[str, Any]] = None

class HistoryItem(BaseModel):
    processingId: str
    fileName: str
    uploadedAt: str
    status: str
    recordCount: Optional[int] = None
    resultUrl: Optional[str] = None
    outputPath: Optional[str] = None
    completedAt: Optional[str] = None
    processingMode: Optional[str] = None
    validationIssues: Optional[List[str]] = None

class PaginatedHistory(BaseModel):
    history: List[HistoryItem]
    pagination: Dict[str, Any]

# OAuth models
class OAuthTokenRequest(BaseModel):
    code: str
    code_verifier: str
    redirect_uri: str

class OAuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    instance_url: str
    token_type: str = "Bearer"
    expires_in: Optional[int] = None
    scope: Optional[str] = None

class OAuthRefreshRequest(BaseModel):
    refresh_token: str

class OAuthUserProfile(BaseModel):
    user_id: str
    organization_id: str
    username: str
    display_name: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photos: Optional[Dict[str, str]] = None

# Salesforce-specific models
class SalesforceUploadRequest(BaseModel):
    processing_id: str
    salesforce_object: str = "Lead"
    access_token: str
    instance_url: str
    file_name: Optional[str] = None

class SalesforceValidationRequest(BaseModel):
    access_token: str
    instance_url: str

class SalesforceObjectsRequest(BaseModel):
    access_token: str
    instance_url: str

class SalesforceFieldMappingRequest(BaseModel):
    access_token: str
    instance_url: str
    object_type: str = "Lead"

# Fine-tuning system models
class UserCorrectionRequest(BaseModel):
    processing_id: str
    correction_type: str  # 'field_mapping', 'data_validation', 'format_correction'
    original_value: str
    corrected_value: str
    correction_reason: Optional[str] = None
    field_name: Optional[str] = None
    record_index: Optional[int] = None

# Admin authentication models
class AdminAuthRequest(BaseModel):
    admin_token: str

class AdminAuthResponse(BaseModel):
    success: bool
    session_token: Optional[str] = None
    message: str

class TrainingDataSummary(BaseModel):
    total_processing_jobs: int
    total_field_mappings: int
    total_user_corrections: int
    recent_jobs_7_days: int
    mapping_accuracy_percent: float
    validated_mappings: int
    storage_path: str
    last_updated: str

class FineTuningRecommendation(BaseModel):
    type: str
    priority: str
    description: str
    action: str
    field_name: Optional[str] = None

# Authentication dependency (simplified for demo)
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify the authorization token.
    For now, we'll accept any token that starts with 'Bearer'
    In production, validate against Salesforce or your auth system
    """
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No access token provided"
        )
    return credentials.credentials

# Utility functions
def generate_processing_id() -> str:
    """Generate a unique processing ID"""
    return str(uuid.uuid4())

def get_file_path(filename: str, folder: str = "input") -> Path:
    """Get the full path for a file in the data directory"""
    data_dir = project_root / "data" / folder
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / filename

def get_output_path(processing_id: str, original_filename: str) -> Path:
    """Get the output path for processed files"""
    output_dir = project_root / "data" / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    base_name = Path(original_filename).stem
    return output_dir / f"{base_name}_processed_{processing_id}.csv"

# OAuth utility functions
def get_salesforce_oauth_config():
    """Get hardcoded Salesforce OAuth configuration for Reino Capital."""
    # Reino Capital specific Salesforce instance
    reino_capital_domain = "https://reino-capital.my.salesforce.com"

    # Environment-aware redirect URI generation
    def get_redirect_uri():
        # Check if explicitly set in environment
        env_redirect_uri = os.getenv("SALESFORCE_REDIRECT_URI")
        if env_redirect_uri:
            return env_redirect_uri

        # Detect production environment
        is_production = (
            os.getenv("NODE_ENV") == "production" or
            os.getenv("PYTHON_ENV") == "production" or
            os.getenv("PORT")  # Heroku sets PORT
        )

        if is_production:
            # In production, use the Heroku app URL
            heroku_app_name = os.getenv("HEROKU_APP_NAME", "reino-leads-conversor-75440cff307e")
            return f"https://{heroku_app_name}.herokuapp.com/oauth/callback"
        else:
            # Development fallback
            return "http://localhost:5173/oauth/callback"

    return {
        "client_id": os.getenv("SALESFORCE_CLIENT_ID", "3MVG9Xl3BC6VHB.ajXGO2p2AGuOr2p1I_mxjPmJw8uFTvwEI8rIePoU83kIrsyhrnpZT1K0YroRcMde21OIiy"),
        "client_secret": os.getenv("SALESFORCE_CLIENT_SECRET", "4EBCE02C0690F74155B64AED84DA821DA02966E0C041D6360C7ED8A29045A00E"),
        "redirect_uri": get_redirect_uri(),
        "login_url": reino_capital_domain,
        "token_url": f"{reino_capital_domain}/services/oauth2/token",
        "authorize_url": f"{reino_capital_domain}/services/oauth2/authorize"
    }

def generate_code_verifier() -> str:
    """Generate a code verifier for PKCE"""
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')

def generate_code_challenge(code_verifier: str) -> str:
    """Generate a code challenge from code verifier for PKCE"""
    digest = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')

async def exchange_oauth_code(code: str, code_verifier: str, redirect_uri: str) -> Dict[str, Any]:
    """Exchange OAuth authorization code for access token"""
    config = get_salesforce_oauth_config()

    if not config["client_id"] or not config["client_secret"]:
        raise HTTPException(
            status_code=500,
            detail="Salesforce OAuth configuration not found. Please check environment variables."
        )

    token_data = {
        "grant_type": "authorization_code",
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "code": code,
        "redirect_uri": redirect_uri,
        "code_verifier": code_verifier
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                config["token_url"],
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )

            if response.status_code != 200:
                error_detail = response.text
                print(f"[ERROR] Salesforce token exchange failed: {error_detail}")
                raise HTTPException(
                    status_code=400,
                    detail=f"OAuth token exchange failed: {error_detail}"
                )

            token_response = response.json()
            return {
                "success": True,
                "data": {
                    "access_token": token_response["access_token"],
                    "refresh_token": token_response.get("refresh_token"),
                    "instance_url": token_response["instance_url"],
                    "token_type": token_response.get("token_type", "Bearer"),
                    "expires_in": token_response.get("expires_in"),
                    "scope": token_response.get("scope")
                }
            }

        except httpx.RequestError as e:
            print(f"[ERROR] HTTP request failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to connect to Salesforce: {str(e)}"
            )

async def refresh_oauth_token(refresh_token: str) -> Dict[str, Any]:
    """Refresh OAuth access token"""
    config = get_salesforce_oauth_config()

    if not config["client_id"] or not config["client_secret"]:
        raise HTTPException(
            status_code=500,
            detail="Salesforce OAuth configuration not found"
        )

    token_data = {
        "grant_type": "refresh_token",
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "refresh_token": refresh_token
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                config["token_url"],
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )

            if response.status_code != 200:
                error_detail = response.text
                print(f"[ERROR] Salesforce token refresh failed: {error_detail}")
                raise HTTPException(
                    status_code=400,
                    detail=f"OAuth token refresh failed: {error_detail}"
                )

            token_response = response.json()
            return {
                "success": True,
                "data": {
                    "access_token": token_response["access_token"],
                    "refresh_token": token_response.get("refresh_token"),
                    "instance_url": token_response["instance_url"],
                    "token_type": token_response.get("token_type", "Bearer"),
                    "expires_in": token_response.get("expires_in"),
                    "scope": token_response.get("scope")
                }
            }

        except httpx.RequestError as e:
            print(f"[ERROR] HTTP request failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to connect to Salesforce: {str(e)}"
            )

async def get_salesforce_user_profile(access_token: str, instance_url: str) -> Dict[str, Any]:
    """Get Salesforce user profile information"""
    config = get_salesforce_oauth_config()
    userinfo_url = f"{instance_url}/services/oauth2/userinfo"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if response.status_code != 200:
                error_detail = response.text
                print(f"[ERROR] Salesforce user profile fetch failed: {error_detail}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to fetch user profile: {error_detail}"
                )

            profile_data = response.json()
            print(f"[DEBUG] Raw Salesforce userinfo response: {profile_data}")
            print(f"[DEBUG] Available fields: {list(profile_data.keys())}")

            # Enhanced name field mapping with multiple fallbacks
            display_name = (
                profile_data.get("display_name") or
                profile_data.get("name") or
                f"{profile_data.get('first_name', '')} {profile_data.get('last_name', '')}".strip() or
                profile_data.get("username") or
                profile_data.get("preferred_username") or
                "Unknown User"
            )

            # Enhanced picture URL extraction
            picture_url = None
            if profile_data.get("photos"):
                if isinstance(profile_data["photos"], dict):
                    picture_url = profile_data["photos"].get("picture")
                elif isinstance(profile_data["photos"], str):
                    picture_url = profile_data["photos"]

            # Map Salesforce userinfo response to expected format with comprehensive field mapping
            mapped_data = {
                "user_id": profile_data.get("user_id"),
                "id": profile_data.get("user_id"),  # Alias for frontend compatibility
                "organization_id": profile_data.get("organization_id"),
                "username": profile_data.get("username"),
                "preferred_username": profile_data.get("preferred_username"),
                "display_name": display_name,
                "name": display_name,  # Ensure name field is always populated
                "email": profile_data.get("email"),
                "first_name": profile_data.get("first_name"),
                "last_name": profile_data.get("last_name"),
                "photos": profile_data.get("photos"),
                "picture": picture_url,
                "profile": profile_data.get("profile"),
                "zoneinfo": profile_data.get("zoneinfo"),
                "locale": profile_data.get("locale")
            }

            print(f"[DEBUG] Mapped user profile data: {mapped_data}")
            print(f"[DEBUG] Final display name: '{display_name}'")

            return {
                "success": True,
                "data": mapped_data
            }

        except httpx.RequestError as e:
            print(f"[ERROR] HTTP request failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to connect to Salesforce: {str(e)}"
            )

# Salesforce utility functions
async def call_salesforce_integration(action: str, **kwargs) -> Dict[str, Any]:
    """Call the Python Salesforce integration script"""
    import subprocess
    import json

    try:
        # Prepare the Python script call
        script_path = project_root / "core" / "salesforce_integration.py"

        # Build command arguments
        args = ["python", str(script_path), "--action", action]

        # Add specific arguments based on action
        if action == "upload":
            args.extend([
                "--file-path", kwargs["file_path"],
                "--object-type", kwargs.get("object_type", "Lead"),
                "--access-token", kwargs["access_token"],
                "--instance-url", kwargs["instance_url"]
            ])
        elif action in ["validate", "objects", "fields"]:
            args.extend([
                "--access-token", kwargs["access_token"],
                "--instance-url", kwargs["instance_url"]
            ])
            if action == "fields":
                args.extend(["--object-type", kwargs.get("object_type", "Lead")])

        print(f"[INFO] Executing Salesforce integration: {' '.join(args[2:])}")  # Don't log sensitive tokens

        # Execute the script
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        if result.returncode != 0:
            error_msg = f"Salesforce integration failed: {result.stderr}"
            print(f"[ERROR] {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "errorType": "SCRIPT_ERROR"
            }

        # Parse JSON output
        try:
            output = json.loads(result.stdout)
            print(f"[INFO] Salesforce integration completed successfully")
            return output
        except json.JSONDecodeError as e:
            error_msg = f"Failed to parse Salesforce integration output: {str(e)}"
            print(f"[ERROR] {error_msg}")
            print(f"[DEBUG] Raw output: {result.stdout}")
            return {
                "success": False,
                "error": error_msg,
                "errorType": "PARSE_ERROR"
            }

    except subprocess.TimeoutExpired:
        error_msg = "Salesforce integration timed out"
        print(f"[ERROR] {error_msg}")
        return {
            "success": False,
            "error": error_msg,
            "errorType": "TIMEOUT_ERROR"
        }
    except Exception as e:
        error_msg = f"Unexpected error in Salesforce integration: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return {
            "success": False,
            "error": error_msg,
            "errorType": "UNEXPECTED_ERROR"
        }

# API Endpoints

# OAuth Endpoints
@app.post("/api/v1/oauth/token")
async def exchange_token(request: OAuthTokenRequest):
    """Exchange OAuth authorization code for access token"""
    start_time = time.time()
    try:
        print(f"[INFO] URGENT - Starting OAuth token exchange for code: {request.code[:10]}...")

        result = await exchange_oauth_code(
            request.code,
            request.code_verifier,
            request.redirect_uri
        )

        processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        print(f"[INFO] OAuth token exchange completed in {processing_time:.2f}ms")

        if result["success"]:
            return OAuthTokenResponse(**result["data"])
        else:
            print(f"[ERROR] Token exchange failed after {processing_time:.2f}ms: {result}")
            raise HTTPException(status_code=400, detail="Token exchange failed")

    except HTTPException:
        raise
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        print(f"[ERROR] Unexpected error in token exchange after {processing_time:.2f}ms: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/v1/oauth/refresh")
async def refresh_token(request: OAuthRefreshRequest):
    """Refresh OAuth access token"""
    try:
        result = await refresh_oauth_token(request.refresh_token)

        if result["success"]:
            return OAuthTokenResponse(**result["data"])
        else:
            raise HTTPException(status_code=400, detail="Token refresh failed")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in token refresh: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

class SalesforceUserProfileRequest(BaseModel):
    access_token: str
    instance_url: str

@app.get("/api/v1/oauth/userinfo")
async def get_user_info_get(
    instance_url: str,
    token: str = Depends(verify_token)
):
    """Get Salesforce user profile information (GET method for Electron)"""
    try:
        result = await get_salesforce_user_profile(token, instance_url)

        if result["success"]:
            return OAuthUserProfile(**result["data"])
        else:
            raise HTTPException(status_code=400, detail="Failed to fetch user profile")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in user profile fetch: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/v1/oauth/userinfo")
async def get_user_info_post(
    request: SalesforceUserProfileRequest,
    token: str = Depends(verify_token)
):
    """Get Salesforce user profile information (POST method for browser)"""
    try:
        print(f"[INFO] Browser user profile request for instance: {request.instance_url}")

        result = await get_salesforce_user_profile(request.access_token, request.instance_url)

        if result["success"]:
            return result["data"]  # Return raw data for browser compatibility
        else:
            raise HTTPException(status_code=400, detail="Failed to fetch user profile")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in user profile fetch: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/v1/oauth/config")
async def get_oauth_config():
    """Get OAuth configuration for frontend"""
    config = get_salesforce_oauth_config()

    # Only return public configuration (no secrets)
    return {
        "client_id": config["client_id"],
        "redirect_uri": config["redirect_uri"],  # Include redirect URI for frontend
        "login_url": config["login_url"],
        "authorize_url": f"{config['login_url']}/services/oauth2/authorize",
        "scope": "api id web refresh_token"
    }

# Salesforce API Endpoints
@app.post("/api/v1/salesforce/upload")
async def salesforce_upload(
    request: SalesforceUploadRequest,
    token: str = Depends(verify_token)
):
    """Upload processed file to Salesforce"""
    try:
        print(f"[INFO] Salesforce upload request for processing ID: {request.processing_id}")

        # Get the processed file path
        job = processing_jobs.get(request.processing_id)
        if not job:
            raise HTTPException(status_code=404, detail="Processing job not found")

        if job["status"] != "completed":
            raise HTTPException(status_code=400, detail="File processing not completed")

        output_path = Path(job["outputPath"])
        if not output_path.exists():
            raise HTTPException(status_code=404, detail="Processed file not found")

        # Call Salesforce integration
        result = await call_salesforce_integration(
            action="upload",
            file_path=str(output_path),
            object_type=request.salesforce_object,
            access_token=request.access_token,
            instance_url=request.instance_url
        )

        print(f"[INFO] Salesforce upload result: {result.get('success', False)}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in Salesforce upload: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/v1/salesforce/validate")
async def salesforce_validate(
    request: SalesforceValidationRequest,
    token: str = Depends(verify_token)
):
    """Validate Salesforce connection"""
    try:
        print(f"[INFO] Salesforce validation request")

        result = await call_salesforce_integration(
            action="validate",
            access_token=request.access_token,
            instance_url=request.instance_url
        )

        print(f"[INFO] Salesforce validation result: {result.get('success', False)}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in Salesforce validation: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/v1/salesforce/objects")
async def salesforce_objects(
    request: SalesforceObjectsRequest,
    token: str = Depends(verify_token)
):
    """Get Salesforce objects"""
    try:
        print(f"[INFO] Salesforce objects request")

        result = await call_salesforce_integration(
            action="objects",
            access_token=request.access_token,
            instance_url=request.instance_url
        )

        print(f"[INFO] Salesforce objects result: {result.get('success', False)}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in Salesforce objects: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/v1/salesforce/field-mapping")
async def salesforce_field_mapping(
    request: SalesforceFieldMappingRequest,
    token: str = Depends(verify_token)
):
    """Get Salesforce field mapping"""
    try:
        print(f"[INFO] Salesforce field mapping request for object: {request.object_type}")

        result = await call_salesforce_integration(
            action="fields",
            object_type=request.object_type,
            access_token=request.access_token,
            instance_url=request.instance_url
        )

        print(f"[INFO] Salesforce field mapping result: {result.get('success', False)}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in Salesforce field mapping: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/")
async def root():
    """Serve React app or API health check"""
    # Check if we have static files (production mode)
    static_dir = Path(__file__).parent / "static"
    index_file = static_dir / "index.html"

    if index_file.exists():
        # Serve React app in production
        return FileResponse(str(index_file))
    else:
        # API health check in development
        return {"message": "Leads Processing API is running", "version": "1.0.0"}

@app.get("/oauth/callback")
async def oauth_callback():
    """Serve React app for OAuth callback handling"""
    static_dir = Path(__file__).parent / "static"
    index_file = static_dir / "index.html"

    if index_file.exists():
        # Serve React app - React Router will handle the /oauth/callback route
        return FileResponse(str(index_file))
    else:
        # Development fallback
        return {"message": "OAuth callback - React app not found", "redirect": "/"}

@app.get("/login")
async def login_page():
    """Serve React app for login page"""
    static_dir = Path(__file__).parent / "static"
    index_file = static_dir / "index.html"

    if index_file.exists():
        return FileResponse(str(index_file))
    else:
        return {"message": "Login page - React app not found", "redirect": "/"}

@app.get("/settings")
async def settings_page():
    """Serve React app for settings page"""
    static_dir = Path(__file__).parent / "static"
    index_file = static_dir / "index.html"

    if index_file.exists():
        return FileResponse(str(index_file))
    else:
        return {"message": "Settings page - React app not found", "redirect": "/"}

@app.get("/salesforce")
async def salesforce_page():
    """Serve React app for Salesforce page"""
    static_dir = Path(__file__).parent / "static"
    index_file = static_dir / "index.html"

    if index_file.exists():
        return FileResponse(str(index_file))
    else:
        return {"message": "Salesforce page - React app not found", "redirect": "/"}

@app.get("/preview/{processing_id}")
async def preview_page(processing_id: str):
    """Serve React app for preview page"""
    static_dir = Path(__file__).parent / "static"
    index_file = static_dir / "index.html"

    if index_file.exists():
        return FileResponse(str(index_file))
    else:
        return {"message": "Preview page - React app not found", "redirect": "/"}

@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle CORS preflight requests"""
    return {"message": "CORS preflight handled"}

@app.get("/api/v1/health")
async def health_check():
    """Detailed health check"""
    print("[INFO] Health check requested")
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "processing_modules": PROCESSING_MODULES_AVAILABLE,
        "cors_enabled": True
    }

@app.post("/api/v1/leads/upload")
async def upload_file(
    file: UploadFile = File(...),
    useAiEnhancement: bool = Form(True),
    aiModelPreference: Optional[str] = Form(None),
    token: str = Depends(verify_token)
):
    """Upload and process a leads file"""

    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=400,
            detail="Only Excel (.xlsx, .xls) and CSV files are supported"
        )

    # Generate processing ID
    processing_id = generate_processing_id()

    # Save uploaded file
    input_path = get_file_path(file.filename)
    try:
        with open(input_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

    # Initialize processing job
    job_data = {
        "processingId": processing_id,
        "fileName": file.filename,
        "status": "queued",
        "progress": 0,
        "currentStage": "file_uploaded",
        "message": "File uploaded successfully, processing queued",
        "uploadedAt": datetime.now().isoformat(),
        "useAiEnhancement": useAiEnhancement,
        "aiModelPreference": aiModelPreference,
        "inputPath": str(input_path),
        "outputPath": str(get_output_path(processing_id, file.filename))
    }

    processing_jobs[processing_id] = job_data

    # Store training data if database is available
    try:
        from models.database import SessionLocal
        db = SessionLocal()
        try:
            training_service = TrainingDataService(db)

            # Create processing job record
            db_job = training_service.create_processing_job(
                processing_id=processing_id,
                user_id="demo_user",  # In production, get from token
                file_name=file.filename,
                file_path=str(input_path),
                status="queued",
                ai_stats={},
                api_usage={}
            )

            # Store file upload information
            file_info = {
                "original_filename": file.filename,
                "file_path": str(input_path),
                "file_size": len(content),
                "file_type": file.filename.split('.')[-1].lower() if '.' in file.filename else 'unknown'
            }

            training_service.store_file_upload(db_job.id, file_info, store_file=True)
            print(f"[INFO] Training data stored for processing job {processing_id}")

        finally:
            db.close()
    except Exception as e:
        print(f"[WARNING] Failed to store training data: {e}")
        # Continue without training data storage

    # Start background processing
    asyncio.create_task(process_file_background(processing_id))

    return {
        "processingId": processing_id,
        "fileName": file.filename,
        "message": "File uploaded successfully, processing started",
        "statusUrl": f"/api/v1/leads/status/{processing_id}"
    }

async def process_file_background(processing_id: str):
    """Background task to process the uploaded file"""
    job = processing_jobs.get(processing_id)
    if not job:
        return

    try:
        # Update status to processing
        job["status"] = "processing"
        job["progress"] = 10
        job["currentStage"] = "preprocessing"
        job["message"] = "Starting file processing..."

        input_path = job["inputPath"]
        output_path = job["outputPath"]

        # Check if processing modules are available
        if not PROCESSING_MODULES_AVAILABLE:
            job["status"] = "failed"
            job["message"] = "Processing modules not available. Please check server configuration."
            return

        # Simulate preprocessing delay
        await asyncio.sleep(0.5)

        job["progress"] = 30
        job["currentStage"] = "data_validation"
        job["message"] = "Validating data format..."

        # Simulate validation delay
        await asyncio.sleep(0.5)

        job["progress"] = 50
        if job["useAiEnhancement"]:
            job["currentStage"] = "ai_processing"
            job["message"] = "Processing with AI enhancement..."
        else:
            job["currentStage"] = "traditional_processing"
            job["message"] = "Processing with traditional rules..."

        # Actual file processing
        try:
            # Use the appropriate processing function based on AI enhancement setting
            if job["useAiEnhancement"]:
                # Import the processor to get AI statistics
                from core.master_leads_processor_ai import AIEnhancedLeadsProcessor
                processor = AIEnhancedLeadsProcessor()
                processed_file_path = processor.process_file_ai(input_path, output_path)

                # Get AI statistics for real-time tracking
                if hasattr(processor.ai_mapper, 'get_api_usage_stats'):
                    job["aiStats"] = processor.ai_stats
                    job["apiUsage"] = processor.ai_mapper.get_api_usage_stats()
            else:
                processed_file_path = process_leads_traditional(input_path, output_path)

            # Count records in processed file
            import pandas as pd
            try:
                df_result = pd.read_csv(processed_file_path)
                record_count = len(df_result)
                print(f"[INFO] Successfully counted {record_count} records in processed file")
            except Exception as count_error:
                print(f"[WARNING] Could not count records: {count_error}")
                record_count = 0

            job["progress"] = 100
            job["status"] = "completed"
            job["currentStage"] = "completed"
            job["message"] = "Processing completed successfully"
            job["resultUrl"] = f"/leads/download/{processing_id}"
            job["recordCount"] = record_count

            # Add to history
            history_item = {
                "processingId": processing_id,
                "fileName": job["fileName"],
                "uploadedAt": job["uploadedAt"],
                "status": "completed",
                "recordCount": job["recordCount"],
                "resultUrl": job["resultUrl"],
                "outputPath": job["outputPath"],
                "completedAt": datetime.now().isoformat(),
                "processingMode": "AI-Enhanced" if job["useAiEnhancement"] else "Traditional",
                "validationIssues": []  # Add validation issues if any
            }
            processing_history.append(history_item)

            print(f"[SUCCESS] File processing completed: {processed_file_path}")
            print(f"[INFO] Processed {record_count} records")

        except Exception as processing_error:
            job["status"] = "failed"
            job["message"] = f"Processing failed: {str(processing_error)}"
            print(f"[ERROR] Processing failed: {processing_error}")

    except Exception as e:
        job["status"] = "failed"
        job["message"] = f"Unexpected error: {str(e)}"
        print(f"[ERROR] Unexpected error in background processing: {e}")

@app.get("/api/v1/leads/status/{processing_id}")
async def get_processing_status(
    processing_id: str,
    token: str = Depends(verify_token)
):
    """Get the status of a processing job"""
    job = processing_jobs.get(processing_id)
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")

    return ProcessingStatus(
        processingId=job["processingId"],
        fileName=job["fileName"],
        status=job["status"],
        progress=job["progress"],
        currentStage=job["currentStage"],
        message=job["message"],
        resultUrl=job.get("resultUrl"),
        previewUrl=job.get("previewUrl"),
        aiStats=job.get("aiStats"),
        apiUsage=job.get("apiUsage")
    )

@app.get("/api/v1/leads/history")
async def get_processing_history(
    page: int = 1,
    limit: int = 10,
    token: str = Depends(verify_token)
):
    """Get paginated processing history"""
    print(f"[INFO] Processing history request - Page: {page}, Limit: {limit}")
    print(f"[INFO] Token received: {token[:20]}..." if token else "[INFO] No token")

    try:
        # Calculate pagination
        total_items = len(processing_history)
        total_pages = (total_items + limit - 1) // limit if total_items > 0 else 0
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit

        # Get page items
        page_items = processing_history[start_idx:end_idx]

        print(f"[INFO] Returning {len(page_items)} items out of {total_items} total")

        result = PaginatedHistory(
            history=[HistoryItem(**item) for item in page_items],
            pagination={
                "page": page,
                "limit": limit,
                "totalItems": total_items,
                "totalPages": total_pages
            }
        )

        return result

    except Exception as e:
        print(f"[ERROR] Error in get_processing_history: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/v1/leads/download/{processing_id}")
async def download_processed_file(
    processing_id: str,
    token: str = Depends(verify_token)
):
    """Download a processed file"""
    job = processing_jobs.get(processing_id)
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")

    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="File processing not completed")

    output_path = Path(job["outputPath"])
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Processed file not found")

    # Generate CSV filename regardless of original file extension
    original_name = Path(job['fileName']).stem  # Get filename without extension
    csv_filename = f"processed_{original_name}.csv"

    return FileResponse(
        path=output_path,
        filename=csv_filename,
        media_type="text/csv; charset=utf-8"
    )

@app.get("/api/v1/leads/history/{processing_id}/logs")
async def get_job_logs(
    processing_id: str,
    token: str = Depends(verify_token)
):
    """Get processing logs for a specific job"""
    job = processing_jobs.get(processing_id)
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")

    # Return mock logs for demo
    logs = [
        {
            "timestamp": job["uploadedAt"],
            "level": "INFO",
            "stage": "upload",
            "message": f"File {job['fileName']} uploaded successfully"
        },
        {
            "timestamp": datetime.now().isoformat(),
            "level": "INFO",
            "stage": job["currentStage"],
            "message": job["message"]
        }
    ]

    return {"logs": logs}

@app.delete("/api/v1/leads/history/clear")
async def clear_processing_history(
    token: str = Depends(verify_token)
):
    """Clear all processing history"""
    global processing_history
    try:
        cleared_count = len(processing_history)
        processing_history.clear()
        print(f"[INFO] Cleared {cleared_count} history items")
        return {
            "success": True,
            "message": f"Successfully cleared {cleared_count} history items",
            "clearedCount": cleared_count
        }
    except Exception as e:
        print(f"[ERROR] Error clearing history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")

@app.delete("/api/v1/leads/files/clear")
async def clear_ready_files(
    token: str = Depends(verify_token)
):
    """Clear all ready files (completed processing jobs)"""
    global processing_jobs, processing_history
    try:
        # Count completed jobs
        completed_jobs = [job_id for job_id, job in processing_jobs.items() if job["status"] == "completed"]
        cleared_count = len(completed_jobs)

        # Remove completed jobs from processing_jobs
        for job_id in completed_jobs:
            # Optionally delete the actual files from disk
            job = processing_jobs[job_id]
            if "outputPath" in job:
                output_path = Path(job["outputPath"])
                if output_path.exists():
                    try:
                        output_path.unlink()
                        print(f"[INFO] Deleted file: {output_path}")
                    except Exception as file_error:
                        print(f"[WARNING] Could not delete file {output_path}: {file_error}")

            # Remove from processing_jobs
            del processing_jobs[job_id]

        # Also remove corresponding entries from processing_history
        # This ensures the UI reflects the cleared state immediately
        initial_history_count = len(processing_history)
        processing_history = [
            item for item in processing_history
            if item["processingId"] not in completed_jobs
        ]
        history_removed_count = initial_history_count - len(processing_history)

        print(f"[INFO] Cleared {cleared_count} ready files from processing_jobs")
        print(f"[INFO] Removed {history_removed_count} corresponding entries from processing_history")

        return {
            "success": True,
            "message": f"Successfully cleared {cleared_count} ready files",
            "clearedCount": cleared_count,
            "historyItemsRemoved": history_removed_count
        }
    except Exception as e:
        print(f"[ERROR] Error clearing ready files: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear ready files: {str(e)}")

# Admin Authentication API Endpoints

@app.post("/api/v1/admin/authenticate")
async def authenticate_admin(
    request: AdminAuthRequest,
    token: str = Depends(verify_token)
):
    """Authenticate admin user with token"""
    try:
        # Validate admin token
        admin_token = os.getenv("ADMIN_ACCESS_TOKEN")
        if not admin_token:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Admin authentication not configured"
            )

        if request.admin_token != admin_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin token"
            )

        # Generate session token (in production, use proper session management)
        import secrets
        session_token = secrets.token_urlsafe(32)

        return AdminAuthResponse(
            success=True,
            session_token=session_token,
            message="Admin authentication successful"
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Admin authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin authentication failed"
        )

@app.get("/api/v1/admin/verify")
async def verify_admin_session(
    request: Request,
    token: str = Depends(verify_token)
):
    """Verify admin session"""
    try:
        # Check admin token in headers
        admin_token = request.headers.get("X-Admin-Token")
        if not admin_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admin token required"
            )

        # Validate admin token (in production, validate session properly)
        expected_token = os.getenv("ADMIN_ACCESS_TOKEN")
        if not expected_token or admin_token != expected_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin session"
            )

        return {"valid": True, "message": "Admin session verified"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Admin session verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Session verification failed"
        )

# Fine-tuning System API Endpoints

@app.get("/api/v1/training/summary")
async def get_training_data_summary(
    db: Session = Depends(get_db),
    token: str = Depends(verify_token),
    cert_verification: dict = Depends(verify_admin_certificate)
):
    """Get summary of collected training data"""
    try:
        training_service = TrainingDataService(db)
        summary = training_service.get_training_data_summary()
        return TrainingDataSummary(**summary)
    except Exception as e:
        print(f"[ERROR] Failed to get training data summary: {e}")
        # Fallback to basic summary if database is not available
        return TrainingDataSummary(
            total_processing_jobs=len(processing_jobs),
            total_field_mappings=0,
            total_user_corrections=0,
            recent_jobs_7_days=0,
            mapping_accuracy_percent=0.0,
            validated_mappings=0,
            storage_path="in-memory",
            last_updated=datetime.utcnow().isoformat()
        )

@app.post("/api/v1/training/corrections")
async def add_user_correction(
    correction: UserCorrectionRequest,
    db: Session = Depends(get_db),
    token: str = Depends(verify_token),
    cert_verification: dict = Depends(verify_admin_certificate)
):
    """Add user correction for training data improvement"""
    try:
        # Get user ID from token (simplified for demo)
        user_id = "demo_user"  # In production, extract from JWT token

        training_service = TrainingDataService(db)

        # Find the processing job
        processing_job = db.query(ProcessingJob).filter(
            ProcessingJob.processing_id == correction.processing_id
        ).first()

        if not processing_job:
            raise HTTPException(status_code=404, detail="Processing job not found")

        # Add the correction
        correction_data = {
            "correction_type": correction.correction_type,
            "original_value": correction.original_value,
            "corrected_value": correction.corrected_value,
            "correction_reason": correction.correction_reason,
            "field_name": correction.field_name,
            "record_index": correction.record_index
        }

        user_correction = training_service.add_user_correction(
            processing_job.id,
            user_id,
            correction_data
        )

        return {
            "success": True,
            "correction_id": user_correction.id,
            "message": "User correction added successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to add user correction: {e}")
        # For demo purposes, just return success even if database fails
        return {
            "success": True,
            "correction_id": None,
            "message": "Correction noted (database not available)"
        }

@app.get("/api/v1/training/recommendations")
async def get_improvement_recommendations(
    db: Session = Depends(get_db),
    token: str = Depends(verify_token),
    cert_verification: dict = Depends(verify_admin_certificate)
):
    """Get recommendations for model improvement"""
    try:
        fine_tuning_service = FineTuningService(db)
        recommendations = fine_tuning_service.get_improvement_recommendations()

        return {
            "success": True,
            "recommendations": [
                FineTuningRecommendation(**rec) for rec in recommendations["recommendations"]
            ],
            "recent_performance": recommendations["recent_performance"],
            "problematic_fields": recommendations["problematic_fields"],
            "correction_patterns": recommendations["correction_patterns"]
        }

    except Exception as e:
        print(f"[ERROR] Failed to get improvement recommendations: {e}")
        # Fallback recommendations
        return {
            "success": True,
            "recommendations": [
                FineTuningRecommendation(
                    type="data_collection",
                    priority="medium",
                    description="Continue collecting training data to improve model accuracy",
                    action="process_more_files"
                )
            ],
            "recent_performance": None,
            "problematic_fields": [],
            "correction_patterns": []
        }

@app.post("/api/v1/training/generate-dataset")
async def generate_training_dataset(
    dataset_name: str = "auto_generated",
    min_confidence: float = 80.0,
    db: Session = Depends(get_db),
    token: str = Depends(verify_token),
    cert_verification: dict = Depends(verify_admin_certificate)
):
    """Generate a training dataset from collected data"""
    try:
        fine_tuning_service = FineTuningService(db)
        dataset = fine_tuning_service.generate_training_dataset(
            dataset_name=dataset_name,
            min_confidence=min_confidence
        )

        return {
            "success": True,
            "dataset_id": dataset.id,
            "dataset_name": dataset.dataset_name,
            "version": dataset.version,
            "total_samples": dataset.total_samples,
            "quality_score": dataset.quality_score,
            "message": f"Training dataset '{dataset.dataset_name}' generated successfully"
        }

    except Exception as e:
        print(f"[ERROR] Failed to generate training dataset: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to generate training dataset"
        }

@app.get("/api/v1/training/field-patterns")
async def get_field_mapping_patterns(
    db: Session = Depends(get_db),
    token: str = Depends(verify_token),
    cert_verification: dict = Depends(verify_admin_certificate)
):
    """Get field mapping patterns for analysis"""
    try:
        training_service = TrainingDataService(db)
        patterns = training_service.get_field_mapping_patterns()
        return {
            "success": True,
            **patterns
        }

    except Exception as e:
        print(f"[ERROR] Failed to get field mapping patterns: {e}")
        return {
            "success": True,
            "common_mappings": [],
            "problematic_mappings": []
        }

# Catch-all route for serving static files (must be last)
@app.get("/{file_path:path}")
async def serve_static_files(file_path: str):
    """Serve static files for React app"""
    static_dir = Path(__file__).parent / "static"

    # Skip API routes
    if file_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")

    # Skip routes that are already handled by specific endpoints
    handled_routes = ["oauth/callback", "login", "settings", "salesforce", "preview"]
    if any(file_path.startswith(route) for route in handled_routes):
        raise HTTPException(status_code=404, detail="Route handled by specific endpoint")

    # Handle specific static file requests
    if file_path.endswith(('.js', '.css', '.svg', '.png', '.jpg', '.ico', '.json')):
        file_full_path = static_dir / file_path
        if file_full_path.exists():
            return FileResponse(str(file_full_path))

    # For all other routes, serve index.html (SPA routing)
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))

    # Fallback to 404
    raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    # Get port from environment variable (Heroku sets PORT)
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"

    print("Starting Leads Processing API Server...")
    print(f"Server will be available at: http://{host}:{port}")
    print(f"API documentation at: http://{host}:{port}/docs")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,  # Disable reload in production
        log_level="info"
    )
