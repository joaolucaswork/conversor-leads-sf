# 🚀 **DEPLOYMENT GUIDE - DUAL ENVIRONMENT SETUP**

This guide explains how to deploy the Leads Processing System in both public GitHub and private Heroku environments.

## 📋 **OVERVIEW**

The application supports two deployment scenarios:

1. **Public GitHub Repository**: Generic version for community use
2. **Private Heroku Deployment**: Your company's production deployment with actual credentials

## 🔑 **CREDENTIAL RECOVERY**

**IMPORTANT**: I cannot provide the actual API keys that were removed for security reasons. You need to retrieve them from your original sources:

### **OpenAI API Key**
- Location: Your OpenAI account dashboard
- URL: https://platform.openai.com/api-keys
- Format: `sk-proj-...` (starts with sk-proj or sk-)

### **Salesforce Connected App Credentials**
1. Login to your Salesforce org
2. Go to Setup → App Manager
3. Find your Connected App → View
4. Copy the Consumer Key (Client ID) and Consumer Secret (Client Secret)

### **Salesforce Domain**
- Your org URL: `https://your-domain.my.salesforce.com`
- Replace `your-domain` with your actual Salesforce domain

## 🛠️ **LOCAL DEVELOPMENT SETUP**

### **1. Create Environment File**
```bash
# Copy the example file
cp .env.example config/.env

# Edit with your actual credentials
notepad config/.env  # Windows
nano config/.env     # Linux/Mac
```

### **2. Configure Your Credentials**
Edit `config/.env` with your actual values:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-openai-api-key

# Salesforce Configuration
SALESFORCE_CLIENT_ID=your_actual_client_id
SALESFORCE_CLIENT_SECRET=your_actual_client_secret
SALESFORCE_LOGIN_URL=https://your-domain.my.salesforce.com

# Application Configuration
NODE_ENV=development
DEBUG=True
```

### **3. Test Local Setup**
```bash
# Start backend
python backend/main.py

# Start frontend (in another terminal)
npm run dev

# Test API health
curl http://localhost:8000/api/v1/health
```

## 🌐 **HEROKU DEPLOYMENT**

### **1. Set Local Environment Variables**
Before deploying, set your credentials as local environment variables:

```bash
# Windows Command Prompt
set OPENAI_API_KEY=sk-your-actual-openai-api-key
set SALESFORCE_CLIENT_ID=your_actual_client_id
set SALESFORCE_CLIENT_SECRET=your_actual_client_secret
set SALESFORCE_LOGIN_URL=https://your-domain.my.salesforce.com

# Windows PowerShell
$env:OPENAI_API_KEY="sk-your-actual-openai-api-key"
$env:SALESFORCE_CLIENT_ID="your_actual_client_id"
$env:SALESFORCE_CLIENT_SECRET="your_actual_client_secret"
$env:SALESFORCE_LOGIN_URL="https://your-domain.my.salesforce.com"

# Linux/Mac
export OPENAI_API_KEY=sk-your-actual-openai-api-key
export SALESFORCE_CLIENT_ID=your_actual_client_id
export SALESFORCE_CLIENT_SECRET=your_actual_client_secret
export SALESFORCE_LOGIN_URL=https://your-domain.my.salesforce.com
```

### **2. Deploy Using Script**
```bash
# Run the deployment script
scripts/deploy-to-heroku.bat your-app-name

# Or deploy manually
heroku create your-app-name
heroku buildpacks:add heroku/nodejs --app your-app-name
heroku buildpacks:add heroku/python --app your-app-name
```

### **3. Manual Heroku Config (Alternative)**
If you prefer to set variables manually:

```bash
heroku config:set OPENAI_API_KEY=sk-your-actual-openai-api-key --app your-app-name
heroku config:set SALESFORCE_CLIENT_ID=your_actual_client_id --app your-app-name
heroku config:set SALESFORCE_CLIENT_SECRET=your_actual_client_secret --app your-app-name
heroku config:set SALESFORCE_LOGIN_URL=https://your-domain.my.salesforce.com --app your-app-name
heroku config:set NODE_ENV=production --app your-app-name
heroku config:set DEBUG=False --app your-app-name
```

## 🔧 **SALESFORCE CONNECTED APP CONFIGURATION**

### **1. Update Callback URLs**
In your Salesforce Connected App, add both URLs:

```
http://localhost:5173/oauth/callback
https://your-app-name.herokuapp.com/oauth/callback
```

### **2. OAuth Settings**
Ensure these scopes are enabled:
- `api` - Access and manage your data
- `refresh_token` - Perform requests on your behalf at any time
- `web` - Perform requests on your behalf at any time
- `id` - Access your identity URL service

## ✅ **VERIFICATION CHECKLIST**

### **Local Development**
- [ ] Environment file created (`config/.env`)
- [ ] All credentials configured
- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] OAuth login works
- [ ] File processing works
- [ ] AI features enabled (if API key valid)

### **Heroku Production**
- [ ] App deployed successfully
- [ ] Environment variables set
- [ ] Health endpoint responds: `https://your-app-name.herokuapp.com/api/v1/health`
- [ ] OAuth config endpoint works: `https://your-app-name.herokuapp.com/api/v1/oauth/config`
- [ ] Salesforce login redirects correctly
- [ ] File upload and processing works

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

**"OPENAI_API_KEY not found"**
- Verify the API key is set in environment variables
- Check the key format starts with `sk-`
- Verify the key has sufficient quota

**"Salesforce OAuth not fully configured"**
- Check all three Salesforce variables are set
- Verify the Connected App credentials are correct
- Ensure callback URLs are configured in Salesforce

**"OAuth redirect URI mismatch"**
- Update your Salesforce Connected App callback URLs
- Verify HEROKU_APP_NAME matches your actual app name

### **Debug Commands**
```bash
# Check Heroku environment variables
heroku config --app your-app-name

# View Heroku logs
heroku logs --tail --app your-app-name

# Test API endpoints
curl https://your-app-name.herokuapp.com/api/v1/health
curl https://your-app-name.herokuapp.com/api/v1/oauth/config
```

## 🔒 **SECURITY NOTES**

- Never commit actual credentials to Git
- Use environment variables for all sensitive data
- Regularly rotate API keys and secrets
- Monitor usage and access logs
- Keep dependencies updated

## 📞 **SUPPORT**

If you encounter issues:
1. Check the troubleshooting section above
2. Review Heroku logs for error details
3. Verify all environment variables are set correctly
4. Test locally before deploying to production
