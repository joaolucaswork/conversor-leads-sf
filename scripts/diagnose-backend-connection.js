#!/usr/bin/env node

/**
 * Backend Connection Diagnostic Script
 * 
 * This script helps diagnose connection issues between the frontend and backend
 * for the Salesforce upload functionality.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const BACKEND_URLS = [
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://0.0.0.0:8000'
];

const ENDPOINTS_TO_TEST = [
  '/api/v1/health',
  '/api/v1/oauth/config',
  '/docs',
  '/api/v1/salesforce/upload'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Backend-Diagnostic-Script/1.0',
        ...headers
      },
      timeout: 5000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        code: error.code,
        url: url
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        code: 'TIMEOUT',
        url: url
      });
    });

    req.end();
  });
}

async function testEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint}`;
  console.log(`  Testing: ${colorize(endpoint, 'cyan')}`);
  
  const result = await makeRequest(url);
  
  if (result.success) {
    const statusColor = result.status < 300 ? 'green' : result.status < 400 ? 'yellow' : 'red';
    console.log(`    ✓ ${colorize(`HTTP ${result.status}`, statusColor)}`);
    
    // Special handling for specific endpoints
    if (endpoint === '/api/v1/health' && result.status === 200) {
      try {
        const healthData = JSON.parse(result.data);
        console.log(`    ✓ Health check: ${colorize('OK', 'green')}`);
        if (healthData.message) {
          console.log(`    ✓ Message: ${healthData.message}`);
        }
      } catch (e) {
        console.log(`    ⚠ Health endpoint returned non-JSON response`);
      }
    }
    
    if (endpoint === '/api/v1/oauth/config' && result.status === 200) {
      try {
        const configData = JSON.parse(result.data);
        console.log(`    ✓ OAuth config: ${colorize('Available', 'green')}`);
        if (configData.redirect_uri) {
          console.log(`    ✓ Redirect URI: ${configData.redirect_uri}`);
        }
      } catch (e) {
        console.log(`    ⚠ OAuth config returned non-JSON response`);
      }
    }
    
    if (endpoint === '/api/v1/salesforce/upload') {
      if (result.status === 405) {
        console.log(`    ✓ Endpoint exists (${colorize('Method Not Allowed expected for GET', 'yellow')})`);
      } else if (result.status === 422) {
        console.log(`    ✓ Endpoint exists (${colorize('Validation Error expected', 'yellow')})`);
      } else {
        console.log(`    ⚠ Unexpected status for upload endpoint`);
      }
    }
    
  } else {
    console.log(`    ✗ ${colorize(`Failed: ${result.error}`, 'red')}`);
    if (result.code) {
      console.log(`    ✗ Error Code: ${colorize(result.code, 'red')}`);
    }
  }
  
  return result;
}

async function testBackendUrl(baseUrl) {
  console.log(`\n${colorize('Testing Backend URL:', 'bright')} ${colorize(baseUrl, 'blue')}`);
  console.log('─'.repeat(60));
  
  const results = {};
  
  for (const endpoint of ENDPOINTS_TO_TEST) {
    const result = await testEndpoint(baseUrl, endpoint);
    results[endpoint] = result;
  }
  
  return results;
}

async function checkEnvironmentVariables() {
  console.log(`\n${colorize('Environment Variables Check:', 'bright')}`);
  console.log('─'.repeat(60));
  
  const envVars = [
    'VITE_API_BASE_URL',
    'NODE_ENV',
    'PYTHON_ENV'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✓ ${varName}: ${colorize(value, 'green')}`);
    } else {
      console.log(`  ⚠ ${varName}: ${colorize('Not set', 'yellow')}`);
    }
  });
}

async function checkProcesses() {
  console.log(`\n${colorize('Process Check:', 'bright')}`);
  console.log('─'.repeat(60));
  
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    // Check for Python processes that might be running the backend
    exec('tasklist /FI "IMAGENAME eq python.exe" 2>nul || ps aux | grep python | grep -v grep', (error, stdout, stderr) => {
      if (stdout && stdout.trim()) {
        console.log(`  ✓ ${colorize('Python processes found:', 'green')}`);
        const lines = stdout.split('\n').filter(line => line.trim());
        lines.slice(0, 3).forEach(line => {
          console.log(`    ${line.trim()}`);
        });
        if (lines.length > 3) {
          console.log(`    ... and ${lines.length - 3} more`);
        }
      } else {
        console.log(`  ⚠ ${colorize('No Python processes found', 'yellow')}`);
      }
      
      // Check for Node.js processes
      exec('tasklist /FI "IMAGENAME eq node.exe" 2>nul || ps aux | grep node | grep -v grep', (error, stdout, stderr) => {
        if (stdout && stdout.trim()) {
          console.log(`  ✓ ${colorize('Node.js processes found:', 'green')}`);
          const lines = stdout.split('\n').filter(line => line.trim());
          lines.slice(0, 3).forEach(line => {
            console.log(`    ${line.trim()}`);
          });
          if (lines.length > 3) {
            console.log(`    ... and ${lines.length - 3} more`);
          }
        } else {
          console.log(`  ⚠ ${colorize('No Node.js processes found', 'yellow')}`);
        }
        resolve();
      });
    });
  });
}

async function main() {
  console.log(colorize('🔍 Backend Connection Diagnostic Tool', 'bright'));
  console.log(colorize('=====================================', 'bright'));
  
  // Check environment variables
  await checkEnvironmentVariables();
  
  // Check running processes
  await checkProcesses();
  
  // Test each backend URL
  const allResults = {};
  for (const baseUrl of BACKEND_URLS) {
    const results = await testBackendUrl(baseUrl);
    allResults[baseUrl] = results;
  }
  
  // Summary
  console.log(`\n${colorize('Summary:', 'bright')}`);
  console.log('─'.repeat(60));
  
  let workingBackends = [];
  
  for (const [baseUrl, results] of Object.entries(allResults)) {
    const healthResult = results['/api/v1/health'];
    const uploadResult = results['/api/v1/salesforce/upload'];
    
    if (healthResult && healthResult.success && healthResult.status === 200) {
      workingBackends.push(baseUrl);
      console.log(`  ✓ ${colorize(baseUrl, 'green')} - Backend is running`);
      
      if (uploadResult && uploadResult.success && (uploadResult.status === 405 || uploadResult.status === 422)) {
        console.log(`    ✓ Salesforce upload endpoint is available`);
      } else {
        console.log(`    ⚠ Salesforce upload endpoint may have issues`);
      }
    } else {
      console.log(`  ✗ ${colorize(baseUrl, 'red')} - Backend not responding`);
    }
  }
  
  console.log(`\n${colorize('Recommendations:', 'bright')}`);
  console.log('─'.repeat(60));
  
  if (workingBackends.length === 0) {
    console.log(`  ${colorize('❌ No backend servers found running!', 'red')}`);
    console.log(`  ${colorize('🔧 To start the backend:', 'yellow')}`);
    console.log(`     1. Open a terminal in the project root`);
    console.log(`     2. Run: ${colorize('npm run dev', 'cyan')} (starts both frontend and backend)`);
    console.log(`     3. Or run: ${colorize('cd backend && python start_server.py', 'cyan')} (backend only)`);
  } else {
    console.log(`  ${colorize('✅ Backend server(s) found:', 'green')}`);
    workingBackends.forEach(url => {
      console.log(`     - ${url}`);
    });
    console.log(`  ${colorize('🔧 If Salesforce upload still fails:', 'yellow')}`);
    console.log(`     1. Check browser console for detailed error messages`);
    console.log(`     2. Verify OAuth authentication is working`);
    console.log(`     3. Check that processed files exist in the backend`);
    console.log(`     4. Review backend logs for Salesforce integration errors`);
  }
  
  console.log(`\n${colorize('Next Steps:', 'bright')}`);
  console.log('─'.repeat(60));
  console.log(`  1. If backend is not running: Start it with ${colorize('npm run dev', 'cyan')}`);
  console.log(`  2. If backend is running but upload fails: Check browser Network tab`);
  console.log(`  3. Check backend logs for detailed error information`);
  console.log(`  4. Verify Salesforce OAuth tokens are valid`);
}

// Run the diagnostic
main().catch(console.error);
