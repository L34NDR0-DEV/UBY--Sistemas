# Solução de Problemas - Sistema de Atualizações

## Problemas Comuns e Soluções

### 1. Erro "Verificar Atualizações" não funciona

**Sintomas:**
- Botão de verificar atualizações não responde
- Mensagens de erro aparecem no console
- Sistema fica "travado" verificando atualizações

**Causas Possíveis:**
- Sem conexão com a internet
- GitHub não acessível
- Configuração incorreta do repositório
- Firewall bloqueando conexões

**Soluções:**

#### A. Verificar Conexão com Internet
```bash
# Testar conectividade básica
ping google.com

# Testar acesso ao GitHub
ping api.github.com
```

#### B. Verificar Configuração do Repositório
No arquivo `package.json`, verifique se a configuração está correta:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "L34NDR0-DEV",
      "repo": "uby-agendamentos"
    }
  }
}
```

#### C. Desabilitar Atualizações em Desenvolvimento
Para desenvolvimento local, você pode desabilitar as atualizações:

```bash
# Definir variável de ambiente
export DISABLE_UPDATES=true

# Ou executar com a variável
DISABLE_UPDATES=true npm start
```

### 2. Erros de Timeout

**Sintomas:**
- Verificação de atualizações demora muito
- Mensagem "Nenhuma atualização disponível" após delay

**Solução:**
O sistema agora tem timeouts configurados:
- Verificação normal: 15 segundos
- Verificação silenciosa: 10 segundos

### 3. Erros de Rede

**Erros Comuns:**
- `ENOTFOUND`
- `ECONNREFUSED`
- `Network Error`
- `timeout`
- `ETIMEDOUT`

**Soluções:**

#### A. Verificar Firewall
Certifique-se de que o firewall não está bloqueando conexões para:
- `api.github.com`
- `github.com`

#### B. Configurar Proxy (se necessário)
```bash
# Definir proxy se necessário
export HTTP_PROXY=http://proxy:port
export HTTPS_PROXY=http://proxy:port
```

### 4. Logs de Debug

Para ativar logs detalhados, execute em modo desenvolvimento:

```bash
NODE_ENV=development npm start
```

Os logs mostrarão:
- 🔍 Verificação iniciada
- ✅ Atualização encontrada
- ❌ Erros de rede
- ⏰ Timeouts
- 🚫 Sistema desabilitado

### 5. Resetar Sistema de Atualizações

Se o sistema ficar "travado", você pode:

1. **Reiniciar a aplicação**
2. **Limpar cache do Electron:**
   ```bash
   # Windows
   rm -rf %APPDATA%/uby-agendamentos
   
   # macOS
   rm -rf ~/Library/Application\ Support/uby-agendamentos
   
   # Linux
   rm -rf ~/.config/uby-agendamentos
   ```

### 6. Configuração Manual

#### A. Desabilitar Atualizações Permanentemente
Adicione ao `package.json`:

```json
{
  "build": {
    "publish": null
  }
}
```

#### B. Configurar Repositório Privado
Para repositórios privados, configure o token do GitHub:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "seu-usuario",
      "repo": "seu-repositorio",
      "private": true
    }
  }
}
```

E defina a variável de ambiente:
```bash
export GH_TOKEN=seu-token-github
```

### 7. Verificação Manual

Para testar se o sistema está funcionando:

1. **Abrir DevTools** (F12)
2. **Ir para Console**
3. **Executar:**
   ```javascript
   window.updateManager.checkForUpdates()
   ```

### 8. Estrutura de Logs

O sistema agora usa emojis para facilitar a identificação:

- 🚀 Inicialização
- 🔍 Verificação
- ✅ Sucesso
- ❌ Erro
- ⚠️ Aviso
- ⏰ Timeout
- 🚫 Desabilitado
- 📥 Download
- 🔄 Instalação

### 9. Comandos Úteis

```bash
# Executar em modo desenvolvimento
npm run dev

# Executar com atualizações desabilitadas
DISABLE_UPDATES=true npm start

# Verificar versão atual
npm run build

# Publicar atualização (requer configuração do GitHub)
npm run publish
```

### 10. Contato e Suporte

Se os problemas persistirem:

1. Verifique os logs no console do DevTools
2. Teste a conectividade com a internet
3. Verifique se o repositório GitHub está configurado corretamente
4. Considere desabilitar atualizações em desenvolvimento

---

**Nota:** O sistema de atualizações foi projetado para ser robusto e não interferir no funcionamento normal da aplicação. Em caso de problemas, ele automaticamente se desabilita temporariamente para evitar loops de erro. 