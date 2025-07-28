/**
 * Sistema de Notificações Profissional
 * Gerencia notificações para agendamentos esquecidos, atrasados e próximos
 */

class NotificationSystem {
    constructor() {
        this.notifications = new Map();
        this.container = null;
        this.settings = {
            maxNotifications: 5,
            defaultDuration: 8000,
            urgentDuration: 15000,
            position: 'top-right'
        };
        
        this.init();
    }

    /**
     * Inicializar sistema de notificações
     */
    init() {
        this.createContainer();
        this.loadSettings();
        this.startPeriodicCheck();
    }

    /**
     * Criar container para notificações
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.id = 'notification-container';
        document.body.appendChild(this.container);
    }

    /**
     * Carregar configurações do localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    /**
     * Salvar configurações no localStorage
     */
    saveSettings() {
        localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    }

    /**
     * Criar notificação
     */
    createNotification(options) {
        const {
            id = this.generateId(),
            type = 'info',
            title,
            message,
            duration = this.settings.defaultDuration,
            actions = [],
            data = {},
            persistent = false
        } = options;

        // Verificar se já existe
        if (this.notifications.has(id)) {
            this.updateNotification(id, options);
            return id;
        }

        // Limitar número de notificações
        if (this.notifications.size >= this.settings.maxNotifications) {
            this.removeOldest();
        }

        const notification = {
            id,
            type,
            title,
            message,
            duration,
            actions,
            data,
            persistent,
            createdAt: new Date(),
            element: null
        };

        // Criar elemento DOM
        notification.element = this.createNotificationElement(notification);
        
        // Adicionar ao container
        this.container.appendChild(notification.element);
        
        // Armazenar
        this.notifications.set(id, notification);

        // Mostrar com animação
        setTimeout(() => {
            notification.element.classList.add('show');
        }, 100);

        // Auto-remover se não for persistente
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.removeNotification(id);
            }, duration);
        }

        return id;
    }

    /**
     * Criar elemento DOM da notificação
     */
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification-card ${notification.type}`;
        element.dataset.id = notification.id;

        const icon = this.getIcon(notification.type);
        
        // Criar botões de ação
        let actionsHtml = '';
        if (notification.actions && notification.actions.length > 0) {
            console.log(`[DEBUG] Criando botões para notificação ${notification.id}:`, notification.actions);
            
            const buttonsHtml = notification.actions.map((action, index) => {
                // Garantir que action.id existe
                const actionId = action.id || `action_${index}`;
                const buttonHtml = `<button class="notification-btn ${action.style || 'secondary'}" type="button" data-notification-id="${notification.id}" data-action-id="${actionId}">${action.icon || ''}${action.label}</button>`;
                console.log(`[DEBUG] Botão ${index} - actionId: ${actionId}, HTML:`, buttonHtml);
                return buttonHtml;
            }).join('');
            
            actionsHtml = `<div class="notification-actions">${buttonsHtml}</div>`;
            console.log(`[DEBUG] HTML completo dos botões:`, actionsHtml);
        }

        element.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">
                    <div class="notification-icon ${notification.type}">
                        ${icon}
                    </div>
                    ${notification.title}
                </div>
                <button class="notification-close" type="button" data-notification-id="${notification.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <div class="notification-content">${notification.message}</div>
            ${this.createDetailsHtml(notification.data)}
            ${actionsHtml}
            ${!notification.persistent && notification.duration > 0 ? 
                `<div class="notification-progress" style="animation: shrink ${notification.duration}ms linear"></div>` : ''}
        `;

        // Adicionar event listeners aos botões
        this.attachEventListeners(element, notification);

        return element;
    }

    /**
     * Anexar event listeners aos botões
     */
    attachEventListeners(element, notification) {
        console.log(`[DEBUG] Anexando listeners para notificação:`, notification.id);
        console.log(`[DEBUG] Ações da notificação:`, notification.actions);
        
        // Event listener para botões de ação
        const actionButtons = element.querySelectorAll('.notification-btn[data-action-id]');
        console.log(`[DEBUG] Botões encontrados:`, actionButtons.length);
        
        actionButtons.forEach((button, index) => {
            const notificationId = button.dataset.notificationId;
            const actionId = button.dataset.actionId;
            
            console.log(`[DEBUG] Botão ${index}:`, {
                notificationId,
                actionId,
                innerHTML: button.innerHTML,
                attributes: Array.from(button.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
            });
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`[DEBUG] Botão clicado: ${actionId} para notificação: ${notificationId}`);
                this.handleAction(notificationId, actionId);
            });
        });

        // Event listener para botão de fechar
        const closeButton = element.querySelector('.notification-close');
        console.log(`[DEBUG] Botão de fechar encontrado:`, !!closeButton);
        
        if (closeButton) {
            const notificationId = closeButton.dataset.notificationId;
            console.log(`[DEBUG] ID da notificação no botão de fechar:`, notificationId);
            
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`[DEBUG] Botão de fechar clicado para notificação: ${notificationId}`);
                console.log(`[DEBUG] Elemento da notificação:`, element);
                console.log(`[DEBUG] Notificação existe no Map:`, this.notifications.has(notificationId));
                
                this.removeNotification(notificationId);
            });
        } else {
            console.error(`[ERROR] Botão de fechar não encontrado para notificação: ${notification.id}`);
        }
    }

    /**
     * Criar HTML dos detalhes
     */
    createDetailsHtml(data) {
        if (!data || Object.keys(data).length === 0) return '';

        const details = Object.entries(data).map(([key, value]) => {
            const label = this.formatLabel(key);
            const formattedValue = this.formatValue(key, value);
            return `
                <div class="notification-label">${label}:</div>
                <div>${formattedValue}</div>
            `;
        }).join('');

        return `<div class="notification-details">${details}</div>`;
    }

    /**
     * Formatar rótulo
     */
    formatLabel(key) {
        const labels = {
            cliente: 'Cliente',
            data: 'Data',
            hora: 'Hora',
            telefone: 'Telefone',
            servico: 'Serviço',
            status: 'Status',
            delay: 'Atraso',
            timeUntil: 'Tempo restante'
        };
        return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }

    /**
     * Formatar valor
     */
    formatValue(key, value) {
        if (key === 'data') {
            return new Date(value).toLocaleDateString('pt-BR');
        }
        if (key === 'delay' || key === 'timeUntil') {
            return this.formatDuration(value);
        }
        return value;
    }

    /**
     * Formatar duração
     */
    formatDuration(minutes) {
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }

    /**
     * Obter ícone por tipo
     */
    getIcon(type) {
        const icons = {
            reminder: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.54 21H20.46A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            urgent: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            late: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12A10 10 0 1 1 5.93 7.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`
        };
        return icons[type] || icons.info;
    }

    /**
     * Atualizar notificação existente
     */
    updateNotification(id, options) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        // Atualizar dados
        Object.assign(notification, options);
        
        // Recriar elemento
        const newElement = this.createNotificationElement(notification);
        notification.element.replaceWith(newElement);
        notification.element = newElement;

        // Mostrar com animação
        setTimeout(() => {
            newElement.classList.add('show');
        }, 100);
    }

    /**
     * Remover notificação
     */
    removeNotification(id) {
        console.log(`[DEBUG] removeNotification chamado para ID: ${id}`);
        
        const notification = this.notifications.get(id);
        if (!notification) {
            console.error(`[ERROR] Notificação não encontrada no Map: ${id}`);
            console.log(`[DEBUG] Notificações disponíveis:`, Array.from(this.notifications.keys()));
            return;
        }

        console.log(`[DEBUG] Notificação encontrada:`, notification);
        console.log(`[DEBUG] Elemento da notificação:`, notification.element);
        console.log(`[DEBUG] Elemento tem parentNode:`, !!notification.element.parentNode);

        // Verificar se o elemento ainda existe no DOM
        if (!notification.element || !notification.element.parentNode) {
            console.warn(`[WARN] Elemento da notificação não existe no DOM, removendo do Map: ${id}`);
            this.notifications.delete(id);
            return;
        }

        // Animar saída
        console.log(`[DEBUG] Adicionando classe 'hide' ao elemento`);
        notification.element.classList.add('hide');
        
        setTimeout(() => {
            console.log(`[DEBUG] Timeout executado, removendo elemento do DOM`);
            
            if (notification.element && notification.element.parentNode) {
                console.log(`[DEBUG] Removendo elemento do parentNode`);
                notification.element.parentNode.removeChild(notification.element);
            } else {
                console.warn(`[WARN] Elemento ou parentNode não existe mais durante remoção`);
            }
            
            console.log(`[DEBUG] Removendo notificação do Map: ${id}`);
            this.notifications.delete(id);
            
            console.log(`[DEBUG] Notificação removida com sucesso. Total restante: ${this.notifications.size}`);
        }, 300);
    }

    /**
     * Remover notificação mais antiga
     */
    removeOldest() {
        const oldest = Array.from(this.notifications.values())
            .filter(n => !n.persistent)
            .sort((a, b) => a.createdAt - b.createdAt)[0];
        
        if (oldest) {
            this.removeNotification(oldest.id);
        }
    }

    /**
     * Manipular ação da notificação
     */
    handleAction(notificationId, actionId) {
        console.log(`[DEBUG] handleAction chamado: notificationId=${notificationId}, actionId=${actionId}`);
        
        const notification = this.notifications.get(notificationId);
        if (!notification) {
            console.error(`[ERROR] Notificação não encontrada: ${notificationId}`);
            return;
        }

        const action = notification.actions.find(a => a.id === actionId);
        if (!action) {
            console.error(`[ERROR] Ação não encontrada: ${actionId} na notificação ${notificationId}`);
            return;
        }

        console.log(`[DEBUG] Executando ação: ${action.label}`);

        // Executar callback se existir
        if (action.callback) {
            try {
                action.callback(notification.data);
                console.log(`[DEBUG] Callback executado com sucesso para ação: ${actionId}`);
            } catch (error) {
                console.error(`[ERROR] Erro ao executar callback da ação ${actionId}:`, error);
            }
        } else {
            console.warn(`[WARN] Nenhum callback definido para ação: ${actionId}`);
        }

        // Remover notificação se especificado
        if (action.dismissOnClick !== false) {
            console.log(`[DEBUG] Removendo notificação após ação: ${notificationId}`);
            this.removeNotification(notificationId);
        }
    }

    /**
     * Gerar ID único
     */
    generateId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Verificação periódica de agendamentos
     */
    startPeriodicCheck() {
        // Verificar a cada minuto
        setInterval(() => {
            this.checkAppointments();
        }, 60000);

        // Verificação inicial
        setTimeout(() => {
            this.checkAppointments();
        }, 5000);
    }

    /**
     * Verificar agendamentos e criar notificações
     */
    checkAppointments() {
        if (!window.agendamentos) return;

        const now = new Date();
        const appointments = window.agendamentos.filter(a => a.status === 'agendado');

        appointments.forEach(appointment => {
            const appointmentTime = new Date(`${appointment.data}T${appointment.hora}`);
            const timeDiff = appointmentTime - now;
            const minutesDiff = Math.floor(timeDiff / (1000 * 60));

            // Agendamentos próximos (1 hora, 30 min, 15 min, 5 min)
            if (minutesDiff === 60) {
                this.createReminderNotification(appointment, '1 hora');
            } else if (minutesDiff === 30) {
                this.createReminderNotification(appointment, '30 minutos');
            } else if (minutesDiff === 15) {
                this.createReminderNotification(appointment, '15 minutos');
            } else if (minutesDiff === 5) {
                this.createReminderNotification(appointment, '5 minutos');
            }

            // Agendamentos atrasados
            if (minutesDiff < 0) {
                const delayMinutes = Math.abs(minutesDiff);
                if (delayMinutes <= 60 && delayMinutes % 5 === 0) { // A cada 5 minutos na primeira hora
                    this.createLateNotification(appointment, delayMinutes);
                }
            }

            // Agendamentos esquecidos (mais de 2 horas de atraso)
            if (minutesDiff < -120) {
                this.createForgottenNotification(appointment, Math.abs(minutesDiff));
            }
        });
    }

    /**
     * Criar notificação de lembrete
     */
    createReminderNotification(appointment, timeText) {
        const id = `reminder_${appointment.id}_${timeText.replace(' ', '_')}`;
        
        this.createNotification({
            id,
            type: 'reminder',
            title: `Lembrete - ${timeText}`,
            message: `Agendamento com ${appointment.cliente} em ${timeText}`,
            data: {
                cliente: appointment.cliente,
                data: appointment.data,
                hora: appointment.hora,
                telefone: appointment.telefone,
                servico: appointment.servico
            },
            actions: [
                {
                    id: 'view',
                    label: 'Ver Detalhes',
                    style: 'primary',
                    callback: (data) => {
                        // Abrir detalhes do agendamento
                        if (window.openAgendamentoDetails) {
                            window.openAgendamentoDetails(appointment.id);
                        }
                    }
                },
                {
                    id: 'call',
                    label: 'Ligar',
                    style: 'secondary',
                    callback: (data) => {
                        if (data.telefone) {
                            window.open(`tel:${data.telefone}`);
                        }
                    }
                }
            ],
            duration: this.settings.defaultDuration
        });
    }

    /**
     * Criar notificação de atraso
     */
    createLateNotification(appointment, delayMinutes) {
        const id = `late_${appointment.id}`;
        
        this.createNotification({
            id,
            type: 'late',
            title: 'Agendamento Atrasado',
            message: `${appointment.cliente} está ${this.formatDuration(delayMinutes)} atrasado`,
            data: {
                cliente: appointment.cliente,
                data: appointment.data,
                hora: appointment.hora,
                telefone: appointment.telefone,
                delay: delayMinutes
            },
            actions: [
                {
                    id: 'call',
                    label: 'Ligar Cliente',
                    style: 'primary',
                    callback: (data) => {
                        if (data.telefone) {
                            window.open(`tel:${data.telefone}`);
                        }
                    }
                },
                {
                    id: 'reschedule',
                    label: 'Reagendar',
                    style: 'secondary',
                    callback: (data) => {
                        // Abrir modal de reagendamento
                        if (window.openRescheduleModal) {
                            window.openRescheduleModal(appointment.id);
                        }
                    }
                },
                {
                    id: 'cancel',
                    label: 'Cancelar',
                    style: 'secondary',
                    callback: (data) => {
                        // Cancelar agendamento
                        if (window.cancelAppointment) {
                            window.cancelAppointment(appointment.id);
                        }
                    }
                }
            ],
            duration: this.settings.urgentDuration,
            persistent: delayMinutes > 30
        });
    }

    /**
     * Criar notificação de esquecimento
     */
    createForgottenNotification(appointment, delayMinutes) {
        const id = `forgotten_${appointment.id}`;
        
        this.createNotification({
            id,
            type: 'urgent',
            title: 'Agendamento Esquecido',
            message: `Agendamento com ${appointment.cliente} há ${this.formatDuration(delayMinutes)}`,
            data: {
                cliente: appointment.cliente,
                data: appointment.data,
                hora: appointment.hora,
                telefone: appointment.telefone,
                delay: delayMinutes
            },
            actions: [
                {
                    id: 'resolve',
                    label: 'Marcar como Resolvido',
                    style: 'primary',
                    callback: (data) => {
                        // Marcar como concluído ou cancelado
                        if (window.resolveAppointment) {
                            window.resolveAppointment(appointment.id);
                        }
                    }
                },
                {
                    id: 'call',
                    label: 'Ligar Cliente',
                    style: 'secondary',
                    callback: (data) => {
                        if (data.telefone) {
                            window.open(`tel:${data.telefone}`);
                        }
                    }
                }
            ],
            persistent: true
        });
    }

    /**
     * Limpar todas as notificações
     */
    clearAll() {
        this.notifications.forEach((notification, id) => {
            this.removeNotification(id);
        });
    }

    /**
     * Obter estatísticas
     */
    getStats() {
        const types = {};
        this.notifications.forEach(notification => {
            types[notification.type] = (types[notification.type] || 0) + 1;
        });
        
        return {
            total: this.notifications.size,
            types,
            persistent: Array.from(this.notifications.values()).filter(n => n.persistent).length
        };
    }

    /**
     * Mostrar painel de notificações ativas
     */
    showNotificationsPanel() {
        const stats = this.getStats();
        
        if (stats.total === 0) {
            this.createNotification({
                type: 'info',
                title: 'Notificações',
                message: 'Nenhuma notificação ativa no momento.',
                duration: 3000
            });
            return;
        }

        // Criar resumo das notificações ativas
        let message = `${stats.total} notificação(ões) ativa(s):\n`;
        Object.entries(stats.types).forEach(([type, count]) => {
            const typeNames = {
                'info': 'Informação',
                'reminder': 'Lembrete',
                'urgent': 'Urgente',
                'success': 'Sucesso',
                'warning': 'Aviso',
                'error': 'Erro'
            };
            message += `• ${typeNames[type] || type}: ${count}\n`;
        });

        this.createNotification({
            type: 'info',
            title: 'Painel de Notificações',
            message: message,
            duration: 5000,
            actions: [
                {
                    id: 'clear_all',
                    label: 'Limpar Todas',
                    style: 'secondary',
                    callback: () => {
                        this.clearAll();
                        if (window.showToast) {
                            window.showToast('Todas as notificações foram removidas', 'success');
                        }
                    }
                }
            ]
        });
    }
}

// Adicionar CSS de animação para a barra de progresso
const style = document.createElement('style');
style.textContent = `
    @keyframes shrink {
        from { width: 100%; }
        to { width: 0%; }
    }
`;
document.head.appendChild(style);

// Inicializar sistema global
window.notificationSystem = new NotificationSystem();

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}