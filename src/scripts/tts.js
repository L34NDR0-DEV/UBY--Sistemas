// Sistema TTS (Text-to-Speech) para notificações auditivas

class TTSManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.voice = null;
        this.enabled = localStorage.getItem('ttsEnabled') !== 'false';
        this.volume = parseFloat(localStorage.getItem('ttsVolume') || '70') / 100;
        
        this.initializeVoices();
        this.setupEventListeners();
    }
    
    initializeVoices() {
        // Aguardar carregamento das vozes
        if (this.synthesis.getVoices().length === 0) {
            this.synthesis.addEventListener('voiceschanged', () => {
                this.selectBestVoice();
            });
        } else {
            this.selectBestVoice();
        }
    }
    
    selectBestVoice() {
        const voices = this.synthesis.getVoices();
        
        // Priorizar vozes em português brasileiro
        const ptBRVoices = voices.filter(voice => 
            voice.lang.includes('pt-BR') || voice.lang.includes('pt_BR')
        );
        
        // Se não encontrar pt-BR, usar português geral
        const ptVoices = voices.filter(voice => 
            voice.lang.includes('pt') && !voice.lang.includes('pt-BR')
        );
        
        // Fallback para vozes em inglês
        const enVoices = voices.filter(voice => 
            voice.lang.includes('en')
        );
        
        if (ptBRVoices.length > 0) {
            this.voice = ptBRVoices[0];
        } else if (ptVoices.length > 0) {
            this.voice = ptVoices[0];
        } else if (enVoices.length > 0) {
            this.voice = enVoices[0];
        } else {
            this.voice = voices[0] || null;
        }
        
        console.log('Voz selecionada:', this.voice?.name, this.voice?.lang);
    }
    
    setupEventListeners() {
        // Atualizar configurações quando mudarem
        document.addEventListener('DOMContentLoaded', () => {
            const ttsToggle = document.getElementById('ttsEnabled');
            const volumeSlider = document.getElementById('volumeSlider');
            
            if (ttsToggle) {
                ttsToggle.checked = this.enabled;
                ttsToggle.addEventListener('change', (e) => {
                    this.enabled = e.target.checked;
                    localStorage.setItem('ttsEnabled', this.enabled);
                });
            }
            
            if (volumeSlider) {
                volumeSlider.value = this.volume * 100;
                volumeSlider.addEventListener('input', (e) => {
                    this.volume = parseFloat(e.target.value) / 100;
                    localStorage.setItem('ttsVolume', e.target.value);
                    document.getElementById('volumeValue').textContent = e.target.value + '%';
                });
            }
        });
    }
    
    speak(text, options = {}) {
        if (!this.enabled || !this.synthesis) {
            console.log('TTS desabilitado ou não suportado');
            return;
        }
        
        // Cancelar qualquer fala em andamento
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configurações da fala
        utterance.voice = this.voice;
        utterance.volume = options.volume || this.volume;
        utterance.rate = options.rate || 0.9; // Velocidade um pouco mais lenta para melhor compreensão
        utterance.pitch = options.pitch || 1;
        utterance.lang = this.voice?.lang || 'pt-BR';
        
        // Eventos
        utterance.onstart = () => {
            console.log('TTS iniciado:', text);
        };
        
        utterance.onend = () => {
            console.log('TTS finalizado');
        };
        
        utterance.onerror = (event) => {
            console.error('Erro no TTS:', event.error);
        };
        
        // Falar
        this.synthesis.speak(utterance);
    }
    
    stop() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }
    
    // Métodos específicos para diferentes tipos de notificação
    speakAgendamentoCriado(nomeCliente, horario, cidade) {
        const text = `Novo agendamento criado para ${nomeCliente} às ${horario} em ${cidade}`;
        this.speak(text);
    }
    
    speakAgendamentoConcluido(nomeCliente) {
        const text = `Agendamento de ${nomeCliente} foi concluído com sucesso`;
        this.speak(text);
    }
    
    speakAgendamentoCancelado(nomeCliente) {
        const text = `Agendamento de ${nomeCliente} foi cancelado`;
        this.speak(text);
    }
    
    speakAgendamentoAtrasado(nomeCliente, minutosAtraso) {
        const text = `Atenção! Agendamento de ${nomeCliente} está atrasado em ${minutosAtraso} minutos`;
        this.speak(text, { volume: Math.min(this.volume + 0.2, 1) }); // Volume um pouco mais alto para alertas
    }
    
    speakAgendamentoProximo(nomeCliente, minutosRestantes) {
        const text = `Lembrete: agendamento de ${nomeCliente} em ${minutosRestantes} minutos`;
        this.speak(text);
    }
    
    speakTest() {
        const text = 'Teste de notificação por voz do sistema UBY Agendamentos. O sistema está funcionando corretamente.';
        this.speak(text);
    }
    
    // Método para falar horários de forma mais natural
    formatTimeForSpeech(time) {
        const [hours, minutes] = time.split(':');
        const hoursInt = parseInt(hours);
        const minutesInt = parseInt(minutes);
        
        let timeText = '';
        
        if (hoursInt === 0) {
            timeText = 'meia-noite';
        } else if (hoursInt === 12) {
            timeText = 'meio-dia';
        } else if (hoursInt < 12) {
            timeText = `${hoursInt} ${hoursInt === 1 ? 'hora' : 'horas'}`;
        } else {
            const pmHours = hoursInt - 12;
            timeText = `${pmHours} ${pmHours === 1 ? 'hora' : 'horas'} da tarde`;
        }
        
        if (minutesInt > 0) {
            timeText += ` e ${minutesInt} ${minutesInt === 1 ? 'minuto' : 'minutos'}`;
        }
        
        return timeText;
    }
    
    // Método para falar datas de forma mais natural
    formatDateForSpeech(date) {
        const dateObj = new Date(date + 'T00:00:00');
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateString = dateObj.toDateString();
        const todayString = today.toDateString();
        const tomorrowString = tomorrow.toDateString();
        
        if (dateString === todayString) {
            return 'hoje';
        } else if (dateString === tomorrowString) {
            return 'amanhã';
        } else {
            return dateObj.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        }
    }
}

// Instância global do TTS
const ttsManager = new TTSManager();

// Função global para compatibilidade
function speakText(text, options = {}) {
    ttsManager.speak(text, options);
}

// Exportar para uso em outros scripts
window.ttsManager = ttsManager;
window.speakText = speakText;

// Notificações específicas do sistema
window.TTSNotifications = {
    agendamentoCriado: (nomeCliente, horario, cidade) => {
        console.log('[DEBUG] TTSNotifications.agendamentoCriado chamado:', { nomeCliente, horario, cidade });
        
        if (!window.notificationSystem) {
            console.error('[ERROR] Sistema de notificações não encontrado!');
        }
        
        ttsManager.speakAgendamentoCriado(nomeCliente, horario, cidade);
        
        if (window.notificationSystem) {
            window.notificationSystem.createNotification({
                type: 'success',
                title: 'Agendamento Criado',
                message: `Novo agendamento para ${nomeCliente} às ${horario} em ${cidade}`,
                data: { nomeCliente, horario, cidade },
                actions: [
                    {
                        id: 'view',
                        label: 'Visualizar',
                        style: 'primary',
                        callback: (data) => {
                            console.log('[DEBUG] Ação visualizar clicada:', data);
                        }
                    }
                ]
            });
        }
        
        console.log('[DEBUG] Notificação de agendamento criado enviada');
    },
    
    agendamentoConcluido: (nomeCliente) => {
        console.log('[DEBUG] TTSNotifications.agendamentoConcluido chamado:', nomeCliente);
        ttsManager.speakAgendamentoConcluido(nomeCliente);
    },
    
    agendamentoCancelado: (nomeCliente) => {
        console.log('[DEBUG] TTSNotifications.agendamentoCancelado chamado:', nomeCliente);
        ttsManager.speakAgendamentoCancelado(nomeCliente);
    },
    
    agendamentoAtrasado: (nomeCliente, minutosAtraso) => {
        console.log('[DEBUG] TTSNotifications.agendamentoAtrasado chamado:', { nomeCliente, minutosAtraso });
        ttsManager.speakAgendamentoAtrasado(nomeCliente, minutosAtraso);
    },
    
    agendamentoProximo: (nomeCliente, minutosRestantes) => {
        console.log('[DEBUG] TTSNotifications.agendamentoProximo chamado:', { nomeCliente, minutosRestantes });
        ttsManager.speakAgendamentoProximo(nomeCliente, minutosRestantes);
    },
    
    teste: () => {
        console.log('[DEBUG] TTSNotifications.teste chamado');
        ttsManager.speakTest();
    }
};

// Sistema de lembretes automáticos
class ReminderSystem {
    constructor() {
        this.reminders = new Set();
        this.lateReminders = new Map(); // Para controlar repetições de atrasos
        this.checkInterval = null;
        this.startChecking();
    }
    
    startChecking() {
        // Verificar a cada 1 minuto para maior precisão
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, 60000);
    }
    
    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    
    checkReminders() {
        const now = new Date();
        const currentTime = now.getTime();
        
        // Obter agendamentos do dia atual - verificar se window.agendamentos existe
        if (!window.agendamentos || !Array.isArray(window.agendamentos)) {
            console.log('Agendamentos não carregados ainda');
            return;
        }
        
        const today = now.toISOString().split('T')[0];
        const todayAgendamentos = window.agendamentos.filter(a => 
            a.data === today && 
            a.status !== 'Concluído' && 
            a.status !== 'Cancelado'
        );
        
        console.log(`Verificando ${todayAgendamentos.length} agendamentos para hoje`);
        
        todayAgendamentos.forEach(agendamento => {
            const agendamentoTime = new Date(`${agendamento.data}T${agendamento.horario}`);
            const timeDiff = agendamentoTime.getTime() - currentTime;
            const minutesDiff = Math.floor(timeDiff / (1000 * 60));
            
            // ===== AVISOS ANTECIPADOS =====
            
            // Lembrete 1 hora (60 minutos) antes
            if (minutesDiff === 60 && !this.reminders.has(`${agendamento.id}-60`)) {
                this.reminders.add(`${agendamento.id}-60`);
                TTSNotifications.agendamentoProximo(agendamento.nomeCliente, 60);
                
                // Criar notificação visual
                if (window.notificationSystem) {
                    window.notificationSystem.createNotification({
                        type: 'reminder',
                        title: 'Lembrete - 1 hora',
                        message: `Agendamento com ${agendamento.nomeCliente} às ${agendamento.horario}`,
                        data: {
                            cliente: agendamento.nomeCliente,
                            data: agendamento.data,
                            hora: agendamento.horario,
                            telefone: agendamento.numeroContato
                        },
                        actions: [
                            {
                                id: 'view',
                                label: 'Ver Detalhes',
                                style: 'primary',
                                callback: (data) => {
                                    if (window.showAgendamentoDetails) {
                                        window.showAgendamentoDetails(agendamento.id);
                                    }
                                }
                            }
                        ]
                    });
                }
                
                if (window.showToast) {
                    window.showToast(
                        `[REMINDER] Lembrete - 1 hora: ${agendamento.nomeCliente} às ${agendamento.horario}`,
                        'info'
                    );
                }
            }
            
            // Lembrete 30 minutos antes
            if (minutesDiff === 30 && !this.reminders.has(`${agendamento.id}-30`)) {
                this.reminders.add(`${agendamento.id}-30`);
                TTSNotifications.agendamentoProximo(agendamento.nomeCliente, 30);
                
                // Criar notificação visual
                if (window.notificationSystem) {
                    window.notificationSystem.createNotification({
                        type: 'reminder',
                        title: 'Lembrete - 30 minutos',
                        message: `Agendamento com ${agendamento.nomeCliente} às ${agendamento.horario}`,
                        data: {
                            cliente: agendamento.nomeCliente,
                            data: agendamento.data,
                            hora: agendamento.horario,
                            telefone: agendamento.numeroContato
                        },
                        actions: [
                            {
                                id: 'view',
                                label: 'Ver Detalhes',
                                style: 'primary',
                                callback: (data) => {
                                    if (window.showAgendamentoDetails) {
                                        window.showAgendamentoDetails(agendamento.id);
                                    }
                                }
                            }
                        ]
                    });
                }
                
                if (window.showToast) {
                    window.showToast(
                        `[REMINDER] Lembrete - 30 minutos: ${agendamento.nomeCliente} às ${agendamento.horario}`,
                        'info'
                    );
                }
            }
            
            // Lembrete 15 minutos antes
            if (minutesDiff === 15 && !this.reminders.has(`${agendamento.id}-15`)) {
                this.reminders.add(`${agendamento.id}-15`);
                TTSNotifications.agendamentoProximo(agendamento.nomeCliente, 15);
                
                // Criar notificação visual
                if (window.notificationSystem) {
                    window.notificationSystem.createNotification({
                        type: 'warning',
                        title: 'Lembrete - 15 minutos',
                        message: `Agendamento com ${agendamento.nomeCliente} às ${agendamento.horario}`,
                        data: {
                            cliente: agendamento.nomeCliente,
                            data: agendamento.data,
                            hora: agendamento.horario,
                            telefone: agendamento.numeroContato
                        },
                        actions: [
                            {
                                id: 'view',
                                label: 'Ver Detalhes',
                                style: 'primary',
                                callback: (data) => {
                                    if (window.showAgendamentoDetails) {
                                        window.showAgendamentoDetails(agendamento.id);
                                    }
                                }
                            },
                            {
                                id: 'complete',
                                label: 'Marcar como Concluído',
                                style: 'secondary',
                                callback: (data) => {
                                    if (window.markAsCompleted) {
                                        window.markAsCompleted(agendamento.id);
                                    }
                                }
                            }
                        ]
                    });
                }
                
                if (window.showToast) {
                    window.showToast(
                        `[WARNING] Lembrete - 15 minutos: ${agendamento.nomeCliente} às ${agendamento.horario}`,
                        'warning'
                    );
                }
            }
            
            // Lembrete 5 minutos antes
            if (minutesDiff === 5 && !this.reminders.has(`${agendamento.id}-5`)) {
                this.reminders.add(`${agendamento.id}-5`);
                TTSNotifications.agendamentoProximo(agendamento.nomeCliente, 5);
                
                // Criar notificação visual
                if (window.notificationSystem) {
                    window.notificationSystem.createNotification({
                        type: 'urgent',
                        title: 'Lembrete - 5 minutos',
                        message: `Agendamento com ${agendamento.nomeCliente} às ${agendamento.horario}`,
                        data: {
                            cliente: agendamento.nomeCliente,
                            data: agendamento.data,
                            hora: agendamento.horario,
                            telefone: agendamento.numeroContato
                        },
                        actions: [
                            {
                                id: 'view',
                                label: 'Ver Detalhes',
                                style: 'primary',
                                callback: (data) => {
                                    if (window.showAgendamentoDetails) {
                                        window.showAgendamentoDetails(agendamento.id);
                                    }
                                }
                            },
                            {
                                id: 'complete',
                                label: 'Marcar como Concluído',
                                style: 'secondary',
                                callback: (data) => {
                                    if (window.markAsCompleted) {
                                        window.markAsCompleted(agendamento.id);
                                    }
                                }
                            }
                        ]
                    });
                }
                
                if (window.showToast) {
                    window.showToast(
                        `[URGENT] Lembrete - 5 minutos: ${agendamento.nomeCliente} às ${agendamento.horario}`,
                        'warning'
                    );
                }
            }
            
            // ===== AVISOS DE ATRASO =====
            if (minutesDiff < 0) {
                const minutesLate = Math.abs(minutesDiff);
                const agendamentoId = agendamento.id;
                
                // Inicializar contador de repetições se não existir
                if (!this.lateReminders.has(agendamentoId)) {
                    this.lateReminders.set(agendamentoId, {
                        count: 0,
                        lastAlert: 0
                    });
                }
                
                const lateInfo = this.lateReminders.get(agendamentoId);
                const now = Date.now();
                
                // Alertar a cada 5 minutos, máximo 3 vezes
                if (lateInfo.count < 3 && (now - lateInfo.lastAlert) >= 300000) { // 5 minutos
                    lateInfo.count++;
                    lateInfo.lastAlert = now;
                    
                    TTSNotifications.agendamentoAtrasado(agendamento.nomeCliente, minutesLate);
                    
                    // Criar notificação visual de atraso
                    if (window.notificationSystem) {
                        window.notificationSystem.createNotification({
                            type: 'late',
                            title: `ATRASO ${lateInfo.count}/3`,
                            message: `${agendamento.nomeCliente} - ${minutesLate} min de atraso`,
                            data: {
                                cliente: agendamento.nomeCliente,
                                data: agendamento.data,
                                hora: agendamento.horario,
                                telefone: agendamento.numeroContato,
                                delay: minutesLate
                            },
                            persistent: true, // Notificações de atraso são persistentes
                            actions: [
                                {
                                    id: 'view',
                                    label: 'Ver Detalhes',
                                    style: 'primary',
                                    callback: (data) => {
                                        if (window.showAgendamentoDetails) {
                                            window.showAgendamentoDetails(agendamento.id);
                                        }
                                    }
                                },
                                {
                                    id: 'complete',
                                    label: 'Marcar como Concluído',
                                    style: 'secondary',
                                    callback: (data) => {
                                        if (window.markAsCompleted) {
                                            window.markAsCompleted(agendamento.id);
                                        }
                                    }
                                },
                                {
                                    id: 'cancel',
                                    label: 'Cancelar',
                                    style: 'secondary',
                                    callback: (data) => {
                                        if (window.cancelAppointment) {
                                            window.cancelAppointment(agendamento.id);
                                        }
                                    }
                                }
                            ]
                        });
                    }
                    
                    if (window.showToast) {
                        window.showToast(
                            `[LATE] ATRASO ${lateInfo.count}/3: ${agendamento.nomeCliente} - ${minutesLate} min de atraso`,
                            'error',
                            8000 // Duração maior para alertas de atraso
                        );
                    }
                    
                    console.log(`Alerta de atraso ${lateInfo.count}/3 para ${agendamento.nomeCliente}: ${minutesLate} minutos`);
                }
            }
        });
        
        // Limpar lembretes antigos
        this.cleanOldReminders();
    }
    
    cleanOldReminders() {
        // Limpar lembretes de atraso para agendamentos que não existem mais
        const currentAgendamentoIds = new Set(
            (window.agendamentos || []).map(a => a.id)
        );
        
        for (const [agendamentoId] of this.lateReminders) {
            if (!currentAgendamentoIds.has(agendamentoId)) {
                this.lateReminders.delete(agendamentoId);
            }
        }
        
        // Limpar notificações antigas de atraso
        if (window.cleanOldLateNotifications) {
            window.cleanOldLateNotifications();
        }
    }
}

// Instância global do sistema de lembretes
const reminderSystem = new ReminderSystem();

// Exportar para uso global
window.reminderSystem = reminderSystem;

console.log('Sistema TTS e de lembretes inicializado');