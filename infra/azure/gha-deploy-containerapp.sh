#!/usr/bin/env bash
# Deploy no Azure Container App apos push da imagem (GitHub Actions / Linux).
# Replica a logica de deploy-containerapp.ps1 com volume persistente.
# Pre-requisito: az logado; Node 18+; Container App ja existente.
set -euo pipefail

RG="${RG:-rg-procon-bot-prod}"
ENV_NAME="${ENV_NAME:-acae-procon-bot-prod}"
APP="${APP:-procon-bot}"
ACR="${ACR:-acrproconbotprod}"
STORAGE="${STORAGE:-stproconbotprod}"
SHARE="${SHARE:-botpersistshare}"
KV="${KV:-kv-procon-bot-prod}"
IMAGE_TAG="${IMAGE_TAG:-v1}"
PERSIST_MOUNT="${PERSIST_MOUNT:-/mnt/persist}"
VOL_NAME="${VOL_NAME:-persist-vol}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ACR_SERVER=$(az acr show -n "$ACR" -g "$RG" --query loginServer -o tsv)
IMAGE="${ACR_SERVER}/${APP}:${IMAGE_TAG}"
AUTH_PATH="${PERSIST_MOUNT}/.wwebjs_auth"
DATA_DIR="${PERSIST_MOUNT}/data"

STORAGE_KEY=$(az storage account keys list -g "$RG" -n "$STORAGE" --query '[0].value' -o tsv)

az acr config authentication-as-arm update -n "$ACR" -g "$RG" --status enabled 2>/dev/null || true

az containerapp env storage set \
  --name "$ENV_NAME" -g "$RG" \
  --storage-name "$SHARE" \
  --azure-file-account-name "$STORAGE" \
  --azure-file-account-key "$STORAGE_KEY" \
  --azure-file-share-name "$SHARE" \
  --access-mode ReadWrite

if ! az containerapp show -n "$APP" -g "$RG" &>/dev/null; then
  echo "::error::Container App '$APP' nao existe neste resource group. Crie com infra/azure/deploy-containerapp.ps1 primeiro."
  exit 1
fi

echo "Atualizando imagem: $IMAGE"
az containerapp update -n "$APP" -g "$RG" \
  --image "$IMAGE" \
  --cpu 0.5 --memory 1.0Gi \
  --min-replicas 1 --max-replicas 1 \
  --replace-env-vars \
  NODE_ENV=production \
  HEALTH_PORT=3000 \
  "AUTH_PATH=${AUTH_PATH}" \
  "DATA_DIR=${DATA_DIR}" \
  GROQ_API_KEY=secretref:groq-api-key \
  ADMIN_NUMBER=secretref:admin-number

SHOW_JSON=$(mktemp)
PUT_JSON=$(mktemp)
trap 'rm -f "$SHOW_JSON" "$PUT_JSON"' EXIT

az containerapp show -n "$APP" -g "$RG" -o json > "$SHOW_JSON"
node "$ROOT/infra/azure/apply-persist-volume.mjs" \
  --input "$SHOW_JSON" \
  --output "$PUT_JSON" \
  --env-storage-name "$SHARE" \
  --volume-name "$VOL_NAME" \
  --mount-path "$PERSIST_MOUNT" \
  --auth-path "$AUTH_PATH" \
  --data-dir "$DATA_DIR" \
  --image "$IMAGE"

PRINCIPAL_ID=$(az containerapp show -n "$APP" -g "$RG" --query identity.principalId -o tsv)
if [[ -z "$PRINCIPAL_ID" ]]; then
  echo "::error::Nao foi possivel obter principalId da identidade do Container App."
  exit 1
fi

ACR_ID=$(az acr show -n "$ACR" -g "$RG" --query id -o tsv)
KV_ID=$(az keyvault show -n "$KV" -g "$RG" --query id -o tsv)

az role assignment create \
  --assignee-object-id "$PRINCIPAL_ID" --assignee-principal-type ServicePrincipal \
  --role AcrPull --scope "$ACR_ID" 2>/dev/null || true
az role assignment create \
  --assignee-object-id "$PRINCIPAL_ID" --assignee-principal-type ServicePrincipal \
  --role "Key Vault Secrets User" --scope "$KV_ID" 2>/dev/null || true

echo "Deploy concluido: $IMAGE (AUTH_PATH=$AUTH_PATH)"
