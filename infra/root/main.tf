resource "random_password" "postgres" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "azurerm_resource_group" "main" {
  name     = local.caf.rg
  location = var.location
  tags     = local.tags
}

module "network" {
  source = "../modules/network"

  vnet_name = local.caf.vnet
  location  = var.location
  rg_name   = azurerm_resource_group.main.name
  tags      = local.tags
}

module "monitoring" {
  source = "../modules/monitoring"

  name     = local.caf.law
  location = var.location
  rg_name  = azurerm_resource_group.main.name
  tags     = local.tags
}

module "postgres" {
  source = "../modules/postgres"

  name                = local.caf.psql
  location            = var.location
  rg_name             = azurerm_resource_group.main.name
  admin_username      = var.postgres_admin_username
  admin_password      = random_password.postgres.result
  data_subnet_id      = module.network.data_subnet_id
  private_dns_zone_id = module.network.postgres_private_dns_zone_id
  tags                = local.tags
}

module "container_apps" {
  source = "../modules/container_apps"

  environment_name           = local.caf.cae
  app_name                   = local.caf.ca
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
  db_password                = random_password.postgres.result
  auth0_domain               = var.auth0_domain
  auth0_audience             = var.auth0_audience
  auth0_issuer               = var.auth0_issuer
  cors_origins               = var.cors_origins
  admin_email                = var.admin_email
  admin_username             = var.admin_username
  admin_idp_issuer           = var.admin_idp_issuer
  admin_idp_subject          = var.admin_idp_subject
  tags                       = local.tags
}

# ── Cloudflare DNS ──────────────────────────────────────────
module "cloudflare" {
  source = "../modules/cloudflare"

  zone_id                    = var.cloudflare_zone_id
  api_subdomain              = "logger-api"
  frontend_subdomain         = "logger"
  domain                     = "asdmr.org.hn"
  api_static_ip              = module.container_apps.static_ip
  api_domain_verification_id = module.container_apps.domain_verification_id
  pages_cname_target         = "secretary-frontend.pages.dev"
}

# Custom domain binding lives at root to avoid circular dependency:
# cloudflare needs container_apps outputs, and the binding needs cloudflare to finish first.
resource "azurerm_container_app_custom_domain" "api" {
  name             = "logger-api.asdmr.org.hn"
  container_app_id = module.container_apps.container_app_id

  # Azure provisions the managed certificate asynchronously after domain validation.
  # These values are populated by Azure and must be ignored to prevent resource recreation.
  lifecycle {
    ignore_changes = [certificate_binding_type, container_app_environment_certificate_id]
  }

  depends_on = [module.cloudflare]
}
