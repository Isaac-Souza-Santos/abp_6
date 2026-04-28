# Deploy Azure em Etapas (backend + painel)

Documento único para executar o deploy sempre da mesma forma, sem depender de tentativas.

## Etapa 0 - Pré-condições (uma vez)

- Subscription ativa correta (`Azure for Students`).
- Resource Group de produção: `rg-procon-bot-prod`.
- App Service Plan Linux existente: `asp-painel-procon-cl`.
- Web Apps existentes:
  - backend: `app-backend-procon-cl0426`
  - painel: `app-painel-procon-cl0426`

## Etapa 1 - Secrets e Variables no GitHub Actions

Em `Settings -> Secrets and variables -> Actions`:

### Secrets

- `AZURE_CREDENTIALS` (JSON do Service Principal)
- `AZURE_WEBAPP_NAME_BACKEND=app-backend-procon-cl0426`
- `AZURE_WEBAPP_NAME_PAINEL=app-painel-procon-cl0426`
- `PAINEL_VITE_API_BASE_URL=https://app-backend-procon-cl0426.azurewebsites.net`
- `PAINEL_VITE_ADMIN_PANEL_TOKEN` (se usar token estático)

### Variables

- `AZURE_SUBSCRIPTION_ID=3fc4ec17-e9f3-47d2-a25a-64c2293eb847`
- `AZURE_RG=rg-procon-bot-prod`
- opcional: `AZURE_WEBAPP_RG=rg-procon-bot-prod`

## Etapa 2 - Permissão do Service Principal (RBAC)

No Resource Group `rg-procon-bot-prod`, o SP usado em `AZURE_CREDENTIALS` precisa ter:

- `Contributor` (recomendado)

Sem isso, o workflow falha com:
- `AuthorizationFailed`
- `Microsoft.Web/sites/read`

## Etapa 3 - Deploy do backend

Executar no GitHub Actions:

- Workflow: `Deploy backend App Service`

Critérios de sucesso:

- build concluído
- zip deploy concluído
- smoke test em `/healthz` com HTTP 200

## Etapa 4 - Deploy do painel

Executar no GitHub Actions:

- Workflow: `Deploy painel App Service`

Critérios de sucesso:

- build do painel concluído
- zip deploy concluído

## Etapa 5 - Validação funcional

- backend responde: `https://app-backend-procon-cl0426.azurewebsites.net/healthz`
- painel abre normalmente
- painel lista dados de `GET /admin/agendamentos`

## Etapa 6 - Troubleshooting rápido

### Erro: `--name ""` ou `Failed to retrieve Scm Uri`

Causa:
- secret `AZURE_WEBAPP_NAME_PAINEL` vazio/ausente

Correção:
- definir `AZURE_WEBAPP_NAME_PAINEL=app-painel-procon-cl0426`

### Erro: `AuthorizationFailed` com `Microsoft.Web/sites/read`

Causa:
- SP sem permissão no RG

Correção:
- dar `Contributor` no escopo `rg-procon-bot-prod`
- aguardar 1-3 min de propagação RBAC
- rerodar workflow

### Erro após mexer no RG antigo

Causa:
- recursos legados ainda em `Deleting`

Correção:
- aguardar conclusão da exclusão
- manter deploy somente no `rg-procon-bot-prod`

## Etapa 7 - Operação padrão (resumo)

1. Confirmar secrets/variables.
2. Rodar backend.
3. Validar `/healthz`.
4. Rodar painel.
5. Validar painel/admin.

Se seguir essa ordem, o deploy fica previsível e repetível.

