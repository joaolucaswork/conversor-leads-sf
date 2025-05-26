#!/usr/bin/env python3
"""
Organização Completa do Workspace
Organiza todos os arquivos de forma limpa e estruturada.
"""

import os
import shutil
import sys
from pathlib import Path
from datetime import datetime

def create_clean_structure():
    """Cria a estrutura de pastas limpa e organizada."""
    print("📁 Criando estrutura de pastas organizada...")
    
    folders = {
        'core': 'Scripts principais do sistema',
        'tools': 'Ferramentas auxiliares e utilitários', 
        'data/input': 'Arquivos de entrada (CSV, Excel)',
        'data/output': 'Arquivos processados',
        'data/backup': 'Backups automáticos',
        'config': 'Arquivos de configuração',
        'logs': 'Logs de processamento',
        'docs': 'Documentação do sistema',
        'tests': 'Scripts de teste',
        'temp': 'Arquivos temporários'
    }
    
    for folder, description in folders.items():
        Path(folder).mkdir(parents=True, exist_ok=True)
        print(f"✓ {folder}/ - {description}")

def organize_core_files():
    """Organiza os arquivos principais do sistema."""
    print("\n🔧 Organizando arquivos principais...")
    
    core_files = [
        'master_leads_processor.py',
        'master_leads_processor_ai.py', 
        'ai_field_mapper.py'
    ]
    
    for file in core_files:
        if Path(file).exists():
            shutil.move(file, f'core/{file}')
            print(f"✓ Movido: {file} → core/")

def organize_tools():
    """Organiza ferramentas e utilitários."""
    print("\n🛠️ Organizando ferramentas...")
    
    tool_files = [
        'batch_processor.py',
        'data_validator.py',
        'organize_workspace.py',
        'organize_complete_workspace.py',
        'setup_ai_system.py',
        'install_excel_support.py'
    ]
    
    for file in tool_files:
        if Path(file).exists():
            shutil.move(file, f'tools/{file}')
            print(f"✓ Movido: {file} → tools/")

def organize_tests():
    """Organiza arquivos de teste."""
    print("\n🧪 Organizando testes...")
    
    test_files = [
        'test_ai_integration.py',
        'test_excel_support.py'
    ]
    
    for file in test_files:
        if Path(file).exists():
            shutil.move(file, f'tests/{file}')
            print(f"✓ Movido: {file} → tests/")

def organize_documentation():
    """Organiza documentação."""
    print("\n📚 Organizando documentação...")
    
    doc_files = [
        'README.md',
        'README_AI.md', 
        'USAGE_GUIDE.md'
    ]
    
    for file in doc_files:
        if Path(file).exists():
            shutil.move(file, f'docs/{file}')
            print(f"✓ Movido: {file} → docs/")

def organize_config_files():
    """Organiza arquivos de configuração."""
    print("\n⚙️ Organizando configurações...")
    
    config_files = [
        'config.json',
        'config_ai_sample.json',
        'requirements.txt',
        '.env'
    ]
    
    for file in config_files:
        if Path(file).exists():
            if file == 'requirements.txt':
                # Manter requirements.txt na raiz para facilidade
                continue
            shutil.move(file, f'config/{file}')
            print(f"✓ Movido: {file} → config/")

def organize_data_files():
    """Organiza arquivos de dados."""
    print("\n📊 Organizando arquivos de dados...")
    
    # Arquivos de entrada
    input_files = [
        'leads_vinteseismaio.xlsx'
    ]
    
    for file in input_files:
        if Path(file).exists():
            shutil.move(file, f'data/input/{file}')
            print(f"✓ Movido: {file} → data/input/")
    
    # Arquivos de trabalho (manter na raiz para facilidade)
    working_files = [
        'Novos_Leads_Sales.csv',
        'basedeleadssatualizada.csv'
    ]
    
    print("\n📋 Arquivos de trabalho mantidos na raiz:")
    for file in working_files:
        if Path(file).exists():
            print(f"✓ Mantido: {file}")

def clean_cache_and_temp():
    """Remove arquivos temporários e cache."""
    print("\n🧹 Limpando arquivos temporários...")
    
    # Remove __pycache__
    if Path('__pycache__').exists():
        shutil.rmtree('__pycache__')
        print("✓ Removido: __pycache__/")
    
    # Remove arquivos .pyc
    for pyc_file in Path('.').glob('**/*.pyc'):
        pyc_file.unlink()
        print(f"✓ Removido: {pyc_file}")

def create_main_readme():
    """Cria um README principal na raiz."""
    print("\n📝 Criando README principal...")
    
    readme_content = """# Sistema de Processamento de Leads com IA

Sistema completo para processamento inteligente de dados de leads com integração OpenAI.

## 🚀 Início Rápido

### Processamento Básico
```bash
# Processar arquivo com IA
python core/master_leads_processor_ai.py data/input/seu_arquivo.xlsx

# Processar sem IA
python core/master_leads_processor.py data/input/seu_arquivo.csv
```

### Configuração Inicial
```bash
# Instalar dependências
pip install -r requirements.txt

# Configurar sistema
python tools/setup_ai_system.py

# Testar Excel
python tests/test_excel_support.py
```

## 📁 Estrutura do Projeto

```
├── core/                    # Scripts principais
│   ├── master_leads_processor_ai.py    # Processador com IA
│   ├── master_leads_processor.py       # Processador tradicional
│   └── ai_field_mapper.py              # Mapeamento inteligente
├── tools/                   # Ferramentas auxiliares
├── data/                    # Dados de entrada e saída
├── config/                  # Configurações
├── docs/                    # Documentação completa
├── tests/                   # Scripts de teste
└── logs/                    # Logs de processamento
```

## 📊 Arquivos de Trabalho

- `Novos_Leads_Sales.csv` - Arquivo principal de trabalho
- `basedeleadssatualizada.csv` - Base de referência

## 🤖 Recursos com IA

- ✅ Mapeamento inteligente de colunas
- ✅ Validação automática de dados
- ✅ Suporte a múltiplos idiomas
- ✅ Pontuação de confiança
- ✅ Fallback para regras tradicionais

## 📚 Documentação

Consulte `docs/` para documentação completa:
- `README_AI.md` - Recursos com IA
- `USAGE_GUIDE.md` - Guia de uso detalhado

## 🔧 Configuração

Configure sua chave da OpenAI em `config/.env`:
```
OPENAI_API_KEY=sua_chave_aqui
```

---
**Versão**: 2.0 com IA  
**Última Atualização**: 2024
"""
    
    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print("✓ README.md principal criado")

def create_quick_start_script():
    """Cria script de início rápido."""
    print("\n⚡ Criando script de início rápido...")
    
    quick_start_content = """#!/usr/bin/env python3
\"\"\"
Script de Início Rápido
Facilita o uso do sistema de processamento de leads.
\"\"\"

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
"""
    
    with open('quick_start.py', 'w', encoding='utf-8') as f:
        f.write(quick_start_content)
    
    print("✓ quick_start.py criado")

def create_gitignore():
    """Cria arquivo .gitignore."""
    print("\n🔒 Criando .gitignore...")
    
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

# Dados sensíveis
*.csv
*.xlsx
*.xls
config/.env
.env

# Logs
logs/*.log
*.log

# Temporários
temp/
*.tmp
*.bak

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Backups
data/backup/*
!data/backup/.gitkeep
"""
    
    with open('.gitignore', 'w', encoding='utf-8') as f:
        f.write(gitignore_content)
    
    print("✓ .gitignore criado")

def create_gitkeep_files():
    """Cria arquivos .gitkeep para manter estrutura de pastas."""
    print("\n📌 Criando arquivos .gitkeep...")
    
    gitkeep_dirs = [
        'data/backup',
        'data/input', 
        'data/output',
        'logs',
        'temp'
    ]
    
    for dir_path in gitkeep_dirs:
        gitkeep_file = Path(dir_path) / '.gitkeep'
        gitkeep_file.touch()
        print(f"✓ Criado: {gitkeep_file}")

def show_final_structure():
    """Mostra a estrutura final organizada."""
    print("\n" + "="*60)
    print("📁 ESTRUTURA FINAL ORGANIZADA")
    print("="*60)
    
    structure = """
📁 Novos Leads/
├── 📄 README.md                    # Documentação principal
├── 📄 quick_start.py               # Script de início rápido
├── 📄 requirements.txt             # Dependências Python
├── 📄 .gitignore                   # Arquivos ignorados pelo Git
├── 📄 Novos_Leads_Sales.csv        # Arquivo principal de trabalho
├── 📄 basedeleadssatualizada.csv   # Base de referência
├── 📁 core/                        # Scripts principais
│   ├── master_leads_processor_ai.py    # Processador com IA
│   ├── master_leads_processor.py       # Processador tradicional
│   └── ai_field_mapper.py              # Mapeamento inteligente
├── 📁 tools/                       # Ferramentas auxiliares
│   ├── batch_processor.py              # Processamento em lote
│   ├── data_validator.py               # Validação de dados
│   ├── setup_ai_system.py              # Configuração do sistema
│   └── install_excel_support.py        # Suporte a Excel
├── 📁 data/                        # Dados
│   ├── input/                          # Arquivos de entrada
│   ├── output/                         # Arquivos processados
│   └── backup/                         # Backups automáticos
├── 📁 config/                      # Configurações
│   ├── config.json                     # Configuração principal
│   ├── .env                            # Chave da API OpenAI
│   └── instrucoes.txt                  # Instruções originais
├── 📁 docs/                        # Documentação
│   ├── README_AI.md                    # Recursos com IA
│   └── USAGE_GUIDE.md                  # Guia de uso
├── 📁 tests/                       # Testes
│   ├── test_ai_integration.py          # Teste de integração IA
│   └── test_excel_support.py           # Teste de suporte Excel
├── 📁 logs/                        # Logs de processamento
└── 📁 temp/                        # Arquivos temporários
"""
    
    print(structure)

def main():
    """Função principal de organização."""
    print("🔧 ORGANIZAÇÃO COMPLETA DO WORKSPACE")
    print("=" * 50)
    
    # Confirmar com o usuário
    response = input("Deseja organizar completamente o workspace? (s/n): ")
    if response.lower() != 's':
        print("❌ Operação cancelada.")
        return
    
    try:
        # Executar organização
        create_clean_structure()
        organize_core_files()
        organize_tools()
        organize_tests()
        organize_documentation()
        organize_config_files()
        organize_data_files()
        clean_cache_and_temp()
        create_main_readme()
        create_quick_start_script()
        create_gitignore()
        create_gitkeep_files()
        
        print("\n" + "="*50)
        print("✅ ORGANIZAÇÃO CONCLUÍDA COM SUCESSO!")
        print("="*50)
        
        show_final_structure()
        
        print("\n🚀 PRÓXIMOS PASSOS:")
        print("1. Use: python quick_start.py [comando]")
        print("2. Consulte: README.md para instruções")
        print("3. Configure: config/.env com sua chave OpenAI")
        print("4. Teste: python quick_start.py test")
        
    except Exception as e:
        print(f"\n❌ Erro durante a organização: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
