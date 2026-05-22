# Getting Started

This page is the fastest path to running Logger locally and confirming that the main components are working.

## Prerequisites

The repository contents indicate these baseline requirements:

| Tool | Recommended version | Source |
| --- | --- | --- |
| Git | Current stable release | Required to clone the repository |
| Node.js | 20.x | Used in CI and backend Docker image |
| npm | To be confirmed | Required for backend and E2E workspaces |
| Flutter | Stable channel | Used in CI and frontend build |
| Docker | Current stable release | Required for the full local Compose setup |
| Docker Compose | Current stable release | Required for `docker-compose.yml` |

> Status: To be confirmed.
>
> The repository does not declare an explicit npm version or a checked-in `.nvmrc` file.

## Clone the repository

```bash
git clone git@github.com:goargus/logger.git
cd logger
```

If your local folder name is different, that does not affect the build as long as the repository contents stay intact.

## Fastest local run

From the repository root:

```bash
docker-compose up
```

This starts:

- PostgreSQL on host port `5433`
- backend API on `http://localhost:3000`
- frontend web app on `http://localhost:8080`

The Compose file also starts an `init` container that installs backend dependencies and runs the admin bootstrap script.

## Verify the environment

After startup, verify these endpoints:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/
```

Then open:

- frontend: `http://localhost:8080`
- Swagger UI: `http://localhost:3000/api/docs`

Expected results:

- `/health` returns a success response
- `/api/docs` loads Swagger
- the frontend redirects to the configured sign-in flow

## Manual setup option

If you do not want Docker, follow:

- [Installation](Installation) for backend and frontend setup
- [Configuration](Configuration) for environment values

## Common first-run issues

| Problem | Likely cause | What to check |
| --- | --- | --- |
| Backend exits during startup | Missing or invalid environment variables | Review [Configuration](Configuration) |
| Frontend loads but cannot sign in | Missing build-time auth values | Confirm `--dart-define` values |
| `docker-compose up` stalls | Container dependency or install step issue | Inspect logs for `db`, `init`, and `backend` |
| Swagger does not load | Wrong path | Use `/api/docs`, not `/api` |
