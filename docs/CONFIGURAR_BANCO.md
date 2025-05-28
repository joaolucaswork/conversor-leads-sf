# 🔧 Como Configurar o Banco de Dados PostgreSQL

## Problema Atual
A aplicação está tentando conectar ao PostgreSQL local mas não consegue porque não há senha configurada.

## Solução Rápida

### Passo 1: Definir sua senha no arquivo .env

1. Abra o arquivo `.env` na raiz do projeto
2. Encontre esta linha:
   ```
   POSTGRES_PASSWORD="SUA_SENHA_AQUI"
   ```
3. Substitua `SUA_SENHA_AQUI` pela sua senha real do PostgreSQL
4. Também atualize a linha `DATABASE_URL` com a mesma senha:
   ```
   DATABASE_URL="postgresql://postgres:SUA_SENHA_REAL@localhost:5432/leads_processing_dev"
   ```

### Passo 2: Executar o script de configuração

Escolha uma das opções abaixo:

#### Opção A: Script Python
```bash
python setup_database.py
```

#### Opção B: Script PowerShell
```powershell
.\setup_database.ps1
```

### Passo 3: Iniciar a aplicação
```bash
npm run dev
```

## O que os scripts fazem

1. ✅ Verificam se o PostgreSQL está rodando
2. ✅ Testam a conexão com suas credenciais
3. ✅ Criam o banco `leads_processing_dev` se não existir
4. ✅ Confirmam que tudo está funcionando

## Exemplo de .env configurado

```env
# Database configuration for local development
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="minha_senha_123"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_DB="leads_processing_dev"

DATABASE_URL="postgresql://postgres:minha_senha_123@localhost:5432/leads_processing_dev"
```

## Troubleshooting

### Se der erro de senha incorreta:
- Verifique se a senha no `.env` está correta
- Teste conectar manualmente: `psql -U postgres`

### Se o PostgreSQL não estiver rodando:
```powershell
# Verificar status
Get-Service postgresql*

# Iniciar serviço (se necessário)
Start-Service postgresql-x64-17
```

### Se o banco não for criado:
- Verifique se o usuário `postgres` tem permissões para criar bancos
- Tente criar manualmente: `createdb -U postgres leads_processing_dev`

## Segurança

⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env` com senhas reais para o Git!

O arquivo `.gitignore` já está configurado para ignorar `.env`, mas sempre verifique antes de fazer commit.
