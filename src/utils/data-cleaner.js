/**
 * Utilitário para limpeza de dados de agendamento
 * Fornece funcionalidades para limpar dados antigos, duplicados e inválidos
 */

class DataCleaner {
    constructor() {
        this.cleanupRules = {
            // Dias para considerar agendamentos como antigos
            oldAppointmentDays: 365,
            // Dias para considerar notificações como antigas
            oldNotificationDays: 90,
            // Máximo de agendamentos por usuário
            maxAppointmentsPerUser: 1000,
            // Máximo de notificações por usuário
            maxNotificationsPerUser: 100
        };
    }

    /**
     * Limpar todos os dados de agendamento
     */
    clearAllData() {
        try {
            const { ipcRenderer } = require('electron');
            
            // Obter contagem antes da limpeza
            const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            const deletedCount = agendamentos.length;

            // Limpar agendamentos
            localStorage.removeItem('agendamentos');
            sessionStorage.removeItem('agendamentos');

            // Limpar notificações
            localStorage.removeItem('notifications');
            sessionStorage.removeItem('notifications');

            // Limpar cache de busca
            localStorage.removeItem('searchCache');
            localStorage.removeItem('searchHistory');

            // Limpar dados temporários
            localStorage.removeItem('tempData');
            localStorage.removeItem('draftAgendamentos');

            console.log('[SUCCESS] Todos os dados foram limpos com sucesso');
            
            // Mostrar notificação de sucesso
            if (window.showNotification) {
                window.showNotification({
                    type: 'success',
                    title: 'Dados Limpos',
                    message: 'Todos os dados de agendamento foram removidos com sucesso',
                    duration: 3000
                });
            }

            return { success: true, deletedCount, message: 'Dados limpos com sucesso' };
        } catch (error) {
            console.error('❌ Erro ao limpar dados:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Limpar todos os dados sem confirmação (para lixeira automática)
     */
    clearAllDataNoConfirm() {
        try {
            // Obter contagem antes da limpeza
            const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            const deletedCount = agendamentos.length;

            // Limpar agendamentos
            localStorage.removeItem('agendamentos');
            sessionStorage.removeItem('agendamentos');

            // Limpar notificações
            localStorage.removeItem('notifications');
            sessionStorage.removeItem('notifications');

            // Limpar cache de busca
            localStorage.removeItem('searchCache');
            localStorage.removeItem('searchHistory');

            // Limpar dados temporários
            localStorage.removeItem('tempData');
            localStorage.removeItem('draftAgendamentos');

            console.log(`[SUCCESS] Lixeira automática: ${deletedCount} agendamentos removidos`);
            
            // Mostrar notificação de sucesso sem modal
            if (window.showToast) {
                window.showToast(`🗑️ Lixeira: ${deletedCount} agendamentos removidos automaticamente`, 'success');
            }

            // Atualizar interface se disponível
            if (window.loadAgendamentos) {
                window.loadAgendamentos();
            }

            return { success: true, deletedCount, message: `${deletedCount} agendamentos removidos pela lixeira` };
        } catch (error) {
            console.error('❌ Erro na limpeza automática:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Limpar agendamentos antigos
     */
    clearOldAppointments(daysOld = null) {
        try {
            const days = daysOld || this.cleanupRules.oldAppointmentDays;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            const initialCount = agendamentos.length;

            // Filtrar agendamentos antigos
            const filteredAgendamentos = agendamentos.filter(agendamento => {
                const agendamentoDate = new Date(agendamento.data);
                return agendamentoDate >= cutoffDate;
            });

            const removedCount = initialCount - filteredAgendamentos.length;

            if (removedCount > 0) {
                localStorage.setItem('agendamentos', JSON.stringify(filteredAgendamentos));
                
                console.log(`[SUCCESS] ${removedCount} agendamentos antigos removidos`);
                
                if (window.showNotification) {
                    window.showNotification({
                        type: 'info',
                        title: 'Limpeza Concluída',
                        message: `${removedCount} agendamentos antigos (${days}+ dias) foram removidos`,
                        duration: 4000
                    });
                }

                // Atualizar interface
                if (window.loadAgendamentos) {
                    window.loadAgendamentos();
                }
            } else {
                if (window.showNotification) {
                    window.showNotification({
                        type: 'info',
                        title: 'Nenhum Dado Antigo',
                        message: 'Não foram encontrados agendamentos antigos para remover',
                        duration: 3000
                    });
                }
            }

            return { success: true, deletedCount: removedCount, message: `${removedCount} agendamentos removidos` };
        } catch (error) {
            console.error('❌ Erro ao limpar agendamentos antigos:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Limpar notificações antigas
     */
    clearOldNotifications(daysOld = null) {
        try {
            const days = daysOld || this.cleanupRules.oldNotificationDays;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
            const initialCount = notifications.length;

            // Filtrar notificações antigas
            const filteredNotifications = notifications.filter(notification => {
                const notificationDate = new Date(notification.createdAt);
                return notificationDate >= cutoffDate;
            });

            const removedCount = initialCount - filteredNotifications.length;

            if (removedCount > 0) {
                localStorage.setItem('notifications', JSON.stringify(filteredNotifications));
                
                console.log(`[SUCCESS] ${removedCount} notificações antigas removidas`);
                
                if (window.showNotification) {
                    window.showNotification({
                        type: 'info',
                        title: 'Notificações Limpas',
                        message: `${removedCount} notificações antigas foram removidas`,
                        duration: 3000
                    });
                }
            }

            return { success: true, removedCount, message: `${removedCount} notificações removidas` };
        } catch (error) {
            console.error('❌ Erro ao limpar notificações antigas:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Limpar agendamentos concluídos
     */
    clearCompletedAppointments() {
        try {
            const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            const initialCount = agendamentos.length;

            // Filtrar agendamentos concluídos
            const filteredAgendamentos = agendamentos.filter(agendamento => {
                return agendamento.status !== 'concluido' && agendamento.status !== 'Concluído';
            });

            const removedCount = initialCount - filteredAgendamentos.length;

            if (removedCount > 0) {
                localStorage.setItem('agendamentos', JSON.stringify(filteredAgendamentos));
                
                console.log(`[SUCCESS] ${removedCount} agendamentos concluídos removidos`);
                
                if (window.showNotification) {
                    window.showNotification({
                        type: 'success',
                        title: 'Agendamentos Concluídos Removidos',
                        message: `${removedCount} agendamentos concluídos foram removidos`,
                        duration: 4000
                    });
                }

                // Atualizar interface
                if (window.loadAgendamentos) {
                    window.loadAgendamentos();
                }
            } else {
                if (window.showNotification) {
                    window.showNotification({
                        type: 'info',
                        title: 'Nenhum Agendamento Concluído',
                        message: 'Não foram encontrados agendamentos concluídos para remover',
                        duration: 3000
                    });
                }
            }

            return { success: true, deletedCount: removedCount, message: `${removedCount} agendamentos concluídos removidos` };
        } catch (error) {
            console.error('❌ Erro ao limpar agendamentos concluídos:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Limpar agendamentos cancelados
     */
    clearCanceledAppointments() {
        try {
            const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            const initialCount = agendamentos.length;

            // Filtrar agendamentos cancelados
            const filteredAgendamentos = agendamentos.filter(agendamento => {
                return agendamento.status !== 'cancelado' && agendamento.status !== 'Cancelado';
            });

            const removedCount = initialCount - filteredAgendamentos.length;

            if (removedCount > 0) {
                localStorage.setItem('agendamentos', JSON.stringify(filteredAgendamentos));
                
                console.log(`[SUCCESS] ${removedCount} agendamentos cancelados removidos`);
                
                if (window.showNotification) {
                    window.showNotification({
                        type: 'success',
                        title: 'Agendamentos Cancelados Removidos',
                        message: `${removedCount} agendamentos cancelados foram removidos`,
                        duration: 4000
                    });
                }

                // Atualizar interface
                if (window.loadAgendamentos) {
                    window.loadAgendamentos();
                }
            } else {
                if (window.showNotification) {
                    window.showNotification({
                        type: 'info',
                        title: 'Nenhum Agendamento Cancelado',
                        message: 'Não foram encontrados agendamentos cancelados para remover',
                        duration: 3000
                    });
                }
            }

            return { success: true, deletedCount: removedCount, message: `${removedCount} agendamentos cancelados removidos` };
        } catch (error) {
            console.error('❌ Erro ao limpar agendamentos cancelados:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remover agendamentos duplicados
     */
    removeDuplicateAppointments() {
        try {
            const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            const initialCount = agendamentos.length;

            // Criar mapa para detectar duplicatas
            const uniqueAgendamentos = [];
            const seenKeys = new Set();

            agendamentos.forEach(agendamento => {
                // Criar chave única baseada em dados importantes
                const key = `${agendamento.data}_${agendamento.hora}_${agendamento.cliente}_${agendamento.userId}`;
                
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    uniqueAgendamentos.push(agendamento);
                }
            });

            const removedCount = initialCount - uniqueAgendamentos.length;

            if (removedCount > 0) {
                localStorage.setItem('agendamentos', JSON.stringify(uniqueAgendamentos));
                
                console.log(`[SUCCESS] ${removedCount} agendamentos duplicados removidos`);
                
                if (window.showNotification) {
                    window.showNotification({
                        type: 'success',
                        title: 'Duplicatas Removidas',
                        message: `${removedCount} agendamentos duplicados foram removidos`,
                        duration: 4000
                    });
                }

                // Atualizar interface
                if (window.loadAgendamentos) {
                    window.loadAgendamentos();
                }
            } else {
                if (window.showNotification) {
                    window.showNotification({
                        type: 'info',
                        title: 'Sem Duplicatas',
                        message: 'Não foram encontrados agendamentos duplicados',
                        duration: 3000
                    });
                }
            }

            return { success: true, deletedCount: removedCount, message: `${removedCount} duplicatas removidas` };
        } catch (error) {
            console.error('❌ Erro ao remover duplicatas:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Limpar dados inválidos
     */
    clearInvalidData() {
        try {
            const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            const initialCount = agendamentos.length;

            // Filtrar agendamentos inválidos
            const validAgendamentos = agendamentos.filter(agendamento => {
                // Verificar campos obrigatórios
                if (!agendamento.id || !agendamento.data || !agendamento.hora || !agendamento.cliente) {
                    return false;
                }

                // Verificar formato de data
                const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dataRegex.test(agendamento.data)) {
                    return false;
                }

                // Verificar formato de hora
                const horaRegex = /^\d{2}:\d{2}$/;
                if (!horaRegex.test(agendamento.hora)) {
                    return false;
                }

                // Verificar se a data é válida
                const date = new Date(agendamento.data);
                if (isNaN(date.getTime())) {
                    return false;
                }

                return true;
            });

            const removedCount = initialCount - validAgendamentos.length;

            if (removedCount > 0) {
                localStorage.setItem('agendamentos', JSON.stringify(validAgendamentos));
                
                console.log(`[SUCCESS] ${removedCount} agendamentos inválidos removidos`);
                
                if (window.showNotification) {
                    window.showNotification({
                        type: 'warning',
                        title: 'Dados Inválidos Removidos',
                        message: `${removedCount} agendamentos com dados inválidos foram removidos`,
                        duration: 4000
                    });
                }

                // Atualizar interface
                if (window.loadAgendamentos) {
                    window.loadAgendamentos();
                }
            }

            return { success: true, removedCount, message: `${removedCount} dados inválidos removidos` };
        } catch (error) {
            console.error('❌ Erro ao limpar dados inválidos:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Otimizar armazenamento
     */
    optimizeStorage() {
        try {
            let totalSaved = 0;

            // Compactar agendamentos
            const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            const compactedAgendamentos = agendamentos.map(agendamento => {
                // Remover campos desnecessários ou vazios
                const compact = { ...agendamento };
                
                // Remover campos vazios
                Object.keys(compact).forEach(key => {
                    if (compact[key] === '' || compact[key] === null || compact[key] === undefined) {
                        delete compact[key];
                    }
                });

                return compact;
            });

            const originalSize = JSON.stringify(agendamentos).length;
            const compactedSize = JSON.stringify(compactedAgendamentos).length;
            const savedBytes = originalSize - compactedSize;
            totalSaved += savedBytes;

            if (savedBytes > 0) {
                localStorage.setItem('agendamentos', JSON.stringify(compactedAgendamentos));
            }

            // Limpar cache antigo
            const cacheKeys = ['searchCache', 'tempData', 'draftAgendamentos'];
            cacheKeys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        if (Array.isArray(parsed) && parsed.length === 0) {
                            localStorage.removeItem(key);
                            totalSaved += data.length;
                        }
                    } catch (e) {
                        // Se não conseguir parsear, remover
                        localStorage.removeItem(key);
                        totalSaved += data.length;
                    }
                }
            });

            console.log(`[SUCCESS] Armazenamento otimizado - ${totalSaved} bytes economizados`);
            
            if (window.showNotification) {
                window.showNotification({
                    type: 'success',
                    title: 'Armazenamento Otimizado',
                    message: `${Math.round(totalSaved / 1024)} KB de espaço foram liberados`,
                    duration: 3000
                });
            }

            return { success: true, savedBytes: totalSaved, message: 'Armazenamento otimizado' };
        } catch (error) {
            console.error('❌ Erro ao otimizar armazenamento:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Executar limpeza completa (recomendada)
     */
    performFullCleanup() {
        try {
            console.log('🧹 Iniciando limpeza completa...');

            const results = {
                oldAppointments: this.clearOldAppointments(),
                oldNotifications: this.clearOldNotifications(),
                duplicates: this.removeDuplicateAppointments(),
                invalidData: this.clearInvalidData(),
                optimization: this.optimizeStorage()
            };

            const totalRemoved = 
                (results.oldAppointments.removedCount || 0) +
                (results.duplicates.removedCount || 0) +
                (results.invalidData.removedCount || 0);

            console.log('[SUCCESS] Limpeza completa finalizada');
            
            if (window.showNotification) {
                window.showNotification({
                    type: 'success',
                    title: 'Limpeza Completa Finalizada',
                    message: `${totalRemoved} itens removidos e armazenamento otimizado`,
                    duration: 5000
                });
            }

            return { success: true, results, totalRemoved };
        } catch (error) {
            console.error('❌ Erro na limpeza completa:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obter estatísticas de dados
     */
    getDataStats() {
        try {
            const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');

            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

            const stats = {
                total: {
                    agendamentos: agendamentos.length,
                    notifications: notifications.length
                },
                recent: {
                    agendamentos: agendamentos.filter(a => new Date(a.createdAt || a.data) >= thirtyDaysAgo).length,
                    notifications: notifications.filter(n => new Date(n.createdAt) >= thirtyDaysAgo).length
                },
                old: {
                    agendamentos: agendamentos.filter(a => new Date(a.data) < ninetyDaysAgo).length,
                    notifications: notifications.filter(n => new Date(n.createdAt) < ninetyDaysAgo).length
                },
                storage: {
                    agendamentos: JSON.stringify(agendamentos).length,
                    notifications: JSON.stringify(notifications).length,
                    total: JSON.stringify(agendamentos).length + JSON.stringify(notifications).length
                }
            };

            return stats;
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return null;
        }
    }
}

// Instância global do limpador de dados
window.dataCleaner = new DataCleaner();

// Exportar para uso em Node.js/Electron
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataCleaner;
}