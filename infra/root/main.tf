resource "azurerm_resource_group" "main" {
  name     = "${local.name_prefix}-rg"
  location = local.location
  tags     = local.tags
}

module "network" {
  source = "../modules/network"

  project_name     = var.project_name
  env              = local.env
  location         = local.location
  rg_name          = azurerm_resource_group.main.name
  vnet_cidr        = "10.10.0.0/16"
  app_subnet_cidr  = "10.10.1.0/24"
  data_subnet_cidr = "10.10.2.0/24"
  tags             = local.tags
}

module "security" {
  source = "../modules/security"

  project_name     = var.project_name
  env              = local.env
  location         = local.location
  rg_name          = azurerm_resource_group.main.name
  app_subnet_id    = module.network.app_subnet_id
  data_subnet_id   = module.network.data_subnet_id
  app_subnet_cidr  = module.network.app_subnet_cidr
  data_subnet_cidr = module.network.data_subnet_cidr
  admin_cidr       = var.admin_cidr
  tags             = local.tags
}

module "app_vm" {
  source = "../modules/app_vm"

  project_name        = var.project_name
  env                 = local.env
  location            = local.location
  rg_name             = azurerm_resource_group.main.name
  subnet_id           = module.network.app_subnet_id
  vm_size             = local.cfg.vm_size
  vm_admin_username   = var.vm_admin_username
  ssh_public_key      = var.ssh_public_key
  docker_compose_b64  = var.docker_compose_b64
  env_file_b64        = var.env_file_b64
  api_domain          = var.api_domain
  tags                = local.tags
}

module "postgres" {
  source = "../modules/postgres"

  project_name           = var.project_name
  env                    = local.env
  location               = local.location
  rg_name                = azurerm_resource_group.main.name
  postgres_sku           = local.cfg.postgres_sku
  admin_username         = var.postgres_admin_username
  admin_password         = var.postgres_admin_password
  app_vm_public_ip       = module.app_vm.public_ip
  tags                   = local.tags
}

module "monitoring" {
  source = "../modules/monitoring"

  project_name = var.project_name
  env          = local.env
  location     = local.location
  rg_name      = azurerm_resource_group.main.name
  vm_id        = module.app_vm.vm_id
  enabled      = local.cfg.monitoring_enabled
  tags         = local.tags
}
