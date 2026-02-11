variable "project_name" {
  type        = string
  description = "Project name prefix for all resources."
  default     = "missionary-app"
}

variable "location" {
  type        = string
  description = "Azure region. Defaults to eastus2 if not set."
  default     = null
}

variable "admin_cidr" {
  type        = string
  description = "CIDR allowed for SSH (recommend your public IP /32)."
}

variable "vm_admin_username" {
  type        = string
  description = "Admin username for the VM."
  default     = "azureuser"
}

variable "ssh_public_key" {
  type        = string
  description = "SSH public key for VM access."
}

variable "docker_compose_b64" {
  type        = string
  description = "Base64-encoded docker-compose.yml content."
}

variable "env_file_b64" {
  type        = string
  description = "Base64-encoded .env content for the app stack."
}

variable "postgres_admin_username" {
  type        = string
  description = "Admin username for PostgreSQL Flexible Server."
}

variable "postgres_admin_password" {
  type        = string
  description = "Admin password for PostgreSQL Flexible Server."
  sensitive   = true
}

variable "api_domain" {
  type        = string
  description = "Optional domain for nginx server_name."
  default     = null
}

variable "tags" {
  type        = map(string)
  description = "Optional tags to apply to resources."
  default     = {}
}
