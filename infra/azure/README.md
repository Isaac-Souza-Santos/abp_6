# Deploy no Azure Container Apps

Este diretório concentra scripts para subir o bot no Azure com segredos no Key Vault, ACR e ambiente Container Apps.

## 1) Provisionamento base

Executar manualmente:

```powershell
./infra/azure/provision-foundation.ps1 -SubscriptionId "<subscription-id>"
```

**Região (importante):** o padrão do script é `francecentral` (costuma funcionar em assinaturas institucionais quando `brazilsouth`/`eastus` são bloqueadas por política). Se falhar com `RequestDisallowedByAzure`, teste outra região permitida:

```powershell
./infra/azure/provision-foundation.ps1 -SubscriptionId "<subscription-id>" -Location "northeurope"
```

Se o **resource group** já existir em outra região (ex.: `brazilsouth`), o script **não** tenta recriá-lo; apenas cria ACR/Storage/Key Vault/Container Apps Environment na `-Location` informada.

O script também:

- registra providers comuns (`Microsoft.ContainerRegistry`, `Microsoft.KeyVault`, etc.)
- cria o Key Vault com RBAC e concede ao **usuário logado** a role `Key Vault Secrets Officer` (para permitir `az keyvault secret set`)

Recursos criados:

- Resource Group (se ainda não existir)
- Azure Container Registry (ACR)
- Storage Account + File Share (`botpersistshare`)
- Key Vault
- Container Apps Environment (Log Analytics gerado automaticamente)

## 2) Segredos obrigatórios no Key Vault

Criar no Key Vault:

- `GROQ-API-KEY` (Groq, modo gratuito)
- `ADMIN_NUMBER`
- outros segredos usados pelo bot (Firebase/Outlook, se aplicável)

Exemplo:

```powershell
az keyvault secret set --vault-name "<key-vault-name>" --name GROQ-API-KEY --value "<valor>"
```

## 3) Build da imagem (ACR Tasks pode estar bloqueado)

Em algumas assinaturas **Azure for Students**, o `az acr build` retorna `TasksOperationsNotAllowed`. Nesse caso:

**Opção A — Docker local**

```powershell
./infra/azure/build-push-local.ps1 -SubscriptionId "<subscription-id>" -ImageTag "v1"
```

**Opção B — GitHub Actions**

Configure o segredo `AZURE_CREDENTIALS` no GitHub (JSON de `az ad sp create-for-rbac --sdk-auth`) e rode o workflow `acr-build-push`.

## 4) Deploy do bot (via Azure CLI, sem YAML)

```powershell
./infra/azure/deploy-containerapp.ps1 `
  -SubscriptionId "<subscription-id>" `
  -ImageTag "v1" `
  -SkipBuild
```

Se você **não** usou `-SkipBuild`, o script tenta `az acr build` primeiro.

O script:

- configura o storage do ambiente (`az containerapp env storage set`)
- cria/atualiza o Container App com **imagem do ACR**, ingress **interno** na porta **3000**, CPU/memória válidos para Consumption (**0.5 CPU / 1.0Gi**)
- segredos do Key Vault (`GROQ-API-KEY`, `ADMIN-NUMBER`) via referência `keyvaultref` + identidade do sistema
- permissões `AcrPull` e `Key Vault Secrets User` na identidade gerenciada do app

### Persistência (sessão WhatsApp e `data/`)

Por padrão o deploy usa:

- `AUTH_PATH=/app/.wwebjs_auth`
- `DATA_DIR=/app/data`

Isso funciona sem montar volume, mas **não persiste** entre revisões/restarts como o share.

Depois de montar o Azure Files no Container App (portal: **Volume** → montar o share `botpersistshare` em `/mnt/persist`), rode o deploy novamente:

```powershell
./infra/azure/deploy-containerapp.ps1 `
  -SubscriptionId "<subscription-id>" `
  -ImageTag "v1" `
  -SkipBuild `
  -AuthPath "/mnt/persist/.wwebjs_auth" `
  -DataDir "/mnt/persist/data"
```

## 5) Bootstrap de autenticação WhatsApp

```powershell
./infra/azure/bootstrap-auth.ps1 -SubscriptionId "<subscription-id>"
```

Fluxo esperado:

1. Ler QR nos logs.
2. Escanear com o número institucional.
3. Validar mensagens de `Autenticado com sucesso` e `conectado e pronto`.
4. Reiniciar o app e confirmar que não pede novo QR (com volume persistente configurado).

## 6) Health HTTP (opcional no portal)

O processo expõe `http://localhost:3000/livez` e `/readyz`. Você pode configurar probes no portal se desejar; o deploy atual não depende de probes ARM.

## 7) Operação contínua

### Alertas recomendados

- reinícios de revisão acima do normal
- ausência de logs `conectado e pronto` por janela de tempo
- erros de autenticação (`auth_failure`)

### Backup recomendado

- habilitar snapshot/backup do Azure File Share (`botpersistshare`)
- política diária + retenção mínima de 7 a 30 dias

### Runbook mínimo

1. **Queda do bot**: verificar logs e estado da revisão ativa.
2. **Sessão inválida**: validar volume montado e conteúdo de `.wwebjs_auth`.
3. **Troca de segredo**: atualizar Key Vault e criar nova revisão.
4. **Deploy seguro**: publicar nova tag de imagem e monitorar a revisão.
