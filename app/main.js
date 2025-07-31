const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');
const os = require('os');
const WebSocketServer = require('../src/server/websocket-server');

// Configuração do armazenamento
const store = new Store();

// Instância do servidor WebSocket
let wsServer = null;

let loginWindow;
let mainWindow;

// Obter usuários do sistema
function getSystemUsers() {
  try {
    const currentUser = os.userInfo();
    const systemUsers = [];
    
    // Adicionar o usuário atual
    systemUsers.push({
      id: 1,
      nome: currentUser.username,
      email: `${currentUser.username}@${os.hostname()}`,
      avatar: currentUser.username.substring(0, 2).toUpperCase(),
      isCurrentUser: true
    });
    
    // Em sistemas Windows, obter todos os usuários
    if (process.platform === 'win32') {
      try {
        const { execSync } = require('child_process');
        
        // Comando mais abrangente para obter usuários
        const commands = [
          'wmic useraccount where "LocalAccount=True" get name',
          'net user',
          'wmic useraccount get name'
        ];
        
        let allUsernames = new Set();
        
        // Tentar diferentes comandos para obter usuários
        for (const command of commands) {
          try {
            const output = execSync(command, { encoding: 'utf8', timeout: 5000 });
            
            if (command.includes('net user')) {
              // Processar saída do comando 'net user'
              const lines = output.split('\n');
              const userSection = lines.slice(4, -3); // Pular cabeçalho e rodapé
              userSection.forEach(line => {
                const users = line.trim().split(/\s+/);
                users.forEach(user => {
                  if (user && user.length > 0 && !user.includes('-') && !user.includes('*')) {
                    allUsernames.add(user);
                  }
                });
              });
            } else {
              // Processar saída dos comandos wmic
              const usernames = output.split('\n')
                .map(line => line.trim())
                .filter(line => line && line !== 'Name' && line !== 'Name ');
              
              usernames.forEach(username => {
                if (username && username.length > 0) {
                  allUsernames.add(username);
                }
              });
            }
          } catch (cmdError) {
            console.log(`Comando ${command} falhou:`, cmdError.message);
          }
        }
        
        // Converter Set para Array e processar
        const uniqueUsernames = Array.from(allUsernames)
          .filter(username => username !== currentUser.username)
          .slice(0, 15); // Limitar a 15 usuários adicionais
        
        uniqueUsernames.forEach((username, index) => {
          systemUsers.push({
            id: index + 2,
            nome: username,
            email: `${username}@${os.hostname()}`,
            avatar: username.substring(0, 2).toUpperCase(),
            isCurrentUser: false
          });
        });
        
        console.log(`Encontrados ${systemUsers.length} usuários do sistema`);
        
      } catch (error) {
        console.log('Não foi possível obter lista completa de usuários do sistema:', error.message);
        
        // Adicionar alguns usuários padrão como fallback
        const defaultUsers = ['Administrator', 'Guest', 'DefaultAccount'];
        defaultUsers.forEach((username, index) => {
          if (username !== currentUser.username) {
            systemUsers.push({
              id: index + 2,
              nome: username,
              email: `${username}@${os.hostname()}`,
              avatar: username.substring(0, 2).toUpperCase(),
              isCurrentUser: false
            });
          }
        });
      }
    } else {
      // Para sistemas Unix/Linux/macOS
      try {
        const { execSync } = require('child_process');
        const output = execSync('cut -d: -f1 /etc/passwd', { encoding: 'utf8' });
        const usernames = output.split('\n')
          .filter(username => username && username !== currentUser.username)
          .slice(0, 10);
        
        usernames.forEach((username, index) => {
          systemUsers.push({
            id: index + 2,
            nome: username,
            email: `${username}@${os.hostname()}`,
            avatar: username.substring(0, 2).toUpperCase(),
            isCurrentUser: false
          });
        });
      } catch (error) {
        console.log('Não foi possível obter usuários Unix/Linux');
      }
    }
    
    return systemUsers;
  } catch (error) {
    console.error('Erro ao obter usuários do sistema:', error);
    return [{
      id: 1,
      nome: 'Usuário Atual',
      email: 'usuario@sistema',
      avatar: 'UA',
      isCurrentUser: true
    }];
  }
}

// Carregar usuários do arquivo JSON
function loadUsers() {
  try {
    const usersPath = path.join(__dirname, '..', 'src', 'data', 'users.json');
    const usersData = fs.readFileSync(usersPath, 'utf8');
    return JSON.parse(usersData);
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    return { users: [] };
  }
}

// Validar credenciais de usuário
function validateUser(username, password) {
  const usersData = loadUsers();
  const user = usersData.users.find(u => 
    u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  return user || null;
}

function createLoginWindow() {
  // Criar a janela de login
  loginWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, '..', 'assets', 'logo-system.ico'),
    titleBarStyle: 'hidden',
    frame: false, // Remove os botões padrão do Electron
    show: false,
    skipTaskbar: false
  });

  // Carregar a página de login
  loginWindow.loadFile(path.join(__dirname, '..', 'src', 'views', 'login.html'));

  // Mostrar janela quando estiver pronta
  loginWindow.once('ready-to-show', () => {
    loginWindow.show();
  });

  // Quando a janela de login for fechada
  loginWindow.on('closed', () => {
    loginWindow = null;
    // Se a janela principal não estiver aberta, fechar o app
    if (!mainWindow) {
      app.quit();
    }
  });
}

async function createMainWindow() {
  // Aguardar servidor WebSocket estar pronto
  if (!wsServer) {
    console.log('[INFO] Aguardando servidor WebSocket estar pronto...');
    await initializeWebSocketServer();
  }
  
  // Criar a janela principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, '..', 'assets', 'logo-system.ico'),
    titleBarStyle: 'hidden',
    frame: false, // Remove os botões padrão do Electron
    show: false,
    skipTaskbar: false
  });

  // Carregar a página principal
  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'views', 'main.html'));

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[INFO] Janela principal carregada com servidor WebSocket pronto');
  });

  // Quando a janela principal for fechada
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Configurar menu personalizado
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Sair',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Eventos do Electron
app.disableHardwareAcceleration();

// Configurar ícone da aplicação
app.setAppUserModelId('com.uby.agendamentos');

// Configurações de segurança adicionais
app.on('web-contents-created', (event, contents) => {
  // Desabilitar navegação para URLs externas
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Permitir apenas navegação para arquivos locais
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });
  
  // Desabilitar novas janelas
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

// IPC Handlers para comunicação com o renderer
ipcMain.handle('login', async (event, credentials) => {
  const { username, password, remember } = credentials;
  
  // Validar usuário usando o arquivo JSON
  const user = validateUser(username, password);
  
  if (user) {
    // Armazenar o objeto completo do usuário
    store.set('currentUser', user);
    
    // Se "lembrar de mim" estiver marcado, salvar as credenciais
    if (remember) {
      store.set('rememberedCredentials', { username, password });
    } else {
      store.delete('rememberedCredentials');
    }
    
    // Criar janela principal (agora é async)
    await createMainWindow();
    
    // Fechar janela de login após um pequeno delay
    setTimeout(() => {
      if (loginWindow) {
        loginWindow.close();
      }
    }, 500);
    
    return { success: true, user: user.displayName };
  }
  
  return { success: false, message: 'Credenciais inválidas' };
});

ipcMain.handle('logout', async () => {
  store.delete('currentUser');
  
  // Criar janela de login
  createLoginWindow();
  
  // Fechar janela principal após um pequeno delay
  setTimeout(() => {
    if (mainWindow) {
      mainWindow.close();
    }
  }, 500);
  
  return { success: true };
});

ipcMain.handle('getCurrentUser', async () => {
  return store.get('currentUser', null);
});

ipcMain.handle('getRememberedCredentials', async () => {
  return store.get('rememberedCredentials', null);
});

ipcMain.handle('getSystemUsers', async () => {
  return getSystemUsers();
});

ipcMain.handle('saveAgendamento', async (event, agendamento) => {
  const agendamentos = store.get('agendamentos', []);
  agendamento.id = Date.now().toString();
  agendamento.createdAt = new Date().toISOString();
  agendamentos.push(agendamento);
  store.set('agendamentos', agendamentos);
  return { success: true, agendamento };
});

ipcMain.handle('getAgendamentos', async () => {
  return store.get('agendamentos', []);
});

ipcMain.handle('getAgendamentoById', async (event, id) => {
  const agendamentos = store.get('agendamentos', []);
  const agendamento = agendamentos.find(a => a.id === id);
  return agendamento || null;
});

ipcMain.handle('updateAgendamento', async (event, agendamento) => {
  const agendamentos = store.get('agendamentos', []);
  const index = agendamentos.findIndex(a => a.id === agendamento.id);
  if (index !== -1) {
    agendamentos[index] = { ...agendamentos[index], ...agendamento };
    store.set('agendamentos', agendamentos);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('deleteAgendamento', async (event, id) => {
  const agendamentos = store.get('agendamentos', []);
  const filtered = agendamentos.filter(a => a.id !== id);
  store.set('agendamentos', filtered);
  return { success: true };
});

// Handler para deletar agendamento permanentemente
ipcMain.handle('deletePostItPermanently', async (event, id) => {
  try {
    const agendamentos = store.get('agendamentos', []);
    const filtered = agendamentos.filter(a => a.id !== id);
    store.set('agendamentos', filtered);
    
    console.log(`🗑️ Agendamento ${id} deletado permanentemente`);
    return { success: true, deletedId: id };
  } catch (error) {
    console.error('Erro ao deletar agendamento permanentemente:', error);
    return { success: false, error: error.message };
  }
});

// Handler para compartilhar agendamento
ipcMain.handle('shareAgendamento', async (event, shareData) => {
  try {
    const { agendamentoId, fromUserId, fromUserName, toUserId, toUserName, message } = shareData;
    
    // Buscar o agendamento
    const agendamentos = store.get('agendamentos', []);
    const agendamentoIndex = agendamentos.findIndex(a => a.id === agendamentoId);
    
    if (agendamentoIndex === -1) {
      return { success: false, error: 'Agendamento não encontrado' };
    }
    
    const agendamento = agendamentos[agendamentoIndex];
    
    // Remover verificação de permissão - qualquer pessoa pode compartilhar
    // Comentário: Permitindo compartilhamento livre de agendamentos
    
    // Transferir o agendamento para o novo usuário
    agendamento.userId = toUserId;
    agendamento.sharedAt = new Date().toISOString();
    agendamento.sharedFrom = fromUserName;
    agendamento.shareMessage = message;
    
    // Atualizar o agendamento
    agendamentos[agendamentoIndex] = agendamento;
    store.set('agendamentos', agendamentos);
    
    // Criar notificação para o usuário destinatário
    const notifications = store.get('notifications', []);
    const notification = {
      id: Date.now().toString(),
      userId: toUserId,
      type: 'agendamento_compartilhado',
      title: 'Novo Agendamento Compartilhado',
      message: `${fromUserName} compartilhou um agendamento com você: ${agendamento.cliente}`,
      agendamentoId: agendamentoId,
      shareMessage: message,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    notifications.push(notification);
    store.set('notifications', notifications);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao compartilhar agendamento:', error);
    return { success: false, error: error.message };
  }
});

// Handler para buscar notificações do usuário
ipcMain.handle('getNotifications', async (event, userId) => {
  const notifications = store.get('notifications', []);
  return notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

// Handler para salvar notificação
ipcMain.handle('saveNotification', async (event, notification) => {
  try {
    const notifications = store.get('notifications', []);
    
    // Verificar se já existe uma notificação com o mesmo ID
    const existingIndex = notifications.findIndex(n => n.id === notification.id);
    
    if (existingIndex !== -1) {
      // Atualizar notificação existente
      notifications[existingIndex] = notification;
    } else {
      // Adicionar nova notificação
      notifications.push(notification);
    }
    
    store.set('notifications', notifications);
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar notificação:', error);
    return { success: false, error: error.message };
  }
});

// Handler para marcar notificação como lida
ipcMain.handle('markNotificationAsRead', async (event, notificationId) => {
  const notifications = store.get('notifications', []);
  const index = notifications.findIndex(n => n.id === notificationId);
  
  if (index !== -1) {
    notifications[index].read = true;
    store.set('notifications', notifications);
    return { success: true };
  }
  
  return { success: false };
});

// Handler para remover notificação
ipcMain.handle('removeNotification', async (event, notificationId) => {
  const notifications = store.get('notifications', []);
  const filtered = notifications.filter(n => n.id !== notificationId);
  store.set('notifications', filtered);
  return { success: true };
});

// Handler para limpar todos os agendamentos (lixeira)
ipcMain.handle('clearAllAgendamentos', async () => {
  try {
    const agendamentos = store.get('agendamentos', []);
    const count = agendamentos.length;
    
    // Limpar todos os agendamentos
    store.set('agendamentos', []);
    
    console.log(`✅ Lixeira: ${count} agendamentos removidos do electron-store`);
    return { success: true, deletedCount: count };
  } catch (error) {
    console.error('❌ Erro ao limpar agendamentos:', error);
    return { success: false, error: error.message };
  }
});

// Handler para limpar todas as notificações (lixeira)
ipcMain.handle('clearAllNotifications', async () => {
  try {
    const notifications = store.get('notifications', []);
    const count = notifications.length;
    
    // Limpar todas as notificações
    store.set('notifications', []);
    
    console.log(`✅ Lixeira: ${count} notificações removidas do electron-store`);
    return { success: true, deletedCount: count };
  } catch (error) {
    console.error('❌ Erro ao limpar notificações:', error);
    return { success: false, error: error.message };
  }
});

// Handler para buscar usuários (atualizado para usar users.json)
ipcMain.handle('getUsers', async () => {
  return loadUsers().users || [];
});

// Controles da janela principal
ipcMain.on('main-window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('main-window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('main-window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Controles da janela de login
ipcMain.on('login-window-minimize', () => {
  if (loginWindow) {
    loginWindow.minimize();
  }
});

ipcMain.on('login-window-maximize', () => {
  if (loginWindow) {
    if (loginWindow.isMaximized()) {
      loginWindow.unmaximize();
    } else {
      loginWindow.maximize();
    }
  }
});

ipcMain.on('login-window-close', () => {
  if (loginWindow) {
    loginWindow.close();
  }
});

// Handler para reiniciar a aplicação
ipcMain.on('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

// ===== SISTEMA DE ATUALIZAÇÃO =====

// Configurar autoUpdater
autoUpdater.checkForUpdatesAndNotify = false; // Desabilitar verificação automática
autoUpdater.autoDownload = false; // Não baixar automaticamente
autoUpdater.autoInstallOnAppQuit = false; // Não instalar automaticamente

// Configuração para desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development' || !app.isPackaged;
const disableUpdates = isDevelopment || process.env.DISABLE_UPDATES === 'true';

if (disableUpdates) {
    console.log('🚫 Sistema de atualizações desabilitado (modo desenvolvimento)');
}

// Configurar logs do autoUpdater (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    autoUpdater.logger = require('electron-log');
    autoUpdater.logger.transports.file.level = 'info';
}

// Função para verificar se o GitHub está acessível
async function checkGitHubAccess() {
  try {
    const https = require('https');
    return new Promise((resolve) => {
      const req = https.get('https://api.github.com', (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  } catch (error) {
    console.log('Erro ao verificar acesso ao GitHub:', error.message);
    return false;
  }
}

// Event listeners do autoUpdater
autoUpdater.on('checking-for-update', () => {
  console.log('🔍 Verificando atualizações...');
});

autoUpdater.on('update-available', (info) => {
  console.log('✅ Atualização disponível:', info);
  // Enviar para o renderer
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
    // Criar botão de atualização quando houver atualização disponível
    mainWindow.webContents.executeJavaScript(`
      if (window.updateManager && typeof window.updateManager.createUpdateButton === 'function') {
        window.updateManager.createUpdateButton();
      }
    `);
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('ℹ️ Nenhuma atualização disponível');
  // Enviar para o renderer
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available', info);
  }
});

autoUpdater.on('error', (err) => {
  console.error('❌ Erro no autoUpdater:', err);
  
  // Lista de erros que devem ser ignorados (são normais em desenvolvimento)
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
    err.message && err.message.toLowerCase().includes(ignoredError.toLowerCase())
  );
  
  if (!shouldIgnore && mainWindow) {
    console.log('⚠️ Erro real detectado, enviando para o renderer');
    mainWindow.webContents.send('update-error', {
      message: 'Erro ao verificar atualizações. Tente novamente mais tarde.',
      details: err.message
    });
  } else {
    // Para erros ignorados, enviar mensagem de "sem atualização" em vez de erro
    console.log('ℹ️ Erro ignorado (normal para desenvolvimento):', err.message);
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available', { 
        message: 'Nenhuma atualização disponível no momento' 
      });
    }
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`📥 Progresso do download: ${Math.round(progressObj.percent)}%`);
  // Enviar para o renderer
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('✅ Atualização baixada:', info);
  // Enviar para o renderer
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

// IPC handlers para o sistema de atualização
ipcMain.on('check-for-updates', async () => {
    console.log('🔍 Verificação de atualização solicitada pelo renderer');
    
    // Verificar se as atualizações estão desabilitadas
    if (disableUpdates) {
        console.log('🚫 Atualizações desabilitadas, enviando resposta de "sem atualização"');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available', { 
                message: 'Sistema de atualizações desabilitado em desenvolvimento' 
            });
        }
        return;
    }
    
    // Verificar acesso ao GitHub primeiro
    const githubAccessible = await checkGitHubAccess();
    if (!githubAccessible) {
        console.log('⚠️ GitHub não acessível, enviando resposta de "sem atualização"');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available', { 
                message: 'Nenhuma atualização disponível no momento' 
            });
        }
        return;
    }
    
    // Adicionar timeout para evitar que a verificação fique pendente
    const timeout = setTimeout(() => {
        console.log('⏰ Timeout na verificação de atualizações');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available', { message: 'Nenhuma atualização disponível no momento' });
        }
    }, 15000); // 15 segundos de timeout
    
    try {
        // Verificar se há releases no GitHub antes de tentar atualizar
        await autoUpdater.checkForUpdates();
        clearTimeout(timeout);
    } catch (err) {
        clearTimeout(timeout);
        console.log('ℹ️ Erro ao verificar atualizações (normal se não há releases):', err.message);
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available', { message: 'Nenhuma atualização disponível no momento' });
        }
    }
});

// Handler para verificação silenciosa de atualizações
ipcMain.on('check-for-updates-quiet', async () => {
    console.log('🔍 Verificação silenciosa de atualização solicitada pelo renderer');
    
    // Verificar se as atualizações estão desabilitadas
    if (disableUpdates) {
        console.log('🚫 Atualizações desabilitadas, enviando resposta silenciosa');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available-silent');
        }
        return;
    }
    
    // Verificar acesso ao GitHub primeiro
    const githubAccessible = await checkGitHubAccess();
    if (!githubAccessible) {
        console.log('⚠️ GitHub não acessível, enviando resposta silenciosa');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available-silent');
        }
        return;
    }
    
    // Adicionar timeout para evitar que a verificação fique pendente
    const timeout = setTimeout(() => {
        console.log('⏰ Timeout na verificação silenciosa de atualizações');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available-silent');
        }
    }, 10000); // 10 segundos de timeout
    
    try {
        // Verificar se há releases no GitHub sem mostrar mensagens de erro
        await autoUpdater.checkForUpdates();
        clearTimeout(timeout);
    } catch (err) {
        clearTimeout(timeout);
        console.log('ℹ️ Nenhuma atualização disponível (verificação silenciosa):', err.message);
        // Enviar resposta silenciosa para o renderer
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available-silent');
        }
    }
});

ipcMain.on('download-update', () => {
  console.log('📥 Download de atualização solicitado pelo renderer');
  autoUpdater.downloadUpdate();
});

ipcMain.on('quit-and-install', () => {
  console.log('🔄 Instalação e reinicialização solicitada pelo renderer');
  autoUpdater.quitAndInstall();
});

ipcMain.on('cancel-update', () => {
  console.log('❌ Cancelamento de atualização solicitado pelo renderer');
  // O electron-updater não tem método para cancelar, mas podemos ignorar
});

// Handler para obter versão da aplicação
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ===== SERVIDOR WEBSOCKET =====

// Inicializar servidor WebSocket
async function initializeWebSocketServer() {
  try {
    console.log('[INFO] Iniciando servidor WebSocket...');
    
    // Verificar se as dependências estão disponíveis
    if (!WebSocketServer) {
      console.error('[ERROR] WebSocketServer não encontrado');
      return false;
    }
    
    // Verificar se já existe um servidor rodando
    if (wsServer) {
      console.log('[INFO] Servidor WebSocket já está rodando');
      return true;
    }
    
    // Tentar iniciar o servidor na porta 3002
    wsServer = new WebSocketServer(3002);
    const started = await wsServer.start();
    
    if (started) {
      console.log(`[SUCCESS] Servidor WebSocket iniciado com sucesso na porta ${wsServer.port}`);
      
      // Salvar porta em variável global para uso posterior
      global.websocketPort = wsServer.port;
      
      // Aguardar um pouco para garantir que o servidor esteja pronto
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } else {
      console.error('[ERROR] Falha ao iniciar servidor WebSocket');
      return false;
    }
  } catch (error) {
    console.error('[ERROR] Erro ao inicializar servidor WebSocket:', error);
    
    // Tentar usar o servidor simples como fallback
    try {
      console.log('[INFO] Tentando usar servidor WebSocket simples como fallback...');
      const { spawn } = require('child_process');
      
      // Iniciar servidor simples em processo separado
      const serverProcess = spawn('node', ['server.js'], {
        stdio: 'pipe',
        detached: false
      });
      
      serverProcess.stdout.on('data', (data) => {
        console.log('[WEBSOCKET]', data.toString().trim());
      });
      
      serverProcess.stderr.on('data', (data) => {
        console.error('[WEBSOCKET ERROR]', data.toString().trim());
      });
      
      // Aguardar servidor estar pronto
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('[SUCCESS] Servidor WebSocket simples iniciado como fallback');
      return true;
    } catch (fallbackError) {
      console.error('[ERROR] Falha no fallback do servidor WebSocket:', fallbackError);
      return false;
    }
  }
}

// Parar servidor WebSocket
function stopWebSocketServer() {
  if (wsServer) {
    try {
      wsServer.stop();
      wsServer = null;
      console.log('[STOP] Servidor WebSocket parado');
    } catch (error) {
      console.error('[ERROR] Erro ao parar servidor WebSocket:', error);
    }
  }
}

// Handler para obter status do WebSocket
ipcMain.handle('getWebSocketStatus', async () => {
  if (wsServer) {
    return {
      running: true,
      port: wsServer.port || 3002,
      stats: wsServer.getStats()
    };
  }
  
  // Verificar se há um servidor rodando na porta 3002
  try {
    const net = require('net');
    const testConnection = () => {
      return new Promise((resolve) => {
        const socket = net.createConnection(3002, 'localhost');
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.on('error', () => {
          resolve(false);
        });
        socket.setTimeout(1000, () => {
          socket.destroy();
          resolve(false);
        });
      });
    };
    
    const isRunning = await testConnection();
    return {
      running: isRunning,
      port: 3002,
      message: isRunning ? 'Servidor WebSocket funcionando' : 'Servidor WebSocket não está rodando'
    };
  } catch (error) {
    return {
      running: false,
      port: 3002,
      message: 'Erro ao verificar status do servidor'
    };
  }
});

// Handler para reiniciar servidor WebSocket
ipcMain.handle('restartWebSocketServer', async () => {
  try {
    stopWebSocketServer();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
    initializeWebSocketServer();
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao reiniciar servidor WebSocket:', error);
    return { success: false, error: error.message };
  }
});

// ===== EVENTOS DO APP =====

// Quando o app estiver pronto
app.whenReady().then(async () => {
  // Inicializar servidor WebSocket
  await initializeWebSocketServer();
  
  // Criar janela de login
  createLoginWindow();
});

// Quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
  // Parar servidor WebSocket
  stopWebSocketServer();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Quando o app for ativado (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createLoginWindow();
  }
});

// Quando o app for encerrado
app.on('before-quit', () => {
  // Parar servidor WebSocket
  stopWebSocketServer();
});