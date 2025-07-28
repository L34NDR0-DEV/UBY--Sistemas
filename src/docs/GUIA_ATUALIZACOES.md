# Sistema de Atualização Automática - Guia Completo

## 📋 Visão Geral

Este sistema de atualização automática foi desenvolvido para o aplicativo de agendamentos usando **electron-updater**, proporcionando uma experiência profissional e confiável para atualizações automáticas.

## 🏗️ Arquitetura do Sistema

### Componentes Principais

1. **UpdateManager** (`src/scripts/updater.js`)
   - Gerencia todo o processo de atualização
   - Interface com o electron-updater
   - Controla a UI de atualização

2. **Main Process** (`main.js`)
   - Configura o electron-updater
   - Gerencia eventos de atualização
   - Comunica com o renderer process

3. **Configurações** (`src/config/update-config.js`)
   - Centraliza todas as configurações
   - Permite personalização fácil
   - Validação de configurações

4. **Interface Visual** (`src/styles/main.css`)
   - Modal de atualização moderno
   - Barra de progresso animada
   - Notificações toast

## 🔄 Como Funciona o Sistema de Atualização

### 1. Verificação de Atualizações

```javascript
// Processo automático
1. App inicia → Verifica atualizações automaticamente
2. Usuário clica no botão → Verificação manual
3. Intervalo configurado → Verificação periódica (24h)
```

### 2. Fluxo de Atualização

```
Iniciar Verificação → Consultar GitHub Releases → Nova Versão?
    ↓ (Sim)                                           ↓ (Não)
Mostrar Modal → Usuário Aceita? → Iniciar Download → Notificar: Já Atualizado
    ↓ (Sim)         ↓ (Não)           ↓
Download → Progresso → Instalar → Reiniciar    Fechar Modal
```

### 3. Comunicação Entre Processos

```javascript
// Renderer → Main
ipcRenderer.invoke('check-for-updates')
ipcRenderer.invoke('download-update')
ipcRenderer.invoke('install-update')

// Main → Renderer
mainWindow.webContents.send('update-available', updateInfo)
mainWindow.webContents.send('download-progress', progressObj)
mainWindow.webContents.send('update-downloaded')
```

## 🛠️ Como Buildar e Distribuir Atualizações

### Pré-requisitos

1. **Configurar GitHub Repository**
   ```json
   // package.json
   "build": {
     "publish": {
       "provider": "github",
       "owner": "uby-sistemas",
       "repo": "agendamentos-app"
     }
   }
   ```

2. **Token do GitHub**
   ```bash
   # Definir variável de ambiente
   set GH_TOKEN=seu_token_aqui
   ```

### Processo de Build Completo

#### 1. Preparar Nova Versão

```bash
# 1. Atualizar versão no package.json
npm version patch  # Para correções (1.0.0 → 1.0.1)
npm version minor  # Para novas funcionalidades (1.0.0 → 1.1.0)
npm version major  # Para mudanças importantes (1.0.0 → 2.0.0)
```

#### 2. Testar Localmente

```bash
# Instalar dependências
npm install

# Testar em modo desenvolvimento
npm run dev

# Testar build local
npm run build
```

#### 3. Criar Build de Produção

```bash
# Limpar builds anteriores
npm run clean

# Criar build e publicar no GitHub
npm run build

# Ou usar electron-builder diretamente
npx electron-builder --publish=always
```

#### 4. Verificar Release no GitHub

1. Acesse: `https://github.com/uby-sistemas/agendamentos-app/releases`
2. Verifique se a nova versão foi criada
3. Confirme se os arquivos estão anexados:
   - `Setup.exe` (Windows)
   - `latest.yml` (metadados)

### Scripts Úteis

```json
{
  "scripts": {
    "dev": "electron .",
    "build": "electron-builder",
    "build-win": "electron-builder --win",
    "publish": "electron-builder --publish=always",
    "clean": "rimraf dist",
    "version-check": "node -e \"console.log(require('./package.json').version)\""
  }
}
```

## 🔧 Configurações Avançadas

### Personalizar Verificação Automática

```javascript
// src/config/update-config.js
const UPDATE_CONFIG = {
  server: {
    autoCheckInterval: 12 * 60 * 60 * 1000, // 12 horas
    autoCheckOnStartup: true
  }
};
```

### Configurar Servidor Próprio

```javascript
// Para usar servidor próprio em vez do GitHub
const UPDATE_CONFIG = {
  server: {
    baseUrl: 'https://seu-servidor.com/api/updates'
  }
};
```

### Personalizar Interface

```javascript
const UPDATE_CONFIG = {
  ui: {
    buttonText: 'Buscar Atualizações',
    buttonIcon: '⬇️',
    toastDuration: 3000
  }
};
```

## 🚀 Processo para o Usuário Final

### Experiência do Usuário

1. **Verificação Automática**
   - Ao abrir o app, verifica atualizações silenciosamente
   - Notificação discreta se houver atualização

2. **Verificação Manual**
   - Botão "Verificar Atualizações" no header
   - Feedback imediato sobre o status

3. **Processo de Atualização**
   - Modal elegante com informações da versão
   - Barra de progresso em tempo real
   - Instalação automática e reinício

4. **Notificações**
   - Toast notifications para feedback
   - Mensagens claras sobre o status

## 📁 Estrutura de Arquivos

```
src/
├── scripts/
│   └── updater.js          # UpdateManager principal
├── config/
│   └── update-config.js    # Configurações centralizadas
├── styles/
│   └── main.css           # Estilos do sistema de atualização
└── ...

main.js                    # Configuração electron-updater
package.json              # Configurações de build
```

## 🔍 Debugging e Logs

### Habilitar Logs Detalhados

```javascript
// main.js
if (isDev) {
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';
}
```

### Verificar Logs

```bash
# Windows
%USERPROFILE%\AppData\Roaming\agendamentos-app\logs\main.log

# Ou no console do DevTools
F12 → Console → Filtrar por "update"
```

## ⚠️ Solução de Problemas

### Problemas Comuns

1. **Erro de Token GitHub**
   ```bash
   # Verificar se o token está definido
   echo %GH_TOKEN%
   
   # Redefinir token
   set GH_TOKEN=novo_token
   ```

2. **Build Falha**
   ```bash
   # Limpar cache
   npm run clean
   rm -rf node_modules
   npm install
   ```

3. **Atualização Não Detectada**
   - Verificar se a versão no package.json foi incrementada
   - Confirmar se o release foi criado no GitHub
   - Verificar logs do electron-updater

### Comandos de Diagnóstico

```bash
# Verificar versão atual
npm run version-check

# Testar build local
npm run build-win

# Verificar configuração
node -e "console.log(require('./package.json').build)"
```

## 📈 Versionamento

### Semantic Versioning (SemVer)

- **MAJOR** (X.0.0): Mudanças incompatíveis
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs

### Exemplo de Ciclo de Versões

```
1.0.0 → Versão inicial
1.0.1 → Correção de bug
1.1.0 → Nova funcionalidade
2.0.0 → Mudança importante na arquitetura
```

## 🎯 Checklist de Release

- [ ] Código testado e funcionando
- [ ] Versão incrementada no package.json
- [ ] Changelog atualizado
- [ ] Build local testado
- [ ] Token GitHub configurado
- [ ] Build e publish executados
- [ ] Release verificado no GitHub
- [ ] Teste de atualização em ambiente de produção

## 🔐 Segurança

### Boas Práticas

1. **Verificação de Assinatura**
   - Arquivos são verificados automaticamente
   - Apenas atualizações assinadas são aceitas

2. **HTTPS Obrigatório**
   - Todas as comunicações são criptografadas
   - GitHub Releases usa HTTPS por padrão

3. **Validação de Versão**
   - Apenas versões superiores são aceitas
   - Proteção contra downgrade malicioso

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar logs de erro
2. Consultar este guia
3. Verificar issues no GitHub
4. Contatar equipe de desenvolvimento

---

**Desenvolvido por:** Uby Sistemas  
**Versão do Guia:** 2.0  
**Última Atualização:** Dezembro 2024