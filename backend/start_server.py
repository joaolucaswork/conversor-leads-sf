#!/usr/bin/env python3
"""
Backend Server Startup Script
Handles environment setup and server initialization
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python version: {sys.version}")

def install_dependencies():
    """Install required dependencies"""
    requirements_file = Path(__file__).parent / "requirements.txt"

    if not requirements_file.exists():
        print("❌ Error: requirements.txt not found")
        sys.exit(1)

    print("📦 Installing dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        sys.exit(1)

def setup_environment():
    """Setup environment variables"""
    # Load environment variables from project root .env file
    project_root_env = Path(__file__).parent.parent / ".env"
    if project_root_env.exists():
        print("📄 Loading environment variables from project root .env")
        with open(project_root_env, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        # Remove quotes if present
                        value = value.strip('"').strip("'")
                        os.environ[key] = value
                        if key == "OPENAI_API_KEY":
                            print("✅ OpenAI API key loaded")
                        elif key == "SALESFORCE_CLIENT_ID":
                            print("✅ Salesforce Client ID loaded")

    # Also load from config/.env if available (for backward compatibility)
    config_env = Path(__file__).parent.parent / "config" / ".env"
    if config_env.exists():
        print("📄 Loading additional environment variables from config/.env")
        with open(config_env, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        # Remove quotes if present
                        value = value.strip('"').strip("'")
                        os.environ[key] = value
                        if key == "OPENAI_API_KEY":
                            print("✅ OpenAI API key loaded")

def start_server():
    """Start the FastAPI server"""
    print("\n🚀 Starting Leads Processing API Server...")
    print("📍 Server URL: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔄 Interactive API: http://localhost:8000/redoc")
    print("\n⏹️  Press Ctrl+C to stop the server\n")

    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except ImportError:
        print("❌ Error: uvicorn not installed. Installing dependencies...")
        install_dependencies()
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

def main():
    """Main startup function"""
    print("🔧 Leads Processing Backend Server")
    print("=" * 40)

    check_python_version()
    setup_environment()

    # Ask user if they want to install dependencies
    try:
        import fastapi
        import uvicorn
        print("✅ Dependencies already installed")
    except ImportError:
        response = input("📦 Dependencies not found. Install them now? (y/n): ")
        if response.lower() in ['y', 'yes']:
            install_dependencies()
        else:
            print("❌ Cannot start server without dependencies")
            sys.exit(1)

    start_server()

if __name__ == "__main__":
    main()
