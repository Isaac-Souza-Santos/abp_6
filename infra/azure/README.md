# Scripts Azure (`infra/azure/`)

Scripts utilitários para operação Azure e publicação em VM.

A documentação de ambiente (IDs, nomes reais e segredos) deve ficar fora do Git: ver [documentacao/AZURE-CONFIGURACAO.md](../../documentacao/AZURE-CONFIGURACAO.md).

| Ficheiro | Uso |
|----------|-----|
| `bootstrap-vm-docker.ps1` | Instala Docker Engine + Compose plugin na VM via `az vm run-command` |
| `deploy-vm-docker.ps1` | Empacota o projeto local, envia por SSH/SCP e sobe `docker compose` na VM |
| `create-painel-entra-spa.ps1` | Cria app registration (Entra ID) para autenticação no painel |
| `package-painel-app-service.ps1` / `deploy-painel-app-service.ps1` | Legado de App Service (manter somente se ainda houver ambiente antigo) |
| `set-vm-power.ps1` | Liga (`start`) ou desaloca (`deallocate`) a VM manualmente |
| Workflow `vm-schedule.yml` | Start 16:50 e deallocate 23:05 (horário de Brasília) — ver [documentacao/VM-SCHEDULE-GITHUB.md](../../documentacao/VM-SCHEDULE-GITHUB.md) |
| `setup-github-sp-credentials.mjs` | Gera `local/azure-credentials-gh.json` (legado; preferir OIDC) |
| `github-oidc-federated-credential.json` | Modelo da federação GitHub Actions → Entra ID |

## Fluxo recomendado (VM Docker)

1. Preparar VM: `bootstrap-vm-docker.ps1`
2. Publicar aplicação: `deploy-vm-docker.ps1`
3. Validar:
   - API: `http://<vm-host>:3000/healthz`
   - Painel: `http://<vm-host>:80`

Guia completo: [documentacao/DEPLOY-VM-DOCKER.md](../../documentacao/DEPLOY-VM-DOCKER.md)
