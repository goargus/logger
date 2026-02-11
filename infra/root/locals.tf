locals {
  env = terraform.workspace

  settings = {
    dev = {
      vm_size            = "Standard_B1s"
      postgres_sku       = "B_Standard_B1ms"
      monitoring_enabled = false
      location           = "eastus2"
    }
    staging = {
      vm_size            = "Standard_B2s"
      postgres_sku       = "B_Standard_B1ms"
      monitoring_enabled = false
      location           = "eastus2"
    }
    prod = {
      vm_size            = "Standard_B2s"
      postgres_sku       = "B_Standard_B2ms"
      monitoring_enabled = true
      location           = "eastus2"
    }
  }

  cfg      = local.settings[local.env]
  location = coalesce(var.location, local.cfg.location, "eastus2")

  name_prefix = "${var.project_name}-${local.env}"

  tags = merge(
    {
      environment = local.env
      project     = var.project_name
    },
    var.tags
  )
}
