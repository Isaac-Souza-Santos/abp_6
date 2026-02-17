# Arquitetura – Bot Procon Jacareí WhatsApp

## Visão geral

O projeto é um **chatbot para WhatsApp** do Procon de Jacareí/SP, escrito em **TypeScript**, que usa a biblioteca **whatsapp-web.js** (gratuita) para conexão com o WhatsApp.

## Stack

| Item | Tecnologia |
|------|------------|
| Linguagem | TypeScript |
| Runtime | Node.js 18+ |
| API WhatsApp | whatsapp-web.js (gratuita, open source) |
| Autenticação | LocalAuth (sessão persistida em disco) |

## Estrutura de pastas

```
ABP6/
├── .github/
│   └── PROJECT_KANBAN.md    # Kanban e 3 sprints
├── docs/
│   └── ARQUITETURA.md       # Este arquivo
├── src/
│   ├── index.ts             # Ponto de entrada
│   ├── bot/
│   │   └── ProconBot.ts     # Cliente WhatsApp e eventos
│   ├── handlers/
│   │   └── MessageHandler.ts # Processamento de mensagens
│   └── services/
│       └── MenuService.ts   # Textos e menus (Procon)
├── package.json
├── tsconfig.json
└── README.md
```

## Fluxo de mensagens

1. **index.ts** – Inicia `ProconBot`.
2. **ProconBot** – Cria o `Client` do whatsapp-web.js, registra eventos (`qr`, `ready`, `message`) e repassa mensagens para o `MessageHandler`.
3. **MessageHandler** – Interpreta o texto (menu, opções 1–5), chama o `MenuService` e envia a resposta via `message.reply()`.
4. **MenuService** – Retorna os textos das opções (orientações, reclamação, contato, horário, direitos).

## Segurança e boas práticas

- **Sessão:** A pasta `.wwebjs_auth` guarda a sessão; não deve ser commitada (está no `.gitignore`).
- **Ambiente:** Use `.env` para dados sensíveis ou URLs (quando houver backend); `.env` também deve estar no `.gitignore`.
- **Uso:** O WhatsApp não autoriza oficialmente bots em contas pessoais; uso recomendado para conta institucional e ambiente controlado.

## Agendamento, histórico e métricas

- **Opção 6 – Agendamento:** O cidadão pode solicitar agendamento ou tirar dúvidas. O bot conduz um fluxo (nome → motivo → data preferida → confirmação) e grava a solicitação.
- **Persistência:** Os agendamentos são salvos em `data/agendamentos.json` (a pasta `data/` está no `.gitignore`).
- **Atendente:** Configure no `.env` a variável `ADMIN_NUMBER` com o número do WhatsApp do atendente (ex.: `5512999999999`). Esse número pode enviar *atendente*, *historico* ou *metricas* e recebe:
  - **Histórico:** últimos agendamentos (nome, telefone, motivo, data preferida, status, data/hora).
  - **Métricas:** total de agendamentos, quantidade hoje, últimos 7 dias e contagem por status (solicitado, confirmado, atendido, cancelado).

Isso permite ao atendente acompanhar demandas e usar os dados para métricas de atendimento.

- **Outlook (opcional):** Se as variáveis de ambiente da API gratuita do Microsoft Graph estiverem configuradas (ver `docs/OUTLOOK-AGENDAMENTO.md`), cada agendamento confirmado gera um evento no calendário Outlook configurado.

- **Agenda livre x ocupada:** O cidadão pode escolher *Ver horários livres* (lista de slots disponíveis) ou informar data preferida em texto. O gerenciamento de livre/ocupado é feito com base nos agendamentos salvos (slot reservado = ocupado). Ver `docs/AGENDA-LIVRE-OCUPADA.md`.

- **Consentimento (LGPD):** Antes de coletar nome, motivo e data, o bot exibe texto de consentimento informando quais dados são coletados, a finalidade (agendamento/atendimento) e a base legal (LGPD). O usuário deve digitar *SIM* para concordar; *NÃO* cancela o fluxo e nenhum dado é coletado.

- **Métricas do ciclo do protocolo:** No painel do atendente são exibidos três eixos: *Vira dado* (total de protocolos registrados), *Vira processo* (marcados como viraram processo formal) e *Gestão pública* (marcados como utilizados na gestão). O atendente pode marcar protocolos enviando *processo [ID]* ou *gestao [ID]*. Ver `docs/METRICAS-PROTOCOLO.md`.

## Evolução possível

- **Evolution API:** Migrar para Evolution API (REST + webhooks) para separar conexão WhatsApp do código do bot e facilitar deploy em servidor.
- **Banco de dados:** Migrar `data/agendamentos.json` para banco (ex.: SQLite/PostgreSQL) para maior escala e consultas.
- **Painel admin:** Interface para atualizar textos (contato, horário) e visualizar/editar status dos agendamentos.
