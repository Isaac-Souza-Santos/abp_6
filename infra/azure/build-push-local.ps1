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

$dockerCandidatePaths = @(
  "${env:ProgramFiles}\Docker\Docker\resources\bin",
  "${env:ProgramFiles(x86)}\Docker\Docker\resources\bin",
  "${env:LocalAppData}\Programs\Docker\Docker\resources\bin"
)
foreach ($p in $dockerCandidatePaths) {
  if ($p -and (Test-Path (Join-Path $p "docker.exe"))) {
    $env:Path = "$p;$env:Path"
    break
  }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker nao encontrado. Instale o Docker Desktop, inicie o engine e reabra o terminal (ou adicione o diretorio do docker.exe ao PATH)."
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
Write-Host "Proximo passo (local): .\infra\azure\deploy-containerapp.ps1 -SubscriptionId `"$SubscriptionId`" -SkipBuild -ImageTag `"$ImageTag`" -MountAzureFilesShare"
Write-Host "Ou deixe o GitHub Actions (job deploy em acr-build-push.yml) atualizar o Container App apos push em main/master."
