// Sistema TTS (Text-to-Speech) para notificações auditivas
// Inclui som de alerta para atrasos (assets/som.mp3)

class TTSManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.voice = null;
        this.enabled = localStorage.getItem('ttsEnabled') !== 'false';
        this.volume = parseFloat(localStorage.getItem('ttsVolume') || '70') / 100;
        
        // Sistema de fila para evitar sobreposição de vozes
        this.speechQueue = [];
        this.isSpeaking = false;
        this.queueProcessing = false;
        
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
        
        console.log('[TTS] Voz selecionada:', this.voice?.name, this.voice?.lang);
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
    
    /**
     * Adicionar fala à fila com prioridade
     */
    addToQueue(text, options = {}) {
        if (!this.enabled || !this.synthesis) {
            console.log('[TTS] TTS desabilitado ou não suportado');
            return;
        }
        
        const queueItem = {
            id: `speech_${Date.now()}_${Math.random()}`,
            text,
            options,
            priority: options.priority || 0, // 0 = normal, 1 = alta, 2 = urgente
            timestamp: new Date()
        };
        
        // Inserir na fila baseado na prioridade
        if (queueItem.priority > 0) {
            // Encontrar posição para inserir item prioritário
            let insertIndex = 0;
            for (let i = 0; i < this.speechQueue.length; i++) {
                if (this.speechQueue[i].priority < queueItem.priority) {
                    insertIndex = i;
                    break;
                }
                insertIndex = i + 1;
            }
            this.speechQueue.splice(insertIndex, 0, queueItem);
        } else {
            this.speechQueue.push(queueItem);
        }
        
        console.log(`[TTS] Adicionado à fila: "${text}" (Prioridade: ${queueItem.priority}, Fila: ${this.speechQueue.length} itens)`);
        
        // Iniciar processamento da fila se não estiver rodando
        if (!this.queueProcessing) {
            this.processQueue();
        }
    }
    
    /**
     * Processar fila de fala sequencialmente
     */
    async processQueue() {
        if (this.queueProcessing || this.speechQueue.length === 0) {
            return;
        }
        
        this.queueProcessing = true;
        console.log(`[TTS] Iniciando processamento da fila (${this.speechQueue.length} itens)`);
        
        while (this.speechQueue.length > 0) {
            const queueItem = this.speechQueue.shift();
            
            try {
                await this.speakItem(queueItem);
                
                // Aguardar um pequeno intervalo entre falas para melhor clareza
                if (this.speechQueue.length > 0) {
                    const delayTime = queueItem.priority > 0 ? 300 : 500; // Menos delay para prioridades altas
                    await this.delay(delayTime);
                }
                
            } catch (error) {
                console.error(`[TTS] Erro ao processar item da fila:`, error);
            }
        }
        
        this.queueProcessing = false;
        console.log('[TTS] Fila processada completamente');
    }
    
    /**
     * Falar um item específico da fila
     */
    speakItem(queueItem) {
        return new Promise((resolve, reject) => {
            console.log(`[TTS] Falando: "${queueItem.text}" (Prioridade: ${queueItem.priority})`);
            
            // Cancelar qualquer fala em andamento
            this.synthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(queueItem.text);
            
            // Configurações da fala
            utterance.voice = this.voice;
            utterance.volume = queueItem.options.volume || this.volume;
            utterance.rate = queueItem.options.rate || 0.9;
            utterance.pitch = queueItem.options.pitch || 1;
            utterance.lang = this.voice?.lang || 'pt-BR';
            
            // Eventos
            utterance.onstart = () => {
                this.isSpeaking = true;
                console.log(`[TTS] Iniciado: "${queueItem.text}"`);
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                console.log(`[TTS] Finalizado: "${queueItem.text}"`);
                resolve();
            };
            
            utterance.onerror = (event) => {
                this.isSpeaking = false;
                console.error(`[TTS] Erro ao falar:`, event.error);
                reject(event.error);
            };
            
            // Falar
            this.synthesis.speak(utterance);
        });
    }
    
    /**
     * Delay utilitário
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Método público para falar (agora usa fila)
     */
    speak(text, options = {}) {
        this.addToQueue(text, options);
    }
    
    /**
     * Falar com prioridade alta
     */
    speakUrgent(text, options = {}) {
        this.addToQueue(text, { ...options, priority: 2 });
    }
    
    /**
     * Falar com prioridade média
     */
    speakHigh(text, options = {}) {
        this.addToQueue(text, { ...options, priority: 1 });
    }
    
    /**
     * Parar todas as falas e limpar fila
     */
    stop() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
        
        // Limpar fila
        this.speechQueue = [];
        this.isSpeaking = false;
        this.queueProcessing = false;
        
        console.log('[TTS] TTS parado e fila limpa');
    }
    
    /**
     * Pausar fala atual (mantém fila)
     */
    pause() {
        if (this.synthesis) {
            this.synthesis.pause();
            console.log('[TTS] Fala pausada');
        }
    }
    
    /**
     * Retomar fala pausada
     */
    resume() {
        if (this.synthesis) {
            this.synthesis.resume();
            console.log('[TTS] Fala retomada');
        }
    }
    
    /**
     * Obter status da fila
     */
    getQueueStatus() {
        return {
            queueLength: this.speechQueue.length,
            isSpeaking: this.isSpeaking,
            isProcessing: this.queueProcessing,
            currentItem: this.speechQueue[0] || null,
            queueItems: this.speechQueue.map(item => ({
                id: item.id,
                text: item.text.substring(0, 50) + (item.text.length > 50 ? '...' : ''),
                priority: item.priority,
                timestamp: item.timestamp
            }))
        };
    }
    
    /**
     * Limpar fila de fala
     */
    clearQueue() {
        const queueLength = this.speechQueue.length;
        this.speechQueue = [];
        console.log(`[TTS] Fila limpa (${queueLength} itens removidos)`);
    }
    
    /**
     * Remover item específico da fila
     */
    removeFromQueue(itemId) {
        const initialLength = this.speechQueue.length;
        this.speechQueue = this.speechQueue.filter(item => item.id !== itemId);
        const removed = initialLength - this.speechQueue.length;
        
        if (removed > 0) {
            console.log(`[TTS] Item removido da fila: ${itemId}`);
        }
        
        return removed > 0;
    }
    
    // Métodos específicos para diferentes tipos de notificação
    speakAgendamentoCriado(nomeCliente, horario, cidade) {
        const text = `Novo agendamento criado para ${nomeCliente} às ${horario} em ${cidade}`;
        this.speak(text, { priority: 0 }); // Prioridade normal
    }
    
    speakAgendamentoConcluido(nomeCliente) {
        const text = `Agendamento de ${nomeCliente} foi concluído com sucesso`;
        this.speak(text, { priority: 0 }); // Prioridade normal
    }
    
    speakAgendamentoCancelado(nomeCliente) {
        const text = `Agendamento de ${nomeCliente} foi cancelado`;
        this.speak(text, { priority: 0 }); // Prioridade normal
    }
    
    // Método para converter minutos em formato mais legível
    formatMinutesForSpeech(minutes) {
        if (minutes < 60) {
            return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            
            let timeText = `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
            
            if (remainingMinutes > 0) {
                timeText += ` e ${remainingMinutes} ${remainingMinutes === 1 ? 'minuto' : 'minutos'}`;
            }
            
            return timeText;
        }
    }
    
    speakAgendamentoAtrasado(nomeCliente, minutosAtraso) {
        // Tocar som de alerta primeiro
        this.playAlertSound();
        
        // Aguardar um pouco antes de adicionar à fila com prioridade alta
        setTimeout(() => {
            const tempoFormatado = this.formatMinutesForSpeech(minutosAtraso);
            const text = `Atenção! Agendamento de ${nomeCliente} está atrasado em ${tempoFormatado}`;
            this.speakUrgent(text, { 
                volume: Math.min(this.volume + 0.2, 1), // Volume um pouco mais alto para alertas
                priority: 2 // Prioridade urgente para atrasos
            });
        }, 500); // Aguardar 500ms após o som
    }
    
    playAlertSound() {
        try {
            const audio = new Audio('../../assets/som.mp3');
            audio.volume = 0.7; // Volume do som de alerta
            audio.play().catch(error => {
                console.error('[TTS] Erro ao tocar som de alerta:', error);
            });
        } catch (error) {
            console.error('[TTS] Erro ao criar áudio de alerta:', error);
        }
    }
    
    speakAgendamentoProximo(nomeCliente, minutosRestantes) {
        const tempoFormatado = this.formatMinutesForSpeech(minutosRestantes);
        const text = `Lembrete: agendamento de ${nomeCliente} em ${tempoFormatado}`;
        
        // Usar prioridade baseada no tempo restante
        let priority = 0; // Normal
        if (minutosRestantes <= 5) {
            priority = 2; // Urgente
        } else if (minutosRestantes <= 15) {
            priority = 1; // Alta
        }
        
        this.speak(text, { priority });
    }
    
    speakTest() {
        const text = 'Teste de notificação por voz do sistema UBY Agendamentos. O sistema está funcionando corretamente.';
        this.speak(text, { priority: 0 });
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
    // Método genérico para falar qualquer texto
    speak: (text, priority = 0) => {
        console.log('[DEBUG] TTSNotifications.speak chamado:', text, 'Prioridade:', priority);
        if (priority === 2) {
            ttsManager.speakUrgent(text);
        } else if (priority === 1) {
            ttsManager.speakHigh(text);
        } else {
            ttsManager.speak(text);
        }
    },
    
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
    
    agendamentoAtualizado: (nomeCliente) => {
        console.log('[DEBUG] TTSNotifications.agendamentoAtualizado chamado:', nomeCliente);
        ttsManager.speak(`Agendamento de ${nomeCliente} foi atualizado`);
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
    },
    
    // Novos métodos para gerenciar a fila
    getQueueStatus: () => {
        return ttsManager.getQueueStatus();
    },
    
    clearQueue: () => {
        ttsManager.clearQueue();
        console.log('[DEBUG] Fila TTS limpa');
    },
    
    pause: () => {
        ttsManager.pause();
        console.log('[DEBUG] TTS pausado');
    },
    
    resume: () => {
        ttsManager.resume();
        console.log('[DEBUG] TTS retomado');
    },
    
    stop: () => {
        ttsManager.stop();
        console.log('[DEBUG] TTS parado');
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
        // Verificar a cada 30 segundos para maior precisão nos avisos de antecedência
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, 30000); // Reduzido de 60000 (1 min) para 30000 (30 seg)
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
            
            // ===== AVISOS ANTECIPADOS COM MAIOR FREQUÊNCIA =====
            
            // Lembrete 2 horas (120 minutos) antes - NOVO
            if (minutesDiff === 120 && !this.reminders.has(`${agendamento.id}-120`)) {
                this.reminders.add(`${agendamento.id}-120`);
                TTSNotifications.agendamentoProximo(agendamento.nomeCliente, 120);
                
                // Criar notificação visual
                if (window.notificationSystem) {
                    window.notificationSystem.createNotification({
                        type: 'reminder',
                        title: 'Lembrete - 2 horas',
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
                        `[REMINDER] Lembrete - 2 horas: ${agendamento.nomeCliente} às ${agendamento.horario}`,
                        'info'
                    );
                }
            }
            
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
            
            // Lembrete 45 minutos antes - NOVO
            if (minutesDiff === 45 && !this.reminders.has(`${agendamento.id}-45`)) {
                this.reminders.add(`${agendamento.id}-45`);
                TTSNotifications.agendamentoProximo(agendamento.nomeCliente, 45);
                
                // Criar notificação visual
                if (window.notificationSystem) {
                    window.notificationSystem.createNotification({
                        type: 'reminder',
                        title: 'Lembrete - 45 minutos',
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
                        `[REMINDER] Lembrete - 45 minutos: ${agendamento.nomeCliente} às ${agendamento.horario}`,
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
            
            // Lembrete 20 minutos antes - NOVO
            if (minutesDiff === 20 && !this.reminders.has(`${agendamento.id}-20`)) {
                this.reminders.add(`${agendamento.id}-20`);
                TTSNotifications.agendamentoProximo(agendamento.nomeCliente, 20);
                
                // Criar notificação visual
                if (window.notificationSystem) {
                    window.notificationSystem.createNotification({
                        type: 'warning',
                        title: 'Lembrete - 20 minutos',
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
                        `[WARNING] Lembrete - 20 minutos: ${agendamento.nomeCliente} às ${agendamento.horario}`,
                        'warning'
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
            
            // Lembrete 10 minutos antes - NOVO
            if (minutesDiff === 10 && !this.reminders.has(`${agendamento.id}-10`)) {
                this.reminders.add(`${agendamento.id}-10`);
                TTSNotifications.agendamentoProximo(agendamento.nomeCliente, 10);
                
                // Criar notificação visual
                if (window.notificationSystem) {
                    window.notificationSystem.createNotification({
                        type: 'urgent',
                        title: 'Lembrete - 10 minutos',
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
                        `[URGENT] Lembrete - 10 minutos: ${agendamento.nomeCliente} às ${agendamento.horario}`,
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
            
            // Lembrete 2 minutos antes - NOVO
            if (minutesDiff === 2 && !this.reminders.has(`${agendamento.id}-2`)) {
                this.reminders.add(`${agendamento.id}-2`);
                TTSNotifications.agendamentoProximo(agendamento.nomeCliente, 2);
                
                // Criar notificação visual
                if (window.notificationSystem) {
                    window.notificationSystem.createNotification({
                        type: 'urgent',
                        title: 'Lembrete - 2 minutos',
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
                        `[URGENT] Lembrete - 2 minutos: ${agendamento.nomeCliente} às ${agendamento.horario}`,
                        'error'
                    );
                }
            }
            
            // ===== AVISOS DE ATRASO COM FREQUÊNCIA REDUZIDA =====
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
                
                // Alertar a cada 10 minutos, máximo 2 vezes (reduzido de 5 min/3 vezes)
                if (lateInfo.count < 2 && (now - lateInfo.lastAlert) >= 600000) { // 10 minutos
                    lateInfo.count++;
                    lateInfo.lastAlert = now;
                    
                    TTSNotifications.agendamentoAtrasado(agendamento.nomeCliente, minutesLate);
                    
                    // Criar notificação visual de atraso
                    if (window.notificationSystem) {
                        window.notificationSystem.createNotification({
                            type: 'late',
                            title: `ATRASO ${lateInfo.count}/2`,
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
                            `[LATE] ATRASO ${lateInfo.count}/2: ${agendamento.nomeCliente} - ${minutesLate} min de atraso`,
                            'error',
                            8000 // Duração maior para alertas de atraso
                        );
                    }
                    
                    console.log(`Alerta de atraso ${lateInfo.count}/2 para ${agendamento.nomeCliente}: ${minutesLate} minutos`);
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