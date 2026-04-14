Param(
  [string]$SubscriptionId,
  [string]$ResourceGroup = "rg-procon-bot-prod",
  [string]$AcrName = "acrproconbotprod",
  [string]$ContainerAppName = "procon-bot",
  [string]$ImageTag = "v1"
)

if (-not $SubscriptionId) {
  throw "Informe -SubscriptionId."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker nao encontrado no PATH. Instale o Docker Desktop e reabra o terminal."
}

$env:Path = "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin;" + $env:Path
az account set --subscription $SubscriptionId

$acrServer = az acr show --name $AcrName --resource-group $ResourceGroup --query loginServer -o tsv
$image = "$acrServer/${ContainerAppName}:$ImageTag"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

Write-Host "Login no ACR e build local (requer Docker)..."
az acr login --name $AcrName

Push-Location $repoRoot
try {
  docker build -t $image -f Dockerfile .
  docker push $image
}
finally {
  Pop-Location
}

Write-Host "Imagem publicada: $image"
Write-Host "Proximo passo: .\infra\azure\deploy-containerapp.ps1 -SubscriptionId `"$SubscriptionId`" -SkipBuild -ImageTag `"$ImageTag`""
