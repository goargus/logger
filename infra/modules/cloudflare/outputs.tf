output "api_fqdn" {
  value = "${var.api_subdomain}.${var.domain}"
}

output "frontend_fqdn" {
  value = "${var.frontend_subdomain}.${var.domain}"
}
