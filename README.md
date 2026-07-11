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

### 12. Integrated Org Calendar
*   **Cross-Module Aggregation**: Shared team calendar aggregating employee leaves, scheduled shift timings, task deadlines, and company events.
*   **Real-Time Sync**: Keeps the whole organization synchronized in one place with direct updates from leave approvals, task schedules, and shift changes.

---

## Recent Updates & Enhancements

The platform has been updated with the following features:

### 💼 HR-Approved Profile Change Request Pipeline (Compliance & Security)
- **Controlled Personal Edits**: Non-admin employees can edit only personal/contact fields. They are blocked from editing job-related fields (salary, designation, role).
- **Approval Pipeline**: Edits submit a change request showing side-by-side comparisons of requested changes in the database. Changes are only committed once an HR Manager or Admin approves them.
- **Data Privacy & Erasure (DPDP/GDPR Compliance)**: Implemented PII scrubbing upon employee deletion. Bank details and emergency rows are fully deleted, and personal email, phone, and address are nullified. The unique email key is safely replaced with a masked key (`deleted-${id}@workforceos.com`) to preserve database audit records.
- **Production Encryption Key Safeguard**: Enforced zod validation that blocks backend server startup if the default development secret is used in a production environment.

### 🔔 Reactive Red Dot Indicators & Layout Refactoring
- **Real-Time Indicators**: Added reactive red dot indicators to the **Settings** sidebar and mobile navigation tiles that light up when unread profile requests exist. These automatically disappear globally once the requests are approved or rejected.
- **Sidebar Code Cleanup**: Refactored the `SideNavBar` components to group hooks at the top and cleanly enforce early exit guards.
- **Enhanced Profile Discoverability**: Added a permanent **My Profile** button in the sidebar and user avatar header links for intuitive profile editing.

### 🌐 Mobile WebView Geolocation & Android Build Optimizations
- **WebView Geolocation Bridge**: Configured the Android WebView (`AndroidWebViewController`) platform callbacks using `setGeolocationPermissionsPromptCallbacks` with `onShowPrompt`. Geolocation calls are now seamlessly bridged to the native Android OS permission dialogs.
- **iOS Plist Permissions**: Declared `NSLocationWhenInUseUsageDescription` in iOS `Info.plist` to prevent Apple devices from blocking GPS coordinates and avoid runtime crashes.
- **Gradle Warning Suppressions**: Suppressed obsolete Java version compiler warnings caused by legacy third-party plugins in the mobile Gradle build.
- **Mobile UI Layout Fixes**: Optimized error banner alert containers to enforce vertical text wrapping and separate the "Dismiss" trigger to prevent overlaps on mobile screens.

### 🏢 Onboarding Logo Upload & Organization Customization
- **Logo Upload Support**: Added a logo image uploader in Step 1 of the onboarding wizard, generating a base64 Data URL to dynamically display and save client organization logos.
- **Multi-Brand Badging**: Rebuilt the desktop sidebar and mobile headers to dynamically display the current organization's logo and name, while retaining the WorkforceOS product identity via a small sub-badge.
