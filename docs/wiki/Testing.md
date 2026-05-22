# Testing

Logger uses multiple levels of testing across backend, frontend, and end-to-end workflows.

## Testing strategy

| Layer | Tooling | Purpose |
| --- | --- | --- |
| Backend unit and service tests | Jest | Validate backend logic and controller/service behavior |
| Backend e2e-style tests | Jest | Validate application behavior through backend test harnesses |
| Frontend tests | Flutter test | Validate widgets, models, services, and logic |
| End-to-end behavior | Cucumber | Validate user journeys and API behavior |

## Backend test commands

```bash
cd backend
npm run test
npm run test:e2e
npm run test:cov
```

What these commands are for:

- `npm run test`: main Jest suite
- `npm run test:e2e`: backend e2e configuration in `src/test/jest-e2e.json`
- `npm run test:cov`: coverage output

## Frontend test commands

```bash
cd frontend
flutter test
flutter analyze
```

## E2E workspace

The repository contains a separate `e2e/` workspace with:

- feature files under `e2e/features/`
- step definitions under `e2e/step-definitions/`
- shared support code under `e2e/support/`

Representative scenarios cover:

- organization setup
- onboarding and offboarding
- reporting cycles
- role management
- leader and pastor reporting journeys

## How to add tests

### Backend

- add Jest specs near the relevant module or in backend test directories
- keep controller and service behavior covered when changing routes or business rules

### Frontend

- add tests in `frontend/test/`
- follow the current split between widget, provider, model, service, and helper tests

### E2E

- add Gherkin scenarios under the appropriate feature area
- implement supporting steps in the matching step definition directories

## Interpreting results

| Result | Meaning |
| --- | --- |
| Green backend tests | Core NestJS behavior passed under Jest |
| Green frontend tests | Flutter widget and logic checks passed |
| Green analyzer/lint checks | Formatting or static analysis did not detect obvious issues |
| Failing Cucumber or backend e2e tests | A user flow or API contract likely regressed |

## Coverage notes

The backend includes a coverage command, but the repository does not currently publish a formal coverage target or badge.

> Status: To be confirmed.
>
> A required minimum coverage threshold is not documented in the checked-in configuration.
