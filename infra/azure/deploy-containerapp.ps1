Param(
  [string]$SubscriptionId,
  [string]$ResourceGroup = "rg-procon-bot-prod",
  [string]$ContainerEnvName = "acae-procon-bot-prod",
  [string]$ContainerAppName = "procon-bot",
  [string]$AcrName = "acrproconbotprod",
  [string]$StorageName = "stproconbotprod",
  [string]$FileShareName = "botpersistshare",
  [string]$KeyVaultName = "kv-procon-bot-prod",
  [string]$ImageTag = "latest",
  [switch]$SkipBuild,
  # Sem volume montado, use pastas dentro da imagem. Depois de montar Azure Files em /mnt/persist no portal, rode o deploy com:
  # -AuthPath "/mnt/persist/.wwebjs_auth" -DataDir "/mnt/persist/data"
  [string]$AuthPath = "/app/.wwebjs_auth",
  [string]$DataDir = "/app/data"
)

if (-not $SubscriptionId) {
  throw "Informe -SubscriptionId para executar o deploy."
}

$env:Path = "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin;" + $env:Path
az account set --subscription $SubscriptionId

$acrServer = az acr show --name $AcrName --resource-group $ResourceGroup --query loginServer -o tsv
$image = "$acrServer/$ContainerAppName`:$ImageTag"
$storageKey = az storage account keys list --resource-group $ResourceGroup --account-name $StorageName --query "[0].value" -o tsv
$kvHost = "$KeyVaultName.vault.azure.net"

az acr config authentication-as-arm update --name $AcrName --resource-group $ResourceGroup --status enabled

if (-not $SkipBuild) {
  Write-Host "Build da imagem no ACR (ACR Tasks)..."
  az acr build `
    --registry $AcrName `
    --image "$ContainerAppName`:$ImageTag" `
    --file Dockerfile `
    .
  if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ACR Tasks nao esta permitido nesta assinatura (comum em Azure for Students)."
    Write-Host "Opcoes:"
    Write-Host "  1) Instalar Docker Desktop e rodar:"
    Write-Host "     .\infra\azure\build-push-local.ps1 -SubscriptionId `"$SubscriptionId`" -ImageTag `"$ImageTag`""
    Write-Host "  2) Ou usar GitHub Actions (segredo AZURE_CREDENTIALS) em .github/workflows/acr-build-push.yml"
    Write-Host "  3) Depois publicar o app sem rebuild:"
    Write-Host "     .\infra\azure\deploy-containerapp.ps1 -SubscriptionId `"$SubscriptionId`" -SkipBuild -ImageTag `"$ImageTag`""
    Write-Host ""
    exit 1
  }
} else {
  Write-Host "SkipBuild: pulando az acr build (imagem ja deve existir no ACR)."
}

az containerapp env storage set `
  --name $ContainerEnvName `
  --resource-group $ResourceGroup `
  --storage-name $FileShareName `
  --azure-file-account-name $StorageName `
  --azure-file-account-key $storageKey `
  --azure-file-share-name $FileShareName `
  --access-mode ReadWrite

$envVars = @(
  "NODE_ENV=production",
  "HEALTH_PORT=3000",
  "AUTH_PATH=$AuthPath",
  "DATA_DIR=$DataDir",
  "GROQ_API_KEY=secretref:groq-api-key",
  "ADMIN_NUMBER=secretref:admin-number"
)

# `az containerapp create` aceita ingress/registry/secrets; `update` NAO (CLI atual).
$createCore = @(
  "-n", $ContainerAppName,
  "-g", $ResourceGroup,
  "--image", $image,
  "--ingress", "internal",
  "--target-port", "3000",
  "--cpu", "0.5",
  "--memory", "1.0Gi",
  "--min-replicas", "1",
  "--max-replicas", "1",
  "--system-assigned",
  "--registry-server", $acrServer,
  "--registry-identity", "system",
  "--secrets",
  "groq-api-key=keyvaultref:https://$kvHost/secrets/GROQ-API-KEY,identityref:system",
  "admin-number=keyvaultref:https://$kvHost/secrets/ADMIN-NUMBER,identityref:system"
)

$updateCore = @(
  "-n", $ContainerAppName,
  "-g", $ResourceGroup,
  "--image", $image,
  "--cpu", "0.5",
  "--memory", "1.0Gi",
  "--min-replicas", "1",
  "--max-replicas", "1"
)

$createArgs = @("create", "--environment", $ContainerEnvName) + $createCore + @("--env-vars") + $envVars
$updateArgs = @("update") + $updateCore + @("--replace-env-vars") + $envVars

$appShow = az containerapp show --name $ContainerAppName --resource-group $ResourceGroup 2>$null
if ($LASTEXITCODE -eq 0 -and $appShow) {
  Write-Host "Atualizando Container App existente..."
  az containerapp @updateArgs
  if ($LASTEXITCODE -ne 0) {
    throw "az containerapp update falhou (veja a mensagem acima)."
  }
} else {
  Write-Host "Criando Container App..."
  az containerapp @createArgs
  if ($LASTEXITCODE -ne 0) {
    throw "az containerapp create falhou (veja a mensagem acima)."
  }
}

$principalId = az containerapp show --name $ContainerAppName --resource-group $ResourceGroup --query identity.principalId -o tsv
if (-not $principalId) {
  throw "Nao foi possivel obter principalId da identidade gerenciada do Container App."
}

$acrId = az acr show --name $AcrName --resource-group $ResourceGroup --query id -o tsv
$kvId = az keyvault show --name $KeyVaultName --resource-group $ResourceGroup --query id -o tsv

az role assignment create --assignee-object-id $principalId --assignee-principal-type ServicePrincipal --role AcrPull --scope $acrId 2>$null
az role assignment create --assignee-object-id $principalId --assignee-principal-type ServicePrincipal --role "Key Vault Secrets User" --scope $kvId 2>$null

Write-Host "Deploy concluido com imagem: $image"
Write-Host "AUTH_PATH=$AuthPath DATA_DIR=$DataDir"
Write-Host "Para persistir sessao/dados entre reinicios, monte o share Azure Files em /mnt/persist no portal e rode o deploy com -AuthPath e -DataDir apontando para /mnt/persist/..."
Write-Host "Atualize os segredos reais no Key Vault (GROQ-API-KEY, ADMIN-NUMBER) se ainda estiverem com placeholder."
