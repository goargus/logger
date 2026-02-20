# Database Migrations

This project previously relied on `synchronize: true`, so a baseline migration is required to build a fresh database.

## Baseline Migration

File:
- `backend/migrations/InitialBaseline.ts`

What it does:
- Creates required extensions (`uuid-ossp`, `citext`)
- Creates enums, tables, indexes, and constraints for the full schema

## Applying On Existing Databases (Production/Staging)

The schema already exists, so the baseline migration must be marked as applied without running SQL.

1. Connect to the database.
2. Insert a row into the TypeORM `migrations` table using the class name and timestamp:

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1771610587459, 'InitialBaseline1771610587459');
```

If the migrations table name differs in your environment, adjust accordingly.

## Fresh Database Setup

From the `backend/` directory:

```bash
npm run migration:run
```

This will apply:
- `InitialBaseline1771610587459`
- `AddCurrencySymbolToEntities1736287200000`
- `EnableTrigramSearchActivities`

## Verification

1. Run migrations on a fresh PostgreSQL database.
2. Start the application and run tests.
3. Compare schema with production (e.g., `pg_dump --schema-only` diff).

## Future Workflow

- Avoid `synchronize: true` in production.
- Use migrations only for schema changes.
- Generate new migrations with:

```bash
npm run migration:generate -- NewFeature
```
