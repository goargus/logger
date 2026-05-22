# Installation

This page documents step-by-step installation for local development.

## Installation paths

- **Recommended:** full-stack local setup with Docker Compose
- **Alternative:** manual backend and frontend setup

## Option 1: Docker Compose

### Step 1: Clone the repository

```bash
git clone git@github.com:goargus/logger.git
cd logger
```

### Step 2: Start the stack

```bash
docker-compose up
```

### What the stack does

| Service | Role | Notes |
| --- | --- | --- |
| `db` | PostgreSQL 15 | Exposed on host port `5433` |
| `init` | Backend bootstrap helper | Installs backend deps and runs `npm run admin:bootstrap` |
| `backend` | NestJS API | Runs in watch mode on port `3000` |
| `frontend` | Flutter web app via Nginx | Exposed on port `8080` |

### Verify the install

```bash
curl http://localhost:3000/health
```

Open:

- `http://localhost:3000/api/docs`
- `http://localhost:8080`

## Option 2: Manual backend installation

### Step 1: Install dependencies

```bash
cd backend
npm install
```

### Step 2: Create an environment file

```bash
cp .env.example .env
```

Update the values to match your local environment. See [Configuration](Configuration).

### Step 3: Prepare the database

Create a PostgreSQL database, then run:

```bash
npm run migration:run
```

### Step 4: Bootstrap the first admin user

```bash
npm run admin:bootstrap
```

### Step 5: Start the backend

```bash
npm run start:dev
```

## Option 3: Manual frontend installation

### Step 1: Install dependencies

```bash
cd frontend
flutter pub get
```

### Step 2: Run the frontend

```bash
flutter run -d chrome \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=AUTH0_DOMAIN=your-tenant.auth0.com \
  --dart-define=AUTH0_CLIENT_ID=your-client-id \
  --dart-define=AUTH0_AUDIENCE=logger \
  --dart-define=REDIRECT_URI=http://localhost:8080 \
  --dart-define=ENTRA_TENANT_ID=00000000-0000-0000-0000-000000000000 \
  --dart-define=ENTRA_CLIENT_ID=00000000-0000-0000-0000-000000000001
```

## Build commands

### Backend

```bash
cd backend
npm run build
```

### Frontend

```bash
cd frontend
flutter build web --release \
  --dart-define=API_BASE_URL=http://localhost:3000
```

## Test commands

### Backend

```bash
cd backend
npm run test
npm run test:e2e
```

### Frontend

```bash
cd frontend
flutter test
```

## Optional seed commands

After backend setup, these commands are available:

```bash
cd backend
npm run seed:roles
npm run seed:honduras-structure
npm run seed:honduras-users
npm run seed:simulation
```

Use fixture-style seeds carefully. See [Usage](Usage) and [Testing](Testing) for context.
