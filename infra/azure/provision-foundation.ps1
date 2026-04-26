Param(
  [string]$SubscriptionId,
  [string]$ResourceGroup = "rg-procon-bot-prod",
  # Região dos recursos (ACR, Storage, Key Vault, Container Apps). Contas institucionais (ex.: Fatec/CPS)
  # podem restringir regiões; `chilecentral` está permitida na assinatura atual.
  [string]$Location = "chilecentral",
  [string]$AcrName = "acrproconbotprod",
  [string]$StorageName = "stproconbotprod",
  [string]$FileShareName = "botpersistshare",
  [string]$KeyVaultName = "kv-procon-bot-prod",
  [string]$ContainerEnvName = "acae-procon-bot-prod"
)

$ErrorActionPreference = "Stop"

if (-not $SubscriptionId) {
  throw "Informe -SubscriptionId para executar o provisionamento."
}

az account set --subscription $SubscriptionId

# Providers exigidos (assinaturas novas costumam vir sem registro automático).
$providers = @(
  "Microsoft.ContainerRegistry",
  "Microsoft.KeyVault",
  "Microsoft.Storage",
  "Microsoft.App",
  "Microsoft.OperationalInsights"
)
foreach ($p in $providers) {
  az provider register -n $p --wait
}

$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "false") {
  az group create `
    --name $ResourceGroup `
    --location $Location
}

az acr create `
  --name $AcrName `
  --resource-group $ResourceGroup `
  --location $Location `
  --sku Basic `
  --admin-enabled false

az storage account create `
  --name $StorageName `
  --resource-group $ResourceGroup `
  --location $Location `
  --sku Standard_LRS `
  --kind StorageV2

az storage share-rm create `
  --resource-group $ResourceGroup `
  --storage-account $StorageName `
  --name $FileShareName `
  --quota 50

az keyvault create `
  --name $KeyVaultName `
  --resource-group $ResourceGroup `
  --location $Location `
  --sku standard

# Key Vault com RBAC: conceder ao usuário atual permissão para criar/atualizar segredos.
$userObjectId = az ad signed-in-user show --query id -o tsv
$keyVaultId = az keyvault show --name $KeyVaultName --resource-group $ResourceGroup --query id -o tsv
az role assignment create `
  --assignee-object-id $userObjectId `
  --assignee-principal-type User `
  --role "Key Vault Secrets Officer" `
  --scope $keyVaultId `
  2>$null

# Log Analytics é criado automaticamente com o ambiente (evita falha quando a assinatura restringe regiões).
az containerapp env create `
  --name $ContainerEnvName `
  --resource-group $ResourceGroup `
  --location $Location

Write-Host "Provisionamento base concluido."
Write-Host "Agora defina os segredos no Key Vault (GROQ-API-KEY, ADMIN-NUMBER, etc.)."
