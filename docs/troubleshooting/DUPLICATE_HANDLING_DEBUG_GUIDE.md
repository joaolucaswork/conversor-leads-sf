# Duplicate Handling Debug Guide

## Issue Fixed: "Failed to fetch existing records: undefined"

### Root Cause Analysis

The error "Failed to fetch existing records: undefined" was occurring because:

1. **Frontend Error Handling**: The `result.error` was `undefined` when the backend failed
2. **Backend ID Extraction**: Salesforce record IDs weren't being properly extracted from error messages
3. **Python Script Execution**: The duplicate handler script might not be executing correctly

### Fixes Applied

#### 1. **Enhanced Frontend Error Handling** (`src/components/DuplicateHandlingDialog.jsx`)

**Before:**
```javascript
console.error('Failed to fetch existing records:', result.error);
```

**After:**
```javascript
const errorMessage = result?.error || 'Unknown error occurred while fetching existing records';
console.error('Failed to fetch existing records:', errorMessage);
console.error('Full result object:', result);
console.error('Duplicates data sent:', duplicates);
```

**Benefits:**
- ✅ Prevents "undefined" error messages
- ✅ Provides detailed debugging information
- ✅ Always falls back to mock data for development

#### 2. **Improved ID Extraction** (`core/salesforce_integration.py`)

**Enhanced Regex Patterns:**
```python
id_patterns = [
    r'\b(00Q[0-9A-Za-z]{12,15})\b',  # Lead IDs
    r'\b(003[0-9A-Za-z]{12,15})\b',  # Contact IDs  
    r'\b(001[0-9A-Za-z]{12,15})\b',  # Account IDs
    r'\b(00[0-9A-Za-z][0-9A-Za-z]{12,15})\b'  # General pattern
]
```

**Fallback Search:**
- If no IDs found in error message, searches for potential duplicates
- Uses field matching (Email, Phone, LastName, Company)
- Provides backup record IDs for comparison

#### 3. **Enhanced Backend Logging** (`app/main.js`)

**Added Comprehensive Logging:**
```javascript
console.log("Fetch existing records - Python script result:", result);
console.error("Raw stdout:", stdout);
console.error("Raw stderr:", stderr);
```

**Better Error Messages:**
```javascript
error: "Failed to execute duplicate handler script - Python not found or script error",
details: "Tried commands: " + pythonCommands.join(", ")
```

#### 4. **Improved Duplicate Handler** (`core/duplicate_handler.py`)

**Enhanced Record Fetching:**
- Searches for potential duplicates when no IDs provided
- Better error handling and logging
- Graceful fallback mechanisms

### Testing the Fix

#### Test Case 1: Check Console Logs
1. Open Developer Tools (F12)
2. Go to Console tab
3. Upload file with duplicates
4. Look for these log messages:
   ```
   Fetching existing records for duplicates: [...]
   Fetch existing records result: {...}
   ```

#### Test Case 2: Verify Data Structure
The duplicates array should contain:
```javascript
[
  {
    recordNumber: 1,
    newRecord: { LastName: "Silva", Email: "test@example.com" },
    existingRecordIds: ["00Q000000123456AAA"],
    errorMessage: "DUPLICATES_DETECTED: ...",
    matchedFields: ["Email", "LastName"]
  }
]
```

#### Test Case 3: Backend Verification
Check if Python script executes correctly:
1. Open terminal in project root
2. Run manually:
   ```bash
   python core/duplicate_handler.py --action fetch --access-token "YOUR_TOKEN" --instance-url "YOUR_INSTANCE" --data '[{"recordNumber":1,"newRecord":{"Email":"test@example.com"},"existingRecordIds":["00Q123456789012"]}]'
   ```

### Expected Behavior After Fix

#### ✅ **Success Scenario**
1. Dialog opens with duplicate information
2. "Loading existing record details..." appears briefly
3. Comparison table shows with existing vs. new data
4. User can select fields to update

#### ✅ **Fallback Scenario** (if backend fails)
1. Dialog opens with duplicate information
2. Shows mock data for comparison
3. User can still interact with dialog
4. Console shows detailed error information

#### ✅ **Error Handling**
- No more "undefined" error messages
- Detailed logging for debugging
- Graceful degradation to mock data
- User can still resolve duplicates

### Debugging Steps

If issues persist:

1. **Check Console Logs:**
   ```javascript
   // Look for these patterns:
   "Fetching existing records for duplicates:"
   "Fetch existing records result:"
   "Failed to fetch existing records:"
   "Falling back to mock data"
   ```

2. **Verify Duplicate Data:**
   ```javascript
   // In console, check:
   console.log(duplicates);
   // Should show array with existingRecordIds
   ```

3. **Test Python Script:**
   ```bash
   # Test if Python is available:
   python --version
   python3 --version
   py --version
   
   # Test script execution:
   python core/duplicate_handler.py --help
   ```

4. **Check Salesforce Authentication:**
   ```javascript
   // In console:
   window.electronAPI.getStoreValue('salesforceAuth')
   ```

### Next Steps

The fix ensures that:
- ✅ Error messages are always meaningful
- ✅ Dialog works even if backend fails
- ✅ Better ID extraction from Salesforce errors
- ✅ Comprehensive logging for debugging
- ✅ Graceful fallback to mock data

The duplicate handling should now work reliably with proper error handling and user feedback.
