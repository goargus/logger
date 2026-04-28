# Deployment Guide

This guide covers production deployment of the Secretary backend and the
recommended split between `dev` and `prod`.

## Environment Strategy

- `dev`: Render + Neon + Cloudflare Pages frontend
- `prod`: Azure Container Apps + Azure PostgreSQL + Cloudflare DNS/Pages frontend

Use separate Auth0 and Entra applications for each environment. Do not reuse
callback URLs, logout URLs, allowed web origins, or audiences across `dev` and `prod`.

## Prerequisites

- Docker and Docker Compose (recommended)
- PostgreSQL 15+
- Auth0 tenant configured
- SSL certificate for production

## Environment Variables

### Required Variables

```env
# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=secretary
DB_USERNAME=app_user
DB_PASSWORD=secure_password

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.your-domain.com
AUTH0_ISSUER=https://your-tenant.auth0.com/

# Server
PORT=3000
NODE_ENV=production

# Bootstrap admin
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_IDP_ISSUER=https://your-tenant.auth0.com/
ADMIN_IDP_SUBJECT=auth0|replace-me
```

### Optional Variables

```env
# Logging
LOG_LEVEL=info

# CORS (comma-separated origins)
CORS_ORIGINS=https://app.your-domain.com
```

## Docker Deployment

### Build Image

```bash
cd backend
docker build -t secretary-backend:latest .
```

### Production Docker Compose

```yaml
version: '3.8'

services:
  backend:
    image: secretary-backend:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=secretary
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - AUTH0_DOMAIN=${AUTH0_DOMAIN}
      - AUTH0_AUDIENCE=${AUTH0_AUDIENCE}
      - AUTH0_ISSUER=${AUTH0_ISSUER}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=secretary
      - POSTGRES_USER=${DB_USERNAME}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME} -d secretary"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

### Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Database Setup

### Initial Setup

```bash
# Run migrations
docker exec secretary-backend npm run migration:run

# Bootstrap admin user
docker exec secretary-backend npm run admin:bootstrap

# Optional: Seed initial data
docker exec secretary-backend npm run db:init
```

### Migrations in Production

Always run migrations before deploying new code:

```bash
npm run migration:run
```

To generate a new migration after schema changes:

```bash
npm run migration:generate -- MigrationName
```

## Auth0 Configuration

### API Configuration

1. Create an API in Auth0 Dashboard
2. Set the identifier (audience) to match `AUTH0_AUDIENCE`
3. Enable RS256 signing algorithm

### Application Configuration

1. Create a Single Page Application
2. Configure allowed callback URLs
3. Configure allowed logout URLs
4. Configure allowed web origins
5. Repeat with separate applications for `dev` and `prod`

### Required Scopes

Ensure your Auth0 rules/actions include these claims in the JWT:
- `sub` - User subject identifier
- `iss` - Issuer URL

### Environment-specific values

- `dev` frontend origin: `https://secretary-frontend-dev.pages.dev`
- `prod` frontend origin: `https://logger.asdmr.org.hn`
- `dev` API audience: the Render URL actually serving the backend
- `prod` API audience: `https://logger-api.asdmr.org.hn`

## Reverse Proxy Setup

### Nginx Configuration

```nginx
upstream backend {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Documentation
    location /api {
        proxy_pass http://backend/api;
    }
}
```

## Health Checks

The application exposes a health endpoint:

```
GET /
```

Response:
```json
{
  "status": "ok",
  "message": "API is running",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "env": "production"
}
```

Use this for load balancer health checks.

## Monitoring

### Logging

Logs are written to stdout in JSON format (production). Configure your container runtime to collect these.

### Metrics

Consider adding:
- Prometheus metrics endpoint
- Database connection pool monitoring
- Auth0 rate limit monitoring

## Backup and Recovery

### Database Backups

```bash
# Create backup
pg_dump -h $DB_HOST -U $DB_USERNAME -d secretary > backup.sql

# Restore backup
psql -h $DB_HOST -U $DB_USERNAME -d secretary < backup.sql
```

### Automated Backups

Set up a cron job or use your cloud provider's backup service:

```bash
# Daily backup at 2 AM
0 2 * * * pg_dump -h $DB_HOST -U $DB_USERNAME -d secretary | gzip > /backups/secretary-$(date +\%Y\%m\%d).sql.gz
```

## Security Checklist

- [ ] Use HTTPS only
- [ ] Set secure database password
- [ ] Configure CORS for your frontend domain only
- [ ] Enable database SSL connections
- [ ] Use non-root user in Docker container
- [ ] Keep dependencies updated
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Rotate secrets regularly
- [ ] Monitor for security advisories

## Troubleshooting

### Common Issues

**Database connection refused**
- Check DB_HOST and DB_PORT
- Verify database is running
- Check firewall rules

**Auth0 token validation fails**
- Verify AUTH0_DOMAIN matches your tenant
- Check AUTH0_AUDIENCE matches API identifier
- Ensure clock sync between servers

**Migrations fail**
- Check database user has schema permissions
- Verify database exists
- Check for pending migrations conflicts
