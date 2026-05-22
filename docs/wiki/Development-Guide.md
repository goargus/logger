# Development Guide

This page documents the current contributor workflow based on the repository contents.

## Recommended workflow

1. create a feature branch
2. make changes in the relevant workspace
3. run local validation commands
4. open a pull request against `main`
5. let GitHub Actions validate the change

## Branching

The repository contains workflows keyed to:

- `main` for production backend and frontend deploys
- `develop` for frontend development deploys

> Status: To be confirmed.
>
> The repository does not include a checked-in branching policy beyond what can be inferred from workflow triggers.

## Commit messages

> Status: To be confirmed.
>
> No formal commit message convention is documented in the repository.

For maintainability, use short imperative commit messages that describe the change clearly.

## Backend development commands

```bash
cd backend
npm install
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

## Frontend development commands

```bash
cd frontend
flutter pub get
flutter analyze
flutter test
flutter build web --release --dart-define=API_BASE_URL=http://localhost:3000
```

## E2E development commands

```bash
cd e2e
npm install
```

> Status: To be confirmed.
>
> The repository contains the E2E workspace and feature files, but a complete documented local execution flow for Cucumber tests is not fully described in the checked-in documentation.

## Formatting and linting

### Backend

```bash
cd backend
npm run lint
npx prettier --check "src/**/*.ts"
```

### Frontend

```bash
cd frontend
dart format --output=none --set-exit-if-changed lib/ test/
flutter analyze
```

## Building

### Backend

```bash
cd backend
npm run build
```

### Frontend

```bash
cd frontend
flutter build web --release \
  --dart-define=AUTH0_DOMAIN=... \
  --dart-define=AUTH0_CLIENT_ID=... \
  --dart-define=AUTH0_AUDIENCE=... \
  --dart-define=REDIRECT_URI=... \
  --dart-define=API_BASE_URL=...
```

## Submitting changes

- keep changes scoped to one concern where possible
- update documentation when routes, config, or workflows change
- include tests when behavior changes
- prefer pull requests over direct pushes to long-lived branches

## Working with wiki documentation

The GitHub Wiki source is stored in:

```text
docs/wiki/
```

Update those files in pull requests rather than editing the public wiki first.
