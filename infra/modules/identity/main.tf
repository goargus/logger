data "azuread_client_config" "current" {}

resource "azuread_application" "logger" {
  display_name     = "${var.project_name}-${var.env}"
  sign_in_audience = "AzureADMyOrg"

  api {
    requested_access_token_version = 2

    oauth2_permission_scope {
      admin_consent_description  = "Allow the application to access the Logger API on behalf of the signed-in user."
      admin_consent_display_name = "Access Logger API"
      enabled                    = true
      id                         = "00000000-0000-0000-0000-000000000001"
      type                       = "User"
      user_consent_description   = "Allow the application to access the Logger API on your behalf."
      user_consent_display_name  = "Access Logger API"
      value                      = "access_as_user"
    }
  }

  single_page_application {
    redirect_uris = var.redirect_uris
  }

  optional_claims {
    id_token {
      name = "email"
    }
    id_token {
      name = "preferred_username"
    }
    access_token {
      name = "email"
    }
  }

  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

    resource_access {
      id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
      type = "Scope"
    }
    resource_access {
      id   = "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0" # email
      type = "Scope"
    }
    resource_access {
      id   = "14dad69e-099b-42c9-810b-d002981feec1" # profile
      type = "Scope"
    }
    resource_access {
      id   = "37f7f235-527c-4136-accd-4a02d197296e" # openid
      type = "Scope"
    }
  }
}

resource "azuread_application_identifier_uri" "logger_api" {
  application_id = azuread_application.logger.id
  identifier_uri = "api://${azuread_application.logger.client_id}"
}

resource "azuread_service_principal" "logger" {
  client_id = azuread_application.logger.client_id
}

resource "azuread_application_pre_authorized" "logger_spa" {
  application_id       = azuread_application.logger.id
  authorized_client_id = azuread_application.logger.client_id
  permission_ids       = ["00000000-0000-0000-0000-000000000001"]
}
