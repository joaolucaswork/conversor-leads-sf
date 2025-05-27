# AI-Enhanced Leads Processing System

[![React](https://img.shields.io/badge/React-18.0.0-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-green.svg)](https://www.python.org/)
[![Electron](https://img.shields.io/badge/Electron-28.0.0-blue.svg)](https://www.electronjs.org/)
[![Salesforce](https://img.shields.io/badge/Salesforce-Integration-blue.svg)](https://developer.salesforce.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Integration-green.svg)](https://openai.com/)

A revolutionary lead processing system powered by OpenAI's ChatGPT for intelligent field mapping, data validation, and Salesforce integration with minimal manual intervention.

## 📊 Project Overview

This system streamlines the processing of lead data from various file formats (Excel, CSV) and seamlessly integrates with Salesforce. It features:

- **AI-Enhanced Data Processing**: Automatically maps columns, validates data, and standardizes formats
- **Salesforce Integration**: Direct upload of processed leads to Salesforce objects
- **Multi-platform Support**: Available as both a browser application and desktop application
- **Multi-language Interface**: Full support for Portuguese and English
- **Advanced Lead Management**: Duplicate detection, intelligent field mapping, and data validation

The system significantly reduces manual effort in preparing and uploading lead data to Salesforce, with a particular focus on handling variations in field naming and data formats across different sources.

## 🛠️ Technology Stack

### Frontend

- **Framework**: React 18.0.0
- **UI Library**: Material UI 5.0.0
- **State Management**: Zustand 4.0.0
- **Routing**: React Router 6.0.0
- **Localization**: i18next 25.2.1
- **File Handling**: React Dropzone 14.3.8
- **Animation**: Lottie React 2.4.1
- **Build Tool**: Vite 5.0.0

### Backend

- **Language**: Python 3.9+
- **Data Processing**: Pandas 1.5.0+, NumPy 1.21.0+
- **AI Integration**: OpenAI API 1.0.0+
- **Excel Support**: openpyxl 3.0.9+, xlrd 2.0.1+, xlsxwriter 3.0.0+
- **Utilities**: Python-dotenv, colorama, tqdm, chardet, regex

### Desktop Application

- **Framework**: Electron 28.0.0
- **Packaging**: Electron Builder 24.0.0
- **Storage**: Electron Store 8.0.0

### Development Tools

- **Task Runner**: Concurrently 9.1.2
- **Environment**: Cross-env 7.0.3
- **Process Management**: Wait-on 8.0.3

## 📂 Project Structure

```
conversor-leads-sf/
├── app/                    # Electron application code
├── backend/                # Python backend API
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

- Login to [reino-capital.my.salesforce.com](https://reino-capital.my.salesforce.com)
- Go to Setup → App Manager → Find "Leads Processing App" → Edit
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
