# Logger

Logger is a full-stack activity tracking and reporting system for organizations that operate through a hierarchy of entities such as platform, union, association, and field. The repository contains a NestJS backend, a Flutter web frontend, end-to-end tests, and Terraform infrastructure definitions.

The application is built around these workflows:

- managing organization entities and hierarchy
- assigning roles and permissions to users
- logging activity records with optional expense data
- controlling date availability through admin locks and exceptions
- producing summary, breakdown, ranking, trend, and exportable reports

## Who this project is for

- developers onboarding to the codebase
- maintainers operating development and production environments
- contributors extending backend, frontend, or infrastructure components

## Main features

| Area | What is implemented |
| --- | --- |
| Authentication | JWT-based API access with identity resolution for external providers |
| Authorization | Role and permission model with hierarchy-aware access checks |
| Activity logging | CRUD operations for user activities with filtering, pagination, and soft delete |
| Reporting | Summary, breakdown, trends, comparison, rankings, expenses, and export endpoints |
| Hierarchy management | CRUD and tree queries for `PLATFORM`, `UNION`, `ASSOCIATION`, and `FIELD` entities |
| Operational controls | Admin locks and user exceptions for date availability |
| Deployment | GitHub Actions workflows for CI, backend production deploy, and frontend deploys |

## Current project status

The repository is active and already contains:

- a runnable local Docker Compose setup
- production-oriented infrastructure definitions under `infra/`
- test suites for backend, frontend, and Cucumber-based end-to-end coverage
- GitHub Actions workflows for CI and deployment

There are also a few naming inconsistencies in the repository:

- the GitHub repository is `goargus/logger`
- the local checkout directory is `secretary-backend`
- the frontend app title still includes `Missionary App`
- older documentation still refers to `Secretary`

These are documented here instead of normalized by guesswork.

## Quick navigation

- [Getting Started](Getting-Started)
- [Installation](Installation)
- [Configuration](Configuration)
- [Usage](Usage)
- [Architecture](Architecture)
- [Project Structure](Project-Structure)
- [API Reference](API-Reference)
- [Development Guide](Development-Guide)
- [Testing](Testing)
- [Docker](Docker)
- [CI/CD](CI-CD)
- [Troubleshooting](Troubleshooting)
- [Security](Security)
- [FAQ](FAQ)

## Repository overview

| Path | Purpose |
| --- | --- |
| `backend/` | NestJS API, migrations, bootstrap and seed scripts |
| `frontend/` | Flutter web application |
| `e2e/` | Cucumber features, step definitions, and test support code |
| `infra/` | Terraform root stack, modules, and environment examples |
| `.github/workflows/` | CI and deployment workflows |

## Start here first

If you are new to the project, begin with:

1. [Getting Started](Getting-Started)
2. [Installation](Installation)
3. [Usage](Usage)
4. [Architecture](Architecture)
