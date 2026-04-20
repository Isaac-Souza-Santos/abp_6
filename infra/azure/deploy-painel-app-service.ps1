<#
.SYNOPSIS
  Cria App Service Plan + Web App (Linux Node 20) e publica o painel (ZIP gerado por package-painel-app-service.ps1).
.PARAMETER SubscriptionId
  ID da assinatura (obrigatório se não estiver no contexto certo).
#>
param(
  [string]$SubscriptionId,
  [string]$ResourceGroup = "rg-procon-bot-prod",
  [string]$Location = "francecentral",
  [string]$PlanName = "asp-painel-procon",
  [string]$WebAppName = "app-painel-procon-interno",
  [string]$ZipPath = (Join-Path $PSScriptRoot "painel-app-service.zip"),
  [ValidateSet("B1", "S1", "P0v3", "F1")]
  [string]$PlanSku = "B1"
)

# Azure CLI envia avisos (ex. cryptography) para stderr; com "Stop" o PowerShell 5 trata como erro fatal.
$ErrorActionPreference = "Continue"
$env:Path = "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin;" + $env:Path

if ($SubscriptionId) {
  az account set --subscription $SubscriptionId | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "az account set falhou (codigo $LASTEXITCODE)." }
}

if (-not (Test-Path $ZipPath)) {
  throw "ZIP nao encontrado: $ZipPath. Rode antes: infra/azure/package-painel-app-service.ps1 (com VITE_API_BASE_URL definido)."
}

$null = az appservice plan show --name $PlanName --resource-group $ResourceGroup 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Criando App Service Plan $PlanName ($PlanSku)..." -ForegroundColor Cyan
  $null = az appservice plan create `
    --name $PlanName `
    --resource-group $ResourceGroup `
    --location $Location `
    --is-linux `
    --sku $PlanSku 2>&1
  if ($LASTEXITCODE -ne 0) { throw "az appservice plan create falhou (codigo $LASTEXITCODE)." }
}

$null = az webapp show --name $WebAppName --resource-group $ResourceGroup 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Criando Web App $WebAppName..." -ForegroundColor Cyan
  $null = az webapp create `
    --name $WebAppName `
    --resource-group $ResourceGroup `
    --plan $PlanName `
    --runtime "NODE:20-lts" 2>&1
  if ($LASTEXITCODE -ne 0) { throw "az webapp create falhou (codigo $LASTEXITCODE)." }
}

Write-Host "Configurando arranque Node..." -ForegroundColor Cyan
$null = az webapp config set `
  --name $WebAppName `
  --resource-group $ResourceGroup `
  --startup-file "npm start" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Aviso: az webapp config set (startup) retornou $LASTEXITCODE; o runtime pode ja estar definido pelo create." -ForegroundColor Yellow
}

$null = az webapp config appsettings set `
  --name $WebAppName `
  --resource-group $ResourceGroup `
  --settings `
  SCM_DO_BUILD_DURING_DEPLOYMENT=false `
  NODE_ENV=production 2>&1
if ($LASTEXITCODE -ne 0) { throw "az webapp config appsettings set falhou (codigo $LASTEXITCODE)." }

Write-Host "Publicando ZIP..." -ForegroundColor Cyan
$null = az webapp deploy `
  --name $WebAppName `
  --resource-group $ResourceGroup `
  --src-path $ZipPath `
  --type zip 2>&1
if ($LASTEXITCODE -ne 0) { throw "az webapp deploy falhou (codigo $LASTEXITCODE)." }

$hostName = az webapp show --name $WebAppName --resource-group $ResourceGroup --query defaultHostName -o tsv 2>$null
Write-Host ""
Write-Host "Painel publicado: https://$hostName" -ForegroundColor Green
$null = az containerapp update -n procon-bot -g $ResourceGroup --set-env-vars "ADMIN_PANEL_ORIGIN=https://$hostName" "ADMIN_PANEL_TOKEN=secretref:admin-panel-token" 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "ADMIN_PANEL_ORIGIN atualizado no Container App procon-bot." -ForegroundColor Green
} else {
  Write-Host "Aviso: nao foi possivel atualizar ADMIN_PANEL_ORIGIN no Container App (ajuste manualmente)." -ForegroundColor Yellow
}
Write-Host "Autenticacao Microsoft: Portal -> Web App -> Authentication -> Add identity provider -> Microsoft." -ForegroundColor Yellow
Write-Host "Documentacao (local, nao versionada): local/PAINEL-AZURE-APP-SERVICE.md — ver documentacao/AZURE-CONFIGURACAO.md" -ForegroundColor Yellow
