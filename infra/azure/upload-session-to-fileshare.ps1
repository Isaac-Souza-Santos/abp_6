Param(
  [string]$SubscriptionId,
  [string]$ResourceGroup = "rg-procon-bot-prod",
  [string]$StorageName = "stproconbotprod",
  [string]$ShareName = "botpersistshare",
  [string]$LocalAuthDir = "",
  [string]$LocalDataDir = "",
  [switch]$SkipData
)

if (-not $SubscriptionId) {
  throw "Informe -SubscriptionId."
}

$ErrorActionPreference = "Stop"
$env:Path = "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin;" + $env:Path
az account set --subscription $SubscriptionId

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Push-Location $repoRoot
try {
  if (-not $LocalAuthDir) {
    $sec = Join-Path $repoRoot "security\.wwebjs_auth"
    $root = Join-Path $repoRoot ".wwebjs_auth"
    if (Test-Path $sec) { $LocalAuthDir = $sec }
    elseif (Test-Path $root) { $LocalAuthDir = $root }
    else {
      throw "Pasta de sessao nao encontrada. Crie `security\.wwebjs_auth` ou `.wwebjs_auth` na raiz, ou passe -LocalAuthDir."
    }
  }

  if (-not (Test-Path $LocalAuthDir)) {
    throw "Pasta nao existe: $LocalAuthDir"
  }

  $key = az storage account keys list -g $ResourceGroup -n $StorageName --query "[0].value" -o tsv

  Write-Host "Criando diretorio remoto .wwebjs_auth no share $ShareName (se necessario)..."
  az storage directory create `
    --account-name $StorageName `
    --account-key $key `
    --share-name $ShareName `
    --name ".wwebjs_auth" `
    2>$null

  Write-Host "Enviando sessao de: $LocalAuthDir"
  az storage file upload-batch `
    --account-name $StorageName `
    --account-key $key `
    --destination "$ShareName/.wwebjs_auth" `
    --source $LocalAuthDir `
    --pattern "*"

  if (-not $SkipData) {
    if (-not $LocalDataDir) {
      $LocalDataDir = Join-Path $repoRoot "data"
    }
    if (Test-Path $LocalDataDir) {
      Write-Host "Criando diretorio remoto data..."
      az storage directory create `
        --account-name $StorageName `
        --account-key $key `
        --share-name $ShareName `
        --name "data" `
        2>$null
      Write-Host "Enviando dados de: $LocalDataDir"
      az storage file upload-batch `
        --account-name $StorageName `
        --account-key $key `
        --destination "$ShareName/data" `
        --source $LocalDataDir `
        --pattern "*"
    } else {
      Write-Host "Pasta data local nao encontrada; pulando (use -SkipData para suprimir este aviso)."
    }
  }
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "Upload concluido."
Write-Host "Rode o deploy com volume + paths (sem Portal):"
Write-Host "   .\infra\azure\deploy-containerapp.ps1 -SubscriptionId `"$SubscriptionId`" -ImageTag `"v1`" -SkipBuild -MountAzureFilesShare"
Write-Host "Ou equivalente: -AuthPath `"/mnt/persist/.wwebjs_auth`" -DataDir `"/mnt/persist/data`" (o deploy aplica o mount automaticamente quando o path esta sob /mnt/persist)."
