# Script para criar release no GitHub usando API REST
$token = $env:GH_TOKEN
$owner = "L34NDR0-DEV"
$repo = "UBY--Sistemas"
$tag = "v1.0.1"
$name = "UBY Sistemas v1.0.1"
$body = @"
## 🚀 UBY Sistemas - Gestão de Agendamentos v1.0.1

### ✨ Novas Funcionalidades
- **Lixeira Automática**: Sistema inteligente de limpeza de dados antigos
- **Atalho Rápido**: `Ctrl+Shift+Delete` para limpeza automática
- **Interface Melhorada**: Nova interface da lixeira com melhor usabilidade

### 🔧 Melhorias
- Sistema de atualizações otimizado
- Correções de bugs menores
- Performance aprimorada

### 📥 Instalação
Baixe o arquivo de instalação e execute como administrador.

### 🔄 Atualizações
Este release habilita o sistema de atualizações automáticas da aplicação.
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
} | ConvertTo-Json

try {
    Write-Host "Criando release $tag no GitHub..." -ForegroundColor Cyan
    
    # Criar release
    $uri = "https://api.github.com/repos/$owner/$repo/releases"
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $releaseData -ContentType "application/json"
    
    Write-Host "✅ Release criado com sucesso!" -ForegroundColor Green
    Write-Host "🔗 URL: $($response.html_url)" -ForegroundColor Cyan
    Write-Host "📦 ID: $($response.id)" -ForegroundColor Yellow
    
    # Salvar informações do release
    $response | ConvertTo-Json | Out-File "release-info.json"
    
} catch {
    Write-Host "❌ Erro ao criar release: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
}