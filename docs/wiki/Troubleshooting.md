# Troubleshooting

This page collects common problems that can be diagnosed from the current repository setup.

## Common issues

| Problem | Possible cause | Solution |
| --- | --- | --- |
| Backend fails during startup | Missing required environment variables | Review [Configuration](Configuration) and ensure all required backend values are present |
| Backend rejects `AUTH0_ISSUER` | Issuer URL missing trailing slash | Set `AUTH0_ISSUER` to a URL ending in `/` |
| Backend exits even though Auth0 is configured | Entra variables are missing | Provide valid `ENTRA_TENANT_ID` and `ENTRA_CLIENT_ID` because current validation requires them |
| `/api` does not show docs | Wrong Swagger path | Use `http://localhost:3000/api/docs` |
| Frontend loads but cannot call API | `API_BASE_URL` is incorrect or backend is down | Verify frontend build-time values and test `GET /health` |
| Frontend sign-in loop | Auth config mismatch | Recheck `AUTH0_*`, `REDIRECT_URI`, and any Entra values |
| `docker-compose up` hangs or restarts | Dependency or health-check issue | Inspect logs for `db`, `init`, and `backend` containers |
| Cannot create or edit an activity | Date is locked or exception is missing | Check `/periods/availability` and admin lock configuration |
| Activity deletion fails | Missing confirmation query parameter | Call `DELETE /activities/:id?confirm=true` |
| Reports return less data than expected | User lacks required role or hierarchy scope | Verify role assignments and entity scope |
| CI fails on formatting | Local formatting drift | Run backend Prettier check or frontend `dart format` locally |
| Frontend deploy fails | Missing Cloudflare secrets or bad build-time config | Review [CI/CD](CI-CD) secret requirements |
| Backend deploy fails | Azure secrets or container deployment target mismatch | Review [CI/CD](CI-CD) backend deployment configuration |

## Startup diagnostics

### Backend

Check:

- database connectivity
- env var completeness
- migration status
- auth issuer format

Useful commands:

```bash
cd backend
npm run start:dev
npm run migration:run
```

### Frontend

Check:

- `flutter pub get` completed successfully
- `API_BASE_URL` points to the backend
- auth-related `--dart-define` values are correct

Useful commands:

```bash
cd frontend
flutter analyze
flutter test
```

## Docker-specific issues

If Docker is involved, also review [Docker](Docker).

Typical checks:

- confirm no port conflict on `3000`, `5433`, or `8080`
- confirm PostgreSQL became healthy before backend startup
- confirm the frontend image was built with the intended auth values

## CI/CD-specific issues

If a pipeline fails:

- confirm secrets exist
- rerun the same validation locally if possible
- verify whether the failure is in backend, frontend, or deployment logic

See [CI/CD](CI-CD) for workflow-specific details.
