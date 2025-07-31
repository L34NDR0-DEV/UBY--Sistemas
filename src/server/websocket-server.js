/**
 * Servidor WebSocket para comunicação em tempo real
 * Gerencia conexões, eventos e sincronização entre clientes
 */

const { Server } = require('socket.io');
const http = require('http');
const net = require('net');
const Database = require('../utils/database');
const OfflineCache = require('../utils/offline-cache');
const ConflictResolver = require('../utils/conflict-resolver');

class WebSocketServer {
    constructor(startPort = 3002) {
        this.startPort = startPort;
        this.port = null;
        this.server = null;
        this.io = null;
        this.db = new Database();
        this.cache = new OfflineCache();
        this.conflictResolver = new ConflictResolver();
        this.connectedUsers = new Map();
        this.isRunning = false;
        this.syncInterval = null;
        this.lastSyncTime = new Date();
        this.pendingUpdates = new Map();
        this.stats = {
            connections: 0,
            totalConnections: 0,
            messagesReceived: 0,
            messagesSent: 0,
            conflicts: 0,
            cacheHits: 0,
            syncCount: 0,
            updatesBroadcasted: 0
        };
    }

    /**
     * Verificar se uma porta está disponível
     */
    async isPortAvailable(port) {
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

    /**
     * Encontrar uma porta disponível
     */
    async findAvailablePort(startPort) {
        let port = startPort;
        const maxAttempts = 10;
        
        for (let i = 0; i < maxAttempts; i++) {
            if (await this.isPortAvailable(port)) {
                return port;
            }
            port++;
        }
        
        throw new Error(`Nenhuma porta disponível encontrada entre ${startPort} e ${startPort + maxAttempts}`);
    }

    /**
     * Iniciar servidor WebSocket
     */
    async start() {
        return new Promise(async (resolve, reject) => {
            try {
                // Inicializar banco de dados
                await this.db.initialize();
                
                // Inicializar cache offline
                this.cache.initialize();
                
                // Encontrar porta disponível
                this.port = await this.findAvailablePort(this.startPort);
                console.log(`[INFO] Tentando porta ${this.port}...`);
                
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
                        console.error('[ERROR] Erro ao iniciar servidor WebSocket:', err);
                        reject(err);
                    } else {
                        console.log(`[SUCCESS] Servidor WebSocket iniciado na porta ${this.port}`);
                        this.isRunning = true;
                        this.startTime = Date.now();
                        
                        // Iniciar sincronização periódica
                        this.startPeriodicSync();
                        
                        resolve(true);
                    }
                });

                // Tratar erros do servidor
                this.server.on('error', (err) => {
                    console.error('[ERROR] Erro no servidor WebSocket:', err);
                    reject(err);
                });

            } catch (error) {
                console.error('[ERROR] Erro ao inicializar servidor WebSocket:', error);
                reject(error);
            }
        });
    }

    /**
     * Iniciar sincronização periódica
     */
    startPeriodicSync() {
        // Sincronização a cada 30 segundos
        this.syncInterval = setInterval(async () => {
            try {
                await this.broadcastPeriodicSync();
            } catch (error) {
                console.error('[ERROR] Erro na sincronização periódica:', error);
            }
        }, 30000); // 30 segundos

        console.log('[INFO] Sincronização periódica iniciada (30s)');
    }

    /**
     * Parar sincronização periódica
     */
    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('[INFO] Sincronização periódica parada');
        }
    }

    /**
     * Broadcast de sincronização periódica
     */
    async broadcastPeriodicSync() {
        try {
            const now = new Date();
            const timeSinceLastSync = now.getTime() - this.lastSyncTime.getTime();
            
            // Só sincronizar se passou tempo suficiente
            if (timeSinceLastSync < 25000) { // 25 segundos
                return;
            }

            // Buscar atualizações recentes
            const recentUpdates = await this.getRecentUpdates();
            
            if (recentUpdates.length > 0) {
                const syncData = {
                    type: 'periodic_sync',
                    timestamp: now,
                    updates: recentUpdates,
                    stats: this.getStats()
                };

                // Broadcast para todos os usuários conectados
                this.io.emit('sync:broadcast', syncData);
                
                this.lastSyncTime = now;
                this.stats.syncCount++;
                
                console.log(`[SYNC] Sincronização periódica enviada com ${recentUpdates.length} atualizações`);
            }
        } catch (error) {
            console.error('[ERROR] Erro no broadcast periódico:', error);
        }
    }

    /**
     * Buscar atualizações recentes
     */
    async getRecentUpdates() {
        try {
            const updates = [];
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutos atrás

            // Buscar agendamentos atualizados recentemente
            const recentAppointments = await this.db.getAppointmentsUpdatedSince(fiveMinutesAgo);
            
            recentAppointments.forEach(appointment => {
                updates.push({
                    type: 'agendamento',
                    action: 'update',
                    data: appointment,
                    timestamp: appointment.updated_at || appointment.created_at
                });
            });

            // Buscar notificações recentes
            const recentNotifications = await this.db.getNotificationsSince(fiveMinutesAgo);
            
            recentNotifications.forEach(notification => {
                updates.push({
                    type: 'notification',
                    action: 'new',
                    data: notification,
                    timestamp: notification.created_at
                });
            });

            // Buscar mudanças de status
            const statusChanges = await this.db.getStatusChangesSince(fiveMinutesAgo);
            
            statusChanges.forEach(change => {
                updates.push({
                    type: 'status',
                    action: 'change',
                    data: change,
                    timestamp: change.updated_at
                });
            });

            return updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('[ERROR] Erro ao buscar atualizações recentes:', error);
            return [];
        }
    }

    /**
     * Configurar eventos do Socket.IO
     */
    setupEvents() {
        this.io.on('connection', (socket) => {
            console.log(`[CONNECT] Nova conexão: ${socket.id}`);
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

            // Eventos de status
            socket.on('status:update', (data) => {
                this.handleStatusUpdate(socket, data);
            });

            socket.on('status:complete', (data) => {
                this.handleStatusComplete(socket, data);
            });

            socket.on('status:cancel', (data) => {
                this.handleStatusCancel(socket, data);
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

            socket.on('sync:force', () => {
                this.handleForceSync(socket);
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
    async handleAuthentication(socket, data) {
        try {
            const { userId, userName, displayName } = data;
            
            // Salvar usuário no banco de dados
            await this.db.createUser(userId, userName, displayName);
            
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

            // Buscar dados do usuário do banco
            const userData = await this.db.getUser(userId);
            const notifications = await this.db.getNotifications(userId);

            // Confirmar autenticação
            socket.emit('authenticated', {
                success: true,
                userId,
                userData,
                notifications,
                connectedUsers: Array.from(this.connectedUsers.values())
            });

            // Notificar outros usuários sobre nova conexão
            socket.broadcast.emit('user:connected', {
                userId,
                userName,
                displayName
            });

            console.log(`[AUTH] Usuário autenticado: ${displayName} (${userId})`);
            this.stats.messagesReceived++;
            this.stats.messagesSent++;
        } catch (error) {
            console.error('[ERROR] Erro na autenticação:', error);
            socket.emit('authentication:error', {
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Manipular atualização de agendamento com resolução de conflitos
     */
    async handleAgendamentoUpdate(socket, action, data) {
        try {
            const updateData = {
                action,
                agendamento: data.agendamento,
                userId: socket.userId,
                userName: socket.userName,
                displayName: socket.displayName,
                timestamp: new Date()
            };

            // Verificar se há conflitos
            if (action === 'update') {
                const existingAppointment = await this.db.getAppointment(data.agendamento.id);
                
                if (existingAppointment) {
                    const conflicts = this.conflictResolver.detectConflict(
                        existingAppointment,
                        data.agendamento,
                        data.agendamento
                    );

                    if (conflicts) {
                        console.log(`[CONFLICT] Conflito detectado para agendamento ${data.agendamento.id}`);
                        this.stats.conflicts++;
                        
                        // Resolver conflito automaticamente
                        const strategy = this.conflictResolver.suggestStrategy(conflicts, {
                            currentTimestamp: existingAppointment.updated_at,
                            incomingTimestamp: new Date()
                        });
                        
                        const resolution = await this.conflictResolver.resolveConflict(conflicts, strategy);
                        const resolvedAppointment = this.conflictResolver.applyResolution(data.agendamento, resolution);
                        
                        // Atualizar dados com resolução
                        updateData.agendamento = resolvedAppointment;
                        updateData.conflictResolution = resolution;
                        
                        // Notificar sobre conflito resolvido
                        socket.emit('conflict:resolved', {
                            appointmentId: data.agendamento.id,
                            resolution: resolution
                        });
                    }
                }
            }

            // Persistir no banco de dados
            switch (action) {
                case 'create':
                    await this.db.createAppointment(data.agendamento);
                    break;
                case 'update':
                    await this.db.updateAppointment(updateData.agendamento);
                    break;
                case 'delete':
                    await this.db.deleteAppointment(data.agendamento.id, socket.userId);
                    break;
            }

            // Salvar no cache offline
            this.cache.saveToCache(`appointment_${data.agendamento.id}`, updateData.agendamento);

            // Enviar para todos os outros usuários conectados
            socket.broadcast.emit('agendamento:update', updateData);

            console.log(`[APPOINTMENT] Agendamento ${action} por ${socket.displayName}`);
            this.stats.messagesReceived++;
            this.stats.messagesSent += this.stats.connections - 1;
        } catch (error) {
            console.error('[ERROR] Erro ao processar atualização de agendamento:', error);
            
            // Se falhou, salvar como ação pendente
            this.cache.addPendingAction({
                type: 'agendamento:update',
                data: { action, agendamento: data.agendamento, userId: socket.userId }
            });
        }
    }

    /**
     * Manipular compartilhamento de agendamento
     */
    async handleAgendamentoShared(socket, data) {
        try {
            const { toUserId, agendamento, fromUser, message } = data;

            // Atualizar agendamento no banco com compartilhamento
            agendamento.sharedWith = toUserId;
            await this.db.updateAppointment(agendamento);

            // Criar notificação para o usuário destinatário
            await this.db.createNotification({
                id: `notif_${Date.now()}_${Math.random()}`,
                userId: toUserId,
                fromUserId: socket.userId,
                title: 'Agendamento Compartilhado',
                message: `${socket.displayName} compartilhou um agendamento com você`,
                type: 'share'
            });

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

                // Enviar notificação em tempo real com TTS
                const notificationData = {
                    notification: {
                        id: `notif_${Date.now()}_${Math.random()}`,
                        title: 'Agendamento Compartilhado',
                        message: `${socket.displayName} compartilhou um agendamento com você`,
                        type: 'share',
                        tts: {
                            enabled: true,
                            text: `Você recebeu um agendamento de ${agendamento.nomeCliente || agendamento.cliente} de ${socket.displayName}${message ? `. Mensagem: ${message}` : ''}`,
                            priority: 2
                        }
                    },
                    fromUser: {
                        userId: socket.userId,
                        userName: socket.userName,
                        displayName: socket.displayName
                    },
                    timestamp: new Date()
                };

                targetSocket.emit('notification:received', notificationData);

                // Enviar notificação TTS específica
                targetSocket.emit('tts:speak', {
                    text: `Você recebeu um agendamento de ${agendamento.nomeCliente || agendamento.cliente} de ${socket.displayName}${message ? `. Mensagem: ${message}` : ''}`,
                    priority: 2,
                    type: 'share_received'
                });

                console.log(`[SHARE] Agendamento compartilhado de ${socket.displayName} para usuário ${toUserId}`);
                this.stats.messagesReceived++;
                this.stats.messagesSent++;
            } else {
                console.warn(`[WARN] Usuário ${toUserId} não encontrado para compartilhamento`);
            }
        } catch (error) {
            console.error('[ERROR] Erro ao compartilhar agendamento:', error);
        }
    }

    /**
     * Manipular envio de notificação
     */
    async handleNotificationSend(socket, data) {
        try {
            const { toUserId, notification } = data;

            // Salvar notificação no banco
            await this.db.createNotification({
                ...notification,
                userId: toUserId,
                fromUserId: socket.userId
            });

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

                console.log(`[NOTIFICATION] Notificação enviada de ${socket.displayName} para usuário ${toUserId}`);
                this.stats.messagesReceived++;
                this.stats.messagesSent++;
            } else {
                console.warn(`[WARN] Usuário ${toUserId} não encontrado para notificação`);
            }
        } catch (error) {
            console.error('[ERROR] Erro ao enviar notificação:', error);
        }
    }

    /**
     * Manipular marcação de notificação como lida
     */
    async handleNotificationRead(socket, data) {
        try {
            const { notificationId } = data;

            // Marcar como lida no banco
            await this.db.markNotificationAsRead(notificationId);

            // Broadcast para outros clientes do mesmo usuário
            socket.broadcast.emit('notification:read', {
                notificationId,
                userId: socket.userId
            });

            console.log(`[READ] Notificação marcada como lida por ${socket.displayName}`);
            this.stats.messagesReceived++;
            this.stats.messagesSent++;
        } catch (error) {
            console.error('[ERROR] Erro ao marcar notificação como lida:', error);
        }
    }

    /**
     * Manipular solicitação de sincronização com cache
     */
    async handleSyncRequest(socket) {
        try {
            // Buscar dados do banco
            const appointments = await this.db.getAppointments(socket.userId);
            const notifications = await this.db.getNotifications(socket.userId);
            const syncLog = await this.db.getSyncLog();

            // Verificar cache offline para dados adicionais
            const cachedData = this.cache.loadFromCache(`user_${socket.userId}_data`);
            
            const syncData = {
                timestamp: new Date(),
                appointments,
                notifications,
                syncLog,
                cachedData,
                connectedUsers: Array.from(this.connectedUsers.values()),
                serverStats: this.getStats(),
                cacheStats: this.cache.getCacheStats(),
                conflictStats: this.conflictResolver.getConflictStats()
            };

            socket.emit('sync:response', syncData);

            console.log(`[SYNC] Sincronização solicitada por ${socket.displayName}`);
            this.stats.messagesReceived++;
            this.stats.messagesSent++;
        } catch (error) {
            console.error('[ERROR] Erro na sincronização:', error);
            
            // Se falhou, usar dados do cache
            const cachedData = this.cache.loadFromCache(`user_${socket.userId}_data`);
            if (cachedData) {
                socket.emit('sync:response', {
                    timestamp: new Date(),
                    appointments: cachedData.appointments || [],
                    notifications: cachedData.notifications || [],
                    fromCache: true,
                    message: 'Dados carregados do cache offline'
                });
                this.stats.cacheHits++;
            }
        }
    }

    /**
     * Manipular sincronização forçada
     */
    async handleForceSync(socket) {
        try {
            console.log(`[SYNC] Sincronização forçada solicitada por ${socket.displayName}`);
            
            // Buscar todas as atualizações recentes
            const recentUpdates = await this.getRecentUpdates();
            
            const syncData = {
                type: 'force_sync',
                timestamp: new Date(),
                updates: recentUpdates,
                stats: this.getStats()
            };

            socket.emit('sync:response', syncData);
            
            console.log(`[SYNC] Sincronização forçada enviada com ${recentUpdates.length} atualizações`);
            this.stats.messagesReceived++;
            this.stats.messagesSent++;
        } catch (error) {
            console.error('[ERROR] Erro na sincronização forçada:', error);
        }
    }

    /**
     * Manipular atualização de status
     */
    async handleStatusUpdate(socket, data) {
        try {
            const { agendamentoId, newStatus, userId, reason } = data;
            
            // Atualizar status no banco
            await this.db.updateAppointmentStatus(agendamentoId, newStatus, userId);
            
            const updateData = {
                type: 'status_update',
                agendamentoId,
                newStatus,
                userId: socket.userId,
                userName: socket.userName,
                displayName: socket.displayName,
                reason,
                timestamp: new Date()
            };

            // Broadcast para todos os usuários conectados
            socket.broadcast.emit('status:updated', updateData);
            
            // Notificar usuário específico se for compartilhado
            if (data.sharedWith) {
                const targetSocket = this.findSocketByUserId(data.sharedWith);
                if (targetSocket) {
                    targetSocket.emit('status:updated', updateData);
                }
            }

            console.log(`[STATUS] Status atualizado para ${newStatus} por ${socket.displayName}`);
            this.stats.messagesReceived++;
            this.stats.messagesSent++;
            this.stats.updatesBroadcasted++;
        } catch (error) {
            console.error('[ERROR] Erro ao atualizar status:', error);
        }
    }

    /**
     * Manipular conclusão de agendamento
     */
    async handleStatusComplete(socket, data) {
        try {
            const { agendamentoId, completionNotes } = data;
            
            // Marcar como concluído no banco
            await this.db.completeAppointment(agendamentoId, socket.userId, completionNotes);
            
            const completeData = {
                type: 'status_complete',
                agendamentoId,
                completedBy: socket.userId,
                completedByUser: socket.displayName,
                completionNotes,
                timestamp: new Date()
            };

            // Broadcast para todos os usuários conectados
            socket.broadcast.emit('status:completed', completeData);
            
            // Criar notificação de conclusão
            await this.createCompletionNotification(agendamentoId, socket.displayName);

            console.log(`[STATUS] Agendamento ${agendamentoId} marcado como concluído por ${socket.displayName}`);
            this.stats.messagesReceived++;
            this.stats.messagesSent++;
            this.stats.updatesBroadcasted++;
        } catch (error) {
            console.error('[ERROR] Erro ao marcar como concluído:', error);
        }
    }

    /**
     * Manipular cancelamento de agendamento
     */
    async handleStatusCancel(socket, data) {
        try {
            const { agendamentoId, cancelReason } = data;
            
            // Marcar como cancelado no banco
            await this.db.cancelAppointment(agendamentoId, socket.userId, cancelReason);
            
            const cancelData = {
                type: 'status_cancel',
                agendamentoId,
                cancelledBy: socket.userId,
                cancelledByUser: socket.displayName,
                cancelReason,
                timestamp: new Date()
            };

            // Broadcast para todos os usuários conectados
            socket.broadcast.emit('status:cancelled', cancelData);
            
            // Criar notificação de cancelamento
            await this.createCancellationNotification(agendamentoId, socket.displayName, cancelReason);

            console.log(`[STATUS] Agendamento ${agendamentoId} cancelado por ${socket.displayName}`);
            this.stats.messagesReceived++;
            this.stats.messagesSent++;
            this.stats.updatesBroadcasted++;
        } catch (error) {
            console.error('[ERROR] Erro ao cancelar agendamento:', error);
        }
    }

    /**
     * Criar notificação de conclusão
     */
    async createCompletionNotification(agendamentoId, completedByUser) {
        try {
            const notification = {
                id: `notif_${Date.now()}_${Math.random()}`,
                title: 'Agendamento Concluído',
                message: `Agendamento ${agendamentoId} foi marcado como concluído por ${completedByUser}`,
                type: 'completion',
                agendamentoId,
                createdAt: new Date()
            };

            // Buscar todos os usuários conectados e enviar notificação
            for (const [socketId, userData] of this.connectedUsers.entries()) {
                const targetSocket = this.io.sockets.sockets.get(socketId);
                if (targetSocket) {
                    targetSocket.emit('notification:received', {
                        notification,
                        fromUser: { displayName: completedByUser },
                        timestamp: new Date()
                    });
                }
            }
        } catch (error) {
            console.error('[ERROR] Erro ao criar notificação de conclusão:', error);
        }
    }

    /**
     * Criar notificação de cancelamento
     */
    async createCancellationNotification(agendamentoId, cancelledByUser, cancelReason) {
        try {
            const notification = {
                id: `notif_${Date.now()}_${Math.random()}`,
                title: 'Agendamento Cancelado',
                message: `Agendamento ${agendamentoId} foi cancelado por ${cancelledByUser}. Motivo: ${cancelReason}`,
                type: 'cancellation',
                agendamentoId,
                cancelReason,
                createdAt: new Date()
            };

            // Buscar todos os usuários conectados e enviar notificação
            for (const [socketId, userData] of this.connectedUsers.entries()) {
                const targetSocket = this.io.sockets.sockets.get(socketId);
                if (targetSocket) {
                    targetSocket.emit('notification:received', {
                        notification,
                        fromUser: { displayName: cancelledByUser },
                        timestamp: new Date()
                    });
                }
            }
        } catch (error) {
            console.error('[ERROR] Erro ao criar notificação de cancelamento:', error);
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

            console.log(`[SEARCH] Busca realizada por ${socket.displayName}: "${query}"`);
            this.stats.messagesReceived++;
            this.stats.messagesSent++;
        } catch (error) {
            console.error('[ERROR] Erro na busca:', error);
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

                console.log(`[DISCONNECT] Usuário desconectado: ${user.displayName} (${reason})`);
            }

            this.stats.connections--;
        } catch (error) {
            console.error('[ERROR] Erro ao processar desconexão:', error);
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
     * Obter estatísticas completas
     */
    getStats() {
        return {
            ...this.stats,
            cacheStats: this.cache.getCacheStats(),
            conflictStats: this.conflictResolver.getConflictStats(),
            databaseConnected: !!this.db,
            cacheInitialized: !!this.cache
        };
    }

    /**
     * Verificar se o servidor está rodando
     */
    isServerRunning() {
        return this.isRunning;
    }

    /**
     * Parar servidor WebSocket
     */
    stop() {
        try {
            // Parar sincronização periódica
            this.stopPeriodicSync();
            
            if (this.io) {
                this.io.close();
            }
            
            if (this.server) {
                this.server.close();
            }

            // Fechar conexão com banco de dados
            if (this.db) {
                this.db.close();
            }

            this.isRunning = false;
            this.connectedUsers.clear();
            
            console.log('[STOP] Servidor WebSocket parado');
        } catch (error) {
            console.error('[ERROR] Erro ao parar servidor WebSocket:', error);
        }
    }
}

module.exports = WebSocketServer;