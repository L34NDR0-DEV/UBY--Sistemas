# UBY Sistemas - Gestão de Agendamentos

Sistema profissional de gestão de agendamentos desenvolvido com Electron.

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Buildar para produção
npm run build
```

## 📋 Funcionalidades

- ✅ Sistema de login seguro
- ✅ Gestão completa de agendamentos
- ✅ Notificações em tempo real
- ✅ Sistema de atualização automática
- ✅ Interface moderna e responsiva
- ✅ Backup automático de dados

## 🛠️ Tecnologias

- **Electron** - Framework para aplicações desktop
- **HTML/CSS/JavaScript** - Interface e lógica
- **electron-updater** - Sistema de atualizações
- **electron-store** - Armazenamento local

## 📁 Estrutura do Projeto

```
src/
├── assets/          # Recursos (imagens, ícones)
├── config/          # Arquivos de configuração
├── data/            # Dados da aplicação
├── docs/            # Documentação
├── scripts/         # Scripts JavaScript
├── styles/          # Arquivos CSS
├── views/           # Páginas HTML
└── utils/           # Utilitários e helpers
```

## 🔄 Sistema de Atualização

O sistema utiliza `electron-updater` para atualizações automáticas via GitHub Releases.

Para mais detalhes, consulte: [Guia de Atualizações](src/docs/GUIA_ATUALIZACOES.md)

## 📦 Build e Distribuição

```bash
# Build para Windows
npm run build-win

# Build e publicar
npm run publish

# Limpar builds anteriores
npm run clean
```

## 🔧 Configuração

As configurações do sistema estão em:
- `src/config/update-config.js` - Configurações de atualização
- `package.json` - Configurações do projeto e build

## 📞 Suporte

**Desenvolvido por:** UBY Sistemas  
**Versão:** 1.0.0  
**Licença:** MIT