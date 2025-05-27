#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Configurar servidor HTTPS local para testar certificados de cliente
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def create_server_certificates():
    """Criar certificados para o servidor HTTPS"""
    print("🔐 Criando certificados para servidor HTTPS...")
    
    cert_dir = Path("certificates")
    cert_dir.mkdir(exist_ok=True)
    
    os.chdir(cert_dir)
    
    # Criar certificado do servidor se não existir
    if not Path("server-cert.pem").exists():
        print("📜 Gerando certificado do servidor...")
        
        # Gerar chave privada do servidor
        subprocess.run([
            "openssl", "genrsa", "-out", "server-key.pem", "2048"
        ], check=True)
        
        # Gerar certificado do servidor
        subprocess.run([
            "openssl", "req", "-new", "-x509", "-key", "server-key.pem",
            "-out", "server-cert.pem", "-days", "365",
            "-subj", "/C=BR/ST=SP/L=SaoPaulo/O=LeadsProcessing/CN=localhost"
        ], check=True)
        
        print("✅ Certificado do servidor criado")
    else:
        print("✅ Certificado do servidor já existe")
    
    os.chdir("..")

def create_nginx_config():
    """Criar configuração do nginx para HTTPS com certificados de cliente"""
    print("🌐 Criando configuração HTTPS...")
    
    nginx_config = """
server {
    listen 8443 ssl;
    server_name localhost;
    
    # Certificados do servidor
    ssl_certificate certificates/server-cert.pem;
    ssl_certificate_key certificates/server-key.pem;
    
    # Configuração de certificados de cliente
    ssl_client_certificate certificates/ca.pem;
    ssl_verify_client on;
    ssl_verify_depth 2;
    
    # Proxy para o frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Passar informações do certificado
        proxy_set_header X-Client-Certificate $ssl_client_cert;
        proxy_set_header X-Client-Verify $ssl_client_verify;
    }
    
    # Proxy para o backend
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Passar informações do certificado
        proxy_set_header X-Client-Certificate $ssl_client_cert;
        proxy_set_header X-Client-Verify $ssl_client_verify;
    }
}
"""
    
    with open("nginx-https.conf", "w") as f:
        f.write(nginx_config)
    
    print("✅ Configuração HTTPS criada: nginx-https.conf")

def create_simple_https_server():
    """Criar servidor HTTPS simples em Python"""
    print("🐍 Criando servidor HTTPS em Python...")
    
    server_script = '''#!/usr/bin/env python3
import http.server
import ssl
import socketserver
import urllib.request
import json
from pathlib import Path

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            # Proxy para backend
            try:
                backend_url = f"http://localhost:8000{self.path}"
                headers = {}
                
                # Adicionar cabeçalhos de autenticação
                if 'Authorization' in self.headers:
                    headers['Authorization'] = self.headers['Authorization']
                
                # Adicionar informações do certificado se disponível
                if hasattr(self.connection, 'getpeercert'):
                    cert = self.connection.getpeercert()
                    if cert:
                        headers['X-Client-Certificate-Subject'] = str(cert.get('subject', ''))
                
                req = urllib.request.Request(backend_url, headers=headers)
                with urllib.request.urlopen(req) as response:
                    self.send_response(response.getcode())
                    for header, value in response.headers.items():
                        self.send_header(header, value)
                    self.end_headers()
                    self.wfile.write(response.read())
            except Exception as e:
                self.send_error(500, f"Proxy error: {e}")
        else:
            # Proxy para frontend ou servir arquivos estáticos
            try:
                frontend_url = f"http://localhost:5173{self.path}"
                req = urllib.request.Request(frontend_url)
                with urllib.request.urlopen(req) as response:
                    self.send_response(response.getcode())
                    for header, value in response.headers.items():
                        if header.lower() not in ['connection', 'transfer-encoding']:
                            self.send_header(header, value)
                    self.end_headers()
                    self.wfile.write(response.read())
            except:
                # Fallback para arquivos estáticos
                super().do_GET()

def main():
    PORT = 8443
    
    # Verificar se certificados existem
    if not Path("certificates/server-cert.pem").exists():
        print("❌ Certificados do servidor não encontrados")
        print("Execute: python setup-https-server.py")
        return
    
    # Criar servidor HTTPS
    with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
        # Configurar SSL
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain("certificates/server-cert.pem", "certificates/server-key.pem")
        
        # Configurar verificação de certificado de cliente
        context.verify_mode = ssl.CERT_REQUIRED
        context.load_verify_locations("certificates/ca.pem")
        
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        
        print(f"🚀 Servidor HTTPS rodando em: https://localhost:{PORT}")
        print("📋 Para acessar o admin panel:")
        print(f"   https://localhost:{PORT}/admin")
        print("🔐 O navegador solicitará seleção do certificado")
        print("⚠️  Aceite o certificado auto-assinado quando solicitado")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\\n🛑 Servidor parado")

if __name__ == "__main__":
    main()
'''
    
    with open("https-server.py", "w") as f:
        f.write(server_script)
    
    print("✅ Servidor HTTPS criado: https-server.py")

def main():
    """Função principal"""
    print("🔧 Configuração de Servidor HTTPS para Certificados")
    print("=" * 55)
    
    try:
        create_server_certificates()
        create_simple_https_server()
        
        print("\n🎯 Próximos Passos:")
        print("1. Inicie o servidor HTTPS:")
        print("   python https-server.py")
        print()
        print("2. Acesse o admin panel:")
        print("   https://localhost:8443/admin")
        print()
        print("3. O navegador irá:")
        print("   • Avisar sobre certificado auto-assinado (aceite)")
        print("   • Solicitar seleção do certificado de cliente")
        print("   • Selecione 'Admin Client'")
        
        print("\n⚠️  Importante:")
        print("• Certifique-se que frontend (5173) e backend (8000) estão rodando")
        print("• Aceite o certificado auto-assinado quando solicitado")
        print("• O popup de seleção de certificado deve aparecer")
        
    except Exception as e:
        print(f"❌ Erro na configuração: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
