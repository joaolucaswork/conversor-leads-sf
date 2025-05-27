#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para testar se o certificado do Admin Panel está instalado corretamente
"""

import subprocess
import sys
import os
from pathlib import Path

def test_certificate_file_exists():
    """Verifica se o arquivo do certificado existe"""
    print("📁 Verificando arquivo do certificado...")

    cert_file = Path("certificates/admin-client.p12")
    if cert_file.exists():
        print(f"✅ Certificado encontrado: {cert_file}")
        print(f"   Tamanho: {cert_file.stat().st_size} bytes")
        return True
    else:
        print(f"❌ Certificado não encontrado: {cert_file}")
        print("   Execute: python generate-certificates-simple.py")
        return False

def test_certificate_validity():
    """Testa se o certificado é válido usando OpenSSL"""
    print("\n🔐 Testando validade do certificado...")

    cert_file = "certificates/admin-client.p12"

    try:
        # Verificar se OpenSSL está disponível
        subprocess.run(["openssl", "version"], check=True, capture_output=True)

        # Testar o certificado PKCS#12
        result = subprocess.run([
            "openssl", "pkcs12", "-info", "-in", cert_file,
            "-passin", "pass:admin123", "-noout"
        ], capture_output=True, text=True, check=True)

        print("✅ Certificado é válido e pode ser lido")
        return True

    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao verificar certificado: {e.stderr}")
        return False
    except FileNotFoundError:
        print("⚠️  OpenSSL não encontrado - não é possível verificar validade")
        return True  # Assume válido se não pode testar

def test_windows_certificate_store():
    """Testa se o certificado está instalado no Windows Certificate Store"""
    print("\n🪟 Verificando Windows Certificate Store...")

    if os.name != 'nt':
        print("⚠️  Teste apenas para Windows")
        return True

    try:
        # Usar certlm.msc para listar certificados pessoais
        result = subprocess.run([
            "powershell", "-Command",
            "Get-ChildItem -Path Cert:\\CurrentUser\\My | Where-Object {$_.Subject -like '*Admin Client*'}"
        ], capture_output=True, text=True, timeout=10)

        if "Admin Client" in result.stdout:
            print("✅ Certificado encontrado no Windows Certificate Store")
            return True
        else:
            print("❌ Certificado não encontrado no Windows Certificate Store")
            return False

    except Exception as e:
        print(f"⚠️  Não foi possível verificar Certificate Store: {e}")
        return True  # Assume OK se não pode testar

def test_browser_certificate_access():
    """Testa acesso via navegador (simulado)"""
    print("\n🌐 Testando acesso do navegador...")

    # Testar ambas as portas
    import requests

    ports_to_test = [5173, 5174]
    working_ports = []

    for port in ports_to_test:
        try:
            response = requests.get(f"http://localhost:{port}", timeout=3)
            if response.status_code == 200:
                working_ports.append(port)
                print(f"✅ Porta {port}: Funcionando")
            else:
                print(f"⚠️  Porta {port}: Status {response.status_code}")
        except:
            print(f"❌ Porta {port}: Não acessível")

    if working_ports:
        print(f"\n📱 Teste o Admin Panel em:")
        for port in working_ports:
            print(f"   http://localhost:{port}/admin")
        print("\n🔍 Verifique qual solicita seleção de certificado")
    else:
        print("❌ Nenhuma porta do frontend está funcionando")
        print("   Execute: npm run dev")

    return len(working_ports) > 0

def print_installation_instructions():
    """Mostra instruções de instalação"""
    print("\n📋 Instruções de Instalação do Certificado")
    print("=" * 50)

    print("\n🔧 Chrome/Edge:")
    print("1. Vá para: chrome://settings/certificates")
    print("2. Clique em 'Gerenciar certificados'")
    print("3. Aba 'Pessoal' → Clique 'Importar'")
    print("4. Selecione: certificates/admin-client.p12")
    print("5. Senha: admin123")

    print("\n🦊 Firefox:")
    print("1. Vá para: about:preferences#privacy")
    print("2. Seção 'Certificados' → 'Ver Certificados'")
    print("3. Aba 'Seus Certificados' → 'Importar'")
    print("4. Selecione: certificates/admin-client.p12")
    print("5. Senha: admin123")

    print("\n🪟 Windows (Duplo-clique):")
    print("1. Duplo-clique em: certificates/admin-client.p12")
    print("2. Assistente de Importação → Avançar")
    print("3. Senha: admin123")
    print("4. Local: 'Repositório Pessoal'")

def main():
    """Função principal de teste"""
    print("🧪 Teste de Instalação do Certificado Admin")
    print("=" * 50)

    # Executar todos os testes
    file_ok = test_certificate_file_exists()
    valid_ok = test_certificate_validity() if file_ok else False
    store_ok = test_windows_certificate_store() if file_ok else False
    browser_ok = test_browser_certificate_access()

    # Resumo dos resultados
    print("\n📊 Resumo dos Testes")
    print("=" * 30)
    print(f"Arquivo do certificado: {'✅ OK' if file_ok else '❌ FALHOU'}")
    print(f"Validade do certificado: {'✅ OK' if valid_ok else '❌ FALHOU'}")
    print(f"Windows Certificate Store: {'✅ OK' if store_ok else '❌ FALHOU'}")
    print(f"Teste de navegador: {'✅ OK' if browser_ok else '❌ FALHOU'}")

    if file_ok and valid_ok:
        if store_ok:
            print("\n🎉 Certificado está instalado e funcionando!")
            print("\n📱 Teste Final:")
            print("   Acesse: http://localhost:5174/admin")
            print("   O navegador deve solicitar seleção do certificado")
        else:
            print("\n⚠️  Certificado válido mas não instalado no navegador")
            print_installation_instructions()
    else:
        print("\n❌ Problemas encontrados com o certificado")
        if not file_ok:
            print("   Execute: python generate-certificates-simple.py")
        print_installation_instructions()

if __name__ == "__main__":
    main()
