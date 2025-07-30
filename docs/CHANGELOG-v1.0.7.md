# Changelog - Versão 1.0.7

## Novas Funcionalidades

### 🔊 Som de Alerta para Atrasos
- **Funcionalidade**: Adicionado som de alerta (som.mp3) para notificações de atraso
- **Implementação**: 
  - Som toca antes da mensagem de voz para atrasos
  - Arquivo de som localizado em `assets/som.mp3`
  - Volume configurado para 70% para não ser muito alto
  - Delay de 500ms entre som e mensagem de voz
  - Aplicado apenas para agendamentos atrasados

## Correções Implementadas

### 🔧 Função de Copiar Contato
- **Problema**: A função de copiar contato não estava funcionando corretamente
- **Solução**: 
  - Adicionada verificação para texto vazio antes de tentar copiar
  - Implementada API moderna do clipboard (`navigator.clipboard.writeText`)
  - Adicionado fallback para métodos antigos (`document.execCommand('copy')`)
  - Melhoradas as mensagens de sucesso e erro

### 🎨 Animação do Contato
- **Problema**: Animação indesejada ao passar o mouse sobre o contato
- **Solução**: 
  - Removida a animação hover da classe `.copyable-contact`
  - Simplificado o estilo CSS para melhor experiência do usuário

### 🔄 Botão de Atualização
- **Problema**: Botão de atualização aparecia sempre, mesmo sem atualizações disponíveis
- **Solução**: 
  - Implementada verificação silenciosa de atualizações na inicialização
  - Botão agora só aparece quando há uma atualização disponível
  - Adicionado estilo visual de destaque (animação de pulso e cor vermelha)
  - Incluída notificação "Nova atualização disponível!"

### 🗑️ Função da Lixeira
- **Problema**: A lixeira não estava apagando os post-its criados
- **Solução**: 
  - Corrigida a função `executeCleanup` para incluir remoção de dados de post-its
  - Adicionada limpeza de `localStorage` e `sessionStorage` para post-its
  - Implementada remoção dos elementos de post-its da interface
  - Garantida limpeza completa de todos os dados relacionados

## Arquivos Modificados

- `src/scripts/tts.js` - Adicionado som de alerta para atrasos
- `src/scripts/main.js` - Correção da função copyToClipboard e handlers de atualização
- `src/styles/main.css` - Remoção da animação hover do contato
- `src/scripts/updater.js` - Lógica condicional do botão de atualização
- `src/scripts/data-cleaner.js` - Correção da limpeza de post-its
- `package.json` - Atualização da versão para 1.0.7

## Informações da Build

- **Versão**: 1.0.7
- **Tamanho do Instalador**: 73.03 MB
- **Arquivo**: UBY Sistemas - Gestão de Agendamentos Setup 1.0.7.exe
- **Data**: $(Get-Date -Format "dd/MM/yyyy HH:mm")

## Notas Técnicas

- Todas as correções foram testadas e validadas
- Mantida compatibilidade com versões anteriores
- Melhorada a experiência do usuário em todas as funcionalidades corrigidas