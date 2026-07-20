# Backend Code Review Checklist

This checklist contains critical security and coding practices to enforce during code reviews.

## 1. SQL Injection Prevention (PRISMA)
- **MANDATORY**: All raw SQL queries must be parameterized using Prisma's tagged-template literals:
  - Use `prisma.$queryRaw` or `prisma.$executeRaw` as tagged templates, e.g.:
    ```typescript
    prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${userId}`
    ```
- **STRICTLY BANNED**: Never use `$queryRawUnsafe` or `$executeRawUnsafe` or manual string concatenation for raw SQL queries.
  - Incorrect: `prisma.$queryRawUnsafe("SELECT * FROM \"User\" WHERE id = " + userId)` (DO NOT DO THIS).

## 2. Secrets & Environment Variables
- Ensure no credentials, API keys, or raw secrets are committed to the repository.
- Verify environment variables are validated at start using `backend/src/config/env.ts`.

## 3. Authentication & Authorization
- Every new endpoint must use the `authenticate` middleware if it requires authorization.
- Use `requirePermission(resource, action)` middleware to enforce Role-Based Access Control (RBAC).

## 4. XSS & HTML Sanitization
- In any place where user input is output directly as HTML, sanitize it using DOMPurify (for frontend rendering).
