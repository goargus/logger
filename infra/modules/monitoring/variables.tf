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

variable "vm_id" {
  type = string
}

variable "enabled" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
