# Script simplificado para publicar release v1.0.7 no GitHub
param(
    [string]$Token = $env:GH_TOKEN
)

if (-not $Token) {
    Write-Host "Token do GitHub nao encontrado." -ForegroundColor Red
    Write-Host "Configure com: `$env:GH_TOKEN = 'seu_token'" -ForegroundColor Yellow
    exit 1
}

$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.7"
$name = "UBY Sistemas v1.0.7 - Correcoes Criticas"
# Buscar o arquivo do instalador dinamicamente
$installerPath = Get-ChildItem -Path "dist" -Name "*Setup 1.0.7.exe" | Select-Object -First 1
if ($installerPath) {
    $installerPath = "dist\$installerPath"
} else {
    Write-Host "Instalador v1.0.7 nao encontrado na pasta dist" -ForegroundColor Red
    exit 1
}

Write-Host "Iniciando publicacao da release v1.0.7..." -ForegroundColor Green

# Verificar se o instalador existe
if (-not (Test-Path $installerPath)) {
    Write-Host "Instalador nao encontrado: $installerPath" -ForegroundColor Red
    exit 1
}

$fileInfo = Get-Item $installerPath
$fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)

Write-Host "Instalador encontrado: $fileSizeMB MB" -ForegroundColor Cyan

# Corpo da release simplificado
$releaseBody = "## Correcoes e Melhorias - v1.0.7

### Correcoes Implementadas:
- Funcao de copiar contato corrigida
- Animacao do contato removida
- Botao de atualizacao agora so aparece quando necessario
- Lixeira corrigida para apagar post-its

### Arquivos Modificados:
- src/scripts/main.js
- src/styles/main.css
- src/scripts/updater.js
- src/scripts/data-cleaner.js
- package.json

### Informacoes da Build:
- Tamanho: $fileSizeMB MB
- Compatibilidade: Windows 10/11
- Arquitetura: x64

Data de Release: $(Get-Date -Format 'dd/MM/yyyy HH:mm')
Versao Anterior: v1.0.6"

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
    body = $releaseBody
    draft = $false
    prerelease = $false
} | ConvertTo-Json -Depth 10

try {
    # Criar release
    Write-Host "Criando release no GitHub..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases" -Method Post -Headers $headers -Body $releaseData
    
    Write-Host "Release criada com sucesso!" -ForegroundColor Green
    Write-Host "ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "URL: $($response.html_url)" -ForegroundColor Blue
    
    # Upload do instalador
    Write-Host "Fazendo upload do instalador..." -ForegroundColor Yellow
    
    $uploadUrl = $response.upload_url -replace '\{\?name,label\}', ''
    $fileName = Split-Path $installerPath -Leaf
    $uploadUri = "$uploadUrl?name=$fileName"
    
    $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $installerPath))
    
    $uploadHeaders = @{
        "Authorization" = "token $Token"
        "Content-Type" = "application/octet-stream"
    }
    
    $uploadResponse = Invoke-RestMethod -Uri $uploadUri -Method Post -Headers $uploadHeaders -Body $fileBytes
    
    Write-Host "Upload concluido com sucesso!" -ForegroundColor Green
    
    # Resumo final
    Write-Host ""
    Write-Host "RELEASE v1.0.7 PUBLICADA COM SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informacoes da Release:" -ForegroundColor Cyan
    Write-Host "Tag: $($response.tag_name)" -ForegroundColor White
    Write-Host "Nome: $($response.name)" -ForegroundColor White
    Write-Host "URL: $($response.html_url)" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Informacoes do Instalador:" -ForegroundColor Cyan
    Write-Host "Nome: $($uploadResponse.name)" -ForegroundColor White
    Write-Host "Tamanho: $([math]::Round($uploadResponse.size / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "Download: $($uploadResponse.browser_download_url)" -ForegroundColor Blue
    
} catch {
    Write-Host "Erro durante o processo: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}