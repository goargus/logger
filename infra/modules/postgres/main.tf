locals {
  db_name = "appdb"
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "${var.project_name}-${var.env}-pg"
  resource_group_name    = var.rg_name
  location               = var.location
  version                = "14"
  administrator_login    = var.admin_username
  administrator_password = var.admin_password

  sku_name                = var.postgres_sku
  storage_mb              = 65536
  auto_grow_enabled       = true
  public_network_access_enabled = true
  ssl_enforcement_enabled = true

  tags = var.tags
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = local.db_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "app_vm" {
  name      = "allow-app-vm"
  server_id = azurerm_postgresql_flexible_server.main.id

  start_ip_address = var.app_vm_public_ip
  end_ip_address   = var.app_vm_public_ip
}
