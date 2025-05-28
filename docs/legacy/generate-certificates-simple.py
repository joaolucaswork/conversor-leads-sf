#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple Certificate Generation Script for Windows
Generates certificates for Admin Panel authentication without Unicode issues
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"Running: {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"SUCCESS: {description} completed")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"ERROR: {description} failed")
        print(f"Command: {command}")
        print(f"Error: {e.stderr}")
        sys.exit(1)

def create_certificates():
    """Create CA and client certificates for admin authentication"""
    
    # Create certificates directory
    cert_dir = Path("certificates")
    cert_dir.mkdir(exist_ok=True)
    
    print("Generating Admin Panel Certificates")
    print("=" * 50)
    
    # Change to certificates directory
    os.chdir(cert_dir)
    
    # 1. Generate CA private key
    run_command(
        "openssl genrsa -out ca-key.pem 4096",
        "Generating CA private key"
    )
    
    # 2. Generate CA certificate
    ca_subject = "/C=BR/ST=SP/L=SaoPaulo/O=LeadsProcessing/OU=AdminPanel/CN=LeadsProcessingCA/emailAddress=admin@leadsprocessing.local"
    
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
    client_subject = "/C=BR/ST=SP/L=SaoPaulo/O=LeadsProcessing/OU=AdminAccess/CN=AdminClient/emailAddress=admin@leadsprocessing.local"
    
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
    
    # 7. Set appropriate permissions (Windows compatible)
    try:
        if os.name == 'nt':  # Windows
            run_command('icacls *.pem /inheritance:r /grant:r "%USERNAME%":F', "Setting secure file permissions")
            run_command('icacls *.p12 /inheritance:r /grant:r "%USERNAME%":F', "Setting secure file permissions")
        else:  # Unix-like
            run_command("chmod 600 *.pem *.p12", "Setting secure file permissions")
    except:
        print("WARNING: Could not set file permissions")
    
    # Clean up CSR file
    if os.path.exists("client.csr"):
        os.remove("client.csr")
    
    # Return to original directory
    os.chdir("..")
    
    print("\nCertificate generation completed successfully!")
    print("\nGenerated files:")
    print("   certificates/")
    print("   |-- ca.pem (Certificate Authority)")
    print("   |-- ca-key.pem (CA Private Key)")
    print("   |-- client-cert.pem (Client Certificate)")
    print("   |-- client-key.pem (Client Private Key)")
    print("   |-- admin-client.p12 (Client Bundle for Installation)")
    
    print("\nInstallation Instructions:")
    print("1. Install the client certificate (admin-client.p12) in your browser")
    print("2. Password for PKCS#12 bundle: admin123")
    print("3. Access the admin panel at: http://localhost:5173/admin")
    print("4. Your browser will prompt you to select the client certificate")
    
    print("\nSecurity Notes:")
    print("- Keep the CA private key (ca-key.pem) secure")
    print("- The client certificate is valid for 365 days")
    print("- Only users with the client certificate can access the admin panel")

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("Admin Panel Certificate Generator")
        print("Usage: python generate-certificates-simple.py")
        print("\nThis script generates:")
        print("- Certificate Authority (CA)")
        print("- Client certificate for admin access")
        print("- PKCS#12 bundle for easy browser installation")
        return
    
    # Check if OpenSSL is available
    try:
        subprocess.run(["openssl", "version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("ERROR: OpenSSL is not installed or not in PATH")
        print("Please install OpenSSL to generate certificates")
        print("\nInstallation instructions:")
        print("- Windows: Download from https://slproweb.com/products/Win32OpenSSL.html")
        print("- macOS: brew install openssl")
        print("- Linux: sudo apt-get install openssl")
        sys.exit(1)
    
    create_certificates()

if __name__ == "__main__":
    main()
