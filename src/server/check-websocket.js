/**
 * Script para verificar se o servidor WebSocket está rodando
 */

const net = require('net');

function checkPort(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        
        socket.setTimeout(5000); // 5 segundos de timeout
        
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.connect(port, 'localhost');
    });
}

async function checkWebSocketServer() {
    console.log('[INFO] Verificando se o servidor WebSocket está rodando...');
    
    const ports = [3002, 3003, 3004, 3005];
    
    for (const port of ports) {
        const isRunning = await checkPort(port);
        if (isRunning) {
            console.log(`[SUCCESS] Servidor WebSocket encontrado na porta ${port}`);
            return port;
        } else {
            console.log(`[INFO] Porta ${port} não está respondendo`);
        }
    }
    
    console.log('[WARNING] Nenhum servidor WebSocket encontrado');
    return null;
}

// Exportar função para uso em outros módulos
module.exports = { checkWebSocketServer, checkPort };

// Se executado diretamente
if (require.main === module) {
    checkWebSocketServer().then(port => {
        if (port) {
            console.log(`✅ Servidor WebSocket está rodando na porta ${port}`);
            process.exit(0);
        } else {
            console.log('❌ Servidor WebSocket não está rodando');
            process.exit(1);
        }
    });
} 