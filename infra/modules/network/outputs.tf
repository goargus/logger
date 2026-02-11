output "vnet_id" {
  value = azurerm_virtual_network.main.id
}

output "app_subnet_id" {
  value = azurerm_subnet.app.id
}

output "data_subnet_id" {
  value = azurerm_subnet.data.id
}

output "app_subnet_cidr" {
  value = azurerm_subnet.app.address_prefixes[0]
}

output "data_subnet_cidr" {
  value = azurerm_subnet.data.address_prefixes[0]
}
