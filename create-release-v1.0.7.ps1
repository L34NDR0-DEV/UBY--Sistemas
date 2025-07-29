# Script para criar release v1.0.7 no GitHub
# Configurações
$token = $env:GH_TOKEN
if (-not $token) {
    Write-Host "❌ Token do GitHub não encontrado. Configure com: set GH_TOKEN=seu_token" -ForegroundColor Red
    exit 1
}

$repo = "L34NDR0-DEV/UBY--Sistemas"
$tag = "v1.0.7"
$name = "UBY Sistemas v1.0.7 - Correções Críticas"

# Corpo da release com as correções implementadas
$body = @"
## 🔧 Correções e Melhorias - v1.0.7

### ✅ Correções Críticas Implementadas

#### 🔧 Função de Copiar Contato
- **Problema**: A função de copiar contato não estava funcionando corretamente
- **Solução**: 
  - Adicionada verificação para texto vazio antes de tentar copiar
  - Implementada API moderna do clipboard (``navigator.clipboard.writeText``)
  - Adicionado fallback para métodos antigos (``document.execCommand('copy')``)
  - Melhoradas as mensagens de sucesso e erro

#### 🎨 Animação do Contato
- **Problema**: Animação indesejada ao passar o mouse sobre o contato
- **Solução**: 
  - Removida a animação hover da classe ``.copyable-contact``
  - Simplificado o estilo CSS para melhor experiência do usuário

#### 🔄 Botão de Atualização
- **Problema**: Botão de atualização aparecia sempre, mesmo sem atualizações disponíveis
- **Solução**: 
  - Implementada verificação silenciosa de atualizações na inicialização
  - Botão agora só aparece quando há uma atualização disponível
  - Adicionado estilo visual de destaque (animação de pulso e cor vermelha)
  - Incluída notificação "Nova atualização disponível!"

#### 🗑️ Função da Lixeira
- **Problema**: A lixeira não estava apagando os post-its criados
- **Solução**: 
  - Corrigida a função ``executeCleanup`` para incluir remoção de dados de post-its
  - Adicionada limpeza de ``localStorage`` e ``sessionStorage`` para post-its
  - Implementada remoção dos elementos de post-its da interface
  - Garantida limpeza completa de todos os dados relacionados

### 📋 Arquivos Modificados
- ``src/scripts/main.js`` - Correção da função copyToClipboard e handlers de atualização
- ``src/styles/main.css`` - Remoção da animação hover do contato
- ``src/scripts/updater.js`` - Lógica condicional do botão de atualização
- ``src/scripts/data-cleaner.js`` - Correção da limpeza de post-its
- ``package.json`` - Atualização da versão para 1.0.7

### 🚀 Melhorias de Performance
- Otimizações na função de cópia para clipboard
- Melhor gerenciamento de memória na limpeza de dados
- Interface mais responsiva e intuitiva

### 📦 Informações da Build
- **Tamanho do Instalador**: 73.03 MB
- **Compatibilidade**: Windows 10/11
- **Arquitetura**: x64

### 📥 Instalação
Baixe o instalador ``UBY Sistemas - Gestão de Agendamentos Setup 1.0.7.exe`` abaixo e execute para atualizar sua versão do UBY Sistemas.

---
**Data de Release**: $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Versão Anterior**: v1.0.6
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
    
    # Salvar ID da release para upload posterior
    $response.id | Out-File -FilePath "release-id-v1.0.7.txt" -Encoding UTF8
    
    Write-Host "`n📦 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. ✅ Build já foi gerada (UBY Sistemas - Gestão de Agendamentos Setup 1.0.7.exe)" -ForegroundColor Green
    Write-Host "   2. 📤 Execute o script de upload para anexar o instalador à release" -ForegroundColor White
    Write-Host "   3. 🔗 Compartilhe o link da release: $($response.html_url)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro ao criar release: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorDetails = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorDetails)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
}