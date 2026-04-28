# Environment Files

- `prod.backend.hcl`: backend configuration for Terraform remote state in production.
- `prod.tfvars.example`: example production variables for Azure/Terraform resources.
- `dev.render.example.env`: example values for the remote dev stack on Render + Neon + Cloudflare Pages.

Recommended workflow:

1. Copy `prod.tfvars.example` to a private `prod.tfvars`.
2. Keep `prod.tfvars` out of git.
3. Configure Render and GitHub environment secrets for `dev` from `dev.render.example.env`.

GitHub Environments expected by the workflows:

- `development`
- `production`

Frontend secrets expected in both environments:

- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_AUDIENCE`
- `REDIRECT_URI`
- `API_BASE_URL`
- `ENTRA_TENANT_ID`
- `ENTRA_CLIENT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`

Additional backend production secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`
- `AZURE_CONTAINER_APP_NAME`
