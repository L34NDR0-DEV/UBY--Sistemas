/**
 * Script para iniciar o servidor WebSocket independentemente
 * Execute este script antes de iniciar a aplicação principal
 */

const WebSocketServer = require('./websocket-server');

async function startWebSocketServer() {
    try {
        console.log('[INFO] Iniciando servidor WebSocket...');
        
        const server = new WebSocketServer(3002);
        const started = await server.start();
        
        if (started) {
            console.log(`[SUCCESS] Servidor WebSocket iniciado na porta ${server.port}`);
            console.log('[INFO] Servidor está rodando. Pressione Ctrl+C para parar.');
            
            // Manter o processo ativo
            process.on('SIGINT', () => {
                console.log('\n[INFO] Parando servidor WebSocket...');
                server.stop();
                process.exit(0);
            });
            
            process.on('SIGTERM', () => {
                console.log('\n[INFO] Parando servidor WebSocket...');
                server.stop();
                process.exit(0);
            });
            
        } else {
            console.error('[ERROR] Falha ao iniciar servidor WebSocket');
            process.exit(1);
        }
    } catch (error) {
        console.error('[ERROR] Erro ao iniciar servidor WebSocket:', error);
        process.exit(1);
    }
}

// Iniciar servidor
startWebSocketServer(); 