# Script simples para criar release no GitHub
$token = $env:GH_TOKEN
$headers = @{
    "Authorization" = "Bearer $token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$body = @{
    tag_name = "v1.0.2"
    name = "Release v1.0.2"
    body = "Release para resolver erro 'No published versions on GitHub'"
    draft = $false
    prerelease = $false
}

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/L34NDR0-DEV/UBY--Sistemas/releases" -Method Post -Headers $headers -Body ($body | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ Release criado: $($response.html_url)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
}