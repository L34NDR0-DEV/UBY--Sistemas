# Script para criar release v1.0.3 e anexar arquivos
param(
    [string]$Token = $env:GH_TOKEN
)

if (-not $Token) {
    Write-Host "Token do GitHub nao encontrado!" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.3"

Write-Host "Criando release v1.0.3..." -ForegroundColor Cyan

# Dados do release
$releaseData = @{
    tag_name = $tag
    target_commitish = "main"
    name = "Versao 1.0.3"
    body = @"
## Versao 1.0.3 - Lixeira Aprimorada e Melhorias

### Principais Mudancas:
- **Lixeira sem confirmacao**: Remocao direta de agendamentos sem tela de confirmacao
- **Limpeza completa**: Remove arquivos de agendamento, cache, notificacoes e dados temporarios
- **Botao Notificacoes**: Renomeado e com painel de estatisticas
- **Remocao de testes automaticos**: Funcao createTestNotifications() removida

### Arquivos Modificados:
- main.js: Logica da lixeira e botao de notificacoes
- index.html: Interface do botao de notificacoes
- style.css: Estilos do painel de notificacoes
- package.json: Versao atualizada para 1.0.3

### Downloads:
- **UBY-Sistemas-Setup-1.0.3.exe**: Instalador para Windows
- **latest.yml**: Arquivo de configuracao para auto-update
"@
    draft = $false
    prerelease = $false
} | ConvertTo-Json -Depth 3

try {
    # Criar o release
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases" -Method Post -Headers $headers -Body $releaseData
    $uploadUrl = $release.upload_url -replace '\{\?name,label\}', ''
    
    Write-Host "Release criado com sucesso!" -ForegroundColor Green
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
                Write-Host "Erro ao enviar $($file.name): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "Arquivo nao encontrado: $filePath" -ForegroundColor Red
        }
    }
    
    Write-Host "`nRelease v1.0.3 criado e arquivos anexados!" -ForegroundColor Green
    Write-Host "Acesse o release em: $($release.html_url)" -ForegroundColor Cyan
    
} catch {
    Write-Host "Erro ao criar release: $($_.Exception.Message)" -ForegroundColor Red
}