# Script para criar release v1.0.2 no GitHub usando API REST
$token = $env:GH_TOKEN
$owner = "L34NDR0-DEV"
$repo = "UBY--Sistemas"
$tag = "v1.0.2"
$name = "UBY Sistemas v1.0.2"
$body = @"
## 🚀 UBY Sistemas - Gestão de Agendamentos v1.0.2

### ✨ Novas Funcionalidades
- **Lixeira Automática**: Sistema inteligente de limpeza de dados antigos
- **Atalho Rápido**: `Ctrl+Shift+Delete` para limpeza automática
- **Interface Melhorada**: Nova interface da lixeira com melhor usabilidade

### 🔧 Correções e Melhorias
- ✅ **Sistema de Atualizações**: Corrigido erro "No published versions on GitHub"
- ✅ **Tratamento de Erros**: Melhor handling quando não há releases disponíveis
- ✅ **Performance**: Otimizações gerais do sistema

### 📥 Como Usar
1. Baixe o código fonte
2. Execute `npm install` para instalar dependências
3. Execute `npm start` para iniciar a aplicação

### 🔄 Sistema de Atualizações
Este release habilita o sistema de atualizações automáticas da aplicação.
O erro "No published versions on GitHub" foi resolvido com este release.

### 🎯 Próximos Passos
- Compilação de executáveis para distribuição
- Releases automáticos com GitHub Actions
- Melhorias na interface do usuário
"@

# Headers para autenticação
$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "UBY-Agendamentos-Release-Script"
}

# Dados do release
$releaseData = @{
    tag_name = $tag
    target_commitish = "main"
    name = $name
    body = $body
    draft = $false
    prerelease = $false
} | ConvertTo-Json -Depth 10

try {
    Write-Host "Criando release $tag no GitHub..." -ForegroundColor Cyan
    
    # Criar release
    $uri = "https://api.github.com/repos/$owner/$repo/releases"
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $releaseData -ContentType "application/json"
    
    Write-Host "✅ Release criado com sucesso!" -ForegroundColor Green
    Write-Host "🔗 URL: $($response.html_url)" -ForegroundColor Cyan
    Write-Host "📦 ID: $($response.id)" -ForegroundColor Yellow
    Write-Host "🏷️ Tag: $($response.tag_name)" -ForegroundColor Magenta
    
    # Salvar informações do release
    $response | ConvertTo-Json | Out-File "release-info.json"
    
    Write-Host ""
    Write-Host "🎉 Problema 'No published versions on GitHub' resolvido!" -ForegroundColor Green
    Write-Host "🔄 O sistema de atualizações agora funcionará corretamente." -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erro ao criar release: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
}