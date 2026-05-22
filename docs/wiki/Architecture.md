# Architecture

## Backend architecture

The backend is a modular NestJS application with these layers:

- Controllers define HTTP routes and request validation
- Services implement domain logic
- TypeORM entities and repositories persist data in PostgreSQL
- Guards and CASL policies enforce access control

Primary modules:

- `activities-type`
- `activity`
- `admin`
- `auth`
- `casl`
- `entities`
- `health`
- `periods`
- `reports`
- `roles`
- `users`

## Request and auth flow

1. A client authenticates with its configured identity provider.
2. The client sends a bearer token to the backend.
3. The backend validates JWTs and resolves the external identity to a local user.
4. Role assignments and permissions are loaded for that user.
5. Guards and CASL policies determine whether the route is allowed.

## Authorization model

There are two layers in practice:

- Role-based checks for endpoints such as admin-only operations
- CASL ability checks for entity-scoped access and resource actions

This matters because not every resource follows the same guard pattern. Entity management, for example, uses ability checks against actual entity records.

## Frontend architecture

The frontend is a Flutter web app using:

- `go_router` for navigation
- Riverpod providers for state management
- Service classes for API interaction
- Model classes mirroring backend response shapes

Key frontend areas:

- `lib/pages/`: page-level screens
- `lib/providers/`: state orchestration
- `lib/services/`: backend API clients
- `lib/widgets/`: reusable UI components
- `lib/config/`: build-time API and auth settings

## Observability and runtime behavior

- Pino-based logging is enabled through `nestjs-pino`
- Global validation uses Nest `ValidationPipe`
- Global exception handling uses `AllExceptionsFilter`
- Swagger is published at `/api/docs`
- Health checks are exposed at `/health` and `/admin/health`

## Deployment architecture

Production deployment currently uses:

- GHCR for backend images: `ghcr.io/goargus/logger`
- Azure Container Apps for backend runtime
- Azure PostgreSQL Flexible Server for data
- Cloudflare Pages for frontend delivery
- Terraform under `infra/` for infrastructure state
