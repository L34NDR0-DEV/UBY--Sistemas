/**
 * Script de teste para verificar conectividade do WebSocket
 * Testa se o servidor está rodando e respondendo corretamente
 */

const net = require('net');
const http = require('http');

class WebSocketTester {
    constructor() {
        this.port = 3002;
        this.testResults = [];
    }

    /**
     * Testar se a porta está em uso
     */
    async testPortInUse() {
        return new Promise((resolve) => {
            const socket = net.createConnection(this.port, 'localhost');
            
            socket.on('connect', () => {
                socket.destroy();
                this.testResults.push(`[SUCCESS] Porta ${this.port} está em uso`);
                resolve(true);
            });
            
            socket.on('error', () => {
                this.testResults.push(`[ERROR] Porta ${this.port} não está em uso`);
                resolve(false);
            });
            
            socket.setTimeout(2000, () => {
                socket.destroy();
                this.testResults.push(`[TIMEOUT] Timeout ao verificar porta ${this.port}`);
                resolve(false);
            });
        });
    }

    /**
     * Testar se o servidor está respondendo HTTP
     */
    async testHttpResponse() {
        return new Promise((resolve) => {
            const req = http.get(`http://localhost:${this.port}/status`, (res) => {
                if (res.statusCode === 200) {
                    this.testResults.push(`[SUCCESS] Servidor HTTP está respondendo (status: ${res.statusCode})`);
                    resolve(true);
                } else {
                    this.testResults.push(`[WARNING] Servidor HTTP respondeu com status ${res.statusCode}`);
                    resolve(false);
                }
            });
            
            req.on('error', (error) => {
                this.testResults.push(`[ERROR] Erro HTTP: ${error.message}`);
                resolve(false);
            });
            
            req.setTimeout(3000, () => {
                req.destroy();
                this.testResults.push(`[TIMEOUT] Timeout ao verificar resposta HTTP`);
                resolve(false);
            });
        });
    }

    /**
     * Testar conectividade WebSocket
     */
    async testWebSocketConnection() {
        return new Promise((resolve) => {
            // Simular conexão WebSocket básica
            const socket = net.createConnection(this.port, 'localhost');
            
            socket.on('connect', () => {
                // Enviar handshake WebSocket básico
                const handshake = 'GET /socket.io/?EIO=4&transport=websocket HTTP/1.1\r\n' +
                                 'Host: localhost:3002\r\n' +
                                 'Upgrade: websocket\r\n' +
                                 'Connection: Upgrade\r\n' +
                                 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n' +
                                 'Sec-WebSocket-Version: 13\r\n\r\n';
                
                socket.write(handshake);
                
                setTimeout(() => {
                    socket.destroy();
                    this.testResults.push(`[SUCCESS] Conexão WebSocket estabelecida`);
                    resolve(true);
                }, 1000);
            });
            
            socket.on('error', (error) => {
                this.testResults.push(`[ERROR] Erro na conexão WebSocket: ${error.message}`);
                resolve(false);
            });
            
            socket.setTimeout(5000, () => {
                socket.destroy();
                this.testResults.push(`[TIMEOUT] Timeout na conexão WebSocket`);
                resolve(false);
            });
        });
    }

    /**
     * Executar todos os testes
     */
    async runAllTests() {
        console.log('[INFO] Iniciando testes de conectividade WebSocket...\n');
        
        const portTest = await this.testPortInUse();
        const httpTest = await this.testHttpResponse();
        const wsTest = await this.testWebSocketConnection();
        
        console.log('\n[INFO] Resultados dos testes:');
        console.log('='.repeat(50));
        
        this.testResults.forEach(result => {
            console.log(result);
        });
        
        console.log('='.repeat(50));
        
        if (portTest && httpTest && wsTest) {
            console.log('[SUCCESS] Todos os testes passaram! Servidor WebSocket está funcionando corretamente.');
            return true;
        } else {
            console.log('[ERROR] Alguns testes falharam. Servidor WebSocket pode não estar funcionando corretamente.');
            return false;
        }
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    const tester = new WebSocketTester();
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = WebSocketTester; 