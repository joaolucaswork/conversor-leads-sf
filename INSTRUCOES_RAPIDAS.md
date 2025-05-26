# 🚀 Instruções Rápidas - Sistema de Leads com IA

## ⚡ Comandos Essenciais

### **Processar Arquivo (Recomendado)**
```bash
# Com IA (melhor resultado)
python quick_start.py ai data/input/seu_arquivo.xlsx

# Tradicional (sem IA)
python quick_start.py process data/input/seu_arquivo.csv
```

### **Configuração Inicial**
```bash
# Primeira vez - configurar tudo
python quick_start.py setup

# Testar se está funcionando
python quick_start.py test
```

### **Validar Resultados**
```bash
# Verificar qualidade dos dados processados
python quick_start.py validate data/output/arquivo_processado.csv
```

## 📁 Onde Colocar os Arquivos

### **Entrada** 
- Coloque seus arquivos em: `data/input/`
- Formatos aceitos: `.xlsx`, `.xls`, `.csv`

### **Saída**
- Arquivos processados ficam em: `data/output/`
- Backups automáticos em: `data/backup/`

### **Logs**
- Logs detalhados em: `logs/`

## ⚙️ Configuração da IA

### **Chave OpenAI**
Crie o arquivo `config/.env`:
```
OPENAI_API_KEY=sua_chave_openai_aqui
```

### **Configurações**
Edite `config/config.json` para personalizar:
- Distribuição de leads
- Valores padrão
- Configurações de IA

## 🔧 Solução de Problemas

### **IA não funciona**
```bash
python quick_start.py setup
```

### **Erro com Excel**
```bash
python tools/install_excel_support.py
```

### **Ver logs detalhados**
```bash
# Windows
type logs\ai_leads_processing_*.log

# Linux/Mac
cat logs/ai_leads_processing_*.log
```

## 📊 Fluxo Típico de Trabalho

1. **Colocar arquivo** em `data/input/`
2. **Processar**: `python quick_start.py ai data/input/arquivo.xlsx`
3. **Verificar** resultados em `data/output/`
4. **Validar** (opcional): `python quick_start.py validate data/output/arquivo_processado.csv`

## 🎯 Distribuição Padrão de Leads

- **guic**: 100 leads
- **cmilfont**: 100 leads
- **ctint**: 70 leads
- **pnilo**: 30 leads

*Total: 300 leads por lote*

## 📚 Documentação Completa

- `README.md` - Documentação principal
- `docs/USAGE_GUIDE.md` - Guia detalhado
- `docs/README_AI.md` - Recursos com IA
- `docs/CHANGELOG.md` - Histórico de mudanças

## 🆘 Ajuda Rápida

```bash
# Ver todos os comandos disponíveis
python quick_start.py

# Documentação principal
cat README.md

# Status do sistema
python quick_start.py test
```

---
**💡 Dica**: Use sempre `python quick_start.py ai` para melhor resultado com IA!
