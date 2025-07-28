/**
 * Utilitários para formatação de dados
 */

class DataFormatter {
    /**
     * Formatar data para exibição
     * @param {Date|string} date - Data para formatar
     * @param {string} format - Formato desejado ('short', 'long', 'time')
     * @returns {string} Data formatada
     */
    static formatDate(date, format = 'short') {
        if (!date) return '';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        const options = {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            long: { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            },
            time: { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
            }
        };
        
        return dateObj.toLocaleDateString('pt-BR', options[format]);
    }
    
    /**
     * Formatar horário
     * @param {string} time - Horário no formato HH:MM
     * @returns {string} Horário formatado
     */
    static formatTime(time) {
        if (!time) return '';
        return time.replace(/(\d{2}):(\d{2})/, '$1h$2');
    }
    
    /**
     * Formatar telefone
     * @param {string} phone - Número de telefone
     * @returns {string} Telefone formatado
     */
    static formatPhone(phone) {
        if (!phone) return '';
        
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        
        return phone;
    }
    
    /**
     * Formatar nome próprio
     * @param {string} name - Nome para formatar
     * @returns {string} Nome formatado
     */
    static formatName(name) {
        if (!name) return '';
        
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

/**
 * Utilitários para validação de dados
 */
class DataValidator {
    /**
     * Validar email
     * @param {string} email - Email para validar
     * @returns {boolean} True se válido
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Validar telefone
     * @param {string} phone - Telefone para validar
     * @returns {boolean} True se válido
     */
    static isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    }
    
    /**
     * Validar data
     * @param {string} date - Data para validar (YYYY-MM-DD)
     * @returns {boolean} True se válida
     */
    static isValidDate(date) {
        const dateObj = new Date(date);
        return dateObj instanceof Date && !isNaN(dateObj);
    }
    
    /**
     * Validar horário
     * @param {string} time - Horário para validar (HH:MM)
     * @returns {boolean} True se válido
     */
    static isValidTime(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }
    
    /**
     * Validar se a data não é no passado
     * @param {string} date - Data para validar
     * @returns {boolean} True se não for passado
     */
    static isNotPastDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const inputDate = new Date(date);
        return inputDate >= today;
    }
}

/**
 * Utilitários para manipulação de arrays e objetos
 */
class DataUtils {
    /**
     * Ordenar array de objetos por propriedade
     * @param {Array} array - Array para ordenar
     * @param {string} property - Propriedade para ordenação
     * @param {string} direction - 'asc' ou 'desc'
     * @returns {Array} Array ordenado
     */
    static sortByProperty(array, property, direction = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];
            
            if (direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }
    
    /**
     * Filtrar array por múltiplos critérios
     * @param {Array} array - Array para filtrar
     * @param {Object} filters - Objeto com filtros
     * @returns {Array} Array filtrado
     */
    static filterByMultipleCriteria(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                const itemValue = item[key];
                
                if (!filterValue) return true;
                
                if (typeof filterValue === 'string') {
                    return itemValue.toLowerCase().includes(filterValue.toLowerCase());
                }
                
                return itemValue === filterValue;
            });
        });
    }
    
    /**
     * Agrupar array por propriedade
     * @param {Array} array - Array para agrupar
     * @param {string} property - Propriedade para agrupamento
     * @returns {Object} Objeto agrupado
     */
    static groupByProperty(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    }
    
    /**
     * Remover duplicatas de array
     * @param {Array} array - Array com possíveis duplicatas
     * @param {string} property - Propriedade para comparação (opcional)
     * @returns {Array} Array sem duplicatas
     */
    static removeDuplicates(array, property = null) {
        if (!property) {
            return [...new Set(array)];
        }
        
        const seen = new Set();
        return array.filter(item => {
            const key = item[property];
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
}

/**
 * Utilitários para localStorage
 */
class StorageUtils {
    /**
     * Salvar dados no localStorage
     * @param {string} key - Chave
     * @param {*} data - Dados para salvar
     */
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    }
    
    /**
     * Carregar dados do localStorage
     * @param {string} key - Chave
     * @param {*} defaultValue - Valor padrão se não encontrar
     * @returns {*} Dados carregados
     */
    static load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
            return defaultValue;
        }
    }
    
    /**
     * Remover item do localStorage
     * @param {string} key - Chave para remover
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
        }
    }
    
    /**
     * Limpar todo o localStorage
     */
    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Erro ao limpar localStorage:', error);
        }
    }
}

/**
 * Utilitários para debounce e throttle
 */
class PerformanceUtils {
    /**
     * Debounce - executa função após delay sem novas chamadas
     * @param {Function} func - Função para executar
     * @param {number} delay - Delay em milissegundos
     * @returns {Function} Função com debounce
     */
    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * Throttle - limita execução da função
     * @param {Function} func - Função para executar
     * @param {number} limit - Limite em milissegundos
     * @returns {Function} Função com throttle
     */
    static throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DataFormatter,
        DataValidator,
        DataUtils,
        StorageUtils,
        PerformanceUtils
    };
} else {
    window.Utils = {
        DataFormatter,
        DataValidator,
        DataUtils,
        StorageUtils,
        PerformanceUtils
    };
}