// Aguardar ipcRenderer estar disponível
function getIpcRenderer() {
    const ipcRenderer = window.ipcRenderer;
    if (!ipcRenderer) {
        console.error('ipcRenderer não está disponível');
        return null;
    }
    return ipcRenderer;
}

// Log para verificar se o script está sendo carregado
console.log('[UPDATER] Script updater.js carregado!');

class UpdateManager {
    constructor() {
        this.isChecking = false;
        this.isUpdating = false;
        this.currentVersion = '1.0.0'; // Versão padrão, será atualizada se possível
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
                }
            }
        } catch (error) {
            console.log('[UPDATER] Não foi possível obter a versão atual:', error);
        }
    }

    // Configurar event listeners do IPC
    setupEventListeners() {
        // Aguardar ipcRenderer estar disponível
        setTimeout(() => {
            const ipc = getIpcRenderer();
            if (!ipc) return;
            
            // Escutar eventos do processo principal
            ipc.on('update-available', (event, info) => {
                this.showUpdateDialog(info);
            });

            ipc.on('update-not-available', () => {
                this.showNoUpdateMessage();
            });

            ipc.on('update-error', (event, error) => {
                // Não mostrar erro se for relacionado a "no published versions"
                if (error.message && error.message.includes('No published versions on GitHub')) {
                    console.log('[UPDATER] Nenhuma versão publicada no GitHub (normal para desenvolvimento)');
                    this.showNoUpdateMessage();
                } else {
                    this.showError('Erro ao verificar atualizações: ' + error.message);
                }
            });

            ipc.on('download-progress', (event, progress) => {
                this.updateDownloadProgress(progress);
            });

            ipc.on('update-downloaded', () => {
                this.showUpdateReady();
            });
        }, 100);
    }

    // Verificar atualizações
    async checkForUpdates() {
        console.log('[UPDATER] checkForUpdates chamado');
        
        if (this.isChecking) {
            console.log('[UPDATER] Já está verificando atualizações, ignorando...');
            return;
        }
        
        this.isChecking = true;
        this.showCheckingMessage();
        
        try {
            // Solicitar verificação ao processo principal
            const ipc = getIpcRenderer();
            console.log('[UPDATER] IPC Renderer:', ipc);
            
            if (ipc) {
                console.log('[UPDATER] Enviando check-for-updates para o processo principal');
                ipc.send('check-for-updates');
            } else {
                console.error('[UPDATER] IPC Renderer não disponível');
                this.showError('Sistema de atualizações não disponível');
            }
        } catch (error) {
            console.error('Erro ao verificar atualizações:', error);
            this.showError('Erro ao verificar atualizações');
        } finally {
            setTimeout(() => {
                this.isChecking = false;
            }, 2000);
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
                    <h3>🔄 Nova Atualização Disponível</h3>
                    <button class="close-update-modal" aria-label="Fechar">&times;</button>
                </div>
                <div class="update-body">
                    <div class="version-info">
                        <p><strong>Versão Atual:</strong> ${this.currentVersion}</p>
                        <p><strong>Nova Versão:</strong> ${updateInfo.version}</p>
                        <p><strong>Data de Lançamento:</strong> ${new Date(updateInfo.releaseDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div class="release-notes">
                        <h4>Novidades desta versão:</h4>
                        <div class="release-notes-content">
                            ${updateInfo.releaseNotes || 'Melhorias gerais e correções de bugs.'}
                        </div>
                    </div>
                </div>
                <div class="update-actions">
                    <button class="btn-secondary" id="updateLater">Mais Tarde</button>
                    <button class="btn-primary" id="updateNow">Baixar e Instalar</button>
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
                    <h4>📥 Baixando atualização...</h4>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" id="updateProgress" style="width: 0%"></div>
                        </div>
                        <div class="progress-info">
                            <span id="progressPercent">0%</span>
                            <span id="progressSpeed">0 KB/s</span>
                        </div>
                    </div>
                    <p id="updateStatus">Iniciando download...</p>
                </div>
            `;
            
            // Remover botões de ação
            const actions = modal.querySelector('.update-actions');
            if (actions) {
                actions.innerHTML = '<button class="btn-secondary" onclick="window.updateManager.cancelUpdate()">Cancelar</button>';
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
                    <h4>✅ Atualização Baixada com Sucesso!</h4>
                    <p>A atualização foi baixada e está pronta para ser instalada.</p>
                    <p><strong>A aplicação será reiniciada para aplicar a atualização.</strong></p>
                </div>
            `;
            
            modal.querySelector('.update-actions').innerHTML = `
                <button class="btn-secondary" onclick="window.updateManager.closeUpdateModal()">Instalar Depois</button>
                <button class="btn-primary" onclick="window.updateManager.installUpdate()">Instalar e Reiniciar</button>
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
        this.showToast('Sistema atualizado! Você já possui a versão mais recente.', 'success');
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
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
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

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('[UPDATER] Inicializando sistema de atualizações...');
    
    // Criar instância global
    window.updateManager = new UpdateManager();
    console.log('[UPDATER] UpdateManager criado:', window.updateManager);
    
    // Verificar automaticamente por atualizações ao inicializar
    // O botão só será criado se houver uma atualização disponível
    setTimeout(() => {
        window.updateManager.checkForUpdatesQuietly();
    }, 3000); // Aguardar 3 segundos após o carregamento
});

// Adicionar método para verificação silenciosa
UpdateManager.prototype.checkForUpdatesQuietly = function() {
    console.log('[UPDATER] Verificando atualizações silenciosamente...');
    
    const ipc = getIpcRenderer();
    if (!ipc) {
        console.log('[UPDATER] IPC não disponível para verificação silenciosa');
        return;
    }

    // Verificar por atualizações sem mostrar mensagens
    ipc.send('check-for-updates-quiet');
};

// Adicionar método para criar botão de atualização
UpdateManager.prototype.createUpdateButton = function() {
    const headerRight = document.querySelector('.header-right');
    console.log('[UPDATER] Header right encontrado:', headerRight);
    
    if (headerRight && !document.getElementById('checkUpdatesBtn')) {
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
            console.log('[UPDATER] Botão de atualização clicado!');
            window.updateManager.checkForUpdates();
        });
        
        // Inserir antes do último botão (fechar)
        const lastBtn = headerRight.lastElementChild;
        headerRight.insertBefore(updateBtn, lastBtn);
        
        console.log('[UPDATER] Botão de atualização criado e adicionado ao header');
        
        // Mostrar notificação de atualização disponível
        this.showToast('🎉 Nova atualização disponível! Clique no botão vermelho para atualizar.', 'info');
    }
};