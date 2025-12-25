# Getting Started

This guide covers the setup and development workflow for the Secretary backend.

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 15+
- Docker & Docker Compose (for containerized development)

## Quick Start with Docker

The fastest way to get started is using Docker Compose:

```bash
# From the repository root
docker-compose up
```

This starts:
- PostgreSQL database on port 5433
- Backend API on port 3000
- Frontend on port 8080

The init container automatically runs migrations and seeds initial data.

## Manual Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the backend directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secretary
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_ISSUER=https://your-tenant.auth0.com/

# Admin Bootstrap
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_IDP_ISSUER=https://your-tenant.auth0.com/
ADMIN_IDP_SUBJECT=auth0|user_id

# Server
PORT=3000
```

### 3. Initialize Database

```bash
# Run migrations
npm run migration:run

# Bootstrap admin user
npm run admin:bootstrap

# Seed initial data
npm run db:init
```

### 4. Start Development Server

```bash
npm run start:dev
```

The API is now available at `http://localhost:3000`.

## API Documentation

Swagger UI is available at `http://localhost:3000/api` when the server is running.

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start with hot-reload |
| `npm run build` | Build for production |
| `npm run test` | Run unit tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run migration:generate -- Name` | Generate migration |
| `npm run migration:run` | Run migrations |

## Project Structure

```
backend/
├── src/
│   ├── activities/         # Activity tracking module
│   ├── activities-type/    # Activity type definitions
│   ├── admin/              # Admin endpoints
│   ├── auth/               # Authentication (Auth0 JWT)
│   ├── casl/               # Authorization (CASL)
│   ├── entities/           # Organizational hierarchy
│   ├── reporting-periods/  # Time-bounded reporting
│   ├── reports/            # Analytics and reports
│   ├── roles/              # RBAC management
│   └── users/              # User management
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── test/                   # E2E tests
```

## Next Steps

- [Architecture Overview](./architecture.md) - Understand the system design
- [Domain Concepts](./concepts.md) - Learn the data model
- [Deployment Guide](./deployment.md) - Production deployment
