# Para o Container App (stop), apaga o conteudo do Azure Files (share) e remove imagens do ACR.
# Depois: rode build/push da imagem e deploy (ex.: workflow acr-build-push ou build-push-local + deploy-containerapp).
# AVISO: perde sessão WhatsApp no volume e tags da imagem no ACR.
Param(
  [Parameter(Mandatory = $true)]
  [string]$SubscriptionId,
  [string]$ResourceGroup = "rg-procon-bot-prod",
  [string]$ContainerAppName = "procon-bot",
  [string]$AcrName = "acrproconbotprod",
  [string]$StorageName = "stproconbotprod",
  [string]$FileShareName = "botpersistshare",
  [int]$ShareQuotaGiB = 50,
  [string]$ImageRepository = "procon-bot",
  [switch]$SkipAcrDelete,
  [switch]$Force
)

# Continue: o az.exe envia UserWarning do Python (ex. 32-bit) para stderr e no PS 5.1 isso com Stop parece erro fatal.
$ErrorActionPreference = "Continue"
$env:Path = "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin;" + $env:Path

az account set --subscription $SubscriptionId 2>$null
if ($LASTEXITCODE -ne 0) {
  throw "Assinatura invalida ou nao autenticado (az login). Corrija -SubscriptionId (GUID real)."
}

if (-not $Force) {
  Write-Host ""
  Write-Host "Isto vai:" -ForegroundColor Yellow
  Write-Host "  1) Parar o Container App (stop / atualizar extensao / desativar revisoes) para soltar locks do Chrome no volume."
  Write-Host "  2) APAGAR e recriar o file share '$FileShareName' na conta '$StorageName' (tudo dentro do share some)."
  if (-not $SkipAcrDelete) {
    Write-Host "  3) APAGAR o repositório de imagens '$ImageRepository' no ACR '$AcrName' (todas as tags)."
  } else {
    Write-Host '  3) (ignorado) ACR - use sem -SkipAcrDelete para apagar imagens no ACR.'
  }
  Write-Host ""
  $c = Read-Host "Escreva EXATO: SIM (para continuar)"
  if ($c -ne "SIM") {
    Write-Host "Cancelado."
    exit 0
  }
}

function Stop-ContainerAppOrDeactivateRevisions {
  param(
    [string]$Name,
    [string]$Group
  )
  az containerapp stop --name $Name --resource-group $Group *>$null
  if ($LASTEXITCODE -eq 0) { return }

  Write-Host "  (stop nao reconhecido nesta CLI; a atualizar extensao containerapp...)" -ForegroundColor DarkYellow
  az extension add --name containerapp --upgrade *>$null
  az containerapp stop --name $Name --resource-group $Group *>$null
  if ($LASTEXITCODE -eq 0) { return }

  Write-Host "  (fallback: desativar todas as revisoes ativas para soltar o Chrome no volume)" -ForegroundColor DarkYellow
  $raw = az containerapp revision list --name $Name --resource-group $Group -o json 2>$null
  if (-not $raw) {
    throw "Nao foi possivel parar o app (stop inexistente?) nem listar revisoes. Instale CLI 64-bit e: az extension add --name containerapp --upgrade"
  }
  $revs = @($raw | ConvertFrom-Json)
  foreach ($r in $revs) {
    if ($r.properties.active -eq $true) {
      Write-Host "    Desativando revisao $($r.name)..."
      az containerapp revision deactivate --name $Name --resource-group $Group --revision $r.name *>$null
    }
  }
}

function Start-ContainerAppOrActivateLatest {
  param(
    [string]$Name,
    [string]$Group
  )
  az containerapp start --name $Name --resource-group $Group *>$null
  if ($LASTEXITCODE -eq 0) { return }

  az extension add --name containerapp --upgrade *>$null
  az containerapp start --name $Name --resource-group $Group *>$null
  if ($LASTEXITCODE -eq 0) { return }

  $latest = az containerapp show --name $Name --resource-group $Group --query "properties.latestRevisionName" -o tsv 2>$null
  if (-not $latest) { throw "Nao foi possivel iniciar o app (start inexistente?). Corra: az extension add --name containerapp --upgrade" }
  Write-Host "  (fallback: ativar revisao $latest)" -ForegroundColor DarkYellow
  az containerapp revision activate --name $Name --resource-group $Group --revision $latest
  if ($LASTEXITCODE -ne 0) { throw "az containerapp revision activate falhou." }
}

Write-Host "`n[1/4] A parar o Container App $ContainerAppName..."
Stop-ContainerAppOrDeactivateRevisions -Name $ContainerAppName -Group $ResourceGroup

Write-Host "[2/4] A aguardar replicas a terminarem (ate ~120s)..."
$deadline = (Get-Date).AddSeconds(120)
$ok = $false
while ((Get-Date) -lt $deadline) {
  $raw = az containerapp replica list --name $ContainerAppName --resource-group $ResourceGroup -o json 2>$null
  $replicas = @($raw | ConvertFrom-Json)
  if ($replicas.Count -eq 0) {
    $ok = $true
    break
  }
  Write-Host "  Replicas ainda listadas: $($replicas.Count) - aguardar 5s..."
  Start-Sleep -Seconds 5
}
if (-not $ok) {
  Write-Host "Aviso: timeout a aguardar replicas a zero. Se o share nao apagar, aguarde e volte a correr o script." -ForegroundColor Yellow
}
Start-Sleep -Seconds 10

Write-Host "`n[3/4] A apagar e recriar o file share '$FileShareName'..."
az storage share-rm delete `
  --resource-group $ResourceGroup `
  --storage-account $StorageName `
  --name $FileShareName `
  --yes *>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "  (delete nao exit 0: share inexistente ou ja em apagamento; continua-se para criar com retentativas.)" -ForegroundColor DarkYellow
}

# O Azure mantem o nome reservado uns minutos apos delete (ShareBeingDeleted). Recriar so com retentativas.
Write-Host "  A criar o share (retentativas ate ~12 min se aparecer ShareBeingDeleted)..."
$maxCreateAttempts = 36
$sleepCreateSec = 20
$created = $false
for ($a = 1; $a -le $maxCreateAttempts; $a++) {
  az storage share-rm create `
    --resource-group $ResourceGroup `
    --storage-account $StorageName `
    --name $FileShareName `
    --quota $ShareQuotaGiB *>$null
  if ($LASTEXITCODE -eq 0) {
    $created = $true
    break
  }
  Write-Host "    Tentativa $a/$maxCreateAttempts : create falhou (normal: share ainda a ser libertado). Aguardar ${sleepCreateSec}s..."
  Start-Sleep -Seconds $sleepCreateSec
}
if (-not $created) {
  throw "az storage share-rm create falhou apos varias tentativas (ShareBeingDeleted). Aguarde 10-15 min e volte a correr o script so a partir do passo [3/4] ou execute de novo o script completo."
}

# O ambiente do Container App continua a referir o mesmo nome de storage/share; o deploy volta a fazer env storage set.
Write-Host "`n[4/4] ACR e escala final..."
if (-not $SkipAcrDelete) {
  Write-Host "A apagar repositório de imagens no ACR: $AcrName/$ImageRepository ..."
  az acr repository delete --name $AcrName --repository $ImageRepository --yes 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Aviso: delete do repositório ACR falhou ou já estava vazio (código $LASTEXITCODE)." -ForegroundColor Yellow
  }
  Write-Host "App mantido PARADO ate existir imagem no ACR. Apos build+push e deploy: az containerapp start -n $ContainerAppName -g $ResourceGroup (ou revision activate no portal)" -ForegroundColor Cyan
} else {
  Write-Host "A iniciar o app e repor 1 replica (imagem no ACR mantida)..."
  Start-ContainerAppOrActivateLatest -Name $ContainerAppName -Group $ResourceGroup
  az containerapp update `
    --name $ContainerAppName `
    --resource-group $ResourceGroup `
    --min-replicas 1 `
    --max-replicas 1
  if ($LASTEXITCODE -ne 0) { throw "az containerapp update (scale 1) falhou." }
}

Write-Host ""
Write-Host "Concluído." -ForegroundColor Green
Write-Host "Se apagou o ACR: build/push obrigatorio; depois deploy e: az containerapp start -n $ContainerAppName -g $ResourceGroup"
Write-Host "  - GitHub Actions: workflow acr-build-push (ou push para main nos paths do workflow)."
Write-Host ('  - Local: .\infra\azure\build-push-local.ps1 -SubscriptionId "' + $SubscriptionId + '" -ImageTag v1')
Write-Host ('  - Deploy: .\infra\azure\deploy-containerapp.ps1 -SubscriptionId "' + $SubscriptionId + '" -SkipBuild -ImageTag v1 -MountAzureFilesShare')
Write-Host ''
Write-Host 'Sessao WhatsApp: volume vazio. No Azure: escanear QR de novo ou usar infra\azure\upload-session-to-fileshare.ps1.'
