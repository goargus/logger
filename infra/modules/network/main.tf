resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-${var.env}-vnet"
  address_space       = [var.vnet_cidr]
  location            = var.location
  resource_group_name = var.rg_name
  tags                = var.tags
}

resource "azurerm_subnet" "app" {
  name                 = "snet-app"
  resource_group_name  = var.rg_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.app_subnet_cidr]
}

resource "azurerm_subnet" "data" {
  name                 = "snet-data"
  resource_group_name  = var.rg_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.data_subnet_cidr]
}
