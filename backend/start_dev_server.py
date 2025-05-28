#!/usr/bin/env python3
"""
Backend Development Server Startup Script
Optimized for concurrent execution with frontend
"""

import os
import sys
import subprocess
from pathlib import Path

# Configure UTF-8 encoding for Windows compatibility
if sys.platform.startswith('win'):
    # Set environment variable for Python I/O encoding
    os.environ['PYTHONIOENCODING'] = 'utf-8'

    # Configure stdout and stderr to use UTF-8 encoding
    import codecs
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    if hasattr(sys.stderr, 'buffer'):
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add the project root and core directory to Python path for imports
project_root = Path(__file__).parent.parent
core_dir = project_root / "core"
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(core_dir))

def setup_environment():
    """Setup environment variables"""
    # Load OpenAI API key from config/.env if available
    config_env = Path(__file__).parent.parent / "config" / ".env"
    if config_env.exists():
        print("[INFO] Loading environment variables from config/.env")
        with open(config_env, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    try:
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
                        if key == "OPENAI_API_KEY":
                            print("[SUCCESS] OpenAI API key loaded")
                    except ValueError:
                        continue

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import fastapi
        import uvicorn
        return True
    except ImportError:
        return False

def install_dependencies():
    """Install required dependencies"""
    requirements_file = Path(__file__).parent / "requirements.txt"

    if not requirements_file.exists():
        print("[ERROR] requirements.txt not found")
        return False

    print("[INFO] Installing backend dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        print("[SUCCESS] Backend dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Error installing dependencies: {e}")
        return False

def start_server():
    """Start the FastAPI server"""
    print("[BACKEND] Starting Backend API Server...")
    print("[BACKEND] Backend URL: http://localhost:8000")
    print("[BACKEND] API Docs: http://localhost:8000/docs")

    try:
        import uvicorn

        # Change to backend directory to ensure proper imports
        backend_dir = Path(__file__).parent
        os.chdir(backend_dir)

        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            access_log=False  # Reduce log noise in concurrent mode
        )
    except ImportError:
        print("[ERROR] uvicorn not installed")
        if install_dependencies():
            import uvicorn
            uvicorn.run(
                "main:app",
                host="0.0.0.0",
                port=8000,
                reload=True,
                log_level="info",
                access_log=False
            )
        else:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n[INFO] Backend server stopped")
    except Exception as e:
        print(f"[ERROR] Error starting backend server: {e}")
        sys.exit(1)

def main():
    """Main startup function for development mode"""
    print("[BACKEND] Backend Development Server")
    print("[BACKEND] " + "=" * 30)

    # Check Python version
    if sys.version_info < (3, 8):
        print("[ERROR] Python 3.8 or higher is required")
        print(f"[ERROR] Current version: {sys.version}")
        sys.exit(1)

    setup_environment()

    # Auto-install dependencies if missing
    if not check_dependencies():
        print("[INFO] Installing missing dependencies...")
        if not install_dependencies():
            print("[ERROR] Failed to install dependencies")
            sys.exit(1)

    start_server()

if __name__ == "__main__":
    main()
