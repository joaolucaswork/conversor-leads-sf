#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Admin Panel Security Setup Script
Generates certificates and configures certificate-based authentication for the admin panel
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Set UTF-8 encoding for Windows compatibility
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"🔐 {title}")
    print("=" * 60)

def print_step(step_num, description):
    """Print a formatted step"""
    print(f"\n📋 Step {step_num}: {description}")
    print("-" * 40)

def run_command(command, description, check=True):
    """Run a shell command with error handling"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
        else:
            print(f"⚠️  {description} completed with warnings")
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Command: {command}")
        print(f"   Error: {e.stderr}")
        if check:
            sys.exit(1)
        return e

def check_dependencies():
    """Check if required dependencies are available"""
    print_step(1, "Checking Dependencies")

    # Check OpenSSL
    try:
        result = subprocess.run(["openssl", "version"], check=True, capture_output=True, text=True)
        print(f"✅ OpenSSL found: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ OpenSSL is not installed or not in PATH")
        print("Please install OpenSSL to generate certificates")
        print("\nInstallation instructions:")
        print("- Windows: Download from https://slproweb.com/products/Win32OpenSSL.html")
        print("- macOS: brew install openssl")
        print("- Linux: sudo apt-get install openssl (Ubuntu/Debian) or sudo yum install openssl (CentOS/RHEL)")
        sys.exit(1)

    # Check Python dependencies
    required_packages = ["cryptography", "pyOpenSSL"]
    missing_packages = []

    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ Python package '{package}' found")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ Python package '{package}' not found")

    if missing_packages:
        print(f"\n📦 Installing missing Python packages: {', '.join(missing_packages)}")
        for package in missing_packages:
            run_command(f"pip install {package}", f"Installing {package}")

def generate_certificates():
    """Generate CA and client certificates"""
    print_step(2, "Generating Certificates")

    # Run the certificate generation script
    script_path = Path("scripts/generate-admin-certificates.py")
    if not script_path.exists():
        print(f"❌ Certificate generation script not found: {script_path}")
        sys.exit(1)

    run_command(f"python {script_path}", "Generating certificates")

def setup_backend_dependencies():
    """Install backend dependencies for certificate authentication"""
    print_step(3, "Setting Up Backend Dependencies")

    backend_requirements = [
        "cryptography>=3.4.8",
        "pyOpenSSL>=21.0.0"
    ]

    for requirement in backend_requirements:
        run_command(f"pip install {requirement}", f"Installing {requirement}")

def create_certificate_directory():
    """Create and setup certificate directory for frontend access"""
    print_step(4, "Setting Up Certificate Directory")

    cert_dir = Path("certificates")
    public_dir = Path("public/certificates")

    # Create public certificates directory
    public_dir.mkdir(parents=True, exist_ok=True)

    # Copy client certificate bundle to public directory (for download)
    if (cert_dir / "admin-client.p12").exists():
        shutil.copy2(cert_dir / "admin-client.p12", public_dir / "admin-client.p12")
        print("✅ Client certificate bundle copied to public directory")
    else:
        print("⚠️  Client certificate bundle not found")

def setup_environment_variables():
    """Setup environment variables for certificate authentication"""
    print_step(5, "Configuring Environment Variables")

    env_file = Path(".env")
    env_content = []

    # Read existing .env file if it exists
    if env_file.exists():
        with open(env_file, 'r') as f:
            env_content = f.readlines()

    # Add certificate authentication settings
    cert_settings = [
        "\n# Certificate Authentication Settings\n",
        "CERTIFICATE_AUTH_ENABLED=true\n",
        "CA_CERT_PATH=certificates/ca.pem\n",
        "ADMIN_CERT_REQUIRED=true\n"
    ]

    # Check if settings already exist
    has_cert_settings = any("CERTIFICATE_AUTH_ENABLED" in line for line in env_content)

    if not has_cert_settings:
        env_content.extend(cert_settings)

        with open(env_file, 'w') as f:
            f.writelines(env_content)

        print("✅ Environment variables added to .env file")
    else:
        print("✅ Certificate authentication settings already exist in .env file")

def print_installation_instructions():
    """Print detailed installation instructions"""
    print_header("Installation Instructions")

    print("""
🎯 Admin Panel Access Setup Complete!

📋 Next Steps:

1. 📦 Install Client Certificate:
   • File: certificates/admin-client.p12
   • Password: admin123
   • Install in your browser or system keystore

2. 🌐 Browser Installation:

   Chrome/Edge:
   • Settings → Privacy and Security → Manage Certificates
   • Click "Import" and select admin-client.p12
   • Enter password: admin123

   Firefox:
   • Settings → Privacy & Security → Certificates → View Certificates
   • Click "Import" and select admin-client.p12
   • Enter password: admin123

   Safari:
   • Double-click admin-client.p12 file
   • Enter password: admin123 when prompted

3. 🚀 Access Admin Panel:
   • Start the application: npm run dev
   • Navigate to: http://localhost:5173/admin
   • Your browser will prompt for certificate selection
   • Select the "Admin Client" certificate

4. 🔒 Security Notes:
   • Keep certificates/ca-key.pem secure (CA private key)
   • Client certificate is valid for 365 days
   • Only users with the client certificate can access admin panel
   • Admin panel is hidden from navigation menu

5. 🛠️  Development Mode:
   • Certificate check is bypassed in development
   • Set ENVIRONMENT=production to enforce certificates

📞 Troubleshooting:
   • If certificate prompt doesn't appear, check browser certificate settings
   • Ensure the certificate is properly installed and trusted
   • Check browser console for certificate-related errors
   • Verify the backend is running with certificate authentication enabled
""")

def main():
    """Main setup function"""
    print_header("Admin Panel Security Setup")

    print("""
This script will set up certificate-based authentication for the Admin Panel.
It will:
• Generate a Certificate Authority (CA)
• Create client certificates for admin access
• Configure the backend for certificate validation
• Set up the frontend for certificate-protected routes

⚠️  Important: This will create security certificates. Keep them secure!
""")

    # Confirm before proceeding
    response = input("Do you want to continue? (y/N): ")
    if response.lower() not in ['y', 'yes']:
        print("Setup cancelled.")
        sys.exit(0)

    try:
        check_dependencies()
        generate_certificates()
        setup_backend_dependencies()
        create_certificate_directory()
        setup_environment_variables()
        print_installation_instructions()

        print("\n🎉 Admin Panel Security Setup Complete!")
        print("Follow the installation instructions above to access the admin panel.")

    except KeyboardInterrupt:
        print("\n\n⚠️  Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Setup failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
