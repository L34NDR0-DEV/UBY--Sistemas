/**
 * Configurações do Sistema de Atualização
 * Este arquivo centraliza todas as configurações relacionadas ao sistema de atualização
 */

const UPDATE_CONFIG = {
    // Configurações do servidor de atualização
    server: {
        // URL base para verificação de atualizações (GitHub Releases)
        baseUrl: 'https://api.github.com/repos/L34NDR0-DEV/UBY--Sistemas/releases',
        
        // Timeout para requisições (em milissegundos)
        timeout: 30000,
        
        // Intervalo para verificação automática (em milissegundos)
        // 24 horas = 24 * 60 * 60 * 1000
        autoCheckInterval: 24 * 60 * 60 * 1000,
        
        // Habilitar verificação automática na inicialização
        autoCheckOnStartup: true
    },
    
    // Configurações da interface do usuário
    ui: {
        // Mostrar notificações de toast
        showToastNotifications: true,
        
        // Duração das notificações (em milissegundos)
        toastDuration: 5000,
        
        // Posição do botão de atualização no header
        buttonPosition: 'right',
        
        // Texto do botão de atualização
        buttonText: 'Verificar Atualizações',
        
        // Ícone do botão de atualização
        buttonIcon: '🔄'
    },
    
    // Configurações de download
    download: {
        // Diretório temporário para downloads
        tempDir: 'temp-updates',
        
        // Tamanho do buffer para download (em bytes)
        bufferSize: 1024 * 1024, // 1MB
        
        // Número máximo de tentativas de download
        maxRetries: 3,
        
        // Intervalo entre tentativas (em milissegundos)
        retryInterval: 5000
    },
    
    // Configurações de instalação
    installation: {
        // Reiniciar automaticamente após instalação
        autoRestart: true,
        
        // Tempo de espera antes do reinício (em milissegundos)
        restartDelay: 3000,
        
        // Fazer backup da versão atual antes da instalação
        createBackup: true,
        
        // Diretório para backups
        backupDir: 'backups'
    },
    
    // Configurações de logging
    logging: {
        // Nível de log (debug, info, warn, error)
        level: 'info',
        
        // Salvar logs em arquivo
        saveToFile: true,
        
        // Arquivo de log
        logFile: 'update.log',
        
        // Tamanho máximo do arquivo de log (em bytes)
        maxLogSize: 10 * 1024 * 1024 // 10MB
    },
    
    // Configurações de segurança
    security: {
        // Verificar assinatura digital dos arquivos
        verifySignature: true,
        
        // Verificar hash dos arquivos baixados
        verifyHash: true,
        
        // Permitir apenas atualizações de versões superiores
        allowDowngrade: false
    },
    
    // Mensagens personalizadas
    messages: {
        checkingForUpdates: 'Verificando atualizações...',
        updateAvailable: 'Nova atualização disponível!',
        noUpdatesAvailable: 'Você já está usando a versão mais recente.',
        downloadingUpdate: 'Baixando atualização...',
        installingUpdate: 'Instalando atualização...',
        updateComplete: 'Atualização concluída com sucesso!',
        updateError: 'Erro durante a atualização.',
        restartRequired: 'Reinicialização necessária para aplicar a atualização.'
    },
    
    // Configurações de desenvolvimento
    development: {
        // Simular atualizações em modo de desenvolvimento
        simulateUpdates: false,
        
        // Versão simulada para testes
        mockVersion: '1.1.0',
        
        // Delay simulado para operações (em milissegundos)
        mockDelay: 2000,
        
        // Habilitar logs detalhados
        verboseLogging: true
    }
};

// Função para obter configuração específica
function getConfig(path) {
    const keys = path.split('.');
    let value = UPDATE_CONFIG;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return undefined;
        }
    }
    
    return value;
}

// Função para definir configuração específica
function setConfig(path, newValue) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = UPDATE_CONFIG;
    
    for (const key of keys) {
        if (!(key in target) || typeof target[key] !== 'object') {
            target[key] = {};
        }
        target = target[key];
    }
    
    target[lastKey] = newValue;
}

// Função para validar configurações
function validateConfig() {
    const errors = [];
    
    // Validar URL do servidor
    if (!UPDATE_CONFIG.server.baseUrl) {
        errors.push('URL do servidor de atualização não configurada');
    }
    
    // Validar timeout
    if (UPDATE_CONFIG.server.timeout < 1000) {
        errors.push('Timeout muito baixo (mínimo: 1000ms)');
    }
    
    // Validar intervalo de verificação automática
    if (UPDATE_CONFIG.server.autoCheckInterval < 60000) {
        errors.push('Intervalo de verificação automática muito baixo (mínimo: 1 minuto)');
    }
    
    return errors;
}

// Exportar configurações e funções utilitárias
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        UPDATE_CONFIG,
        getConfig,
        setConfig,
        validateConfig
    };
} else {
    // Browser environment
    window.UpdateConfig = {
        UPDATE_CONFIG,
        getConfig,
        setConfig,
        validateConfig
    };
}