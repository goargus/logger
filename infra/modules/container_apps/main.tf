resource "azurerm_container_app_environment" "main" {
  name                       = "${var.project_name}-${var.env}-cae"
  location                   = var.location
  resource_group_name        = var.rg_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  infrastructure_subnet_id   = var.container_apps_subnet_id
  tags                       = var.tags
}

resource "azurerm_container_app" "api" {
  name                         = "${var.project_name}-${var.env}-api"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = var.rg_name
  revision_mode                = "Single"
  tags                         = var.tags

  registry {
    server               = "ghcr.io"
    username             = var.ghcr_username
    password_secret_name = "ghcr-token"
  }

  secret {
    name  = "ghcr-token"
    value = var.ghcr_token
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    transport        = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 0
    max_replicas = 2

    container {
      name   = "api"
      image  = var.container_image
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "PORT"
        value = "3000"
      }
      env {
        name  = "DB_HOST"
        value = var.db_host
      }
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      env {
        name  = "DB_NAME"
        value = var.db_name
      }
      env {
        name  = "DB_USERNAME"
        value = var.db_username
      }
      env {
        name        = "DB_PASSWORD"
        secret_name = "db-password"
      }
      env {
        name  = "AUTH0_DOMAIN"
        value = var.auth0_domain
      }
      env {
        name  = "AUTH0_AUDIENCE"
        value = var.auth0_audience
      }
      env {
        name  = "AUTH0_ISSUER"
        value = var.auth0_issuer
      }
      env {
        name  = "CORS_ORIGINS"
        value = var.cors_origins
      }
      env {
        name  = "ADMIN_EMAIL"
        value = var.admin_email
      }
      env {
        name  = "ADMIN_USERNAME"
        value = var.admin_username
      }
      env {
        name  = "ADMIN_IDP_ISSUER"
        value = var.admin_idp_issuer
      }
      env {
        name  = "ADMIN_IDP_SUBJECT"
        value = var.admin_idp_subject
      }
    }
  }
}
