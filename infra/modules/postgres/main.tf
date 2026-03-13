resource "azurerm_postgresql_flexible_server" "main" {
  name                          = var.name
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

resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "uuid-ossp,citext,pg_trgm"
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "appdb"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}
