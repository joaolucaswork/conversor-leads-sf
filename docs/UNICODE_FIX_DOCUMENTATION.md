# Unicode Encoding Fix Documentation

## Problem Description

The application was encountering `UnicodeEncodeError` when processing files with names containing special characters (like Portuguese diacritics: ó, ã, ç, etc.). The error occurred specifically when:

1. **File Upload**: Files with names like "Cópia de Batch_3_(Backoffice)_13-05-25(1) (2).xlsx"
2. **Logging**: When the Python backend tried to log file paths containing Unicode characters
3. **Console Output**: When print statements tried to display Unicode characters on Windows console

### Error Details
```
UnicodeEncodeError: 'charmap' codec can't encode character '\u0301' in position 170: character maps to <undefined>
```

This error occurred because:
- Windows uses `cp1252` encoding by default for console output
- Python's default stdout/stderr couldn't handle Unicode characters
- The logging system wasn't configured for UTF-8 encoding

## Solution Implementation

### 1. Backend Main File (`src/backend/main.py`)

**Added UTF-8 encoding configuration at the top of the file:**

```python
# Configure UTF-8 encoding for Windows compatibility
if sys.platform.startswith('win'):
    # Set environment variable for Python I/O encoding
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    
    # Configure stdout and stderr to use UTF-8 encoding
    import codecs
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    if hasattr(sys.stderr, 'buffer'):
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
```

**Added safe print function:**

```python
def safe_print(message, *args, **kwargs):
    """
    Safe print function that handles Unicode encoding issues on Windows.
    Falls back to ASCII representation if Unicode encoding fails.
    """
    try:
        print(message, *args, **kwargs)
    except UnicodeEncodeError:
        try:
            # Try to encode as ASCII with error handling
            safe_message = str(message).encode('ascii', 'replace').decode('ascii')
            print(f"[UNICODE_SAFE] {safe_message}", *args, **kwargs)
        except Exception:
            # Last resort: just print a generic message
            print("[UNICODE_ERROR] Message contains characters that cannot be displayed", *args, **kwargs)
```

### 2. AI Processor (`core/master_leads_processor_ai.py`)

**Enhanced logging configuration with Unicode safety:**

```python
class SafeFormatter(logging.Formatter):
    def format(self, record):
        try:
            return super().format(record)
        except UnicodeEncodeError:
            # Replace problematic characters with safe alternatives
            record.msg = str(record.msg).encode('ascii', 'replace').decode('ascii')
            if record.args:
                safe_args = []
                for arg in record.args:
                    try:
                        safe_args.append(str(arg).encode('ascii', 'replace').decode('ascii'))
                    except:
                        safe_args.append('[UNICODE_ERROR]')
                record.args = tuple(safe_args)
            return super().format(record)
```

**Updated file path logging:**

```python
# Use safe logging for file paths with Unicode characters
try:
    self.logger.info(f"AI-processed file saved to: {output_path}")
except UnicodeEncodeError:
    self.logger.info(f"AI-processed file saved to: {str(output_path).encode('ascii', 'replace').decode('ascii')}")
```

**Replaced all print statements with safe_print:**

```python
# Before
print(f"Input file: {summary['input_file']}")

# After
safe_print(f"Input file: {summary['input_file']}")
```

### 3. Regular Processor (`core/master_leads_processor.py`)

Applied the same Unicode handling fixes:
- Added UTF-8 encoding configuration
- Added safe_print function
- Updated all print statements to use safe_print

### 4. Test Script (`test_unicode_fix.py`)

Created a comprehensive test script to verify the Unicode fix works correctly:
- Tests file name handling with Portuguese characters
- Tests logging with Unicode characters
- Tests actual file operations with Unicode names
- Provides detailed feedback on encoding configuration

### 5. Startup Script (`start_backend_unicode_safe.py`)

Created a startup script that ensures proper Unicode environment:
- Sets `PYTHONIOENCODING=utf-8`
- Configures platform-specific Unicode settings
- Starts the backend with proper encoding

## Environment Variables

The fix sets the following environment variables:

```bash
PYTHONIOENCODING=utf-8                    # Forces UTF-8 for Python I/O
PYTHONLEGACYWINDOWSSTDIO=0               # Uses new Windows console (Windows only)
LC_ALL=C.UTF-8                          # Sets locale to UTF-8 (Unix-like systems)
LANG=C.UTF-8                             # Sets language to UTF-8 (Unix-like systems)
```

## Testing the Fix

### 1. Run the Test Script
```bash
python test_unicode_fix.py
```

This will test:
- Unicode file name handling
- Logging with Unicode characters
- File operations with Unicode names

### 2. Test with Actual File Upload
1. Create a file with a Unicode name: `Cópia de teste.xlsx`
2. Upload it through the application
3. Verify that processing completes without Unicode errors

### 3. Check Logs
Look for log entries that show Unicode characters are properly handled:
```
2024-01-15 10:30:45 - INFO - AI-processed file saved to: data/output/Cópia_de_teste_processed_20240115_103045.csv
```

## Backward Compatibility

The fix is designed to be backward compatible:
- **Non-Windows systems**: The encoding configuration only applies to Windows
- **ASCII file names**: Continue to work exactly as before
- **Existing functionality**: No changes to core processing logic
- **Fallback handling**: If Unicode fails, falls back to ASCII representation

## Performance Impact

The Unicode fix has minimal performance impact:
- **Encoding check**: Only runs once at startup
- **Safe print function**: Only adds overhead when Unicode errors occur
- **Logging**: Uses efficient UTF-8 encoding for file operations
- **Memory usage**: No significant increase

## Troubleshooting

### If Unicode errors still occur:

1. **Check environment variables:**
   ```python
   import os
   print(f"PYTHONIOENCODING: {os.environ.get('PYTHONIOENCODING')}")
   ```

2. **Verify console encoding:**
   ```python
   import sys
   print(f"stdout encoding: {sys.stdout.encoding}")
   print(f"stderr encoding: {sys.stderr.encoding}")
   ```

3. **Test with simple Unicode:**
   ```python
   from src.backend.main import safe_print
   safe_print("Test: ção, ã, é, ó")
   ```

### Common Issues:

1. **Console still shows errors**: Use the startup script `start_backend_unicode_safe.py`
2. **Log files corrupted**: Ensure log directory has write permissions
3. **File operations fail**: Check that file paths are properly encoded

## Files Modified

1. `src/backend/main.py` - Added Unicode configuration and safe_print
2. `core/master_leads_processor_ai.py` - Enhanced logging and print safety
3. `core/master_leads_processor.py` - Added Unicode handling
4. `test_unicode_fix.py` - Created test script
5. `start_backend_unicode_safe.py` - Created startup script

## Conclusion

This fix ensures that the application can handle file names and content with international characters (Portuguese diacritics) without crashing. The solution is robust, backward-compatible, and provides fallback mechanisms for edge cases.

The application should now successfully process files with names like:
- `Cópia de Batch_3_(Backoffice)_13-05-25(1) (2).xlsx`
- `Relatório_de_Vendas_São_Paulo.csv`
- `Dados_Clientes_João_Maria.xlsx`
- `Informações_Técnicas_Ação.csv`
