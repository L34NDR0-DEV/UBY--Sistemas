# Script para atualizar o instalador na release v1.0.6 existente
param(
    [string]$GitHubToken = $env:GITHUB_TOKEN
)

# Verificar se o token foi fornecido
if (-not $GitHubToken) {
    Write-Host "Token do GitHub nao encontrado!" -ForegroundColor Red
    Write-Host "Configure a variavel de ambiente GITHUB_TOKEN ou passe como parametro" -ForegroundColor Yellow
    exit 1
}

# Configuracoes
$owner = "L34NDR0-DEV"
$repo = "UBY--Sistemas"
$tag = "v1.0.6"
$installerPath = "dist\UBY Sistemas - Gestao de Agendamentos Setup 1.0.6.exe"

Write-Host "Atualizando instalador na release $tag..." -ForegroundColor Cyan

# Verificar se o arquivo do instalador existe
if (-not (Test-Path $installerPath)) {
    Write-Host "Arquivo do instalador nao encontrado: $installerPath" -ForegroundColor Red
    exit 1
}

$installerInfo = Get-Item $installerPath
$installerSizeMB = [math]::Round($installerInfo.Length / 1MB, 2)
Write-Host "Instalador encontrado: $($installerInfo.Name) ($installerSizeMB MB)" -ForegroundColor Green

try {
    # Buscar informacoes da release
    Write-Host "Buscando release $tag..." -ForegroundColor Yellow
    $releaseUrl = "https://api.github.com/repos/$owner/$repo/releases/tags/$tag"
    $headers = @{
        "Authorization" = "token $GitHubToken"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    $release = Invoke-RestMethod -Uri $releaseUrl -Headers $headers -Method Get
    Write-Host "Release encontrada: $($release.name)" -ForegroundColor Green
    
    # Buscar assets existentes
    $assets = $release.assets
    $existingAsset = $assets | Where-Object { $_.name -like "*Setup*1.0.6.exe" }
    
    if ($existingAsset) {
        Write-Host "Removendo instalador antigo: $($existingAsset.name)" -ForegroundColor Yellow
        $deleteUrl = "https://api.github.com/repos/$owner/$repo/releases/assets/$($existingAsset.id)"
        Invoke-RestMethod -Uri $deleteUrl -Headers $headers -Method Delete
        Write-Host "Instalador antigo removido" -ForegroundColor Green
    }
    
    # Upload do novo instalador
    Write-Host "Fazendo upload do novo instalador..." -ForegroundColor Yellow
    $uploadUrl = $release.upload_url -replace '\{\?name,label\}', "?name=UBY.Sistemas.-.Gestao.de.Agendamentos.Setup.1.0.6.exe"
    
    $uploadHeaders = @{
        "Authorization" = "token $GitHubToken"
        "Content-Type" = "application/octet-stream"
    }
    
    $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $installerPath))
    $response = Invoke-RestMethod -Uri $uploadUrl -Headers $uploadHeaders -Method Post -Body $fileBytes
    
    Write-Host "Upload concluido com sucesso!" -ForegroundColor Green
    Write-Host "Arquivo: $($response.name)" -ForegroundColor Cyan
    Write-Host "Tamanho: $([math]::Round($response.size / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Download: $($response.browser_download_url)" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Release v1.0.6 atualizada com sucesso!" -ForegroundColor Green
    Write-Host "Acesse: https://github.com/$owner/$repo/releases/tag/$tag" -ForegroundColor Blue
    
} catch {
    Write-Host "Erro durante a atualizacao: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}