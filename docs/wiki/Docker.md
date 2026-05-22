# Docker

Logger includes Docker support for local development and separate backend and frontend container builds.

## Docker assets in the repository

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Full local development stack |
| `backend/dockerfile` | Backend multi-stage image |
| `frontend/Dockerfile` | Frontend multi-stage image |
| `e2e/docker-compose.e2e.yml` | E2E-related container setup |

## Local development with Docker Compose

Run from the repository root:

```bash
docker-compose up
```

This starts:

- PostgreSQL database
- backend init job
- backend API
- frontend web server

## Backend Dockerfile

The backend Dockerfile defines:

- `base` stage: install dependencies and build the application
- `dev` stage: run `npm run start:dev`
- `prod` stage: install production dependencies and run the compiled app

### Build the backend image

```bash
docker build -t logger-backend -f backend/dockerfile backend
```

### Run the backend image

```bash
docker run --rm -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=churchdb \
  -e AUTH0_DOMAIN=example.us.auth0.com \
  -e AUTH0_ISSUER=https://example.us.auth0.com/ \
  -e AUTH0_AUDIENCE=logger \
  -e ENTRA_TENANT_ID=00000000-0000-0000-0000-000000000000 \
  -e ENTRA_CLIENT_ID=00000000-0000-0000-0000-000000000001 \
  logger-backend
```

## Frontend Dockerfile

The frontend Dockerfile:

- downloads a Flutter SDK tarball
- builds the web application
- serves the output through Nginx on port `8080`

### Build the frontend image

```bash
docker build -t logger-frontend \
  --build-arg AUTH0_DOMAIN=example.us.auth0.com \
  --build-arg AUTH0_CLIENT_ID=example-client-id \
  --build-arg AUTH0_AUDIENCE=logger \
  --build-arg ENTRA_TENANT_ID=00000000-0000-0000-0000-000000000000 \
  --build-arg ENTRA_CLIENT_ID=00000000-0000-0000-0000-000000000001 \
  --build-arg REDIRECT_URI=http://localhost:8080 \
  --build-arg API_BASE_URL=http://localhost:3000 \
  -f frontend/Dockerfile frontend
```

### Run the frontend image

```bash
docker run --rm -p 8080:8080 logger-frontend
```

## Common Docker issues

| Problem | Likely cause | Fix |
| --- | --- | --- |
| Backend container starts then exits | Missing required env vars | Review [Configuration](Configuration) |
| Frontend builds but auth fails | Incorrect build args | Rebuild with correct `--build-arg` values |
| Compose backend cannot reach DB | DB service not healthy yet | Check `db` container logs and health status |
| Port conflict | `3000`, `5433`, or `8080` already in use | Stop the conflicting service or remap ports |
