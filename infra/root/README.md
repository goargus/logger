# Logger Infrastructure — Operations Guide

Infrastructure for the Logger backend API on Azure Container Apps.

## Architecture

| Layer | Resource | Name |
|-------|----------|------|
| Compute | Container Apps (Consumption) | `cae-logger-prod` / `ca-logger-prod-api` |
| Database | PostgreSQL Flexible Server (B1ms) | `psql-logger-prod` |
| Networking | VNet + private DNS | `vnet-logger-prod` |
| Monitoring | Log Analytics | `law-logger-prod` |
| State | Shared storage account | `sharedtfstate01` in `rg-shared` |
| Registry | GHCR | `ghcr.io/goargus/logger` |

All application resources live in `rg-logger-prod`. State storage lives in the
shared resource group `rg-shared` (org-wide, not per-project).

**Naming convention:** Azure CAF — `{type}-{workload}-{env}` (e.g. `rg-logger-prod`).

## Prerequisites

- Azure CLI authenticated (`az login`)
- Terraform >= 1.6.0
- GitHub PAT with `read:packages` scope (for GHCR pull)

## Bootstrap State Backend (one-time)

Run the bootstrap script to create the shared remote state storage:

```bash
bash infra/scripts/bootstrap-state.sh
```

This creates `rg-shared` with a `CanNotDelete` lock, storage account `sharedtfstate01`
(blob versioning + 7-day soft delete), and a `tfstate` container.

## Variables

Production values live in `prod.tfvars`. Pass sensitive values at the command line:

```bash
terraform plan -var-file=prod.tfvars -var "ghcr_token=$(gh auth token)"
```

## First Deploy

1. Bootstrap the state backend (see above)
2. Initialize Terraform:
   ```bash
   cd infra/root
   terraform init
   ```
3. Plan and apply:
   ```bash
   terraform plan -var-file=prod.tfvars -var "ghcr_token=$(gh auth token)"
   terraform apply -var-file=prod.tfvars -var "ghcr_token=$(gh auth token)"
   ```
4. Note the `api_url` output — update Auth0 allowed callback/logout URLs
5. Verify: `curl https://<api_fqdn>/health`

## Deploying Updates

**Automated (preferred):** Creating a GitHub release with a semver tag triggers the
deploy workflow, which builds the image, pushes to GHCR, and deploys.

**Manual:**

```bash
az containerapp update \
  --name ca-logger-prod-api \
  --resource-group rg-logger-prod \
  --image ghcr.io/goargus/logger:<tag>
```

## Monitoring

```bash
az containerapp logs show \
  --name ca-logger-prod-api \
  --resource-group rg-logger-prod \
  --follow
```

Log Analytics KQL:

```kql
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == "ca-logger-prod-api"
| order by TimeGenerated desc
| take 100
```

## Cost Estimate (~$17-22/month)

| Resource | SKU | Cost |
|----------|-----|------|
| PostgreSQL Flexible Server | B1ms (1 vCore, 2 GiB) | ~$12.41 |
| PostgreSQL Storage | 32 GiB | ~$3.68 |
| Container Apps | Consumption (free grant) | ~$0-5 |
| Log Analytics | First 5 GB free | ~$0 |
| VNet | Free | $0 |
| Private DNS Zone | | ~$0.50 |
| State Storage (rg-shared) | Standard_LRS | ~$0.10 |

## Destroy

```bash
terraform destroy -var-file=prod.tfvars -var "ghcr_token=$(gh auth token)"
```

This does **not** remove `rg-shared` (managed separately, protected by delete lock).
