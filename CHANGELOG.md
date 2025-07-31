# Changelog

## [6.0.4] - 2024-12-31

### ✨ Novas Funcionalidades
- **Sistema de Cadastro de Usuários**: Implementado modal de novo cadastro com validação em tempo real
- **Toggle de Visibilidade de Senha**: Adicionado ícone de olho para mostrar/ocultar senha em todos os campos de senha
- **Modal de Confirmação Personalizado**: Substituído o `confirm()` nativo por modal customizado com estilos do sistema
- **Validação em Tempo Real**: Feedback visual imediato para campos de usuário e senha
- **Animações Suaves**: Transições e animações para melhor experiência do usuário

### 🎨 Melhorias de Interface
- **Ícones Profissionais**: Adicionados ícones SVG em todos os campos de input
- **Alinhamento Perfeito**: Corrigido posicionamento e alinhamento de todos os ícones
- **Remoção de Sombras**: Eliminadas sombras dos botões de controle da janela
- **Interface Limpa**: Removidas dicas de input para interface mais minimalista
- **Responsividade**: Melhorada adaptação para diferentes tamanhos de tela

### 🔧 Melhorias Técnicas
- **WebSocket Auto-Start**: Sistema robusto de inicialização automática do servidor WebSocket
- **IPC Handlers**: Implementados handlers para registro de usuários e controle do servidor
- **Validação de Formulários**: Sistema completo de validação client-side e server-side
- **Gestão de Usuários**: Sistema de armazenamento e verificação de usuários em JSON
- **Tratamento de Erros**: Melhorado sistema de tratamento e exibição de erros

### 🐛 Correções
- **Alinhamento de Ícones**: Corrigido desalinhamento vertical dos ícones nos campos
- **Espaçamentos**: Ajustados espaçamentos para consistência visual
- **Estados de Loading**: Implementados estados de carregamento para melhor feedback
- **Transições**: Corrigidas animações de abertura e fechamento do olho

### 📦 Arquivos Modificados
- `src/views/login.html`: Adicionado modal de cadastro e toggles de senha
- `src/styles/login.css`: Estilos para novos componentes e correções de alinhamento
- `src/scripts/login.js`: Lógica de validação e controle do modal de cadastro
- `app/main.js`: Handlers IPC para registro de usuários
- `src/data/users.json`: Sistema de armazenamento de usuários
- `package.json`: Atualização de versão para 6.0.4

### 🚀 Como Usar
1. **Novo Cadastro**: Clique em "Novo Cadastro" na tela de login
2. **Toggle de Senha**: Clique no ícone do olho para mostrar/ocultar senha
3. **Validação**: Os campos mostram feedback visual em tempo real
4. **Confirmações**: Use o modal customizado para confirmações do sistema

### 📋 Requisitos
- Windows 10/11
- 4GB RAM mínimo
- 100MB espaço em disco
- Conexão com internet para atualizações

### 🔄 Atualizações Automáticas
- Sistema de atualizações automáticas configurado
- Notificações de novas versões
- Download e instalação automática

---

## [6.0.3] - Versão Anterior
- Sistema base de agendamentos
- WebSocket para sincronização
- Interface básica de login 