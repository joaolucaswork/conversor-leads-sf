# 🚀 AI-Enhanced Leads Processing System

<div align="center">

[![React](https://img.shields.io/badge/React-18.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Electron](https://img.shields.io/badge/Electron-28.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Salesforce](https://img.shields.io/badge/Salesforce-Integration-00A1E0?style=for-the-badge&logo=salesforce&logoColor=white)](https://developer.salesforce.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

**Transform raw lead data into Salesforce-ready records with AI-powered intelligence**

[🎯 Features](#-key-features) • [🚀 Quick Start](#-quick-start) • [📖 Documentation](#-api-documentation) • [🔧 Development](#-development)

</div>

---

## 🎯 Overview

A comprehensive **full-stack lead processing system** that intelligently transforms CSV/Excel files into Salesforce-ready lead records. Built with modern technologies and AI capabilities, it offers seamless data processing with smart field mapping, validation, and automated distribution.

### ✨ What Makes It Special

🤖 **AI-Powered Intelligence** - Automatic field mapping and data validation using OpenAI  
⚡ **Real-Time Processing** - Live progress tracking with detailed status updates  
🔄 **Salesforce Integration** - Direct OAuth connection with automatic lead upload  
📱 **Multi-Platform** - Web app, desktop app (Electron), and REST API  
🌍 **Internationalized** - Full Portuguese and English language support  
📊 **Analytics Dashboard** - Comprehensive processing statistics and cost tracking

---

## 🚀 Key Features

### 🤖 AI-Powered Processing

- **Intelligent Field Mapping**: Automatically detects and maps columns from different languages
- **Pattern Recognition**: Identifies data patterns and suggests appropriate target fields
- **Confidence Scoring**: Provides reliability metrics (0-100%) for each mapping decision
- **Multi-language Support**: Handles variations like "Cliente" vs "Customer" vs "Nome" vs "Last Name"
- **Fallback Processing**: Seamlessly switches to rule-based processing when AI is unavailable

### 📊 Data Processing & Validation

- **File Format Support**: Excel (.xlsx, .xls), CSV with automatic encoding detection
- **Data Cleaning**: Phone number formatting, email validation, name standardization
- **Duplicate Detection**: Advanced algorithms to identify and handle duplicate leads
- **Batch Processing**: Handle up to 10,000 records per file efficiently
- **Data Validation**: Comprehensive validation rules with detailed error reporting

### 🔄 Salesforce Integration

- **OAuth 2.0 Authentication**: Secure login flow with token management
- **Direct Upload**: Push processed leads directly to Salesforce objects
- **Field Mapping Configuration**: Customizable field relationships via JSON configuration
- **Lead Distribution**: Intelligent assignment to sales team members
- **Real-time Status**: Live updates on upload progress and results

### 🌐 Multi-Platform Support

- **Web Application**: Browser-based interface accessible from anywhere
- **Desktop Application**: Native Electron app for Windows, macOS, and Linux
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Offline Capability**: Process files locally without internet connection (desktop app)

---

## 🛠️ Technology Stack

### Frontend

- **React 18** with Material-UI components and Vite build system
- **Zustand** for state management and **React Router** for navigation
- **i18next** for internationalization (Portuguese/English)
- **Lottie React** for animations and **React Dropzone** for file uploads

### Backend

- **Python 3.9+** with **FastAPI** framework and **Uvicorn** server
- **Pandas** for data manipulation and **OpenPyXL/XLRD** for Excel processing
- **OpenAI API** integration for AI-powered field mapping
- **Salesforce REST API** with OAuth 2.0 authentication

### Desktop

- **Electron 28** for cross-platform desktop application
- **Electron Builder** for packaging and distribution
- **Auto-updater** for seamless application updates

### Deployment

- **Heroku** for cloud deployment with automated scripts
- **PostgreSQL** for optional fine-tuning data storage
- **Environment-based configuration** for security

---

## 📂 Project Structure

```
conversor-leads-sf/
├── 📁 app/                    # Electron desktop application
│   ├── main.js                # Main Electron process
│   └── preload.js             # Preload scripts for security
├── 📁 backend/                # Python FastAPI backend
│   ├── main.py                # FastAPI application entry point
│   ├── models/                # Database models
│   ├── services/              # Business logic services
│   └── middleware/            # Custom middleware
├── 📁 src/                    # React frontend source code
│   ├── components/            # Reusable UI components
│   ├── pages/                 # Application pages/routes
│   ├── services/              # API service layer
│   ├── store/                 # State management (Zustand)
│   ├── i18n/                  # Internationalization
│   └── utils/                 # Utility functions
├── 📁 core/                   # Core processing modules
│   ├── ai_field_mapper.py     # AI-powered field mapping
│   ├── master_leads_processor_ai.py # AI-enhanced processing
│   ├── salesforce_integration.py   # Salesforce API integration
│   └── duplicate_handler.py   # Duplicate detection logic
├── 📁 config/                 # Configuration files
│   ├── config.json            # Main application configuration
│   ├── config_sample.json     # Configuration template
│   └── salesforce_field_mapping.json # Field mapping rules
├── 📁 tools/                  # Development and utility tools
├── 📁 scripts/                # Deployment and setup scripts
├── 📁 data/                   # Data storage directories
│   ├── input/                 # Input files for processing
│   ├── output/                # Processed output files
│   └── backup/                # Backup files
├── package.json               # Node.js dependencies and scripts
├── requirements.txt           # Python dependencies
├── vite.config.js             # Vite build configuration
├── electron-builder.yml       # Electron build configuration
└── .env.example               # Environment variables template
```

---

## 🔍 Prerequisites

- **Node.js** v16.0.0 or higher
- **Python** v3.9 or higher
- **NPM** v8.0.0 or higher
- **Storage** At least 500MB of free disk space
- **Memory** Minimum 4GB RAM recommended
- **Salesforce** Developer account for API integration
- **OpenAI** API key for AI features (optional)---

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/conversor-leads-sf.git
cd conversor-leads-sf

# Install dependencies
npm install
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required: OPENAI_API_KEY, SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET
```

### 3. Start Development Environment

```bash
# Start all services (backend + frontend + electron)
npm run dev
```

This will start:

- 🐍 Backend API server on `http://localhost:8000`
- ⚛️ Frontend Vite server on `http://localhost:5173`
- 🖥️ Electron desktop application

### 4. Access the Application

- **Web Version**: Open `http://localhost:5173` in your browser
- **Desktop Version**: Electron app opens automatically
- **API Documentation**: Visit `http://localhost:8000/docs`---

## 📱 User Interface

### Main Features

#### 🏠 **Home Page**

- Drag-and-drop file upload with progress tracking
- Processing status with real-time updates
- File history with download and preview options

#### ⚙️ **Settings Page**

- OpenAI API key configuration
- AI processing settings (confidence threshold, model selection)
- Language selection (Portuguese/English)
- Lead distribution configuration

#### 📊 **Admin Dashboard**

- Processing statistics and analytics
- AI usage tracking and cost monitoring
- System health and performance metrics
- User management and access control

#### 🔍 **Data Preview**

- Field mapping visualization
- Data validation results
- Processing summary with statistics
- Download processed files

### Key Components

- **File Upload**: Drag-and-drop interface with format validation
- **Processing Status**: Real-time progress with detailed status updates
- **Salesforce Status Bar**: Connection status and user profile
- **Global Notifications**: Success/error messages with auto-dismiss
- **Cost Tracking Dashboard**: AI usage statistics and optimization metrics---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev                    # Start full development environment
npm run dev:backend           # Start only backend server
npm run dev:frontend          # Start only frontend server
npm run dev:servers           # Start backend + frontend (no Electron)

# Building
npm run build                 # Build for production (web)
npm run build:electron        # Build for Electron
npm run electron:build        # Build Electron distributable

# Electron
npm run electron:start        # Start Electron app
npm run electron:dev          # Development mode with hot reload

# Deployment
npm run deploy:heroku         # Deploy to Heroku (Linux/Mac)
npm run deploy:heroku:windows # Deploy to Heroku (Windows)

# Utilities
npm run diagnose              # Diagnose backend connection issues
```

### Development Workflow

1. **Start Development Environment**: `npm run dev`
2. **Make Changes**: Edit files in `src/`, `backend/`, or `core/`
3. **Test Changes**: Use hot reload for frontend, restart for backend
4. **Build and Test**: `npm run build` and `npm run electron:build`
5. **Deploy**: Use deployment scripts for Heroku or build distributables---

## 🌐 Deployment

### Web Application (Heroku)

**Automated Deployment (Recommended):**

```bash
# Linux/Mac
npm run deploy:heroku your-app-name

# Windows
npm run deploy:heroku:windows your-app-name
```

The automated script handles:

- Heroku app creation
- Buildpack configuration (Node.js + Python)
- Environment variables setup
- Application deployment
- Salesforce OAuth configuration

### Desktop Application

```bash
# Build distributable for current platform
npm run electron:build

# Distributables will be in dist-electron/
```

Supports Windows (NSIS installer), macOS (DMG), and Linux (AppImage).

---

## 📖 API Documentation

### Core Endpoints

- **POST** `/api/v1/upload` - Upload and process lead files
- **GET** `/api/v1/processing/{id}/status` - Get processing status
- **GET** `/api/v1/processing/{id}/download` - Download processed file
- **POST** `/api/v1/salesforce/upload` - Upload leads to Salesforce
- **GET** `/api/v1/health` - API health check

### Authentication

- **GET** `/api/v1/auth/salesforce/login` - Initiate Salesforce OAuth
- **POST** `/api/v1/auth/salesforce/callback` - Handle OAuth callback
- **GET** `/api/v1/auth/salesforce/status` - Check authentication status

### AI Features

- **POST** `/api/v1/ai/field-mapping` - AI-powered field mapping
- **GET** `/api/v1/ai/usage-stats` - AI usage statistics
- **POST** `/api/v1/ai/validate-data` - AI data validation

Full API documentation available at `/docs` when running the server.---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Salesforce OAuth Configuration
SALESFORCE_CLIENT_ID=your_salesforce_client_id
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_REDIRECT_URI=http://localhost:5173/oauth/callback

# Application Configuration
DEBUG=false
NODE_ENV=development
PYTHON_ENV=development

# Database (Optional - for fine-tuning)
DATABASE_URL=postgresql://user:password@localhost:5432/leads_db
```

### Salesforce Setup

1. **Create Connected App in Salesforce:**
   - Go to Setup > App Manager > New Connected App
   - Enable OAuth settings
   - Set Callback URL to `http://localhost:5173/oauth/callback`
   - Add OAuth scopes: `api`, `refresh_token`, `offline_access`

2. **Configure Field Mapping:**
   - Edit `config/salesforce_field_mapping.json`
   - Map your CSV columns to Salesforce fields
   - Add custom fields as needed

### AI Configuration

Edit `config/config.json` to customize AI processing:

```json
{
  "ai_processing": {
    "enabled": true,
    "confidence_threshold": 80.0,
    "model": "gpt-3.5-turbo",
    "max_retries": 3,
    "fallback_to_rules": true
  }
}
```

---

## 🔍 Troubleshooting

### Common Issues

#### Backend Connection Issues

```bash
# Diagnose backend connectivity
npm run diagnose

# Check if backend is running
curl http://localhost:8000/api/v1/health
```

#### Salesforce OAuth Issues

- Verify callback URL in Salesforce Connected App
- Check client ID and secret in environment variables
- Ensure proper OAuth scopes are configured

#### AI Processing Issues

- Verify OpenAI API key is valid and has credits
- Check AI processing settings in configuration
- Review error logs for specific AI-related errors

#### File Processing Issues

- Ensure file format is supported (.csv, .xlsx, .xls)
- Check file encoding (UTF-8 recommended)
- Verify file size is under 10MB limit

### Getting Help

- Check the [API documentation](http://localhost:8000/docs) when running
- Review error logs in the browser console or terminal
- Ensure all prerequisites are installed and up to date

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for efficient lead processing**

[⬆️ Back to Top](#-ai-enhanced-leads-processing-system)

</div>
