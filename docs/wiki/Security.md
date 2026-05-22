# Security

This page covers practical security guidance based on the current repository contents.

## Secrets management

Never commit:

- `.env` files with real credentials
- database passwords
- personal access tokens
- cloud credentials
- private keys
- CI/CD secrets

Use:

- GitHub Actions Secrets for workflow configuration
- private local environment files for development
- secure secret stores in production infrastructure

## Repository security considerations

### Authentication

The backend relies on external identity providers and bearer JWT validation. Keep tenant, issuer, and audience settings consistent across environments.

### Authorization

Permissions and role assignments control data visibility. Avoid assigning administrative permissions broadly.

### Database access

Database connection details are environment-based. Restrict production access to the minimum required users and network paths.

### Deployment secrets

The workflows expect cloud and deployment secrets. Those must remain in GitHub Secrets, not in committed workflow files.

## What should never be committed

| Type | Examples |
| --- | --- |
| Environment secrets | `.env`, production `.tfvars`, live service credentials |
| API credentials | PATs, API keys, secret tokens |
| Identity secrets | OAuth client secrets, private certificates, signing keys |
| Cloud credentials | Azure secret material, Cloudflare credentials |

## Public repository guidance

Because the repository is public-facing documentation-wise:

- keep examples sanitized
- avoid using live hostnames unless they are already intentionally public
- do not include real user identifiers, secrets, or internal-only values

## Responsible disclosure

> Status: To be confirmed.
>
> The repository does not currently publish a checked-in security policy or disclosure contact.

Until a formal policy exists, maintainers should define a private channel for vulnerability reporting and avoid encouraging public issue disclosure of sensitive findings.
