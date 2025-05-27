#!/bin/bash

# Script para corrigir o admin dashboard no Heroku
# Configura variáveis de ambiente e faz deploy das correções

echo "🔧 Configurando Admin Dashboard no Heroku"
echo "=========================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o Heroku CLI está instalado
if ! command -v heroku &> /dev/null; then
    echo "❌ Erro: Heroku CLI não está instalado"
    echo "💡 Instale em: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Verificar se está logado no Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Erro: Não está logado no Heroku"
    echo "💡 Execute: heroku login"
    exit 1
fi

# Detectar o nome da aplicação Heroku
APP_NAME=$(heroku apps --json | jq -r '.[0].name' 2>/dev/null)
if [ "$APP_NAME" = "null" ] || [ -z "$APP_NAME" ]; then
    echo "❌ Erro: Não foi possível detectar a aplicação Heroku"
    echo "💡 Execute: heroku git:remote -a seu-app-name"
    exit 1
fi

echo "🎯 Aplicação detectada: $APP_NAME"
echo ""

# 1. Configurar variáveis de ambiente
echo "📋 Passo 1: Configurando variáveis de ambiente"
echo "----------------------------------------------"

# Gerar token admin seguro
ADMIN_TOKEN=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "🔑 Gerando token admin seguro..."

# Configurar variáveis
echo "⚙️ Configurando ADMIN_ACCESS_TOKEN..."
heroku config:set ADMIN_ACCESS_TOKEN="$ADMIN_TOKEN" --app "$APP_NAME"

echo "⚙️ Configurando NODE_ENV=production..."
heroku config:set NODE_ENV=production --app "$APP_NAME"

echo "⚙️ Configurando PYTHON_ENV=production..."
heroku config:set PYTHON_ENV=production --app "$APP_NAME"

echo "⚙️ Configurando HEROKU_APP_NAME..."
heroku config:set HEROKU_APP_NAME="$APP_NAME" --app "$APP_NAME"

echo ""

# 2. Verificar banco de dados PostgreSQL
echo "📋 Passo 2: Verificando banco de dados PostgreSQL"
echo "------------------------------------------------"

# Verificar se PostgreSQL está configurado
DB_URL=$(heroku config:get DATABASE_URL --app "$APP_NAME")
if [ -z "$DB_URL" ]; then
    echo "⚠️ PostgreSQL não encontrado. Adicionando add-on..."
    heroku addons:create heroku-postgresql:essential-0 --app "$APP_NAME"
    echo "✅ PostgreSQL adicionado com sucesso"
else
    echo "✅ PostgreSQL já configurado"
fi

echo ""

# 3. Deploy das correções
echo "📋 Passo 3: Fazendo deploy das correções"
echo "---------------------------------------"

echo "📦 Adicionando arquivos modificados..."
git add .

echo "💾 Criando commit..."
git commit -m "Fix admin dashboard - database fallback and environment setup"

echo "🚀 Fazendo deploy para Heroku..."
git push heroku main

echo ""

# 4. Verificar deployment
echo "📋 Passo 4: Verificando deployment"
echo "---------------------------------"

echo "⏳ Aguardando deployment completar..."
sleep 10

echo "🔍 Verificando status da aplicação..."
heroku ps --app "$APP_NAME"

echo ""

# 5. Testar admin dashboard
echo "📋 Passo 5: Testando admin dashboard"
echo "-----------------------------------"

APP_URL="https://$APP_NAME.herokuapp.com"
echo "🌐 URL da aplicação: $APP_URL"
echo "🔐 Token admin: $ADMIN_TOKEN"

echo ""
echo "🧪 Testando conectividade..."
if curl -s --head "$APP_URL" | head -n 1 | grep -q "200 OK"; then
    echo "✅ Aplicação está respondendo"
else
    echo "⚠️ Aplicação pode estar iniciando ainda..."
fi

echo ""

# 6. Instruções finais
echo "📋 Passo 6: Instruções para testar"
echo "---------------------------------"

echo "✅ Configuração concluída com sucesso!"
echo ""
echo "🔗 Para testar o admin dashboard:"
echo "1. Acesse: $APP_URL/admin"
echo "2. Faça login no Salesforce (se necessário)"
echo "3. Use o token admin: $ADMIN_TOKEN"
echo "4. O dashboard deve mostrar os arquivos processados"
echo ""
echo "📊 Para verificar logs:"
echo "heroku logs --tail --app $APP_NAME"
echo ""
echo "🔧 Para verificar variáveis de ambiente:"
echo "heroku config --app $APP_NAME"
echo ""
echo "💡 Dica: Salve o token admin em local seguro!"
echo "Token: $ADMIN_TOKEN"

# Salvar token em arquivo local (opcional)
echo "$ADMIN_TOKEN" > .admin-token
echo "💾 Token salvo em .admin-token (não commitado)"

echo ""
echo "🎉 Setup completo! Teste enviando uma planilha e verificando o admin dashboard."
