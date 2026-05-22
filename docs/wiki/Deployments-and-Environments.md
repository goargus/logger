# Deployments and Environments

## CI

GitHub Actions runs CI on pushes to all branches.

Current checks:

- backend `npm ci`
- backend lint
- backend prettier check
- backend tests
- backend Docker build verification
- frontend `flutter pub get`
- frontend analyze
- frontend format check
- frontend tests

## Production backend deploy

Workflow: `.github/workflows/deploy-backend-prod.yml`

Behavior:

- triggers on `main` for backend-related changes
- builds and pushes `ghcr.io/goargus/logger`
- deploys the image to Azure Container Apps

## Frontend deploys

Production workflow:

- `.github/workflows/deploy-frontend-prod.yml`
- triggers on `main`
- builds Flutter web
- deploys to Cloudflare Pages

Development workflow:

- `.github/workflows/deploy-frontend-dev.yml`
- triggers on `develop`
- builds Flutter web
- deploys to Cloudflare Pages development branch

## Infrastructure

Terraform lives under `infra/`.

Important paths:

- `infra/root/`: root stack
- `infra/modules/`: reusable Azure and Cloudflare modules
- `infra/envs/`: example environment files

Production operations guide:

- `infra/root/README.md`

## First production deploy

High-level order:

1. Bootstrap remote Terraform state if needed.
2. Apply infrastructure from `infra/root`.
3. Configure repository secrets for backend and frontend workflows.
4. Push or manually dispatch the workflows.
5. Verify backend health and frontend connectivity.

## Post-deploy checks

- `GET /health` returns success
- frontend can authenticate and reach `API_BASE_URL`
- Swagger loads at `/api/docs`
- backend image tag in Azure matches the deployed workflow output
- Cloudflare Pages serves the expected branch and build
