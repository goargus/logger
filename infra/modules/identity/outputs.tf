output "client_id" {
  value       = azuread_application.logger.client_id
  description = "App Registration client ID."
}

output "tenant_id" {
  value       = data.azuread_client_config.current.tenant_id
  description = "Azure AD tenant ID."
}

output "api_scope" {
  value       = "api://${azuread_application.logger.client_id}/access_as_user"
  description = "Full custom API scope URI for frontend to request."
}
