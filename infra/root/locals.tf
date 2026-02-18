locals {
  env         = "prod"
  name_prefix = "${var.project_name}-${local.env}"

  tags = merge(
    {
      environment = local.env
      project     = var.project_name
    },
    var.tags
  )
}
