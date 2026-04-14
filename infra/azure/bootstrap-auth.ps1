Param(
  [string]$SubscriptionId,
  [string]$ResourceGroup = "rg-procon-bot-prod",
  [string]$ContainerAppName = "procon-bot"
)

if (-not $SubscriptionId) {
  throw "Informe -SubscriptionId para acompanhar o bootstrap."
}

az account set --subscription $SubscriptionId

Write-Host "Acompanhando logs do Container App para capturar QR e status de autenticacao..."
Write-Host "Procure por mensagens: 'Escaneie o QR Code', 'Autenticado com sucesso' e 'conectado e pronto'."

az containerapp logs show `
  --name $ContainerAppName `
  --resource-group $ResourceGroup `
  --follow
