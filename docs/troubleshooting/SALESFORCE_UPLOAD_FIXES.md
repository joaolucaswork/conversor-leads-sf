# Salesforce Upload Fixes - JSON Parsing and OwnerId Resolution

## Overview

This document describes the fixes implemented to resolve two critical issues in the Salesforce leads upload functionality:

1. **JSON Parsing Issue**: Frontend failing to parse Python script response due to `NaN` values
2. **Salesforce OwnerId Validation**: Salesforce rejecting uploads with username/alias instead of valid User IDs

## Issues Fixed

### Issue 1: JSON Parsing with NaN Values

**Problem**: 
- JavaScript frontend was failing to parse Python script response with error: `Unexpected token 'N', ..." "Phone": NaN,`
- Python's `json.dumps()` was serializing pandas `NaN` values as `NaN` (not valid JSON)
- JavaScript's `JSON.parse()` cannot handle `NaN` values

**Root Cause**:
- Pandas DataFrames contain `NaN` values for missing/invalid phone numbers
- Standard JSON serialization doesn't handle `NaN`, `Infinity`, or numpy types properly

**Solution**:
- Created `SafeJSONEncoder` class that converts problematic values to `null`
- Enhanced `_clean_record` method with better NaN handling
- Improved phone number cleaning to prevent NaN creation
- Added DataFrame preprocessing to replace `NaN` with `None` before serialization

### Issue 2: Salesforce OwnerId Validation

**Problem**:
- Salesforce error: `MALFORMED_ID: ID do proprietário: Tipo do valor do ID incorreto: pmarques`
- System was passing usernames/aliases like "pmarques" as OwnerId values
- Salesforce expects valid 15 or 18-character User IDs, not usernames

**Root Cause**:
- No user ID resolution logic to convert usernames to Salesforce User IDs
- Lead distribution was assigning aliases directly without validation

**Solution**:
- Added `resolve_owner_ids()` method to query Salesforce Users
- Implemented user ID caching to avoid repeated API calls
- Added multiple query strategies (Username, Alias, Name, partial matches)
- Enhanced error handling for unresolved owner values

## Files Modified

### 1. `core/salesforce_integration.py`

**Key Changes**:
- Added `SafeJSONEncoder` class for safe JSON serialization
- Added `resolve_owner_ids()` method for OwnerId resolution
- Added `_query_user_id()` helper method
- Enhanced `_clean_record()` method with better NaN handling
- Added user ID caching mechanism
- Updated main function to use SafeJSONEncoder

**New Features**:
```python
class SafeJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that safely handles NaN, infinity, and other problematic values."""
    
def resolve_owner_ids(self, df: pd.DataFrame) -> pd.DataFrame:
    """Resolve OwnerId values from usernames/aliases to actual Salesforce User IDs."""
    
def _query_user_id(self, owner_value: str) -> Optional[str]:
    """Query Salesforce to find a User ID for the given owner value."""
```

### 2. `core/master_leads_processor_ai.py`

**Key Changes**:
- Enhanced `clean_phone_number_ai()` method with better NaN handling
- Added validation for minimum phone number length
- Improved handling of various NaN representations

## Technical Details

### SafeJSONEncoder Implementation

The `SafeJSONEncoder` recursively processes data structures and:
- Converts `pd.isna()` values to `None`
- Handles numpy integer/floating types
- Converts `NaN` and `Infinity` to `None`
- Preserves valid data while ensuring JSON compatibility

### OwnerId Resolution Process

1. **Extract unique owner values** from DataFrame
2. **Skip already valid IDs** (15/18 character IDs starting with '005')
3. **Check cache** for previously resolved values
4. **Query Salesforce** using multiple strategies:
   - Exact Username match
   - Exact Alias match
   - Exact Name match
   - Partial matches (LIKE queries)
5. **Cache results** to avoid repeated API calls
6. **Apply mapping** to DataFrame

### Phone Number Cleaning Improvements

Enhanced cleaning now:
- Handles various NaN representations (`NaN`, `nan`, `null`, `none`)
- Validates minimum phone number length (8 digits)
- Preserves international format (+ prefix)
- Converts float representations properly

## Testing

Created comprehensive test suite (`tools/test_salesforce_fixes.py`) that validates:

1. **SafeJSONEncoder functionality** with various problematic values
2. **Phone number cleaning** with edge cases
3. **DataFrame NaN handling** and JSON serialization
4. **Test CSV creation** with realistic problematic data

All tests pass successfully, confirming the fixes work as expected.

## Usage

### Automatic Integration

The fixes are automatically applied during the normal upload process:

1. **Data Processing**: Enhanced phone cleaning prevents NaN creation
2. **OwnerId Resolution**: Automatic conversion of usernames to User IDs
3. **JSON Serialization**: Safe encoding prevents parsing errors
4. **Error Handling**: Graceful fallbacks for unresolved values

### Manual Testing

Use the created test CSV file:
```bash
python tools/test_salesforce_fixes.py
```

This creates `data/test_leads_with_nans.csv` with problematic data for testing.

## Error Handling

### Graceful Degradation

- **Unresolved Owner IDs**: Keep original values, let Salesforce validate
- **Invalid Phone Numbers**: Skip invalid entries with detailed logging
- **JSON Serialization**: Convert problematic values to `null`

### Logging

Enhanced logging provides detailed information about:
- Owner ID resolution attempts and results
- Data cleaning operations and skipped fields
- JSON serialization issues and fixes

## Performance Considerations

### Caching

- User ID mappings are cached to avoid repeated Salesforce queries
- Cache persists for the duration of the upload session

### Batch Processing

- Owner ID resolution is performed once per unique value
- Efficient DataFrame operations minimize processing time

## Backward Compatibility

All changes maintain backward compatibility:
- Existing processed files continue to work
- Original error handling is preserved
- No breaking changes to API interfaces

## Next Steps

1. **Monitor upload success rates** after deployment
2. **Collect user feedback** on OwnerId resolution accuracy
3. **Consider persistent caching** for user ID mappings across sessions
4. **Add configuration options** for owner resolution strategies

## Conclusion

These fixes address the core issues preventing successful Salesforce uploads:
- JSON parsing errors are eliminated through safe serialization
- OwnerId validation errors are resolved through proper User ID mapping
- Enhanced data cleaning prevents problematic values from reaching Salesforce

The implementation is robust, well-tested, and maintains full backward compatibility while significantly improving upload reliability.
