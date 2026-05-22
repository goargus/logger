# Troubleshooting

## Backend fails to start

Check:

- database connection variables
- Auth0 issuer includes a trailing slash
- Entra tenant and client IDs are present and valid UUIDs
- the database exists and migrations have run

The backend config validator is strict. Missing auth or database values will block startup early.

## Swagger is missing

Swagger is mounted at:

```text
/api/docs
```

If you are checking `/api`, you are using stale documentation.

## Frontend loads but API calls fail

Check:

- `API_BASE_URL`
- CORS origins in backend env
- whether the browser is using the expected auth configuration
- whether the backend is reachable at `/health`

## Authentication works but app access is wrong

Check:

- whether the external identity is linked to the intended local user
- role assignments for that user
- entity scope of those assignments
- whether the user is expecting hierarchy access without the corresponding permissions

## Activities appear locked unexpectedly

Check:

- `GET /periods/availability?month=YYYY-MM`
- entity admin lock settings
- user-specific exceptions
- the activity date being edited, not just the current date

The current implementation is date-availability based, so operator expectations from older “open/close reporting period” docs may not match the live behavior.

## Deployment succeeded but runtime is stale

Check:

- the image tag pushed to GHCR
- the Azure Container Apps deployed revision
- Cloudflare Pages branch and latest deployment
- whether the change was in backend code, frontend code, or both

## Naming confusion

If you see both `Logger` and `Secretary`:

- `Logger` is the canonical repository and product name
- `Secretary` is legacy/internal naming still present in some paths and old docs
