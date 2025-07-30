/**
 * Servidor WebSocket para comunicação em tempo real
 * Gerencia conexões, eventos e sincronização entre clientes
 */

const { Server } = require('socket.io');
const http = require('http');

class WebSocketServer {
    constructor(port = 3001) {
        this.port = port;
        this.server = null;
        this.io = null;
        this.connectedUsers = new Map();
        this.isRunning = false;
        this.stats = {
            connections: 0,
            totalConnections: 0,
            messagesReceived: 0,
            messagesSent: 0
        };
    }

    /**
     * Iniciar servidor WebSocket
     */
    start() {
        return new Promise((resolve, reject) => {
            try {
                // Criar servidor HTTP
                this.server = http.createServer();
                
                // Configurar Socket.IO
                this.io = new Server(this.server, {
                    cors: {
                        origin: "*",
                        methods: ["GET", "POST"]
                    },
                    transports: ['websocket', 'polling']
                });

                // Configurar eventos
                this.setupEvents();

                // Iniciar servidor
                this.server.listen(this.port, (err) => {
                    if (err) {
                        console.error('❌ Erro ao iniciar servidor WebSocket:', err);
                        reject(err);
                    } else {
                        console.log(`🚀 Servidor WebSocket iniciado na porta ${this.port}`);
                        this.isRunning = true;
                        this.startTime = Date.now();
                        resolve(true);
                    }
                });

                // Tratar erros do servidor
                this.server.on('error', (err) => {
                    console.error('❌ Erro no servidor WebSocket:', err);
                    reject(err);
                });

            } catch (error) {
                console.error('❌ Erro ao inicializar servidor WebSocket:', error);
                reject(error);
            }
        });
    }

    /**
     * Configurar eventos do Socket.IO
     */
    setupEvents() {
        this.io.on('connection', (socket) => {
            console.log(`🔗 Nova conexão: ${socket.id}`);
            this.stats.connections++;
            this.stats.totalConnections++;

            // Eventos de autenticação
            socket.on('authenticate', (data) => {
                this.handleAuthentication(socket, data);
            });

            // Eventos de agendamento
            socket.on('agendamento:create', (data) => {
                this.handleAgendamentoUpdate(socket, 'create', data);
            });

            socket.on('agendamento:update', (data) => {
                this.handleAgendamentoUpdate(socket, 'update', data);
            });

            socket.on('agendamento:delete', (data) => {
                this.handleAgendamentoUpdate(socket, 'delete', data);
            });

            socket.on('agendamento:shared', (data) => {
                this.handleAgendamentoShared(socket, data);
            });

            // Eventos de notificação
            socket.on('notification:send', (data) => {
                this.handleNotificationSend(socket, data);
            });

            socket.on('notification:read', (data) => {
                this.handleNotificationRead(socket, data);
            });

            // Eventos de sincronização
            socket.on('sync:request', () => {
                this.handleSyncRequest(socket);
            });

            // Eventos de busca
            socket.on('search:query', (data) => {
                this.handleSearchQuery(socket, data);
            });

            // Eventos de ping/pong
            socket.on('ping', () => {
                socket.emit('pong');
            });

            // Evento de desconexão
            socket.on('disconnect', (reason) => {
                this.handleDisconnection(socket, reason);
            });
        });
    }

    /**
     * Manipular autenticação de usuário
     */
    handleAuthentication(socket, data) {
        try {
            const { userId, userName, displayName } = data;
            
            // Armazenar dados do usuário
            socket.userId = userId;
            socket.userName = userName;
            socket.displayName = displayName;
            
            // Adicionar à lista de usuários conectados
            this.connectedUsers.set(socket.id, {
                userId,
                userName,
                displayName,
                socketId: socket.id,
                connectedAt: new Date()
            });

            // Confirmar autenticação
            socket.emit('authenticated', {
                success: true,
                userId,
                connectedUsers: Array.from(this.connectedUsers.values())
            });

            // Notificar outros usuários sobre nova conexão
            socket.broadcast.emit('user:connected', {
                userId,
                userName,
                displayName
            });

            console.log(`✅ Usuário autenticado: ${displayName} (${userId})`);
            this.stats.messagesReceived++;
            this.stats.messagesSent++;
        } catch (error) {
            console.error('❌ Erro na autenticação:', error);
            socket.emit('authentication:error', {
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Manipular atualização de agendamento
     */
    handleAgendamentoUpdate(socket, action, data) {
        try {
            const updateData = {
                action,
                agendamento: data.agendamento,
                userId: socket.userId,
                userName: socket.userName,
                displayName: socket.displayName,
                timestamp: new Date()
            };

            // Enviar para todos os outros usuários conectados
            socket.broadcast.emit('agendamento:update', updateData);

            console.log(`📅 Agendamento ${action} por ${socket.displayName}`);
            this.stats.messagesReceived++;
            this.stats.messagesSent += this.stats.connections - 1;
        } catch (error) {
            console.error('❌ Erro ao processar atualização de agendamento:', error);
        }
    }

    /**
     * Manipular compartilhamento de agendamento
     */
    handleAgendamentoShared(socket, data) {
        try {
            const { toUserId, agendamento, fromUser, message } = data;

            // Encontrar socket do usuário destinatário
            const targetSocket = this.findSocketByUserId(toUserId);
            
            if (targetSocket) {
                targetSocket.emit('agendamento:shared', {
                    agendamento,
                    fromUser: {
                        userId: socket.userId,
                        userName: socket.userName,
                        displayName: socket.displayName
                    },
                    message
                });

                console.log(`📤 Agendamento compartilhado de ${socket.displayName} para usuário ${toUserId}`);
                this.stats.messagesReceived++;
                this.stats.messagesSent++;
            } else {
                console.warn(`⚠️ Usuário ${toUserId} não encontrado para compartilhamento`);
            }
        } catch (error) {
            console.error('❌ Erro ao compartilhar agendamento:', error);
        }
    }

    /**
     * Manipular envio de notificação
     */
    handleNotificationSend(socket, data) {
        try {
            const { toUserId, notification } = data;

            // Encontrar socket do usuário destinatário
            const targetSocket = this.findSocketByUserId(toUserId);
            
            if (targetSocket) {
                targetSocket.emit('notification:received', {
                    notification,
                    fromUser: {
                        userId: socket.userId,
                        userName: socket.userName,
                        displayName: socket.displayName
                    },
                    timestamp: new Date()
                });

                console.log(`🔔 Notificação enviada de ${socket.displayName} para usuário ${toUserId}`);
                this.stats.messagesReceived++;
                this.stats.messagesSent++;
            } else {
                console.warn(`⚠️ Usuário ${toUserId} não encontrado para notificação`);
            }
        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error);
        }
    }

    /**
     * Manipular marcação de notificação como lida
     */
    handleNotificationRead(socket, data) {
        try {
            const { notificationId } = data;

            // Broadcast para outros clientes do mesmo usuário
            socket.broadcast.emit('notification:read', {
                notificationId,
                userId: socket.userId
            });

            console.log(`✅ Notificação ${notificationId} marcada como lida por ${socket.displayName}`);
            this.stats.messagesReceived++;
        } catch (error) {
            console.error('❌ Erro ao marcar notificação como lida:', error);
        }
    }

    /**
     * Manipular solicitação de sincronização
     */
    handleSyncRequest(socket) {
        try {
            // Simular dados de sincronização
            const syncData = {
                timestamp: new Date(),
                connectedUsers: Array.from(this.connectedUsers.values()),
                serverStats: this.getStats()
            };

            socket.emit('sync:response', syncData);

            console.log(`🔄 Sincronização solicitada por ${socket.displayName}`);
            this.stats.messagesReceived++;
            this.stats.messagesSent++;
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
        }
    }

    /**
     * Manipular consulta de busca
     */
    handleSearchQuery(socket, data) {
        try {
            const { query, filters } = data;

            // Simular resultados de busca
            const results = {
                query,
                filters,
                results: [],
                timestamp: new Date()
            };

            socket.emit('search:results', results);

            console.log(`🔍 Busca realizada por ${socket.displayName}: "${query}"`);
            this.stats.messagesReceived++;
            this.stats.messagesSent++;
        } catch (error) {
            console.error('❌ Erro na busca:', error);
        }
    }

    /**
     * Manipular desconexão
     */
    handleDisconnection(socket, reason) {
        try {
            const user = this.connectedUsers.get(socket.id);
            
            if (user) {
                // Remover da lista de usuários conectados
                this.connectedUsers.delete(socket.id);

                // Notificar outros usuários sobre desconexão
                socket.broadcast.emit('user:disconnected', {
                    userId: user.userId,
                    userName: user.userName,
                    displayName: user.displayName
                });

                console.log(`🔌 Usuário desconectado: ${user.displayName} (${reason})`);
            }

            this.stats.connections--;
        } catch (error) {
            console.error('❌ Erro ao processar desconexão:', error);
        }
    }

    /**
     * Encontrar socket por ID do usuário
     */
    findSocketByUserId(userId) {
        for (const [socketId, userData] of this.connectedUsers.entries()) {
            if (userData.userId === userId) {
                return this.io.sockets.sockets.get(socketId);
            }
        }
        return null;
    }

    /**
     * Parar servidor WebSocket
     */
    stop() {
        try {
            if (this.io) {
                this.io.close();
            }
            
            if (this.server) {
                this.server.close();
            }

            this.isRunning = false;
            this.connectedUsers.clear();
            
            console.log('🛑 Servidor WebSocket parado');
            return true;
        } catch (error) {
            console.error('❌ Erro ao parar servidor WebSocket:', error);
            return false;
        }
    }

    /**
     * Obter estatísticas do servidor
     */
    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            connectedUsers: this.connectedUsers.size,
            uptime: this.isRunning ? Date.now() - this.startTime : 0
        };
    }

    /**
     * Verificar se o servidor está rodando
     */
    isServerRunning() {
        return this.isRunning;
    }
}

module.exports = WebSocketServer;