# FAQ

## What is Logger?

Logger is a full-stack application for recording activities, managing users and roles across an entity hierarchy, and generating reports.

## Is this a reusable logging library?

No. It is an application with a backend API and a frontend web client.

## What technologies does the project use?

- NestJS and TypeScript for the backend
- PostgreSQL with TypeORM
- Flutter Web for the frontend
- Terraform for infrastructure
- GitHub Actions for CI/CD

## How do I run it locally quickly?

Use:

```bash
docker-compose up
```

Then open `http://localhost:8080` and `http://localhost:3000/api/docs`.

## Where is the API documentation?

Swagger is served at:

```text
/api/docs
```

## Why does the backend ask for Entra values even if I use Auth0?

Because the current backend config validation requires `ENTRA_TENANT_ID` and `ENTRA_CLIENT_ID`.

## Where do I configure the frontend API URL?

Through Flutter `--dart-define` values, especially `API_BASE_URL`.

## Why do I see both “Logger” and “Secretary” in the repository?

The GitHub repository is named `logger`, but older paths and docs still contain legacy naming.

## How do I know which routes really exist?

Check the controllers in `backend/src/` and verify them in Swagger.

## Can I edit the GitHub Wiki directly?

You can, but the recommended source of truth in this repository is `docs/wiki/` so changes can be reviewed in pull requests.
