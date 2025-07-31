/**
 * Script para iniciar automaticamente o servidor WebSocket
 * Verifica se o servidor está rodando e inicia se necessário
 */

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

class WebSocketAutoStarter {
    constructor() {
        this.serverProcess = null;
        this.port = 3002;
        this.maxRetries = 3;
        this.retryDelay = 2000;
    }

    /**
     * Verificar se o servidor está rodando
     */
    async isServerRunning() {
        return new Promise((resolve) => {
            const socket = net.createConnection(this.port, 'localhost');
            
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('error', () => {
                resolve(false);
            });
            
            socket.setTimeout(1000, () => {
                socket.destroy();
                resolve(false);
            });
        });
    }

    /**
     * Iniciar servidor WebSocket
     */
    async startServer() {
        return new Promise((resolve, reject) => {
            console.log(`[INFO] Iniciando servidor WebSocket na porta ${this.port}...`);
            
            // Caminho para o arquivo server.js
            const serverPath = path.join(__dirname, 'server.js');
            
            this.serverProcess = spawn('node', [serverPath], {
                stdio: 'pipe',
                detached: false,
                cwd: __dirname
            });
            
            let started = false;
            
            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString().trim();
                console.log(`[WEBSOCKET] ${output}`);
                
                // Verificar se o servidor iniciou com sucesso
                if (output.includes('Servidor WebSocket iniciado') && !started) {
                    started = true;
                    console.log(`[SUCCESS] Servidor WebSocket iniciado automaticamente na porta ${this.port}`);
                    resolve(true);
                }
            });
            
            this.serverProcess.stderr.on('data', (data) => {
                const error = data.toString().trim();
                console.error(`[WEBSOCKET ERROR] ${error}`);
            });
            
            this.serverProcess.on('error', (error) => {
                console.error(`[ERROR] Erro ao iniciar servidor: ${error.message}`);
                reject(error);
            });
            
            this.serverProcess.on('exit', (code) => {
                if (code !== 0 && !started) {
                    console.error(`[ERROR] Servidor WebSocket saiu com código ${code}`);
                    reject(new Error(`Servidor saiu com código ${code}`));
                }
            });
            
            // Timeout para evitar que fique pendente indefinidamente
            setTimeout(() => {
                if (!started) {
                    console.error('[ERROR] Timeout ao iniciar servidor WebSocket');
                    reject(new Error('Timeout ao iniciar servidor'));
                }
            }, 10000);
        });
    }

    /**
     * Parar servidor WebSocket
     */
    stopServer() {
        if (this.serverProcess) {
            console.log('[INFO] Parando servidor WebSocket...');
            this.serverProcess.kill('SIGTERM');
            this.serverProcess = null;
        }
    }

    /**
     * Inicializar servidor com retry
     */
    async initializeWithRetry() {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`[INFO] Tentativa ${attempt}/${this.maxRetries} de iniciar servidor WebSocket`);
                
                // Verificar se já está rodando
                const isRunning = await this.isServerRunning();
                if (isRunning) {
                    console.log(`[SUCCESS] Servidor WebSocket já está rodando na porta ${this.port}`);
                    return true;
                }
                
                // Iniciar servidor
                await this.startServer();
                
                // Aguardar um pouco e verificar se realmente iniciou
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const isNowRunning = await this.isServerRunning();
                if (isNowRunning) {
                    console.log(`[SUCCESS] Servidor WebSocket iniciado com sucesso na porta ${this.port}`);
                    return true;
                } else {
                    throw new Error('Servidor não respondeu após inicialização');
                }
                
            } catch (error) {
                console.error(`[ERROR] Tentativa ${attempt} falhou: ${error.message}`);
                
                if (attempt < this.maxRetries) {
                    console.log(`[INFO] Aguardando ${this.retryDelay}ms antes da próxima tentativa...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                } else {
                    console.error(`[ERROR] Todas as ${this.maxRetries} tentativas falharam`);
                    return false;
                }
            }
        }
        
        return false;
    }

    /**
     * Monitorar servidor e reiniciar se necessário
     */
    async monitorServer() {
        console.log('[INFO] Iniciando monitoramento do servidor WebSocket...');
        
        setInterval(async () => {
            const isRunning = await this.isServerRunning();
            
            if (!isRunning && this.serverProcess) {
                console.log('[WARN] Servidor WebSocket parou, tentando reiniciar...');
                this.stopServer();
                await this.initializeWithRetry();
            }
        }, 30000); // Verificar a cada 30 segundos
    }
}

// Função principal
async function main() {
    const autoStarter = new WebSocketAutoStarter();
    
    try {
        // Inicializar servidor
        const success = await autoStarter.initializeWithRetry();
        
        if (success) {
            console.log('[SUCCESS] Servidor WebSocket inicializado automaticamente');
            
            // Iniciar monitoramento
            autoStarter.monitorServer();
            
            // Manter o processo ativo
            process.on('SIGINT', () => {
                console.log('\n[INFO] Parando servidor WebSocket...');
                autoStarter.stopServer();
                process.exit(0);
            });
            
            process.on('SIGTERM', () => {
                console.log('\n[INFO] Parando servidor WebSocket...');
                autoStarter.stopServer();
                process.exit(0);
            });
            
        } else {
            console.error('[ERROR] Falha ao inicializar servidor WebSocket');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('[ERROR] Erro crítico:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = WebSocketAutoStarter; 