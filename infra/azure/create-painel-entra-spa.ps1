<#
.SYNOPSIS
  Cria uma App Registration no Entra ID (tipo SPA) para login Microsoft do painel-interno (MSAL).

.DESCRIPTION
  Exige permissao para criar aplicacoes no tenant (ex.: Application Developer).
  Depois copie o Client ID para o segredo GitHub PAINEL_VITE_AZURE_CLIENT_ID e o Tenant ID para
  PAINEL_VITE_AZURE_TENANT_ID; no Container App do bot defina ADMIN_PANEL_AZURE_CLIENT_ID e
  ADMIN_PANEL_AZURE_TENANT_ID com os mesmos valores.

.PARAMETER ProductionRedirectUri
  URL publica do painel (ex.: https://app-painel-xxx.azurewebsites.net/) — deve coincidir com
  PAINEL_VITE_AZURE_REDIRECT_URI no GitHub.

.PARAMETER LocalRedirectUri
  Opcional; por defeito http://localhost:5173/ para npm run dev no painel-interno.
#>
[CmdletBinding()]
param(
  [string] $DisplayName = "ABP6 Painel Interno (SPA)",
  [Parameter(Mandatory = $true)]
  [string] $ProductionRedirectUri,
  [string] $LocalRedirectUri = "http://localhost:5173/"
)

$ErrorActionPreference = "Stop"

function Normalize-RedirectUri([string] $u) {
  $t = $u.Trim()
  if (-not $t.EndsWith("/")) { $t += "/" }
  return $t
}

$prod = Normalize-RedirectUri $ProductionRedirectUri
$local = if ($LocalRedirectUri.Trim()) { Normalize-RedirectUri $LocalRedirectUri } else { $null }

$uris = [System.Collections.Generic.List[string]]::new()
if ($local) { $uris.Add($local) }
$uris.Add($prod)

$tenantId = az account show --query tenantId -o tsv
if (-not $tenantId) { throw "Execute az login e escolha a subscricao correta." }

Write-Host "A criar aplicacao '$DisplayName' (tenant $tenantId)..." -ForegroundColor Cyan
$createJson = az ad app create --display-name $DisplayName --sign-in-audience AzureADMyOrg -o json
if ($LASTEXITCODE -ne 0) { throw "az ad app create falhou (falta permissao Application.ReadWrite.All / papel para registar apps?)." }

$app = $createJson | ConvertFrom-Json
$clientId = $app.appId
if (-not $clientId) { throw "Resposta sem appId." }

Write-Host "A definir redirect URIs SPA: $($uris -join ', ')..." -ForegroundColor Cyan
$objectId = az ad app show --id $clientId --query id -o tsv
if (-not $objectId) { throw "Nao foi possivel obter o object id da aplicacao." }
$payloadObj = @{ spa = @{ redirectUris = [string[]]$uris.ToArray() } }
$json = $payloadObj | ConvertTo-Json -Compress -Depth 5
$tmp = [System.IO.Path]::GetTempFileName()
try {
  [System.IO.File]::WriteAllText($tmp, $json, [System.Text.UTF8Encoding]::new($false))
  az rest --method PATCH --uri "https://graph.microsoft.com/v1.0/applications/$objectId" --headers "Content-Type=application/json" --body "@$tmp"
  if ($LASTEXITCODE -ne 0) { throw "Graph API PATCH (spa.redirectUris) falhou." }
}
finally {
  Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== Registo criado ===" -ForegroundColor Green
Write-Host "Application (client) ID: $clientId"
Write-Host "Directory (tenant) ID:   $tenantId"
Write-Host ""
Write-Host "GitHub Actions > Secrets:" -ForegroundColor Yellow
Write-Host "  PAINEL_VITE_AZURE_CLIENT_ID  = $clientId"
Write-Host "  PAINEL_VITE_AZURE_TENANT_ID  = $tenantId"
Write-Host "  PAINEL_VITE_AZURE_REDIRECT_URI = $prod"
Write-Host ""
Write-Host "Container App do bot (env vars):" -ForegroundColor Yellow
Write-Host "  ADMIN_PANEL_AZURE_CLIENT_ID = $clientId"
Write-Host "  ADMIN_PANEL_AZURE_TENANT_ID = $tenantId"
Write-Host ""
Write-Host "Reexecute o deploy do painel e, se necessario, az containerapp update com as variaveis do bot." -ForegroundColor Gray
