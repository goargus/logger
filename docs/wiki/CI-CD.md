# CI/CD

Logger uses GitHub Actions for continuous integration and deployment.

## Workflow inventory

| Workflow | File | Purpose |
| --- | --- | --- |
| CI | `.github/workflows/ci.yml` | Build and validation on pushes |
| Deploy Backend Prod | `.github/workflows/deploy-backend-prod.yml` | Build, push, and deploy backend on `main` |
| Deploy Frontend Dev | `.github/workflows/deploy-frontend-dev.yml` | Build and deploy frontend from `develop` |
| Deploy Frontend Prod | `.github/workflows/deploy-frontend-prod.yml` | Build and deploy frontend from `main` |

## When workflows run

| Workflow | Trigger |
| --- | --- |
| CI | Push to any branch |
| Deploy Backend Prod | Push to `main` affecting backend or workflow file, or manual dispatch |
| Deploy Frontend Dev | Push to `develop`, or manual dispatch |
| Deploy Frontend Prod | Push to `main`, or manual dispatch |

## CI workflow behavior

### Backend job

- checks out the code
- sets up Node.js 20
- runs `npm ci`
- runs `npm audit --audit-level=critical`
- runs lint
- checks Prettier formatting
- runs tests
- builds the backend Docker image as a verification step

### Frontend job

- checks out the code
- sets up Flutter stable
- runs `flutter pub get`
- runs `flutter doctor`
- runs `flutter analyze`
- checks formatting
- runs `flutter test`

## Backend production deploy

The backend production workflow:

1. logs in to GHCR
2. extracts Docker metadata
3. builds and pushes `ghcr.io/goargus/logger`
4. logs in to Azure
5. deploys the image to Azure Container Apps

## Frontend deployment

Both frontend workflows:

1. check out the code
2. install Flutter dependencies
3. build the web app with `--dart-define` values from secrets
4. deploy the built output to Cloudflare Pages

## Required secrets

### Backend deployment

| Secret | Used for |
| --- | --- |
| `AZURE_CLIENT_ID` | Azure login |
| `AZURE_TENANT_ID` | Azure login |
| `AZURE_SUBSCRIPTION_ID` | Azure login |
| `AZURE_RESOURCE_GROUP` | Container Apps deployment target |
| `AZURE_CONTAINER_APP_NAME` | Container Apps deployment target |

### Frontend deployment

| Secret | Used for |
| --- | --- |
| `AUTH0_DOMAIN` | Frontend build-time auth config |
| `AUTH0_CLIENT_ID` | Frontend build-time auth config |
| `AUTH0_AUDIENCE` | Frontend build-time auth config |
| `REDIRECT_URI` | Frontend build-time auth config |
| `API_BASE_URL` | Frontend build-time API base URL |
| `ENTRA_TENANT_ID` | Frontend build-time auth config |
| `ENTRA_CLIENT_ID` | Frontend build-time auth config |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Pages deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Pages deploy |
| `CLOUDFLARE_PAGES_PROJECT` | Cloudflare Pages deploy target |

## Troubleshooting failed pipelines

| Symptom | Check |
| --- | --- |
| Backend CI fails on lint | Run backend lint locally |
| Backend CI fails on formatting | Run Prettier check locally |
| Frontend CI fails on analyze | Run `flutter analyze` locally |
| Docker build step fails | Rebuild from the same Dockerfile locally |
| Backend deploy fails | Verify Azure secrets and image push to GHCR |
| Frontend deploy fails | Verify Cloudflare secrets and build-time defines |

For broader runtime issues, also see [Troubleshooting](Troubleshooting).
