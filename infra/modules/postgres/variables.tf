variable "name" {
  type        = string
  description = "Name for the PostgreSQL Flexible Server."
}

variable "location" {
  type = string
}

variable "rg_name" {
  type = string
}

variable "postgres_sku" {
  type    = string
  default = "B_Standard_B1ms"
}

variable "postgres_version" {
  type    = string
  default = "14"
}

variable "admin_username" {
  type = string
}

variable "admin_password" {
  type      = string
  sensitive = true
}

variable "data_subnet_id" {
  type = string
}

variable "private_dns_zone_id" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
