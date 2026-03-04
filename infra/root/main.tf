resource "random_password" "postgres" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

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
  admin_password      = random_password.postgres.result
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
