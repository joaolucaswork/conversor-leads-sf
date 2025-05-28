#!/usr/bin/env python3
"""
Script para configurar o banco de dados PostgreSQL local
Este script lê as credenciais do arquivo .env e configura o banco automaticamente
"""

import os
import sys
import subprocess
from pathlib import Path

def load_env_file():
    """Carrega variáveis do arquivo .env"""
    env_vars = {}
    env_path = Path(".env")
    
    if not env_path.exists():
        print("❌ Arquivo .env não encontrado!")
        return None
    
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                # Remove aspas se presentes
                value = value.strip('"').strip("'")
                env_vars[key] = value
    
    return env_vars

def check_postgres_service():
    """Verifica se o serviço PostgreSQL está rodando"""
    try:
        result = subprocess.run(
            ['powershell', '-Command', 'Get-Service postgresql*'],
            capture_output=True,
            text=True,
            check=True
        )
        if 'Running' in result.stdout:
            print("✅ Serviço PostgreSQL está rodando")
            return True
        else:
            print("❌ Serviço PostgreSQL não está rodando")
            return False
    except subprocess.CalledProcessError:
        print("❌ Erro ao verificar serviço PostgreSQL")
        return False

def test_connection(user, password, host, port):
    """Testa conexão com PostgreSQL"""
    try:
        # Define a senha como variável de ambiente para psql
        env = os.environ.copy()
        env['PGPASSWORD'] = password
        
        result = subprocess.run(
            ['psql', '-U', user, '-h', host, '-p', port, '-c', 'SELECT version();'],
            capture_output=True,
            text=True,
            env=env,
            timeout=10
        )
        
        if result.returncode == 0:
            print("✅ Conexão com PostgreSQL bem-sucedida")
            return True
        else:
            print(f"❌ Erro na conexão: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Timeout na conexão com PostgreSQL")
        return False
    except Exception as e:
        print(f"❌ Erro ao testar conexão: {e}")
        return False

def create_database(user, password, host, port, db_name):
    """Cria o banco de dados se não existir"""
    try:
        # Define a senha como variável de ambiente
        env = os.environ.copy()
        env['PGPASSWORD'] = password
        
        # Primeiro verifica se o banco já existe
        result = subprocess.run(
            ['psql', '-U', user, '-h', host, '-p', port, '-lqt'],
            capture_output=True,
            text=True,
            env=env,
            timeout=10
        )
        
        if db_name in result.stdout:
            print(f"✅ Banco de dados '{db_name}' já existe")
            return True
        
        # Cria o banco de dados
        result = subprocess.run(
            ['createdb', '-U', user, '-h', host, '-p', port, db_name],
            capture_output=True,
            text=True,
            env=env,
            timeout=15
        )
        
        if result.returncode == 0:
            print(f"✅ Banco de dados '{db_name}' criado com sucesso")
            return True
        else:
            print(f"❌ Erro ao criar banco: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao criar banco de dados: {e}")
        return False

def main():
    """Função principal"""
    print("🔧 Configurador de Banco de Dados PostgreSQL")
    print("=" * 50)
    
    # Carrega variáveis do .env
    env_vars = load_env_file()
    if not env_vars:
        return False
    
    # Extrai credenciais
    user = env_vars.get('POSTGRES_USER', 'postgres')
    password = env_vars.get('POSTGRES_PASSWORD')
    host = env_vars.get('POSTGRES_HOST', 'localhost')
    port = env_vars.get('POSTGRES_PORT', '5432')
    db_name = env_vars.get('POSTGRES_DB', 'leads_processing_dev')
    
    if not password or password == 'SUA_SENHA_AQUI':
        print("❌ Por favor, defina a senha do PostgreSQL no arquivo .env")
        print("   Edite a linha: POSTGRES_PASSWORD=\"SUA_SENHA_AQUI\"")
        print("   E substitua 'SUA_SENHA_AQUI' pela sua senha real do PostgreSQL")
        return False
    
    print(f"📋 Configurações:")
    print(f"   Usuário: {user}")
    print(f"   Host: {host}")
    print(f"   Porta: {port}")
    print(f"   Banco: {db_name}")
    print()
    
    # Verifica serviço
    if not check_postgres_service():
        print("💡 Inicie o serviço PostgreSQL e tente novamente")
        return False
    
    # Testa conexão
    print("🔍 Testando conexão...")
    if not test_connection(user, password, host, port):
        print("💡 Verifique se a senha está correta no arquivo .env")
        return False
    
    # Cria banco de dados
    print("🗄️ Configurando banco de dados...")
    if not create_database(user, password, host, port, db_name):
        return False
    
    print()
    print("🎉 Configuração concluída com sucesso!")
    print("   Agora você pode iniciar a aplicação normalmente")
    print("   Execute: npm run dev")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
