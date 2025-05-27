#!/usr/bin/env python3
"""
Script para organizar arquivos do projeto de integração Salesforce
Modo seguro: apenas analisa e sugere organização sem mover arquivos
"""

import os
import shutil
from datetime import datetime
import json
import re
from pathlib import Path
import argparse


class OrganizadorProjeto:
    def __init__(self, diretorio_raiz, modo_simulacao=True):
        self.diretorio_raiz = os.path.abspath(diretorio_raiz)
        self.modo_simulacao = modo_simulacao
        self.relatorio = {
            "analisado_em": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "arquivos_analisados": 0,
            "diretorios_analisados": 0,
            "acoes_propostas": [],
            "acoes_ignoradas": [],
            "estatisticas": {
                "docs": 0,
                "codigo": 0,
                "config": 0,
                "testes": 0,
                "logs": 0,
                "temporarios": 0
            }
        }
        
        # Diretórios e arquivos essenciais que não devem ser movidos
        self.essenciais = [
            'node_modules', 'package.json', 'package-lock.json',
            'requirements.txt', 'venv', '.git', '.github', '.env',
            '.env.local', '.env.example', 'vite.config.js',
            'electron-builder.yml', 'index.html', 'app', 'backend',
            'core', 'src', 'config', 'dist-renderer', 'public'
        ]
        
        # Padrões de arquivos por categoria
        self.padroes = {
            "docs": [r'\.md$', r'CONTRIBUTING', r'LICENSE', r'README'],
            "logs": [r'\.log$', r'logs/'],
            "testes": [r'^test_', r'^tests/', r'test-', r'debug_'],
            "temporarios": [r'^temp/', r'^cache/', r'\.pyc$'],
            "config": [r'\.env', r'config/', r'\.yml$', r'\.json$'],
        }
        
        # Diretórios para organização com estrutura mais detalhada
        self.diretorios_organizacao = {
            # Documentação por tema
            "docs": os.path.join(self.diretorio_raiz, "docs"),
            "docs_setup": os.path.join(self.diretorio_raiz, "docs", "setup"),
            "docs_api": os.path.join(self.diretorio_raiz, "docs", "api"),
            "docs_troubleshooting": os.path.join(self.diretorio_raiz, "docs", "troubleshooting"),
            "docs_salesforce": os.path.join(self.diretorio_raiz, "docs", "salesforce"),
            
            # Logs
            "logs": os.path.join(self.diretorio_raiz, "logs"),
            
            # Testes por tipo
            "testes": os.path.join(self.diretorio_raiz, "tests"),
            "testes_unitarios": os.path.join(self.diretorio_raiz, "tests", "unit"),
            "testes_integracao": os.path.join(self.diretorio_raiz, "tests", "integration"),
            "testes_ui": os.path.join(self.diretorio_raiz, "tests", "ui"),
            "testes_debug": os.path.join(self.diretorio_raiz, "tests", "debug"),
            
            # Scripts organizados
            "scripts": os.path.join(self.diretorio_raiz, "scripts"),
            "scripts_automacao": os.path.join(self.diretorio_raiz, "scripts", "automation"),
            "scripts_utilidades": os.path.join(self.diretorio_raiz, "scripts", "utils"),
            
            # Configs
            "config": os.path.join(self.diretorio_raiz, "config"),
            "config_examples": os.path.join(self.diretorio_raiz, "config", "examples"),
            
            # Temporários
            "temp": os.path.join(self.diretorio_raiz, "temp")
        }

    def _eh_essencial(self, caminho_relativo):
        """Verifica se o arquivo/diretório é essencial para o funcionamento"""
        nome = os.path.basename(caminho_relativo)
        caminho = caminho_relativo.replace('\\', '/')
        
        for item in self.essenciais:
            if item == nome or caminho.startswith(item + '/'):
                return True
                
        return False
    
    def _categorizar_arquivo(self, caminho_relativo):
        """Categoriza um arquivo baseado em seu nome/extensão"""
        # Primeiro verificamos se é essencial
        if self._eh_essencial(caminho_relativo):
            return "essencial"
            
        # Depois verificamos por padrões
        for categoria, padroes in self.padroes.items():
            for padrao in padroes:
                if re.search(padrao, caminho_relativo, re.IGNORECASE):
                    return categoria
        
        # Verificação por extensão para casos especiais
        ext = os.path.splitext(caminho_relativo)[1].lower()
        if ext in ['.py', '.js', '.ts', '.jsx', '.tsx', '.html']:
            return "codigo"
        
        # Caso não identifique, mantém sem categoria
        return "sem_categoria"
    
    def _sugerir_destino(self, arquivo, categoria):
        """Sugere um diretório de destino para o arquivo baseado na categoria e conteúdo"""
        if categoria == "essencial" or categoria == "codigo" or categoria == "sem_categoria":
            return None  # Mantém onde está
            
        nome_arquivo = os.path.basename(arquivo)
        nome_sem_ext, ext = os.path.splitext(nome_arquivo)
        
        # Documentação - categoriza por tema
        if categoria == "docs":
            # Verifica temas específicos baseados no nome do arquivo
            arquivo_lower = arquivo.lower()
            
            # Documentação relacionada a setup e configuração
            if any(termo in arquivo_lower for termo in ["setup", "install", "config", "development"]):
                return os.path.join(self.diretorios_organizacao["docs_setup"], nome_arquivo)
                
            # Documentação relacionada a API
            elif any(termo in arquivo_lower for termo in ["api", "endpoint", "service", "interface"]):
                return os.path.join(self.diretorios_organizacao["docs_api"], nome_arquivo)
                
            # Documentação relacionada a troubleshooting
            elif any(termo in arquivo_lower for termo in ["fix", "debug", "error", "issue", "troubleshoot", "handling", "oauth"]):
                return os.path.join(self.diretorios_organizacao["docs_troubleshooting"], nome_arquivo)
                
            # Documentação relacionada a Salesforce
            elif "salesforce" in arquivo_lower:
                return os.path.join(self.diretorios_organizacao["docs_salesforce"], nome_arquivo)
                
            # Caso padrão para documentação
            else:
                return os.path.join(self.diretorios_organizacao["docs"], nome_arquivo)
        
        # Arquivos de log
        elif categoria == "logs":
            return os.path.join(self.diretorios_organizacao["logs"], nome_arquivo)
        
        # Testes por categoria
        elif categoria == "testes":
            # Preserva subdiretórios existentes dentro de tests
            if arquivo.startswith("tests/") or arquivo.startswith("test/"):
                return None
                
            # Categoriza arquivos de teste individuais
            arquivo_lower = arquivo.lower()
            
            # Arquivos de debug/diagnóstico
            if any(termo in arquivo_lower for termo in ["debug", "diagnose", "verify"]):
                return os.path.join(self.diretorios_organizacao["testes_debug"], nome_arquivo)
                
            # Testes de UI/frontend
            elif any(termo in arquivo_lower for termo in ["ui", "interface", "browser", "dom", "html"]):
                return os.path.join(self.diretorios_organizacao["testes_ui"], nome_arquivo)
                
            # Testes de integração/API
            elif any(termo in arquivo_lower for termo in ["api", "integration", "connect", "endpoint", "oauth"]):
                return os.path.join(self.diretorios_organizacao["testes_integracao"], nome_arquivo)
                
            # Testes unitários (qualquer outro teste)
            elif arquivo.startswith("test_") or "_test" in arquivo:
                return os.path.join(self.diretorios_organizacao["testes_unitarios"], nome_arquivo)
                
            # Caso padrão para testes
            else:
                return os.path.join(self.diretorios_organizacao["testes"], nome_arquivo)
        
        # Arquivos temporários
        elif categoria == "temporarios":
            return os.path.join(self.diretorios_organizacao["temp"], nome_arquivo)
        
        # Arquivos de configuração
        elif categoria == "config":
            # Config de exemplo/template vai para pasta específica
            if any(termo in arquivo.lower() for termo in ["example", "sample", "template", "default"]):
                return os.path.join(self.diretorios_organizacao["config_examples"], nome_arquivo)
            # Outros arquivos de configuração permanecem onde estão por segurança
            return None
        
        # Scripts e automação
        elif ext in [".bat", ".sh", ".ps1"] and not self._eh_essencial(arquivo):
            # Scripts de automação/inicialização
            if any(termo in arquivo.lower() for termo in ["start", "run", "build", "deploy", "init"]):
                return os.path.join(self.diretorios_organizacao["scripts_automacao"], nome_arquivo)
            # Outros scripts utilitários
            else:
                return os.path.join(self.diretorios_organizacao["scripts_utilidades"], nome_arquivo)
            
        return None
    
    def analisar(self):
        """Analisa a estrutura de arquivos e sugere organização"""
        for atual_dir, subdirs, arquivos in os.walk(self.diretorio_raiz):
            # Convertemos para caminho relativo para facilitar a análise
            rel_dir = os.path.relpath(atual_dir, self.diretorio_raiz)
            if rel_dir == '.':
                rel_dir = ''
                
            self.relatorio["diretorios_analisados"] += 1
                
            # Processa os arquivos do diretório atual
            for arquivo in arquivos:
                caminho_completo = os.path.join(atual_dir, arquivo)
                caminho_relativo = os.path.join(rel_dir, arquivo).replace('\\', '/')
                
                # Ignora arquivos ocultos além dos especificados como essenciais
                if arquivo.startswith('.') and not self._eh_essencial(caminho_relativo):
                    continue
                    
                self.relatorio["arquivos_analisados"] += 1
                
                categoria = self._categorizar_arquivo(caminho_relativo)
                destino = self._sugerir_destino(caminho_relativo, categoria)
                
                # Atualiza estatísticas
                if categoria in self.relatorio["estatisticas"]:
                    self.relatorio["estatisticas"][categoria] += 1
                
                # Registra a ação proposta se houver um destino
                if destino:
                    acao = {
                        "arquivo": caminho_relativo,
                        "categoria": categoria,
                        "destino": os.path.relpath(destino, self.diretorio_raiz).replace('\\', '/'),
                        "tamanho": os.path.getsize(caminho_completo)
                    }
                    self.relatorio["acoes_propostas"].append(acao)
                else:
                    self.relatorio["acoes_ignoradas"].append({
                        "arquivo": caminho_relativo,
                        "categoria": categoria,
                        "razao": "Arquivo essencial ou sem categoria específica"
                    })
                    
        return self.relatorio
    
    def executar_organizacao(self):
        """Executa a organização dos arquivos conforme análise"""
        if self.modo_simulacao:
            print("MODO SIMULAÇÃO: Nenhum arquivo será movido.")
            return False
            
        # Cria os diretórios de destino se não existirem
        for dir_destino in self.diretorios_organizacao.values():
            os.makedirs(dir_destino, exist_ok=True)
            
        # Move os arquivos conforme sugerido
        movidos = 0
        for acao in self.relatorio["acoes_propostas"]:
            origem = os.path.join(self.diretorio_raiz, acao["arquivo"])
            destino = os.path.join(self.diretorio_raiz, acao["destino"])
            
            # Cria o diretório de destino se não existir
            os.makedirs(os.path.dirname(destino), exist_ok=True)
            
            try:
                shutil.move(origem, destino)
                movidos += 1
                print(f"Movido: {acao['arquivo']} -> {acao['destino']}")
            except Exception as e:
                print(f"Erro ao mover {acao['arquivo']}: {str(e)}")
                
        print(f"Organização concluída. {movidos} arquivos foram movidos.")
        return True
    
    def gerar_relatorio_html(self, caminho_saida=None):
        """Gera um relatório HTML da análise"""
        if not caminho_saida:
            caminho_saida = os.path.join(self.diretorio_raiz, "relatorio_organizacao.html")
            
        categorias = list(self.relatorio["estatisticas"].keys())
        valores = [self.relatorio["estatisticas"][cat] for cat in categorias]
        
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório de Organização de Projeto</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1, h2 {{ color: #333; }}
        .stats {{ display: flex; justify-content: space-around; margin: 20px 0; }}
        .stat-box {{ border: 1px solid #ddd; padding: 15px; border-radius: 5px; width: 18%; text-align: center; }}
        .stat-value {{ font-size: 24px; font-weight: bold; margin: 10px 0; }}
        .stat-label {{ font-size: 14px; color: #666; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #f2f2f2; }}
        tr:hover {{ background-color: #f5f5f5; }}
        .actions-container {{ display: flex; justify-content: space-between; }}
        .actions-list {{ width: 48%; }}
    </style>
</head>
<body>
    <h1>Relatório de Organização do Projeto</h1>
    <p>Análise realizada em: {self.relatorio["analisado_em"]}</p>
    
    <div class="stats">
        <div class="stat-box">
            <div class="stat-value">{self.relatorio["arquivos_analisados"]}</div>
            <div class="stat-label">Arquivos Analisados</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">{len(self.relatorio["acoes_propostas"])}</div>
            <div class="stat-label">Ações Propostas</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">{self.relatorio["estatisticas"]["docs"]}</div>
            <div class="stat-label">Documentação</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">{self.relatorio["estatisticas"]["codigo"]}</div>
            <div class="stat-label">Arquivos de Código</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">{self.relatorio["estatisticas"]["testes"]}</div>
            <div class="stat-label">Testes</div>
        </div>
    </div>
    
    <div class="actions-container">
        <div class="actions-list">
            <h2>Ações Propostas ({len(self.relatorio["acoes_propostas"])})</h2>
            <table>
                <tr>
                    <th>Arquivo</th>
                    <th>Categoria</th>
                    <th>Destino</th>
                </tr>
"""
        
        # Adiciona as ações propostas
        for acao in self.relatorio["acoes_propostas"]:
            html += f"""
                <tr>
                    <td>{acao["arquivo"]}</td>
                    <td>{acao["categoria"]}</td>
                    <td>{acao["destino"]}</td>
                </tr>"""
        
        html += """
            </table>
        </div>
        
        <div class="actions-list">
            <h2>Arquivos Mantidos ({0})</h2>
            <table>
                <tr>
                    <th>Arquivo</th>
                    <th>Categoria</th>
                    <th>Razão</th>
                </tr>
""".format(len(self.relatorio["acoes_ignoradas"]))
        
        # Adiciona uma amostra dos arquivos mantidos (limitado a 20 para não ficar muito extenso)
        for acao in self.relatorio["acoes_ignoradas"][:20]:
            html += f"""
                <tr>
                    <td>{acao["arquivo"]}</td>
                    <td>{acao["categoria"]}</td>
                    <td>{acao["razao"]}</td>
                </tr>"""
            
        if len(self.relatorio["acoes_ignoradas"]) > 20:
            html += f"""
                <tr>
                    <td colspan="3">... e mais {len(self.relatorio["acoes_ignoradas"]) - 20} arquivos</td>
                </tr>"""
        
        html += """
            </table>
        </div>
    </div>
    
    <h2>Instruções para Execução</h2>
    <p>Para executar a organização sugerida, rode o script com o parâmetro <code>--executar</code>:</p>
    <pre>python organizar_projeto.py --executar</pre>
    <p>Lembre-se que todas as operações são reversíveis usando o git, caso seu projeto esteja versionado.</p>
</body>
</html>"""
        
        with open(caminho_saida, 'w', encoding='utf-8') as f:
            f.write(html)
            
        return caminho_saida
        
    def salvar_relatorio_json(self, caminho_saida=None):
        """Salva o relatório em formato JSON"""
        if not caminho_saida:
            caminho_saida = os.path.join(self.diretorio_raiz, "relatorio_organizacao.json")
            
        with open(caminho_saida, 'w', encoding='utf-8') as f:
            json.dump(self.relatorio, f, indent=2)
            
        return caminho_saida


def main():
    parser = argparse.ArgumentParser(description='Organiza os arquivos do projeto mantendo a funcionalidade.')
    parser.add_argument('--diretorio', '-d', default=os.getcwd(),
                      help='Diretório raiz do projeto (padrão: diretório atual)')
    parser.add_argument('--executar', '-e', action='store_true',
                      help='Executa a organização (sem este parâmetro, apenas simula)')
    parser.add_argument('--formato', '-f', choices=['html', 'json', 'ambos'], default='html',
                      help='Formato do relatório (padrão: html)')
    
    args = parser.parse_args()
    
    # Inicia o organizador
    organizador = OrganizadorProjeto(args.diretorio, not args.executar)
    
    # Realiza a análise
    print(f"Analisando projeto em: {args.diretorio}")
    relatorio = organizador.analisar()
    
    # Mostra estatísticas básicas
    print("\n=== Estatísticas ===")
    print(f"Arquivos analisados: {relatorio['arquivos_analisados']}")
    print(f"Diretórios analisados: {relatorio['diretorios_analisados']}")
    print(f"Ações propostas: {len(relatorio['acoes_propostas'])}")
    
    for categoria, qtd in relatorio['estatisticas'].items():
        if qtd > 0:
            print(f"- {categoria.capitalize()}: {qtd}")
    
    # Gera os relatórios conforme solicitado
    if args.formato in ['html', 'ambos']:
        caminho_html = organizador.gerar_relatorio_html()
        print(f"\nRelatório HTML gerado em: {caminho_html}")
        
    if args.formato in ['json', 'ambos']:
        caminho_json = organizador.salvar_relatorio_json()
        print(f"\nRelatório JSON gerado em: {caminho_json}")
    
    # Executa a organização se solicitado
    if args.executar:
        print("\nExecutando a organização dos arquivos...")
        organizador.executar_organizacao()
    else:
        print("\nMODO SIMULAÇÃO: Nenhum arquivo foi movido.")
        print("Para executar a organização, use o parâmetro --executar")


if __name__ == "__main__":
    main()
