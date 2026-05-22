# Local Development

## Prerequisites

- Node.js 20 for backend work
- npm
- Flutter stable toolchain for frontend work
- Docker and Docker Compose for the fastest full-stack setup
- PostgreSQL only if you are running the backend without Docker

## Fastest path: Docker Compose

From repo root:

```bash
docker-compose up
```

This starts:

- PostgreSQL on host port `5433`
- Backend on `http://localhost:3000`
- Frontend on `http://localhost:8080`

The compose file also runs an `init` container that installs backend dependencies and executes the admin bootstrap script.

## Compose defaults to know

- The local compose database name is `churchdb`
- The local compose Auth0 audience is `logger`
- The backend health check targets `GET /health`
- The frontend build receives its API and auth values as Docker build args

## Manual backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run migration:run
npm run admin:bootstrap
npm run start:dev
```

Swagger is available at:

```text
http://localhost:3000/api/docs
```

## Manual frontend setup

```bash
cd frontend
flutter pub get
flutter run -d chrome \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=AUTH0_DOMAIN=... \
  --dart-define=AUTH0_CLIENT_ID=... \
  --dart-define=AUTH0_AUDIENCE=logger \
  --dart-define=REDIRECT_URI=http://localhost:8080
```

Add Entra values too if you are testing that path:

```bash
--dart-define=ENTRA_TENANT_ID=... \
--dart-define=ENTRA_CLIENT_ID=...
```

## Backend commands

```bash
cd backend
npm run build
npm run test
npm run test:e2e
npm run lint
npm run migration:run
npm run admin:bootstrap
npm run seed:roles
npm run seed:honduras-structure
npm run seed:honduras-users
npm run seed:simulation
```

## Frontend commands

```bash
cd frontend
flutter analyze
flutter test
flutter build web --release --dart-define=API_BASE_URL=http://localhost:3000
```

## Important configuration caveat

Backend config validation currently requires both Auth0 and Entra UUID values to be present. Even if your main sign-in path is Auth0, leave valid `ENTRA_TENANT_ID` and `ENTRA_CLIENT_ID` values in the environment.
