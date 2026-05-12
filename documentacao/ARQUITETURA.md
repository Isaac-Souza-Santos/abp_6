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

## Mini painel interno (React)

Foi adicionado um painel em pasta separada: `painel-interno/`. Permite consultar agendamentos, métricas e, na aba **Ajustes da agenda**, editar protocolos e **guardar horário de almoço por linha de atendimento** (configuração persistida em `data/agenda-atendentes.json`).

### Dados em `data/`

| Ficheiro | Conteúdo |
|----------|----------|
| `data/agendamentos.json` | Todos os pedidos de agendamento (`slotInicio`, `status`, `atendenteId` / `atendenteNome` quando aplicável). |
| `data/agenda-atendentes.json` | Linhas de atendimento: `id`, `nome`, `intervaloMinutos`, `blocos` (expediente); opcionalmente `almoco` (intervalo sem slots). |

A API expõe:

- `GET /admin/agendamentos` — lista + métricas (usado pelo painel).
- `GET` e `PUT /admin/agenda-atendentes` — lê e grava a configuração da agenda (mesma autenticação que o resto do admin: `x-admin-token`, `?token=` ou Bearer Azure, conforme `.env`).

Tarefas planeadas para evolução do painel: [documentacao/SPRINT-2-PAINEL-INTERNO.md](documentacao/SPRINT-2-PAINEL-INTERNO.md).

### 1) Subir o bot/API (porta 3000)

```bash
npm run dev
```

### 2) Subir o painel React

Em outro terminal:

```bash
npm run panel:dev
```

O painel consome `GET /admin/agendamentos` (lista e métricas), `PATCH /admin/agendamentos/:id` (ajustes por protocolo) e `GET`/`PUT /admin/agenda-atendentes` (horário de almoço por linha).

### Variáveis opcionais para segurança/CORS

- `ADMIN_PANEL_TOKEN`: se definido, a API exige token em `x-admin-token` ou `?token=`.
- `ADMIN_PANEL_ORIGIN`: origem permitida para o painel (ex.: `http://localhost:5173` ou `https://painel.exemplo.com`). Aceita lista separada por vírgula e normaliza barra final automaticamente. Padrão: `*`.
- `ADMIN_PANEL_AZURE_TENANT_ID` e `ADMIN_PANEL_AZURE_CLIENT_ID` (opcional): quando ambos estão definidos, a API aceita também o cabeçalho `Authorization: Bearer` com o **ID token** do Entra ID para essa app registration (mesmo *Application (client) ID* do painel). Pode coexistir com `ADMIN_PANEL_TOKEN` (aceita um ou outro).

No painel (`painel-interno/.env`):

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_ADMIN_PANEL_TOKEN=
```

Configuração Azure (guias completos **não** estão no Git): [documentacao/AZURE-CONFIGURACAO.md](documentacao/AZURE-CONFIGURACAO.md). Scripts: [infra/azure/README.md](infra/azure/README.md).

**Primeira conexão:** o terminal exibe um **QR Code**. No WhatsApp (celular): **Aparelhos conectados** → **Conectar um aparelho** → escanear o QR. A sessão fica em `.wwebjs_auth`.

**Erro "Execution context was destroyed" ao iniciar:** (1) O bot tenta de novo sozinho após 4 segundos. (2) No `.env` adicione `HEADLESS=false`, rode `npm run dev` e escaneie o QR na janela do Chrome que abrir — muitas vezes resolve sem apagar nada.

## Painel do atendente

Quem estiver com o número configurado em `ADMIN_NUMBER` pode:

- Enviar **atendente**, **historico** ou **metricas** → recebe o painel com:
  - **Ciclo do protocolo:** Vira dado, Vira processo, Gestão pública.
  - Métricas (total, hoje, últimos 7 dias, por status).
  - Lista dos últimos agendamentos (com ID).
- Marcar protocolo como **virou processo:** `processo ag-1234567890-abc123`
- Marcar protocolo como **gestão pública:** `gestao ag-1234567890-abc123`

Ver [documentacao/METRICAS-PROTOCOLO.md](documentacao/METRICAS-PROTOCOLO.md).

## Estrutura de pastas

```
ABP6/
├── .github/
│   └── PROJECT_KANBAN.md    # Kanban e 3 sprints
├── documentacao/
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

- **Outlook (opcional):** Se as variáveis de ambiente da API gratuita do Microsoft Graph estiverem configuradas (ver [documentacao/OUTLOOK-AGENDAMENTO.md](OUTLOOK-AGENDAMENTO.md)), cada agendamento confirmado gera um evento no calendário Outlook configurado.

- **Agenda livre x ocupada:** O cidadão pode escolher *Ver horários livres* (lista de slots disponíveis) ou informar data preferida em texto. O gerenciamento de livre/ocupado é feito com base nos agendamentos salvos (slot reservado = ocupado). Ver [documentacao/AGENDA-LIVRE-OCUPADA.md](AGENDA-LIVRE-OCUPADA.md).

- **Consentimento (LGPD):** Antes de coletar nome, motivo e data, o bot exibe texto de consentimento informando quais dados são coletados, a finalidade (agendamento/atendimento) e a base legal (LGPD). O usuário deve digitar *SIM* para concordar; *NÃO* cancela o fluxo e nenhum dado é coletado.

- **Métricas do ciclo do protocolo:** No painel do atendente são exibidos três eixos: *Vira dado* (total de protocolos registrados), *Vira processo* (marcados como viraram processo formal) e *Gestão pública* (marcados como utilizados na gestão). O atendente pode marcar protocolos enviando *processo [ID]* ou *gestao [ID]*. Ver [documentacao/METRICAS-PROTOCOLO.md](METRICAS-PROTOCOLO.md).

## Evolução possível

- **Evolution API:** Migrar para Evolution API (REST + webhooks) para separar conexão WhatsApp do código do bot e facilitar deploy em servidor.
- **Banco de dados:** Migrar `data/agendamentos.json` para banco (ex.: SQLite/PostgreSQL) para maior escala e consultas.
- **Painel admin:** Interface para atualizar textos (contato, horário) e visualizar/editar status dos agendamentos.
- **Infra Azure atual:** Backend e painel publicados em App Service, com workflows em `.github/workflows/azure-backend-app-service.yml` e `.github/workflows/azure-painel-app-service.yml`.
