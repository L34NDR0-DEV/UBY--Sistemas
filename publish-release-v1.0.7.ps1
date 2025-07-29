# Script completo para publicar release v1.0.7 no GitHub
# Este script cria a release e faz upload do instalador automaticamente

param(
    [string]$Token = $env:GH_TOKEN
)

if (-not $Token) {
    Write-Host "❌ Token do GitHub não encontrado." -ForegroundColor Red
    Write-Host "   Configure com: `$env:GH_TOKEN = 'seu_token'" -ForegroundColor Yellow
    Write-Host "   Ou execute: .\publish-release-v1.0.7.ps1 -Token 'seu_token'" -ForegroundColor Yellow
    exit 1
}

$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.7"
$name = "UBY Sistemas v1.0.7 - Correções Críticas"
$installerPath = "dist\UBY Sistemas - Gestão de Agendamentos Setup 1.0.7.exe"

Write-Host "🚀 Iniciando publicação da release v1.0.7..." -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

# Verificar se o instalador existe
if (-not (Test-Path $installerPath)) {
    Write-Host "❌ Instalador não encontrado: $installerPath" -ForegroundColor Red
    Write-Host "   Execute 'npm run build-win' primeiro para gerar o instalador" -ForegroundColor Yellow
    exit 1
}

$fileInfo = Get-Item $installerPath
$fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)

Write-Host "📦 Instalador encontrado:" -ForegroundColor Cyan
Write-Host "   📁 Arquivo: $installerPath" -ForegroundColor White
Write-Host "   📏 Tamanho: $fileSizeMB MB" -ForegroundColor White

# Corpo da release
$body = "## Correcoes e Melhorias - v1.0.7

### Correcoes Criticas Implementadas

#### Funcao de Copiar Contato
- **Problema**: A funcao de copiar contato nao estava funcionando corretamente
- **Solucao**: 
  - Adicionada verificacao para texto vazio antes de tentar copiar
  - Implementada API moderna do clipboard (navigator.clipboard.writeText)
  - Adicionado fallback para metodos antigos (document.execCommand('copy'))
  - Melhoradas as mensagens de sucesso e erro

#### Animacao do Contato
- **Problema**: Animacao indesejada ao passar o mouse sobre o contato
- **Solucao**: 
  - Removida a animacao hover da classe .copyable-contact
  - Simplificado o estilo CSS para melhor experiencia do usuario

#### Botao de Atualizacao
- **Problema**: Botao de atualizacao aparecia sempre, mesmo sem atualizacoes disponiveis
- **Solucao**: 
  - Implementada verificacao silenciosa de atualizacoes na inicializacao
  - Botao agora so aparece quando ha uma atualizacao disponivel
  - Adicionado estilo visual de destaque (animacao de pulso e cor vermelha)
  - Incluida notificacao Nova atualizacao disponivel!

#### Funcao da Lixeira
- **Problema**: A lixeira nao estava apagando os post-its criados
- **Solucao**: 
  - Corrigida a funcao executeCleanup para incluir remocao de dados de post-its
  - Adicionada limpeza de localStorage e sessionStorage para post-its
  - Implementada remocao dos elementos de post-its da interface
  - Garantida limpeza completa de todos os dados relacionados

### Arquivos Modificados
- src/scripts/main.js - Correcao da funcao copyToClipboard e handlers de atualizacao
- src/styles/main.css - Remocao da animacao hover do contato
- src/scripts/updater.js - Logica condicional do botao de atualizacao
- src/scripts/data-cleaner.js - Correcao da limpeza de post-its
- package.json - Atualizacao da versao para 1.0.7

### Melhorias de Performance
- Otimizacoes na funcao de copia para clipboard
- Melhor gerenciamento de memoria na limpeza de dados
- Interface mais responsiva e intuitiva

### Informacoes da Build
- **Tamanho do Instalador**: $fileSizeMB MB
- **Compatibilidade**: Windows 10/11
- **Arquitetura**: x64

### Instalacao
Baixe o instalador UBY Sistemas - Gestao de Agendamentos Setup 1.0.7.exe abaixo e execute para atualizar sua versao do UBY Sistemas.

---
**Data de Release**: $(Get-Date -Format 'dd/MM/yyyy HH:mm')
**Versao Anterior**: v1.0.6"

# Headers para API do GitHub
$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
    "Content-Type" = "application/json"
}

# Dados da release
$releaseData = @{
    tag_name = $tag
    target_commitish = "main"
    name = $name
    body = $body
    draft = $false
    prerelease = $false
} | ConvertTo-Json -Depth 10

try {
    # Passo 1: Criar release
    Write-Host "`n📝 Passo 1: Criando release no GitHub..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases" -Method Post -Headers $headers -Body $releaseData
    
    Write-Host "✅ Release criada com sucesso!" -ForegroundColor Green
    Write-Host "   📋 ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "   🏷️ Tag: $($response.tag_name)" -ForegroundColor Cyan
    Write-Host "   🌐 URL: $($response.html_url)" -ForegroundColor Blue
    
    # Passo 2: Upload do instalador
    Write-Host "`n📤 Passo 2: Fazendo upload do instalador..." -ForegroundColor Yellow
    
    $uploadUrl = $response.upload_url -replace '\{\?name,label\}', ''
    $fileName = Split-Path $installerPath -Leaf
    $uploadUri = "$uploadUrl?name=$fileName"
    
    $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $installerPath))
    
    $uploadHeaders = @{
        "Authorization" = "token $Token"
        "Content-Type" = "application/octet-stream"
    }
    
    $uploadResponse = Invoke-RestMethod -Uri $uploadUri -Method Post -Headers $uploadHeaders -Body $fileBytes
    
    Write-Host "✅ Upload concluído com sucesso!" -ForegroundColor Green
    
    # Resumo final
    Write-Host "`n" + "=" * 60 -ForegroundColor Gray
    Write-Host "🎉 RELEASE v1.0.7 PUBLICADA COM SUCESSO!" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Gray
    
    Write-Host "`n📋 Informações da Release:" -ForegroundColor Cyan
    Write-Host "   🏷️ Tag: $($response.tag_name)" -ForegroundColor White
    Write-Host "   📝 Nome: $($response.name)" -ForegroundColor White
    Write-Host "   🌐 URL: $($response.html_url)" -ForegroundColor Blue
    
    Write-Host "`n📦 Informações do Instalador:" -ForegroundColor Cyan
    Write-Host "   📁 Nome: $($uploadResponse.name)" -ForegroundColor White
    Write-Host "   📏 Tamanho: $([math]::Round($uploadResponse.size / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "   📥 Download: $($uploadResponse.browser_download_url)" -ForegroundColor Blue
    
    Write-Host "`n🔗 Links Úteis:" -ForegroundColor Yellow
    Write-Host "   🌐 Página da Release: $($response.html_url)" -ForegroundColor Blue
    Write-Host "   📥 Download Direto: $($uploadResponse.browser_download_url)" -ForegroundColor Blue
    
} catch {
    Write-Host "❌ Erro durante o processo: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorDetails = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorDetails)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
    exit 1
}