variable "environment_name" {
  type        = string
  description = "Name for the Container App Environment."
}

variable "app_name" {
  type        = string
  description = "Name for the Container App."
}

variable "location" {
  type = string
}

variable "rg_name" {
  type = string
}

variable "container_apps_subnet_id" {
  type = string
}

variable "log_analytics_workspace_id" {
  type = string
}

variable "container_image" {
  type = string
}

variable "ghcr_username" {
  type = string
}

variable "ghcr_token" {
  type      = string
  sensitive = true
}

variable "db_host" {
  type = string
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "auth0_domain" {
  type = string
}

variable "auth0_audience" {
  type = string
}

variable "auth0_issuer" {
  type = string
}

variable "entra_tenant_id" {
  type        = string
  description = "Entra ID tenant ID."
}

variable "entra_client_id" {
  type        = string
  description = "Entra ID App Registration client ID."
}

variable "cors_origins" {
  type = string
}

variable "admin_email" {
  type = string
}

variable "admin_username" {
  type = string
}

variable "admin_idp_issuer" {
  type = string
}

variable "admin_idp_subject" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
