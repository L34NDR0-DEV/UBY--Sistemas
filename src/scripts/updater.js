// Aguardar ipcRenderer estar disponível
function getIpcRenderer() {
    const ipcRenderer = window.ipcRenderer;
    if (!ipcRenderer) {
        console.error('❌ ipcRenderer não está disponível');
        return null;
    }
    return ipcRenderer;
}

// Log para verificar se o script está sendo carregado
console.log('[UPDATER] ✅ Script updater.js carregado!');

class UpdateManager {
    constructor() {
        this.isChecking = false;
        this.isUpdating = false;
        this.isSilentCheck = false;
<<<<<<< HEAD
        this.isDisabled = false; // Sistema de atualizações ativado
=======
        this.isDisabled = false;
>>>>>>> 01a90c6129e07fa60b9510725f6f97f1cbccfb76
        this.currentVersion = '1.0.0'; // Versão padrão, será atualizada se possível
        this.errorCount = 0;
        this.maxErrors = 3;
        this.setupEventListeners();
        this.getCurrentVersion();
    }

    // Obter versão atual
    async getCurrentVersion() {
        try {
            const ipc = getIpcRenderer();
            if (ipc) {
                // Solicitar versão ao processo principal
                const version = await ipc.invoke('get-app-version');
                if (version) {
                    this.currentVersion = version;
                    console.log('[UPDATER] 📋 Versão atual:', this.currentVersion);
                }
            }
        } catch (error) {
            console.log('[UPDATER] ⚠️ Não foi possível obter a versão atual:', error);
        }
    }

    // Configurar event listeners do IPC
    setupEventListeners() {
        // Aguardar ipcRenderer estar disponível
        setTimeout(() => {
            const ipc = getIpcRenderer();
            if (!ipc) {
                console.error('[UPDATER] ❌ IPC Renderer não disponível para setup');
                return;
            }
            
            console.log('[UPDATER] 🔧 Configurando event listeners...');
            
            // Escutar eventos do processo principal
            ipc.on('update-available', (event, info) => {
                console.log('[UPDATER] ✅ Atualização disponível recebida:', info);
                this.isChecking = false;
                this.errorCount = 0; // Resetar contador de erros em caso de sucesso
                this.showUpdateDialog(info);
            });

            ipc.on('update-not-available', () => {
                console.log('[UPDATER] ℹ️ Nenhuma atualização disponível');
                this.isChecking = false;
                this.errorCount = 0; // Resetar contador de erros em caso de sucesso
                this.showNoUpdateMessage();
            });

            ipc.on('update-error', (event, error) => {
                console.log('[UPDATER] ❌ Erro de atualização recebido:', error);
                this.isChecking = false;
                
                // Incrementar contador de erros
                this.errorCount++;
                console.log(`[UPDATER] 📊 Contador de erros: ${this.errorCount}/${this.maxErrors}`);
                
                // Verificar se é um erro que deve ser ignorado
                const ignoredErrors = [
                    'No published versions on GitHub',
                    'Cannot find latest.yml',
                    'latest.yml in the latest release artifacts',
                    'HttpError: 404',
                    'ENOTFOUND',
                    'ECONNREFUSED',
                    'Network Error',
                    'timeout',
                    'ETIMEDOUT',
                    'getaddrinfo ENOTFOUND',
                    'connect ECONNREFUSED',
                    'socket hang up',
                    'read ECONNRESET'
                ];
                
                const shouldIgnore = ignoredErrors.some(ignoredError => 
                    error.message && error.message.toLowerCase().includes(ignoredError.toLowerCase())
                );
                
                if (shouldIgnore) {
                    console.log('[UPDATER] ℹ️ Erro ignorado (normal para desenvolvimento):', error.message);
                    this.showNoUpdateMessage();
                } else {
                    // Mostrar erro apenas se for um erro real que o usuário deve ver
                    const errorMessage = error.message || error.details || 'Erro desconhecido';
                    console.log('[UPDATER] ⚠️ Erro real detectado:', errorMessage);
                    this.showError('Erro ao verificar atualizações: ' + errorMessage);
                    
                    // Desabilitar atualizações se houver muitos erros
                    if (this.errorCount >= this.maxErrors) {
                        console.log('[UPDATER] 🚫 Muitos erros detectados, desabilitando sistema de atualizações');
                        this.isDisabled = true;
                        this.showToast('Sistema de atualizações temporariamente desabilitado devido a problemas de conectividade.', 'warning');
                        
                        // Re-habilitar após 30 minutos
                        setTimeout(() => {
                            this.isDisabled = false;
                            this.errorCount = 0;
                            console.log('[UPDATER] ✅ Sistema de atualizações re-habilitado');
                        }, 30 * 60 * 1000); // 30 minutos
                    }
                }
            });
            
            // Listener para verificação silenciosa
            ipc.on('update-not-available-silent', () => {
                console.log('[UPDATER] 🔇 Nenhuma atualização disponível (verificação silenciosa)');
                this.isSilentCheck = false;
            });
            
            ipc.on('download-progress', (event, progress) => {
                console.log('[UPDATER] 📥 Progresso do download:', progress);
                this.updateDownloadProgress(progress);
            });

            ipc.on('update-downloaded', () => {
                console.log('[UPDATER] ✅ Atualização baixada com sucesso');
                this.showUpdateReady();
            });
            
            console.log('[UPDATER] ✅ Event listeners configurados com sucesso');
        }, 100);
    }

    // Verificar atualizações
    async checkForUpdates() {
        console.log('[UPDATER] 🔍 checkForUpdates chamado');
        
        if (this.isChecking) {
            console.log('[UPDATER] ⏳ Já está verificando atualizações, ignorando...');
            return;
        }
        
        if (this.isDisabled) {
            console.log('[UPDATER] 🚫 Sistema de atualizações desabilitado');
            this.showToast('Sistema de atualizações temporariamente desabilitado.', 'warning');
            return;
        }
        
        this.isChecking = true;
        this.showCheckingMessage();
        
        try {
            // Solicitar verificação ao processo principal
            const ipc = getIpcRenderer();
            console.log('[UPDATER] 📡 IPC Renderer:', ipc);
            
            if (ipc) {
                console.log('[UPDATER] 📤 Enviando check-for-updates para o processo principal');
                ipc.send('check-for-updates');
                
                // Adicionar timeout para evitar que a verificação fique pendente indefinidamente
                setTimeout(() => {
                    if (this.isChecking) {
                        console.log('[UPDATER] ⏰ Timeout na verificação de atualizações');
                        this.isChecking = false;
                        this.showNoUpdateMessage();
                    }
                }, 20000); // 20 segundos de timeout
            } else {
                console.error('[UPDATER] ❌ IPC Renderer não disponível');
                this.showError('Sistema de atualizações não disponível');
                this.isChecking = false;
            }
        } catch (error) {
            console.error('[UPDATER] ❌ Erro ao verificar atualizações:', error);
            this.showError('Erro ao verificar atualizações');
            this.isChecking = false;
        }
    }

    // Mostrar mensagem de verificação
    showCheckingMessage() {
        this.showToast('Verificando atualizações...', 'info');
    }

    // Mostrar diálogo de atualização disponível
    showUpdateDialog(updateInfo) {
        const modal = document.createElement('div');
        modal.className = 'update-modal show';
        modal.innerHTML = `
            <div class="update-modal-content">
                <div class="update-header">
                    <div class="update-header-content">
                        <div class="update-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                            </svg>
                        </div>
                        <div class="update-title">
                            <h3>Nova Atualização Disponível</h3>
                            <p>Uma nova versão do sistema está pronta para instalação</p>
                        </div>
                    </div>
                    <button class="close-update-modal" aria-label="Fechar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="update-body">
                    <div class="version-comparison">
                        <div class="version-card current">
                            <div class="version-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 6v6l4 2"/>
                                </svg>
                            </div>
                            <div class="version-details">
                                <h4>Versão Atual</h4>
                                <span class="version-number">${this.currentVersion}</span>
                            </div>
                        </div>
                        <div class="version-arrow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </div>
                        <div class="version-card new">
                            <div class="version-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <div class="version-details">
                                <h4>Nova Versão</h4>
                                <span class="version-number">${updateInfo.version}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="update-info">
                        <div class="info-item">
                            <div class="info-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                            </div>
                            <span>Lançado em ${new Date(updateInfo.releaseDate).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                            })}</span>
                        </div>
                    </div>
                    
                    <div class="release-notes">
                        <div class="notes-header">
                            <div class="notes-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <polyline points="10,9 9,9 8,9"/>
                                </svg>
                            </div>
                            <h4>Novidades desta versão</h4>
                        </div>
                        <div class="release-notes-content">
                            ${updateInfo.releaseNotes || 'Melhorias gerais e correções de bugs.'}
                        </div>
                    </div>
                </div>
                <div class="update-actions">
                    <button class="btn-secondary" id="updateLater">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                        Mais Tarde
                    </button>
                    <button class="btn-primary" id="updateNow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Baixar e Instalar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalEvents(modal, updateInfo);
    }

    // Configurar eventos do modal
    setupModalEvents(modal, updateInfo) {
        modal.querySelector('.close-update-modal').addEventListener('click', () => {
            this.closeUpdateModal();
        });

        modal.querySelector('#updateLater').addEventListener('click', () => {
            this.closeUpdateModal();
        });

        modal.querySelector('#updateNow').addEventListener('click', () => {
            this.startDownload();
        });

        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeUpdateModal();
            }
        });
    }

    // Iniciar download da atualização
    startDownload() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        this.showDownloadProgress();
        
        // Solicitar download ao processo principal
        const ipc = getIpcRenderer();
        if (ipc) {
            ipc.send('download-update');
        } else {
            this.showError('Sistema de atualizações não disponível');
        }
    }

    // Mostrar progresso do download
    showDownloadProgress() {
        const modal = document.querySelector('.update-modal');
        if (modal) {
            modal.querySelector('.update-body').innerHTML = `
                <div class="update-progress">
                    <div class="progress-header">
                        <div class="progress-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </div>
                        <div class="progress-title">
                            <h4>Baixando Atualização</h4>
                            <p>Preparando a nova versão do sistema...</p>
                        </div>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" id="updateProgress" style="width: 0%">
                                <div class="progress-shine"></div>
                            </div>
                        </div>
                        <div class="progress-info">
                            <div class="progress-stats">
                                <div class="stat-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2v10M12 2l-3 3M12 2l3 3"/>
                                    </svg>
                                    <span id="progressPercent">0%</span>
                                </div>
                                <div class="stat-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                    <span id="progressSpeed">0 KB/s</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="progress-status">
                        <div class="status-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                        </div>
                        <span id="updateStatus">Iniciando download...</span>
                    </div>
                </div>
            `;
            
            // Remover botões de ação
            const actions = modal.querySelector('.update-actions');
            if (actions) {
                actions.innerHTML = `
                    <button class="btn-secondary" onclick="window.updateManager.cancelUpdate()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        Cancelar
                    </button>
                `;
            }
        }
    }

    // Atualizar progresso do download
    updateDownloadProgress(progress) {
        const progressBar = document.getElementById('updateProgress');
        const progressPercent = document.getElementById('progressPercent');
        const progressSpeed = document.getElementById('progressSpeed');
        const statusText = document.getElementById('updateStatus');

        if (progressBar) {
            progressBar.style.width = progress.percent + '%';
        }
        
        if (progressPercent) {
            progressPercent.textContent = Math.round(progress.percent) + '%';
        }
        
        if (progressSpeed && progress.bytesPerSecond) {
            const speed = this.formatBytes(progress.bytesPerSecond);
            progressSpeed.textContent = speed + '/s';
        }
        
        if (statusText) {
            const transferred = this.formatBytes(progress.transferred);
            const total = this.formatBytes(progress.total);
            statusText.textContent = `Baixando... ${transferred} de ${total}`;
        }
    }

    // Mostrar atualização pronta para instalar
    showUpdateReady() {
        const modal = document.querySelector('.update-modal');
        if (modal) {
            modal.querySelector('.update-body').innerHTML = `
                <div class="update-complete">
                    <div class="complete-header">
                        <div class="complete-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12A10 10 0 1 1 5.93 7.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="complete-title">
                            <h4>Atualização Baixada com Sucesso!</h4>
                            <p>A nova versão está pronta para ser instalada</p>
                        </div>
                    </div>
                    
                    <div class="complete-info">
                        <div class="info-card">
                            <div class="info-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <div class="info-content">
                                <h5>Pronto para Instalar</h5>
                                <p>A atualização foi baixada e está pronta para ser aplicada ao sistema.</p>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                </svg>
                            </div>
                            <div class="info-content">
                                <h5>Reinicialização Automática</h5>
                                <p>A aplicação será reiniciada automaticamente para aplicar as mudanças.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            modal.querySelector('.update-actions').innerHTML = `
                <button class="btn-secondary" onclick="window.updateManager.closeUpdateModal()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                    Instalar Depois
                </button>
                <button class="btn-primary" onclick="window.updateManager.installUpdate()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    Instalar e Reiniciar
                </button>
            `;
        }
        
        this.isUpdating = false;
        this.showToast('Atualização pronta para instalar!', 'success');
    }

    // Instalar atualização
    installUpdate() {
        const ipc = getIpcRenderer();
        if (ipc) {
            ipc.send('quit-and-install');
        }
    }

    // Cancelar atualização
    cancelUpdate() {
        const ipc = getIpcRenderer();
        if (ipc) {
            ipc.send('cancel-update');
        }
        this.closeUpdateModal();
        this.isUpdating = false;
    }

    // Fechar modal de atualização
    closeUpdateModal() {
        const modal = document.querySelector('.update-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // Mostrar mensagem de que não há atualizações
    showNoUpdateMessage() {
        // Só mostrar mensagem se não for uma verificação silenciosa
        if (!this.isSilentCheck) {
            this.showToast('Sistema atualizado! Você já possui a versão mais recente.', 'success');
        }
    }

    // Mostrar erro
    showError(message) {
        this.showToast(message, 'error');
    }

    // Mostrar toast notification
    showToast(message, type = 'info') {
        // Remover toast anterior se existir
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getToastIcon(type)}</span>
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

    // Obter ícone do toast
    getToastIcon(type) {
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

    // Formatar bytes
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

// Adicionar método para verificação silenciosa
UpdateManager.prototype.checkForUpdatesQuietly = function() {
    console.log('[UPDATER] 🔇 Verificando atualizações silenciosamente...');
    
    if (this.isDisabled) {
        console.log('[UPDATER] 🚫 Sistema de atualizações desabilitado (verificação silenciosa)');
        return;
    }
    
    this.isSilentCheck = true;
    
    const ipc = getIpcRenderer();
    if (!ipc) {
        console.log('[UPDATER] ❌ IPC não disponível para verificação silenciosa');
        this.isSilentCheck = false;
        return;
    }

    // Verificar por atualizações sem mostrar mensagens
    console.log('[UPDATER] 📤 Enviando check-for-updates-quiet para o processo principal');
    ipc.send('check-for-updates-quiet');
    
    // Resetar flag após um tempo
    setTimeout(() => {
        this.isSilentCheck = false;
        console.log('[UPDATER] 🔇 Verificação silenciosa concluída');
    }, 5000);
};

// Adicionar método para criar botão de atualização
UpdateManager.prototype.createUpdateButton = function() {
    const headerRight = document.querySelector('.header-right');
    console.log('[UPDATER] 🔍 Header right encontrado:', headerRight);
    
    if (headerRight && !document.getElementById('checkUpdatesBtn')) {
        console.log('[UPDATER] 🔧 Criando botão de atualização...');
        
        const updateBtn = document.createElement('button');
        updateBtn.className = 'header-btn update-btn';
        updateBtn.id = 'checkUpdatesBtn';
        updateBtn.title = 'Atualização Disponível - Clique para Atualizar';
        updateBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
            </svg>
            <span class="btn-text">Nova Atualização!</span>
        `;
        
        // Adicionar estilo especial para indicar atualização disponível
        updateBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        updateBtn.style.animation = 'pulse 2s infinite';
        
        updateBtn.addEventListener('click', () => {
            console.log('[UPDATER] 🔘 Botão de atualização clicado!');
            window.updateManager.checkForUpdates();
        });
        
        // Inserir antes do último botão (fechar)
        const lastBtn = headerRight.lastElementChild;
        headerRight.insertBefore(updateBtn, lastBtn);
        
        console.log('[UPDATER] ✅ Botão de atualização criado e adicionado ao header');
        
        // Mostrar notificação de atualização disponível
        this.showToast('Nova atualização disponível! Clique no botão vermelho para atualizar.', 'info');
    } else {
        console.log('[UPDATER] ⚠️ Header right não encontrado ou botão já existe');
    }
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('[UPDATER] 🚀 Inicializando sistema de atualizações...');
    
    // Criar instância global
    window.updateManager = new UpdateManager();
    console.log('[UPDATER] ✅ UpdateManager criado:', window.updateManager);
    
    // Verificar automaticamente por atualizações ao inicializar
    // O botão só será criado se houver uma atualização disponível
    setTimeout(() => {
        console.log('[UPDATER] ⏰ Iniciando verificação automática de atualizações...');
        
        // Verificar se o sistema de atualizações está habilitado
        if (window.updateManager && !window.updateManager.isDisabled) {
            console.log('[UPDATER] 🔍 Sistema habilitado, iniciando verificação silenciosa...');
            window.updateManager.checkForUpdatesQuietly();
        } else {
            console.log('[UPDATER] 🚫 Sistema de atualizações desabilitado ou não disponível');
        }
    }, 3000); // Aguardar 3 segundos após o carregamento
});