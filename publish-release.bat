@echo off
echo Publicando release v1.0.1 no GitHub...
echo.
echo Verificando se o token do GitHub está configurado...
if "%GH_TOKEN%"=="" (
    echo ERRO: Token do GitHub não configurado!
    echo.
    echo Para configurar o token:
    echo 1. Acesse: https://github.com/settings/tokens
    echo 2. Crie um novo token com permissão 'repo'
    echo 3. Execute: set GH_TOKEN=seu_token_aqui
    echo.
    pause
    exit /b 1
)

echo Token configurado! Publicando...
npm run publish

echo.
echo Release publicado! Verifique em:
echo https://github.com/L34NDR0-DEV/UBY--Sistemas/releases
pause