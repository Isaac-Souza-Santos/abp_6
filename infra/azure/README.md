# Scripts Azure (`infra/azure/`)

Scripts PowerShell para configuração Azure focada no **App Service** do backend e do painel interno.

A documentação **passo a passo** com nomes de recursos e ambientes **não está no Git** — ver [documentacao/AZURE-CONFIGURACAO.md](../documentacao/AZURE-CONFIGURACAO.md) e mantenha cópias em `local/`.

| Ficheiro (exemplos) | Uso |
|---------------------|-----|
| `create-painel-entra-spa.ps1` | Cria app registration (Entra ID) para autenticação no painel |
| `package-painel-app-service.ps1` / `deploy-painel-app-service.ps1` | Painel em App Service |
| `deploy-backend-app-service` (workflow) | Backend em App Service sem container |

## GitHub Actions (App Service)

Workflows principais em `.github/workflows/`:
- `azure-backend-app-service.yml`
- `azure-painel-app-service.yml`

Variáveis recomendadas em GitHub Actions:
- Secrets: `AZURE_CREDENTIALS`, `AZURE_WEBAPP_NAME_BACKEND`, `AZURE_WEBAPP_NAME_PAINEL`
- Variables: `AZURE_SUBSCRIPTION_ID`, `AZURE_RG`, `AZURE_WEBAPP_RG` (e opcionalmente `AZURE_WEBAPP_RG_BACKEND`)
