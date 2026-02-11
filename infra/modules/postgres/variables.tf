variable "project_name" {
  type = string
}

variable "env" {
  type = string
}

variable "location" {
  type = string
}

variable "rg_name" {
  type = string
}

variable "postgres_sku" {
  type = string
}

variable "admin_username" {
  type = string
}

variable "admin_password" {
  type      = string
  sensitive = true
}

variable "app_vm_public_ip" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
