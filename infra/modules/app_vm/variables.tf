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

variable "subnet_id" {
  type = string
}

variable "vm_size" {
  type = string
}

variable "vm_admin_username" {
  type = string
}

variable "ssh_public_key" {
  type = string
}

variable "docker_compose_b64" {
  type = string
}

variable "env_file_b64" {
  type = string
}

variable "api_domain" {
  type    = string
  default = null
}

variable "tags" {
  type    = map(string)
  default = {}
}
