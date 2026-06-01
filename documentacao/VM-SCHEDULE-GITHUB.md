# Agendamento da VM (17h–23h, horário de Brasília)

A VM liga **às 16:50** e é **desalocada às 23:05** (America/Sao_Paulo), para o bot operar das **17h às 23h** com menor custo Azure.

Automação: workflow [`.github/workflows/vm-schedule.yml`](../.github/workflows/vm-schedule.yml).

## 1) Configurar no GitHub (obrigatório)

Em **Settings → Secrets and variables → Actions → Variables** (recomendado):

| Nome | Valor (ambiente atual) |
|------|-------------------------|
| `AZURE_CLIENT_ID` | `01a9886a-3915-4d81-b9f8-03a6da49d344` |
| `AZURE_TENANT_ID` | `cf72e2bd-7a2b-4783-bdeb-39d57b07f76f` |
| `AZURE_SUBSCRIPTION_ID` | `3fc4ec17-e9f3-47d2-a25a-64c2293eb847` |
| `AZURE_RESOURCE_GROUP` | `RG-PROCON-BOT-VM` |
| `AZURE_VM_NAME` | `vm-procon-bot-docker` |
| `PUBLIC_BASE_URL` | `https://proconbotdockcl0428.chilecentral.cloudapp.azure.com` (opcional) |

Autenticação: **OIDC** (sem senha no GitHub). A federação `github-actions-abp6-main` já foi criada no Entra ID para o repositório `Isaac-Souza-Santos/abp_6` na branch `main`.

Valores também em `local/azure-contexto.txt` (não versionado).

## 2) Azure / Entra ID (já executado na máquina local)

- Service principal: `github-abp6-vm-schedule`
- Papel: **Virtual Machine Contributor** em `RG-PROCON-BOT-VM`
- Federação OIDC: `infra/azure/github-oidc-federated-credential.json`

Para recriar a federação OIDC:

```bash
az login
az ad app federated-credential create \
  --id 01a9886a-3915-4d81-b9f8-03a6da49d344 \
  --parameters @infra/azure/github-oidc-federated-credential.json
```

### Alternativa: secret `AZURE_CREDENTIALS` (legado)

Se OIDC falhar no tenant, use o JSON em `local/azure-credentials-gh.json` (gerado por `node infra/azure/setup-github-sp-credentials.mjs`). Em tenants Fatec o login com **client secret** pode falhar; prefira OIDC.

## 3) Testar

1. **Actions** → **VM Schedule (bot hours)** → **Run workflow**
2. Escolha `start` → aguarde ~5–8 min → acesse o painel / health da API
3. Depois rode `deallocate` para validar o desligamento com economia

Agendamentos automáticos (UTC):

| Ação | Brasília | Cron (UTC) |
|------|----------|------------|
| Start | 16:50 | `50 19 * * *` |
| Deallocate | 23:05 | `5 2 * * *` |

> Se o horário oficial do negócio for **Chile** (`America/Santiago`) e divergir de Brasília, ajuste os crons em `vm-schedule.yml` ou use Azure Automation com timezone explícita.

## 4) Uso manual (máquina local)

```powershell
az login
powershell -NoProfile -ExecutionPolicy Bypass -File infra/azure/set-vm-power.ps1 `
  -ResourceGroup "RG-PROCON-BOT-VM" `
  -VmName "vm-procon-bot-docker" `
  -Action start
```

## 5) Comportamento esperado

- **Deallocate** para a cobrança de **compute**; discos e IP associados continuam.
- Ao **start**, o Docker na VM sobe os containers (`restart: unless-stopped` no `docker-compose.yml`).
- Deploys em `deploy-vm-docker.yml` **ligam a VM automaticamente** via Azure (`az vm start`) se estiver desligada, desde que `AZURE_RESOURCE_GROUP`, `AZURE_VM_NAME` e OIDC estejam configurados.

## 6) Economia estimada

VM ligada ~6,25 h/dia em vez de 24 h → cerca de **75%** a menos em compute da VM (disco/IP continuam).
