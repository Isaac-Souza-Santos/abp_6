# Fluxo do Bot Procon Jacareí

Documento que descreve como o bot está funcionando: inicialização, eventos e tratamento de mensagens.

---

## 1. Inicialização (entrada do programa)

1. **`src/index.ts`**
   - Carrega variáveis de ambiente (`dotenv/config`).
   - Instancia `ProconBot` e chama `bot.start()`.
   - Erros não tratados são logados e o processo encerra com código 1.

2. **`ProconBot` (`src/bot/ProconBot.ts`)**
   - Cria o cliente **whatsapp-web.js** com:
     - **LocalAuth**: sessão persistida em `.wwebjs_auth` (QR só quando necessário).
     - **Puppeteer**: modo headless por padrão (configurável com `HEADLESS=false`).
   - Cria o **MessageHandler** (único ponto de tratamento de mensagens).
   - Registra listeners e chama `client.initialize()` (com até 2 tentativas em caso de erro de contexto).

---

## 2. Eventos do cliente WhatsApp

| Evento            | Comportamento |
|-------------------|----------------|
| **qr**            | Gera QR no terminal (qrcode-terminal). Orienta o usuário a escanear com o WhatsApp do Procon. |
| **ready**         | Log: "Bot Procon Jacareí conectado e pronto!". |
| **authenticated** | Log: "Autenticado com sucesso.". |
| **auth_failure**  | Log de erro. |
| **disconnected**  | Aviso de perda de conexão e orientação para escanear novo QR se aparecer. |
| **message**       | Toda mensagem recebida é repassada para `MessageHandler.handle(client, msg)`. |

**Importante:** mensagens em **grupos** são ignoradas (o handler retorna sem responder).

---

## 3. Tratamento de mensagens (`MessageHandler`)

Ordem de decisão no `handle()`:

### 3.1. Avaliação pós-Groq

- Se o contato está em **aguardando avaliação Groq** (`aguardandoAvaliacaoGroq`):
  - **Sim (1, s, sim):** incrementa métrica “satisfatória”, remove do mapa, envia confirmação e orienta a digitar *menu*.
  - **Não (2, n, não, nao):** incrementa métrica “não satisfatória”, remove do mapa, mensagem de pesar e orientação ao *menu*.
  - Qualquer outra resposta remove do mapa (sai do estado de avaliação).

### 3.2. Comandos do atendente (número em `ADMIN_NUMBER`)

- **atendente** / **historico** / **metricas**: responde com painel (histórico de agendamentos, métricas de protocolo, métricas Groq, instruções para marcar processo/gestão).
- **processo &lt;ID&gt;** (ex.: `processo ag-123`): marca o protocolo como “virou processo”.
- **gestao &lt;ID&gt;** ou **gestão &lt;ID&gt;** (ex.: `gestao ag-123`): marca o protocolo como “gestão pública”.

### 3.3. Cancelar fluxo de agendamento

- Se o usuário está **no fluxo de agendamento** e envia **cancelar**: fluxo é cancelado e é enviado o menu de boas-vindas.

### 3.4. Dentro do fluxo de agendamento

- Se `agendamentoService.isInFluxo(from)` é verdadeiro, a mensagem é tratada apenas pelo **fluxo de agendamento** (ver seção 4). Não se processa menu, Groq nem saudação.

### 3.5. Menu / início

- **menu**, **memu**, **inicio**, **início**: envia o texto de boas-vindas do menu (opções 1 a 6).

### 3.6. Saudações

- Palavras como **oi**, **olá**, **bom dia**, **boa tarde**, **boa noite**, **e aí**, **fala**, **salve**, **hey**, **hi**, **hello**: envia “Qual é a sua dúvida?” e sugere *menu*.

### 3.7. Opções numéricas do menu (fora do fluxo)

- **1** → Orientações ao consumidor.
- **2** → Como registrar reclamação.
- **3** → Contato e endereço.
- **4** → Horário de atendimento.
- **5** → Direitos básicos (CDC).
- **6** → Inicia o **fluxo de agendamento** (texto de início + consentimento LGPD).

### 3.8. Dúvida em texto livre (Groq)

- Se **Groq está disponível** (`GROQ_API_KEY` ou `GROQ` configurado) e o texto tem **3+ caracteres**:
  - Envia a pergunta ao **GroqService** (contexto Procon/CDC + arquivo `.github/DUVIDAS.TXT`).
  - Se houver resposta: envia a resposta (até 3500 caracteres), marca o contato como **aguardando avaliação Groq** e pede “1 = sim, 2 = não”.

### 3.9. Fallback

- Se nada acima for aplicável: envia a mensagem padrão do menu (“Não entendi… digite *menu* ou escolha 1 a 6”).

Qualquer exceção no `handle()` resulta em mensagem de erro genérica e sugestão de *menu*.

---

## 4. Fluxo de agendamento (opção 6)

Estado por contato (telefone normalizado) em memória: `EstadoFluxoAgendamento` com `step` e dados preenchidos em cada etapa.

### Passos (steps)

| Step            | O que o usuário envia        | Ação do bot |
|-----------------|------------------------------|-------------|
| **consentimento** | 1/sim/s/concordo ou 2/não/n  | Aceita → pede nome. Recusa → texto de consentimento recusado e sai do fluxo. |
| **nome**        | Nome completo                | Salva nome, pede motivo. |
| **motivo**      | Motivo/dúvida                | Salva motivo, calcula dias com slots livres, envia lista de dias (ou step **data** se não houver). |
| **data**        | 1 (tentar de novo) ou outro  | Se 1: recalcula dias e reenvia lista. Senão: orienta 1 ou cancelar. |
| **escolher_dia**| Número do dia (1, 2, 3…)     | Valida índice, salva dia, obtém slots do dia e envia lista de horários. |
| **escolher_slot**| Número do horário (1, 2…)    | Valida índice, salva slot, monta data preferida e envia **confirmação**. |
| **confirmar**   | 1/confirmar ou 2/cancelar    | 1: persiste agendamento, envia sucesso (com protocolo e endereço), tenta criar evento Outlook. 2: cancela fluxo e envia menu. |

- **Cancelar** em qualquer passo (comando “cancelar”) sai do fluxo e volta ao menu.
- Após confirmar, o agendamento é salvo em **AgendamentoStore** (`data/agendamentos.json`) e o fluxo é removido da memória.

---

## 5. Serviços e persistência

| Serviço / componente   | Função |
|------------------------|--------|
| **MenuService**        | Textos do menu, opções 1–5, boas-vindas, endereço, mensagem padrão. |
| **AgendamentoService** | Fluxo em memória (consentimento → nome → motivo → dia → slot → confirmar), textos de cada passo, cálculo de dias úteis e slots livres (9h–12h e 14h–17h, 30 min), confirmação e chamada ao store. |
| **AgendamentoStore**   | CRUD em `data/agendamentos.json`: add, listar, métricas, update (status, virouProcesso, gestaoPublica), slots ocupados. |
| **GroqService**        | Se `GROQ_API_KEY`/`GROQ` existe: carrega contexto de `.github/DUVIDAS.TXT`, envia pergunta à API Groq (modelo configurável, ex.: llama-3.1-8b-instant), respostas curtas para WhatsApp. |
| **GroqMetricasStore** | Persiste em `data/groq-metricas.json` as contagens de avaliação “satisfatória” e “não satisfatória”. |
| **OutlookCalendarService** | Se configurado (tenant, client_id, client_secret, refresh_token): após confirmar agendamento, obtém token e cria evento no calendário (Microsoft Graph). Não bloqueia o fluxo; falhas só são logadas. |

---

## 6. Variáveis de ambiente relevantes

- **HEADLESS**: `false` para abrir janela do Puppeteer (útil para debug).
- **ADMIN_NUMBER**: Número do atendente (comando atendente/historico/metricas e processo/gestao).
- **GROQ_API_KEY** ou **GROQ**: API key da Groq (modo gratuito).
- **GROQ_MODEL**: Modelo Groq (padrão: `llama-3.1-8b-instant`).
- **OUTLOOK_***: Integração opcional com calendário (tenant, client_id, client_secret, refresh_token, timezone).

---

## 7. Resumo do fluxo geral

```
[index.ts] → ProconBot.start()
    → Client WhatsApp (LocalAuth, Puppeteer)
    → Eventos: qr, ready, authenticated, auth_failure, disconnected
    → message → MessageHandler.handle(client, msg)

MessageHandler:
    → Ignora grupos
    → Avaliação Groq? → sim/não → métricas + resposta
    → Atendente? → painel / processo ID / gestao ID
    → No fluxo agendamento? → handleFluxoAgendamento (steps)
    → menu/início/saudação? → menu ou “qual sua dúvida”
    → 1 a 6? → opções do menu ou inicia agendamento (6)
    → Texto livre (3+ chars) + Groq? → pergunta Groq → “1 ou 2 ajudou?”
    → Senão → mensagem padrão “não entendi, digite menu”
```

O bot funciona apenas em **chats privados**; em grupos não há resposta. O estado de agendamento é **em memória** (por telefone); métricas e agendamentos são persistidos em arquivos em `data/`.
