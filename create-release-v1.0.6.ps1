# Script para criar release v1.0.6 no GitHub
# Configurações
$token = $env:GH_TOKEN
if (-not $token) {
    Write-Host "❌ Token do GitHub não encontrado. Configure com: set GH_TOKEN=seu_token" -ForegroundColor Red
    exit 1
}

$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.6"
$name = "UBY Sistemas v1.0.6 - Correções de Interface"

# Corpo da release com as correções implementadas
$body = @"
## 🔧 Correções e Melhorias - v1.0.6

### ✅ Correções Implementadas
- **🗑️ Lixeira Corrigida**: Corrigido problema na funcionalidade da lixeira
- **📝 Tamanho dos Post-its**: Ajustado tamanho e layout dos post-its para melhor visualização
- **🎨 Melhorias de Interface**: Pequenos ajustes visuais para melhor experiência do usuário

### 🚀 Melhorias de Performance
- Otimizações gerais de interface
- Correções de bugs menores

### 📦 Instalação
Baixe o instalador abaixo e execute para atualizar sua versão do UBY Sistemas.

---
**Data de Release**: $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Versão Anterior**: v1.0.5
"@

# Criar release no GitHub
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
    Write-Host "🚀 Criando release $tag no GitHub..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases" -Method Post -Headers $headers -Body $releaseData
    
    Write-Host "✅ Release criada com sucesso!" -ForegroundColor Green
    Write-Host "   📋 ID da Release: $($response.id)" -ForegroundColor Cyan
    Write-Host "   🏷️ Tag: $($response.tag_name)" -ForegroundColor Cyan
    Write-Host "   📝 Nome: $($response.name)" -ForegroundColor Cyan
    Write-Host "   🌐 URL: $($response.html_url)" -ForegroundColor Blue
    
    Write-Host "`n📦 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. Execute 'npm run build-win' para gerar o instalador" -ForegroundColor White
    Write-Host "   2. Faça upload do instalador para a release" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro ao criar release: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorDetails = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorDetails)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
}