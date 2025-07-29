# Script para criar release v1.0.6 no GitHub
$token = $env:GH_TOKEN
if (-not $token) {
    Write-Host "Erro: Token do GitHub nao encontrado" -ForegroundColor Red
    exit 1
}

$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.6"
$name = "UBY Sistemas v1.0.6 - Correcoes de Interface"

$body = "## Correcoes e Melhorias - v1.0.6`n`n### Correcoes Implementadas`n- Lixeira Corrigida: Corrigido problema na funcionalidade da lixeira`n- Tamanho dos Post-its: Ajustado tamanho e layout dos post-its para melhor visualizacao`n- Melhorias de Interface: Pequenos ajustes visuais para melhor experiencia do usuario`n`n### Melhorias de Performance`n- Otimizacoes gerais de interface`n- Correcoes de bugs menores`n`n### Instalacao`nBaixe o instalador abaixo e execute para atualizar sua versao do UBY Sistemas.`n`n---`nData de Release: " + (Get-Date -Format "dd/MM/yyyy HH:mm") + "`nVersao Anterior: v1.0.5"

$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github.v3+json"
    "Content-Type" = "application/json"
}

$releaseData = @{
    tag_name = $tag
    target_commitish = "main"
    name = $name
    body = $body
    draft = $false
    prerelease = $false
} | ConvertTo-Json -Depth 10

try {
    Write-Host "Criando release $tag no GitHub..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases" -Method Post -Headers $headers -Body $releaseData
    
    Write-Host "Release criada com sucesso!" -ForegroundColor Green
    Write-Host "ID da Release: $($response.id)" -ForegroundColor Cyan
    Write-Host "Tag: $($response.tag_name)" -ForegroundColor Cyan
    Write-Host "Nome: $($response.name)" -ForegroundColor Cyan
    Write-Host "URL: $($response.html_url)" -ForegroundColor Blue
    
} catch {
    Write-Host "Erro ao criar release: $($_.Exception.Message)" -ForegroundColor Red
}