#!/bin/bash

echo "========================================"
echo "   UBY Agendamentos - Inicializador"
echo "========================================"
echo

echo "[INFO] Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "[INFO] Instalando dependencias..."
    npm install
fi

echo
echo "[INFO] Iniciando servidor WebSocket e aplicacao..."
echo "[INFO] Pressione Ctrl+C para parar tudo"
echo

npm run dev-full 