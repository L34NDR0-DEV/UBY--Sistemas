/**
 * Servidor WebSocket standalone para debug
 * Execute este script independentemente da aplicação Electron
 */

const { Server } = require('socket.io');
const http = require('http');
const net = require('net');

// Função para verificar se uma porta está disponível
async function isPortAvailable(port) {
    return new Promise((resolve) => {
        const tester = net.createServer()
            .once('error', () => resolve(false))
            .once('listening', () => {
                tester.once('close', () => resolve(true))
                    .close();
            })
            .listen(port);
    });
}

// Função para encontrar uma porta disponível
async function findAvailablePort(startPort) {
    let port = startPort;
    const maxAttempts = 10;
    
    for (let i = 0; i < maxAttempts; i++) {
        if (await isPortAvailable(port)) {
            return port;
        }
        port++;
    }
    
    throw new Error(`Nenhuma porta disponível encontrada entre ${startPort} e ${startPort + maxAttempts}`);
}

async function startServer() {
    try {
        console.log('[INFO] Iniciando servidor WebSocket standalone...');
        
        // Encontrar porta disponível
        const port = await findAvailablePort(3002);
        console.log(`[INFO] Usando porta ${port}...`);
        
        // Criar servidor HTTP
        const server = http.createServer();
        
        // Configurar Socket.IO
        const io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });

        // Configurar eventos básicos
        io.on('connection', (socket) => {
            console.log(`[CONNECT] Nova conexão: ${socket.id}`);
            
            socket.on('ping', () => {
                socket.emit('pong');
            });
            
            socket.on('disconnect', (reason) => {
                console.log(`[DISCONNECT] Conexão ${socket.id} desconectada: ${reason}`);
            });
        });

        // Iniciar servidor
        server.listen(port, (err) => {
            if (err) {
                console.error('[ERROR] Erro ao iniciar servidor:', err);
                process.exit(1);
            } else {
                console.log(`[SUCCESS] Servidor WebSocket iniciado na porta ${port}`);
                console.log('[INFO] Servidor está rodando. Pressione Ctrl+C para parar.');
            }
        });

        // Tratar erros do servidor
        server.on('error', (err) => {
            console.error('[ERROR] Erro no servidor:', err);
        });

        // Manter o processo ativo
        process.on('SIGINT', () => {
            console.log('\n[INFO] Parando servidor...');
            server.close(() => {
                console.log('[INFO] Servidor parado');
                process.exit(0);
            });
        });

        process.on('SIGTERM', () => {
            console.log('\n[INFO] Parando servidor...');
            server.close(() => {
                console.log('[INFO] Servidor parado');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('[ERROR] Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Iniciar servidor
startServer();