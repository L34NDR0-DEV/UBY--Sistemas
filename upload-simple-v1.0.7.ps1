# Script simplificado para upload do instalador v1.0.7
param(
    [string]$Token = $env:GH_TOKEN
)

if (-not $Token) {
    Write-Host "Token do GitHub nao encontrado." -ForegroundColor Red
    exit 1
}

$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.7"

# Buscar o arquivo do instalador dinamicamente
$installerPath = Get-ChildItem -Path "dist" -Name "*Setup 1.0.7.exe" | Select-Object -First 1
if ($installerPath) {
    $installerPath = "dist\$installerPath"
} else {
    Write-Host "Instalador v1.0.7 nao encontrado na pasta dist" -ForegroundColor Red
    exit 1
}

Write-Host "Fazendo upload do instalador para a release $tag..." -ForegroundColor Green

# Verificar se o arquivo existe
if (-not (Test-Path $installerPath)) {
    Write-Host "Arquivo do instalador nao encontrado: $installerPath" -ForegroundColor Red
    exit 1
}

$fileInfo = Get-Item $installerPath
$fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)

Write-Host "Arquivo encontrado: $fileSizeMB MB" -ForegroundColor Cyan

# Headers para API do GitHub
$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    Write-Host "Buscando release $tag..." -ForegroundColor Yellow
    
    $releaseResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/tags/$tag" -Headers $headers
    $uploadUrl = $releaseResponse.upload_url -replace '\{\?name,label\}', ''
    
    Write-Host "Release encontrada!" -ForegroundColor Green
    Write-Host "ID: $($releaseResponse.id)" -ForegroundColor Cyan
    Write-Host "URL: $($releaseResponse.html_url)" -ForegroundColor Blue
    
    # Fazer upload do arquivo
    $fileName = Split-Path $installerPath -Leaf
    $uploadUri = "$uploadUrl?name=$fileName"
    
    Write-Host "Iniciando upload de $fileName..." -ForegroundColor Yellow
    
    $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $installerPath))
    
    $uploadHeaders = @{
        "Authorization" = "token $Token"
        "Content-Type" = "application/octet-stream"
    }
    
    $uploadResponse = Invoke-RestMethod -Uri $uploadUri -Method Post -Headers $uploadHeaders -Body $fileBytes
    
    Write-Host "Upload concluido com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Detalhes do arquivo enviado:" -ForegroundColor Cyan
    Write-Host "Nome: $($uploadResponse.name)" -ForegroundColor White
    Write-Host "Tamanho: $([math]::Round($uploadResponse.size / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "URL de download: $($uploadResponse.browser_download_url)" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Release v1.0.7 publicada com sucesso!" -ForegroundColor Green
    Write-Host "Acesse: $($releaseResponse.html_url)" -ForegroundColor Blue
    Write-Host "Download direto: $($uploadResponse.browser_download_url)" -ForegroundColor Blue
    
} catch {
    Write-Host "Erro durante o upload: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}