# Script simples para upload do instalador
$Token = $env:GH_TOKEN
$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.6"

# Encontrar o arquivo do instalador
$installerFile = Get-ChildItem -Path "dist" -Name "*.exe" | Where-Object { $_ -like "*Setup*" }

if (-not $installerFile) {
    Write-Host "Arquivo do instalador não encontrado na pasta dist" -ForegroundColor Red
    exit 1
}

$installerPath = Join-Path "dist" $installerFile
Write-Host "Arquivo encontrado: $installerPath" -ForegroundColor Green

# Headers para API
$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    # Obter informações da release
    $releaseResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/tags/$tag" -Headers $headers
    $uploadUrl = $releaseResponse.upload_url -replace '\{\?name,label\}', ''
    
    Write-Host "Release encontrada. Fazendo upload..." -ForegroundColor Yellow
    
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
    
    Write-Host "Upload concluído!" -ForegroundColor Green
    Write-Host "Arquivo: $($uploadResponse.name)" -ForegroundColor Cyan
    Write-Host "Tamanho: $([math]::Round($uploadResponse.size / 1MB, 2)) MB" -ForegroundColor Cyan
    
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}