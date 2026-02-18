resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-${var.env}-law"
  location            = var.location
  resource_group_name = var.rg_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}
