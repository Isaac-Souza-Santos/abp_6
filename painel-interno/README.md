# Painel interno de agendamentos

Aplicação React (Vite + TypeScript) para **consultar e ajustar** agendamentos: filtros, métricas, edição de protocolos (aba **Ajustes da agenda**) e **horário de almoço por linha** (gravado na API em `data/agenda-atendentes.json`).

## Rodar localmente

```bash
npm install
npm run dev
```

## Testes E2E (Playwright)

Instalar dependências do painel e o navegador Chromium do Playwright:

```bash
npm install
npm run test:e2e:install
```

Executar suíte E2E:

```bash
npm run test:e2e
```

Abrir runner interativo:

```bash
npm run test:e2e:ui
```

Os testes E2E ficam em `tests/e2e/` e atualmente incluem um smoke test do carregamento do painel com mock de `GET /admin/agendamentos`.

### O que o smoke test atual faz

Arquivo: `tests/e2e/painel-smoke.spec.ts`

Fluxo validado:

1. Intercepta `GET /admin/agendamentos` e devolve uma resposta mockada (sem depender do backend real).
2. Abre a rota inicial do painel.
3. Verifica se aparecem elementos essenciais da UI:
	- título "Painel interno de agendamentos"
	- aba "Agendamentos"
	- nome "Maria Silva"
	- motivo "Cobrança indevida"
4. Aplica pequenos delays para facilitar visualização no modo headed.

Escopo atual do teste:

- Cobre renderização básica da tela principal com dados válidos.
- Não cobre ainda login Azure, edição de protocolo, fluxo de almoço e cenários de erro de rede.

Por padrão, a API base é `http://localhost:3000` (endpoints `GET /admin/agendamentos`, `PATCH /admin/agendamentos/:id`, `GET` e `PUT /admin/agenda-atendentes`).

## Configuração

Crie `painel-interno/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_ADMIN_PANEL_TOKEN=
```

- `VITE_API_BASE_URL`: URL base da API do bot.
- `VITE_ADMIN_PANEL_TOKEN`: token opcional para autenticação nos endpoints `/admin/*` (agendamentos e agenda-atendentes).
- `VITE_AZURE_CLIENT_ID`: se preenchido, o painel mostra **login Microsoft** (MSAL) antes dos dados. Use o mesmo *Application (client) ID* da app Entra do painel.
- `VITE_AZURE_TENANT_ID`: ID do tenant (ou `common`); opcional se quiser multi-tenant.
- `VITE_AZURE_REDIRECT_URI`: opcional; por defeito `window.location.origin + "/"`.

No bot, defina `ADMIN_PANEL_AZURE_TENANT_ID` e `ADMIN_PANEL_AZURE_CLIENT_ID` com os mesmos valores para validar o Bearer; caso contrário o token enviado pelo painel não será aceite em produção.

## Azure (Static Web Apps + login Microsoft)

- Arquivo `staticwebapp.config.json`: exige usuário autenticado (Entra) para as rotas do app.
- Guias completos **não** estão no repositório: [../documentacao/AZURE-CONFIGURACAO.md](../documentacao/AZURE-CONFIGURACAO.md) — mantenha cópias em `local/` (ex. `local/PAINEL-AZURE-SWA.md`).
- Workflow SWA ([../.github/workflows/swa-painel-deploy.yml](../.github/workflows/swa-painel-deploy.yml)): só **manual** (`workflow_dispatch`), por causa de falhas intermitentes ao puxar a imagem do MCR no runner.

## Azure (App Service — plano B)

Mesma política: documentação detalhada em `local/` (ex. `local/PAINEL-AZURE-APP-SERVICE.md`). Pasta `azure-app-service-host/` (Express) + scripts em `infra/azure/`. Workflow [../.github/workflows/azure-painel-app-service.yml](../.github/workflows/azure-painel-app-service.yml): deploy **automático** em push para `main`/`master` quando mudam ficheiros em `painel-interno/`, além de execução manual.

## Planeamento (Sprint 2 – painel)

Tarefas sugeridas para a próxima iteração do painel: [../documentacao/SPRINT-2-PAINEL-INTERNO.md](../documentacao/SPRINT-2-PAINEL-INTERNO.md).
