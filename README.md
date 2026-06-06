# WorkforceOS

WorkforceOS is a production-grade, modular workforce operating system designed for managing modern organizations. It features a complete monorepo layout containing a Next.js frontend and a Node.js + Express + Prisma + PostgreSQL + Redis backend.

## Project Structure

*   `backend/`: Express-based REST API built with TypeScript, Prisma ORM, PostgreSQL database, and Redis cache.
*   `frontend/`: Next.js web application.

---

## Key Features

1.  **Modular Abstraction Layer**: Built around 11 business modules with complete separation of concerns (Routers, Controllers, Services, and Validations).
    *   *Audit Logs*: Auto-logs all write actions with IP and agent details.
    *   *Notifications*: Scoped alerts for tasks, leaves, and approvals.
    *   *Auth*: Secure login, logout, password updates, and token rotation.
    *   *Organization*: Multi-tenant organization settings.
    *   *Employees*: Profile management, employee sequential IDs, and S3 document uploads.
    *   *Attendance*: Clock-in, clock-out, break start/end, and monthly aggregates. Supports WFO (Work From Office) and WFM (Work From Mobile) tracking.
    *   *Leave*: Balance allocation, application submission, approvals, and carry-forwards.
    *   *Tasks*: State-machine tracking, comment mentions, assignee binding, and attachments.
    *   *Performance*: Review score compiling, task completion metrics, and organization leaderboards.
    *   *Payroll*: Custom salary bands, HRA/PF/Tax computations, monthly payslips, and stipend calculations for Interns (INR / Rupees).
    *   *Expenses*: Claim submissions, receipt attachments, manager/finance approvals, and payouts.
    *   *Assets*: Inventory check-outs, returns logs, and assignment history.
    *   *Knowledge Base*: Version-controlled article publishing and drafting.
2.  **3-Layer Scope-Aware RBAC Matrix**:
    *   Permissions are scoped at `ORG`, `DEPARTMENT`, or `TEAM` boundaries.
    *   Default templates: `SUPER_ADMIN`, `ORG_ADMIN`, `HR_MANAGER`, `FINANCE_MANAGER`, `DEPARTMENT_HEAD`, `TEAM_MANAGER`, `EMPLOYEE`, `AUDITOR`, and `INTERN`.
3.  **Super Admin Module Controls**:
    *   System features can be toggled on/off dynamically for any organization via `PATCH /api/v1/organization/:orgId/features`.
4.  **SQL Injection Protection**:
    *   All raw database queries are fully parameterized via Prisma's `$queryRaw` tagged templates.
5.  **Strict Confidentiality**:
    *   Standard employees are strictly locked out of viewing other users' payroll records or paystubs.

---

## Environment Configuration

Create a `.env` file in the `backend/` directory based on `backend/.env.example`:

```env
DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<db>?sslmode=require"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
PORT=4000
NODE_ENV="development"
AWS_BUCKET="your-s3-bucket"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
S3_BASE_URL="https://your-s3-bucket.s3.amazonaws.com"
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
```

---

## Getting Started

### 1. Database Setup (Backend)
Navigate to the backend directory, install packages, and synchronize your database:
```bash
cd backend
npm install
npx prisma db push --force-reset
npx prisma db seed
```

### 2. Run the Backend API
Start the server in development mode:
```bash
npm run dev
```
The server will start on port `4000` (or the configured `PORT`) and connect to Redis.

### 3. Run the Frontend App
Navigate to the frontend directory, install dependencies, and start Next.js:
```bash
cd ../frontend
npm install
npm run dev
```
The frontend application will boot on port `3000`.
