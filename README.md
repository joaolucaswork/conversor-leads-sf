# AI-Enhanced Leads Processing System

[![React](https://img.shields.io/badge/React-18.0.0-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-green.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com/)
[![Electron](https://img.shields.io/badge/Electron-28.0.0-blue.svg)](https://www.electronjs.org/)
[![Salesforce](https://img.shields.io/badge/Salesforce-Integration-blue.svg)](https://developer.salesforce.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green.svg)](https://openai.com/)
[![Heroku](https://img.shields.io/badge/Heroku-Ready-purple.svg)](https://heroku.com/)

A comprehensive lead processing system powered by OpenAI's GPT models for intelligent field mapping, data validation, and seamless Salesforce integration. Transform messy lead data from Excel/CSV files into clean, standardized formats ready for CRM import with minimal manual intervention.

## 🎯 **What This Application Does**

This system is designed for **sales teams, marketing professionals, and CRM administrators** who need to:

- **Process lead data** from various sources (Excel, CSV files) with inconsistent formats
- **Automatically map columns** from different languages and naming conventions to standardized Salesforce fields
- **Validate and clean data** using AI-powered analysis and rule-based validation
- **Upload processed leads** directly to Salesforce with proper field mapping
- **Handle duplicate detection** and lead distribution across sales teams
- **Monitor processing history** and track AI usage statistics

### **Key Benefits:**

- ⚡ **Reduces manual data processing time by 90%**
- 🤖 **AI-powered field mapping handles multilingual column headers**
- 🔄 **Seamless Salesforce integration with OAuth authentication**
- 📊 **Processes up to 10,000 records per file**
- 🌐 **Available as both web application and desktop app**
- 🔒 **Enterprise-grade security with environment-based configuration**

## 🛠️ **Technology Stack**

### **Frontend Technologies**

- **React 18.0.0** - Modern UI framework with hooks and context
- **Material-UI (MUI) 5.0** - Comprehensive React component library
- **Vite 5.0** - Fast build tool and development server
- **React Router 6.0** - Client-side routing and navigation
- **Zustand 4.0** - Lightweight state management
- **i18next** - Internationalization framework (Portuguese/English)
- **React Dropzone** - File upload with drag-and-drop support
- **Axios** - HTTP client for API communication
- **Lottie React** - Animation library for loading indicators

### **Backend Technologies**

- **Python 3.9+** - Core backend language
- **FastAPI 0.104.1** - Modern, fast web framework for building APIs
- **Uvicorn** - ASGI server for production deployment
- **Pandas** - Data manipulation and analysis
- **OpenPyXL** - Excel file processing (.xlsx)
- **XLRD** - Legacy Excel file support (.xls)
- **Requests** - HTTP library for external API calls
- **Python-dotenv** - Environment variable management
- **Pydantic** - Data validation and settings management

### **AI/ML Integration**

- **OpenAI API** - GPT-4 for intelligent field mapping and data validation
- **Custom AI Field Mapper** - Proprietary algorithms for column detection
- **Confidence Scoring** - AI decision reliability metrics
- **Fallback Processing** - Rule-based processing when AI is unavailable

### **Database & Storage**

- **PostgreSQL** - Primary database for fine-tuning data (optional)
- **SQLAlchemy** - ORM for database operations
- **File System Storage** - Local file processing and caching
- **JSON Configuration** - Field mapping and system settings

### **Salesforce Integration**

- **Salesforce REST API v58.0** - Lead and object management
- **OAuth 2.0** - Secure authentication flow
- **Custom Field Mapping** - Configurable field relationships
- **Bulk API Support** - Efficient large dataset uploads

### **Desktop Application**

- **Electron 28.0.0** - Cross-platform desktop wrapper
- **Electron Builder** - Application packaging and distribution
- **Auto-updater** - Seamless application updates
- **Native OS Integration** - File associations and system notifications

### **Development & Deployment**

- **Heroku** - Cloud platform deployment
- **Node.js** - Frontend build process
- **Concurrently** - Parallel development server management
- **Cross-env** - Cross-platform environment variables
- **Wait-on** - Service dependency management

### **Security & Configuration**

- **Environment Variables** - Secure credential management
- **CORS** - Cross-origin resource sharing configuration
- **JWT** - Token-based authentication (optional)
- **HTTPS** - Secure communication protocols

## 🚀 **Key Features & Capabilities**

### **🤖 AI-Powered Processing**

- **Intelligent Field Mapping**: Automatically detects and maps columns from different languages (Portuguese, English, Spanish)
- **Pattern Recognition**: Identifies data patterns and suggests appropriate target fields
- **Confidence Scoring**: Provides reliability metrics (0-100%) for each mapping decision
- **Multi-language Support**: Handles variations like "Cliente" vs "Customer" vs "Nome" vs "Last Name"
- **Fallback Processing**: Seamlessly switches to rule-based processing when AI is unavailable

### **📊 Data Processing & Validation**

- **File Format Support**: Excel (.xlsx, .xls), CSV with automatic encoding detection
- **Data Cleaning**: Phone number formatting, email validation, name standardization
- **Duplicate Detection**: Advanced algorithms to identify and handle duplicate leads
- **Batch Processing**: Handle up to 10,000 records per file efficiently
- **Data Validation**: Comprehensive validation rules with detailed error reporting

### **🔄 Salesforce Integration**

- **OAuth 2.0 Authentication**: Secure login flow with token management
- **Direct Upload**: Push processed leads directly to Salesforce objects
- **Field Mapping Configuration**: Customizable field relationships via JSON configuration
- **Lead Distribution**: Intelligent assignment to sales team members
- **Real-time Status**: Live updates on upload progress and results

### **🌐 Multi-Platform Support**

- **Web Application**: Browser-based interface accessible from anywhere
- **Desktop Application**: Native Electron app for Windows, macOS, and Linux
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Offline Capability**: Process files locally without internet connection (desktop app)

### **📈 Monitoring & Analytics**

- **Processing History**: Complete audit trail of all file processing activities
- **AI Usage Statistics**: Track API usage, costs, and performance metrics
- **Error Reporting**: Detailed logs and error analysis for troubleshooting
- **Performance Metrics**: Processing time, success rates, and system health monitoring

## 📂 **Project Structure**

```text
conversor-leads-sf/
├── 📁 app/                          # Electron desktop application
│   ├── main.js                      # Main Electron process
│   ├── preload.js                   # Preload scripts for security
│   └── assets/                      # Application assets
│
├── 📁 backend/                      # Python FastAPI backend
│   ├── main.py                      # FastAPI application entry point
│   ├── models/                      # Database models (PostgreSQL)
│   ├── services/                    # Business logic services
│   ├── middleware/                  # Custom middleware
│   └── migrations/                  # Database migrations
│
├── 📁 src/                          # React frontend source code
│   ├── components/                  # Reusable UI components
│   ├── pages/                       # Application pages/routes
│   ├── services/                    # API service layer
│   ├── hooks/                       # Custom React hooks
│   ├── store/                       # State management (Zustand)
│   ├── i18n/                        # Internationalization
│   └── utils/                       # Utility functions
│
├── 📁 core/                         # Core processing modules
│   ├── ai_field_mapper.py           # AI-powered field mapping
│   ├── master_leads_processor_ai.py # AI-enhanced lead processing
│   ├── master_leads_processor.py    # Traditional rule-based processing
│   ├── salesforce_integration.py   # Salesforce API integration
│   └── duplicate_handler.py         # Duplicate detection logic
│
├── � tools/                        # Utility tools and scripts
│   ├── data_validator.py            # Data validation utilities
│   ├── batch_processor.py           # Batch processing tools
│   └── project_structure_analyzer.py # Project analysis tools
│
├── 📁 config/                       # Configuration files
│   ├── .env                         # Environment variables (local)
│   ├── salesforce_field_mapping.json # Field mapping configuration
│   └── vite.config.js               # Vite build configuration
│
├── 📁 data/                         # Data storage directories
│   ├── input/                       # Input files for processing
│   ├── output/                      # Processed output files
│   └── backup/                      # Backup files
│
├── 📁 docs/                         # Documentation
│   ├── DEPLOYMENT_GUIDE.md          # Deployment instructions
│   ├── API_CONTRACTS.md             # API documentation
│   └── troubleshooting/             # Troubleshooting guides
│
├── 📁 scripts/                      # Deployment and utility scripts
│   ├── deploy-to-heroku.bat         # Heroku deployment script
│   ├── setup-credentials.bat        # Credential setup helper
│   └── start-dev.js                 # Development server starter
│
├── 📄 package.json                  # Node.js dependencies and scripts
├── 📄 requirements.txt              # Python dependencies
├── 📄 Procfile                      # Heroku process configuration
├── 📄 .env.example                  # Environment variables template
└── 📄 README.md                     # This documentation
│   ├── models/             # Data models
│   └── services/           # Backend services
├── config/                 # Configuration files
├── core/                   # Core processing logic
├── docs/                   # Documentation
│   ├── api/                # API documentation
│   ├── salesforce/         # Salesforce integration docs
│   ├── setup/              # Setup guides
│   └── troubleshooting/    # Troubleshooting guides
├── examples/               # Example files
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom React hooks
│   ├── i18n/               # Internationalization
│   ├── pages/              # Application pages
│   ├── services/           # Frontend services
│   ├── store/              # State management
│   ├── styles/             # CSS and styling
│   └── utils/              # Utility functions
├── tests/                  # Test suites
├── tools/                  # Development tools
├── .env.example            # Example environment variables
├── electron-builder.yml    # Electron build configuration
├── index.html              # Main HTML entry
├── package.json            # NPM configuration
├── requirements.txt        # Python dependencies
├── vite.config.js          # Vite configuration
└── README.md               # This file
```

## 🔍 Prerequisites

- **Node.js**: v16.0.0 or higher
- **Python**: v3.9 or higher
- **NPM**: v8.0.0 or higher
- **Storage**: At least 500MB of free disk space
- **Memory**: Minimum 4GB RAM recommended
- **Salesforce**: Developer account for API integration
- **OpenAI**: API key for AI features (optional)

## 🚀 Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/conversor-leads-sf.git
cd conversor-leads-sf
```

### 2. Frontend Setup

```bash
# Install Node.js dependencies
npm install
```

### 3. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### 4. Environment Configuration

1. Create environment files:

```bash
# Create frontend environment file
cp .env.example .env.local

# Create backend environment file
mkdir -p config
cp .env.example config/.env
```

2. Edit the environment files with your settings:

**Frontend (.env.local)**:

```
VITE_API_URL=http://localhost:8000
VITE_DEFAULT_LANGUAGE=pt-BR
```

**Backend (config/.env)**:

```
OPENAI_API_KEY=your_openai_api_key_here
DEBUG=False
```

### 5. Salesforce API Setup

1. Create a Connected App in Salesforce:
   - Go to Setup > App Manager > New Connected App
   - Enable OAuth settings
   - Set Callback URL to `http://localhost:5173/oauth/callback`
   - Add required OAuth scopes: `api`, `refresh_token`, `offline_access`

2. Configure Salesforce credentials in `config/.env`:

```
SF_CLIENT_ID=your_connected_app_consumer_key
SF_CLIENT_SECRET=your_connected_app_consumer_secret
SF_LOGIN_URL=https://login.salesforce.com
```

### 6. Fine-Tuning System Setup (Optional)

The fine-tuning system requires PostgreSQL for training data storage:

**For Local Development:**

```bash
# Install PostgreSQL locally or use Docker
docker run --name postgres-leads -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Set database URL in config/.env
DATABASE_URL=postgresql://postgres:password@localhost:5432/leads_processing
```

**For Heroku Deployment:**

```bash
# Add PostgreSQL add-on (already configured in app.json)
heroku addons:create heroku-postgresql:mini --app your-app-name

# Database tables are automatically created during deployment
# No manual initialization needed! 🎉
```

> **📋 Note**: Database migrations now run automatically during Heroku deployment via release phase. See [Heroku Auto-Migration Guide](HEROKU_AUTO_MIGRATION_GUIDE.md) for details.

**Test the Fine-Tuning System:**

```bash
# Run the test suite
python backend/test_fine_tuning_system.py

# Check database status
python backend/migrations/init_fine_tuning_db.py --status
```

## 📱 Usage Instructions

### Development Mode (Unified Startup)

Start the complete development environment with a single command:

```bash
# Start backend, frontend, and Electron app
npm run dev
```

This will start:

- Backend API server on <http://localhost:8000>
- Frontend Vite server on <http://localhost:5173>
- Electron desktop application

### Browser Version

To run only the web version:

```bash
# Start backend and frontend servers
npm run dev:servers

# Then open http://localhost:5173 in your browser
```

### Electron Desktop Version

Build and run the desktop version:

```bash
# Development mode
npm run electron:dev

# Build distributable
npm run electron:build
```

### Production Deployment

#### Web Application (Heroku)

**Automated Deployment (Recommended):**

The automated scripts handle all deployment steps including app creation, environment variables, and deployment:

```bash
# Linux/Mac
npm run deploy:heroku your-app-name

# Windows
npm run deploy:heroku:windows your-app-name
```

**What the automated script does:**

- Creates Heroku application
- Adds required buildpacks (Node.js + Python)
- Sets all environment variables automatically
- Deploys the application
- Opens the deployed app in browser

**Requirements for automated deployment:**

- Heroku CLI installed and logged in
- OpenAI API key (you'll be prompted to enter it)
- Git repository with all changes committed

**Manual Deployment:**

1. **Create Heroku Application:**

```bash
# Install Heroku CLI if not already installed
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create new app
heroku create your-app-name

# Add buildpacks
heroku buildpacks:add heroku/nodejs --app your-app-name
heroku buildpacks:add heroku/python --app your-app-name
```

2. **Configure Environment Variables:**

```bash
# Required variables
heroku config:set NODE_ENV=production --app your-app-name
heroku config:set PYTHON_ENV=production --app your-app-name
heroku config:set OPENAI_API_KEY=your_openai_api_key --app your-app-name

# Salesforce OAuth configuration
heroku config:set SALESFORCE_CLIENT_ID=3MVG9Xl3BC6VHB.ajXGO2p2AGuOr2p1I_mxjPmJw8uFTvwEI8rIePoU83kIrsyhrnpZT1K0YroRcMde21OIiy --app your-app-name
heroku config:set SALESFORCE_CLIENT_SECRET=4EBCE02C0690F74155B64AED84DA821DA02966E0C041D6360C7ED8A29045A00E --app your-app-name
heroku config:set SALESFORCE_REDIRECT_URI=https://your-app-name.herokuapp.com/oauth/callback --app your-app-name
heroku config:set SALESFORCE_LOGIN_URL=https://reino-capital.my.salesforce.com --app your-app-name
heroku config:set HEROKU_APP_NAME=your-app-name --app your-app-name

# Performance settings
heroku config:set WEB_CONCURRENCY=1 --app your-app-name
heroku config:set DEBUG=False --app your-app-name
```

3. **Configure Salesforce Connected App:**

⚠️ **IMPORTANT**: Before deploying, configure your Salesforce Connected App with the correct callback URLs:

- Login to your Salesforce org (e.g., <https://your-domain.my.salesforce.com>)
- Go to Setup → App Manager → Find your Connected App → Edit
- In "Callback URL" field, add both URLs:

  ```text
  http://localhost:5173/oauth/callback
  https://your-app-name.herokuapp.com/oauth/callback
  ```

- Save changes

4. **Deploy Application:**

```bash
# Deploy to Heroku
git push heroku main

# Monitor deployment
heroku logs --tail --app your-app-name

# Open deployed application
heroku open --app your-app-name
```

5. **Verify Deployment:**

- Check API health: `https://your-app-name.herokuapp.com/api/v1/health`
- Test OAuth login functionality
- Upload a sample leads file

#### Desktop Application (Electron)

Build distributable desktop applications:

```bash
# Build frontend for Electron
npm run build:electron

# Package Electron app for current platform
npm run electron:build

# Build for all platforms (Windows, Mac, Linux)
npm run electron:build:all
```

The distributable files will be available in the `dist` directory.

## ✨ Features

### Lead Data Processing

- **Multi-format Support**: Process Excel (.xlsx, .xls) and CSV files
- **Smart Column Mapping**: Intelligently map columns to standard CRM fields
- **Data Validation**: Validate and clean lead data before upload
- **Batch Processing**: Process multiple files in batch mode
- **Export Options**: Save processed data in various formats

### 🔐 Admin Panel Security

- **Certificate-Based Authentication**: Secure admin access using client certificates
- **Hidden Navigation**: Admin panel not visible in main navigation menu
- **Dual Protection**: Requires both Salesforce authentication AND client certificate
- **Direct URL Access**: Available only via `/admin` route
- **Enterprise-Grade Security**: Production-ready certificate validation

#### Setting Up Admin Panel Security

1. **Generate Certificates**:

   ```bash
   python generate-certificates-simple.py
   ```

2. **Install Client Certificate**:
   - File: `certificates/admin-client.p12`
   - Password: `admin123`
   - Install in your browser (Chrome: Settings → Privacy → Certificates → Import)

3. **Access Admin Panel**:
   - Navigate to: `http://localhost:5173/admin`
   - Browser will prompt for certificate selection
   - Select "Admin Client" certificate

📖 **Detailed Guide**: [Admin Security Guide](ADMIN_SECURITY_GUIDE.md)

### Salesforce Integration

- **Direct Upload**: Upload leads directly to Salesforce
- **Field Mapping**: Map processed fields to Salesforce objects
- **OAuth Authentication**: Secure Salesforce OAuth 2.0 integration
- **Error Handling**: Detailed error handling and reporting
- **Multi-object Support**: Upload to Lead, Contact, or Account objects

### AI-Powered Field Mapping

- **Intelligent Detection**: Automatically identify field types across languages
- **Pattern Recognition**: Detect data patterns for accurate mapping
- **Confidence Scoring**: Rate mapping confidence from 0-100%
- **Smart Fallback**: Use rule-based mapping when AI confidence is low
- **Learning Capability**: Improve mapping accuracy over time

### 🤖 Fine-Tuning System (NEW)

- **Automated Training Data Collection**: Captures all field mappings, user corrections, and processing statistics
- **Machine Learning Pipeline**: Continuously improves AI accuracy through collected data analysis
- **Admin Dashboard**: Comprehensive interface for monitoring training data and model performance
- **Performance Analytics**: Track mapping accuracy trends and improvement metrics over time
- **Custom Dataset Generation**: Create training datasets from high-quality mappings and corrections
- **Improvement Recommendations**: AI-powered suggestions for model enhancement and optimization
- **Data Privacy & Security**: Secure storage with anonymization options for sensitive lead data
- **PostgreSQL Integration**: Persistent storage for training data with Heroku Postgres support

### Multi-language Support

- **Interface Languages**: Full support for Portuguese and English
- **Data Processing**: Handle data in multiple languages
- **Error Messages**: Localized error messages and notifications
- **Documentation**: Available in both Portuguese and English

### File Upload and Processing Workflows

- **Drag-and-Drop**: Intuitive drag-and-drop file upload
- **Progress Tracking**: Real-time processing progress indicators
- **Preview**: Preview mapping results before final processing
- **Validation**: Interactive data validation with highlighting
- **Batch Mode**: Process multiple files in a single operation

## ⚙️ Configuration

### Environment Variables

**Frontend Variables**:

- `VITE_API_URL`: Backend API URL
- `VITE_DEFAULT_LANGUAGE`: Default UI language

**Backend Variables**:

- `OPENAI_API_KEY`: OpenAI API key for AI features
- `DEBUG`: Enable debug mode (True/False)
- `LOG_LEVEL`: Logging level (INFO, DEBUG, ERROR)

**Salesforce Variables**:

- `SF_CLIENT_ID`: Salesforce Connected App Consumer Key
- `SF_CLIENT_SECRET`: Salesforce Connected App Consumer Secret
- `SF_LOGIN_URL`: Salesforce login URL (login.salesforce.com or test.salesforce.com)

### AI Configuration

Configure AI behavior in `config/ai_config.json`:

```json
{
  "enabled": true,
  "confidence_threshold": 80.0,
  "model": "gpt-3.5-turbo",
  "temperature": 0.1,
  "max_tokens": 2000
}
```

## 🏗️ Architecture

The system uses a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Quick Start Interface                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Core Processing Layer                       │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │ AI-Enhanced Processor   │  │ Traditional Processor   │   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 AI Integration Layer                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Utility Layer                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Frontend (React/Vite)**: User interface for file upload, processing, and Salesforce integration
2. **Backend (Python)**: API for file processing, AI integration, and data validation
3. **Electron Wrapper**: Desktop application packaging for cross-platform support
4. **OpenAI Integration**: AI capabilities for field mapping and data validation
5. **Salesforce API Client**: Direct integration with Salesforce for lead upload

The system uses a REST API pattern for communication between frontend and backend, with the Electron app wrapping the web application for desktop use.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

### Development Guidelines

- Follow code style and conventions in each language
- Add tests for new features
- Update documentation for significant changes
- Ensure cross-platform compatibility

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🚨 Troubleshooting

### Common Issues

#### OAuth Authentication Problems

If you encounter "redirect_uri_mismatch" errors during Salesforce login:

1. **Check Salesforce Connected App configuration**
2. **Verify environment variables are set correctly**
3. **Ensure callback URLs match exactly**

📖 **Detailed Guide**: [OAuth Redirect URI Troubleshooting](docs/troubleshooting/OAUTH_REDIRECT_URI_TROUBLESHOOTING.md)

#### Deployment Issues

For Heroku deployment problems:

1. **Check buildpack order** (Node.js first, then Python)
2. **Verify all environment variables are set**
3. **Monitor deployment logs** with `heroku logs --tail`

📖 **Detailed Guide**: [Heroku Deployment Guide](HEROKU_DEPLOYMENT_GUIDE.md)

#### File Processing Errors

For issues with file upload and processing:

1. **Check file format** (Excel .xlsx/.xls or CSV)
2. **Verify file size** (max 10MB recommended)
3. **Check column headers** for proper mapping

### Getting Help

If you encounter issues not covered in the documentation:

1. **Check the logs** in browser console or terminal
2. **Review environment variables** configuration
3. **Consult troubleshooting guides** in the `docs/troubleshooting/` directory
4. **Create an issue** with detailed error information

## 🔗 Quick Links

### Setup and Configuration

- [Development Setup Guide](docs/setup/DEVELOPMENT_SETUP.md)
- [Salesforce Integration Guide](docs/salesforce/SALESFORCE_FIELD_MAPPING_SOLUTION.md)
- [Environment Configuration](docs/setup/ENVIRONMENT_SETUP.md)

### Deployment Guides

- [Heroku Deployment Guide](HEROKU_DEPLOYMENT_GUIDE.md)
- [Electron Distribution Guide](ELECTRON_DISTRIBUTION_GUIDE.md)
- [OAuth Redirect URI Fix Summary](OAUTH_REDIRECT_URI_FIX_SUMMARY.md)

### Documentation

- [AI Features Documentation](docs/README_AI.md)
- [API Documentation](docs/api/)
- [Salesforce Field Mapping](docs/salesforce/SALESFORCE_FIELD_MAPPING_SOLUTION.md)

### Troubleshooting

- [OAuth Troubleshooting](docs/troubleshooting/OAUTH_TROUBLESHOOTING.md)
- [OAuth Redirect URI Issues](docs/troubleshooting/OAUTH_REDIRECT_URI_TROUBLESHOOTING.md)
- [Salesforce Integration Issues](docs/troubleshooting/SALESFORCE_FIXES_SUMMARY.md)
- [General Troubleshooting](docs/troubleshooting/)
