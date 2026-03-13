variable "name" {
  type        = string
  description = "Name for the Log Analytics workspace."
}

variable "location" {
  type = string
}

variable "rg_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
