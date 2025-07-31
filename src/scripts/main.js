// Importar ipcRenderer do Electron e torná-lo global
const { ipcRenderer } = require('electron');
window.ipcRenderer = ipcRenderer;

// Função auxiliar para chamar showToast de forma segura
function safeShowToast(message, type = 'info') {
    if (typeof showToast === 'function') {
        showToast(message, type);
    } else if (window.showToast && typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(`Toast: ${message} (${type})`);
    }
}

// Função showToast global
function showToast(message, type = 'info') {
    // Remover toast anterior se existir
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto remover após 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Função para obter ícone do toast
function getToastIcon(type) {
    const icons = {
        success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12A10 10 0 1 1 5.93 7.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.54 21H20.46A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    };
    return icons[type] || icons.info;
}

// Tornar showToast disponível globalmente
window.showToast = showToast;

// Variáveis globais
let currentTab = 'hoje';
let agendamentos = [];
let editingAgendamento = null;
let cancelingAgendamento = null;
let sharingAgendamento = null;
let isOnline = navigator.onLine;
let currentTheme = localStorage.getItem('theme') || 'light';

// Lista de usuários para compartilhamento
const users = [
    { id: 1, nome: 'João Silva', email: 'joao@uby.com', avatar: 'JS' },
    { id: 2, nome: 'Maria Santos', email: 'maria@uby.com', avatar: 'MS' },
    { id: 3, nome: 'Pedro Costa', email: 'pedro@uby.com', avatar: 'PC' },
    { id: 4, nome: 'Ana Oliveira', email: 'ana@uby.com', avatar: 'AO' },
    { id: 5, nome: 'Carlos Lima', email: 'carlos@uby.com', avatar: 'CL' }
];

// Cores para post-its
const postitColors = ['postit-amarelo', 'postit-rosa', 'postit-azul', 'postit-verde', 'postit-laranja', 'postit-roxo'];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando aplicação...');
    await initializeApp();
    console.log('Aplicação inicializada');
    setupEventListeners();
    console.log('Event listeners configurados');
    await loadAgendamentos();
    console.log('Agendamentos carregados');
    setupWindowControls();
    formatPhoneInput();
    
    // Verificar aba inicial
    console.log('Aba inicial:', currentTab);
    console.log('Container de agendamentos:', document.getElementById('agendamentosContainer'));
    
    // Aplicar tema salvo
    applyTheme(currentTheme);
    
    // Configurar status de conexão
    updateConnectionStatus();
    setInterval(checkConnection, 30000); // Verificar a cada 30 segundos
    
    // Event listeners para conexão
    window.addEventListener('online', () => {
        isOnline = true;
        updateConnectionStatus();
        safeShowToast('Conexão restaurada', 'success');
    });

    window.addEventListener('offline', () => {
        isOnline = false;
        updateConnectionStatus();
        safeShowToast('Conexão perdida', 'error');
    });
    
    // Aguardar o TTS estar pronto
    setTimeout(() => {
        if (window.TTSNotifications) {
            console.log('Sistema TTS carregado com sucesso');
            // Inicializar sistema de lembretes se disponível
            if (window.reminderSystem && typeof window.reminderSystem.startChecking === 'function') {
                window.reminderSystem.startChecking();
                console.log('Sistema de lembretes iniciado');
            } else {
                console.log('Sistema de lembretes não disponível');
            }
        }
    }, 1000);
});

// Inicializar aplicação
async function initializeApp() {
    try {
        // Verificar se há usuário logado usando Electron
        const currentUser = await ipcRenderer.invoke('getCurrentUser');
        
        if (!currentUser) {
            // Se não há usuário logado, redirecionar para login
            window.location.href = 'login.html';
            return;
        }
        
        document.getElementById('userNameText').textContent = currentUser.displayName || currentUser.username;
        
        // Armazenar dados do usuário globalmente para uso em outras funções
        window.currentUser = currentUser;
        
        // Definir e bloquear campo atendente
        const atendenteInput = document.getElementById('atendente');
        atendenteInput.value = currentUser.displayName || currentUser.username;
        atendenteInput.setAttribute('readonly', true);
        

    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        // Se há erro nos dados, redirecionar para login
        window.location.href = 'login.html';
        return;
    }
    
    // Definir data atual no formulário
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('data').value = today;
}



// Configurar event listeners
function setupEventListeners() {
    // Formulário de agendamento
    document.getElementById('agendamentoForm').addEventListener('submit', handleCreateAgendamento);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Usar currentTarget para garantir que sempre pegue o botão, não o SVG ou texto
            const tabBtn = e.currentTarget;
            const tabValue = tabBtn.dataset.tab;
            console.log('Tab clicked:', tabValue);
            currentTab = tabValue;
            updateTabs();
            filterAgendamentos();
        });
    });
    
    // Header buttons
    document.getElementById('soundBtn').addEventListener('click', toggleSoundPanel);
    document.getElementById('exitBtn').addEventListener('click', handleLogout);
    
    // Novos botões do header
    const statusBtn = document.getElementById('statusBtn');
    const themeBtn = document.getElementById('themeBtn');
    const testNotificationBtn = document.getElementById('testNotificationBtn');
    const notificationBtn = document.getElementById('notificationBtn');
    
    if (statusBtn) {
        statusBtn.addEventListener('click', syncData);
    }
    
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    if (testNotificationBtn) {
        testNotificationBtn.addEventListener('click', () => {
            if (window.notificationSystem) {
                // O sistema agora gerencia o toggle automaticamente
                console.log('[INFO] Botão de notificações clicado');
            } else {
                showToast('Sistema de notificações não disponível', 'error');
            }
        });
    }
    

    
    // Event listeners do painel de controle removidos
    
    // Sound controls
    document.getElementById('ttsEnabled').addEventListener('change', updateTTSSettings);
    document.getElementById('volumeSlider').addEventListener('input', updateVolume);
    document.getElementById('testSoundBtn').addEventListener('click', testTTS);
    
    // Modais
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('closeCancelModal').addEventListener('click', closeCancelModal);
    document.getElementById('closeLocationModal').addEventListener('click', closeLocationModal);
    document.getElementById('openInMaps').addEventListener('click', openInGoogleMaps);
    document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
    document.getElementById('cancelCancelation').addEventListener('click', closeCancelModal);
    
    // Controles do mapa
    document.getElementById('zoomIn').addEventListener('click', () => {
        if (map) map.zoomIn();
    });
    document.getElementById('zoomOut').addEventListener('click', () => {
        if (map) map.zoomOut();
    });
    document.getElementById('centerMap').addEventListener('click', () => {
        if (map && currentMapCoordinates) {
            map.setView(currentMapCoordinates, 15);
        }
    });
    
    // Formulários dos modais
    document.getElementById('editForm').addEventListener('submit', handleEditAgendamento);
    document.getElementById('cancelForm').addEventListener('submit', handleCancelAgendamento);
    
    // Fechar painéis ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.sound-panel') && !e.target.closest('#soundBtn')) {
            closeSoundPanel();
        }
    });
}

// Funções dos botões do header
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    const themeName = currentTheme === 'dark' ? 'escuro' : 'claro';
    showToast(`Tema ${themeName} ativado`, 'info');
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        const icon = themeBtn.querySelector('svg');
        if (theme === 'dark') {
            // Ícone da lua para tema escuro
            icon.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            `;
        } else {
            // Ícone do sol para tema claro
            icon.innerHTML = `
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            `;
        }
    }
}

async function checkConnection() {
    try {
        // Verificar conexão usando uma URL local ou método alternativo
        // Em aplicações Electron, podemos verificar o status do WebSocket
        if (window.wsClient && window.wsClient.isConnected) {
            isOnline = true;
        } else {
            // Verificar conectividade de rede usando navigator.onLine
            isOnline = navigator.onLine;
        }
    } catch (error) {
        isOnline = false;
    }
    updateConnectionStatus();
}

function updateConnectionStatus() {
    const connectionBtn = document.getElementById('connectionStatus');
    const statusText = connectionBtn?.querySelector('.btn-text');
    const statusDot = connectionBtn?.querySelector('.status-dot');

    if (!connectionBtn) return;

    if (isOnline) {
        connectionBtn.className = 'header-btn connection-btn';
        if (statusText) statusText.textContent = 'Online';
        if (statusDot) {
            statusDot.className = 'status-dot online';
        }
    } else {
        connectionBtn.className = 'header-btn connection-btn offline';
        if (statusText) statusText.textContent = 'Offline';
        if (statusDot) {
            statusDot.className = 'status-dot offline';
        }
    }
}

async function syncData() {
    if (!isOnline) {
        showToast('Sem conexão com a internet', 'error');
        return;
    }

    const connectionBtn = document.getElementById('connectionStatus');
    const statusText = connectionBtn?.querySelector('.btn-text');
    const statusDot = connectionBtn?.querySelector('.status-dot');
    
    // Mostrar status de sincronização
    if (connectionBtn) {
        connectionBtn.className = 'header-btn connection-btn checking';
        if (statusText) statusText.textContent = 'Verificando...';
        if (statusDot) {
            statusDot.className = 'status-dot checking';
        }
    }

    try {
        // Simular sincronização (substituir por lógica real)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showToast('Dados sincronizados com sucesso', 'success');
        updateConnectionStatus();
    } catch (error) {
        showToast('Erro ao sincronizar dados', 'error');
        updateConnectionStatus();
    }
}

function toggleSystemStatus() {
    // Função mantida para compatibilidade, mas agora chama syncData
    syncData();
}

// Funções do painel de controle removidas - funcionalidades agora no header

// Controles da janela
function setupWindowControls() {
    const minimizeBtn = document.getElementById('minimizeBtn');
    const maximizeBtn = document.getElementById('maximizeBtn');
    const closeBtn = document.getElementById('closeBtn');
    
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            ipcRenderer.send('main-window-minimize');
        });
    }
    
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            ipcRenderer.send('main-window-maximize');
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            ipcRenderer.send('main-window-close');
        });
    }
}

// Formatação do telefone
function formatPhoneInput() {
    const phoneInput = document.getElementById('numeroContato');
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            if (value.length < 14) {
                value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
        }
        e.target.value = value;
    });
}

// Criar agendamento
async function handleCreateAgendamento(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const coordenadas = formData.get('linkCoordenadas') || document.getElementById('linkCoordenadas').value;
    
    const agendamento = {
        data: formData.get('data') || document.getElementById('data').value,
        horario: formData.get('horario') || document.getElementById('horario').value,
        nomeCliente: formData.get('nomeCliente') || document.getElementById('nomeCliente').value,
        numeroContato: formData.get('numeroContato') || document.getElementById('numeroContato').value,
        atendente: formData.get('atendente') || document.getElementById('atendente').value,
        status: formData.get('status') || document.getElementById('status').value,
        cidade: formData.get('cidade') || document.getElementById('cidade').value,
        linkCoordenadas: coordenadas.trim(),
        observacoes: formData.get('observacoes') || document.getElementById('observacoes').value,
        prioridade: calculatePriority(formData.get('data') || document.getElementById('data').value, formData.get('horario') || document.getElementById('horario').value)
    };
    
    try {
        const result = await ipcRenderer.invoke('saveAgendamento', agendamento);
        if (result.success) {
            // Salvar valor do atendente antes do reset
            const atendenteValue = document.getElementById('atendente').value;
            
            // Limpar formulário
            e.target.reset();
            document.getElementById('data').value = new Date().toISOString().split('T')[0];
            
            // Restaurar campo atendente
            const atendenteInput = document.getElementById('atendente');
            atendenteInput.value = atendenteValue;
            atendenteInput.setAttribute('readonly', true);
            
            // Recarregar agendamentos
            await loadAgendamentos();
            
            // Notificação TTS
            if (window.TTSNotifications) {
                window.TTSNotifications.agendamentoCriado(
                    agendamento.nomeCliente,
                    agendamento.horario,
                    agendamento.cidade
                );
            }
            
            showToast('Agendamento criado com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        showToast('Erro ao criar agendamento', 'error');
    }
}

// Calcular prioridade
function calculatePriority(data, horario) {
    const agendamentoDate = new Date(`${data}T${horario}`);
    const now = new Date();
    const diffHours = (agendamentoDate - now) / (1000 * 60 * 60);
    
    if (diffHours <= 2) return 'urgente';
    if (diffHours <= 24) return 'medio';
    return 'normal';
}

// Carregar agendamentos
async function loadAgendamentos() {
    try {
        console.log('Carregando agendamentos...');
        agendamentos = await ipcRenderer.invoke('getAgendamentos');
        console.log('Agendamentos carregados:', agendamentos.length);
        console.log('Primeiros 3 agendamentos:', agendamentos.slice(0, 3).map(a => ({ id: a.id, data: a.data, nome: a.nomeCliente })));
        

        
        // Atualizar agendamentos globalmente para o sistema de lembretes
        window.agendamentos = agendamentos;
        
        // Reinicializar sistema de lembretes se disponível
        if (window.reminderSystem && typeof window.reminderSystem.checkReminders === 'function') {
            console.log('Reinicializando sistema de lembretes com novos agendamentos');
            window.reminderSystem.checkReminders();
        }
        
        console.log('Chamando filterAgendamentos...');
        filterAgendamentos();
        console.log('filterAgendamentos concluído');
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        agendamentos = [];
        window.agendamentos = [];
        filterAgendamentos();
    }
}

// Filtrar agendamentos
function filterAgendamentos() {
    console.log('=== INÍCIO filterAgendamentos ===');
    console.log('filterAgendamentos called, currentTab:', currentTab);
    const container = document.getElementById('agendamentosContainer');
    console.log('Container encontrado:', !!container);
    if (!container) {
        console.error('ERRO: Container agendamentosContainer não encontrado!');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    let filtered = [];
    
    // Usar filteredAgendamentos se houver busca ativa, senão usar todos os agendamentos
    const sourceAgendamentos = (searchQuery && searchQuery.trim()) || Object.keys(activeFilters).length > 0 
        ? filteredAgendamentos 
        : agendamentos;
    
    console.log('Filtrando para aba:', currentTab, 'Data hoje:', today);
    console.log('Usando fonte:', (searchQuery && searchQuery.trim()) || Object.keys(activeFilters).length > 0 ? 'filteredAgendamentos' : 'agendamentos');
    console.log('Total de agendamentos na fonte:', sourceAgendamentos.length);
    
    switch (currentTab) {
        case 'hoje':
            // Mostrar apenas agendamentos do dia atual que não estão concluídos ou cancelados
            filtered = sourceAgendamentos.filter(a => a.data === today && a.status !== 'Concluído' && a.status !== 'Cancelado');
            console.log('Agendamentos para hoje:', filtered.length);
            break;
        case 'futuros':
            filtered = sourceAgendamentos.filter(a => a.data > today && a.status !== 'Cancelado' && a.status !== 'Concluído');
            break;
        case 'historico':
            filtered = sourceAgendamentos.filter(a => a.data < today && a.status !== 'Concluído' && a.status !== 'Cancelado');
            break;
        case 'concluidos':
            // Apenas agendamentos com status exatamente 'Concluído'
            filtered = sourceAgendamentos.filter(a => a.status === 'Concluído');
            break;
        case 'cancelados':
            // Apenas agendamentos com status exatamente 'Cancelado'
            filtered = sourceAgendamentos.filter(a => a.status === 'Cancelado');
            break;
    }
    
    console.log(`Filtered ${filtered.length} agendamentos for tab '${currentTab}'`);
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h3>Nenhum agendamento encontrado</h3>
                <p>Os agendamentos aparecerão aqui quando criados.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por data e horário, mas agrupando compartilhados primeiro
    filtered.sort((a, b) => {
        // Primeiro critério: agendamentos compartilhados vêm primeiro
        const aShared = a.compartilhadoPor ? 1 : 0;
        const bShared = b.compartilhadoPor ? 1 : 0;
        
        if (aShared !== bShared) {
            return bShared - aShared; // Compartilhados primeiro
        }
        
        // Segundo critério: ordenar por data e horário
        const dateA = new Date(`${a.data}T${a.horario}`);
        const dateB = new Date(`${b.data}T${b.horario}`);
        return dateA - dateB;
    });
    
    console.log('Renderizando agendamentos:', filtered.length);
    const cardsHTML = filtered.map(agendamento => createAgendamentoCard(agendamento)).join('');
    console.log('HTML gerado (primeiros 500 chars):', cardsHTML.substring(0, 500));
    console.log('HTML gerado (tamanho total):', cardsHTML.length);
    
    container.innerHTML = cardsHTML;
    console.log('HTML inserido no container');
    console.log('Container tem elementos após inserção:', container.children.length);
    console.log('Container innerHTML (primeiros 200 chars):', container.innerHTML.substring(0, 200));
    console.log('=== FIM filterAgendamentos ===');
}

// Criar card do agendamento
function createAgendamentoCard(agendamento) {
    console.log('=== INÍCIO createAgendamentoCard ===');
    console.log('Criando card para agendamento:', agendamento.id, agendamento.nomeCliente);
    console.log('Agendamento completo:', agendamento);
    
    const statusClass = agendamento.status === 'Concluído' ? 'concluido' : 
                       agendamento.status === 'Cancelado' ? 'cancelado' : agendamento.prioridade;
    
    // Determinar se é compartilhado ou não
    const isShared = agendamento.compartilhadoPor ? true : false;
    const shareClass = isShared ? 'shared' : 'not-shared';
    const postitStyle = 'postit-style';
    
    console.log('Classes CSS aplicadas:', statusClass, postitStyle, shareClass);
    
    const formatDate = new Date(agendamento.data + 'T00:00:00').toLocaleDateString('pt-BR');
    
    // Informações de compartilhamento - mostrar no final para aba concluídos
    const sharedInfo = agendamento.compartilhadoPor && currentTab !== 'concluidos' ? 
        `<div class="postit-shared-info">Compartilhado por: ${agendamento.compartilhadoPor}</div>` : '';
    
    // Informações de compartilhamento no final para aba concluídos
    const sharedInfoBottom = agendamento.compartilhadoPor && currentTab === 'concluidos' ? 
        `<div class="postit-shared-info-bottom">Compartilhado por: ${agendamento.compartilhadoPor}</div>` : '';
    
    // Justificativa de cancelamento
    const justificativa = agendamento.motivoCancelamento ? 
        `<div class="postit-row postit-observacao">
            <span class="icon"><i class="fa-solid fa-exclamation-triangle"></i></span>
            <span><b>Motivo do Cancelamento:</b> ${agendamento.motivoCancelamento}</span>
        </div>` : '';
    
    // Observações como observação especial
    const observacoes = agendamento.observacoes ? 
        `<div class="postit-row postit-observacao">
            <span class="icon"><i class="fa-solid fa-sticky-note"></i></span>
            <span><b>Obs.:</b> ${agendamento.observacoes}</span>
        </div>` : '';
    
    const cardHTML = `
        <div class="agendamento-card ${statusClass} ${postitStyle} ${shareClass}" data-id="${agendamento.id}" data-shared="${isShared}">
            ${sharedInfo}
            
            <div class="cliente-destaque">
                <span class="icon"><i class="fa-solid fa-user"></i></span>
                <span class="cliente-nome">${agendamento.nomeCliente}</span>
            </div>
            
            <div class="postit-content">
                <div class="postit-row">
                    <span class="icon"><i class="fa-solid fa-calendar-day"></i></span>
                    <span class="postit-label">Data:</span> <span class="postit-value">${formatDate}</span>
                </div>
                <div class="postit-row">
                    <span class="icon"><i class="fa-solid fa-clock"></i></span>
                    <span class="postit-label">Hora:</span> <span class="postit-value">${agendamento.horario}</span>
                </div>
                <div class="postit-row">
                    <span class="icon"><i class="fa-solid fa-phone"></i></span>
                    <span class="postit-label">Telefone:</span>
                    <span class="postit-value copyable-contact" onclick="copyToClipboard('${agendamento.numeroContato}')" title="Clique para copiar">${agendamento.numeroContato}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${agendamento.numeroContato}')" title="Copiar"><i class="fa-solid fa-copy"></i></button>
                </div>
                <div class="postit-row">
                    <span class="icon"><i class="fa-solid fa-location-dot"></i></span>
                    <span class="postit-label">Cidade:</span> <span class="postit-value">${agendamento.cidade}</span>
                </div>
                <div class="postit-row">
                    <span class="icon"><i class="fa-solid fa-taxi"></i></span>
                    <span class="postit-label">Status:</span> <span class="postit-status">${agendamento.status}</span>
                </div>
                <div class="postit-row">
                    <span class="icon"><i class="fa-solid fa-headset"></i></span>
                    <span class="postit-label">Atendente:</span> <span class="postit-value">${agendamento.atendente}</span>
                </div>
                ${observacoes}
                ${justificativa}
            </div>
            
            <div class="postit-footer">
                ${agendamento.status !== 'Concluído' && agendamento.status !== 'Cancelado' ? `
                    <button class="postit-btn concluir-btn" onclick="concluirAgendamento('${agendamento.id}')" title="Marcar como concluído">
                        <i class="fa-solid fa-check-circle"></i> Concluir
                    </button>
                    <button class="postit-btn cancelar-btn" onclick="openCancelModal('${agendamento.id}')" title="Cancelar agendamento">
                        <i class="fa-solid fa-times-circle"></i> Cancelar
                    </button>
                    <button class="postit-btn editar-btn" onclick="openEditModal('${agendamento.id}')" title="Editar agendamento">
                        <i class="fa-solid fa-edit"></i> Editar
                    </button>
                ` : ''}
                <button class="postit-btn compartilhar-btn" onclick="openShareModal('${agendamento.id}')" title="Compartilhar agendamento">
                    <i class="fa-solid fa-share-alt"></i> Compartilhar
                </button>
                ${agendamento.linkCoordenadas ? `
                    <button class="postit-btn localizacao-btn" onclick="openLocationModal('${agendamento.linkCoordenadas}')" title="Ver localização no mapa">
                        <i class="fa-solid fa-map-marker-alt"></i> Localização
                    </button>
                ` : ''}
                <button class="postit-btn delete-btn" onclick="deleteAgendamento('${agendamento.id}')" title="Excluir agendamento permanentemente">
                    <i class="fa-solid fa-trash-alt"></i> Excluir
                </button>
            </div>
            ${sharedInfoBottom}
        </div>
    `;
    
    console.log('Card HTML gerado para', agendamento.nomeCliente);
    console.log('HTML length:', cardHTML.length);
    console.log('HTML preview (primeiros 200 chars):', cardHTML.substring(0, 200));
    console.log('=== FIM createAgendamentoCard ===');
    return cardHTML;
}

// Atualizar tabs
function updateTabs() {
    console.log('updateTabs called, currentTab:', currentTab);
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === currentTab;
        console.log(`Tab ${btn.dataset.tab}: active = ${isActive}`);
        btn.classList.toggle('active', isActive);
    });
}

// Concluir agendamento
async function concluirAgendamento(id) {
    try {
        const agendamento = agendamentos.find(a => a.id === id);
        const currentUser = window.currentUser ? window.currentUser.displayName : document.getElementById('userName').textContent;
        
        await ipcRenderer.invoke('updateAgendamento', { 
            id, 
            status: 'Concluído',
            concluidoPor: currentUser,
            concluidoEm: new Date().toISOString()
        });
        await loadAgendamentos();
        
        // Notificação TTS
        if (window.TTSNotifications) {
            window.TTSNotifications.agendamentoConcluido(agendamento.nomeCliente);
        }
        
        showToast('Agendamento concluído!', 'success');
    } catch (error) {
        console.error('Erro ao concluir agendamento:', error);
        showToast('Erro ao concluir agendamento', 'error');
    }
}

// Função para excluir agendamento permanentemente
async function deleteAgendamento(id) {
    try {
        const result = await Swal.fire({
            title: '<i class="fa-solid fa-trash-can"></i> Excluir Agendamento',
            text: 'Tem certeza que deseja excluir este agendamento permanentemente? Esta ação não pode ser desfeita.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="fa-solid fa-trash-can"></i> Sim, excluir',
            cancelButtonText: '<i class="fa-solid fa-xmark"></i> Cancelar',
            background: '#ffffff',
            customClass: {
                popup: 'swal-popup-modern',
                title: 'swal-title-modern',
                content: 'swal-content-modern',
                confirmButton: 'swal-confirm-modern',
                cancelButton: 'swal-cancel-modern'
            }
        });

        if (result.isConfirmed) {
            // Excluir do banco de dados
            await ipcRenderer.invoke('deletePostItPermanently', id);
            
            // Remover da interface
            const cardElement = document.querySelector(`[data-id="${id}"]`);
            if (cardElement) {
                cardElement.style.transform = 'scale(0.8)';
                cardElement.style.opacity = '0';
                setTimeout(() => {
                    cardElement.remove();
                    updateAgendamentosCount();
                }, 300);
            }

            // Mostrar confirmação
            await Swal.fire({
                title: '<i class="fa-solid fa-check-circle"></i> Excluído!',
                text: 'O agendamento foi excluído permanentemente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: '#ffffff',
                customClass: {
                    popup: 'swal-popup-modern',
                    title: 'swal-title-modern'
                }
            });

            // Atualizar a lista
            await loadAgendamentos();
        }
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        await Swal.fire({
            title: '<i class="fa-solid fa-circle-exclamation"></i> Erro',
            text: 'Erro ao excluir o agendamento. Tente novamente.',
            icon: 'error',
            background: '#ffffff',
            customClass: {
                popup: 'swal-popup-modern',
                title: 'swal-title-modern'
            }
        });
    }
}

// Abrir modal de edição
function openEditModal(id) {
    const agendamento = agendamentos.find(a => a.id === id);
    if (!agendamento) return;
    
    editingAgendamento = agendamento;
    
    // Preencher formulário
    document.getElementById('editData').value = agendamento.data;
    document.getElementById('editHorario').value = agendamento.horario;
    document.getElementById('editNomeCliente').value = agendamento.nomeCliente;
    document.getElementById('editNumeroContato').value = agendamento.numeroContato;
    document.getElementById('editAtendente').value = agendamento.atendente;
    document.getElementById('editStatus').value = agendamento.status;
    document.getElementById('editCidade').value = agendamento.cidade;
    document.getElementById('editLinkCoordenadas').value = agendamento.linkCoordenadas || '';
    document.getElementById('editObservacoes').value = agendamento.observacoes || '';
    
    document.getElementById('editModal').classList.add('show');
}

// Fechar modal de edição
function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    editingAgendamento = null;
}

// Editar agendamento
async function handleEditAgendamento(e) {
    e.preventDefault();
    console.log('handleEditAgendamento called');
    
    if (!editingAgendamento) {
        console.error('Nenhum agendamento sendo editado');
        showToast('Erro: Nenhum agendamento selecionado para edição', 'error');
        return;
    }
    
    console.log('Editing agendamento:', editingAgendamento);
    
    try {
        const coordenadas = document.getElementById('editLinkCoordenadas').value || '';
        
        const updatedData = {
            id: editingAgendamento.id,
            data: document.getElementById('editData').value,
            horario: document.getElementById('editHorario').value,
            nomeCliente: document.getElementById('editNomeCliente').value,
            numeroContato: document.getElementById('editNumeroContato').value,
            // O campo atendente não é incluído para preservar o valor original
            status: document.getElementById('editStatus').value,
            cidade: document.getElementById('editCidade').value,
            linkCoordenadas: coordenadas.trim(),
            observacoes: document.getElementById('editObservacoes').value || '',
            prioridade: calculatePriority(document.getElementById('editData').value, document.getElementById('editHorario').value),
            // Preservar dados originais importantes
            criadoPor: editingAgendamento.criadoPor,
            criadoEm: editingAgendamento.criadoEm,
            compartilhadoPor: editingAgendamento.compartilhadoPor,
            compartilhadoEm: editingAgendamento.compartilhadoEm,
            concluidoPor: editingAgendamento.concluidoPor,
            concluidoEm: editingAgendamento.concluidoEm,
            canceladoPor: editingAgendamento.canceladoPor,
            canceladoEm: editingAgendamento.canceladoEm,
            motivoCancelamento: editingAgendamento.motivoCancelamento
        };
        
        console.log('Dados para atualização:', updatedData);
        
        const result = await ipcRenderer.invoke('updateAgendamento', updatedData);
        console.log('Update result:', result);
        
        await loadAgendamentos();
        closeEditModal();
        
        if (window.TTSNotifications) {
            window.TTSNotifications.agendamentoAtualizado(updatedData.nomeCliente);
        }
        showToast('Agendamento atualizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao editar agendamento:', error);
        showToast(`Erro ao editar agendamento: ${error.message}`, 'error');
    }
}

// Abrir modal de cancelamento
function openCancelModal(id) {
    cancelingAgendamento = agendamentos.find(a => a.id === id);
    if (!cancelingAgendamento) return;
    
    document.getElementById('cancelModal').classList.add('show');
}

// Fechar modal de cancelamento
function closeCancelModal() {
    document.getElementById('cancelModal').classList.remove('show');
    document.getElementById('cancelReason').value = '';
    cancelingAgendamento = null;
}

// Cancelar agendamento
async function handleCancelAgendamento(e) {
    e.preventDefault();
    
    if (!cancelingAgendamento) {
        console.error('Nenhum agendamento sendo cancelado');
        return;
    }
    
    const reason = document.getElementById('cancelReason').value;
    const currentUser = window.currentUser ? window.currentUser.displayName : document.getElementById('userName').textContent;
    
    // Salvar referência antes de limpar
    const agendamentoParaCancelar = cancelingAgendamento;
    
    try {
        await ipcRenderer.invoke('updateAgendamento', {
            id: agendamentoParaCancelar.id,
            status: 'Cancelado',
            motivoCancelamento: reason,
            canceladoPor: currentUser,
            canceladoEm: new Date().toISOString()
        });
        
        await loadAgendamentos();
        closeCancelModal();
        
        // Notificação TTS
        if (window.TTSNotifications) {
            window.TTSNotifications.agendamentoCancelado(agendamentoParaCancelar.nomeCliente);
        }
        
        console.log(`Agendamento de ${agendamentoParaCancelar.nomeCliente} cancelado com sucesso!`);
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
    }
}



// Painéis do header
function toggleSoundPanel() {
    const panel = document.getElementById('soundPanel');
    panel.classList.toggle('show');
}

function closeSoundPanel() {
    document.getElementById('soundPanel').classList.remove('show');
}

// Controles de som
function updateTTSSettings() {
    const enabled = document.getElementById('ttsEnabled').checked;
    localStorage.setItem('ttsEnabled', enabled);
}

function updateVolume() {
    const volume = document.getElementById('volumeSlider').value;
    document.getElementById('volumeValue').textContent = volume + '%';
    localStorage.setItem('ttsVolume', volume);
}

function testTTS() {
    if (window.TTSNotifications) {
        window.TTSNotifications.teste();
    }
}

// Logout
function handleLogout() {
    showCustomConfirm('Sair do Sistema', 'Tem certeza que deseja sair?', () => {
        ipcRenderer.invoke('logout');
    });
}

// Função de confirmação personalizada
function showCustomConfirm(title, message, onConfirm, onCancel = null) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const titleElement = document.getElementById('confirmTitle');
        const messageElement = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        
        if (!modal || !titleElement || !messageElement || !okBtn || !cancelBtn) {
            console.error('Elementos do modal de confirmação não encontrados');
            resolve(false);
            return;
        }
        
        // Configurar conteúdo
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Mostrar modal
        modal.classList.add('show');
        
        // Função para fechar modal
        const closeModal = (result) => {
            modal.classList.remove('show');
            resolve(result);
            
            if (result && onConfirm) {
                onConfirm();
            } else if (!result && onCancel) {
                onCancel();
            }
        };
        
        // Event listeners
        const handleOk = () => {
            closeModal(true);
        };
        
        const handleCancel = () => {
            closeModal(false);
        };
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        };
        
        // Adicionar event listeners
        okBtn.addEventListener('click', handleOk, { once: true });
        cancelBtn.addEventListener('click', handleCancel, { once: true });
        document.addEventListener('keydown', handleEscape);
        modal.addEventListener('click', handleOutsideClick);
        
        // Focar no botão cancelar por padrão
        cancelBtn.focus();
        
        // Limpar event listeners quando modal fechar
        const cleanup = () => {
            document.removeEventListener('keydown', handleEscape);
            modal.removeEventListener('click', handleOutsideClick);
        };
        
        // Adicionar cleanup ao fechar
        const originalCloseModal = closeModal;
        closeModal = (result) => {
            cleanup();
            originalCloseModal(result);
        };
    });
}

// Substituir confirm() padrão por nossa versão personalizada
window.confirm = function(message) {
    return showCustomConfirm('Confirmação', message);
};

// Tornar a função global para uso em outros arquivos
window.showCustomConfirm = showCustomConfirm;

// Verificar agendamentos esquecidos periodicamente
setInterval(() => {
    checkForgottenAgendamentos();
}, 60000); // Verificar a cada minuto

function checkForgottenAgendamentos() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    agendamentos.forEach(agendamento => {
        if (agendamento.data === today && 
            agendamento.status !== 'Concluído' && 
            agendamento.status !== 'Cancelado' &&
            agendamento.horario < currentTime) {
            
            const timeDiff = now - new Date(`${agendamento.data}T${agendamento.horario}`);
            const minutesLate = Math.floor(timeDiff / (1000 * 60));
            
            if (minutesLate > 0 && minutesLate % 15 === 0) { // Avisar a cada 15 minutos
                if (window.TTSNotifications) {
                    window.TTSNotifications.agendamentoAtrasado(agendamento.nomeCliente, minutesLate);
                }
            }
        }
    });
}

// Mostrar notificação


// Modal de localização
let map = null;
let currentMapCoordinates = null;

function openLocationModal(coordinates) {
    console.log('=== INÍCIO openLocationModal ===');
    console.log('Coordenadas recebidas:', coordinates);

    // Verificar se as coordenadas estão presentes
    if (!coordinates || typeof coordinates !== 'string') {
        showToast('Coordenadas não fornecidas', 'error');
        return;
    }

    // Parsear coordenadas (formato: "lat,lng" ou "lat, lng")
    const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    if (isNaN(lat) || isNaN(lng)) {
        showToast('Coordenadas inválidas', 'error');
        return;
    }

    const modal = document.getElementById('locationModal');
    const coordinatesSpan = document.getElementById('currentCoordinates');
    const citySpan = document.getElementById('currentCity');
    if (!modal || !coordinatesSpan || !citySpan) {
        showToast('Erro ao abrir o modal de localização', 'error');
        return;
    }

    coordinatesSpan.textContent = `${lat},${lng}`;
    citySpan.textContent = 'Carregando...';
    modal.classList.add('show');

    // Buscar nome da cidade usando reverse geocoding
    fetchCityName(lat, lng).then(cityName => {
        citySpan.textContent = cityName;
    }).catch(error => {
        console.error('Erro ao buscar nome da cidade:', error);
        citySpan.textContent = 'Localização desconhecida';
    });

    setTimeout(() => {
        initializeMap(`${lat},${lng}`);
    }, 100);

    console.log('=== FIM openLocationModal ===');
}

function closeLocationModal() {
    const modal = document.getElementById('locationModal');
    modal.classList.remove('show');
    
    // Destruir o mapa para evitar problemas
    if (map) {
        map.remove();
        map = null;
        currentMapCoordinates = null;
    }
}

function initializeMap(coordinates) {
    console.log('=== INÍCIO initializeMap ===');
    console.log('Coordenadas recebidas:', coordinates);
    
    // Verificar se o Leaflet está disponível
    if (typeof L === 'undefined') {
        console.error('Leaflet não está carregado');
        showToast('Erro: Biblioteca de mapa não carregada', 'error');
        return;
    }
    
    // Destruir mapa existente se houver
    if (map) {
        console.log('Destruindo mapa existente...');
        map.remove();
        map = null;
    }
    
    // Parsear coordenadas (formato: "lat,lng" ou "lat, lng")
    const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    console.log('Coordenadas parseadas:', { lat, lng });
    
    if (isNaN(lat) || isNaN(lng)) {
        console.error('Coordenadas inválidas após parsing');
        showToast('Coordenadas inválidas', 'error');
        return;
    }
    
    currentMapCoordinates = [lat, lng];
    console.log('Coordenadas atuais definidas:', currentMapCoordinates);
    
    // Verificar se o elemento do mapa existe
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Elemento do mapa não encontrado');
        showToast('Erro: Elemento do mapa não encontrado', 'error');
        return;
    }
    
    try {
        // Inicializar mapa
        console.log('Inicializando mapa Leaflet...');
        map = L.map('map', {
            zoomControl: false, // Remover controles padrão
            attributionControl: false // Remover atribuição padrão
        }).setView([lat, lng], 16); // Zoom mais próximo para melhor visualização
        
        console.log('Mapa inicializado com sucesso');
        
        // Adicionar camada do OpenStreetMap
        console.log('Adicionando camada do OpenStreetMap...');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        console.log('Camada do OpenStreetMap adicionada');
        
        // Criar ícone personalizado para o marcador
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%);
                    width: 40px;
                    height: 40px;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: 4px solid white;
                    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                ">
                    <div style="
                        color: white;
                        font-size: 16px;
                        font-weight: bold;
                        transform: rotate(45deg);
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        console.log('Ícone personalizado criado');
        
        // Adicionar marcador personalizado
        const marker = L.marker([lat, lng], { icon: customIcon })
            .addTo(map)
            .openPopup();
        
        console.log('Marcador adicionado e popup aberto');
        
        // Forçar redimensionamento do mapa
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                console.log('Mapa redimensionado');
            }
        }, 200);
        
        console.log('=== FIM initializeMap (SUCESSO) ===');
        
    } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
        showToast('Erro ao carregar o mapa: ' + error.message, 'error');
    }
}

// Função para buscar o nome da cidade usando reverse geocoding
async function fetchCityName(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
        const data = await response.json();
        
        if (data.address) {
            // Priorizar cidade, depois município, depois localidade
            const cityName = data.address.city || 
                           data.address.town || 
                           data.address.municipality || 
                           data.address.locality || 
                           data.address.village ||
                           data.address.county ||
                           'Localização desconhecida';
            
            return cityName;
        }
        
        return 'Localização desconhecida';
    } catch (error) {
        console.error('Erro na busca de cidade:', error);
        return 'Localização desconhecida';
    }
}

function openInGoogleMaps() {
    const coordinates = document.getElementById('currentCoordinates').textContent;
    const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    
    if (!isNaN(lat) && !isNaN(lng)) {
        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        require('electron').shell.openExternal(googleMapsUrl);
    } else {
        showToast('Coordenadas inválidas', 'error');
    }
}
function copyToClipboard(text) {
    // Verificar se o texto existe
    if (!text || text.trim() === '') {
        showToast('Nenhum contato para copiar', 'warning');
        return;
    }

    // Tentar usar a API moderna do clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text.trim()).then(() => {
            showToast(`Contato ${text.trim()} copiado para a área de transferência!`, 'success');
        }).catch(err => {
            console.error('Erro ao copiar com clipboard API:', err);
            // Fallback para método antigo
            fallbackCopyToClipboard(text);
        });
    } else {
        // Fallback para navegadores mais antigos
        fallbackCopyToClipboard(text);
    }
}

// Função fallback para copiar texto
function fallbackCopyToClipboard(text) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text.trim();
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            showToast(`Contato ${text.trim()} copiado para a área de transferência!`, 'success');
        } else {
            showToast('Erro ao copiar contato', 'error');
        }
    } catch (err) {
        console.error('Erro no fallback de cópia:', err);
        showToast('Erro ao copiar contato', 'error');
    }
}

// Funções globais para os botões dos cards
window.concluirAgendamento = concluirAgendamento;
window.openEditModal = openEditModal;
window.openCancelModal = openCancelModal;
window.copyToClipboard = copyToClipboard;
window.openLocationModal = openLocationModal;

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Listener para fechar modal com ESC e atalho de limpeza automática
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const notificationsPanel = document.getElementById('notificationsPanel');
            if (notificationsPanel && notificationsPanel.style.display === 'block') {
                if (window.notificationSystem) {
                    window.notificationSystem.closePanel();
                }
            }
        }
        
        // Atalho Ctrl+Shift+Delete para limpeza automática
        if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
            e.preventDefault();
            quickAutoClear();
        }
    });
    
    // Event listeners para notificações
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => {

        });
    }
    
    const closeNotificationsBtn = document.getElementById('closeNotificationsBtn');
    if (closeNotificationsBtn) {
        closeNotificationsBtn.addEventListener('click', () => {
            
        });
    }
    
    const markAllReadBtn = document.getElementById('markAllReadBtn');

    
    // Carregar notificações ao inicializar

    

});

// ===== SISTEMA DE BUSCA E FILTROS =====

// Variáveis globais para busca
let searchQuery = '';
let activeFilters = {};
let filteredAgendamentos = [];

// Configurar event listeners da barra de busca
function setupSearchEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearch');
    const toggleFiltersBtn = document.getElementById('toggleFilters');
    const searchFilters = document.getElementById('searchFilters');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const clearDataBtn = document.getElementById('clearDataBtn');

    if (searchInput) {
        // Busca em tempo real
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            performSearch();
            updateClearSearchButton();
        });

        // Busca ao pressionar Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            performSearch();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            filteredAgendamentos = []; // Limpar resultados filtrados
            filterAgendamentos(); // Mostrar todos os agendamentos
            updateClearSearchButton();
        });
    }

    if (toggleFiltersBtn) {
        toggleFiltersBtn.addEventListener('click', () => {
            toggleAdvancedFilters();
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            applyAdvancedFilters();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            clearAdvancedFilters();
        });
    }

    // Fechar filtros ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            hideAdvancedFilters();
        }
    });
}

// Atualizar botão de limpar busca
function updateClearSearchButton() {
    const clearSearchBtn = document.getElementById('clearSearch');
    const searchInput = document.getElementById('searchInput');
    
    if (clearSearchBtn && searchInput) {
        clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
    }
}

// Realizar busca
function performSearch() {
    console.log('=== INÍCIO performSearch ===');
    console.log('searchQuery:', searchQuery);
    console.log('activeFilters:', activeFilters);
    
    if (!agendamentos || agendamentos.length === 0) {
        console.log('Nenhum agendamento disponível');
        filteredAgendamentos = [];
        filterAgendamentos();
        return;
    }

    let results = [...agendamentos];

    // Aplicar busca por texto
    if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        console.log('Aplicando busca por texto:', query);
        results = results.filter(agendamento => {
            const matches = (
                agendamento.nomeCliente?.toLowerCase().includes(query) ||
                agendamento.numeroContato?.toLowerCase().includes(query) ||
                agendamento.atendente?.toLowerCase().includes(query) ||
                agendamento.cidade?.toLowerCase().includes(query) ||
                agendamento.status?.toLowerCase().includes(query) ||
                agendamento.observacoes?.toLowerCase().includes(query) ||
                agendamento.data?.includes(query) ||
                agendamento.horario?.includes(query)
            );
            console.log(`Agendamento ${agendamento.nomeCliente}: ${matches ? 'MATCH' : 'NO MATCH'}`);
            return matches;
        });
        console.log('Resultados após busca por texto:', results.length);
    }

    // Aplicar filtros avançados
    if (Object.keys(activeFilters).length > 0) {
        console.log('Aplicando filtros avançados');
        results = applyFiltersToResults(results);
        console.log('Resultados após filtros:', results.length);
    }

    filteredAgendamentos = results;
    console.log('Chamando filterAgendamentos com', filteredAgendamentos.length, 'resultados');
    filterAgendamentos();

    // Enviar busca via WebSocket se conectado
    if (window.wsClient && window.wsClient.isConnected && searchQuery) {
        window.wsClient.sendSearchQuery(searchQuery, activeFilters);
    }
    
    console.log('=== FIM performSearch ===');
}

// Aplicar filtros aos resultados
function applyFiltersToResults(results) {
    return results.filter(agendamento => {
        // Filtro por status
        if (activeFilters.status && agendamento.status !== activeFilters.status) {
            return false;
        }

        // Filtro por cidade
        if (activeFilters.cidade && agendamento.cidade !== activeFilters.cidade) {
            return false;
        }

        // Filtro por atendente
        if (activeFilters.atendente && !agendamento.atendente?.toLowerCase().includes(activeFilters.atendente.toLowerCase())) {
            return false;
        }

        // Filtro por data início
        if (activeFilters.dataInicio && agendamento.data < activeFilters.dataInicio) {
            return false;
        }

        // Filtro por data fim
        if (activeFilters.dataFim && agendamento.data > activeFilters.dataFim) {
            return false;
        }

        return true;
    });
}

// Mostrar/ocultar filtros avançados
function toggleAdvancedFilters() {
    const searchFilters = document.getElementById('searchFilters');
    const toggleBtn = document.getElementById('toggleFilters');
    
    if (searchFilters.classList.contains('show')) {
        hideAdvancedFilters();
    } else {
        showAdvancedFilters();
    }
}

function showAdvancedFilters() {
    const searchFilters = document.getElementById('searchFilters');
    const toggleBtn = document.getElementById('toggleFilters');
    
    searchFilters.classList.add('show');
    toggleBtn.classList.add('active');
}

function hideAdvancedFilters() {
    const searchFilters = document.getElementById('searchFilters');
    const toggleBtn = document.getElementById('toggleFilters');
    
    searchFilters.classList.remove('show');
    toggleBtn.classList.remove('active');
}

// Aplicar filtros avançados
function applyAdvancedFilters() {
    const filterStatus = document.getElementById('filterStatus').value;
    const filterCidade = document.getElementById('filterCidade').value;
    const filterAtendente = document.getElementById('filterAtendente').value;
    const filterDataInicio = document.getElementById('filterDataInicio').value;
    const filterDataFim = document.getElementById('filterDataFim').value;

    activeFilters = {};

    if (filterStatus) activeFilters.status = filterStatus;
    if (filterCidade) activeFilters.cidade = filterCidade;
    if (filterAtendente) activeFilters.atendente = filterAtendente;
    if (filterDataInicio) activeFilters.dataInicio = filterDataInicio;
    if (filterDataFim) activeFilters.dataFim = filterDataFim;

    performSearch();
    hideAdvancedFilters();

    // Mostrar toast com filtros aplicados
    const filterCount = Object.keys(activeFilters).length;
    if (filterCount > 0) {
        showToast(`${filterCount} filtro(s) aplicado(s)`, 'info');
    }
}

// Limpar filtros avançados
function clearAdvancedFilters() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterCidade').value = '';
    document.getElementById('filterAtendente').value = '';
    document.getElementById('filterDataInicio').value = '';
    document.getElementById('filterDataFim').value = '';

    activeFilters = {};
    filteredAgendamentos = []; // Limpar resultados filtrados
    filterAgendamentos(); // Mostrar todos os agendamentos
    hideAdvancedFilters();

    showToast('Filtros limpos', 'info');
}

// ===== SISTEMA DE LIMPEZA DE DADOS =====

// Função para limpeza automática rápida (sem modal)
async function quickAutoClear() {
    try {
        const cleaner = window.dataCleaner;
        const result = await cleaner.clearAllDataNoConfirm();
        
        if (result && result.success) {
            // Recarregar dados
            await loadAgendamentos();
            
            // Atualizar estatísticas se disponível
            if (typeof updateDataStats === 'function') {
                updateDataStats();
            }
            
            console.log(`[SUCCESS] Limpeza automática: ${result.deletedCount} agendamentos removidos`);
        } else {
            throw new Error(result?.error || 'Erro desconhecido na limpeza automática');
        }
    } catch (error) {
        console.error('❌ Erro na limpeza automática:', error);
        showToast(`Erro na limpeza automática: ${error.message}`, 'error');
    }
}

// Mostrar modal de confirmação para limpeza de dados (DESABILITADO - Lixeira agora funciona diretamente)
/*
function showClearDataModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content clear-data-modal">
            <div class="modal-header">
                <h3>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Limpar Dados de Agendamento
                </h3>
                <button type="button" class="close-modal" onclick="closeClearDataModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="warning-message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10.29 3.86L1.82 18C1.64751 18.3024 1.55492 18.6453 1.55492 18.995C1.55492 19.3447 1.64751 19.6876 1.82 19.99C1.99249 20.2924 2.23862 20.5386 2.53902 20.7111C2.83942 20.8836 3.18234 20.9761 3.53 20.98H20.47C20.8177 20.9761 21.1606 20.8836 21.461 20.7111C21.7614 20.5386 22.0075 20.2924 22.18 19.99C22.3525 19.6876 22.4451 19.3447 22.4451 18.995C22.4451 18.6453 22.3525 18.3024 22.18 18L13.71 3.86C13.5375 3.55764 13.2914 3.31148 12.991 3.13898C12.6906 2.96648 12.3477 2.87389 11.998 2.87389C11.6483 2.87389 11.3054 2.96648 11.005 3.13898C10.7046 3.31148 10.4585 3.55764 10.286 3.86H10.29Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <strong>Atenção:</strong> Esta ação não pode ser desfeita!
                </div>
                <p>Escolha o tipo de limpeza que deseja realizar:</p>
                
                <div class="clear-options">
                    <div class="clear-option">
                        <input type="radio" id="clearOld" name="clearType" value="old">
                        <label for="clearOld">
                            <div class="option-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                    <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="option-content">
                                <strong>Limpar agendamentos antigos</strong>
                                <span>Remove agendamentos com mais de 30 dias</span>
                            </div>
                        </label>
                    </div>
                    
                    <div class="clear-option">
                        <input type="radio" id="clearCompleted" name="clearType" value="completed">
                        <label for="clearCompleted">
                            <div class="option-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4905 2.02168 11.3363C2.16356 9.18203 2.99721 7.13214 4.39828 5.49883C5.79935 3.86553 7.69279 2.72636 9.79619 2.24223C11.8996 1.75809 14.1003 1.95185 16.07 2.79999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="option-content">
                                <strong>Limpar agendamentos concluídos</strong>
                                <span>Remove todos os agendamentos concluídos</span>
                            </div>
                        </label>
                    </div>
                    
                    <div class="clear-option">
                        <input type="radio" id="clearCanceled" name="clearType" value="canceled">
                        <label for="clearCanceled">
                            <div class="option-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <div class="option-content">
                                <strong>Limpar agendamentos cancelados</strong>
                                <span>Remove todos os agendamentos cancelados</span>
                            </div>
                        </label>
                    </div>
                    
                    <div class="clear-option">
                        <input type="radio" id="clearDuplicates" name="clearType" value="duplicates">
                        <label for="clearDuplicates">
                            <div class="option-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="option-content">
                                <strong>Remover duplicatas</strong>
                                <span>Remove agendamentos duplicados</span>
                            </div>
                        </label>
                    </div>
                    
                    <div class="clear-option danger">
                        <input type="radio" id="clearAll" name="clearType" value="all">
                        <label for="clearAll">
                            <div class="option-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M10.29 3.86L1.82 18C1.64751 18.3024 1.55492 18.6453 1.55492 18.995C1.55492 19.3447 1.64751 19.6876 1.82 19.99C1.99249 20.2924 2.23862 20.5386 2.53902 20.7111C2.83942 20.8836 3.18234 20.9761 3.53 20.98H20.47C20.8177 20.9761 21.1606 20.8836 21.461 20.7111C21.7614 20.5386 22.0075 20.2924 22.18 19.99C22.3525 19.6876 22.4451 19.3447 22.4451 18.995C22.4451 18.6453 22.3525 18.3024 22.18 18L13.71 3.86C13.5375 3.55764 13.2914 3.31148 12.991 3.13898C12.6906 2.96648 12.3477 2.87389 11.998 2.87389C11.6483 2.87389 11.3054 2.96648 11.005 3.13898C10.7046 3.31148 10.4585 3.55764 10.286 3.86H10.29Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="option-content">
                                <strong>⚠️ Limpar todos os dados</strong>
                                <span>Remove TODOS os agendamentos</span>
                            </div>
                        </label>
                    </div>
                    
                    <div class="clear-option auto-clear">
                        <input type="radio" id="clearAllAuto" name="clearType" value="auto">
                        <label for="clearAllAuto">
                            <div class="option-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <circle cx="18" cy="6" r="3" fill="#28a745"/>
                                </svg>
                            </div>
                            <div class="option-content">
                                <strong>🗑️ Lixeira Automática</strong>
                                <span>Remove TODOS os agendamentos SEM confirmação</span>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class="data-stats" id="dataStats">
                    <h4>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Estatísticas dos Dados:
                    </h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Total:</span>
                            <span class="stat-value" id="totalCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Hoje:</span>
                            <span class="stat-value" id="todayCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Futuros:</span>
                            <span class="stat-value" id="futureCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Concluídos:</span>
                            <span class="stat-value" id="completedCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Cancelados:</span>
                            <span class="stat-value" id="canceledCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Antigos (>30d):</span>
                            <span class="stat-value" id="oldCount">0</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeClearDataModal()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Cancelar
                </button>
                <button type="button" class="btn btn-danger" onclick="confirmClearData()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Limpar Dados
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    updateDataStats();

    // Adicionar estilos específicos para o modal
    const style = document.createElement('style');
    style.textContent = `
        .clear-data-modal {
            max-width: 600px;
            width: 90%;
        }
        
        .warning-message {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 15px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            margin-bottom: 20px;
            color: #856404;
        }
        
        .warning-message svg {
            color: #f39c12;
            flex-shrink: 0;
        }
        
        .clear-options {
            margin: 20px 0;
        }
        
        .clear-option {
            margin-bottom: 15px;
            border: 2px solid var(--border-color);
            border-radius: 12px;
            transition: all 0.3s ease;
            overflow: hidden;
        }
        
        .clear-option:hover {
            border-color: #FF6B00;
            background: var(--bg-secondary);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 107, 0, 0.15);
        }
        
        .clear-option.danger:hover {
            border-color: #e74c3c;
            box-shadow: 0 4px 12px rgba(231, 76, 60, 0.15);
        }
        
        .clear-option input[type="radio"] {
            position: absolute;
            opacity: 0;
            pointer-events: none;
        }
        
        .clear-option input[type="radio"]:checked + label {
            background: linear-gradient(135deg, #FF6B00, #ff8533);
            color: white;
            border-color: #FF6B00;
        }
        
        .clear-option.danger input[type="radio"]:checked + label {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            border-color: #e74c3c;
        }
        
        .clear-option input[type="radio"]:checked + label .option-icon svg {
            color: white;
        }
        
        .clear-option input[type="radio"]:checked + label .option-content strong,
        .clear-option input[type="radio"]:checked + label .option-content span {
            color: white;
        }
        
        .clear-option label {
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            margin: 0;
            transition: all 0.3s ease;
        }
        
        .option-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            background: var(--bg-secondary);
            border-radius: 12px;
            flex-shrink: 0;
            transition: all 0.3s ease;
        }
        
        .option-icon svg {
            color: #FF6B00;
            transition: all 0.3s ease;
        }
        
        .clear-option.danger .option-icon svg {
            color: #e74c3c;
        }
        
        .option-content {
            flex: 1;
        }
        
        .option-content strong {
            display: block;
            margin-bottom: 5px;
            color: var(--text-primary);
            font-size: 16px;
            font-weight: 600;
        }
        
        .option-content span {
            color: var(--text-secondary);
            font-size: 14px;
            line-height: 1.4;
        }
        
        .data-stats {
            background: var(--bg-secondary);
            padding: 25px;
            border-radius: 12px;
            margin-top: 25px;
            border: 1px solid var(--border-color);
        }
        
        .data-stats h4 {
            margin-bottom: 20px;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 18px;
            font-weight: 600;
        }
        
        .data-stats h4 svg {
            color: #FF6B00;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: var(--bg-primary);
            border-radius: 8px;
            border: 1px solid var(--border-color);
            transition: all 0.3s ease;
        }
        
        .stat-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .stat-label {
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .stat-value {
            font-weight: 700;
            color: var(--text-primary);
            font-size: 16px;
        }
        
        .modal-header h3 {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 20px;
            font-weight: 600;
        }
        
        .modal-header h3 svg {
            color: #FF6B00;
        }
        
        .close-modal {
            background: none;
            border: none;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            color: var(--text-secondary);
        }
        
        .close-modal:hover {
            background: var(--bg-secondary);
            color: var(--text-primary);
        }
        
        .modal-footer .btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            font-weight: 600;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .modal-footer .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .modal-footer .btn svg {
            flex-shrink: 0;
        }
        
        @media (max-width: 768px) {
            .clear-data-modal {
                width: 95%;
                max-width: none;
            }
            
            .option-icon {
                width: 40px;
                height: 40px;
            }
            
            .clear-option label {
                padding: 15px;
                gap: 12px;
            }
            
            .stats-grid {
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 10px;
            }
            
            .stat-item {
                padding: 10px 12px;
            }
            
            .modal-footer {
                flex-direction: column;
                gap: 10px;
            }
            
            .modal-footer .btn {
                width: 100%;
                justify-content: center;
            }
        }
    `;
    document.head.appendChild(style);
}
*/

// Fechar modal de limpeza de dados (DESABILITADO - Lixeira agora funciona diretamente)
/*
function closeClearDataModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}
*/

// Atualizar estatísticas dos dados (DESABILITADO - Não é mais necessário)
/*
function updateDataStats() {
    if (!agendamentos) return;

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const stats = {
        total: agendamentos.length,
        today: agendamentos.filter(a => a.data === today).length,
        future: agendamentos.filter(a => a.data > today).length,
        completed: agendamentos.filter(a => a.status === 'Concluído').length,
        canceled: agendamentos.filter(a => a.status === 'Cancelado').length,
        old: agendamentos.filter(a => a.data < thirtyDaysAgoStr).length
    };

    document.getElementById('totalCount').textContent = stats.total;
    document.getElementById('todayCount').textContent = stats.today;
    document.getElementById('futureCount').textContent = stats.future;
    document.getElementById('completedCount').textContent = stats.completed;
    document.getElementById('canceledCount').textContent = stats.canceled;
    document.getElementById('oldCount').textContent = stats.old;
}
*/

// Confirmar limpeza de dados (DESABILITADO - Lixeira agora funciona diretamente)
/*
async function confirmClearData() {
    const selectedType = document.querySelector('input[name="clearType"]:checked');
    
    if (!selectedType) {
        showToast('Por favor, selecione um tipo de limpeza', 'error');
        return;
    }

    const clearType = selectedType.value;
    const button = document.querySelector('.btn-danger');
    
    // Desabilitar botão durante o processamento
    button.disabled = true;
    button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
        </svg>
        Processando...
    `;
    
    try {
        let result;
        let message;
        let confirmMessage = '';

        // Definir mensagens de confirmação específicas
        switch (clearType) {
            case 'old':
                confirmMessage = 'Tem certeza que deseja remover todos os agendamentos com mais de 30 dias?';
                break;
            case 'completed':
                confirmMessage = 'Tem certeza que deseja remover todos os agendamentos concluídos?';
                break;
            case 'canceled':
                confirmMessage = 'Tem certeza que deseja remover todos os agendamentos cancelados?';
                break;
            case 'duplicates':
                confirmMessage = 'Tem certeza que deseja remover agendamentos duplicados?';
                break;
            case 'all':
                confirmMessage = '⚠️ ATENÇÃO: Isso irá remover TODOS os agendamentos permanentemente. Esta ação não pode ser desfeita. Tem certeza absoluta?';
                break;
            case 'auto':
                // Limpeza automática - sem confirmação
                confirmMessage = null;
                break;
        }

        // Confirmar ação (exceto para limpeza automática)
        if (confirmMessage) {
            const confirmed = await showCustomConfirm('Limpeza de Dados', confirmMessage);
            if (!confirmed) {
                // Restaurar botão
                button.disabled = false;
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Limpar Dados
                `;
                return;
            }
        }

        // Usar a instância global do data cleaner
        const cleaner = window.dataCleaner;

        switch (clearType) {
            case 'old':
                result = await cleaner.clearOldAppointments();
                message = `${result.deletedCount} agendamentos antigos removidos com sucesso`;
                break;
            case 'completed':
                result = await cleaner.clearCompletedAppointments();
                message = `${result.deletedCount} agendamentos concluídos removidos com sucesso`;
                break;
            case 'canceled':
                result = await cleaner.clearCanceledAppointments();
                message = `${result.deletedCount} agendamentos cancelados removidos com sucesso`;
                break;
            case 'duplicates':
                result = await cleaner.removeDuplicateAppointments();
                message = `${result.deletedCount} agendamentos duplicados removidos com sucesso`;
                break;
            case 'all':
                result = await cleaner.clearAllData();
                message = 'Todos os dados foram removidos com sucesso';
                break;
            case 'auto':
                result = await cleaner.clearAllDataNoConfirm();
                message = `🗑️ Lixeira automática: ${result.deletedCount} agendamentos removidos`;
                break;
            default:
                throw new Error('Tipo de limpeza inválido');
        }

        if (result && result.success) {
            showToast(message, 'success');
            
            // Recarregar dados
            await loadAgendamentos();
            
            // Atualizar estatísticas
            updateDataStats();
            
            // Fechar modal após um pequeno delay
            setTimeout(() => {
                closeClearDataModal();
            }, 1500);
        } else {
            throw new Error(result?.error || 'Erro desconhecido ao limpar dados');
        }

    } catch (error) {
        console.error('Erro ao limpar dados:', error);
        showToast(`Erro ao limpar dados: ${error.message}`, 'error');
        
        // Restaurar botão
        button.disabled = false;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Limpar Dados
        `;
    }
}
*/

// ===== INTEGRAÇÃO WEBSOCKET =====

// Inicializar WebSocket
async function initializeWebSocket() {
    try {
        if (!window.wsClient) {
            console.warn('Cliente WebSocket não encontrado');
            return;
        }

        console.log('[INFO] Tentando conectar ao WebSocket...');
        
        // Primeiro, verificar se o servidor está rodando
        const isServerRunning = await checkWebSocketServer();
        
        if (!isServerRunning) {
            console.log('[INFO] Servidor WebSocket não está rodando, tentando iniciar automaticamente...');
            
            // Tentar iniciar o servidor automaticamente
            const serverStarted = await startWebSocketServer();
            
            if (!serverStarted) {
                console.warn('[WARNING] Não foi possível iniciar o servidor WebSocket automaticamente');
                safeShowToast('Modo offline - servidor WebSocket não disponível', 'warning');
                return;
            }
        }
        
        // Conectar ao servidor com retry
        const connected = await connectWithRetry();
        
        if (connected && window.currentUser) {
            // Autenticar usuário
            window.wsClient.authenticate(
                window.currentUser.id,
                window.currentUser.username,
                window.currentUser.displayName || window.currentUser.username
            );

            // Configurar manipuladores de eventos
            setupWebSocketEventHandlers();
            
            console.log('[SUCCESS] WebSocket inicializado com sucesso');
            safeShowToast('Conectado ao servidor em tempo real', 'success');
        } else {
            console.warn('[WARNING] Não foi possível conectar ao WebSocket');
            safeShowToast('Modo offline - algumas funcionalidades limitadas', 'warning');
        }
    } catch (error) {
        console.error('[ERROR] Erro ao inicializar WebSocket:', error);
        safeShowToast('Erro de conexão - funcionando em modo offline', 'warning');
    }
}

// Verificar se o servidor WebSocket está rodando
async function checkWebSocketServer() {
    return new Promise((resolve) => {
        // Usar fetch para verificar se o servidor está respondendo
        fetch('http://localhost:3002/status', {
            method: 'GET',
            mode: 'no-cors', // Para evitar problemas de CORS
            cache: 'no-cache'
        })
        .then(response => {
            console.log('[INFO] Servidor WebSocket está respondendo');
            resolve(true);
        })
        .catch(error => {
            console.log('[INFO] Servidor WebSocket não está respondendo:', error.message);
            resolve(false);
        });
        
        // Timeout de 3 segundos
        setTimeout(() => {
            resolve(false);
        }, 3000);
    });
}

// Iniciar servidor WebSocket automaticamente
async function startWebSocketServer() {
    try {
        console.log('[INFO] Iniciando servidor WebSocket automaticamente...');
        
        // Usar IPC para comunicar com o processo principal do Electron
        const result = await window.ipcRenderer.invoke('startWebSocketServer');
        
        if (result && result.success) {
            console.log('[SUCCESS] Servidor WebSocket iniciado automaticamente');
            return true;
        } else {
            console.error('[ERROR] Falha ao iniciar servidor WebSocket:', result?.error || 'Erro desconhecido');
            return false;
        }
    } catch (error) {
        console.error('[ERROR] Erro ao iniciar servidor WebSocket:', error);
        return false;
    }
}

// Conectar com retry
async function connectWithRetry(maxAttempts = 3) {
    // Primeiro, tentar a porta padrão (3002) com mais tentativas
    console.log('[INFO] Tentando conectar na porta padrão 3002...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`[INFO] Tentativa ${attempt}/${maxAttempts} na porta 3002`);
            
            const connected = await window.wsClient.connect('http://localhost:3002');
            if (connected) {
                console.log('[SUCCESS] Conectado na porta padrão 3002');
                safeShowToast('WebSocket conectado com sucesso', 'success');
                return true;
            }
            
            // Aguardar antes da próxima tentativa
            if (attempt < maxAttempts) {
                console.log(`[INFO] Aguardando 3 segundos antes da próxima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
        } catch (error) {
            console.error(`[ERROR] Tentativa ${attempt} na porta 3002 falhou:`, error);
            
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }
    
    // Se a porta padrão falhou, tentar portas alternativas (apenas uma vez)
    console.log('[INFO] Porta padrão falhou, tentando portas alternativas...');
    const alternativePorts = [3003, 3004, 3005];
    
    for (const port of alternativePorts) {
        try {
            console.log(`[INFO] Tentando porta alternativa ${port}`);
            const connected = await window.wsClient.connect(`http://localhost:${port}`);
            if (connected) {
                console.log(`[SUCCESS] Conectado na porta alternativa ${port}`);
                safeShowToast(`WebSocket conectado na porta ${port}`, 'success');
                return true;
            }
        } catch (portError) {
            console.log(`[INFO] Porta ${port} não disponível`);
        }
    }
    
    // Se chegou aqui, nenhuma porta funcionou
    console.warn('[WARNING] Não foi possível conectar em nenhuma porta');
    safeShowToast('Modo offline - WebSocket não disponível', 'warning');
    return false;
}

// Configurar manipuladores de eventos WebSocket
function setupWebSocketEventHandlers() {
    if (!window.wsClient) return;

    // Atualização de agendamento
    window.wsClient.on('agendamento:update', (data) => {
        handleWebSocketAgendamentoUpdate(data);
    });

    // Agendamento compartilhado
    window.wsClient.on('agendamento:shared', (data) => {
        handleWebSocketAgendamentoShared(data);
    });

    // Resultados de busca
    window.wsClient.on('search:results', (data) => {
        handleWebSocketSearchResults(data);
    });

    // Notificação recebida

}

// Manipular atualização de agendamento via WebSocket
function handleWebSocketAgendamentoUpdate(data) {
    const { action, agendamento } = data;
    
    switch (action) {
        case 'created':
            // Adicionar novo agendamento se não existir
            if (!agendamentos.find(a => a.id === agendamento.id)) {
                agendamentos.push(agendamento);
                filterAgendamentos();
                showToast(`Novo agendamento: ${agendamento.cliente}`, 'info');
            }
            break;
            
        case 'updated':
            // Atualizar agendamento existente
            const index = agendamentos.findIndex(a => a.id === agendamento.id);
            if (index !== -1) {
                agendamentos[index] = agendamento;
                filterAgendamentos();
                showToast(`Agendamento atualizado: ${agendamento.cliente}`, 'info');
            }
            break;
            
        case 'deleted':
            // Remover agendamento
            const deleteIndex = agendamentos.findIndex(a => a.id === agendamento.id);
            if (deleteIndex !== -1) {
                agendamentos.splice(deleteIndex, 1);
                filterAgendamentos();
                showToast(`Agendamento removido: ${agendamento.cliente}`, 'info');
            }
            break;
    }
}

// Manipular agendamento compartilhado via WebSocket
function handleWebSocketAgendamentoShared(data) {
    const { agendamento, fromUser, message } = data;
    
    // Adicionar agendamento compartilhado
    if (!agendamentos.find(a => a.id === agendamento.id)) {
        agendamentos.push(agendamento);
        filterAgendamentos();
    }
    
    // Mostrar notificação
    showToast(`Agendamento compartilhado por ${fromUser.displayName}`, 'info');
}

// Manipular resultados de busca via WebSocket
function handleWebSocketSearchResults(data) {
    const { results, query } = data;
    
    if (query === searchQuery) {
        // Atualizar resultados se a consulta ainda for atual
        filteredAgendamentos = results;
        filterAgendamentos();
    }
}

// Função global para atualizar agendamento via WebSocket
window.updateAgendamentoFromWebSocket = handleWebSocketAgendamentoUpdate;

// Função global para atualizar resultados de busca
window.updateSearchResults = handleWebSocketSearchResults;

// ===== INICIALIZAÇÃO =====

// Adicionar inicialização da busca e WebSocket ao DOMContentLoaded existente
document.addEventListener('DOMContentLoaded', function() {
    // Configurar event listeners da busca
    setupSearchEventListeners();
    
    // Inicializar sistema de notificações se ainda não foi inicializado
    if (!window.notificationSystem && window.NotificationSystem) {
        window.notificationSystem = new window.NotificationSystem();
        console.log('[SUCCESS] Sistema de notificações inicializado');
        
        // Função de teste para notificações
        window.testNotification = function() {
            window.notificationSystem.createNotification({
                type: 'urgent',
                title: 'Teste de Notificação',
                message: 'Esta é uma notificação de teste para verificar os botões',
                data: {
                    cliente: 'Cliente Teste',
                    telefone: '(11) 99999-9999',
                    data: new Date().toISOString().split('T')[0],
                    hora: '14:30'
                },
                actions: [
                    {
                        id: 'test1',
                        label: 'Botão 1',
                        style: 'primary',
                        callback: (data) => {
                            alert('Botão 1 funcionou! Cliente: ' + data.cliente);
                        }
                    },
                    {
                        id: 'test2',
                        label: 'Botão 2',
                        style: 'secondary',
                        callback: (data) => {
                            alert('Botão 2 funcionou! Telefone: ' + data.telefone);
                        }
                    },
                    {
                        id: 'test3',
                        label: 'Fechar',
                        style: 'secondary',
                        callback: () => {
                            console.log('Notificação fechada pelo botão');
                        }
                    }
                ],
                persistent: true
            });
        };
        
        console.log('[INFO] Para testar as notificações, digite: testNotification() no console');
    } else if (window.notificationSystem) {
        console.log('[INFO] Sistema de notificações já inicializado');
    } else {
        console.warn('[WARNING] NotificationSystem não encontrado');
    }
    
    // Inicializar WebSocket após um pequeno delay
    setTimeout(() => {
        initializeWebSocket();
    }, 2000);
});