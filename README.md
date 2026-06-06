# WorkforceOS

WorkforceOS is a production-grade, modular workforce operating system designed to manage enterprise operations. Built on a monorepo architecture, the platform couples a Next.js frontend with a robust Node.js, Express, Prisma ORM, PostgreSQL, and Redis backend.

Architected and developed by Param Khodiyar.

---

## Architecture Overview

The system is designed with strict boundaries to ensure high scalability, maintenance ease, and security:
*   **Separation of Concerns**: Each module is self-contained with its own validation schema (Zod), router, controller, and service layers. Controllers process incoming requests and format outgoing API envelopes, while services handle transactional business logic and database queries.
*   **Database Isolation & Soft Deletes**: Intercepts queries programmatically to filter out soft-deleted records by default. Slow queries (exceeding 500ms) are logged dynamically.
*   **SQL Injection Prevention**: All raw database access is strictly parameterized using Prisma's tagged templates to enforce compile-time query safety.

---

## Core System Features

### 1. Scope-Aware Role-Based Access Control (RBAC)
A three-layer permission matrix that restricts user access based on organizational level (Organization, Department, Team).
*   **Templates and Overrides**: Supported through predefined role templates (including HR Manager, Finance Manager, Team Lead, and Intern).
*   **Bypass Rules**: System roles like SUPER_ADMIN and ORG_ADMIN bypass permission matrix lookups automatically in code. Other users' permissions are cached in Redis with a 300-second time-to-live (TTL) to limit database hits.

### 2. Super Admin Module Controls
*   Provides granular administrative control to enable or disable individual platform features (such as assets, knowledge base, performance, payroll) on a per-organization basis.
*   Enforced globally via custom Express middleware checking organization-level metadata on incoming requests.

### 3. Strict Payroll and Paystub Security
*   Implements strict boundary validation to prevent cross-tenant and cross-employee payroll leaks.
*   Standard employees are isolated and can retrieve only their own payroll records, while access for managers, finance, and human resources is confined strictly to their active organization ID.

### 4. Attendance Management with WFO and WFM Tracking
*   Enables employees to register check-in and check-out logs, request manual adjustments, and toggle breaks.
*   Supports work status options: Work From Office (WFO) and Work From Mobile (WFM).
*   Integrates geo-coordinate (GPS) and IP address logging for audit trails.

### 5. Intern Handling and Stipend Payroll
*   Introduces dedicated system roles and access rules for Interns.
*   Applies distinct payroll calculations: Intern compensation is computed as a flat stipend (expressed in Rupees) with allowances, HRA, PF, and tax deductions set to zero.

### 6. Tasks and State-Machine Workflow
*   Enforces state-machine transition validation for task progression (Draft, Assigned, Accepted, In Progress, Submitted, In Review, Changes Requested, Approved, Closed).
*   Allows comment threads with user mention parsing, task dependencies, labels, and file attachments.

### 7. Leave Management
*   Allocates leave balances per policy and tracks allocations, usage, pending approvals, and remaining days.
*   Provides multi-level approvals (Manager and HR approved) and calendar synchronization.

### 8. Expense Claims
*   Manages expense drafts, receipt uploads, submissions, and workflow states (Submitted, Manager Approved, Finance Approved, Paid, Rejected).

### 9. Asset Management
*   Tracks hardware and software inventory allocations, returns logs, assignment histories, and device damage statuses.

### 10. Knowledge Base
*   Provides draft creation, version control, change histories, and publishing rules for organizational documentation.

### 11. Notifications and Audit Logs
*   **Notifications**: Internal service to issue real-time and persisted database notifications triggered by workflow actions.
*   **Audit Trail**: Automatically records all write operations, tracking the actor, module, action type, changes (previous and updated values), IP address, and user agent.
