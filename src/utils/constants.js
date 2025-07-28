/**
 * Constantes da aplicação
 */

// Configurações gerais
export const APP_CONFIG = {
    NAME: 'UBY Sistemas - Gestão de Agendamentos',
    VERSION: '1.0.0',
    AUTHOR: 'UBY Sistemas',
    DESCRIPTION: 'Sistema profissional de gestão de agendamentos'
};

// Configurações de interface
export const UI_CONFIG = {
    THEME: {
        PRIMARY_COLOR: '#667eea',
        SECONDARY_COLOR: '#764ba2',
        SUCCESS_COLOR: '#28a745',
        ERROR_COLOR: '#dc3545',
        WARNING_COLOR: '#ffc107',
        INFO_COLOR: '#17a2b8'
    },
    
    ANIMATIONS: {
        FAST: 200,
        NORMAL: 300,
        SLOW: 500
    },
    
    BREAKPOINTS: {
        MOBILE: 768,
        TABLET: 1024,
        DESKTOP: 1200
    }
};

// Configurações de dados
export const DATA_CONFIG = {
    STORAGE_KEYS: {
        USER_DATA: 'userData',
        APPOINTMENTS: 'appointments',
        NOTIFICATIONS: 'notifications',
        SETTINGS: 'appSettings',
        THEME: 'userTheme'
    },
    
    FILE_PATHS: {
        USERS: 'src/data/users.json',
        NOTIFICATIONS: 'src/data/notifications.json'
    },
    
    LIMITS: {
        MAX_APPOINTMENTS_PER_DAY: 50,
        MAX_NOTIFICATION_HISTORY: 100,
        MAX_BACKUP_FILES: 10
    }
};

// Configurações de validação
export const VALIDATION_CONFIG = {
    PASSWORD: {
        MIN_LENGTH: 6,
        MAX_LENGTH: 50,
        REQUIRE_UPPERCASE: false,
        REQUIRE_LOWERCASE: false,
        REQUIRE_NUMBERS: false,
        REQUIRE_SYMBOLS: false
    },
    
    APPOINTMENT: {
        MIN_DURATION: 15, // minutos
        MAX_DURATION: 480, // 8 horas
        ADVANCE_BOOKING_DAYS: 365,
        WORKING_HOURS: {
            START: '08:00',
            END: '18:00'
        }
    },
    
    NOTIFICATION: {
        MAX_TITLE_LENGTH: 100,
        MAX_MESSAGE_LENGTH: 500,
        DEFAULT_DURATION: 5000
    }
};

// Configurações de formato
export const FORMAT_CONFIG = {
    DATE: {
        DISPLAY: 'DD/MM/YYYY',
        INPUT: 'YYYY-MM-DD',
        STORAGE: 'YYYY-MM-DD'
    },
    
    TIME: {
        DISPLAY: 'HH:mm',
        INPUT: 'HH:mm',
        STORAGE: 'HH:mm'
    },
    
    PHONE: {
        MASK: '(99) 99999-9999',
        REGEX: /^\(\d{2}\) \d{4,5}-\d{4}$/
    }
};

// Status e estados
export const STATUS = {
    APPOINTMENT: {
        SCHEDULED: 'agendado',
        CONFIRMED: 'confirmado',
        COMPLETED: 'concluido',
        CANCELLED: 'cancelado',
        NO_SHOW: 'faltou'
    },
    
    NOTIFICATION: {
        UNREAD: 'nao_lida',
        READ: 'lida',
        ARCHIVED: 'arquivada'
    },
    
    USER: {
        ACTIVE: 'ativo',
        INACTIVE: 'inativo',
        BLOCKED: 'bloqueado'
    }
};

// Tipos de eventos
export const EVENT_TYPES = {
    APPOINTMENT_CREATED: 'appointment_created',
    APPOINTMENT_UPDATED: 'appointment_updated',
    APPOINTMENT_DELETED: 'appointment_deleted',
    APPOINTMENT_CONFIRMED: 'appointment_confirmed',
    APPOINTMENT_CANCELLED: 'appointment_cancelled',
    
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    USER_CREATED: 'user_created',
    USER_UPDATED: 'user_updated',
    
    NOTIFICATION_CREATED: 'notification_created',
    NOTIFICATION_READ: 'notification_read',
    NOTIFICATION_DELETED: 'notification_deleted',
    
    BACKUP_CREATED: 'backup_created',
    BACKUP_RESTORED: 'backup_restored',
    
    UPDATE_AVAILABLE: 'update_available',
    UPDATE_DOWNLOADED: 'update_downloaded',
    UPDATE_INSTALLED: 'update_installed'
};

// Mensagens padrão
export const MESSAGES = {
    SUCCESS: {
        APPOINTMENT_CREATED: 'Agendamento criado com sucesso!',
        APPOINTMENT_UPDATED: 'Agendamento atualizado com sucesso!',
        APPOINTMENT_DELETED: 'Agendamento excluído com sucesso!',
        APPOINTMENT_CONFIRMED: 'Agendamento confirmado!',
        
        USER_CREATED: 'Usuário criado com sucesso!',
        USER_UPDATED: 'Usuário atualizado com sucesso!',
        
        BACKUP_CREATED: 'Backup criado com sucesso!',
        BACKUP_RESTORED: 'Backup restaurado com sucesso!',
        
        DATA_EXPORTED: 'Dados exportados com sucesso!',
        CACHE_CLEARED: 'Cache limpo com sucesso!'
    },
    
    ERROR: {
        GENERIC: 'Ocorreu um erro inesperado. Tente novamente.',
        NETWORK: 'Erro de conexão. Verifique sua internet.',
        VALIDATION: 'Dados inválidos. Verifique os campos.',
        PERMISSION: 'Você não tem permissão para esta ação.',
        NOT_FOUND: 'Item não encontrado.',
        
        APPOINTMENT_CONFLICT: 'Já existe um agendamento neste horário.',
        APPOINTMENT_PAST: 'Não é possível agendar para datas passadas.',
        
        LOGIN_FAILED: 'Usuário ou senha incorretos.',
        SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
        
        FILE_NOT_FOUND: 'Arquivo não encontrado.',
        FILE_CORRUPTED: 'Arquivo corrompido ou inválido.',
        
        UPDATE_FAILED: 'Falha ao atualizar. Tente novamente.',
        BACKUP_FAILED: 'Falha ao criar backup.'
    },
    
    WARNING: {
        UNSAVED_CHANGES: 'Você tem alterações não salvas. Deseja continuar?',
        DELETE_CONFIRMATION: 'Esta ação não pode ser desfeita. Continuar?',
        OVERWRITE_CONFIRMATION: 'Arquivo já existe. Deseja sobrescrever?',
        
        APPOINTMENT_SOON: 'Você tem um agendamento em breve.',
        STORAGE_FULL: 'Espaço de armazenamento quase cheio.',
        
        UPDATE_AVAILABLE: 'Nova atualização disponível!',
        RESTART_REQUIRED: 'Reinicialização necessária para aplicar mudanças.'
    },
    
    INFO: {
        LOADING: 'Carregando...',
        SAVING: 'Salvando...',
        PROCESSING: 'Processando...',
        SEARCHING: 'Buscando...',
        
        NO_APPOINTMENTS: 'Nenhum agendamento encontrado.',
        NO_NOTIFICATIONS: 'Nenhuma notificação.',
        NO_RESULTS: 'Nenhum resultado encontrado.',
        
        FIRST_TIME: 'Bem-vindo! Configure suas preferências.',
        BACKUP_RECOMMENDED: 'Recomendamos fazer backup regularmente.',
        
        UPDATE_CHECKING: 'Verificando atualizações...',
        UPDATE_DOWNLOADING: 'Baixando atualização...',
        UPDATE_INSTALLING: 'Instalando atualização...'
    }
};

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
    TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    },
    
    POSITIONS: {
        TOP_RIGHT: 'top-right',
        TOP_LEFT: 'top-left',
        BOTTOM_RIGHT: 'bottom-right',
        BOTTOM_LEFT: 'bottom-left',
        TOP_CENTER: 'top-center',
        BOTTOM_CENTER: 'bottom-center'
    },
    
    DURATIONS: {
        SHORT: 3000,
        MEDIUM: 5000,
        LONG: 8000,
        PERSISTENT: 0
    }
};

// Configurações de backup
export const BACKUP_CONFIG = {
    AUTO_BACKUP: {
        ENABLED: true,
        INTERVAL: 24 * 60 * 60 * 1000, // 24 horas
        MAX_FILES: 7 // manter 7 backups
    },
    
    EXPORT_FORMATS: {
        JSON: 'json',
        CSV: 'csv',
        PDF: 'pdf'
    },
    
    INCLUDE_DATA: {
        APPOINTMENTS: true,
        USERS: true,
        NOTIFICATIONS: true,
        SETTINGS: true
    }
};

// Configurações de log
export const LOG_CONFIG = {
    LEVELS: {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    },
    
    MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_LOG_FILES: 5,
    
    CATEGORIES: {
        SYSTEM: 'system',
        USER: 'user',
        APPOINTMENT: 'appointment',
        NOTIFICATION: 'notification',
        UPDATE: 'update',
        BACKUP: 'backup'
    }
};

// Configurações de performance
export const PERFORMANCE_CONFIG = {
    DEBOUNCE_DELAY: 300,
    THROTTLE_LIMIT: 100,
    
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100
    },
    
    CACHE: {
        TTL: 5 * 60 * 1000, // 5 minutos
        MAX_ENTRIES: 100
    }
};

// Exportar todas as constantes
export default {
    APP_CONFIG,
    UI_CONFIG,
    DATA_CONFIG,
    VALIDATION_CONFIG,
    FORMAT_CONFIG,
    STATUS,
    EVENT_TYPES,
    MESSAGES,
    NOTIFICATION_CONFIG,
    BACKUP_CONFIG,
    LOG_CONFIG,
    PERFORMANCE_CONFIG
};