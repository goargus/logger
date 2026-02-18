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
