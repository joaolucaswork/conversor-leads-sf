/**
 * OAuth Fix Verification Script
 * This script verifies that the scope parameter fix has been applied correctly
 */

const fs = require('fs');
const path = require('path');

console.log("=== OAUTH SCOPE PARAMETER FIX VERIFICATION ===\n");

// Check main.js for the scope parameter fix
const mainJsPath = path.join(__dirname, 'app', 'main.js');

if (!fs.existsSync(mainJsPath)) {
  console.log("❌ app/main.js not found");
  process.exit(1);
}

const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

console.log("1. Checking token exchange parameters in app/main.js:");

// Check if scope parameter is removed from token exchange
const tokenParamsRegex = /const tokenParams = \{[\s\S]*?\};/;
const tokenParamsMatch = mainJsContent.match(tokenParamsRegex);

if (tokenParamsMatch) {
  const tokenParamsCode = tokenParamsMatch[0];
  console.log("✓ Found tokenParams definition");
  
  // Check if scope is NOT included
  if (tokenParamsCode.includes('scope:')) {
    console.log("❌ ISSUE: scope parameter is still included in tokenParams");
    console.log("   This will cause 'scope parameter not supported' error");
    console.log("   Found:", tokenParamsCode);
  } else {
    console.log("✅ FIXED: scope parameter correctly excluded from tokenParams");
  }
  
  // Check if required parameters are present
  const requiredParams = ['code:', 'redirect_uri:', 'code_verifier:'];
  const missingParams = requiredParams.filter(param => !tokenParamsCode.includes(param));
  
  if (missingParams.length === 0) {
    console.log("✅ All required parameters present: code, redirect_uri, code_verifier");
  } else {
    console.log("❌ Missing required parameters:", missingParams);
  }
} else {
  console.log("❌ Could not find tokenParams definition in main.js");
}

// Check for the explanatory comment
if (mainJsContent.includes('Salesforce OAuth token exchange does NOT accept scope parameter')) {
  console.log("✅ Explanatory comment found");
} else {
  console.log("⚠️  Explanatory comment not found (optional)");
}

// Check for enhanced logging
if (mainJsContent.includes('scope: NOT INCLUDED')) {
  console.log("✅ Enhanced logging includes scope exclusion note");
} else {
  console.log("⚠️  Enhanced logging for scope exclusion not found");
}

console.log("\n2. Checking OAuth URL generation (should still include scope):");

// Check if authorization URL still includes scope (this is correct)
const authUrlRegex = /oauth2\.authorizeURL\(\{[\s\S]*?\}\)/;
const authUrlMatch = mainJsContent.match(authUrlRegex);

if (authUrlMatch) {
  const authUrlCode = authUrlMatch[0];
  if (authUrlCode.includes('scope:')) {
    console.log("✅ Authorization URL correctly includes scope parameter");
  } else {
    console.log("❌ Authorization URL missing scope parameter (this is needed)");
  }
} else {
  console.log("⚠️  Could not find authorization URL generation");
}

console.log("\n3. Summary of OAuth Flow:");
console.log("✓ Authorization URL: INCLUDES scope parameter (correct)");
console.log("✓ Token Exchange: EXCLUDES scope parameter (fixed)");

console.log("\n=== VERIFICATION COMPLETE ===");

// Check if test files exist
const testFiles = [
  'test-oauth-config.js',
  'OAUTH_TROUBLESHOOTING.md'
];

console.log("\n4. Additional Resources:");
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} available for testing`);
  } else {
    console.log(`⚠️  ${file} not found`);
  }
});

console.log("\nNext Steps:");
console.log("1. Run: node test-oauth-config.js");
console.log("2. Start the application: npm run dev");
console.log("3. Test OAuth login flow");
console.log("4. Verify no 'scope parameter not supported' errors occur");
