terraform {
  backend "azurerm" {
    resource_group_name  = "REPLACE_ME_TFSTATE_RG"
    storage_account_name = "REPLACE_ME_TFSTATE_STORAGE"
    container_name       = "REPLACE_ME_TFSTATE_CONTAINER"
    key                  = "secretary.prod.tfstate"
  }
}
