# Changelog

## [1.0.2] - 2024-12-31

### 🗺️ Modal de Mapa Completamente Refatorado
- **Separação de Módulos**: Modal de mapa movido para arquivo independente (`mapModal.js`)
- **Pin Personalizado**: Implementado pin personalizado usando imagem `ping.png` da pasta assets
- **Nome do Cliente no Popup**: Popup do mapa agora mostra o nome do cliente em vez das coordenadas
- **Múltiplos Provedores de Tiles**: Sistema robusto com fallback para OpenStreetMap, CartoDB e Esri
- **Mapa Offline**: Interface visual quando não há conexão com internet
- **CSS Injetado**: Todos os estilos necessários injetados diretamente no modal

### 🔧 Correções Técnicas
- **Content Security Policy**: Atualizado CSP para permitir recursos externos de mapas
- **Ordem de Scripts**: Corrigida ordem de carregamento dos scripts no HTML
- **Event Listeners**: Removidos listeners duplicados do main.js
- **Inicialização Robusta**: Sistema de inicialização com verificações de disponibilidade
- **Fallbacks Múltiplos**: Sistema de fallback para diferentes cenários de erro

### 🎯 Funcionalidades do Mapa
- **Pin Personalizado**: Usa imagem `ping.png` com sombra e efeitos visuais
- **Popup Inteligente**: Mostra nome do cliente e coordenadas formatadas
- **Controles de Zoom**: Botões de zoom in/out e centralizar mapa
- **Geocoding**: Busca automática do nome da cidade usando Nominatim API
- **Abertura Externa**: Botão para abrir localização no OpenStreetMap

### ⚡ Sistema de Atualizações Automáticas
- **Ativação Completa**: Sistema de atualizações automáticas ativado
- **Verificação Automática**: Verifica atualizações ao iniciar o aplicativo
- **Download Automático**: Baixa atualizações automaticamente quando disponíveis
- **Instalação Automática**: Instala atualizações ao fechar o aplicativo
- **Interface de Usuário**: Botão vermelho aparece quando há atualização disponível

### 🎨 Melhorias de Interface
- **Modal Responsivo**: Adaptação perfeita para diferentes tamanhos de tela
- **Animações Suaves**: Transições e animações para melhor UX
- **Feedback Visual**: Toast notifications para status de operações
- **Design Consistente**: Cores e estilos alinhados com o tema do sistema

### 📦 Arquivos Modificados
- `src/scripts/mapModal.js`: Modal de mapa completamente refatorado
- `src/scripts/main.js`: Remoção de código duplicado e atualização de chamadas
- `src/views/main.html`: Atualização de CSP e ordem de scripts
- `app/main.js`: Ativação do sistema de atualizações automáticas
- `src/scripts/updater.js`: Confirmação de sistema de atualizações ativo

### 🚀 Como Usar
1. **Modal de Mapa**: Clique em "Localização" em qualquer agendamento
2. **Pin Personalizado**: Pin laranja com imagem personalizada aparece no mapa
3. **Popup Inteligente**: Mostra nome do cliente e coordenadas
4. **Atualizações**: Sistema verifica automaticamente por novas versões
5. **Controles**: Use botões de zoom e centralizar para navegar no mapa

### 📋 Requisitos
- Windows 10/11
- 4GB RAM mínimo
- 100MB espaço em disco
- Conexão com internet para mapas e atualizações

### 🔄 Atualizações Automáticas
- Sistema de atualizações automáticas ativado
- Verificação automática ao iniciar
- Download e instalação automática
- Notificações visuais de status

---
## [1.0.1] - 2024-12-31

### 🔄 Reset de Versão
- **Nova Numeração**: Sistema migrado para versão 1.0.1
- **Base Estável**: Versão consolidada com todas as funcionalidades
- **Compatibilidade**: Mantém todas as funcionalidades da v6.0.4

### ✨ Funcionalidades Principais
- **Sistema de Cadastro de Usuários**: Modal de novo cadastro com validação em tempo real
- **Toggle de Visibilidade de Senha**: Ícone de olho para mostrar/ocultar senha
- **Modal de Confirmação Personalizado**: Interface customizada para confirmações
- **Validação em Tempo Real**: Feedback visual imediato para campos
- **Animações Suaves**: Transições e animações para melhor UX

### 🎨 Melhorias de Interface
- **Ícones Profissionais**: SVG otimizados em todos os campos
- **Alinhamento Perfeito**: Posicionamento preciso e consistente
- **Remoção de Sombras**: Visual flat moderno
- **Interface Limpa**: Design minimalista e focado
- **Responsividade**: Adaptação perfeita para diferentes telas

### 🔧 Melhorias Técnicas
- **WebSocket Auto-Start**: Sistema robusto de inicialização
- **IPC Handlers**: Comunicação segura entre processos
- **Validação de Formulários**: Sistema completo client-side e server-side
- **Gestão de Usuários**: Sistema de armazenamento em JSON
- **Tratamento de Erros**: Sistema robusto de exceções

### 🐛 Correções
- **Alinhamento de Ícones**: Corrigido desalinhamento vertical
- **Espaçamentos**: Ajustados para consistência visual
- **Estados de Loading**: Implementados para melhor feedback
- **Transições**: Corrigidas animações de abertura e fechamento
- **Conexão WebSocket**: Corrigido erro de inicialização

### 📦 Arquivos Modificados
- `src/views/login.html`: Modal de cadastro e toggles de senha
- `src/styles/login.css`: Estilos para novos componentes
- `src/scripts/login.js`: Lógica de validação e controle
- `app/main.js`: Handlers IPC para registro de usuários
- `src/data/users.json`: Sistema de armazenamento de usuários
- `src/server/websocket-fallback.js`: Script de fallback para WebSocket
- `package.json`: Atualização de versão para 1.0.1

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

## [6.0.4] - Versão Anterior (Deprecated)
- Sistema de cadastro de usuários
- Toggle de visibilidade de senha
- Modal de confirmação personalizado
- Validação em tempo real
- Melhorias de interface e correções técnicas

## [6.0.3] - Versão Base
- Sistema base de agendamentos
- WebSocket para sincronização
- Interface básica de login 