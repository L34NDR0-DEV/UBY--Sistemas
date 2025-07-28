# Script para verificar releases existentes no GitHub
$token = $env:GH_TOKEN
$owner = "L34NDR0-DEV"
$repo = "UBY--Sistemas"

# Headers para autenticação
$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "UBY-Agendamentos-Release-Script"
}

try {
    Write-Host "Verificando releases existentes..." -ForegroundColor Cyan
    
    # Listar releases
    $uri = "https://api.github.com/repos/$owner/$repo/releases"
    $releases = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
    
    if ($releases.Count -eq 0) {
        Write-Host "❌ Nenhum release encontrado" -ForegroundColor Red
    } else {
        Write-Host "✅ Releases encontrados:" -ForegroundColor Green
        foreach ($release in $releases) {
            Write-Host "  📦 $($release.tag_name) - $($release.name)" -ForegroundColor Yellow
            Write-Host "     🔗 $($release.html_url)" -ForegroundColor Cyan
        }
    }
    
} catch {
    Write-Host "❌ Erro ao verificar releases: $($_.Exception.Message)" -ForegroundColor Red
}