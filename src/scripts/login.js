const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar se há credenciais lembradas
    const rememberedCredentials = await ipcRenderer.invoke('getRememberedCredentials');
    if (rememberedCredentials) {
        document.getElementById('username').value = rememberedCredentials.username;
        document.getElementById('password').value = rememberedCredentials.password;
        document.getElementById('remember').checked = true;
    }

    // Configurar controles da janela
    setupWindowControls();
    
    // Configurar formulário de login
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
});

// Configurar controles da janela
function setupWindowControls() {
    const minimizeBtn = document.getElementById('minimizeBtn');
    const maximizeBtn = document.getElementById('maximizeBtn');
    const closeBtn = document.getElementById('closeBtn');
    
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            ipcRenderer.send('login-window-minimize');
        });
    }
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            ipcRenderer.send('login-window-maximize');
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            ipcRenderer.send('login-window-close');
        });
    }
}

// Função de login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    if (!username || !password) {
        showError('Por favor, preencha todos os campos');
        return;
    }
    
    // Mostrar loading
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Entrando...';
    submitBtn.disabled = true;
    
    try {
        const result = await ipcRenderer.invoke('login', { username, password, remember });
        
        if (result.success) {
            // Login bem-sucedido - a janela principal será aberta pelo processo principal
            showSuccess('Login realizado com sucesso!');
        } else {
            showError(result.message || 'Credenciais inválidas');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showError('Erro interno do sistema');
    } finally {
        // Restaurar botão
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Mostrar mensagem de erro
function showError(message) {
    const errorDiv = document.getElementById('error-message') || createErrorDiv();
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'error-message';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    const errorDiv = document.getElementById('error-message') || createErrorDiv();
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'success-message';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

// Criar div de mensagem se não existir
function createErrorDiv() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.cssText = `
        margin-top: 15px;
        padding: 10px;
        border-radius: 4px;
        text-align: center;
        font-size: 14px;
        display: none;
    `;
    
    const form = document.getElementById('loginForm');
    form.appendChild(errorDiv);
    
    return errorDiv;
}