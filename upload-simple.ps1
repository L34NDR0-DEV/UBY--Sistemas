# Script para anexar arquivos ao release v1.0.3 existente
param(
    [string]$Token = $env:GH_TOKEN
)

if (-not $Token) {
    Write-Host "Token do GitHub nao encontrado!" -ForegroundColor Red
    Write-Host "Configure o token com: env:GH_TOKEN = 'seu_token_aqui'" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.3"

Write-Host "Buscando release v1.0.3..." -ForegroundColor Cyan

try {
    # Buscar o release existente
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/tags/$tag" -Headers $headers
    $uploadUrl = $release.upload_url -replace '\{\?name,label\}', ''
    
    Write-Host "Release encontrado: $($release.name)" -ForegroundColor Green
    Write-Host "Upload URL: $uploadUrl" -ForegroundColor Blue
    
    # Arquivos para upload
    $files = @(
        @{
            path = "dist\UBY Sistemas - Gestão de Agendamentos Setup 1.0.3.exe"
            name = "UBY-Sistemas-Setup-1.0.3.exe"
            contentType = "application/octet-stream"
        },
        @{
            path = "dist\latest.yml"
            name = "latest.yml"
            contentType = "text/yaml"
        }
    )
    
    foreach ($file in $files) {
        $filePath = Join-Path $PWD $file.path
        
        if (Test-Path $filePath) {
            Write-Host "Enviando: $($file.name)..." -ForegroundColor Yellow
            
            $uploadHeaders = @{
                "Authorization" = "Bearer $Token"
                "Content-Type" = $file.contentType
            }
            
            $uploadUri = "$uploadUrl?name=$($file.name)"
            
            try {
                $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
                $response = Invoke-RestMethod -Uri $uploadUri -Method Post -Headers $uploadHeaders -Body $fileBytes
                
                Write-Host "$($file.name) enviado com sucesso!" -ForegroundColor Green
                Write-Host "   Tamanho: $([math]::Round($response.size / 1MB, 2)) MB" -ForegroundColor Blue
                Write-Host "   Download: $($response.browser_download_url)" -ForegroundColor Blue
            }
            catch {
                if ($_.Exception.Response.StatusCode -eq 422) {
                    Write-Host "$($file.name) ja existe no release" -ForegroundColor Yellow
                } else {
                    Write-Host "Erro ao enviar $($file.name): $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        else {
            Write-Host "Arquivo nao encontrado: $filePath" -ForegroundColor Red
        }
    }
    
    Write-Host "`nProcesso concluido!" -ForegroundColor Green
    Write-Host "Acesse o release em: $($release.html_url)" -ForegroundColor Cyan
    
} catch {
    Write-Host "Erro ao buscar release: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifique se o release v1.0.3 existe no GitHub" -ForegroundColor Yellow
}