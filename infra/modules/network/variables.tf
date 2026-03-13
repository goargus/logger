variable "vnet_name" {
  type        = string
  description = "Name for the virtual network."
}

variable "location" {
  type = string
}

variable "rg_name" {
  type = string
}

variable "vnet_cidr" {
  type    = string
  default = "10.10.0.0/16"
}

variable "container_apps_subnet_cidr" {
  type    = string
  default = "10.10.0.0/23"
}

variable "data_subnet_cidr" {
  type    = string
  default = "10.10.2.0/24"
}

variable "tags" {
  type    = map(string)
  default = {}
}
