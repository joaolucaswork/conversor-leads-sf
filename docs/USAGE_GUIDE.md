# Guia de Uso - Sistema de Processamento de Leads com IA

## Visão Geral

Sistema completo e organizado para processamento inteligente de dados de leads com integração OpenAI ChatGPT. O sistema combina todas as funcionalidades em uma estrutura limpa e organizada que pode:

- **Auto-detectar** formatos de arquivo (CSV, Excel)
- **Mapear inteligentemente** colunas com IA
- **Padronizar** dados para formato consistente
- **Limpar e formatar** dados (telefones, nomes, emails)
- **Distribuir leads** conforme regras predefinidas
- **Gerar relatórios** e resumos detalhados
- **Criar backups** automaticamente

## 🚀 Início Rápido

### 1. Configuração Inicial (Primeira Vez)

```bash
# Instalar dependências
pip install -r requirements.txt

# Configurar sistema com IA
python quick_start.py setup

# Testar instalação
python quick_start.py test
```

### 2. Estrutura Organizada

O sistema agora está completamente organizado:

```
📁 Sistema de Leads/
├── 📁 core/                        # Scripts principais
├── 📁 tools/                       # Ferramentas auxiliares
├── 📁 data/                        # Dados (input/output/backup)
├── 📁 config/                      # Configurações
├── 📁 docs/                        # Documentação
├── 📁 tests/                       # Scripts de teste
├── 📁 logs/                        # Logs de processamento
├── 📄 quick_start.py               # Script de início rápido
└── 📄 README.md                    # Documentação principal
```

### 3. Processar Arquivos

#### **Usando o Script de Início Rápido (Recomendado)**

```bash
# Processar com IA (melhor opção)
python quick_start.py ai data/input/arquivo.xlsx

# Processar tradicional
python quick_start.py process data/input/arquivo.csv

# Validar dados
python quick_start.py validate data/output/arquivo_processado.csv
```

#### **Comandos Diretos**

```bash
# Processamento com IA
python core/master_leads_processor_ai.py data/input/arquivo.xlsx

# Processamento tradicional
python core/master_leads_processor.py data/input/arquivo.csv

# Validação de dados
python tools/data_validator.py data/output/arquivo.csv
```

## Supported Input Formats

### 1. Raw Format (Semicolon-separated)

```
Cliente;Telefone Adicional;Telefone;E-mail;Volume Aproximado;Tipo;Estado;Descrição;Alias
```

### 2. Standard Format (Comma-separated)

```
Last Name,Telefone Adcional,Phone,Email,Description,Patrimônio Financeiro,Tipo,State/Province,OwnerId,maisdeMilhao__c
```

### 3. Pernambuco/Batch Format

Similar to standard format but may have different financial values and distributions.

## Configuration

The system uses `config.json` for configuration. Key settings:

### Lead Distribution

```json
{
  "lead_distribution": {
    "guic": 100,
    "cmilfont": 100,
    "ctint": 70,
    "pnilo": 30
  }
}
```

### Default Values

```json
{
  "default_values": {
    "patrimonio_financeiro": 1300000,
    "tipo": "Pessoa Física",
    "maisdeMilhao__c": 1
  }
}
```

### Processing Options

```json
{
  "processing_options": {
    "clean_phone_numbers": true,
    "format_names": true,
    "format_emails": true,
    "auto_distribute_leads": true,
    "remove_empty_rows": true
  }
}
```

## Data Processing Features

### 1. Phone Number Cleaning

- Removes all non-digit characters
- Handles decimal points (.0)
- Manages empty/NA values

### 2. Name Formatting

- Converts to Title Case
- Handles hyphenated names
- Preserves proper capitalization

### 3. Email Formatting

- Converts to lowercase
- Trims whitespace
- Validates format (optional)

### 4. Financial Data Conversion

- Converts R$ values to numeric
- Removes currency symbols and formatting
- Applies default values when needed

### 5. Lead Distribution

- Assigns leads according to configuration
- Ensures even distribution
- Logs distribution summary

## Output Files

For each processing run, the system generates:

1. **Processed CSV file** - The main output with standardized data
2. **Summary JSON file** - Processing statistics and metadata
3. **Log file** - Detailed processing log
4. **Backup file** - Copy of original input file

## Examples

### Process a raw format file

```bash
python master_leads_processor.py "leads-19-maio.csv"
```

### Process with custom output location

```bash
python master_leads_processor.py "input.csv" -o "data/output/processed_leads.csv"
```

### Use custom configuration

```bash
python master_leads_processor.py "input.csv" -c "custom_config.json"
```

## Troubleshooting

### Common Issues

1. **File encoding errors**
   - The system automatically tries UTF-8 and Latin-1 encodings
   - Check the log file for encoding details

2. **Column mapping issues**
   - Verify your input file format matches expected formats
   - Check the configuration file for column mappings

3. **Distribution not working**
   - Ensure the lead distribution totals don't exceed your data
   - Check the configuration for correct alias names

### Log Files

Check the `logs/` directory for detailed processing logs. Each run creates a timestamped log file with:

- File detection results
- Processing steps
- Error messages
- Distribution summaries

## Advanced Usage

### Custom Configuration Files

Create a custom configuration file based on `config.json`:

```json
{
  "lead_distribution": {
    "sales_team_a": 150,
    "sales_team_b": 100,
    "sales_team_c": 50
  },
  "default_values": {
    "patrimonio_financeiro": 2000000
  }
}
```

### Batch Processing

For processing multiple files, create a simple script:

```python
from master_leads_processor import LeadsProcessor

processor = LeadsProcessor('config.json')

files = ['file1.csv', 'file2.csv', 'file3.csv']
for file in files:
    processor.process_file(file)
```

## Migration from Individual Scripts

If you were using individual scripts before, here's the mapping:

- `clean_phone_numbers.py` → Built into master script
- `format_name_email.py` → Built into master script
- `process_new_leads.py` → Replaced by master script
- `distribuir_leads_pernambuco.py` → Built into master script
- `merge_new_leads.py` → Use master script + manual merge if needed

## Support

For issues or questions:

1. Check the log files in `logs/`
2. Verify your configuration in `config.json`
3. Ensure input file format is supported
4. Review this usage guide for examples
