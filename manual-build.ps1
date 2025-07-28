# Script para build manual da aplicação UBY
Write-Host "=== Build Manual UBY Sistemas ===" -ForegroundColor Cyan
Write-Host ""

# Criar pasta de distribuição
$distPath = "dist-manual"
if (Test-Path $distPath) {
    Write-Host "Removendo build anterior..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $distPath
}

Write-Host "Criando pasta de distribuição..." -ForegroundColor Green
New-Item -ItemType Directory -Path $distPath | Out-Null

# Copiar arquivos principais
Write-Host "Copiando arquivos principais..." -ForegroundColor Green
Copy-Item "main.js" $distPath
Copy-Item "package.json" $distPath
Copy-Item "logo.ico" $distPath

# Copiar pasta src
Write-Host "Copiando pasta src..." -ForegroundColor Green
Copy-Item -Recurse "src" $distPath

# Copiar node_modules essenciais
Write-Host "Copiando dependências essenciais..." -ForegroundColor Green
$nodeModulesPath = "$distPath\node_modules"
New-Item -ItemType Directory -Path $nodeModulesPath | Out-Null

# Lista de dependências essenciais
$essentialDeps = @(
    "electron",
    "electron-store",
    "electron-updater", 
    "socket.io",
    "socket.io-client",
    "ws",
    "sax"
)

foreach ($dep in $essentialDeps) {
    if (Test-Path "node_modules\$dep") {
        Write-Host "  - Copiando $dep..." -ForegroundColor Cyan
        Copy-Item -Recurse "node_modules\$dep" $nodeModulesPath
    }
}

# Criar script de execução
Write-Host "Criando script de execução..." -ForegroundColor Green
$runScript = @"
@echo off
echo Iniciando UBY Sistemas...
node_modules\.bin\electron.cmd .
pause
"@

$runScript | Out-File -FilePath "$distPath\run.bat" -Encoding ASCII

# Criar README para distribuição
Write-Host "Criando README..." -ForegroundColor Green
$readme = @"
# UBY Sistemas - Gestão de Agendamentos

## Como executar:
1. Certifique-se de ter o Node.js instalado
2. Execute o arquivo 'run.bat'

## Requisitos:
- Node.js 16 ou superior
- Windows 10/11

## Versão: 1.0.2
"@

$readme | Out-File -FilePath "$distPath\README.txt" -Encoding UTF8

Write-Host ""
Write-Host "Build manual concluído!" -ForegroundColor Green
Write-Host "Pasta: $distPath" -ForegroundColor Cyan
Write-Host "Para executar: cd $distPath e execute run.bat" -ForegroundColor Yellow
Write-Host ""