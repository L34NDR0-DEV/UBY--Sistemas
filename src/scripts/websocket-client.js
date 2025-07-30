/**
 * Cliente WebSocket para comunicação em tempo real
 * Gerencia conexão com servidor, eventos e sincronização
 */

class WebSocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.isAuthenticated = false;
        this.userId = null;
        this.userName = null;
        this.displayName = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.pingInterval = null;
        this.eventHandlers = new Map();
        this.onAuthenticated = null;
    }

    /**
     * Conectar ao servidor WebSocket
     */
    async connect(serverUrl = 'http://localhost:3002') {
        try {
            // Importar Socket.IO client
            if (typeof io === 'undefined') {
                console.error('[ERROR] Socket.IO client não encontrado');
                return false;
            }

            // Configurar conexão
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 5000,
                forceNew: true
            });

            // Configurar eventos básicos
            this.setupBasicEvents();

            // Aguardar conexão
            return new Promise((resolve) => {
                this.socket.on('connect', () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    console.log('[SUCCESS] Conectado ao WebSocket Server');
                    
                    // Iniciar ping/pong
                    this.startPingPong();
                    
                    resolve(true);
                });

                this.socket.on('connect_error', (error) => {
                    console.error('[ERROR] Erro de conexão WebSocket:', error);
                    resolve(false);
                });
            });
        } catch (error) {
            console.error('[ERROR] Erro ao conectar WebSocket:', error);
            return false;
        }
    }

    /**
     * Configurar eventos básicos
     */
    setupBasicEvents() {
        // Evento de desconexão
        this.socket.on('disconnect', (reason) => {
            console.log('[DISCONNECT] Desconectado do WebSocket:', reason);
            this.isConnected = false;
            
            // Tentar reconectar automaticamente se não foi desconexão intencional
            if (reason !== 'io client disconnect') {
                this.scheduleReconnect();
            }
        });

        this.socket.on('reconnect', () => {
            console.log('[RECONNECT] Reconectado ao WebSocket');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Re-autenticar após reconexão
            if (this.currentUser) {
                this.authenticate(this.currentUser.id, this.currentUser.username, this.currentUser.displayName);
            }
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('[ERROR] Erro de reconexão:', error);
        });

        // Evento de pong
        this.socket.on('pong', () => {
            // Conexão ativa confirmada
        });

        // Eventos de agendamento
        this.socket.on('agendamento:update', (data) => {
            this.handleAgendamentoUpdate(data);
        });

        this.socket.on('agendamento:shared', (data) => {
            this.handleAgendamentoShared(data);
        });

        // Eventos de notificação
        this.socket.on('notification:received', (data) => {
            this.handleNotificationReceived(data);
        });

        this.socket.on('notification:read', (data) => {
            this.handleNotificationRead(data);
        });

        // Eventos de usuário
        this.socket.on('user:connected', (data) => {
            this.handleUserConnected(data);
        });

        this.socket.on('user:disconnected', (data) => {
            this.handleUserDisconnected(data);
        });

        // Eventos de sincronização
        this.socket.on('sync:response', (data) => {
            this.handleSyncResponse(data);
        });

        // Eventos de busca
        this.socket.on('search:results', (data) => {
            this.handleSearchResults(data);
        });

        // Evento de autenticação
        this.socket.on('authenticated', (data) => {
            this.handleAuthenticated(data);
        });

        this.socket.on('authentication:error', (data) => {
            console.error('[ERROR] Erro de autenticação:', data.message);
        });
    }

    /**
     * Autenticar usuário
     */
    authenticate(userId, userName, displayName) {
        if (!this.isConnected) {
            console.warn('⚠️ Não conectado ao WebSocket');
            return false;
        }

        this.userId = userId;
        this.userName = userName;
        this.displayName = displayName;

        this.socket.emit('authenticate', {
            userId,
            userName,
            displayName
        });

        return true;
    }

    /**
     * Enviar atualização de agendamento
     */
    sendAgendamentoUpdate(action, agendamento) {
        if (!this.isConnected) return false;

        this.socket.emit(`agendamento:${action}`, {
            agendamento,
            userId: this.userId,
            timestamp: new Date()
        });

        return true;
    }

    /**
     * Compartilhar agendamento
     */
    shareAgendamento(toUserId, agendamento, message = '') {
        if (!this.isConnected) return false;

        this.socket.emit('agendamento:shared', {
            toUserId,
            agendamento,
            fromUser: {
                userId: this.userId,
                userName: this.userName,
                displayName: this.displayName
            },
            message
        });

        return true;
    }

    /**
     * Enviar notificação
     */
    sendNotification(toUserId, notification) {
        if (!this.isConnected) return false;

        this.socket.emit('notification:send', {
            toUserId,
            notification
        });

        return true;
    }

    /**
     * Marcar notificação como lida
     */
    markNotificationAsRead(notificationId) {
        if (!this.isConnected) return false;

        this.socket.emit('notification:read', {
            notificationId,
            userId: this.userId
        });

        return true;
    }

    /**
     * Solicitar sincronização
     */
    requestSync() {
        if (!this.isConnected) return false;

        this.socket.emit('sync:request');
        return true;
    }

    /**
     * Enviar consulta de busca
     */
    sendSearchQuery(query, filters = {}) {
        if (!this.isConnected) return false;

        this.socket.emit('search:query', {
            query,
            filters
        });

        return true;
    }

    /**
     * Registrar manipulador de evento
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Remover manipulador de evento
     */
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Emitir evento para manipuladores registrados
     */
    emit(event, data) {
        if (!this.isConnected) {
            console.warn('[WARNING] Não conectado ao WebSocket');
            return false;
        }

        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[ERROR] Erro no manipulador de evento ${event}:`, error);
                }
            });
        }
    }

    /**
     * Manipular atualização de agendamento
     */
    handleAgendamentoUpdate(data) {
        console.log(`[APPOINTMENT] Agendamento ${data.action}:`, data.agendamento?.id);
        
        // Emitir evento personalizado para o sistema principal
        if (window.updateAgendamentoFromWebSocket) {
            window.updateAgendamentoFromWebSocket(data);
        }
    }

    /**
     * Manipular agendamento compartilhado
     */
    handleAgendamentoShared(data) {
        console.log(`[SHARE] Agendamento compartilhado de ${data.fromUser.displayName}`);
        
        // Adicionar agendamento compartilhado ao sistema
        if (window.addSharedAgendamento) {
            window.addSharedAgendamento(data.agendamento, data.fromUser);
        }
        
        // Mostrar notificação
        if (window.showToast) {
            window.showToast(
                `Agendamento compartilhado por ${data.fromUser.displayName}`,
                'info'
            );
        }
    }

    /**
     * Manipular notificação recebida
     */
    handleNotification(data) {
        console.log('[NOTIFICATION] Notificação recebida:', data);
        
        // Processar notificação
        if (window.processNotification) {
            window.processNotification(data);
        }
    }

    /**
     * Manipular usuário conectado
     */
    handleUserConnected(data) {
        console.log(`[USER] Usuário conectado: ${data.displayName}`);
        
        // Atualizar lista de usuários online
        if (window.updateOnlineUsers) {
            window.updateOnlineUsers(data, 'connected');
        }
    }

    /**
     * Manipular usuário desconectado
     */
    handleUserDisconnected(data) {
        console.log(`[USER] Usuário desconectado: ${data.displayName}`);
        
        // Atualizar lista de usuários online
        if (window.updateOnlineUsers) {
            window.updateOnlineUsers(data, 'disconnected');
        }
    }

    /**
     * Manipular sincronização de dados
     */
    handleDataSync(data) {
        console.log('[SYNC] Dados sincronizados');
        
        // Sincronizar dados locais
        if (window.syncLocalData) {
            window.syncLocalData(data);
        }
    }

    /**
     * Manipular resultados de busca
     */
    handleSearchResults(data) {
        console.log(`[SEARCH] Resultados da busca: ${data.results.length} encontrados`);
        
        // Atualizar resultados de busca
        if (window.updateSearchResults) {
            window.updateSearchResults(data);
        }
    }

    /**
     * Manipular autenticação bem-sucedida
     */
    handleAuthSuccess(data) {
        console.log('[AUTH] Autenticado no WebSocket');
        this.isAuthenticated = true;
        
        if (this.onAuthenticated) {
            this.onAuthenticated(data);
        }
    }

    /**
     * Manipular evento de autenticação
     */
    handleAuthenticated(data) {
        console.log('[AUTH] Usuário autenticado:', data);
        this.isAuthenticated = true;
        this.userId = data.userId;
        
        // Emitir evento de autenticação
        this.emit('authenticated', data);
        
        if (this.onAuthenticated) {
            this.onAuthenticated(data);
        }
    }

    /**
     * Iniciar ping/pong para manter conexão ativa
     */
    startPingPong() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        this.pingInterval = setInterval(() => {
            if (this.isConnected && this.socket) {
                this.socket.emit('ping');
            }
        }, 30000); // Ping a cada 30 segundos
    }

    /**
     * Parar ping/pong
     */
    stopPingPong() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * Agendar reconexão
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[ERROR] Máximo de tentativas de reconexão atingido');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        
        console.log(`[RECONNECT] Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    /**
     * Desconectar do WebSocket
     */
    disconnect() {
        if (this.socket) {
            console.log('[DISCONNECT] Desconectado do WebSocket');
            this.stopPingPong();
            this.socket.disconnect();
            this.isConnected = false;
            this.isAuthenticated = false;
        }
    }

    /**
     * Verificar status da conexão
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            userId: this.userId,
            userName: this.userName,
            displayName: this.displayName,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Instância global do cliente WebSocket
window.wsClient = new WebSocketClient();