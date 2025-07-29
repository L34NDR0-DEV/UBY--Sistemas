# Script para fazer upload do instalador para a release v1.0.6
param(
    [string]$Token = $env:GH_TOKEN
)

if (-not $Token) {
    Write-Host "Token do GitHub não encontrado. Configure com: `$env:GH_TOKEN = 'seu_token'" -ForegroundColor Red
    exit 1
}

$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.6"
$installerPath = "dist\UBY Sistemas - Gestão de Agendamentos Setup 1.0.6.exe"

# Verificar se o caminho contém caracteres especiais e usar aspas apropriadas
if ($installerPath -match '\s') {
    $installerPath = "`"$installerPath`""
}

Write-Host "Fazendo upload do instalador para a release $tag..." -ForegroundColor Green

# Verificar se o arquivo existe
if (-not (Test-Path $installerPath)) {
    Write-Host "Arquivo do instalador não encontrado: $installerPath" -ForegroundColor Red
    exit 1
}

# Obter informações da release
$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    $releaseResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/tags/$tag" -Headers $headers
    $uploadUrl = $releaseResponse.upload_url -replace '\{\?name,label\}', ''
    
    Write-Host "Release encontrada. ID: $($releaseResponse.id)" -ForegroundColor Yellow
    
    # Fazer upload do arquivo
    $fileName = Split-Path $installerPath -Leaf
    $uploadUri = "$uploadUrl?name=$fileName"
    
    $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $installerPath))
    
    $uploadHeaders = @{
        "Authorization" = "token $Token"
        "Content-Type" = "application/octet-stream"
    }
    
    Write-Host "Fazendo upload de $fileName..." -ForegroundColor Yellow
    
    $uploadResponse = Invoke-RestMethod -Uri $uploadUri -Method Post -Headers $uploadHeaders -Body $fileBytes
    
    Write-Host "Upload concluído com sucesso!" -ForegroundColor Green
    Write-Host "Nome do arquivo: $($uploadResponse.name)" -ForegroundColor Cyan
    Write-Host "Tamanho: $([math]::Round($uploadResponse.size / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "URL de download: $($uploadResponse.browser_download_url)" -ForegroundColor Cyan
    
} catch {
    Write-Host "Erro durante o upload: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}