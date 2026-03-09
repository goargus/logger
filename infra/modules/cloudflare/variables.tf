variable "zone_id" {
  type        = string
  description = "Cloudflare Zone ID for the domain."
}

variable "api_subdomain" {
  type        = string
  description = "Subdomain for the API (e.g. logger-api)."
}

variable "frontend_subdomain" {
  type        = string
  description = "Subdomain for the frontend (e.g. logger)."
}

variable "domain" {
  type        = string
  description = "Root domain (e.g. asdmr.org.hn)."
}

variable "api_static_ip" {
  type        = string
  description = "Static IP address of the Container Apps environment."
}

variable "api_domain_verification_id" {
  type        = string
  description = "Custom domain verification ID from the Container Apps environment."
}

variable "pages_cname_target" {
  type        = string
  description = "Cloudflare Pages CNAME target (e.g. project-name.pages.dev)."
}
