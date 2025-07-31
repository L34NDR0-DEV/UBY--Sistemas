@echo off
echo ========================================
echo    Jelly Beans - Sistema WebSocket
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
start "Servidor WebSocket Auto" cmd /k "npm run auto-websocket"

echo [4/4] Aguardando servidor inicializar...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo    Sistema iniciado com sucesso!
echo ========================================
echo.
echo Servidor WebSocket: http://localhost:3002
echo Status: http://localhost:3002/status
echo Teste: test-websocket.html
echo.
echo Para iniciar a aplicacao Electron:
echo npm run dev
echo.
echo Para iniciar tudo junto (servidor + app):
echo npm run dev-with-auto
echo.
echo Para parar o servidor, feche a janela do servidor
echo ou pressione Ctrl+C
echo.
pause 