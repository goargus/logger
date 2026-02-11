output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "vnet_id" {
  value = module.network.vnet_id
}

output "app_subnet_id" {
  value = module.network.app_subnet_id
}

output "data_subnet_id" {
  value = module.network.data_subnet_id
}

output "vm_public_ip" {
  value = module.app_vm.public_ip
}

output "postgres_fqdn" {
  value = module.postgres.fqdn
}

output "postgres_db_name" {
  value = module.postgres.db_name
}
