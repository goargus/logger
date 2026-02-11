# Azure Terraform: Missionary App (Three-Tier)

Production-lean Azure Terraform for a three-tier architecture with environments via Terraform workspaces: `dev`, `staging`, `prod`.

- Frontend: Cloudflare Pages (outside Azure)
- App tier: Linux VM running Docker (NestJS API)
- Data tier: Azure Database for PostgreSQL Flexible Server
- Region: single region (default `eastus2`, overrideable)

## Prereqs

1. Azure CLI login:
   - `az login`
   - `az account set --subscription <SUBSCRIPTION_ID>`

2. Create a Resource Group, Storage Account, and Container for remote state (not managed by this Terraform):
   - Resource Group: `REPLACE_ME_TFSTATE_RG`
   - Storage Account: `REPLACE_ME_TFSTATE_STORAGE` (globally unique)
   - Container: `REPLACE_ME_TFSTATE_CONTAINER`

3. Update `infra/root/backend.tf` with the names above.

## Variables

Create a `terraform.tfvars` in `infra/root` (do not commit) with values like:

```hcl
admin_cidr              = "YOUR_PUBLIC_IP/32"
ssh_public_key          = "ssh-ed25519 AAAA..."
docker_compose_b64      = "BASE64_OF_DOCKER_COMPOSE"
env_file_b64            = "BASE64_OF_ENV_FILE"
postgres_admin_username = "pgadmin"
postgres_admin_password = "REPLACE_ME"
```

Optional:

```hcl
location  = "eastus2"
api_domain = "api.example.com"
tags = {
  owner = "platform"
}
```

## Base64 Encoding

Encode your `docker-compose.yml` and `.env`:

```bash
base64 -i docker-compose.yml
base64 -i .env
```

## Example docker-compose.yml

This example matches the required stack and uses `/opt/app/nginx.conf` (written by cloud-init). It keeps HTTPS commented by default (Cloudflare proxy can handle TLS).

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      # - "443:443" # Optional if terminating TLS on the VM
    volumes:
      - /opt/app/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - nestjs

  nestjs:
    image: your-nestjs-image:latest
    expose:
      - "3000"
```

Optional LetsEncrypt approach (commented example):

```yaml
  # certbot:
  #   image: certbot/certbot
  #   volumes:
  #     - /etc/letsencrypt:/etc/letsencrypt
  #   command: certonly --standalone -d api.example.com --agree-tos -m you@example.com
```

## Workspaces

Only `prod` is required for deployment now, but `dev` and `staging` are supported.

```bash
terraform init
terraform workspace new prod
terraform workspace select prod
terraform plan
terraform apply
```

To use other environments:

```bash
terraform workspace new dev
terraform workspace new staging
```

## Destroy

```bash
terraform destroy
```

## Security Notes

- Restrict `admin_cidr` to your IP only.
- PostgreSQL requires SSL.
- DB firewall is limited to the VM public IP.
- Use Cloudflare proxy to terminate HTTPS; VM defaults to HTTP only.

## Cost Notes

- Biggest levers are VM size and PostgreSQL compute SKU.
- Storage size (64 GiB) is secondary.
- Log ingestion can grow costs if monitoring is enabled.

## Connectivity Tradeoff

This setup uses public PostgreSQL with firewall restricted to the VM public IP for simplicity and lower cost. Consider private access and private DNS if you need stronger network isolation.
