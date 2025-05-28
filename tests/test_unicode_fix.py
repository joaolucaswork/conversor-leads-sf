#!/usr/bin/env python3
"""
Test script to verify Unicode encoding fixes for file processing.
This script tests the ability to handle file names with special characters.
"""

import os
import sys
import tempfile
from pathlib import Path

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

# Safe print function for Unicode handling
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

def test_unicode_file_handling():
    """Test handling of file names with Unicode characters."""
    safe_print("Testing Unicode file handling...")

    # Test file names with Portuguese characters
    test_filenames = [
        "Cópia de Batch_3_(Backoffice)_13-05-25(1) (2).xlsx",
        "Relatório_de_Vendas_São_Paulo.csv",
        "Dados_Clientes_João_Maria.xlsx",
        "Informações_Técnicas_Ação.csv"
    ]

    for filename in test_filenames:
        try:
            safe_print(f"Testing filename: {filename}")

            # Test path operations
            test_path = Path(filename)
            safe_print(f"  - Path stem: {test_path.stem}")
            safe_print(f"  - Path suffix: {test_path.suffix}")
            safe_print(f"  - Path name: {test_path.name}")

            # Test string operations
            safe_print(f"  - Encoded as ASCII: {filename.encode('ascii', 'replace').decode('ascii')}")

            safe_print(f"  ✓ Successfully handled: {filename}")

        except Exception as e:
            safe_print(f"  ✗ Error handling {filename}: {e}")

    safe_print("\nUnicode file handling test completed!")

def test_logging_with_unicode():
    """Test logging with Unicode characters."""
    import logging

    safe_print("Testing logging with Unicode characters...")

    # Create a simple logger
    logger = logging.getLogger('unicode_test')
    logger.setLevel(logging.INFO)

    # Create console handler with UTF-8 encoding
    console_handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Test logging with Unicode
    test_messages = [
        "Processing file: Cópia de arquivo.xlsx",
        "User: João Silva uploaded a file",
        "Location: São Paulo, Brasil",
        "Status: Processamento concluído com sucesso"
    ]

    for message in test_messages:
        try:
            logger.info(message)
            safe_print(f"  ✓ Successfully logged: {message}")
        except Exception as e:
            safe_print(f"  ✗ Error logging message: {e}")

    safe_print("\nLogging with Unicode test completed!")

def test_file_operations():
    """Test actual file operations with Unicode names."""
    safe_print("Testing file operations with Unicode names...")

    # Create a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        # Test file with Unicode name
        unicode_filename = "Teste_Arquivo_Ação_João.txt"
        test_file = temp_path / unicode_filename

        try:
            # Write to file
            with open(test_file, 'w', encoding='utf-8') as f:
                f.write("Conteúdo do arquivo com acentos: ção, ã, é, ó\n")
                f.write("Este é um teste de codificação UTF-8.\n")

            safe_print(f"  ✓ Successfully created file: {unicode_filename}")

            # Read from file
            with open(test_file, 'r', encoding='utf-8') as f:
                content = f.read()

            safe_print(f"  ✓ Successfully read file content")
            safe_print(f"  Content preview: {content[:50]}...")

            # Test file existence
            if test_file.exists():
                safe_print(f"  ✓ File exists check passed")

            # Test file size
            file_size = test_file.stat().st_size
            safe_print(f"  ✓ File size: {file_size} bytes")

        except Exception as e:
            safe_print(f"  ✗ Error in file operations: {e}")

    safe_print("\nFile operations test completed!")

def main():
    """Run all Unicode tests."""
    safe_print("=" * 60)
    safe_print("UNICODE ENCODING FIX VERIFICATION")
    safe_print("=" * 60)
    safe_print(f"Python version: {sys.version}")
    safe_print(f"Platform: {sys.platform}")
    safe_print(f"Default encoding: {sys.getdefaultencoding()}")
    safe_print(f"File system encoding: {sys.getfilesystemencoding()}")
    safe_print(f"PYTHONIOENCODING: {os.environ.get('PYTHONIOENCODING', 'Not set')}")
    safe_print("=" * 60)

    # Run tests
    test_unicode_file_handling()
    safe_print("")
    test_logging_with_unicode()
    safe_print("")
    test_file_operations()

    safe_print("=" * 60)
    safe_print("ALL TESTS COMPLETED!")
    safe_print("If you see this message without errors, the Unicode fix is working.")
    safe_print("=" * 60)

if __name__ == "__main__":
    main()
