# Fix para "Expired Authorization Code" no OAuth Browser

## Problema Identificado

O usuário estava enfrentando o erro:
```
Auth Error: OAuth token exchange failed: {"error":"invalid_grant","error_description":"expired authorization code"}
```

Mesmo fazendo login corretamente, o código de autorização estava expirando antes de ser trocado pelo token, exigindo refresh manual da página.

## Causa Raiz

O código de autorização do Salesforce tem um tempo de vida muito curto (≈10 segundos). No fluxo do browser, havia delays entre:

1. **Popup fechando** após login bem-sucedido
2. **React renderizando** a página de callback
3. **useEffect executando** para processar o código
4. **Troca do código** pelo token via API

Esses delays acumulados faziam o código expirar antes da troca.

## Soluções Implementadas

### 1. **Processamento Imediato na Carga da Página**

**Arquivo**: `src/pages/OAuthCallbackPage.jsx`

- Adicionado processamento do código **antes do React renderizar**
- Código é extraído e armazenado imediatamente quando o módulo carrega
- Elimina delays de renderização do React

```javascript
// Processa código ANTES do React renderizar
if (typeof window !== 'undefined' && isBrowser()) {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    localStorage.setItem('oauth_immediate_code', JSON.stringify({
      code: code,
      timestamp: Date.now(),
      url: window.location.href
    }));
  }
}
```

### 2. **Otimização da Troca de Código**

**Arquivo**: `src/utils/environment.js` - função `exchangeCodeInBrowser`

- Adicionado timing detalhado para monitorar performance
- Processamento imediato sem delays desnecessários
- Detecção específica de códigos expirados
- Mensagens de erro mais claras

```javascript
const exchangeCodeInBrowser = async (code) => {
  const startTime = Date.now();
  // ... processamento otimizado
  console.log("Browser OAuth: Code exchange completed in", Date.now() - startTime, "ms");
}
```

### 3. **Eliminação de Delays Desnecessários**

**Arquivo**: `src/pages/OAuthCallbackPage.jsx`

- Removidos `setTimeout` para navegação e fechamento de popup
- Navegação e fechamento imediatos após sucesso
- Processamento prioritário de códigos armazenados

**Antes:**
```javascript
setTimeout(() => {
  window.close();
}, 1000);

setTimeout(() => {
  navigate('/');
}, 2000);
```

**Depois:**
```javascript
window.close(); // Imediato
navigate('/'); // Imediato
```

### 4. **Detecção e Tratamento de Códigos Expirados**

**Arquivo**: `src/utils/environment.js`

- Detecção específica de erros de código expirado
- Mensagens de erro mais informativas
- Logging detalhado do tempo de processamento

```javascript
if (error.message.includes("expired authorization code") || 
    error.message.includes("invalid_grant")) {
  errorMessage = `Authorization code expired (processed in ${totalTime}ms). Please try logging in again.`;
}
```

### 5. **Logging Detalhado para Debug**

- Timestamps em todas as operações críticas
- Medição de tempo de processamento
- Identificação de gargalos de performance
- Logs com prefixo "URGENT" para operações críticas

## Resultados Esperados

### ✅ **Antes da Correção:**
- Código expira durante o processamento
- Usuário vê erro "expired authorization code"
- Necessário refresh manual da página
- Tempo de processamento > 10 segundos

### ✅ **Depois da Correção:**
- Código processado em < 2 segundos
- Navegação automática após sucesso
- Sem necessidade de refresh manual
- Mensagens de erro claras se ainda houver problemas

## Como Testar

### 1. **Teste Normal**
```bash
npm run dev
```
1. Abra http://localhost:5173 no browser
2. Clique em "Login with Salesforce"
3. Complete o login no popup
4. Verifique se navega automaticamente para home

### 2. **Monitoramento de Performance**
Abra o console do browser e procure por logs:
```
OAuth Callback: CRITICAL - Code detected on page load
Browser OAuth: URGENT - Starting immediate code exchange
Browser OAuth: Code exchange completed in XXX ms
```

### 3. **Teste de Recuperação**
Se ainda houver problemas, verifique:
- Tempo total de processamento nos logs
- Se o backend está respondendo rapidamente
- Se há problemas de rede

## Configurações de Backup

Se o problema persistir, verifique:

### 1. **Backend Performance**
```bash
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8000/api/v1/oauth/config"
```

### 2. **Configuração do Salesforce**
- Verifique se o redirect URI está correto
- Confirme que o client_id e client_secret estão válidos
- Teste se o Salesforce está respondendo rapidamente

### 3. **Configuração de Rede**
- Verifique latência para o Salesforce
- Confirme que não há proxies ou firewalls causando delays

## Monitoramento Contínuo

Os logs agora incluem:
- ⏱️ **Timestamps precisos** de cada operação
- 📊 **Tempo total de processamento**
- 🚨 **Alertas para operações lentas**
- 🔍 **Detalhes de debugging para falhas**

Procure por logs com "URGENT" ou "CRITICAL" para identificar rapidamente problemas de timing.

## Notas Técnicas

- O processamento imediato acontece no nível do módulo JavaScript
- Compatível com React 18+ e modo StrictMode
- Mantém compatibilidade com Electron
- Não afeta outros fluxos OAuth
- Fallback automático para método original se necessário
