/**
 * Servidor WebSocket para comunicação em tempo real
 * Gerencia conexões, sincronização de dados e notificações
 */

const { Server } = require('socket.io');
const http = require('http');

class WebSocketServer {
    constructor(port = 3001) {
        this.port = port;
        this.server = null;
        this.io = null;
        this.connectedUsers = new Map();
        this.rooms = new Map();
    }

    /**
     * Inicializar servidor WebSocket
     */
    start() {
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
            this.setupEventHandlers();

            // Iniciar servidor
            this.server.listen(this.port, () => {
                console.log(`[SERVER] WebSocket Server rodando na porta ${this.port}`);
            });

            return true;
        } catch (error) {
            console.error('[ERROR] Erro ao iniciar WebSocket Server:', error);
            throw error;
        }
    }

    /**
     * Configurar manipuladores de eventos
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`[CONNECTION] Usuário conectado: ${socket.id}`);

            // Evento de autenticação do usuário
            socket.on('authenticate', (userData) => {
                this.handleUserAuthentication(socket, userData);
            });

            // Eventos de agendamentos
            socket.on('agendamento:created', (data) => {
                this.broadcastAgendamentoUpdate('created', data);
            });

            socket.on('agendamento:updated', (data) => {
                this.broadcastAgendamentoUpdate('updated', data);
            });

            socket.on('agendamento:deleted', (data) => {
                this.broadcastAgendamentoUpdate('deleted', data);
            });

            socket.on('agendamento:shared', (data) => {
                this.handleAgendamentoShare(data);
            });

            // Eventos de notificações
            socket.on('notification:send', (data) => {
                this.sendNotificationToUser(data);
            });

            socket.on('notification:read', (data) => {
                this.markNotificationAsRead(data);
            });

            // Eventos de sincronização
            socket.on('sync:request', () => {
                this.handleSyncRequest(socket);
            });

            // Evento de busca em tempo real
            socket.on('search:query', (data) => {
                this.handleSearchQuery(socket, data);
            });

            // Evento de desconexão
            socket.on('disconnect', () => {
                this.handleUserDisconnection(socket);
            });

            // Evento de ping/pong para manter conexão
            socket.on('ping', () => {
                socket.emit('pong');
            });
        });
    }

    /**
     * Autenticar usuário
     */
    handleUserAuthentication(socket, userData) {
        try {
            const { userId, userName, displayName } = userData;
            
            // Armazenar dados do usuário
            this.connectedUsers.set(socket.id, {
                userId,
                userName,
                displayName,
                socketId: socket.id,
                connectedAt: new Date(),
                lastActivity: new Date()
            });

            // Entrar na sala do usuário
            socket.join(`user_${userId}`);

            // Confirmar autenticação
            socket.emit('authenticated', {
                success: true,
                userId,
                connectedUsers: this.getConnectedUsersList()
            });

            // Notificar outros usuários sobre nova conexão
            socket.broadcast.emit('user:connected', {
                userId,
                userName,
                displayName
            });

            console.log(`[AUTH] Usuário autenticado: ${displayName} (${userId})`);
        } catch (error) {
            console.error('[ERROR] Erro na autenticação:', error);
        }
    }

    /**
     * Transmitir atualização de agendamento
     */
    broadcastAgendamentoUpdate(data) {
        try {
            // Transmitir para todos os usuários conectados
            this.io.emit('agendamento:update', data);
            
            console.log(`[BROADCAST] Agendamento ${action}:`, data.agendamento?.id || 'N/A');
        } catch (error) {
            console.error('[ERROR] Erro ao transmitir atualização de agendamento:', error);
        }
    }

    /**
     * Compartilhar agendamento entre usuários
     */
    shareAgendamento(fromUserId, toUserId, agendamento) {
        try {
            const fromUser = this.connectedUsers.get(fromUserId);
            const toUserSocket = this.getUserSocket(toUserId);
            
            if (fromUser && toUserSocket) {
                toUserSocket.emit('agendamento:shared', {
                    agendamento,
                    fromUser: {
                        id: fromUserId,
                        displayName: fromUser.displayName
                    }
                });
                
                console.log(`[SHARE] Agendamento compartilhado de ${fromUser.displayName} para usuário ${toUserId}`);
            }
        } catch (error) {
            console.error('[ERROR] Erro ao compartilhar agendamento:', error);
        }
    }

    /**
     * Enviar notificação para usuário específico
     */
    sendNotification(toUserId, notification) {
        try {
            const toUserSocket = this.getUserSocket(toUserId);
            
            if (toUserSocket) {
                toUserSocket.emit('notification:received', notification);
                console.log(`[NOTIFICATION] Notificação enviada para usuário ${toUserId}`);
            }
        } catch (error) {
            console.error('[ERROR] Erro ao enviar notificação:', error);
        }
    }

    /**
     * Marcar notificação como lida
     */
    markNotificationAsRead(userId, notificationId) {
        try {
            // Aqui você pode implementar a lógica para marcar como lida no banco de dados
            // Por enquanto, apenas transmitir para outros usuários
            this.io.emit('notification:read', {
                userId,
                notificationId
            });
            
            console.log(`[NOTIFICATION] Notificação ${notificationId} marcada como lida`);
        } catch (error) {
            console.error('[ERROR] Erro ao marcar notificação como lida:', error);
        }
    }

    /**
     * Sincronizar dados entre usuários
     */
    syncData(userData, data) {
        try {
            // Transmitir dados sincronizados para todos os usuários
            this.io.emit('data:sync', {
                fromUser: userData,
                data: data,
                timestamp: new Date().toISOString()
            });
            
            console.log(`[SYNC] Sincronização solicitada por ${userData.displayName}`);
        } catch (error) {
            console.error('[ERROR] Erro na sincronização:', error);
        }
    }

    /**
     * Realizar busca e transmitir resultados
     */
    performSearch(userData, query, filters = {}) {
        try {
            // Aqui você implementaria a lógica de busca
            // Por enquanto, apenas transmitir a consulta
            this.io.emit('search:results', {
                query,
                filters,
                results: [], // Implementar lógica de busca aqui
                fromUser: userData
            });
            
            console.log(`[SEARCH] Busca realizada por ${userData.displayName}: "${query}"`);
        } catch (error) {
            console.error('[ERROR] Erro na busca:', error);
        }
    }

    /**
     * Manipular desconexão de usuário
     */
    handleUserDisconnect(socket) {
        try {
            const userData = this.connectedUsers.get(socket.userId);
            
            if (userData) {
                // Remover usuário da lista de conectados
                this.connectedUsers.delete(socket.userId);
                
                // Notificar outros usuários sobre a desconexão
                socket.broadcast.emit('user:disconnected', {
                    id: socket.userId,
                    displayName: userData.displayName
                });
                
                console.log(`[DISCONNECT] Usuário desconectado: ${userData.displayName}`);
            }
        } catch (error) {
            console.error('[ERROR] Erro na desconexão:', error);
        }
    }

    /**
     * Obter socket de usuário específico
     */
    getUserSocket(userId) {
        for (const [socketId, socket] of this.io.sockets.sockets) {
            if (socket.userId === userId) {
                return socket;
            }
        }
        return null;
    }

    /**
     * Transmitir mensagem para todos os usuários
     */
    broadcast(event, data) {
        try {
            this.io.emit(event, data);
        } catch (error) {
            console.error('[ERROR] Erro no broadcast:', error);
        }
    }

    /**
     * Enviar mensagem para usuário específico
     */
    sendToUser(userId, event, data) {
        try {
            const userSocket = this.getUserSocket(userId);
            if (userSocket) {
                userSocket.emit(event, data);
            }
        } catch (error) {
            console.error('[ERROR] Erro ao enviar para usuário:', error);
        }
    }

    /**
     * Parar servidor WebSocket
     */
    stop() {
        try {
            if (this.server) {
                this.server.close();
                console.log('[SERVER] WebSocket Server parado');
            }
        } catch (error) {
            console.error('[ERROR] Erro ao parar servidor:', error);
        }
    }

    /**
     * Obter estatísticas do servidor
     */
    getStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date()
        };
    }
}

module.exports = WebSocketServer;