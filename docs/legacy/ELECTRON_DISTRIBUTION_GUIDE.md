# Electron Desktop App Distribution Guide

## Overview

The Electron desktop application should be distributed separately from the web version hosted on Heroku. This guide covers building and distributing the desktop app.

## Building the Desktop App

### 1. Prepare for Desktop Build

```bash
# Install dependencies
npm install

# Build frontend for Electron (uses relative paths)
npm run build:electron

# Build the Electron app
npm run electron:build
```

### 2. Configure for Production Backend

Update the desktop app to connect to your Heroku-hosted backend:

```javascript
// In app/main.js, update the backend URL
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app-name.herokuapp.com'
  : 'http://localhost:8000';
```

### 3. Update Electron Builder Configuration

```yaml
# electron-builder.yml
appId: com.reinocapital.leadsprocessing
productName: Leads Processing System
directories:
  output: dist-electron
files:
  - filter:
    - dist-renderer/**/*
    - app/**/*
    - package.json
    - "!**/node_modules/**/*"
    - "!backend/**/*"  # Exclude backend from desktop build
win:
  target: nsis
  icon: assets/icon.ico
mac:
  target: dmg
  icon: assets/icon.icns
linux:
  target: AppImage
  icon: assets/icon.png
```

## Distribution Options

### Option 1: GitHub Releases (Recommended)

1. **Setup GitHub Actions for Auto-Build**:

```yaml
# .github/workflows/electron-build.yml
name: Build Electron App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - run: npm install
    - run: npm run build:electron
    - run: npm run electron:build
    
    - uses: actions/upload-artifact@v3
      with:
        name: electron-app-${{ matrix.os }}
        path: dist-electron/
```

2. **Create Release**:

```bash
# Tag a release
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will automatically build and create release
```

### Option 2: Direct Distribution

1. **Build for Multiple Platforms**:

```bash
# Windows (from Windows machine)
npm run electron:build -- --win

# macOS (from macOS machine)  
npm run electron:build -- --mac

# Linux (from Linux machine)
npm run electron:build -- --linux
```

2. **Upload to File Hosting**:
   - Use services like AWS S3, Google Drive, or Dropbox
   - Provide download links to users

### Option 3: Microsoft Store / Mac App Store

For enterprise distribution, consider publishing to official app stores:

1. **Windows Store**: Use `electron-builder` with `--win appx`
2. **Mac App Store**: Use `electron-builder` with `--mac mas`

## Desktop App Configuration

### Environment Detection

The desktop app should automatically detect if it's running against the local or remote backend:

```javascript
// In src/services/apiService.js (already implemented)
const getApiBaseUrl = () => {
  // Check if running in Electron
  if (window.electronAPI) {
    // Desktop app - use Heroku backend
    return "https://your-app-name.herokuapp.com/api/v1";
  }
  
  // Web app - use relative URLs
  if (import.meta.env.PROD) {
    return window.location.origin + "/api/v1";
  }
  
  // Development
  return "http://localhost:8000/api/v1";
};
```

### Update Notifications

Implement auto-update functionality:

```bash
# Install electron-updater
npm install electron-updater

# Configure in main.js
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

## Security Considerations

### Code Signing

For production distribution:

1. **Windows**: Get a code signing certificate
2. **macOS**: Use Apple Developer certificate
3. **Configure in electron-builder.yml**:

```yaml
win:
  certificateFile: path/to/certificate.p12
  certificatePassword: ${env.CERTIFICATE_PASSWORD}
mac:
  identity: "Developer ID Application: Your Name"
```

### Notarization (macOS)

```yaml
mac:
  hardenedRuntime: true
  entitlements: assets/entitlements.mac.plist
afterSign: scripts/notarize.js
```

## User Installation Guide

Create a simple installation guide for end users:

### Windows
1. Download the `.exe` installer
2. Run the installer (may show security warning)
3. Follow installation wizard
4. Launch from Start Menu

### macOS
1. Download the `.dmg` file
2. Open the DMG and drag app to Applications
3. First launch: Right-click → Open (to bypass Gatekeeper)
4. Launch normally afterward

### Linux
1. Download the `.AppImage` file
2. Make executable: `chmod +x app.AppImage`
3. Run: `./app.AppImage`

## Maintenance

### Regular Updates

1. **Backend Updates**: Automatic (Heroku deployment)
2. **Desktop Updates**: Require new builds and distribution
3. **Coordinate Releases**: Ensure desktop app compatibility with backend API changes

### Version Management

- Use semantic versioning (v1.0.0, v1.1.0, etc.)
- Tag releases in Git
- Maintain changelog for user-facing changes
- Test desktop app against production backend before release
