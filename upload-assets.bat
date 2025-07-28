@echo off
echo 🚀 Anexando arquivos ao release v1.0.3...
echo.
powershell -ExecutionPolicy Bypass -File "upload-release-assets.ps1"
pause