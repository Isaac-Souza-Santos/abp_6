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
  # Define AUTH_PATH/DATA_DIR embaixo do mount e aplica volume Azure Files (ARM PUT via apply-persist-volume.mjs).
  [switch]$MountAzureFilesShare,
  [string]$PersistMountPath = "/mnt/persist",
  [string]$PersistVolumeName = "persist-vol",
  # Sem volume: pastas dentro da imagem. Com persistência: use -MountAzureFilesShare ou -AuthPath/-DataDir em /mnt/persist/...
  [string]$AuthPath = "/app/.wwebjs_auth",
  [string]$DataDir = "/app/data"
)

if (-not $SubscriptionId) {
  throw "Informe -SubscriptionId para executar o deploy."
}

if ($MountAzureFilesShare) {
  $AuthPath = "$PersistMountPath/.wwebjs_auth"
  $DataDir = "$PersistMountPath/data"
}

$env:Path = "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin;" + $env:Path
az account set --subscription $SubscriptionId

$acrServer = az acr show --name $AcrName --resource-group $ResourceGroup --query loginServer -o tsv
$image = "$acrServer/$ContainerAppName`:$ImageTag"

# Mesma tag (ex.: v1) pode manter digest antigo na revisao; pinnar @sha256 forca pull da imagem recem-publicada.
Write-Host "A resolver digest no ACR para a tag '$ImageTag'..."
$digestPin = $null
$manifestJson = az acr repository show-manifests --name $AcrName --repository $ContainerAppName -o json 2>$null
if ($LASTEXITCODE -eq 0 -and $manifestJson) {
  try {
    $manifests = $manifestJson | ConvertFrom-Json
    foreach ($m in $manifests) {
      if ($null -eq $m.tags) { continue }
      if ($m.tags -contains $ImageTag) {
        $digestPin = $m.digest
        break
      }
    }
  } catch { }
}
if ($digestPin) {
  $image = "$acrServer/${ContainerAppName}@$digestPin"
  Write-Host "Imagem pinnada por digest (forca pull no Container App): $image" -ForegroundColor Green
} else {
  Write-Host "Aviso: nao foi possivel obter digest da tag; deploy usa :$ImageTag (o ACA pode nao atualizar o contentor)." -ForegroundColor Yellow
}

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

$wantsPersistVolume = $MountAzureFilesShare -or ($AuthPath -like "$PersistMountPath*") -or ($DataDir -like "$PersistMountPath*")
if ($wantsPersistVolume) {
  $showJson = [System.IO.Path]::ChangeExtension([System.IO.Path]::GetTempFileName(), "json")
  $putJson = [System.IO.Path]::ChangeExtension([System.IO.Path]::GetTempFileName(), "json")
  try {
    $showText = az containerapp show --name $ContainerAppName --resource-group $ResourceGroup -o json
    if ($LASTEXITCODE -ne 0) { throw "az containerapp show falhou." }
    [System.IO.File]::WriteAllText($showJson, $showText, [System.Text.UTF8Encoding]::new($false))
    $applyScript = Join-Path $PSScriptRoot "apply-persist-volume.mjs"
    if (-not (Test-Path $applyScript)) { throw "Arquivo nao encontrado: $applyScript" }
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) { throw "Node.js nao encontrado no PATH (necessario para montar Azure Files no Container App)." }
    & node $applyScript `
      --input $showJson `
      --output $putJson `
      --env-storage-name $FileShareName `
      --volume-name $PersistVolumeName `
      --mount-path $PersistMountPath `
      --auth-path $AuthPath `
      --data-dir $DataDir `
      --image $image
    if ($LASTEXITCODE -ne 0) { throw "apply-persist-volume.mjs falhou (montagem Azure Files / ARM PUT)." }
  }
  finally {
    Remove-Item -LiteralPath $showJson -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $putJson -ErrorAction SilentlyContinue
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

# Duas revisões ativas no mesmo Azure Files = dois Chromes no mesmo userDataDir.
Write-Host "Aguardando propagacao da nova revisao (desativar antigas libera locks no volume)..."
Start-Sleep -Seconds 25
$latest = az containerapp show --name $ContainerAppName --resource-group $ResourceGroup --query "properties.latestRevisionName" -o tsv
if ($latest) {
  Write-Host "Revisao mais recente: $latest"
  $revs = az containerapp revision list --name $ContainerAppName --resource-group $ResourceGroup --query '[?properties.active==`true`].name' -o tsv
  foreach ($line in ($revs -split "`n")) {
    $rev = $line.Trim()
    if ($rev -and $rev -ne $latest) {
      Write-Host "Desativando revisao antiga: $rev"
      az containerapp revision deactivate --name $ContainerAppName --resource-group $ResourceGroup --revision $rev 2>$null | Out-Null
    }
  }
} else {
  Write-Host "Aviso: nao foi possivel ler latestRevisionName."
}

Write-Host "Deploy concluido com imagem: $image"
Write-Host "AUTH_PATH=$AuthPath DATA_DIR=$DataDir"
if ($wantsPersistVolume) {
  Write-Host "Volume Azure Files: storage env '$FileShareName' montado em $PersistMountPath (volume $PersistVolumeName). Envie a sessao com .\infra\azure\upload-session-to-fileshare.ps1 se precisar."
} else {
  Write-Host "Sem volume persistente: para Azure Files use -MountAzureFilesShare ou -AuthPath/-DataDir sob $PersistMountPath (e upload-session-to-fileshare.ps1)."
}
Write-Host "Atualize os segredos reais no Key Vault (GROQ-API-KEY, ADMIN-NUMBER) se ainda estiverem com placeholder."
