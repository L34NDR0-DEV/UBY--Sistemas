# Script para fazer upload do instalador para a release v1.0.7
param(
    [string]$Token = $env:GH_TOKEN
)

if (-not $Token) {
    Write-Host "❌ Token do GitHub não encontrado. Configure com: `$env:GH_TOKEN = 'seu_token'" -ForegroundColor Red
    exit 1
}

$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.7"
$installerPath = "dist\UBY Sistemas - Gestão de Agendamentos Setup 1.0.7.exe"

Write-Host "🚀 Fazendo upload do instalador para a release $tag..." -ForegroundColor Green

# Verificar se o arquivo existe
if (-not (Test-Path $installerPath)) {
    Write-Host "❌ Arquivo do instalador não encontrado: $installerPath" -ForegroundColor Red
    Write-Host "   Certifique-se de que a build foi gerada com 'npm run build-win'" -ForegroundColor Yellow
    exit 1
}

# Obter informações do arquivo
$fileInfo = Get-Item $installerPath
$fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)

Write-Host "📦 Arquivo encontrado:" -ForegroundColor Cyan
Write-Host "   📁 Caminho: $installerPath" -ForegroundColor White
Write-Host "   📏 Tamanho: $fileSizeMB MB" -ForegroundColor White

# Obter informações da release
$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    Write-Host "`n🔍 Buscando release $tag..." -ForegroundColor Yellow
    
    $releaseResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/tags/$tag" -Headers $headers
    $uploadUrl = $releaseResponse.upload_url -replace '\{\?name,label\}', ''
    
    Write-Host "✅ Release encontrada!" -ForegroundColor Green
    Write-Host "   📋 ID: $($releaseResponse.id)" -ForegroundColor Cyan
    Write-Host "   📝 Nome: $($releaseResponse.name)" -ForegroundColor Cyan
    Write-Host "   🌐 URL: $($releaseResponse.html_url)" -ForegroundColor Blue
    
    # Fazer upload do arquivo
    $fileName = Split-Path $installerPath -Leaf
    $uploadUri = "$uploadUrl?name=$fileName"
    
    Write-Host "`n📤 Iniciando upload de $fileName..." -ForegroundColor Yellow
    
    $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $installerPath))
    
    $uploadHeaders = @{
        "Authorization" = "token $Token"
        "Content-Type" = "application/octet-stream"
    }
    
    $uploadResponse = Invoke-RestMethod -Uri $uploadUri -Method Post -Headers $uploadHeaders -Body $fileBytes
    
    Write-Host "✅ Upload concluído com sucesso!" -ForegroundColor Green
    Write-Host "`n📋 Detalhes do arquivo enviado:" -ForegroundColor Cyan
    Write-Host "   📁 Nome: $($uploadResponse.name)" -ForegroundColor White
    Write-Host "   📏 Tamanho: $([math]::Round($uploadResponse.size / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "   🔗 URL de download: $($uploadResponse.browser_download_url)" -ForegroundColor Blue
    
    Write-Host "`n🎉 Release v1.0.7 publicada com sucesso!" -ForegroundColor Green
    Write-Host "   🌐 Acesse: $($releaseResponse.html_url)" -ForegroundColor Blue
    Write-Host "   📥 Download direto: $($uploadResponse.browser_download_url)" -ForegroundColor Blue
    
} catch {
    Write-Host "❌ Erro durante o upload: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorDetails = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorDetails)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
    exit 1
}