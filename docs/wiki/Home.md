# Logger Wiki

Logger is a monorepo for tracking organizational activities, enforcing role-based access, and producing hierarchy-aware reports for church operations.

This wiki is written for operators and maintainers first. It explains how the system is structured, how to run it, how to configure identities and environments, and how to operate the reporting workflow safely.

## Start here

- [System Overview](System-Overview)
- [Local Development](Local-Development)
- [Configuration and Secrets](Configuration-and-Secrets)
- [Operational Workflows](Operational-Workflows)
- [Roles and Permissions](Roles-and-Permissions)
- [API Reference Guide](API-Reference-Guide)
- [Deployments and Environments](Deployments-and-Environments)
- [Troubleshooting](Troubleshooting)

## Repository layout

- `backend/`: NestJS API, database access, auth, permissions, reports, bootstrap scripts
- `frontend/`: Flutter web client
- `e2e/`: Cucumber-based end-to-end tests and user journeys
- `infra/`: Terraform for production infrastructure and environment examples

## Naming note

The canonical product name is **Logger**.

Older local paths and some internal docs still use **Secretary**. Treat that as legacy naming while reading the codebase.
