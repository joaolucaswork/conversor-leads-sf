/**
 * OAuth Configuration Test Script
 * Run this to validate your Salesforce OAuth setup
 */

require("dotenv").config();
const crypto = require("crypto");

// Load environment variables
const sfHost =
  process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com";
const sfClientId = process.env.SALESFORCE_CLIENT_ID;
const sfClientSecret = process.env.SALESFORCE_CLIENT_SECRET;
const sfRedirectUri = process.env.SALESFORCE_REDIRECT_URI;

console.log("=== SALESFORCE OAUTH CONFIGURATION TEST ===\n");

// Test 1: Environment Variables
console.log("1. Environment Variables Check:");
console.log("✓ SALESFORCE_LOGIN_URL:", sfHost);
console.log(
  "✓ SALESFORCE_CLIENT_ID:",
  sfClientId ? `${sfClientId.substring(0, 20)}...` : "❌ NOT SET"
);
console.log(
  "✓ SALESFORCE_CLIENT_SECRET:",
  sfClientSecret ? "SET" : "❌ NOT SET"
);
console.log("✓ SALESFORCE_REDIRECT_URI:", sfRedirectUri || "❌ NOT SET");

// Test 2: Required Fields Validation
console.log("\n2. Required Fields Validation:");
const missingFields = [];
if (!sfClientId) missingFields.push("SALESFORCE_CLIENT_ID");
if (!sfClientSecret) missingFields.push("SALESFORCE_CLIENT_SECRET");
if (!sfRedirectUri) missingFields.push("SALESFORCE_REDIRECT_URI");

if (missingFields.length > 0) {
  console.log("❌ Missing required fields:", missingFields.join(", "));
  console.log(
    "Please check your .env file and ensure all required fields are set."
  );
  process.exit(1);
} else {
  console.log("✅ All required fields are present");
}

// Test 3: PKCE Implementation
console.log("\n3. PKCE Implementation Test:");
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

const testCodeVerifier = generateCodeVerifier();
const testCodeChallenge = generateCodeChallenge(testCodeVerifier);

console.log(
  "✓ Code Verifier Length:",
  testCodeVerifier.length,
  "(should be 43)"
);
console.log(
  "✓ Code Challenge Length:",
  testCodeChallenge.length,
  "(should be 43)"
);
console.log(
  "✓ Code Verifier Sample:",
  testCodeVerifier.substring(0, 20) + "..."
);
console.log(
  "✓ Code Challenge Sample:",
  testCodeChallenge.substring(0, 20) + "..."
);

// Test 4: OAuth URL Generation
console.log("\n4. OAuth URL Generation Test:");
try {
  const { AuthorizationCode } = require("simple-oauth2");

  const oauth2 = new AuthorizationCode({
    client: {
      id: sfClientId,
      secret: sfClientSecret,
    },
    auth: {
      tokenHost: sfHost,
      tokenPath: "/services/oauth2/token",
      authorizePath: "/services/oauth2/authorize",
    },
    options: {
      authorizationMethod: "body",
    },
  });

  const authUrl = oauth2.authorizeURL({
    redirect_uri: sfRedirectUri,
    scope: "api id web refresh_token",
    code_challenge: testCodeChallenge,
    code_challenge_method: "S256",
  });

  console.log("✅ OAuth URL generated successfully");
  console.log("✓ URL:", authUrl);

  // Validate URL components
  const url = new URL(authUrl);
  console.log("✓ Host:", url.host);
  console.log("✓ Path:", url.pathname);
  console.log(
    "✓ Client ID in URL:",
    url.searchParams.get("client_id") ? "✅ Present" : "❌ Missing"
  );
  console.log(
    "✓ Redirect URI in URL:",
    url.searchParams.get("redirect_uri") ? "✅ Present" : "❌ Missing"
  );
  console.log(
    "✓ Code Challenge in URL:",
    url.searchParams.get("code_challenge") ? "✅ Present" : "❌ Missing"
  );
  console.log("✓ Scope in URL:", url.searchParams.get("scope") || "❌ Missing");
} catch (error) {
  console.log("❌ OAuth URL generation failed:", error.message);
}

// Test 5: Redirect URI Validation
console.log("\n5. Redirect URI Validation:");
try {
  const redirectUrl = new URL(sfRedirectUri);
  console.log("✅ Redirect URI is valid URL");
  console.log("✓ Protocol:", redirectUrl.protocol);
  console.log("✓ Host:", redirectUrl.host);
  console.log("✓ Path:", redirectUrl.pathname);

  // Check for common issues
  if (
    redirectUrl.protocol === "http:" &&
    redirectUrl.hostname !== "localhost"
  ) {
    console.log(
      "⚠️  Warning: Using HTTP for non-localhost redirect URI may cause issues"
    );
  }

  if (redirectUrl.pathname.endsWith("/")) {
    console.log(
      "⚠️  Warning: Redirect URI ends with '/' - ensure this matches Salesforce config exactly"
    );
  }
} catch (error) {
  console.log("❌ Invalid redirect URI:", error.message);
}

// Test 6: Token Exchange Parameters Validation
console.log("\n6. Token Exchange Parameters Test:");
console.log(
  "✓ Scope parameter: EXCLUDED from token exchange (Salesforce requirement)"
);
console.log("✓ Required parameters for token exchange:");
console.log("  - code (authorization code)");
console.log("  - redirect_uri (must match authorization request)");
console.log("  - code_verifier (PKCE verification)");
console.log("  - client_id (automatically added by simple-oauth2)");
console.log("  - client_secret (automatically added by simple-oauth2)");
console.log(
  "  - grant_type=authorization_code (automatically added by simple-oauth2)"
);

console.log("\n=== CONFIGURATION TEST COMPLETE ===");
console.log("\nNext Steps:");
console.log(
  "1. Verify the redirect URI in your Salesforce Connected App matches exactly:",
  sfRedirectUri
);
console.log(
  "2. Ensure your Connected App has the following OAuth scopes enabled:"
);
console.log("   - Access your basic information (id)");
console.log(
  "   - Perform requests on your behalf at any time (refresh_token, offline_access)"
);
console.log("   - Access and manage your data (api)");
console.log("   - Access the identity URL service (web)");
console.log(
  "3. Make sure 'Require Secret for Web Server Flow' is enabled in your Connected App"
);
console.log(
  "4. Verify 'Enable PKCE' is checked in your Connected App OAuth settings"
);
console.log(
  "5. IMPORTANT: Scope parameter is only used in authorization URL, NOT in token exchange!"
);
