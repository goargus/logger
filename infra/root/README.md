# Secretary Infrastructure -- Operations Guide

Infrastructure for the Secretary backend API on Azure Container Apps.

For architecture decisions and rationale, see
[`docs/plans/2026-02-18-azure-container-apps-infrastructure-design.md`](../../docs/plans/2026-02-18-azure-container-apps-infrastructure-design.md).

## Architecture (brief)

- **Compute**: Azure Container Apps (Consumption plan) running NestJS API
- **Database**: PostgreSQL Flexible Server (Burstable B1ms) with private endpoint via VNet
- **Networking**: VNet with separate subnets for Container Apps and data
- **Monitoring**: Log Analytics workspace
- **Frontend**: GitHub Pages (deployed separately, not managed here)
- **Registry**: GHCR (GitHub Container Registry)

## Prerequisites

- Azure CLI authenticated: `az login`
- Terraform >= 1.6.0
- Docker (for local image builds)
- GitHub PAT with `read:packages` scope (for GHCR pull)

## State Backend Setup (one-time)

Create the remote state storage before first `terraform init`:

```bash
az group create --name secretary-tfstate-rg --location eastus2
az storage account create --name secretarytfstate --resource-group secretary-tfstate-rg --sku Standard_LRS
az storage container create --name tfstate --account-name secretarytfstate
```

Then update `backend.tf` with the real values:

```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "secretary-tfstate-rg"
    storage_account_name = "secretarytfstate"
    container_name       = "tfstate"
    key                  = "secretary.prod.tfstate"
  }
}
```

## Variables

Create `terraform.tfvars` in this directory. **Never commit this file.**

```hcl
postgres_admin_username = "pgadmin"
postgres_admin_password = ""
container_image         = "ghcr.io/goargus/logger:latest"
ghcr_token              = ""
auth0_domain            = "dev-ohuspam6fnmh4tgt.us.auth0.com"
auth0_audience          = "logger"
auth0_issuer            = "https://dev-ohuspam6fnmh4tgt.us.auth0.com/"
admin_email             = ""
admin_username          = ""
admin_idp_issuer        = ""
admin_idp_subject       = ""
```

All sensitive values (`postgres_admin_password`, `ghcr_token`) are marked sensitive in Terraform and will not appear in plan output.

## First Deploy

1. Create the state backend (see above)
2. Update `backend.tf` with real storage account values
3. Push the first container image to GHCR:
   ```bash
   docker build -t ghcr.io/goargus/logger:latest ./backend
   docker push ghcr.io/goargus/logger:latest
   ```
4. Fill in `terraform.tfvars`
5. Deploy:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```
6. Note the `api_url` output -- update Auth0 allowed callback/logout URLs to include it
7. Update the frontend's `API_BASE_URL` to match the `api_url` output
8. Verify the API is reachable: `curl https://<api_fqdn>/health`

## Deploying Updates

**Automated (preferred):** Merging to `main` triggers GitHub Actions, which builds the image, pushes to GHCR, and deploys to Container Apps.

**Manual:**

```bash
az containerapp update \
  --name secretary-prod-api \
  --resource-group secretary-prod-rg \
  --image ghcr.io/goargus/logger:<sha>
```

## Monitoring

Stream live logs:

```bash
az containerapp logs show \
  --name secretary-prod-api \
  --resource-group secretary-prod-rg \
  --follow
```

For historical queries, use **Azure Portal > Log Analytics workspace** linked to the Container Apps environment. Example KQL:

```kql
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == "secretary-prod-api"
| order by TimeGenerated desc
| take 100
```

## Cost Overview

Estimated ~$28/month at minimal usage:

| Resource | Estimated Cost |
|----------|---------------|
| PostgreSQL Flexible Server (B1ms) | ~$13/mo |
| Container Apps (Consumption) | ~$5/mo |
| VNet + Private DNS | ~$4/mo |
| Log Analytics | ~$4/mo |
| Storage (tfstate) | < $1/mo |

**Biggest levers:** PostgreSQL SKU (B1ms vs higher) and Container App scaling (min/max replicas).

## Destroy

Tear down all managed resources:

```bash
terraform destroy
```

This does **not** remove the tfstate storage account (managed separately). Delete it manually if no longer needed:

```bash
az group delete --name secretary-tfstate-rg --yes
```
