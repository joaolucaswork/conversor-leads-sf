"""
Certificate-based authentication middleware for Admin Panel
Validates client certificates for secure admin access
"""

import os
import ssl
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer

# Optional imports for certificate validation
try:
    import OpenSSL.crypto
    from cryptography import x509
    from cryptography.hazmat.backends import default_backend
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    print("[WARNING] Cryptography libraries not available. Certificate authentication will be disabled.")

class CertificateAuthenticator:
    """Handles certificate-based authentication for admin endpoints"""

    def __init__(self, ca_cert_path: str = None):
        """
        Initialize certificate authenticator

        Args:
            ca_cert_path: Path to the Certificate Authority certificate
        """
        if not CRYPTO_AVAILABLE:
            self.ca_cert_path = None
            self.ca_cert = None
            return

        self.ca_cert_path = ca_cert_path or self._find_ca_cert()
        self.ca_cert = self._load_ca_certificate()

    def _find_ca_cert(self) -> str:
        """Find the CA certificate file"""
        possible_paths = [
            "certificates/ca.pem",
            "../certificates/ca.pem",
            "../../certificates/ca.pem",
            os.path.join(os.path.dirname(__file__), "../../certificates/ca.pem")
        ]

        for path in possible_paths:
            if os.path.exists(path):
                return path

        raise FileNotFoundError(
            "CA certificate not found. Please run 'python scripts/generate-admin-certificates.py' "
            "to generate certificates first."
        )

    def _load_ca_certificate(self):
        """Load the CA certificate"""
        if not CRYPTO_AVAILABLE:
            return None

        try:
            with open(self.ca_cert_path, 'rb') as f:
                ca_cert_data = f.read()
            return x509.load_pem_x509_certificate(ca_cert_data, default_backend())
        except Exception as e:
            raise RuntimeError(f"Failed to load CA certificate: {e}")

    def verify_client_certificate(self, client_cert_pem: str) -> Dict[str, Any]:
        """
        Verify a client certificate against the CA

        Args:
            client_cert_pem: PEM-encoded client certificate

        Returns:
            Dict with verification results and certificate info
        """
        if not CRYPTO_AVAILABLE:
            return {
                "valid": False,
                "error": "Certificate verification not available - missing cryptography libraries",
                "error_code": "CRYPTO_UNAVAILABLE"
            }

        try:
            # Parse client certificate
            client_cert = x509.load_pem_x509_certificate(
                client_cert_pem.encode(),
                default_backend()
            )

            # Verify certificate signature
            try:
                # Use OpenSSL for signature verification
                ca_cert_openssl = OpenSSL.crypto.load_certificate(
                    OpenSSL.crypto.FILETYPE_PEM,
                    open(self.ca_cert_path, 'rb').read()
                )
                client_cert_openssl = OpenSSL.crypto.load_certificate(
                    OpenSSL.crypto.FILETYPE_PEM,
                    client_cert_pem.encode()
                )

                # Create certificate store and verify
                store = OpenSSL.crypto.X509Store()
                store.add_cert(ca_cert_openssl)

                # Verify the certificate
                store_context = OpenSSL.crypto.X509StoreContext(store, client_cert_openssl)
                store_context.verify_certificate()

            except OpenSSL.crypto.X509StoreContextError as e:
                return {
                    "valid": False,
                    "error": f"Certificate verification failed: {e}",
                    "error_code": "INVALID_SIGNATURE"
                }

            # Check certificate validity period
            import datetime
            now = datetime.datetime.utcnow()

            if client_cert.not_valid_before > now:
                return {
                    "valid": False,
                    "error": "Certificate is not yet valid",
                    "error_code": "NOT_YET_VALID"
                }

            if client_cert.not_valid_after < now:
                return {
                    "valid": False,
                    "error": "Certificate has expired",
                    "error_code": "EXPIRED"
                }

            # Extract certificate information
            subject = client_cert.subject
            issuer = client_cert.issuer

            cert_info = {
                "subject": {
                    "common_name": self._get_name_attribute(subject, x509.NameOID.COMMON_NAME),
                    "organization": self._get_name_attribute(subject, x509.NameOID.ORGANIZATION_NAME),
                    "organizational_unit": self._get_name_attribute(subject, x509.NameOID.ORGANIZATIONAL_UNIT_NAME),
                    "email": self._get_name_attribute(subject, x509.NameOID.EMAIL_ADDRESS),
                },
                "issuer": {
                    "common_name": self._get_name_attribute(issuer, x509.NameOID.COMMON_NAME),
                    "organization": self._get_name_attribute(issuer, x509.NameOID.ORGANIZATION_NAME),
                },
                "serial_number": str(client_cert.serial_number),
                "not_valid_before": client_cert.not_valid_before.isoformat(),
                "not_valid_after": client_cert.not_valid_after.isoformat(),
            }

            return {
                "valid": True,
                "certificate_info": cert_info,
                "message": "Certificate is valid and trusted"
            }

        except Exception as e:
            return {
                "valid": False,
                "error": f"Certificate parsing failed: {e}",
                "error_code": "PARSE_ERROR"
            }

    def _get_name_attribute(self, name, oid) -> Optional[str]:
        """Extract a specific attribute from a certificate name"""
        try:
            attributes = name.get_attributes_for_oid(oid)
            if attributes:
                return attributes[0].value
        except Exception:
            pass
        return None

# Global certificate authenticator instance
cert_authenticator = None

def get_certificate_authenticator() -> CertificateAuthenticator:
    """Get or create the global certificate authenticator"""
    global cert_authenticator
    if cert_authenticator is None:
        cert_authenticator = CertificateAuthenticator()
    return cert_authenticator

async def verify_admin_certificate(request: Request) -> Dict[str, Any]:
    """
    FastAPI dependency to verify admin certificate

    Production-compatible version that handles Heroku limitations

    Args:
        request: FastAPI request object

    Returns:
        Certificate verification results

    Raises:
        HTTPException: If certificate is invalid or missing
    """
    # Detect production environment (Heroku)
    is_production = (
        os.getenv("NODE_ENV") == "production" or
        os.getenv("PYTHON_ENV") == "production" or
        os.getenv("PORT")  # Heroku sets PORT
    )

    if is_production:
        # In production (Heroku), use alternative authentication
        # Since Heroku doesn't support client certificate authentication
        print("[INFO] Production environment detected - using alternative admin authentication")

        # Check for admin access token in headers
        admin_token = request.headers.get("X-Admin-Token")
        if not admin_token:
            # Check for admin session cookie or other auth mechanism
            admin_session = request.cookies.get("admin_session")
            if not admin_session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Admin authentication required. Please contact your system administrator for access.",
                    headers={"WWW-Authenticate": "AdminToken"}
                )

        # Validate admin token/session (implement your validation logic here)
        if not _validate_admin_access(admin_token or admin_session):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid admin credentials. Access denied."
            )

        return {
            "valid": True,
            "production_mode": True,
            "auth_method": "admin_token",
            "message": "Admin access granted via production authentication"
        }

    # Development/local environment - use certificate authentication
    # Check if cryptography libraries are available
    if not CRYPTO_AVAILABLE:
        print("[WARNING] Certificate authentication disabled - cryptography libraries not available")
        return {
            "valid": True,
            "development_mode": True,
            "message": "Certificate authentication disabled - missing dependencies"
        }

    # Check if certificates are available
    try:
        authenticator = get_certificate_authenticator()
    except (FileNotFoundError, RuntimeError) as e:
        # In development, allow access without certificates
        print(f"[WARNING] Certificate authentication disabled in development: {e}")
        return {
            "valid": True,
            "development_mode": True,
            "message": "Development mode - certificate authentication bypassed"
        }

    # Extract client certificate from request headers
    client_cert = request.headers.get("X-Client-Certificate")
    if not client_cert:
        # Check for SSL client certificate (if using HTTPS with client cert)
        ssl_client_cert = request.headers.get("X-SSL-Client-Cert")
        if ssl_client_cert:
            client_cert = ssl_client_cert

    if not client_cert:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Client certificate required for admin access. Please install the admin certificate and try again.",
            headers={"WWW-Authenticate": "Certificate"}
        )

    # Verify the certificate
    verification_result = authenticator.verify_client_certificate(client_cert)

    if not verification_result["valid"]:
        error_detail = verification_result.get("error", "Invalid certificate")
        error_code = verification_result.get("error_code", "INVALID")

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Certificate verification failed: {error_detail}",
            headers={"X-Certificate-Error": error_code}
        )

    return verification_result

def _validate_admin_access(token_or_session: str) -> bool:
    """
    Validate admin access token or session

    Args:
        token_or_session: Admin token or session identifier

    Returns:
        True if valid admin access, False otherwise
    """
    # For production, implement your admin validation logic here
    # This could be:
    # 1. Check against environment variable admin token
    # 2. Validate against database admin users
    # 3. Check JWT token with admin claims
    # 4. Validate session against admin session store

    # Example: Check against environment variable
    admin_token = os.getenv("ADMIN_ACCESS_TOKEN")
    if admin_token and token_or_session == admin_token:
        return True

    # Example: Check against hardcoded admin session (for demo)
    # In production, use proper session management
    valid_admin_sessions = [
        os.getenv("ADMIN_SESSION_TOKEN", "admin-session-12345")
    ]

    return token_or_session in valid_admin_sessions
