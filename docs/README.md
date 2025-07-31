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

* ✅ Sistema de login seguro
* ✅ Gestão completa de agendamentos
* ✅ Notificações em tempo real
* ✅ Sistema de atualização automática
* ✅ Interface moderna e responsiva
* ✅ Backup automático de dados

## 🛠️ Tecnologias

* **Electron** — Framework para aplicações desktop
* **HTML/CSS/JavaScript** — Interface e lógica
* **electron-updater** — Atualizações automáticas via GitHub Releases
* **electron-store** — Armazenamento local de configurações e dados

## 📁 Estrutura do Projeto

```
src/
├── assets/          # Recursos (imagens, ícones)
├── config/          # Arquivos de configuração
├── data/            # Dados da aplicação
├── docs/            # Documentação e guias
├── scripts/         # Scripts JavaScript auxiliares
├── styles/          # Arquivos CSS
├── views/           # Páginas HTML
└── utils/           # Utilitários e helpers
```

## 🔄 Sistema de Atualização

O sistema utiliza **electron-updater** para aplicar atualizações automáticas a partir de releases no GitHub.

Consulte o guia: [`src/docs/GUIA_ATUALIZACOES.md`](src/docs/GUIA_ATUALIZACOES.md)

## 📦 Build e Distribuição

```bash
# Build para Windows
npm run build-win

# Publicar release no GitHub
npm run publish

# Limpar builds anteriores
npm run clean
```

## 🔧 Configuração

* `src/config/update-config.js` — Configurações do mecanismo de atualização
* `package.json` — Metadados do projeto (nome, versão, author, scripts)

## 📞 Suporte

**Desenvolvido por:** L34NDR0-DEV
**Versão:** 6.0.0
**Licença:** MIT
