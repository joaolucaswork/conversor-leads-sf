# GitHub Project Reorganization Guide

## Overview

This guide explains how to use the GitHub Project Reorganizer to transform your leads processing project into a clean, professional, GitHub-ready repository structure while maintaining 100% functionality and ensuring security.

## 🎯 Goals

The reorganization achieves the following objectives:

1. **Clean GitHub-ready organization**: Logical folder structure following Python/React best practices
2. **Security and privacy**: Comprehensive .gitignore to prevent confidential data exposure
3. **Functionality preservation**: 100% application compatibility in both Electron and browser modes
4. **Professional structure**: Industry-standard codebase organization suitable for public sharing

## 📁 Before vs After Structure

### Current Structure
```
conversor-leads-sf/
├── app/                    # Electron files mixed with other content
├── backend/                # Backend scattered across root
├── core/                   # Core logic in root
├── src/                    # Frontend mixed with other files
├── data/                   # Contains sensitive lead data
├── logs/                   # Contains processing logs with sensitive info
├── config/                 # Mixed configuration files
├── tools/                  # Development tools
├── docs/                   # Documentation scattered
├── *.md files              # Multiple MD files in root
└── Various config files    # Configuration files in root
```

### Proposed GitHub-Ready Structure
```
conversor-leads-sf/
├── README.md               # Main project documentation
├── package.json            # NPM configuration
├── requirements.txt        # Python dependencies
├── .gitignore             # Enhanced security-focused gitignore
├── config/                # All configuration files
│   ├── vite.config.js
│   ├── electron-builder.yml
│   ├── salesforce_field_mapping.json
│   └── tsconfig*.json
├── src/                   # All source code organized
│   ├── frontend/          # React frontend (moved from src/)
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── i18n/
│   │   └── styles/
│   ├── electron/          # Electron app (moved from app/)
│   │   ├── main.js
│   │   └── preload.js
│   ├── backend/           # Python backend API
│   │   ├── main.py
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── migrations/
│   └── core/              # Core processing logic
│       ├── ai_field_mapper.py
│       ├── master_leads_processor.py
│       └── salesforce_integration.py
├── docs/                  # Consolidated documentation
│   ├── api/               # API documentation
│   ├── setup/             # Setup guides
│   ├── troubleshooting/   # Troubleshooting guides
│   └── legacy/            # Legacy documentation
├── tools/                 # Development tools and utilities
├── scripts/               # Build and deployment scripts
├── tests/                 # Test suites
├── examples/              # Example files and templates
│   ├── sample_leads.csv
│   └── field_mapping_example.json
└── .github/               # GitHub-specific templates
    ├── workflows/
    ├── ISSUE_TEMPLATE/
    └── PULL_REQUEST_TEMPLATE.md
```

## 🚀 Usage Instructions

### Step 1: Preview Changes (Recommended)

First, run the script in preview mode to see what changes will be made:

```bash
# Preview the reorganization
python tools/github_project_reorganizer.py

# Or analyze the current structure only
python tools/github_project_reorganizer.py --analyze
```

This will show you:
- Current project structure analysis
- Proposed GitHub-ready structure
- List of all file operations that will be performed
- Security analysis of sensitive files

### Step 2: Apply Reorganization

Once you're satisfied with the preview, apply the changes:

```bash
# Apply the reorganization (creates automatic backup)
python tools/github_project_reorganizer.py --apply
```

The script will:
1. Create a complete backup in `backup_before_reorganization/`
2. Reorganize files according to the new structure
3. Update Python import paths automatically
4. Generate an enhanced security-focused .gitignore
5. Create GitHub templates (issue templates, PR template)
6. Create example files for the examples directory
7. Generate a detailed log of all changes

### Step 3: Verify Functionality

After reorganization, test that everything still works:

```bash
# Test the unified development startup
npm run dev

# Test browser mode
npm run dev:servers

# Test Electron desktop mode
npm run electron:dev

# Test backend API
python src/backend/main.py
```

### Step 4: Rollback (If Needed)

If something goes wrong, you can easily rollback:

```bash
# Rollback to the original structure
python tools/github_project_reorganizer.py --rollback
```

## 🔒 Security Features

The reorganizer includes comprehensive security measures:

### Enhanced .gitignore
- **API Keys & Credentials**: Prevents any API keys, tokens, or credentials from being committed
- **Lead Data**: Blocks all Excel/CSV files containing sensitive lead information
- **Logs**: Excludes all log files that may contain sensitive processing information
- **Cache**: Prevents AI mapping cache and temporary files from being committed
- **Exceptions**: Allows example and template files while blocking real data

### Data Protection
- Automatically identifies and catalogs sensitive files
- Creates secure examples without real data
- Maintains .gitkeep files for empty directories
- Provides audit trail of all changes

## 📋 What Gets Moved

### Core Processing Files
- `core/` → `src/core/`
- `backend/` → `src/backend/`

### Frontend Components
- `src/` → `src/frontend/`
- `app/` → `src/electron/`
- `public/` → `src/frontend/public/`

### Configuration Files
- Configuration files consolidated in `config/`
- Build configurations moved to appropriate locations
- Environment files properly secured

### Documentation
- All `.md` files organized in `docs/`
- Legacy documentation preserved in `docs/legacy/`
- API documentation in `docs/api/`

### Tools and Scripts
- Development tools remain in `tools/`
- Build scripts organized in `scripts/`
- Test suites in `tests/`

## 🔧 Import Path Updates

The script automatically updates Python import paths:

```python
# Before
from core.ai_field_mapper import AIFieldMapper
from backend.models.database import get_db

# After
from src.core.ai_field_mapper import AIFieldMapper
from src.backend.models.database import get_db
```

## 📊 Logging and Monitoring

The reorganizer provides comprehensive logging:

- **Real-time progress**: See each operation as it happens
- **Change log**: JSON file with complete audit trail
- **Error handling**: Detailed error messages and recovery suggestions
- **Backup tracking**: Complete record of backup location and contents

## 🎯 Benefits After Reorganization

1. **Professional Appearance**: Clean, industry-standard structure
2. **Enhanced Security**: Comprehensive protection against data leaks
3. **Better Maintainability**: Logical organization makes code easier to navigate
4. **GitHub Ready**: Includes all necessary templates and configurations
5. **Preserved Functionality**: All features continue to work exactly as before
6. **Easy Collaboration**: Clear structure makes it easier for others to contribute

## ⚠️ Important Notes

- **Backup**: The script automatically creates a complete backup before making changes
- **Testing**: Always test functionality after reorganization
- **Git**: Commit any pending changes before running the reorganizer
- **Dependencies**: Ensure all Python dependencies are installed
- **Permissions**: Make sure you have write permissions to the project directory

## 🆘 Troubleshooting

### Common Issues

1. **Import Errors**: If you see import errors after reorganization, check that the import path updates were applied correctly
2. **Missing Files**: Verify that the backup was created successfully
3. **Permission Errors**: Ensure you have write permissions to all directories
4. **Git Issues**: Make sure your working directory is clean before reorganizing

### Recovery

If something goes wrong:
1. Use the rollback feature: `python tools/github_project_reorganizer.py --rollback`
2. Check the backup directory: `backup_before_reorganization/`
3. Review the change log in `logs/reorganization_log_*.json`

## 📞 Support

If you encounter issues:
1. Check the logs in the `logs/` directory
2. Review the change log for detailed operation history
3. Use the rollback feature to restore the original structure
4. Refer to the troubleshooting section above

The reorganizer is designed to be safe and reversible, ensuring your project remains functional throughout the process.
