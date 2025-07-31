@echo off
echo ========================================
echo    Jelly Beans - Servidor WebSocket
echo ========================================
echo.

echo [1/4] Verificando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)

echo [2/4] Verificando porta 3002...
netstat -an | findstr :3002 >nul
if %errorlevel% equ 0 (
    echo AVISO: Porta 3002 ja esta em uso
    echo Deseja continuar mesmo assim? (S/N)
    set /p choice=
    if /i "%choice%" neq "S" (
        echo Operacao cancelada
        pause
        exit /b 1
    )
)

echo [3/4] Iniciando servidor WebSocket automatico...
echo.
echo Servidor sera iniciado em: http://localhost:3002
echo Status: http://localhost:3002/status
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.

node src/server/auto-start-websocket.js

echo.
echo Servidor WebSocket parado.
pause 