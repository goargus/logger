variable "project_name" {
  type        = string
  description = "Project name prefix for all resources."
  default     = "logger"
}

variable "location" {
  type        = string
  description = "Azure region."
  default     = "eastus2"
}

variable "postgres_admin_username" {
  type        = string
  description = "Admin username for PostgreSQL Flexible Server."
}

variable "container_image" {
  type        = string
  description = "Full container image reference (e.g. ghcr.io/goargus/logger:latest)."
}

variable "ghcr_username" {
  type        = string
  description = "GitHub username or org for GHCR authentication."
  default     = "goargus"
}

variable "ghcr_token" {
  type        = string
  description = "GitHub PAT with read:packages scope for GHCR pull."
  sensitive   = true
}

variable "auth0_domain" {
  type        = string
  description = "Auth0 domain (e.g. dev-xxx.us.auth0.com)."
}

variable "auth0_audience" {
  type        = string
  description = "Auth0 API audience identifier."
}

variable "auth0_issuer" {
  type        = string
  description = "Auth0 issuer URL."
}

variable "cors_origins" {
  type        = string
  description = "Comma-separated CORS origins for the API."
  default     = "https://secretary-backend.pages.dev"
}

variable "admin_email" {
  type        = string
  description = "Admin user email for bootstrap."
}

variable "admin_username" {
  type        = string
  description = "Admin username for bootstrap."
}

variable "admin_idp_issuer" {
  type        = string
  description = "Admin IDP issuer URL."
}

variable "admin_idp_subject" {
  type        = string
  description = "Admin IDP subject identifier."
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to all resources."
  default     = {}
}

# ── Cloudflare ──────────────────────────────────────────────
variable "cloudflare_api_key" {
  type        = string
  description = "Cloudflare Global API Key."
  sensitive   = true
}

variable "cloudflare_email" {
  type        = string
  description = "Cloudflare account email address."
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare Zone ID for the domain."
}
