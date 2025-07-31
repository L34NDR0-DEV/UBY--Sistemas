/**
 * Script de fallback para iniciar o servidor WebSocket
 * Usado quando o auto-start-websocket.js falha
 */

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

class WebSocketFallback {
    constructor() {
        this.port = 3002;
        this.serverProcess = null;
    }

    /**
     * Verificar se a porta está em uso
     */
    async isPortInUse() {
        return new Promise((resolve) => {
            const socket = net.createConnection(this.port, 'localhost');
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            socket.on('error', () => {
                resolve(false);
            });
            socket.setTimeout(2000, () => {
                socket.destroy();
                resolve(false);
            });
        });
    }

    /**
     * Iniciar servidor WebSocket simples
     */
    async startSimpleServer() {
        return new Promise((resolve, reject) => {
            console.log(`[INFO] Iniciando servidor WebSocket simples na porta ${this.port}...`);
            
            // Caminho para o arquivo server.js
            const serverPath = path.join(__dirname, 'server.js');
            
            // Tentar diferentes executáveis
            const executables = ['node', 'node.exe', process.execPath];
            
            for (const executable of executables) {
                try {
                    this.serverProcess = spawn(executable, [serverPath], {
                        stdio: 'pipe',
                        detached: false,
                        cwd: __dirname,
                        env: { ...process.env, NODE_ENV: 'production' }
                    });
                    
                    let started = false;
                    
                    this.serverProcess.stdout.on('data', (data) => {
                        const output = data.toString().trim();
                        console.log(`[WEBSOCKET] ${output}`);
                        
                        if (output.includes('Servidor WebSocket iniciado') && !started) {
                            started = true;
                            console.log(`[SUCCESS] Servidor WebSocket iniciado via fallback na porta ${this.port}`);
                            resolve(true);
                        }
                    });
                    
                    this.serverProcess.stderr.on('data', (data) => {
                        console.error(`[WEBSOCKET ERROR] ${data.toString().trim()}`);
                    });
                    
                    this.serverProcess.on('error', (error) => {
                        console.error(`[ERROR] Erro com executável ${executable}:`, error.message);
                        // Tentar próximo executável
                        if (this.serverProcess) {
                            this.serverProcess.kill('SIGTERM');
                        }
                    });
                    
                    // Timeout de 10 segundos
                    setTimeout(() => {
                        if (!started) {
                            if (this.serverProcess) {
                                this.serverProcess.kill('SIGTERM');
                            }
                            reject(new Error(`Timeout com executável ${executable}`));
                        }
                    }, 10000);
                    
                    break; // Se chegou aqui, tentou com sucesso
                    
                } catch (error) {
                    console.log(`[INFO] Executável ${executable} não disponível`);
                    continue;
                }
            }
        });
    }

    /**
     * Parar servidor
     */
    stopServer() {
        if (this.serverProcess) {
            this.serverProcess.kill('SIGTERM');
            this.serverProcess = null;
        }
    }

    /**
     * Inicializar com retry
     */
    async initialize() {
        try {
            // Verificar se já está rodando
            const isRunning = await this.isPortInUse();
            if (isRunning) {
                console.log(`[INFO] Servidor já está rodando na porta ${this.port}`);
                return true;
            }
            
            // Tentar iniciar
            await this.startSimpleServer();
            return true;
            
        } catch (error) {
            console.error('[ERROR] Falha ao inicializar servidor via fallback:', error.message);
            return false;
        }
    }
}

// Exportar para uso em outros módulos
module.exports = WebSocketFallback;

// Executar se chamado diretamente
if (require.main === module) {
    const fallback = new WebSocketFallback();
    fallback.initialize().then(success => {
        if (success) {
            console.log('[SUCCESS] Servidor iniciado via fallback');
        } else {
            console.error('[ERROR] Falha ao iniciar servidor via fallback');
            process.exit(1);
        }
    });
} 