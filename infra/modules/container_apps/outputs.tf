output "fqdn" {
  value = azurerm_container_app.api.ingress[0].fqdn
}

output "environment_id" {
  value = azurerm_container_app_environment.main.id
}

output "container_app_id" {
  value = azurerm_container_app.api.id
}

output "static_ip" {
  value = azurerm_container_app_environment.main.static_ip_address
}

output "domain_verification_id" {
  value = azurerm_container_app_environment.main.custom_domain_verification_id
}
