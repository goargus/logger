# Project Structure

This page documents the most important repository paths and what they are used for.

## Top-level tree

```text
.
├── .github/
│   └── workflows/         # CI and deployment workflows
├── backend/               # NestJS backend
├── docs/
│   └── wiki/              # Repo-managed GitHub Wiki source
├── e2e/                   # Cucumber end-to-end tests
├── frontend/              # Flutter web frontend
├── infra/                 # Terraform infrastructure
├── docker-compose.yml     # Local full-stack development stack
└── README.md              # Root project overview
```

## Backend structure

```text
backend/
├── docs/                  # Older backend-specific documentation
├── migrations/            # TypeORM migrations
├── scripts/               # Bootstrap and seed scripts
├── src/
│   ├── activities-type/   # Activity type endpoints and services
│   ├── activity/          # Activity CRUD and related DTOs
│   ├── admin/             # Administrative endpoints
│   ├── auth/              # Auth guards, strategy, identity linking
│   ├── casl/              # Policy and ability logic
│   ├── common/            # Filters, middleware, pagination utilities
│   ├── config/            # Runtime configuration and validation
│   ├── entities/          # Entity hierarchy logic
│   ├── health/            # Health endpoints
│   ├── idp-identities/    # Identity provider mappings
│   ├── periods/           # Date availability, locks, exceptions
│   ├── reports/           # Reporting and export services
│   ├── roles/             # Roles, permissions, assignments
│   ├── test/              # Backend e2e-style Jest tests
│   └── users/             # User management
├── .env.example           # Example backend environment variables
├── dockerfile             # Backend container build
└── package.json           # Backend scripts and dependencies
```

## Frontend structure

```text
frontend/
├── assets/                # Images and branding assets
├── lib/
│   ├── auth/              # Session and auth helpers
│   ├── config/            # API/auth config readers
│   ├── core/              # Shared errors, validators, layout constants
│   ├── models/            # Frontend data models
│   ├── pages/             # Main screens
│   ├── providers/         # Riverpod state providers
│   ├── services/          # HTTP-backed services
│   ├── theme/             # App theme
│   └── widgets/           # Reusable UI components
├── test/                  # Flutter tests
├── web/                   # Web entry assets and manifest
├── Dockerfile             # Frontend container build
└── pubspec.yaml           # Flutter package definition
```

## E2E structure

```text
e2e/
├── features/              # Gherkin feature files
├── step-definitions/      # Step implementations
├── support/               # Test support utilities and auth helpers
├── cucumber.js            # Cucumber configuration
└── package.json           # E2E scripts and dependencies
```

## Infrastructure structure

```text
infra/
├── envs/                  # Example environment files
├── modules/               # Reusable Terraform modules
├── root/                  # Root Terraform stack
└── scripts/               # Infrastructure helper scripts
```

## Notes on generated and ignored files

- `package-lock.json` and `pubspec.lock` are dependency lock files and should stay version-controlled unless the team changes policy.
- build output directories are not treated as source documentation.
- `.env` files with real values should not be committed.
- container images and Terraform state are external artifacts, not repo-tracked source files.
