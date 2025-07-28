# Script para publicar release no GitHub
Write-Host "=== Publicação de Release v1.0.1 ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se o token está configurado
if (-not $env:GH_TOKEN) {
    Write-Host "ERRO: Token do GitHub não configurado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para configurar o token:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Crie um novo token com permissão 'repo'" -ForegroundColor White
    Write-Host "3. Execute: " -ForegroundColor White -NoNewline
    Write-Host '$env:GH_TOKEN = "seu_token_aqui"' -ForegroundColor Green
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "Token configurado! Publicando release..." -ForegroundColor Green
Write-Host ""

# Executar publicação
try {
    npm run publish
    Write-Host ""
    Write-Host "Release publicado com sucesso!" -ForegroundColor Green
    Write-Host "Verifique em: https://github.com/L34NDR0-DEV/UBY--Sistemas/releases" -ForegroundColor Cyan
} catch {
    Write-Host "Erro ao publicar release: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Pressione Enter para sair"