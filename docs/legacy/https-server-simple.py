#!/usr/bin/env python3
"""
Servidor HTTPS simples para testar certificados de cliente
"""

import http.server
import ssl
import socketserver
import urllib.request
from pathlib import Path
import sys

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            # Proxy para backend
            try:
                backend_url = f"http://localhost:8000{self.path}"
                headers = {}
                
                # Adicionar cabecalhos de autenticacao
                if 'Authorization' in self.headers:
                    headers['Authorization'] = self.headers['Authorization']
                
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
            # Proxy para frontend
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
                # Fallback
                self.send_error(404, "Not found")

def main():
    PORT = 8443
    
    # Verificar se certificados existem
    if not Path("certificates/server-cert.pem").exists():
        print("ERRO: Certificados do servidor nao encontrados")
        print("Execute: python setup-https-server.py")
        return
    
    if not Path("certificates/ca.pem").exists():
        print("ERRO: Certificado CA nao encontrado")
        print("Execute: python generate-certificates-simple.py")
        return
    
    # Criar servidor HTTPS
    with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
        # Configurar SSL
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain("certificates/server-cert.pem", "certificates/server-key.pem")
        
        # Configurar verificacao de certificado de cliente
        context.verify_mode = ssl.CERT_REQUIRED
        context.load_verify_locations("certificates/ca.pem")
        
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        
        print(f"Servidor HTTPS rodando em: https://localhost:{PORT}")
        print("Para acessar o admin panel:")
        print(f"   https://localhost:{PORT}/admin")
        print("O navegador solicitara selecao do certificado")
        print("Aceite o certificado auto-assinado quando solicitado")
        print("Pressione Ctrl+C para parar")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor parado")

if __name__ == "__main__":
    main()
