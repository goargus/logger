# Data Seeding and Bootstrap

## Available scripts

Backend scripts are defined in `backend/package.json`.

Main commands:

```bash
cd backend
npm run admin:bootstrap
npm run seed:roles
npm run seed:honduras-structure
npm run seed:honduras-users
npm run seed:simulation
```

## `admin:bootstrap`

Creates or initializes the first administrator record based on the configured identity information.

Use when:

- bringing up a new environment
- restoring admin access in a fresh database

Requires admin identity environment variables to be set correctly.

## `seed:roles`

Seeds:

- role definitions
- role-permission mappings
- a large predefined activity type catalog

The seeded role and activity labels are predominantly Spanish-language and tailored to church operations in this project’s target domain.

## `seed:honduras-structure`

Seeds an example hierarchy:

- one platform
- one Honduran union
- three associations
- nine fields

Use this for demos, testing, or an initial baseline when the target hierarchy matches that pattern closely enough.

## `seed:honduras-users`

Creates example user records for the Honduras structure. Use only in non-production environments unless you intentionally want those fixtures.

## `seed:simulation`

Generates simulated activity data across a longer time window. This is useful for exercising reports, trends, rankings, and expense views.

## Safe usage guidance

- Run migrations before any seed script
- Seed roles before expecting activity-type authorization to work
- Avoid fixture-style user or simulation seeds in production
- Re-run structure and role seeds only if you understand their duplicate-handling behavior
