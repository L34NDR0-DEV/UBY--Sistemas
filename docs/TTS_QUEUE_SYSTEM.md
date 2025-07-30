# Sistema de Fila TTS - Documentação

## Visão Geral

O sistema TTS (Text-to-Speech) foi aprimorado com um sistema de fila sequencial que evita a sobreposição de vozes. Agora todas as notificações de voz são processadas uma por vez, garantindo clareza e organização.

## Funcionalidades Principais

### ✅ **Fila Sequencial**
- Notificações são processadas uma por vez
- Evita sobreposição de vozes
- Melhora a compreensão das mensagens

### ✅ **Sistema de Prioridades**
- **Prioridade 0 (Normal)**: Notificações gerais
- **Prioridade 1 (Alta)**: Lembretes importantes
- **Prioridade 2 (Urgente)**: Alertas de atraso

### ✅ **Controle de Fila**
- Pausar/retomar fala
- Limpar fila
- Verificar status da fila
- Remover itens específicos

## Como Funciona

### **1. Adição à Fila**
```javascript
// Adicionar com prioridade normal
ttsManager.speak("Mensagem normal");

// Adicionar com prioridade alta
ttsManager.speakHigh("Mensagem importante");

// Adicionar com prioridade urgente
ttsManager.speakUrgent("Alerta crítico");
```

### **2. Processamento Sequencial**
```javascript
// O sistema processa automaticamente:
// 1. Item urgente (prioridade 2)
// 2. Item importante (prioridade 1)  
// 3. Item normal (prioridade 0)
// 4. Aguarda 300-500ms entre falas
```

### **3. Controle da Fila**
```javascript
// Verificar status
const status = ttsManager.getQueueStatus();
console.log(`Fila: ${status.queueLength} itens`);

// Limpar fila
ttsManager.clearQueue();

// Pausar/retomar
ttsManager.pause();
ttsManager.resume();

// Parar tudo
ttsManager.stop();
```

## Tipos de Notificação

### **Notificações Normais (Prioridade 0)**
- Agendamento criado
- Agendamento concluído
- Agendamento cancelado
- Agendamento atualizado

### **Lembretes Importantes (Prioridade 1)**
- Lembrete 15 minutos antes
- Lembrete 10 minutos antes
- Lembretes de 2 horas, 1 hora, 45 minutos, 30 minutos, 20 minutos

### **Alertas Urgentes (Prioridade 2)**
- Agendamento atrasado
- Lembrete 5 minutos antes
- Lembrete 2 minutos antes

## Exemplos de Uso

### **1. Notificação de Agendamento Criado**
```javascript
TTSNotifications.agendamentoCriado("João Silva", "14:30", "São Paulo");
// Resultado: "Novo agendamento criado para João Silva às 14:30 em São Paulo"
```

### **2. Alerta de Atraso**
```javascript
TTSNotifications.agendamentoAtrasado("Maria Santos", 15);
// Resultado: "Atenção! Agendamento de Maria Santos está atrasado em 15 minutos"
// + Som de alerta
```

### **3. Lembrete Próximo**
```javascript
TTSNotifications.agendamentoProximo("Pedro Costa", 5);
// Resultado: "Lembrete: agendamento de Pedro Costa em 5 minutos"
// (Prioridade automática baseada no tempo)
```

## Configurações

### **Intervalos de Delay**
- **Prioridade Normal**: 500ms entre falas
- **Prioridade Alta/Urgente**: 300ms entre falas

### **Volume Automático**
- **Alertas de Atraso**: Volume +20% do normal
- **Outras notificações**: Volume padrão

### **Som de Alerta**
- Tocado antes de notificações de atraso
- Volume: 70% do máximo
- Delay: 500ms antes da fala

## Status da Fila

### **Informações Disponíveis**
```javascript
const status = ttsManager.getQueueStatus();
// {
//   queueLength: 3,
//   isSpeaking: true,
//   isProcessing: true,
//   currentItem: { id, text, priority, timestamp },
//   queueItems: [
//     { id, text, priority, timestamp },
//     ...
//   ]
// }
```

### **Logs do Sistema**
```
[TTS] Adicionado à fila: "Mensagem" (Prioridade: 2, Fila: 3 itens)
[TTS] Iniciando processamento da fila (3 itens)
[TTS] Falando: "Mensagem" (Prioridade: 2)
[TTS] Iniciado: "Mensagem"
[TTS] Finalizado: "Mensagem"
[TTS] Fila processada completamente
```

## Integração com Sistema de Notificações

### **Notificações Visuais + TTS**
```javascript
// Criar notificação visual
window.notificationSystem.createNotification({
    type: 'urgent',
    title: 'Lembrete - 5 minutos',
    message: `Agendamento com ${cliente} às ${hora}`,
    // ... outras opções
});

// Adicionar TTS com prioridade
TTSNotifications.agendamentoProximo(cliente, 5);
```

### **Sincronização Automática**
- Notificações visuais e TTS são criadas simultaneamente
- Prioridades são aplicadas automaticamente
- Sistema de fila garante ordem correta

## Benefícios

### **✅ Clareza de Comunicação**
- Uma voz por vez
- Sem sobreposição
- Melhor compreensão

### **✅ Organização**
- Fila ordenada por prioridade
- Processamento sequencial
- Controle total da fila

### **✅ Flexibilidade**
- Prioridades configuráveis
- Controles de pausa/retomada
- Limpeza seletiva da fila

### **✅ Performance**
- Processamento eficiente
- Menos uso de recursos
- Logs detalhados

## Troubleshooting

### **Problema: Voz não fala**
```javascript
// Verificar se TTS está habilitado
console.log(ttsManager.enabled);

// Verificar status da fila
console.log(ttsManager.getQueueStatus());

// Testar TTS
TTSNotifications.teste();
```

### **Problema: Fila não processa**
```javascript
// Verificar se há itens na fila
const status = ttsManager.getQueueStatus();
console.log('Itens na fila:', status.queueLength);

// Forçar processamento
ttsManager.processQueue();
```

### **Problema: Muitas notificações**
```javascript
// Limpar fila
ttsManager.clearQueue();

// Pausar TTS
ttsManager.pause();

// Retomar quando necessário
ttsManager.resume();
```

## Métodos Disponíveis

### **TTSManager**
- `speak(text, options)` - Falar com prioridade normal
- `speakHigh(text, options)` - Falar com prioridade alta
- `speakUrgent(text, options)` - Falar com prioridade urgente
- `stop()` - Parar tudo e limpar fila
- `pause()` - Pausar fala atual
- `resume()` - Retomar fala pausada
- `clearQueue()` - Limpar fila
- `getQueueStatus()` - Obter status da fila

### **TTSNotifications**
- `speak(text, priority)` - Falar com prioridade específica
- `agendamentoCriado(nome, hora, cidade)`
- `agendamentoConcluido(nome)`
- `agendamentoCancelado(nome)`
- `agendamentoAtrasado(nome, minutos)`
- `agendamentoProximo(nome, minutos)`
- `getQueueStatus()` - Status da fila
- `clearQueue()` - Limpar fila
- `pause()` - Pausar TTS
- `resume()` - Retomar TTS
- `stop()` - Parar TTS

Este sistema garante que as notificações de voz sejam sempre claras e organizadas, evitando confusão e melhorando a experiência do usuário. 