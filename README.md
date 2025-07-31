# UBY Agendamentos v6.0.2

Sistema profissional de gestão de agendamentos desenvolvido com Electron

## 🚀 Nova Versão 6.0.2

### Principais Melhorias
- **Performance**: Otimização do sistema de cache offline e sincronização
- **Interface**: Refinamentos visuais e melhor responsividade
- **Segurança**: Atualizações de dependências e melhor criptografia
- **Estabilidade**: Correções de bugs e melhorias gerais

## 📋 Funcionalidades

- ✅ Gestão completa de agendamentos
- ✅ Sistema de notificações avançado
- ✅ Sincronização em tempo real
- ✅ Cache offline para trabalho sem internet
- ✅ Sistema de fila TTS
- ✅ Portas dinâmicas
- ✅ Banco SQLite integrado
- ✅ Interface moderna e responsiva

## 🛠️ Instalação

```bash
# Clone o repositório
git clone https://github.com/L34NDR0-DEV/uby-agendamentos.git

# Entre no diretório
cd uby-agendamentos

# Instale as dependências
npm install

# Execute em modo desenvolvimento (com WebSocket)
npm run dev-full

# Ou execute apenas a aplicação (modo offline)
npm run dev

# Build para produção
npm run build
```

### 🚀 Inicialização Rápida

**Windows:**
```bash
# Execute o script de inicialização
start-app.bat
```

**Linux/macOS:**
```bash
# Execute o script de inicialização
./start-app.sh
```

### 🔧 Troubleshooting WebSocket

Se você encontrar erros de conexão WebSocket, consulte o [Guia de Troubleshooting](WEBSOCKET_TROUBLESHOOTING.md).

## 📦 Builds Disponíveis

- **Windows**: `npm run build-win`
- **macOS**: `npm run build-mac`
- **Linux**: `npm run build-linux`

## 🔧 Configuração

O sistema utiliza:
- **Electron**: 32.0.0
- **Node.js**: Versões LTS
- **SQLite**: Banco de dados local
- **Socket.io**: Comunicação em tempo real

## 📝 Changelog

Consulte o arquivo [CHANGELOG-v6.0.2.md](docs/CHANGELOG-v6.0.2.md) para detalhes completos das mudanças.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia as diretrizes de contribuição antes de submeter pull requests.

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**L34NDR0-DEV**

---

**Versão**: 6.0.2 | **Última atualização**: $(Get-Date -Format "dd/MM/yyyy") 