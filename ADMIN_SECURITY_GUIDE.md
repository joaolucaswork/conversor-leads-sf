# Admin Panel Security Guide

This guide explains how to set up and use certificate-based authentication for the Admin Panel in the Leads Processing Application.

## 🔐 Overview

The Admin Panel is secured using client certificate authentication to ensure only authorized users can access sensitive fine-tuning and training data management features.

### Security Features

- **Hidden Navigation**: Admin panel is not visible in the main navigation menu
- **Certificate Authentication**: Requires valid client certificate for access
- **Direct URL Access Only**: Available only via direct URL (`/admin`)
- **Dual Protection**: Requires both Salesforce authentication AND client certificate

## 🚀 Quick Setup

### 1. Run the Setup Script

```bash
python setup-admin-security.py
```

This script will:
- Generate Certificate Authority (CA) and client certificates
- Install required Python dependencies
- Configure environment variables
- Set up certificate directories

### 2. Install Client Certificate

After running the setup script:

1. **Locate the certificate file**: `certificates/admin-client.p12`
2. **Password**: `admin123`
3. **Install in your browser** (see browser-specific instructions below)

### 3. Access Admin Panel

1. Start the application: `npm run dev`
2. Navigate to: `http://localhost:5173/admin`
3. Your browser will prompt for certificate selection
4. Select the "Admin Client" certificate

## 🌐 Browser Installation Instructions

### Chrome/Edge
1. Go to Settings → Privacy and Security → Manage Certificates
2. Click "Import" and select `admin-client.p12`
3. Enter password: `admin123`
4. Restart browser

### Firefox
1. Go to Settings → Privacy & Security → Certificates → View Certificates
2. Click "Import" and select `admin-client.p12`
3. Enter password: `admin123`
4. Restart browser

### Safari
1. Double-click the `admin-client.p12` file
2. Enter password: `admin123` when prompted
3. Certificate will be added to Keychain Access

## 🔧 Manual Certificate Generation

If you prefer to generate certificates manually:

```bash
# Generate certificates
python scripts/generate-admin-certificates.py

# Install backend dependencies
pip install cryptography pyOpenSSL

# Copy certificate to public directory
mkdir -p public/certificates
cp certificates/admin-client.p12 public/certificates/
```

## 🛠️ Development Mode

In development mode, certificate authentication is bypassed for easier testing:

```bash
# Set development mode
export ENVIRONMENT=development

# Or add to .env file
echo "ENVIRONMENT=development" >> .env
```

## 🔍 Testing

### Test API Endpoints
```bash
python test-admin-api.py
```

### Manual Testing
```bash
# Test with curl (should require certificate)
curl -H "Authorization: Bearer demo-token" http://localhost:8000/api/v1/training/summary
```

## 📁 File Structure

```
certificates/
├── ca.pem                 # Certificate Authority
├── ca-key.pem            # CA Private Key (keep secure!)
├── client-cert.pem       # Client Certificate
├── client-key.pem        # Client Private Key
└── admin-client.p12      # Client Bundle (for installation)

public/certificates/
└── admin-client.p12      # Public download link

backend/middleware/
└── certificate_auth.py   # Certificate validation middleware
```

## 🔒 Security Considerations

### Certificate Management
- **Keep `ca-key.pem` secure** - this is the CA private key
- **Client certificates expire in 365 days** - regenerate as needed
- **Only distribute certificates to authorized administrators**

### Production Deployment
- Use proper HTTPS with valid SSL certificates
- Store CA private key in secure location
- Consider using hardware security modules (HSM) for production
- Implement certificate revocation if needed

### Access Control
- Admin panel is hidden from navigation
- Requires both Salesforce authentication AND client certificate
- Certificate validation happens on every admin API request

## 🚨 Troubleshooting

### Certificate Not Prompted
- Check if certificate is properly installed in browser
- Verify browser certificate settings
- Try accessing in incognito/private mode
- Check browser console for certificate errors

### 404 Errors
- Ensure backend server is running
- Check that admin endpoints are properly configured
- Verify certificate middleware is loaded

### Authentication Failures
- Verify client certificate is valid and not expired
- Check that CA certificate matches
- Ensure proper certificate chain

### Development Issues
- Set `ENVIRONMENT=development` to bypass certificate checks
- Check backend logs for detailed error messages
- Verify all dependencies are installed

## 📞 Support

If you encounter issues:

1. **Check the logs**: Backend console will show certificate validation details
2. **Test connectivity**: Run `python test-admin-api.py`
3. **Verify setup**: Ensure all files in `certificates/` directory exist
4. **Browser console**: Check for JavaScript errors related to certificate handling

## 🔄 Certificate Renewal

When certificates expire (after 365 days):

```bash
# Regenerate certificates
python scripts/generate-admin-certificates.py

# Redistribute new certificates to admin users
# Update browser certificates
```

## 🎯 Admin Panel Features

Once authenticated, the admin panel provides:

- **Training Data Summary**: Overview of collected training data
- **Field Mapping Analysis**: Common and problematic field mappings
- **Model Performance**: Accuracy metrics and trends
- **Dataset Generation**: Create training datasets for fine-tuning
- **Improvement Recommendations**: AI-powered suggestions for model enhancement

---

**Note**: This security setup is designed for internal admin access. For production deployments, consider additional security measures such as IP whitelisting, VPN access, or integration with enterprise identity providers.
