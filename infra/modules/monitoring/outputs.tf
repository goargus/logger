output "log_analytics_workspace_id" {
  value       = var.enabled ? azurerm_log_analytics_workspace.main[0].id : null
  description = "Log Analytics Workspace ID if monitoring enabled."
}
