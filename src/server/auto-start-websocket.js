/**
 * Script para iniciar automaticamente o servidor WebSocket
 * Verifica se o servidor está rodando e inicia se necessário
 */

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const http = require('http');

class WebSocketAutoStarter {
    constructor() {
        this.serverProcess = null;
        this.port = 3002;
        this.maxRetries = 5;
        this.retryDelay = 3000;
        this.healthCheckInterval = 10000;
    }

    /**
     * Verificar se o servidor está rodando
     */
    async isServerRunning() {
        return new Promise((resolve) => {
            const socket = net.createConnection(this.port, 'localhost');
            
            socket.on('connect', () => {
                socket.destroy();
                console.log(`[INFO] Servidor detectado na porta ${this.port}`);
                resolve(true);
            });
            
            socket.on('error', () => {
                console.log(`[INFO] Nenhum servidor encontrado na porta ${this.port}`);
                resolve(false);
            });
            
            socket.setTimeout(2000, () => {
                socket.destroy();
                console.log(`[INFO] Timeout ao verificar porta ${this.port}`);
                resolve(false);
            });
        });
    }

    /**
     * Verificar se o servidor está respondendo corretamente
     */
    async isServerHealthy() {
        return new Promise((resolve) => {
            const req = http.get(`http://localhost:${this.port}/status`, (res) => {
                if (res.statusCode === 200) {
                    console.log(`[INFO] Servidor na porta ${this.port} está saudável`);
                    resolve(true);
                } else {
                    console.log(`[WARNING] Servidor na porta ${this.port} respondeu com status ${res.statusCode}`);
                    resolve(false);
                }
            });
            
            req.on('error', (error) => {
                console.log(`[INFO] Servidor na porta ${this.port} não está respondendo: ${error.message}`);
                resolve(false);
            });
            
            req.setTimeout(3000, () => {
                req.destroy();
                console.log(`[INFO] Timeout ao verificar saúde do servidor na porta ${this.port}`);
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
            let healthCheckPassed = false;
            
            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString().trim();
                console.log(`[WEBSOCKET] ${output}`);
                
                // Verificar se o servidor iniciou com sucesso
                if (output.includes('Servidor WebSocket iniciado') && !started) {
                    started = true;
                    console.log(`[SUCCESS] Servidor WebSocket iniciado automaticamente na porta ${this.port}`);
                    
                    // Aguardar um pouco e verificar se está saudável
                    setTimeout(async () => {
                        const isHealthy = await this.isServerHealthy();
                        if (isHealthy) {
                            healthCheckPassed = true;
                            console.log(`[SUCCESS] Servidor WebSocket está respondendo corretamente`);
                            resolve(true);
                        } else {
                            console.log(`[WARNING] Servidor iniciou mas não está respondendo corretamente`);
                            resolve(true); // Ainda considerar sucesso se iniciou
                        }
                    }, 3000);
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
            }, 15000);
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
                    
                    // Verificar se está saudável
                    const isHealthy = await this.isServerHealthy();
                    if (isHealthy) {
                        console.log(`[SUCCESS] Servidor WebSocket está funcionando corretamente`);
                        return true;
                    } else {
                        console.log(`[WARNING] Servidor está rodando mas não está respondendo corretamente`);
                        // Se não está saudável, tentar reiniciar
                        console.log(`[INFO] Tentando reiniciar servidor não saudável...`);
                        this.stopServer();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
                
                // Verificar se há outro processo usando a porta
                console.log(`[INFO] Verificando se há outro processo usando a porta ${this.port}...`);
                const { exec } = require('child_process');
                const checkPort = () => {
                    return new Promise((resolve) => {
                        const command = process.platform === 'win32' 
                            ? `netstat -ano | findstr :${this.port}` 
                            : `lsof -i :${this.port}`;
                        
                        exec(command, (error, stdout) => {
                            if (stdout && stdout.trim()) {
                                console.log(`[WARNING] Porta ${this.port} está sendo usada por outro processo`);
                                console.log(`[INFO] Processos na porta ${this.port}:`, stdout.trim());
                                resolve(true);
                            } else {
                                console.log(`[INFO] Porta ${this.port} está livre`);
                                resolve(false);
                            }
                        });
                    });
                };
                
                const portInUse = await checkPort();
                if (portInUse) {
                    console.log(`[INFO] Aguardando porta ${this.port} ficar livre...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // Verificar novamente se ainda está em uso
                    const stillInUse = await checkPort();
                    if (stillInUse) {
                        console.log(`[WARNING] Porta ${this.port} ainda está em uso, tentando próxima tentativa`);
                        continue;
                    }
                }
                
                // Iniciar servidor
                console.log(`[INFO] Iniciando servidor na porta ${this.port}...`);
                await this.startServer();
                
                // Aguardar um pouco e verificar se realmente iniciou
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const isNowRunning = await this.isServerRunning();
                const isNowHealthy = await this.isServerHealthy();
                
                if (isNowRunning && isNowHealthy) {
                    console.log(`[SUCCESS] Servidor WebSocket iniciado com sucesso na porta ${this.port}`);
                    return true;
                } else if (isNowRunning) {
                    console.log(`[WARNING] Servidor iniciou mas pode não estar totalmente funcional`);
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
            const isHealthy = await this.isServerHealthy();
            
            if (!isRunning || !isHealthy) {
                console.log('[WARN] Servidor WebSocket parou ou não está saudável, tentando reiniciar...');
                this.stopServer();
                await this.initializeWithRetry();
            }
        }, this.healthCheckInterval);
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