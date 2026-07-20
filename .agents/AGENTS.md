# WorkforceOS Workspace Rules

## SQL Injection Protection
- **Banned Functions**: Never use `prisma.$queryRawUnsafe` or `prisma.$executeRawUnsafe` anywhere in the codebase.
- **SQL Sanitization**: All raw database interactions must use Prisma's parameterized tagged-template literals `prisma.$queryRaw` or `prisma.$executeRaw` to prevent SQL Injection vulnerabilities.

## Secrets Management
- All secrets must be loaded from environment variables validated by `env.ts`. No hardcoded developer fallbacks in production.

## Cookie-Based Auth & CSRF
- Always check that state-changing requests use double-submit CSRF cookie checks and authentication is verified via secure HttpOnly cookies.
