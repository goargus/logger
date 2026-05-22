# Configuration

Logger uses configuration from backend environment variables, frontend build-time defines, Docker inputs, and infrastructure files.

## Configuration files in the repository

| File | Purpose |
| --- | --- |
| `backend/.env.example` | Example backend environment variables |
| `backend/src/config/config.validation.ts` | Backend environment validation rules |
| `backend/src/config/auth.config.ts` | Auth-related config mapping |
| `docker-compose.yml` | Local full-stack environment wiring |
| `frontend/lib/config/api_config.dart` | Frontend API base URL |
| `frontend/lib/config/auth_config.dart` | Frontend auth settings from build-time variables |
| `infra/envs/*.example*` | Environment examples for infrastructure and remote environments |
| `.github/workflows/*.yml` | CI/CD configuration and required secrets |

## Backend environment variables

The backend validates configuration at startup. Based on `backend/src/config/config.validation.ts`, these are the current variables:

| Variable | Required | Description | Example value | Notes |
| --- | --- | --- | --- | --- |
| `PORT` | Optional | HTTP port for the backend | `3000` | Defaults to `3000` |
| `NODE_ENV` | Optional | Runtime environment | `development` | Allowed: `development`, `production`, `test` |
| `AUTH0_DOMAIN` | Yes | Auth0 tenant domain | `dev-example.us.auth0.com` | Must be present |
| `AUTH0_ISSUER` | Yes | Auth0 issuer URL | `https://dev-example.us.auth0.com/` | Must end with `/` |
| `AUTH0_AUDIENCE` | Yes | Auth0 audience/API identifier | `logger` | Required even in local Compose |
| `ENTRA_TENANT_ID` | Yes | Entra tenant UUID | `00000000-0000-0000-0000-000000000000` | Required by current validator |
| `ENTRA_CLIENT_ID` | Yes | Entra application UUID | `00000000-0000-0000-0000-000000000001` | Required by current validator |
| `CORS_ORIGINS` | Optional | Comma-separated list of allowed origins | `http://localhost:8080,http://localhost:3000` | Falls back to local defaults |
| `DB_HOST` | Yes | Database host | `localhost` | Required |
| `DB_PORT` | Optional | Database port | `5432` | Defaults to `5432` |
| `DB_USERNAME` | Yes | Database user | `postgres` | Required |
| `DB_PASSWORD` | Yes | Database password | `postgres` | Required |
| `DB_NAME` | Yes | Database name | `churchdb` | Local Compose uses `churchdb` |
| `PERIOD_FREQUENCY` | Optional | Reporting periods per month | `2` | Integer from `1` to `6` |

## Bootstrap-related variables

These values are not part of the backend validation schema, but they are used by bootstrap and local setup flows:

| Variable | Required | Description | Example value | Notes |
| --- | --- | --- | --- | --- |
| `ADMIN_EMAIL` | Depends on script usage | Email for the bootstrap admin user | `admin@example.com` | Used by bootstrap flow |
| `ADMIN_USERNAME` | Depends on script usage | Username for the bootstrap admin user | `admin` | Used by bootstrap flow |
| `ADMIN_IDP_ISSUER` | Depends on script usage | Issuer for the linked external identity | `https://dev-example.us.auth0.com/` | Used by bootstrap flow |
| `ADMIN_IDP_SUBJECT` | Depends on script usage | External identity subject | `auth0|abc123` | Used by bootstrap flow |

## Frontend build-time variables

The Flutter frontend does not use a checked-in `.env` file. It reads values through `String.fromEnvironment`.

| Variable | Required | Description | Example value | Notes |
| --- | --- | --- | --- | --- |
| `API_BASE_URL` | Yes | Backend base URL | `http://localhost:3000` | Required for API calls |
| `REDIRECT_URI` | Yes | Frontend auth redirect URI | `http://localhost:8080` | Required for sign-in flow |
| `AUTH0_DOMAIN` | Usually | Auth0 tenant domain | `dev-example.us.auth0.com` | Required for Auth0 flow |
| `AUTH0_CLIENT_ID` | Usually | Auth0 application client ID | `abc123` | Required for Auth0 flow |
| `AUTH0_AUDIENCE` | Usually | Auth0 audience | `logger` | Required for Auth0 flow |
| `ENTRA_TENANT_ID` | Optional | Entra tenant UUID | `00000000-0000-0000-0000-000000000000` | Used for Entra flow |
| `ENTRA_CLIENT_ID` | Optional | Entra app UUID | `00000000-0000-0000-0000-000000000001` | Used for Entra flow |

## Default values

The repository currently provides these defaults:

| Setting | Default value | Source |
| --- | --- | --- |
| Backend port | `3000` | `backend/src/main.ts` |
| Backend CORS origins | `http://localhost:3000`, `http://localhost:8080` | `backend/src/main.ts` |
| Database port | `5432` | backend config validation |
| Period frequency | `2` | backend config validation |
| Frontend API base URL | `http://localhost:3000` | `frontend/lib/config/api_config.dart` |

## `.env.example` recommendation

The repository already includes `backend/.env.example`, so a new example file is not needed for the backend.

For the frontend, the project currently relies on explicit `--dart-define` values rather than a committed `.env` convention.

## Security considerations

- Do not commit real `.env` files with production values.
- Do not commit database credentials, PATs, private keys, or CI secrets.
- Keep production values in deployment secrets or private environment files.
- Prefer GitHub Actions Secrets for workflow configuration.
- Treat `AUTH0_CLIENT_ID`, tenant IDs, and callback URLs as configuration, but treat client secrets, PATs, and service credentials as secrets.
