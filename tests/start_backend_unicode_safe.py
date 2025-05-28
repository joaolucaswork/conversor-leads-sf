#!/usr/bin/env python3
"""
Unicode-safe backend startup script.
This script ensures proper UTF-8 encoding configuration before starting the backend server.
"""

import os
import sys
import subprocess
from pathlib import Path

def configure_unicode_environment():
    """Configure environment variables for Unicode support."""
    print("Configuring Unicode environment...")

    # Set Python I/O encoding to UTF-8
    os.environ['PYTHONIOENCODING'] = 'utf-8'

    # Set locale environment variables for better Unicode support
    if sys.platform.startswith('win'):
        # Windows-specific settings
        os.environ['PYTHONLEGACYWINDOWSSTDIO'] = '0'  # Use new Windows console
        print("[OK] Windows Unicode environment configured")
    else:
        # Unix-like systems
        os.environ['LC_ALL'] = 'C.UTF-8'
        os.environ['LANG'] = 'C.UTF-8'
        print("[OK] Unix Unicode environment configured")

    print(f"[OK] PYTHONIOENCODING set to: {os.environ.get('PYTHONIOENCODING')}")

def check_backend_files():
    """Check if backend files exist."""
    backend_file = "backend/main.py"

    if Path(backend_file).exists():
        print(f"[OK] Found backend file: {backend_file}")
        return backend_file

    print("[ERROR] Backend file not found!")
    print("Please ensure you're running this from the project root directory.")
    return None

def start_backend_server(backend_file):
    """Start the backend server with Unicode-safe configuration."""
    print(f"Starting backend server: {backend_file}")

    # Prepare the command
    cmd = [
        sys.executable,  # Use the same Python interpreter
        backend_file,
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload"
    ]

    print(f"Command: {' '.join(cmd)}")
    print("=" * 60)
    print("BACKEND SERVER STARTING...")
    print("Press Ctrl+C to stop the server")
    print("=" * 60)

    try:
        # Start the server
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n" + "=" * 60)
        print("SERVER STOPPED BY USER")
        print("=" * 60)
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Server failed to start: {e}")
        return False
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        return False

    return True

def main():
    """Main function to start the Unicode-safe backend."""
    print("=" * 60)
    print("UNICODE-SAFE BACKEND STARTUP")
    print("=" * 60)

    # Configure Unicode environment
    configure_unicode_environment()

    # Check for backend files
    backend_file = check_backend_files()
    if not backend_file:
        sys.exit(1)

    # Start the server
    success = start_backend_server(backend_file)

    if success:
        print("Backend server started successfully!")
    else:
        print("Failed to start backend server.")
        sys.exit(1)

if __name__ == "__main__":
    main()
