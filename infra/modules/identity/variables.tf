variable "project_name" {
  type        = string
  description = "Project name for resource naming."
}

variable "env" {
  type        = string
  description = "Environment name (e.g., prod, dev)."
}

variable "redirect_uris" {
  type        = list(string)
  description = "SPA redirect URIs for the App Registration."
}
