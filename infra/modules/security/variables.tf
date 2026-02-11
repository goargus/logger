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

variable "app_subnet_id" {
  type = string
}

variable "data_subnet_id" {
  type = string
}

variable "app_subnet_cidr" {
  type = string
}

variable "data_subnet_cidr" {
  type = string
}

variable "admin_cidr" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
