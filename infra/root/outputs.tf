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

output "api_custom_url" {
  value = "https://${module.cloudflare.api_fqdn}"
}

output "frontend_custom_url" {
  value = "https://${module.cloudflare.frontend_fqdn}"
}

output "entra_client_id" {
  value = module.identity.client_id
}

output "entra_tenant_id" {
  value = module.identity.tenant_id
}

output "entra_api_scope" {
  value = module.identity.api_scope
}
