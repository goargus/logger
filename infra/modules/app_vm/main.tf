locals {
  server_name = coalesce(var.api_domain, "_")
}

resource "azurerm_public_ip" "app" {
  name                = "${var.project_name}-${var.env}-pip-app"
  location            = var.location
  resource_group_name = var.rg_name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}

resource "azurerm_network_interface" "app" {
  name                = "${var.project_name}-${var.env}-nic-app"
  location            = var.location
  resource_group_name = var.rg_name
  tags                = var.tags

  ip_configuration {
    name                          = "ipconfig1"
    subnet_id                     = var.subnet_id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.app.id
  }
}

resource "azurerm_linux_virtual_machine" "app" {
  name                = "${var.project_name}-${var.env}-vm-app"
  location            = var.location
  resource_group_name = var.rg_name
  size                = var.vm_size
  admin_username      = var.vm_admin_username
  network_interface_ids = [
    azurerm_network_interface.app.id
  ]

  disable_password_authentication = true

  admin_ssh_key {
    username   = var.vm_admin_username
    public_key = var.ssh_public_key
  }

  identity {
    type = "SystemAssigned"
  }

  os_disk {
    name                 = "${var.project_name}-${var.env}-osdisk"
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  custom_data = base64encode(templatefile("${path.module}/cloud-init.yaml.tftpl", {
    docker_compose_b64 = var.docker_compose_b64
    env_file_b64       = var.env_file_b64
    server_name        = local.server_name
  }))

  tags = var.tags
}
