resource "azurerm_log_analytics_workspace" "main" {
  count               = var.enabled ? 1 : 0
  name                = "${var.project_name}-${var.env}-law"
  location            = var.location
  resource_group_name = var.rg_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

resource "azurerm_virtual_machine_extension" "ama" {
  count               = var.enabled ? 1 : 0
  name                = "${var.project_name}-${var.env}-ama"
  virtual_machine_id  = var.vm_id
  publisher           = "Microsoft.Azure.Monitor"
  type                = "AzureMonitorLinuxAgent"
  type_handler_version = "1.0"
  auto_upgrade_minor_version = true

  settings = jsonencode({})
}

resource "azurerm_monitor_metric_alert" "cpu_high" {
  count               = var.enabled ? 1 : 0
  name                = "${var.project_name}-${var.env}-cpu-high"
  resource_group_name = var.rg_name
  scopes              = [var.vm_id]
  description         = "CPU > 80% for 5 minutes"
  severity            = 3
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachines"
    metric_name      = "Percentage CPU"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }
}

resource "azurerm_monitor_metric_alert" "vm_availability" {
  count               = var.enabled ? 1 : 0
  name                = "${var.project_name}-${var.env}-vm-availability"
  resource_group_name = var.rg_name
  scopes              = [var.vm_id]
  description         = "VM availability below 100%"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachines"
    metric_name      = "VmAvailabilityMetric"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 1
  }
}
