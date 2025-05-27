#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Certificate Generation Script for Admin Panel Authentication
Generates a Certificate Authority (CA) and client certificates for secure admin access
"""

import os
import sys
import subprocess
import datetime
from pathlib import Path

# Set UTF-8 encoding for Windows compatibility
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Command: {command}")
        print(f"   Error: {e.stderr}")
        sys.exit(1)

def create_certificates():
    """Create CA and client certificates for admin authentication"""

    # Create certificates directory
    cert_dir = Path("certificates")
    cert_dir.mkdir(exist_ok=True)

    print("🔐 Generating Admin Panel Certificates")
    print("=" * 50)

    # Certificate configuration
    ca_config = {
        "country": "BR",
        "state": "SP",
        "city": "Sao Paulo",
        "organization": "Leads Processing System",
        "organizational_unit": "Admin Panel",
        "common_name": "Leads Processing CA",
        "email": "admin@leadsprocessing.local"
    }

    client_config = {
        "country": "BR",
        "state": "SP",
        "city": "Sao Paulo",
        "organization": "Leads Processing System",
        "organizational_unit": "Admin Access",
        "common_name": "Admin Client",
        "email": "admin@leadsprocessing.local"
    }

    # Change to certificates directory
    os.chdir(cert_dir)

    # 1. Generate CA private key
    run_command(
        "openssl genrsa -out ca-key.pem 4096",
        "Generating CA private key"
    )

    # 2. Generate CA certificate
    ca_subject = f"/C={ca_config['country']}/ST={ca_config['state']}/L={ca_config['city']}/O={ca_config['organization']}/OU={ca_config['organizational_unit']}/CN={ca_config['common_name']}/emailAddress={ca_config['email']}"

    run_command(
        f'openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem -subj "{ca_subject}"',
        "Generating CA certificate"
    )

    # 3. Generate client private key
    run_command(
        "openssl genrsa -out client-key.pem 4096",
        "Generating client private key"
    )

    # 4. Generate client certificate signing request
    client_subject = f"/C={client_config['country']}/ST={client_config['state']}/L={client_config['city']}/O={client_config['organization']}/OU={client_config['organizational_unit']}/CN={client_config['common_name']}/emailAddress={client_config['email']}"

    run_command(
        f'openssl req -subj "{client_subject}" -new -key client-key.pem -out client.csr',
        "Generating client certificate signing request"
    )

    # 5. Generate client certificate signed by CA
    run_command(
        "openssl x509 -req -days 365 -in client.csr -CA ca.pem -CAkey ca-key.pem -out client-cert.pem -sha256 -CAcreateserial",
        "Generating client certificate"
    )

    # 6. Create PKCS#12 bundle for easy installation
    run_command(
        'openssl pkcs12 -export -out admin-client.p12 -inkey client-key.pem -in client-cert.pem -certfile ca.pem -passout pass:admin123',
        "Creating PKCS#12 bundle for client installation"
    )

    # 7. Set appropriate permissions
    run_command("chmod 600 *.pem *.p12", "Setting secure file permissions")

    # Clean up CSR file
    if os.path.exists("client.csr"):
        os.remove("client.csr")

    # Return to original directory
    os.chdir("..")

    print("\n🎉 Certificate generation completed successfully!")
    print("\n📋 Generated files:")
    print("   📁 certificates/")
    print("   ├── 🔑 ca.pem (Certificate Authority)")
    print("   ├── 🔑 ca-key.pem (CA Private Key)")
    print("   ├── 🔑 client-cert.pem (Client Certificate)")
    print("   ├── 🔑 client-key.pem (Client Private Key)")
    print("   └── 📦 admin-client.p12 (Client Bundle for Installation)")

    print("\n🔧 Installation Instructions:")
    print("1. Install the client certificate (admin-client.p12) in your browser")
    print("2. Password for PKCS#12 bundle: admin123")
    print("3. Access the admin panel at: https://localhost:8000/admin")
    print("4. Your browser will prompt you to select the client certificate")

    print("\n⚠️  Security Notes:")
    print("- Keep the CA private key (ca-key.pem) secure")
    print("- The client certificate is valid for 365 days")
    print("- Only users with the client certificate can access the admin panel")

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("Admin Panel Certificate Generator")
        print("Usage: python generate-admin-certificates.py")
        print("\nThis script generates:")
        print("- Certificate Authority (CA)")
        print("- Client certificate for admin access")
        print("- PKCS#12 bundle for easy browser installation")
        return

    # Check if OpenSSL is available
    try:
        subprocess.run(["openssl", "version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ OpenSSL is not installed or not in PATH")
        print("Please install OpenSSL to generate certificates")
        sys.exit(1)

    create_certificates()

if __name__ == "__main__":
    main()
