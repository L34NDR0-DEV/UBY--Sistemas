# Script para substituir o instalador na release v1.0.6
$Token = $env:GH_TOKEN
$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.6"

# Encontrar o arquivo do instalador
$installerFile = Get-ChildItem -Path "dist" -Name "*.exe" | Where-Object { $_ -like "*Setup*" }

if (-not $installerFile) {
    Write-Host "Arquivo do instalador nao encontrado na pasta dist" -ForegroundColor Red
    exit 1
}

$installerPath = Join-Path "dist" $installerFile
$installerInfo = Get-Item $installerPath
$installerSizeMB = [math]::Round($installerInfo.Length / 1MB, 2)
Write-Host "Arquivo encontrado: $installerPath ($installerSizeMB MB)" -ForegroundColor Green

# Headers para API
$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    # Obter informacoes da release
    Write-Host "Buscando release $tag..." -ForegroundColor Yellow
    $releaseResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/tags/$tag" -Headers $headers
    
    # Verificar se ja existe um instalador e remove-lo
    $existingAssets = $releaseResponse.assets | Where-Object { $_.name -like "*Setup*1.0.6.exe" }
    
    foreach ($asset in $existingAssets) {
        Write-Host "Removendo instalador antigo: $($asset.name)" -ForegroundColor Yellow
        $deleteUrl = "https://api.github.com/repos/$repo/releases/assets/$($asset.id)"
        Invoke-RestMethod -Uri $deleteUrl -Headers $headers -Method Delete
        Write-Host "Instalador antigo removido" -ForegroundColor Green
    }
    
    # Preparar upload do novo instalador
    $uploadUrl = $releaseResponse.upload_url -replace '\{\?name,label\}', ''
    Write-Host "Fazendo upload do novo instalador..." -ForegroundColor Yellow
    
    # Preparar upload
    $fileName = [System.IO.Path]::GetFileName($installerPath)
    $uploadUri = "$uploadUrl" + "?name=" + [System.Web.HttpUtility]::UrlEncode($fileName)
    
    # Ler arquivo
    $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $installerPath))
    
    $uploadHeaders = @{
        "Authorization" = "token $Token"
        "Content-Type" = "application/octet-stream"
    }
    
    # Upload
    $uploadResponse = Invoke-RestMethod -Uri $uploadUri -Method Post -Headers $uploadHeaders -Body $fileBytes
    
    Write-Host ""
    Write-Host "Upload concluido com sucesso!" -ForegroundColor Green
    Write-Host "Arquivo: $($uploadResponse.name)" -ForegroundColor Cyan
    Write-Host "Tamanho: $([math]::Round($uploadResponse.size / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Download: $($uploadResponse.browser_download_url)" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Release v1.0.6 atualizada com as correcoes da lixeira!" -ForegroundColor Green
    Write-Host "Acesse: https://github.com/$repo/releases/tag/$tag" -ForegroundColor Blue
    
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}