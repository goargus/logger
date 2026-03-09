# TXT record for Azure custom domain verification
resource "cloudflare_record" "api_txt_verification" {
  zone_id = var.zone_id
  name    = "asuid.${var.api_subdomain}"
  type    = "TXT"
  content = var.api_domain_verification_id
  ttl     = 300
}

# A record pointing to the Container Apps static IP (proxy OFF for Azure managed cert)
resource "cloudflare_record" "api_a" {
  zone_id = var.zone_id
  name    = var.api_subdomain
  type    = "A"
  content = var.api_static_ip
  proxied = false
  ttl     = 300
}

# CNAME record for frontend → Cloudflare Pages (proxy ON)
resource "cloudflare_record" "frontend_cname" {
  zone_id = var.zone_id
  name    = var.frontend_subdomain
  type    = "CNAME"
  content = var.pages_cname_target
  proxied = true
}
