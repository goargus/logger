locals {
  env = var.env

  caf = {
    rg   = "rg-${var.project_name}-${local.env}"
    vnet = "vnet-${var.project_name}-${local.env}"
    cae  = "cae-${var.project_name}-${local.env}"
    ca   = "ca-${var.project_name}-${local.env}-api"
    law  = "law-${var.project_name}-${local.env}"
    psql = "psql-${var.project_name}-${local.env}"
  }

  tags = merge(
    {
      environment = local.env
      project     = var.project_name
      managed-by  = "terraform"
    },
    var.tags
  )

  api_custom_domain = "${var.api_subdomain}.${var.domain}"
}
