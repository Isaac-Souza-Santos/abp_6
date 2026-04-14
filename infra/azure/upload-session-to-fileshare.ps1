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

  Write-Host "Enviando ficheiros de sessao (exceto pasta session) de: $LocalAuthDir"
  Get-ChildItem -LiteralPath $LocalAuthDir -Force | Where-Object { $_.Name -ine "session" } | ForEach-Object {
    if ($_.PSIsContainer) {
      az storage file upload-batch `
        --account-name $StorageName `
        --account-key $key `
        --destination "$ShareName/.wwebjs_auth/$($_.Name)" `
        --source $_.FullName `
        --pattern "*"
    }
    else {
      az storage file upload `
        --account-name $StorageName `
        --account-key $key `
        --share-name $ShareName `
        --source $_.FullName `
        --path ".wwebjs_auth/$($_.Name)" `
        --overwrite
    }
  }

  $localSession = Join-Path $LocalAuthDir "session"
  if (Test-Path $localSession) {
    Write-Host "Enviando perfil Chromium (pasta session) para .wwebjs_auth/_seed_session (o pod copia para EmptyDir no arranque)."
    az storage directory create `
      --account-name $StorageName `
      --account-key $key `
      --share-name $ShareName `
      --name ".wwebjs_auth/_seed_session" `
      2>$null
    az storage file upload-batch `
      --account-name $StorageName `
      --account-key $key `
      --destination "$ShareName/.wwebjs_auth/_seed_session" `
      --source $localSession `
      --pattern "*"
    $bump = (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss") + "-" + ([Guid]::NewGuid().ToString("N").Substring(0, 12))
    $bumpTmp = Join-Path $env:TEMP "seed-bump-$bump.txt"
    Set-Content -LiteralPath $bumpTmp -Value $bump -NoNewline -Encoding ascii
    az storage file upload `
      --account-name $StorageName `
      --account-key $key `
      --share-name $ShareName `
      --source $bumpTmp `
      --path ".wwebjs_auth/_seed_session/.seed-bump" `
      --overwrite
    Remove-Item -LiteralPath $bumpTmp -ErrorAction SilentlyContinue
    Write-Host "Marcador .seed-bump escrito; apos restart o pod reaplica o seed mesmo se session/ EmptyDir nao estava vazio."
  }
  else {
    Write-Host "Aviso: nao existe $localSession - escaneie o QR no Azure ou crie sessao local primeiro."
  }

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
Write-Host "EmptyDir: copia _seed_session se session/ vazio OU se .seed-bump no share for diferente do do pod (apos cada upload)."
Write-Host "Rode o deploy com volume + paths (sem Portal):"
Write-Host ('   .\infra\azure\deploy-containerapp.ps1 -SubscriptionId "' + $SubscriptionId + '" -ImageTag "v1" -SkipBuild -MountAzureFilesShare')
Write-Host 'Ou equivalente: -AuthPath "/mnt/persist/.wwebjs_auth" -DataDir "/mnt/persist/data" (deploy aplica mount quando o path esta sob /mnt/persist).'
