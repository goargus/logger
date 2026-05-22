# Configuration and Secrets

## Backend environment variables

The backend reads configuration from environment variables validated in `backend/src/config/config.validation.ts`.

Required variables:

- `PORT`
- `NODE_ENV`
- `AUTH0_DOMAIN`
- `AUTH0_ISSUER`
- `AUTH0_AUDIENCE`
- `ENTRA_TENANT_ID`
- `ENTRA_CLIENT_ID`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`

Optional variables:

- `CORS_ORIGINS`
- `PERIOD_FREQUENCY`

Bootstrap-related values used by scripts and local compose:

- `ADMIN_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_IDP_ISSUER`
- `ADMIN_IDP_SUBJECT`

## Frontend build-time defines

The Flutter web app reads configuration through `String.fromEnvironment`.

Required in most deployments:

- `API_BASE_URL`
- `REDIRECT_URI`
- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_AUDIENCE`

Optional or alternate identity path:

- `ENTRA_TENANT_ID`
- `ENTRA_CLIENT_ID`

## CORS behavior

If `CORS_ORIGINS` is set, the backend uses the comma-separated list.

If not set, it falls back to:

- `http://localhost:3000`
- `http://localhost:8080`

## Environment-specific ownership

### Development

- Local Docker Compose values live in `docker-compose.yml`
- Remote dev environment examples live under `infra/envs/`
- Frontend dev deployment is triggered from the `develop` branch

### Production

- Backend deploy workflow uses GitHub Actions and Azure credentials from repository secrets
- Frontend production deploy uses Cloudflare Pages secrets
- Terraform production values are expected from private files derived from `infra/envs/prod.tfvars.example`

## Secrets handling guidance

- Do not commit `.env` files with real credentials
- Do not commit private `tfvars` files
- Prefer GitHub Actions secrets for CI/CD
- Use `gh auth token` or a PAT only where the documented flow explicitly requires it
