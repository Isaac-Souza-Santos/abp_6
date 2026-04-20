# Scripts Azure (`infra/azure/`)

Scripts PowerShell e bash para **provisionamento**, **deploy do Container App** e **painel** (App Service).

A documentação **passo a passo** com nomes de recursos e ambientes **não está no Git** — ver [documentacao/AZURE-CONFIGURACAO.md](../documentacao/AZURE-CONFIGURACAO.md) e mantenha cópias em `local/`.

| Ficheiro (exemplos) | Uso |
|---------------------|-----|
| `provision-foundation.ps1` | RG, ACR, Storage, Key Vault, ACA environment |
| `deploy-containerapp.ps1` | Build/imagem + Container App + volumes |
| `package-painel-app-service.ps1` / `deploy-painel-app-service.ps1` | Painel em App Service |
