// Modal de Compartilhamento - Arquivo dedicado

class ShareModal {
    constructor() {
        this.currentAgendamentoId = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        // Aguardar o DOM estar carregado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupShareModalEventListeners());
        } else {
            this.setupShareModalEventListeners();
        }
    }

    setupShareModalEventListeners() {
        // Botão de fechar
        const closeBtn = document.getElementById('closeShareModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Botão cancelar
        const cancelBtn = document.querySelector('#shareModal .btn-secondary');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }

        // Botão confirmar
        const confirmBtn = document.getElementById('confirmShareBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmShare());
        }

        // Select de usuário
        const userSelect = document.getElementById('userSelect');
        if (userSelect) {
            userSelect.addEventListener('change', () => this.onUserSelectChange());
        }

        // Textarea de mensagem
        const messageTextarea = document.getElementById('shareMessage');
        if (messageTextarea) {
            messageTextarea.addEventListener('input', () => this.updateCharCount());
        }

        // Fechar ao clicar fora do modal
        const modal = document.getElementById('shareModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close();
                }
            });
        }
    }

    async open(agendamentoId) {
        console.log('ShareModal: Opening for agendamento ID:', agendamentoId);
        
        if (this.isOpen) {
            console.log('ShareModal: Modal already open');
            return;
        }

        try {
            this.currentAgendamentoId = agendamentoId;
            this.isOpen = true;

            // Buscar o agendamento diretamente do backend
            const agendamento = await ipcRenderer.invoke('getAgendamentoById', agendamentoId);
            if (!agendamento) {
                throw new Error('Agendamento não encontrado');
            }

            // Preencher preview
            this.fillPreview(agendamento);

            // Carregar usuários
            await this.loadUsers();

            // Limpar campos
            this.clearFields();

            // Mostrar modal
            const modal = document.getElementById('shareModal');
            if (modal) {
                modal.classList.add('show');
                console.log('ShareModal: Modal displayed');
            } else {
                throw new Error('Modal element not found');
            }

        } catch (error) {
            console.error('ShareModal: Error opening modal:', error);
            alert(`Erro ao abrir modal de compartilhamento: ${error.message}`);
            this.isOpen = false;
        }
    }

    close() {
        console.log('ShareModal: Closing modal');
        
        const modal = document.getElementById('shareModal');
        if (modal) {
            modal.classList.remove('show');
        }

        this.currentAgendamentoId = null;
        this.isOpen = false;
        this.clearFields();
    }

    fillPreview(agendamento) {
        const elements = {
            'previewCliente': agendamento.nomeCliente,
            'previewData': agendamento.data,
            'previewHorario': agendamento.horario,
            'previewCidade': agendamento.cidade
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'N/A';
            }
        }
    }

    async loadUsers() {
        try {
            const users = await ipcRenderer.invoke('getUsers');
            const currentUser = window.currentUser;
            const userSelect = document.getElementById('userSelect');

            if (!userSelect) {
                throw new Error('User select element not found');
            }

            // Limpar opções
            userSelect.innerHTML = '<option value="">Selecione um usuário...</option>';

            // Adicionar usuários (exceto o atual)
            users.forEach(user => {
                if (user.username !== currentUser?.username) {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = `${user.displayName} (${user.username})`;
                    userSelect.appendChild(option);
                }
            });

            console.log('ShareModal: Users loaded successfully');

        } catch (error) {
            console.error('ShareModal: Error loading users:', error);
            alert('Erro ao carregar lista de usuários');
        }
    }

    clearFields() {
        const userSelect = document.getElementById('userSelect');
        const messageTextarea = document.getElementById('shareMessage');
        const charCount = document.getElementById('charCount');
        const confirmBtn = document.getElementById('confirmShareBtn');

        if (userSelect) userSelect.value = '';
        if (messageTextarea) messageTextarea.value = '';
        if (charCount) charCount.textContent = '0';
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 12l6 6L20 6"/>
                </svg>
                Compartilhar
            `;
        }
    }

    onUserSelectChange() {
        const userSelect = document.getElementById('userSelect');
        const confirmBtn = document.getElementById('confirmShareBtn');

        if (userSelect && confirmBtn) {
            confirmBtn.disabled = !userSelect.value;
        }
    }

    updateCharCount() {
        const messageTextarea = document.getElementById('shareMessage');
        const charCount = document.getElementById('charCount');

        if (messageTextarea && charCount) {
            charCount.textContent = messageTextarea.value.length;
        }
    }

    async confirmShare() {
        const userSelect = document.getElementById('userSelect');
        const messageTextarea = document.getElementById('shareMessage');
        const confirmBtn = document.getElementById('confirmShareBtn');

        if (!userSelect?.value) {
            alert('Por favor, selecione um usuário para compartilhar');
            return;
        }

        if (!this.currentAgendamentoId) {
            alert('Erro: Agendamento não identificado');
            return;
        }

        try {
            // Desabilitar botão
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                    Compartilhando...
                `;
            }

            // Buscar dados necessários
            const users = await ipcRenderer.invoke('getUsers');
            const targetUser = users.find(u => u.id === parseInt(userSelect.value));
            const agendamento = await ipcRenderer.invoke('getAgendamentoById', this.currentAgendamentoId);
            const currentUser = window.currentUser;

            if (!targetUser) {
                throw new Error('Usuário destinatário não encontrado');
            }

            if (!agendamento) {
                throw new Error('Agendamento não encontrado');
            }

            // Executar compartilhamento
            const result = await ipcRenderer.invoke('shareAgendamento', {
                agendamentoId: this.currentAgendamentoId,
                fromUserId: currentUser.id,
                fromUserName: currentUser.displayName,
                toUserId: parseInt(userSelect.value),
                toUserName: targetUser.displayName,
                message: messageTextarea?.value?.trim() || ''
            });

            if (result.success) {
                // Remover da lista atual
                const index = window.agendamentos?.findIndex(a => a.id === this.currentAgendamentoId);
                if (index !== -1 && window.agendamentos) {
                    window.agendamentos.splice(index, 1);
                }

                // Atualizar interface
                if (window.filterAgendamentos) {
                    window.filterAgendamentos();
                }

                this.close();

                // Notificação de sucesso
                if (window.showToast) {
<<<<<<< HEAD
                    window.showToast(`Agendamento compartilhado com sucesso para ${targetUser.displayName}!`, 'success');
=======
                    window.showToast(`✅ Agendamento compartilhado com sucesso para ${targetUser.displayName}!`, 'success');
>>>>>>> 01a90c6129e07fa60b9510725f6f97f1cbccfb76
                } else {
                    alert(`Agendamento compartilhado com sucesso para ${targetUser.displayName}!`);
                }

                console.log('ShareModal: Share completed successfully');

            } else {
                throw new Error(result.error || 'Falha ao compartilhar agendamento');
            }

        } catch (error) {
            console.error('ShareModal: Error sharing:', error);
            
            if (window.showToast) {
                window.showToast(`❌ Erro ao compartilhar: ${error.message}`, 'error');
            } else {
                alert(`Erro ao compartilhar agendamento: ${error.message}`);
            }

        } finally {
            // Reabilitar botão
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 12l6 6L20 6"/>
                    </svg>
                    Compartilhar
                `;
            }
        }
    }
}

// Instância global do modal
let shareModalInstance = null;

// Função global para abrir o modal (compatibilidade)
window.openShareModal = function(agendamentoId) {
    if (!shareModalInstance) {
        shareModalInstance = new ShareModal();
    }
    shareModalInstance.open(agendamentoId);
};

// Função global para fechar o modal (compatibilidade)
window.closeShareModal = function() {
    if (shareModalInstance) {
        shareModalInstance.close();
    }
};

// Função global para confirmar compartilhamento (compatibilidade)
window.confirmShare = function() {
    if (shareModalInstance) {
        shareModalInstance.confirmShare();
    }
};

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        shareModalInstance = new ShareModal();
        setupShareModalEventListeners();
    });
} else {
    shareModalInstance = new ShareModal();
    setupShareModalEventListeners();
}

// Configurar event listeners específicos do modal de compartilhamento
function setupShareModalEventListeners() {
    // Botão de fechar modal
    const closeBtn = document.getElementById('closeShareModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (shareModalInstance) {
                shareModalInstance.close();
            }
        });
    }

    // Seleção de usuário
    const userSelect = document.getElementById('userSelect');
    if (userSelect) {
        userSelect.addEventListener('change', () => {
            if (shareModalInstance) {
                shareModalInstance.onUserSelectChange();
            }
        });
    }

    // Contador de caracteres
    const messageTextarea = document.getElementById('shareMessage');
    if (messageTextarea) {
        messageTextarea.addEventListener('input', () => {
            if (shareModalInstance) {
                shareModalInstance.updateCharCount();
            }
        });
    }

    // Fechar modal clicando fora
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal && shareModalInstance) {
                shareModalInstance.close();
            }
        });
    }
}

console.log('ShareModal: Script loaded successfully');