#!/usr/bin/env bash
#
# Bootstrap shared Terraform state backend in Azure.
#
# Creates:
#   - Resource group:    rg-shared
#   - Storage account:   sharedtfstate01  (versioning + 7-day soft delete)
#   - Blob container:    tfstate
#   - CanNotDelete lock on the resource group
#
# Safe to re-run — all commands use --only-show-errors and are idempotent.

set -euo pipefail

RG="rg-shared"
LOCATION="southcentralus"
SA="sharedtfstate01"
CONTAINER="tfstate"

echo "==> Creating resource group: ${RG}"
az group create \
  --name "$RG" \
  --location "$LOCATION" \
  --only-show-errors

echo "==> Creating storage account: ${SA}"
az storage account create \
  --name "$SA" \
  --resource-group "$RG" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false \
  --only-show-errors

echo "==> Enabling blob versioning and 7-day soft delete"
az storage account blob-service-properties update \
  --account-name "$SA" \
  --resource-group "$RG" \
  --enable-versioning true \
  --delete-retention-days 7 \
  --enable-delete-retention true \
  --only-show-errors

echo "==> Creating blob container: ${CONTAINER}"
az storage container create \
  --name "$CONTAINER" \
  --account-name "$SA" \
  --auth-mode login \
  --only-show-errors

echo "==> Adding CanNotDelete lock on ${RG} (requires Owner/UAA role)"
if az lock create \
  --name "protect-shared-state" \
  --resource-group "$RG" \
  --lock-type CanNotDelete \
  --notes "Protects Terraform remote state storage" \
  --only-show-errors 2>/dev/null; then
  echo "    Lock created."
else
  echo "    WARN: Could not create lock (missing Microsoft.Authorization/locks/write)."
  echo "    Add it manually via the Azure portal with an Owner account."
fi

echo "==> Done. State backend ready at:"
echo "    resource_group_name  = \"${RG}\""
echo "    storage_account_name = \"${SA}\""
echo "    container_name       = \"${CONTAINER}\""
