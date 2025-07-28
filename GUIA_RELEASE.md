# 🚀 Guia para Publicar Release no GitHub

## ❌ Problema Atual
O erro "No published versions on GitHub" ocorre porque não há releases publicados no repositório.

## ✅ Solução: Criar Release v1.0.1

### 📋 Pré-requisitos

1. **Criar Personal Access Token no GitHub:**
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token" → "Generate new token (classic)"
   - Nome: `UBY-Agendamentos-Release`
   - Permissões: ✅ `repo` (Full control of private repositories)
   - Clique em "Generate token"
   - **⚠️ COPIE O TOKEN** (você só verá uma vez!)

### 🔧 Configurar Token

**Opção 1: Temporário (apenas para esta sessão)**
```powershell
$env:GH_TOKEN = "seu_token_aqui"
```

**Opção 2: Permanente (recomendado)**
```powershell
[Environment]::SetEnvironmentVariable("GH_TOKEN", "seu_token_aqui", "User")
```

### 🚀 Publicar Release

**Método 1: Script Automático**
```bash
# Execute um dos scripts criados:
.\publish-release.ps1
# ou
.\publish-release.bat
```

**Método 2: Manual**
```bash
npm run publish
```

### 📁 Arquivos que serão publicados
- `UBY Sistemas - Gestão de Agendamentos Setup 1.0.1.exe` (instalador)
- `latest.yml` (arquivo de atualização)
- Arquivos de blocos para atualizações incrementais

### 🔍 Verificar Release
Após a publicação, verifique em:
https://github.com/L34NDR0-DEV/UBY--Sistemas/releases

### 🎯 Resultado Esperado
- ✅ Release v1.0.1 criado no GitHub
- ✅ Arquivos de instalação disponíveis para download
- ✅ Sistema de atualizações funcionando
- ✅ Erro "No published versions" resolvido

### 🔧 Testar Atualizações
Após criar o release:
1. Execute a aplicação: `npm start`
2. Teste o menu "Ajuda" → "Verificar Atualizações"
3. Teste o atalho `Ctrl+Shift+Delete` para limpeza automática

### 📝 Notas Importantes
- O token deve ter permissão `repo`
- O release será criado automaticamente com a tag `v1.0.1`
- Os arquivos serão enviados automaticamente para o GitHub
- O sistema de atualizações usará este release como base