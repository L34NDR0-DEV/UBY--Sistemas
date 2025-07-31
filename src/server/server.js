/**
 * Servidor Socket.IO mínimo funcional
 * Baseado nas instruções do arquivo de teste
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

// Configurar CSP para Electron
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "connect-src 'self' ws://localhost:3002");
    next();
});

// Rota de teste
app.get('/', (req, res) => {
    res.json({
        message: 'Servidor WebSocket funcionando',
        timestamp: new Date().toISOString(),
        port: 3002
    });
});

// Rota de status
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        connections: io.engine.clientsCount,
        uptime: process.uptime()
    });
});

// Armazenar usuários conectados
const connectedUsers = new Map();

// Configurar eventos Socket.IO
io.on('connection', (socket) => {
    console.log(`[CONNECT] Nova conexão: ${socket.id}`);
    
    // Evento de autenticação
    socket.on('authenticate', (data) => {
        try {
            const { userId, userName, displayName } = data;
            
            // Armazenar dados do usuário
            socket.userId = userId;
            socket.userName = userName;
            socket.displayName = displayName;
            
            // Adicionar à lista de usuários conectados
            connectedUsers.set(socket.id, {
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
                userData: { userId, userName, displayName },
                notifications: [],
                connectedUsers: Array.from(connectedUsers.values())
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
            socket.emit('authentication:error', {
                message: 'Erro interno do servidor'
            });
        }
    });

    // Eventos de agendamento
    socket.on('agendamento:create', (data) => {
        handleAgendamentoUpdate(socket, 'create', data);
    });

    socket.on('agendamento:update', (data) => {
        handleAgendamentoUpdate(socket, 'update', data);
    });

    socket.on('agendamento:delete', (data) => {
        handleAgendamentoUpdate(socket, 'delete', data);
    });

    socket.on('agendamento:shared', (data) => {
        handleAgendamentoShared(socket, data);
    });

    // Eventos de status
    socket.on('status:update', (data) => {
        handleStatusUpdate(socket, data);
    });

    socket.on('status:complete', (data) => {
        handleStatusComplete(socket, data);
    });

    socket.on('status:cancel', (data) => {
        handleStatusCancel(socket, data);
    });

    // Eventos de notificação
    socket.on('notification:send', (data) => {
        handleNotificationSend(socket, data);
    });

    socket.on('notification:read', (data) => {
        handleNotificationRead(socket, data);
    });

    // Eventos de sincronização
    socket.on('sync:request', () => {
        handleSyncRequest(socket);
    });

    socket.on('sync:force', () => {
        handleForceSync(socket);
    });

    // Eventos de busca
    socket.on('search:query', (data) => {
        handleSearchQuery(socket, data);
    });

    // Eventos de ping/pong
    socket.on('ping', () => {
        socket.emit('pong');
    });

    // Evento de desconexão
    socket.on('disconnect', (reason) => {
        handleDisconnection(socket, reason);
    });
});

/**
 * Manipular atualização de agendamento
 */
function handleAgendamentoUpdate(socket, action, data) {
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

        console.log(`[APPOINTMENT] Agendamento ${action} por ${socket.displayName}`);
    } catch (error) {
        console.error('[ERROR] Erro ao processar atualização de agendamento:', error);
    }
}

/**
 * Manipular compartilhamento de agendamento
 */
function handleAgendamentoShared(socket, data) {
    try {
        const { toUserId, agendamento, fromUser, message } = data;

        // Encontrar socket do usuário destinatário
        const targetSocket = findSocketByUserId(toUserId);
        
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

            // Enviar notificação em tempo real
            targetSocket.emit('notification:received', {
                notification: {
                    id: `notif_${Date.now()}_${Math.random()}`,
                    title: 'Agendamento Compartilhado',
                    message: `${socket.displayName} compartilhou um agendamento com você`,
                    type: 'share'
                },
                fromUser: {
                    userId: socket.userId,
                    userName: socket.userName,
                    displayName: socket.displayName
                },
                timestamp: new Date()
            });

            console.log(`[SHARE] Agendamento compartilhado de ${socket.displayName} para usuário ${toUserId}`);
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
function handleNotificationSend(socket, data) {
    try {
        const { toUserId, notification } = data;

        // Encontrar socket do usuário destinatário
        const targetSocket = findSocketByUserId(toUserId);
        
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
function handleNotificationRead(socket, data) {
    try {
        const { notificationId } = data;

        // Broadcast para outros clientes do mesmo usuário
        socket.broadcast.emit('notification:read', {
            notificationId,
            userId: socket.userId
        });

        console.log(`[READ] Notificação marcada como lida por ${socket.displayName}`);
    } catch (error) {
        console.error('[ERROR] Erro ao marcar notificação como lida:', error);
    }
}

/**
 * Manipular solicitação de sincronização
 */
function handleSyncRequest(socket) {
    try {
        const syncData = {
            timestamp: new Date(),
            appointments: [],
            notifications: [],
            syncLog: [],
            cachedData: null,
            connectedUsers: Array.from(connectedUsers.values()),
            serverStats: {
                connections: io.engine.clientsCount,
                uptime: process.uptime()
            }
        };

        socket.emit('sync:response', syncData);

        console.log(`[SYNC] Sincronização solicitada por ${socket.displayName}`);
    } catch (error) {
        console.error('[ERROR] Erro na sincronização:', error);
    }
}

/**
 * Manipular sincronização forçada
 */
function handleForceSync(socket) {
    try {
        console.log(`[SYNC] Sincronização forçada solicitada por ${socket.displayName}`);
        
        const syncData = {
            type: 'force_sync',
            timestamp: new Date(),
            updates: [],
            stats: {
                connections: io.engine.clientsCount,
                uptime: process.uptime()
            }
        };

        socket.emit('sync:response', syncData);
        
        console.log(`[SYNC] Sincronização forçada enviada`);
    } catch (error) {
        console.error('[ERROR] Erro na sincronização forçada:', error);
    }
}

/**
 * Manipular atualização de status
 */
function handleStatusUpdate(socket, data) {
    try {
        const { agendamentoId, newStatus, reason } = data;
        
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
            const targetSocket = findSocketByUserId(data.sharedWith);
            if (targetSocket) {
                targetSocket.emit('status:updated', updateData);
            }
        }

        console.log(`[STATUS] Status atualizado para ${newStatus} por ${socket.displayName}`);
    } catch (error) {
        console.error('[ERROR] Erro ao atualizar status:', error);
    }
}

/**
 * Manipular conclusão de agendamento
 */
function handleStatusComplete(socket, data) {
    try {
        const { agendamentoId, completionNotes } = data;
        
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
        createCompletionNotification(agendamentoId, socket.displayName);

        console.log(`[STATUS] Agendamento ${agendamentoId} marcado como concluído por ${socket.displayName}`);
    } catch (error) {
        console.error('[ERROR] Erro ao marcar como concluído:', error);
    }
}

/**
 * Manipular cancelamento de agendamento
 */
function handleStatusCancel(socket, data) {
    try {
        const { agendamentoId, cancelReason } = data;
        
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
        createCancellationNotification(agendamentoId, socket.displayName, cancelReason);

        console.log(`[STATUS] Agendamento ${agendamentoId} cancelado por ${socket.displayName}`);
    } catch (error) {
        console.error('[ERROR] Erro ao cancelar agendamento:', error);
    }
}

/**
 * Criar notificação de conclusão
 */
function createCompletionNotification(agendamentoId, completedByUser) {
    try {
        const notification = {
            id: `notif_${Date.now()}_${Math.random()}`,
            title: 'Agendamento Concluído',
            message: `Agendamento ${agendamentoId} foi marcado como concluído por ${completedByUser}`,
            type: 'completion',
            agendamentoId,
            createdAt: new Date()
        };

        // Enviar notificação para todos os usuários conectados
        io.emit('notification:received', {
            notification,
            fromUser: { displayName: completedByUser },
            timestamp: new Date()
        });
    } catch (error) {
        console.error('[ERROR] Erro ao criar notificação de conclusão:', error);
    }
}

/**
 * Criar notificação de cancelamento
 */
function createCancellationNotification(agendamentoId, cancelledByUser, cancelReason) {
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

        // Enviar notificação para todos os usuários conectados
        io.emit('notification:received', {
            notification,
            fromUser: { displayName: cancelledByUser },
            timestamp: new Date()
        });
    } catch (error) {
        console.error('[ERROR] Erro ao criar notificação de cancelamento:', error);
    }
}

/**
 * Manipular consulta de busca
 */
function handleSearchQuery(socket, data) {
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
    } catch (error) {
        console.error('[ERROR] Erro na busca:', error);
    }
}

/**
 * Manipular desconexão
 */
function handleDisconnection(socket, reason) {
    try {
        const user = connectedUsers.get(socket.id);
        
        if (user) {
            // Remover da lista de usuários conectados
            connectedUsers.delete(socket.id);

            // Notificar outros usuários sobre desconexão
            socket.broadcast.emit('user:disconnected', {
                userId: user.userId,
                userName: user.userName,
                displayName: user.displayName
            });

            console.log(`[DISCONNECT] Usuário desconectado: ${user.displayName} (${reason})`);
        }
    } catch (error) {
        console.error('[ERROR] Erro ao processar desconexão:', error);
    }
}

/**
 * Encontrar socket por ID do usuário
 */
function findSocketByUserId(userId) {
    for (const [socketId, userData] of connectedUsers.entries()) {
        if (userData.userId === userId) {
            return io.sockets.sockets.get(socketId);
        }
    }
    return null;
}

// Iniciar servidor na porta 3002
const PORT = 3002;

server.listen(PORT, () => {
    console.log(`[SUCCESS] Servidor WebSocket iniciado na porta ${PORT}`);
    console.log(`[INFO] URL: http://127.0.0.1:${PORT}`);
    console.log(`[INFO] Status: http://127.0.0.1:${PORT}/status`);
    console.log('[INFO] Servidor está rodando. Pressione Ctrl+C para parar.');
});

// Tratar encerramento gracioso
process.on('SIGINT', () => {
    console.log('\n[INFO] Parando servidor WebSocket...');
    server.close(() => {
        console.log('[INFO] Servidor parado.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n[INFO] Parando servidor WebSocket...');
    server.close(() => {
        console.log('[INFO] Servidor parado.');
        process.exit(0);
    });
}); 