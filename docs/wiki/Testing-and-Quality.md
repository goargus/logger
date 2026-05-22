# Testing and Quality

## Backend

From `backend/`:

```bash
npm run test
npm run test:e2e
npm run lint
```

Coverage areas in the repo include:

- services
- controllers
- permission logic
- locking logic
- report calculators
- validation helpers

## Frontend

From `frontend/`:

```bash
flutter analyze
flutter test
```

There are tests for:

- models
- providers
- services
- widgets
- validation and helper logic

## End-to-end journeys

The `e2e/` workspace uses Cucumber features to describe user journeys and API behavior.

Key value:

- documents intended behavior in business language
- catches workflow regressions across admin, missionary, pastor, and leader paths

## CI expectations

CI is branch-wide and meant to catch:

- broken backend code
- formatting drift
- frontend analyzer and test failures
- backend container build failures

## Documentation quality rule

For wiki maintenance, prefer documenting only behavior that is backed by one of:

- controller routes
- config validation
- seed scripts
- workflow files
- tested user journeys
