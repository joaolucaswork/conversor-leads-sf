#!/usr/bin/env python3
"""
Script de Início Rápido
Facilita o uso do sistema de processamento de leads.
"""

import sys
import os
from pathlib import Path

def show_usage():
    print("🚀 Sistema de Processamento de Leads")
    print("=" * 40)
    print()
    print("COMANDOS DISPONÍVEIS:")
    print()
    print("1. Processar arquivo com IA:")
    print("   python quick_start.py ai arquivo.xlsx")
    print()
    print("2. Processar arquivo tradicional:")
    print("   python quick_start.py process arquivo.csv")
    print()
    print("3. Validar arquivo:")
    print("   python quick_start.py validate arquivo.csv")
    print()
    print("4. Configurar sistema:")
    print("   python quick_start.py setup")
    print()
    print("5. Testar sistema:")
    print("   python quick_start.py test")

def main():
    if len(sys.argv) < 2:
        show_usage()
        return
    
    command = sys.argv[1].lower()
    
    if command == "ai" and len(sys.argv) > 2:
        file_path = sys.argv[2]
        os.system(f"python core/master_leads_processor_ai.py {file_path}")
    
    elif command == "process" and len(sys.argv) > 2:
        file_path = sys.argv[2]
        os.system(f"python core/master_leads_processor.py {file_path}")
    
    elif command == "validate" and len(sys.argv) > 2:
        file_path = sys.argv[2]
        os.system(f"python tools/data_validator.py {file_path}")
    
    elif command == "setup":
        os.system("python tools/setup_ai_system.py")
    
    elif command == "test":
        os.system("python tests/test_ai_integration.py")
    
    else:
        show_usage()

if __name__ == "__main__":
    main()
