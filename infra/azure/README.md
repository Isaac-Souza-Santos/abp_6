# Scripts Azure (`infra/azure/`)

Scripts PowerShell e bash para **provisionamento**, **deploy do Container App** e **painel** (App Service).

A documentação **passo a passo** com nomes de recursos e ambientes **não está no Git** — ver [documentacao/AZURE-CONFIGURACAO.md](../documentacao/AZURE-CONFIGURACAO.md) e mantenha cópias em `local/`.

| Ficheiro (exemplos) | Uso |
|---------------------|-----|
| `provision-foundation.ps1` | RG, ACR, Storage, Key Vault, ACA environment |
| `deploy-containerapp.ps1` | Build/imagem + Container App + volumes |
| `package-painel-app-service.ps1` / `deploy-painel-app-service.ps1` | Painel em App Service |

## GitHub Actions (`acr-build-push`)

O workflow usa por defeito o mesmo ambiente que `deploy-containerapp.ps1` (**`rg-procon-bot-cl`**, **`acrproconbotcl`**, etc.). Se o CI apontar para um ACR que não existe na subscrição do `AZURE_CREDENTIALS`, o `az acr login` falha.

Para outro ambiente (ex.: `rg-procon-bot-prod`), defina **Repository variables** em GitHub: **Settings → Secrets and variables → Actions → Variables**: `ACR_NAME`, `AZURE_RG`, e opcionalmente `ACA_ENV`, `ACA_STORAGE`, `ACA_FILE_SHARE`, `ACA_KEYVAULT`.
