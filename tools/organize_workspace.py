#!/usr/bin/env python3
"""
Workspace Organization Script
Organizes files into logical folder structure before creating the master script.
"""

import os
import shutil
import sys
from pathlib import Path

def create_folder_structure():
    """Create the logical folder structure for the workspace."""
    folders = [
        'scripts',
        'data/input',
        'data/output', 
        'data/backup',
        'config'
    ]
    
    print("Creating folder structure...")
    for folder in folders:
        Path(folder).mkdir(parents=True, exist_ok=True)
        print(f"✓ Created: {folder}/")

def move_python_scripts():
    """Move all Python scripts to the scripts folder."""
    python_files = [
        'clean_phone_numbers.py',
        'convert_to_utf8.py',
        'correcao_final.py',
        'corrigir_formatacao.py',
        'corrigir_telefones.py',
        'distribuir_leads_pernambuco.py',
        'format_name_email.py',
        'format_phone_numbers.py',
        'merge_new_leads.py',
        'merge_new_leads_fixed.py',
        'padronizar_pernambuco.py',
        'process_leads_19_maio.py',
        'process_new_leads.py',
        'redistribuir_leads.py',
        'replace_file.py'
    ]
    
    print("\nMoving Python scripts to scripts/ folder...")
    for script in python_files:
        if os.path.exists(script):
            shutil.move(script, f'scripts/{script}')
            print(f"✓ Moved: {script}")
        else:
            print(f"⚠ Not found: {script}")

def move_data_files():
    """Move data files to appropriate folders."""
    
    # Input data files
    input_files = [
        'leads-19-maio.csv',
        'Leads 1m+ dia 26 de Maio.xlsx'
    ]
    
    # Backup existing processed files
    backup_files = [
        'Novos_Leads_Sales_Backup.csv',
        'Novos_Leads_Sales_Processed.csv',
        'processed_leads_19_maio.csv'
    ]
    
    # Current working files (keep in root for now)
    working_files = [
        'Novos_Leads_Sales.csv',
        'basedeleadssatualizada.csv'
    ]
    
    # Batch files
    batch_files = [
        'Batch 5 - Pernambuco - Final_Corrigido.csv',
        'Batch 5 - Pernambuco - Final_Redistribuido.csv', 
        'Batch 5 - Pernambuco - Redistribuido.csv'
    ]
    
    print("\nMoving input files...")
    for file in input_files:
        if os.path.exists(file):
            shutil.move(file, f'data/input/{file}')
            print(f"✓ Moved to input: {file}")
    
    print("\nMoving backup files...")
    for file in backup_files:
        if os.path.exists(file):
            shutil.move(file, f'data/backup/{file}')
            print(f"✓ Moved to backup: {file}")
    
    print("\nMoving batch files...")
    for file in batch_files:
        if os.path.exists(file):
            shutil.move(file, f'data/output/{file}')
            print(f"✓ Moved to output: {file}")

def move_config_files():
    """Move configuration files."""
    config_files = [
        'instrucoes.txt'
    ]
    
    print("\nMoving configuration files...")
    for file in config_files:
        if os.path.exists(file):
            shutil.move(file, f'config/{file}')
            print(f"✓ Moved to config: {file}")

def create_gitignore():
    """Create a .gitignore file for the project."""
    gitignore_content = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Data files
*.csv
*.xlsx
*.xls

# Logs
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
"""
    
    with open('.gitignore', 'w', encoding='utf-8') as f:
        f.write(gitignore_content)
    print("✓ Created .gitignore")

def main():
    """Main function to organize the workspace."""
    print("=== Workspace Organization Script ===")
    print("This script will organize files into a logical folder structure.\n")
    
    # Ask for confirmation
    response = input("Do you want to proceed with organizing the workspace? (y/n): ")
    if response.lower() != 'y':
        print("Operation cancelled.")
        return
    
    try:
        create_folder_structure()
        move_python_scripts()
        move_data_files()
        move_config_files()
        create_gitignore()
        
        print("\n=== Organization Complete ===")
        print("Workspace has been organized successfully!")
        print("\nNew structure:")
        print("├── scripts/          # All Python processing scripts")
        print("├── data/")
        print("│   ├── input/        # Raw input files")
        print("│   ├── output/       # Processed output files")
        print("│   └── backup/       # Backup files")
        print("├── config/           # Configuration files")
        print("├── Novos_Leads_Sales.csv     # Main working file")
        print("├── basedeleadssatualizada.csv # Base reference file")
        print("└── README.md         # Documentation")
        
    except Exception as e:
        print(f"\n❌ Error during organization: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
