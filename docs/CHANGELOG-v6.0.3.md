# Changelog - Versão 6.0.3

## 🚀 Melhorias e Correções

### 🔧 **Correções de WebSocket e CSP**
- **✅ Corrigido erro de CSP com Google Favicon**
  - Removida dependência do Google favicon para verificação de conectividade
  - Implementada verificação local usando `navigator.onLine` e status do WebSocket
  - Eliminadas violações da Content Security Policy

- **✅ Corrigido erro de conexão WebSocket (`ERR_CONNECTION_REFUSED`)**
  - Implementado sistema de retry com múltiplas portas (3002-3005)
  - Adicionado timeout de 10 segundos para conexão inicial
  - Configuração automática de reconexão com backoff exponencial

### 🛠️ **Melhorias no Cliente WebSocket**
- **Retry automático**: Tenta conectar em múltiplas portas sequencialmente
- **Reconexão inteligente**: Configuração automática de reconexão (5 tentativas)
- **Logs detalhados**: Melhor debugging e monitoramento de conexões
- **Modo offline gracioso**: Aplicação funciona mesmo sem WebSocket ativo

### 🔒 **Atualizações de Segurança**
- **CSP atualizado**: Adicionado `https://cdn.socket.io` para permitir conexões Socket.IO
- **Política de segurança**: Mantida segurança sem bloquear funcionalidades necessárias

### 📊 **Sistema de Inicialização Robusto**
- **Retry com backoff**: 3 tentativas com delay progressivo
- **Notificações informativas**: Usuário é informado sobre o status da conexão
- **Fallback inteligente**: Sistema continua funcionando em modo offline

## 🐛 **Bugs Corrigidos**
- Erro `net::ERR_CONNECTION_REFUSED` no WebSocket
- Violação de CSP ao tentar acessar `https://www.google.com/favicon.ico`
- Problemas de timing na inicialização do servidor WebSocket
- Reconexão inconsistente do cliente WebSocket

## 📈 **Melhorias de Performance**
- Otimização do sistema de reconexão WebSocket
- Redução de tentativas desnecessárias de conexão externa
- Melhoria na responsividade da interface durante problemas de conectividade

---

**Data de Release**: 30 de Julho de 2024  
**Versão**: 6.0.3  
**Compatibilidade**: Windows, macOS, Linux  

### 🔗 **Links Úteis**
- [Repositório GitHub](https://github.com/L34NDR0-DEV/UBY--Sistemas)
- [Documentação](../README.md)
- [Releases Anteriores](../docs/)