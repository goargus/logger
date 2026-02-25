# Azure Container Apps Infrastructure - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the VM-based infrastructure in PR #173 with an Azure Container Apps architecture using VNet + private PostgreSQL endpoint, GitHub Actions CI/CD, and GHCR image registry.

**Architecture:** Container Apps Environment (Consumption plan) inside a VNet with a private endpoint to PostgreSQL Flexible Server. GitHub Actions builds and pushes Docker images to GHCR on merge to main, then deploys to Container Apps via `az containerapp update`. Frontend deployed separately via GitHub Pages.

**Tech Stack:** Terraform (azurerm >= 3.90), Azure Container Apps, PostgreSQL Flexible Server, GitHub Actions, GHCR, NestJS, Docker

**Design Doc:** `docs/plans/2026-02-18-azure-container-apps-infrastructure-design.md`

---

## Task 1: Optimize Backend Dockerfile for Production

**Files:**
- Modify: `backend/dockerfile`
- Modify: `backend/.dockerignore`

**Context:** The existing Dockerfile's prod stage inherits from base (carrying source + dev deps). We need a clean prod stage with only production dependencies. The `migrations/` directory must be included in the prod image because `migrationsRun: true` in `app.module.ts` auto-runs them on startup when `NODE_ENV=production`.

**Step 1: Update `.dockerignore`**

Add entries to keep the build context lean:

```dockerignore
node_modules
dist/
.env
*.md
.git
.gitignore
test/
.eslintrc.js
.prettierrc
jest*.json
tsconfig.build.json
```

**Step 2: Rewrite the Dockerfile**

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

############################
FROM base AS dev
CMD ["npm", "run", "start:dev"]

############################
FROM node:20-alpine AS prod
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=base /app/dist ./dist
COPY --from=base /app/migrations ./migrations
ENV NODE_ENV=production
USER node
CMD ["node", "dist/main.js"]
```

Key changes:
- `node:20-alpine` for smaller image (~180MB vs ~1GB)
- `package*.json` copied first for layer caching
- `npm ci` (deterministic) instead of `npm install`
- Clean prod stage from scratch -- only production deps + dist + migrations
- `NODE_ENV=production` set explicitly
- `dev` stage simplified (inherits everything from base, no redundant COPY)

**Step 3: Verify the build works locally**

Run: `docker build --target prod -t logger-api:test -f backend/dockerfile backend/`
Expected: Successful build, image size ~200-300MB

**Step 4: Commit**

```bash
git add backend/dockerfile backend/.dockerignore
git commit -m "build: optimize backend Dockerfile for production

Separate prod stage with alpine base, production-only deps,
layer caching via package*.json-first copy, and migrations included."
```

---

## Task 2: Create Terraform Scaffolding

**Files:**
- Create: `infra/root/versions.tf`
- Create: `infra/root/providers.tf`
- Create: `infra/root/backend.tf`
- Create: `infra/root/variables.tf`
- Create: `infra/root/locals.tf`

**Context:** This replaces the scaffolding from PR #173. No Terraform workspaces -- single prod environment. The `backend.tf` uses placeholders that the operator fills in before first `terraform init`.

**Step 1: Create directory structure**

```bash
rm -rf infra/
mkdir -p infra/root infra/modules/{network,container_apps,postgres,monitoring}
```

**Step 2: Write `infra/root/versions.tf`**

```hcl
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.90.0"
    }
  }
}
```

**Step 3: Write `infra/root/providers.tf`**

```hcl
provider "azurerm" {
  features {}
}
```

**Step 4: Write `infra/root/backend.tf`**

```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "REPLACE_ME_TFSTATE_RG"
    storage_account_name = "REPLACE_ME_TFSTATE_STORAGE"
    container_name       = "REPLACE_ME_TFSTATE_CONTAINER"
    key                  = "secretary.prod.tfstate"
  }
}
```

**Step 5: Write `infra/root/variables.tf`**

```hcl
variable "project_name" {
  type        = string
  description = "Project name prefix for all resources."
  default     = "secretary"
}

variable "location" {
  type        = string
  description = "Azure region."
  default     = "eastus2"
}

variable "postgres_admin_username" {
  type        = string
  description = "Admin username for PostgreSQL Flexible Server."
}

variable "postgres_admin_password" {
  type        = string
  description = "Admin password for PostgreSQL Flexible Server."
  sensitive   = true
}

variable "container_image" {
  type        = string
  description = "Full container image reference (e.g. ghcr.io/goargus/logger:latest)."
}

variable "ghcr_username" {
  type        = string
  description = "GitHub username or org for GHCR authentication."
  default     = "goargus"
}

variable "ghcr_token" {
  type        = string
  description = "GitHub PAT with read:packages scope for GHCR pull."
  sensitive   = true
}

variable "auth0_domain" {
  type        = string
  description = "Auth0 domain (e.g. dev-xxx.us.auth0.com)."
}

variable "auth0_audience" {
  type        = string
  description = "Auth0 API audience identifier."
}

variable "auth0_issuer" {
  type        = string
  description = "Auth0 issuer URL."
}

variable "admin_email" {
  type        = string
  description = "Admin user email for bootstrap."
}

variable "admin_username" {
  type        = string
  description = "Admin username for bootstrap."
}

variable "admin_idp_issuer" {
  type        = string
  description = "Admin IDP issuer URL."
}

variable "admin_idp_subject" {
  type        = string
  description = "Admin IDP subject identifier."
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to all resources."
  default     = {}
}
```

**Step 6: Write `infra/root/locals.tf`**

```hcl
locals {
  env         = "prod"
  name_prefix = "${var.project_name}-${local.env}"

  tags = merge(
    {
      environment = local.env
      project     = var.project_name
    },
    var.tags
  )
}
```

**Step 7: Validate scaffolding**

Run: `cd infra/root && terraform fmt -check -recursive .. && cd ../..`
Expected: No formatting errors

**Step 8: Commit**

```bash
git add infra/
git commit -m "infra: add Terraform scaffolding for Container Apps architecture

Versions, providers, backend (placeholder), variables, and locals.
Single prod environment, no workspaces."
```

---

## Task 3: Create Network Module

**Files:**
- Create: `infra/modules/network/main.tf`
- Create: `infra/modules/network/variables.tf`
- Create: `infra/modules/network/outputs.tf`

**Context:** VNet with two subnets (Container Apps /23 + data /24) and a private DNS zone for PostgreSQL. Container Apps requires a minimum /23 subnet that is delegated to `Microsoft.App/environments`.

**Step 1: Write `infra/modules/network/variables.tf`**

```hcl
variable "project_name" {
  type = string
}

variable "env" {
  type = string
}

variable "location" {
  type = string
}

variable "rg_name" {
  type = string
}

variable "vnet_cidr" {
  type    = string
  default = "10.10.0.0/16"
}

variable "container_apps_subnet_cidr" {
  type    = string
  default = "10.10.0.0/23"
}

variable "data_subnet_cidr" {
  type    = string
  default = "10.10.2.0/24"
}

variable "tags" {
  type    = map(string)
  default = {}
}
```

**Step 2: Write `infra/modules/network/main.tf`**

```hcl
resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-${var.env}-vnet"
  address_space       = [var.vnet_cidr]
  location            = var.location
  resource_group_name = var.rg_name
  tags                = var.tags
}

resource "azurerm_subnet" "container_apps" {
  name                 = "snet-container-apps"
  resource_group_name  = var.rg_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.container_apps_subnet_cidr]

  delegation {
    name = "container-apps"
    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_subnet" "data" {
  name                 = "snet-data"
  resource_group_name  = var.rg_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.data_subnet_cidr]
}

resource "azurerm_private_dns_zone" "postgres" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = var.rg_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "${var.project_name}-${var.env}-pg-dns-link"
  resource_group_name   = var.rg_name
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.main.id
}
```

**Step 3: Write `infra/modules/network/outputs.tf`**

```hcl
output "vnet_id" {
  value = azurerm_virtual_network.main.id
}

output "container_apps_subnet_id" {
  value = azurerm_subnet.container_apps.id
}

output "data_subnet_id" {
  value = azurerm_subnet.data.id
}

output "postgres_private_dns_zone_id" {
  value = azurerm_private_dns_zone.postgres.id
}
```

**Step 4: Validate**

Run: `cd infra/modules/network && terraform fmt -check . && cd ../../..`

**Step 5: Commit**

```bash
git add infra/modules/network/
git commit -m "infra: add network module with VNet, subnets, and private DNS

VNet /16, Container Apps subnet /23 with delegation,
data subnet /24, PostgreSQL private DNS zone."
```

---

## Task 4: Create Monitoring Module

**Files:**
- Create: `infra/modules/monitoring/main.tf`
- Create: `infra/modules/monitoring/variables.tf`
- Create: `infra/modules/monitoring/outputs.tf`

**Context:** Log Analytics Workspace is required by Container Apps Environment. This module is intentionally simple -- Container Apps auto-sends logs.

**Step 1: Write `infra/modules/monitoring/variables.tf`**

```hcl
variable "project_name" {
  type = string
}

variable "env" {
  type = string
}

variable "location" {
  type = string
}

variable "rg_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
```

**Step 2: Write `infra/modules/monitoring/main.tf`**

```hcl
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-${var.env}-law"
  location            = var.location
  resource_group_name = var.rg_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}
```

**Step 3: Write `infra/modules/monitoring/outputs.tf`**

```hcl
output "log_analytics_workspace_id" {
  value = azurerm_log_analytics_workspace.main.id
}
```

**Step 4: Commit**

```bash
git add infra/modules/monitoring/
git commit -m "infra: add monitoring module with Log Analytics workspace"
```

---

## Task 5: Create PostgreSQL Module

**Files:**
- Create: `infra/modules/postgres/main.tf`
- Create: `infra/modules/postgres/variables.tf`
- Create: `infra/modules/postgres/outputs.tf`

**Context:** PostgreSQL Flexible Server with private endpoint only (no public access). The private endpoint connects to the data subnet and registers in the private DNS zone. Database name is `appdb` to match the design.

**Step 1: Write `infra/modules/postgres/variables.tf`**

```hcl
variable "project_name" {
  type = string
}

variable "env" {
  type = string
}

variable "location" {
  type = string
}

variable "rg_name" {
  type = string
}

variable "postgres_sku" {
  type    = string
  default = "B_Standard_B1ms"
}

variable "postgres_version" {
  type    = string
  default = "14"
}

variable "admin_username" {
  type = string
}

variable "admin_password" {
  type      = string
  sensitive = true
}

variable "data_subnet_id" {
  type = string
}

variable "private_dns_zone_id" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
```

**Step 2: Write `infra/modules/postgres/main.tf`**

```hcl
resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "${var.project_name}-${var.env}-pg"
  resource_group_name           = var.rg_name
  location                      = var.location
  version                       = var.postgres_version
  administrator_login           = var.admin_username
  administrator_password        = var.admin_password
  sku_name                      = var.postgres_sku
  storage_mb                    = 32768
  auto_grow_enabled             = true
  delegated_subnet_id           = var.data_subnet_id
  private_dns_zone_id           = var.private_dns_zone_id
  public_network_access_enabled = false

  tags = var.tags

  lifecycle {
    ignore_changes = [zone]
  }
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "appdb"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}
```

Note: PostgreSQL Flexible Server supports native VNet integration via `delegated_subnet_id` -- no separate private endpoint resource needed. The server is placed directly in the data subnet and registered in the private DNS zone.

**Step 3: Write `infra/modules/postgres/outputs.tf`**

```hcl
output "fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "db_name" {
  value = azurerm_postgresql_flexible_server_database.main.name
}

output "admin_username" {
  value = azurerm_postgresql_flexible_server.main.administrator_login
}
```

**Step 4: Commit**

```bash
git add infra/modules/postgres/
git commit -m "infra: add PostgreSQL module with VNet integration and private DNS

Flexible Server B1ms, no public access, delegated subnet,
private DNS zone registration, 32GB auto-grow storage."
```

---

## Task 6: Create Container Apps Module

**Files:**
- Create: `infra/modules/container_apps/main.tf`
- Create: `infra/modules/container_apps/variables.tf`
- Create: `infra/modules/container_apps/outputs.tf`

**Context:** Container Apps Environment with VNet integration + a Container App running the NestJS API. The Container App pulls from GHCR, has external HTTPS ingress, and scales 0-2. Environment variables include DB connection, Auth0 config, and `NODE_ENV=production`.

**Step 1: Write `infra/modules/container_apps/variables.tf`**

```hcl
variable "project_name" {
  type = string
}

variable "env" {
  type = string
}

variable "location" {
  type = string
}

variable "rg_name" {
  type = string
}

variable "container_apps_subnet_id" {
  type = string
}

variable "log_analytics_workspace_id" {
  type = string
}

variable "container_image" {
  type = string
}

variable "ghcr_username" {
  type = string
}

variable "ghcr_token" {
  type      = string
  sensitive = true
}

variable "db_host" {
  type = string
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "auth0_domain" {
  type = string
}

variable "auth0_audience" {
  type = string
}

variable "auth0_issuer" {
  type = string
}

variable "admin_email" {
  type = string
}

variable "admin_username" {
  type = string
}

variable "admin_idp_issuer" {
  type = string
}

variable "admin_idp_subject" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
```

**Step 2: Write `infra/modules/container_apps/main.tf`**

```hcl
resource "azurerm_container_app_environment" "main" {
  name                       = "${var.project_name}-${var.env}-cae"
  location                   = var.location
  resource_group_name        = var.rg_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  infrastructure_subnet_id   = var.container_apps_subnet_id
  tags                       = var.tags
}

resource "azurerm_container_app" "api" {
  name                         = "${var.project_name}-${var.env}-api"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = var.rg_name
  revision_mode                = "Single"
  tags                         = var.tags

  registry {
    server               = "ghcr.io"
    username             = var.ghcr_username
    password_secret_name = "ghcr-token"
  }

  secret {
    name  = "ghcr-token"
    value = var.ghcr_token
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    transport        = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 0
    max_replicas = 2

    container {
      name   = "api"
      image  = var.container_image
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "PORT"
        value = "3000"
      }
      env {
        name  = "DB_HOST"
        value = var.db_host
      }
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      env {
        name  = "DB_NAME"
        value = var.db_name
      }
      env {
        name  = "DB_USERNAME"
        value = var.db_username
      }
      env {
        name       = "DB_PASSWORD"
        secret_name = "db-password"
      }
      env {
        name  = "AUTH0_DOMAIN"
        value = var.auth0_domain
      }
      env {
        name  = "AUTH0_AUDIENCE"
        value = var.auth0_audience
      }
      env {
        name  = "AUTH0_ISSUER"
        value = var.auth0_issuer
      }
      env {
        name  = "ADMIN_EMAIL"
        value = var.admin_email
      }
      env {
        name  = "ADMIN_USERNAME"
        value = var.admin_username
      }
      env {
        name  = "ADMIN_IDP_ISSUER"
        value = var.admin_idp_issuer
      }
      env {
        name  = "ADMIN_IDP_SUBJECT"
        value = var.admin_idp_subject
      }
    }
  }
}
```

**Step 3: Write `infra/modules/container_apps/outputs.tf`**

```hcl
output "fqdn" {
  value = azurerm_container_app.api.ingress[0].fqdn
}

output "environment_id" {
  value = azurerm_container_app_environment.main.id
}
```

**Step 4: Commit**

```bash
git add infra/modules/container_apps/
git commit -m "infra: add Container Apps module with VNet integration and GHCR registry

Environment on Consumption plan, API container with HTTPS ingress,
scale 0-2, GHCR auth, DB + Auth0 env vars, secrets for sensitive values."
```

---

## Task 7: Create Root Module Composition

**Files:**
- Create: `infra/root/main.tf`
- Create: `infra/root/outputs.tf`

**Context:** The root module wires all four modules together. Resource group is created here. Module dependencies flow: network -> monitoring -> postgres -> container_apps.

**Step 1: Write `infra/root/main.tf`**

```hcl
resource "azurerm_resource_group" "main" {
  name     = "${local.name_prefix}-rg"
  location = var.location
  tags     = local.tags
}

module "network" {
  source = "../modules/network"

  project_name = var.project_name
  env          = local.env
  location     = var.location
  rg_name      = azurerm_resource_group.main.name
  tags         = local.tags
}

module "monitoring" {
  source = "../modules/monitoring"

  project_name = var.project_name
  env          = local.env
  location     = var.location
  rg_name      = azurerm_resource_group.main.name
  tags         = local.tags
}

module "postgres" {
  source = "../modules/postgres"

  project_name        = var.project_name
  env                 = local.env
  location            = var.location
  rg_name             = azurerm_resource_group.main.name
  admin_username      = var.postgres_admin_username
  admin_password      = var.postgres_admin_password
  data_subnet_id      = module.network.data_subnet_id
  private_dns_zone_id = module.network.postgres_private_dns_zone_id
  tags                = local.tags
}

module "container_apps" {
  source = "../modules/container_apps"

  project_name               = var.project_name
  env                        = local.env
  location                   = var.location
  rg_name                    = azurerm_resource_group.main.name
  container_apps_subnet_id   = module.network.container_apps_subnet_id
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  container_image            = var.container_image
  ghcr_username              = var.ghcr_username
  ghcr_token                 = var.ghcr_token
  db_host                    = module.postgres.fqdn
  db_name                    = module.postgres.db_name
  db_username                = module.postgres.admin_username
  db_password                = var.postgres_admin_password
  auth0_domain               = var.auth0_domain
  auth0_audience             = var.auth0_audience
  auth0_issuer               = var.auth0_issuer
  admin_email                = var.admin_email
  admin_username             = var.admin_username
  admin_idp_issuer           = var.admin_idp_issuer
  admin_idp_subject          = var.admin_idp_subject
  tags                       = local.tags
}
```

**Step 2: Write `infra/root/outputs.tf`**

```hcl
output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "api_fqdn" {
  value = module.container_apps.fqdn
}

output "api_url" {
  value = "https://${module.container_apps.fqdn}"
}

output "postgres_fqdn" {
  value     = module.postgres.fqdn
  sensitive = true
}

output "postgres_db_name" {
  value = module.postgres.db_name
}
```

**Step 3: Validate the full configuration**

Run: `cd infra/root && terraform init -backend=false && terraform validate && cd ../..`
Expected: "Success! The configuration is valid."

Note: `-backend=false` skips the remote backend (which has placeholder values).

**Step 4: Format check**

Run: `terraform fmt -check -recursive infra/`

**Step 5: Commit**

```bash
git add infra/root/main.tf infra/root/outputs.tf
git commit -m "infra: add root module composing network, monitoring, postgres, and container apps"
```

---

## Task 8: Create GitHub Actions Deploy Workflow

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`

**Context:** Add Docker build verification to CI. Create a deploy workflow that builds, pushes to GHCR, and deploys to Container Apps on merge to main. Uses OpenID Connect (federated credentials) for Azure login -- more secure than client secrets.

**Step 1: Add Docker build step to existing `ci.yml`**

Add after the existing backend job's test step:

```yaml
    - name: Build Docker image (verify)
      run: docker build --target prod -t logger-api:ci -f dockerfile .
```

Note: This runs in `working-directory: ./backend` already set in the job.

**Step 2: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy.yml'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: goargus/logger

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: ./backend
          file: ./backend/dockerfile
          target: prod
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
      - name: Azure login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy to Container Apps
        uses: azure/container-apps-deploy-action@v1
        with:
          resourceGroup: secretary-prod-rg
          containerAppName: secretary-prod-api
          imageToDeploy: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/deploy.yml
git commit -m "ci: add Docker build to CI and create deploy workflow

CI verifies Docker build on PRs.
Deploy workflow builds, pushes to GHCR, and deploys to
Container Apps on merge to main."
```

---

## Task 9: Add Data Subnet Delegation for PostgreSQL

**Files:**
- Modify: `infra/modules/network/main.tf`

**Context:** PostgreSQL Flexible Server with VNet integration requires the data subnet to have a delegation to `Microsoft.DBforPostgreSQL/flexibleServers`. Without this, `terraform apply` will fail.

**Step 1: Add delegation to data subnet**

In `infra/modules/network/main.tf`, update the `azurerm_subnet.data` resource:

```hcl
resource "azurerm_subnet" "data" {
  name                 = "snet-data"
  resource_group_name  = var.rg_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.data_subnet_cidr]

  delegation {
    name = "postgresql"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}
```

**Step 2: Validate**

Run: `cd infra/root && terraform validate && cd ../..`

**Step 3: Commit**

```bash
git add infra/modules/network/main.tf
git commit -m "infra: add PostgreSQL delegation to data subnet

Required for Flexible Server VNet integration."
```

---

## Task 10: Write Infrastructure README

**Files:**
- Create: `infra/root/README.md`

**Context:** Operations guide for setting up and deploying the infrastructure. Must cover: prerequisites, state backend setup, variables, first deploy, and day-to-day operations. This replaces the README from PR #173.

**Step 1: Write the README**

Cover these sections:
- Architecture overview (brief, link to design doc)
- Prerequisites (Azure CLI, Terraform, GitHub setup)
- State backend setup (manual steps)
- Variables reference (terraform.tfvars template)
- First deploy steps
- Deploying updates (how CI/CD works)
- Monitoring and logs (how to access)
- Cost overview
- Destroying the environment

Keep it operational, not architectural (design doc covers that).

**Step 2: Commit**

```bash
git add infra/root/README.md
git commit -m "docs: add infrastructure README with setup and operations guide"
```

---

## Task 11: Add `.gitignore` for Terraform

**Files:**
- Create: `infra/.gitignore`

**Context:** Prevent committing Terraform state, variable files with secrets, and provider binaries.

**Step 1: Write `infra/.gitignore`**

```gitignore
*.tfstate
*.tfstate.*
*.tfvars
*.tfvars.json
.terraform/
.terraform.lock.hcl
crash.log
override.tf
override.tf.json
*_override.tf
*_override.tf.json
```

**Step 2: Commit**

```bash
git add infra/.gitignore
git commit -m "chore: add Terraform .gitignore"
```

---

## Task 12: Final Validation

**Step 1: Run full Terraform validation**

```bash
cd infra/root
terraform init -backend=false
terraform validate
terraform fmt -check -recursive ..
cd ../..
```
Expected: All pass.

**Step 2: Verify Docker build**

```bash
docker build --target prod -t logger-api:test -f backend/dockerfile backend/
```
Expected: Successful build.

**Step 3: Review all changes**

```bash
git log --oneline main..HEAD
git diff --stat main..HEAD
```

Verify: 11 commits, all infra/ files + Dockerfile + CI/CD workflows.

---

## Summary

| Task | Component | Files |
|------|-----------|-------|
| 1 | Dockerfile optimization | `backend/dockerfile`, `backend/.dockerignore` |
| 2 | Terraform scaffolding | `infra/root/{versions,providers,backend,variables,locals}.tf` |
| 3 | Network module | `infra/modules/network/*` |
| 4 | Monitoring module | `infra/modules/monitoring/*` |
| 5 | PostgreSQL module | `infra/modules/postgres/*` |
| 6 | Container Apps module | `infra/modules/container_apps/*` |
| 7 | Root module composition | `infra/root/{main,outputs}.tf` |
| 8 | CI/CD workflows | `.github/workflows/{ci,deploy}.yml` |
| 9 | Data subnet delegation fix | `infra/modules/network/main.tf` |
| 10 | Infrastructure README | `infra/root/README.md` |
| 11 | Terraform .gitignore | `infra/.gitignore` |
| 12 | Final validation | No new files |
