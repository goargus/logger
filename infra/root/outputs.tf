output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "api_fqdn" {
  value = module.container_apps.fqdn
}

output "api_url" {
  value = "https://${module.container_apps.fqdn}"
}

output "postgres_fqdn" {
  value     = module.postgres.fqdn
  sensitive = true
}

output "postgres_db_name" {
  value = module.postgres.db_name
}
