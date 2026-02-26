# Azure Container Apps Infrastructure Design

**Date**: 2026-02-18
**Status**: Approved
**PR Reference**: https://github.com/goargus/logger/pull/173

## Context

The Secretary Activity Management System needs a production Azure environment. PR #173 proposed a VM-based three-tier architecture. After evaluating cost, scalability, and operational overhead against a $2,000/year Azure non-profit budget, we chose Azure Container Apps as the compute layer instead.

### Constraints

- **Budget**: ~$167/month ($2,000/year Azure non-profit credit)
- **Growth**: Additional apps planned on shared infrastructure
- **Team size**: Small, minimize operational burden
- **Estimated cost**: ~$28/month (~17% of annual budget)

## Architecture

```
GitHub Pages              Azure (eastus2)
(Flutter Web)         ┌────────────────────────────────────────┐
                      │  VNet (10.10.0.0/16)                   │
  Static assets  ───▶ │                                        │
  (API calls)         │  ┌─ snet-apps (10.10.0.0/23) ───────┐ │
                      │  │  Container Apps Environment        │ │
                      │  │  ┌──────────────────────┐          │ │
                      │  │  │ NestJS API (0-2)     │          │ │
                      │  │  └──────────┬───────────┘          │ │
                      │  └─────────────┼──────────────────────┘ │
                      │                │ private endpoint        │
                      │  ┌─────────────▼──────────────────────┐ │
                      │  │  PostgreSQL Flexible Server         │ │
                      │  │  B1ms - No public access            │ │
                      │  │  Private DNS: *.postgres.           │ │
                      │  │  database.azure.com                 │ │
                      │  └────────────────────────────────────┘ │
                      │                                          │
                      │  ┌────────────────────────────────────┐ │
                      │  │  Log Analytics Workspace            │ │
                      │  └────────────────────────────────────┘ │
                      └──────────────────────────────────────────┘
```

## Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Compute | Container Apps (Consumption) | Scales to zero, ~$0-5/mo vs ~$30/mo for VM |
| Database | PostgreSQL Flexible Server B1ms | Right-sized for initial load, upgradeable |
| DB Networking | Private endpoint (no public access) | Best practice, avoids IP-flapping with Container Apps outbound IPs, $8/mo premium worth it for security and growth |
| CI/CD | GitHub Actions + GHCR | Free image registry, automated build + deploy on merge |
| Frontend | GitHub Pages | Free, separate from Azure |
| Environments | Prod only | Local Docker for dev, maximizes budget headroom |
| DB Schema | TypeORM migrations | Disable synchronize for production safety |
| Monitoring | Log Analytics | Auto-attached to Container Apps, free tier sufficient |

## Terraform Module Structure

```
infra/
├── root/
│   ├── backend.tf          # Azure Storage state backend
│   ├── providers.tf        # azurerm provider
│   ├── versions.tf         # terraform + provider versions
│   ├── variables.tf        # input variables
│   ├── locals.tf           # environment config (prod only, no workspaces)
│   ├── main.tf             # module composition
│   ├── outputs.tf          # key outputs
│   └── README.md           # setup and operations
│
├── modules/
│   ├── network/            # VNet, subnets, private DNS zone
│   ├── container_apps/     # Environment + Container App
│   ├── postgres/           # Flexible Server + private endpoint
│   └── monitoring/         # Log Analytics workspace
```

### Module: network

- VNet with /16 CIDR (10.10.0.0/16)
- Container Apps subnet /23 (required minimum by Azure)
- PostgreSQL private endpoint subnet
- Private DNS zone for `privatelink.postgres.database.azure.com`
- DNS zone linked to VNet

### Module: container_apps

- Container Apps Environment (Consumption plan, VNet-integrated)
- Container App for NestJS API
- External HTTPS ingress (TLS termination handled by platform)
- Scaling rules: min 0, max 2
- Environment variables: DB connection, Auth0 config
- GHCR registry authentication

### Module: postgres

- PostgreSQL Flexible Server B1ms
- Database creation (`appdb`)
- Private endpoint in data subnet
- `public_network_access_enabled = false`
- 64GB storage with auto-grow

### Module: monitoring

- Log Analytics Workspace (required by Container Apps Environment)
- Container Apps auto-sends logs
- 30-day retention

## CI/CD Pipeline

### Workflow: ci.yml (on PR)

```
PR opened/updated
  -> checkout
  -> npm ci
  -> npm run lint
  -> npm run test
  -> docker build (verify, don't push)
```

### Workflow: deploy.yml (on merge to main)

```
main push
  -> checkout
  -> docker build --target prod
  -> docker tag ghcr.io/goargus/logger:<sha> + :latest
  -> docker push to GHCR
  -> az login (service principal)
  -> az containerapp update --image ghcr.io/goargus/logger:<sha>
```

### GitHub Secrets Required

| Secret | Purpose |
|--------|---------|
| `AZURE_CLIENT_ID` | Service principal app ID |
| `AZURE_TENANT_ID` | Azure AD tenant |
| `AZURE_SUBSCRIPTION_ID` | Subscription ID |
| `AZURE_CLIENT_SECRET` | Service principal password |

GHCR push uses built-in `GITHUB_TOKEN`. Container Apps pulls via a PAT with `read:packages` scope configured as a Terraform variable.

## Backend Dockerfile Improvements

The existing `backend/Dockerfile` works but should be optimized for production:

- Use a clean `FROM node:20-alpine` for the prod stage instead of inheriting from base
- Copy only `package*.json` first for layer caching, then `npm ci --omit=dev`
- Copy `dist/` from the build stage
- Remove redundant `COPY --from=base` in current prod stage

## Operational Prerequisites

### Azure Setup (one-time, manual)

1. Verify non-profit $2K credit is active
2. `az login` + `az account set --subscription <ID>`
3. Create Terraform state backend: Resource Group, Storage Account, Blob Container
4. Create service principal: `az ad sp create-for-rbac --role Contributor`

### GitHub Setup (one-time)

1. Add Azure secrets to repo settings (`AZURE_CLIENT_ID`, etc.)
2. Create PAT with `read:packages` for Container Apps GHCR pull
3. Configure GitHub Pages for frontend deployment

### Terraform Variables (terraform.tfvars, never committed)

```hcl
postgres_admin_username = "pgadmin"
postgres_admin_password = "<strong-password>"
ghcr_token              = "<PAT with read:packages>"
container_image         = "ghcr.io/goargus/logger:latest"
```

Auth0 and admin config passed as Container App environment variables via Terraform.

### First Deploy Sequence

1. Create state backend (manual)
2. Update `backend.tf` with real values
3. Push first Docker image to GHCR (manually or via GH Actions)
4. `terraform init` -> `terraform plan` -> `terraform apply`
5. Update Auth0 allowed callback URLs with Container App FQDN
6. Update frontend `API_BASE_URL` to Container App URL
7. Verify: Container App logs + API health check

## Cost Estimate

| Resource | SKU | Monthly |
|----------|-----|---------|
| Container Apps (Consumption) | Low traffic, scales 0-1 | ~$0-5 |
| PostgreSQL Flexible Server | B1ms (1 vCPU, 2GB) | ~$13 |
| PostgreSQL Storage | 64GB auto-grow | ~$7 |
| Private Endpoint | PostgreSQL | ~$7.30 |
| Private DNS Zone | 1 zone | ~$0.50 |
| Log Analytics | <5GB/month free tier | ~$0 |
| **Total** | | **~$28/month** |

**Annual: ~$336 of $2,000 budget (17%)**

Remaining ~$1,664/year available for additional apps and services.

## Impact on PR #173

PR #173 is replaced, not amended. The changes are too fundamental (VM -> Container Apps, adding VNet/private endpoint, removing workspaces) to be an incremental update. The new infrastructure code will be a new PR that supersedes #173.

### From PR #173: Removed

- `modules/app_vm/` (VM, NIC, public IP, cloud-init)
- `modules/security/` (NSGs -- Container Apps manages ingress)
- `modules/network/` (rewritten for Container Apps + private endpoint subnets)
- Terraform workspaces (prod only)

### From PR #173: Kept (modified)

- Modular Terraform structure
- `modules/postgres/` (switched from public + firewall to private endpoint)
- `modules/monitoring/` (simplified, Log Analytics only)
- Root module composition pattern

### New

- `modules/container_apps/`
- `modules/network/` (VNet with Container Apps + private endpoint subnets)
- Backend Dockerfile optimization
- GitHub Actions CI/CD workflows
- TypeORM migration configuration for production
