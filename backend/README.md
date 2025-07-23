# Shrka.com Backend

A scalable, secure, multi-tenant Sales Tracking Platform backend built with Node.js, Express.js, and MongoDB.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [API Response Format](#api-response-format)
- [Authentication Flow](#authentication-flow)
- [Pagination & Filtering](#pagination--filtering)
- [Subscription & Role Hierarchy (Phase 3)](#subscription--role-hierarchy-phase-3)
- [Sales Funnel, Forms, Leads, Analytics (Phase 4)](#sales-funnel-forms-leads-analytics-phase-4)
- [Testing](#testing)
- [Contribution](#contribution)
- [Environment-Specific Config & Production Readiness](#environment-specific-config--production-readiness)

---

## Overview
Shrka.com is a multi-tenant sales tracking platform that allows any sales company to join, create a workspace, invite a sales team, manage leads, and customize sales workflows. This backend provides robust authentication, user management, and is ready for company, lead, and analytics modules.

## Features
- Modular, scalable, and secure codebase
- Multi-role, multi-company user structure
- JWT authentication (access & refresh tokens)
- Email verification and password reset via email (Nodemailer)
- Rate limiting, input validation, and error handling
- Account lockout and session management
- Admin/IT support user management
- Audit logging for security events
- Production-ready logging (Winston)
- Consistent API response format and error codes
- Pagination and filtering for list endpoints
- Subscription enforcement and join request flow
- Fine-grained permission checks and role hierarchy
- **Sales funnel configuration per company**
- **Dynamic forms and form submissions**
- **Lead management with assignment, transfer, and stage progression**
- **Analytics stubs for admin**

## Tech Stack
- Node.js, Express.js
- MongoDB, Mongoose
- JWT, bcryptjs
- Nodemailer
- Joi (validation)
- Winston (logging)
- Morgan (HTTP logging)

## Folder Structure
```
backend/
  config/           # DB, env, JWT config
  controllers/      # Route controllers
  middlewares/      # Express middlewares
  models/           # Mongoose models
  routes/           # API routes
  services/         # (Optional) business logic
  utils/            # Helpers (logger, mailer, tokens, etc.)
  validators/       # Joi schemas
  tests/            # Jest test files
  app.js            # Express app
  server.js         # Entry point
  README.md         # This file
```

## Setup & Installation
1. **Clone the repo:**
   ```sh
   git clone <repo-url>
   cd Shrka.com/backend
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your values (see below).

## Environment Variables
Create a `.env` file in the backend directory with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/shrka
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=465
EMAIL_USER=your@email.com
EMAIL_PASS=your_email_password
EMAIL_FROM="Shrka.com <your@email.com>"
```

## Running the Server
- **Development:**
  ```sh
  npm run dev
  ```
- **Production:**
  ```sh
  npm start
  ```

## API Endpoints

### **Authentication & User**
- `POST /api/auth/register` — Register new user
- `POST /api/auth/verify-email` — Verify email with code
- `POST /api/auth/resend-verification` — Resend verification code
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh JWT token
- `POST /api/auth/logout` — Logout
- `POST /api/auth/forgot-password` — Request password reset code
- `POST /api/auth/verify-reset-code` — Verify password reset code
- `POST /api/auth/reset-password` — Reset password
- `GET /api/user/profile` — Get user profile
- `PUT /api/user/profile` — Update user profile
- `PUT /api/user/profile/password` — Change password
- `PUT /api/user/profile/avatar` — Update avatar

### **Company Management**
- `POST /api/company` — Create new company
- `GET /api/company/my` — List companies for user (supports `?page`, `?limit`, `?search`)
- `POST /api/company/:companyId/invite` — Invite user by email or ID
- `POST /api/company/:companyId/assign-role` — Assign role to user in company
- `POST /api/company/:companyId/remove-user` — Remove user from company
- `PUT /api/company/:companyId/settings` — Update company settings
- `PUT /api/company/:companyId` — Update company
- `DELETE /api/company/:companyId` — Delete company
- `GET /api/company/:companyId/users` — List users in a company (paginated)
- `GET /api/company/:companyId/invites` — List join requests/invites for a company (paginated)
- `PUT /api/company/:companyId/users/:userId/permissions` — Update user permissions in company
- **Update Company Settings:** Superadmin/Admin can update company settings (logo, address, settings, metadata) via `PUT /api/company/:companyId/settings`.
- **Deactivate Company:** Superadmin can deactivate a company (soft delete) via `POST /api/company/:companyId/deactivate`. Reactivate via `POST /api/company/:companyId/reactivate`.
- **Delete Company:** Only deactivated companies can be hard-deleted via `DELETE /api/company/:companyId` (after retention period if enforced).

### **Sales Funnel**
- `POST /api/funnel` — Create or update sales funnel (Superadmin/Admin)
- `GET /api/funnel/:companyId` — Get funnel stages for a company
- **Funnel Analytics:** Get conversion rates and bottlenecks for a company's funnel via `GET /api/funnel/analytics?companyId=...`.

### **Dynamic Forms**
- `POST /api/form` — Create or update a form (Admin+)
- `GET /api/form/:companyId` — List forms for a company
- `POST /api/form/:formId/submit` — Submit a form (Salesman/Supervisor)
- `GET /api/form/submissions/lead/:leadId` — Get form submissions by lead
- `GET /api/form/submissions/user/:userId` — Get form submissions by user
- **Form Builder Enhancements:** Supports text, number, email, phone, dropdown, checkbox, radio, textarea, date, file, section fields. Conditional logic and validation rules supported.
- **Form Versioning:** Updating a form's fields or stage creates a new version. Old submissions are retained and linked to the correct version.

### **Lead Management**
- `POST /api/lead` — Create a lead
- `PUT /api/lead/:leadId/assign` — Assign or transfer a lead
- `PUT /api/lead/:leadId/stage` — Move lead to next funnel stage
- `GET /api/lead` — List/filter leads (by stage, date, user)
- `GET /api/lead/:leadId` — Get lead details
- **Lead Activity Timeline:** All actions/events on a lead are tracked in `activityTimeline` (created, assigned, stage changed, notes, attachments, etc.).
- **Add Note:** `POST /api/lead/:leadId/notes` — Add a note to a lead
- **Add Attachment:** `POST /api/lead/:leadId/attachments` — Add an attachment to a lead (multipart/form-data, field: file, uploads to Cloudinary)
- **Import Leads:** `POST /api/lead/import` (CSV upload, field: file)
- **Export Leads:** `GET /api/lead/export` (CSV download, filterable by companyId)
- **Lead Assignment Rules:** If assignedTo is not provided, leads are auto-assigned to Salesmen in round-robin order.

### **Analytics (Stub)**
- `GET /api/analytics/leads-by-stage` — Leads by stage (stub)
- `GET /api/analytics/form-submissions` — Form submissions (stub)
- `GET /api/analytics/assigned-leads` — Assigned leads (stub)

### **Join Requests**
- `POST /api/join-request` — Submit join request to a company
- `GET /api/join-request/my` — List my join requests
- `POST /api/company/:companyId/join-request/:requestId/approve` — Approve join request
- `POST /api/company/:companyId/join-request/:requestId/reject` — Reject join request

### **Subscription**
- `POST /api/subscription/start` — Start a new subscription (Superadmin only)
- `GET /api/subscription/status/:companyId` — Get subscription status
- `GET /api/subscription` — List all subscriptions (Superadmin, paginated)

### **Session Management**
- `GET /api/auth/sessions` — List active sessions
- `POST /api/auth/sessions/revoke` — Revoke a session

### **Admin/IT Support**
- `GET /api/auth/admin/users` — List all users
- `POST /api/auth/admin/users/:userId/block` — Block user
- `POST /api/auth/admin/users/:userId/unblock` — Unblock user
- **Audit Log Viewing:** IT support/admins can list/search/filter/paginate audit logs via `GET /api/analytics/audit-logs` with query params: page, limit, action, actorId, companyId, targetId, from, to.

## API Response Format
All API responses follow a consistent structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Descriptive message"
}
```

**Error:**
```json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "errorCode": "ERROR_CODE"
}
```
- `errorCode` is a string for frontend error handling (e.g., `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `ACCOUNT_BLOCKED`).

## Authentication Flow
1. **Register:** User registers and receives a verification code via email.
2. **Verify Email:** User verifies email with code.
3. **Login:** User logs in (must be verified).
4. **Refresh Token:** Use refresh token (httpOnly cookie) to get new access token.
5. **Forgot/Reset Password:** User requests reset code, verifies, and sets new password.
6. **Session Management:** User can view and revoke sessions (by sessionId). Device info (IP, user agent) is stored. All session events are audit logged.
7. **Admin/IT Support:** Can manage users (block/unblock/list).

## Authentication & Security
- **Password Policy:** Passwords must be at least 8 characters, include uppercase, lowercase, number, and special character. Cannot reuse last 5 passwords.
- **Account Lockout:** 5 failed login attempts will lock the account for 15 minutes. IT support/admins can unlock accounts via `/api/auth/admin/users/:userId/unlock`.
- **Session Management:** Users can list and revoke sessions (by sessionId). Device info (IP, user agent) is stored. All session events are audit logged.
- **Email Verification:** Users must verify email before login.
- **HTTPS Enforcement:** In production, all requests are redirected to HTTPS. Make sure your reverse proxy (e.g., Nginx) sets the `x-forwarded-proto` header.
- **Secure Cookies:** All authentication cookies are set with `Secure` and `HttpOnly` flags in production.

## Admin/IT User Management
- **Block/Unblock/Unlock Users:** IT support can block, unblock, and unlock user accounts.
- **Password Reset:** IT support can reset user passwords (coming soon).
- **Update User Permissions:** Superadmin/Admin can update a user's permissions in a company via `PUT /api/company/:companyId/users/:userId/permissions` with `{ permissions: [...] }`.

## Pagination & Filtering
- List endpoints (e.g., `/api/company/my`, `/api/company/:companyId/users`) support `?page`, `?limit`, and `?search` query parameters.
- Example: `GET /api/company/my?page=2&limit=5&search=Acme`

## Subscription & Role Hierarchy (Phase 3)

### Subscription System
- Companies must have an active subscription to access core features.
- Only Superadmins can start or manage subscriptions.
- Endpoints:
  - `POST /api/subscription/start` — Start a new subscription (Superadmin only)
  - `GET /api/subscription/status/:companyId` — Get subscription status
  - `GET /api/subscription` — List all subscriptions (Superadmin, paginated)
- Middleware: `checkCompanySubscription(companyId)` blocks actions if subscription is inactive.

### Role & Permission Hierarchy
- Roles: Superadmin, Admin, Sales Manager, Supervisor, Salesman
- Each role has a `level` (1–5) and optional `permissions` overrides.
- Only Superadmin can assign Admin; only Admin can assign Sales Manager/Supervisor.
- Middleware:
  - `checkCompanyRole(companyId, role)` — Checks user role in company
  - `checkRoleLevel(companyId, role, minLevel)` — Checks user role and minimum level
  - `checkPermission(companyId, permission)` — Checks if user has a specific permission in company
- All role/permission logic uses enums/constants from `constants/roles.js`.

## Sales Funnel, Forms, Leads, Analytics (Phase 4)

### Sales Funnel
- Each company defines its own sales pipeline stages.
- Only Superadmin/Admin can create/update funnel.
- Duplicate stage names are prevented.
- Indexed by companyId for performance.

### Dynamic Forms
- Companies can create custom forms for lead workflows.
- Fields: text, dropdown, checkbox, textarea, date.
- Forms can be linked to funnel stages.
- Salesmen/Supervisors submit forms per lead/stage.
- Submissions are linked to leads and users.
- Indexed by companyId, leadId, userId.

### Lead Management Enhancements
- Leads have status, currentStage, assignment, transfer history, and form submissions.
- Leads can be assigned/transferred, moved through stages, and filtered.
- Indexed by companyId, assignedTo, currentStage.
- **Lead Activity Timeline:** All actions/events on a lead are tracked in `activityTimeline` (created, assigned, stage changed, notes, attachments, etc.).
- **Add Note:** `POST /api/lead/:leadId/notes` — Add a note to a lead
- **Add Attachment:** `POST /api/lead/:leadId/attachments` — Add an attachment to a lead

### Role-Level Permissions Enhancement
- `canPerformAction(userId, companyId, actionType, leadStage?)` helper for advanced permission checks.
- `checkPermission` middleware supports stage-specific and form-specific permissions.

### Analytics (Stub)
- Admin endpoints for leads by stage, form submissions, assigned leads (stubbed for now).

## Phase 5: Product Catalog, Quotations, Analytics, Exports, Automation

### Product Catalog
- **Model:** Product (company-scoped)
- **Endpoints:**
  - `GET /api/product` — List products (company)
  - `GET /api/product/:productId` — Get product details
  - `POST /api/product` — Create product (Admin/Superadmin)
  - `PUT /api/product/:productId` — Update product (Admin/Superadmin)
  - `DELETE /api/product/:productId` — Delete product (Admin/Superadmin)
- **Features:** CRUD, validation, indexing, RBAC

### Quotation Management
- **Model:** Quotation (company, lead, products, status)
- **Endpoints:**
  - `GET /api/quotation` — List quotations (company/lead)
  - `GET /api/quotation/:quotationId` — Get quotation details
  - `POST /api/quotation` — Create quotation (Admin/Supervisor)
  - `PATCH /api/quotation/:quotationId/status` — Approve/Reject (Admin/Supervisor)
  - `GET /api/quotation/export/csv` — Export quotations as CSV
- **Features:** Auto-calculate totals, approval, audit log, export

### Analytics
- **Endpoint:**
  - `GET /api/analytics/:companyId` — Admin analytics (leads by stage, quotations, form submissions, conversion rates, date filtering)
- **Features:** MongoDB aggregation, date filtering, RBAC

### Export Endpoints
- **Endpoints:**
  - `GET /api/lead/export/csv` — Export leads as CSV
  - `GET /api/quotation/export/csv` — Export quotations as CSV
  - `GET /api/form/export/csv` — Export form submissions as CSV
- **Features:** CSV export, RBAC, company scoping

### Scheduled Subscription Expiry
- **Feature:** Daily CRON job sets expired subscriptions, logs to audit

### Notification Stubs
- **Feature:** Hooks for email/WhatsApp notifications on quotation status, subscription expiry, lead assignment (see `email.service.js`)

---

**For questions or support, open an issue or contact the maintainer.** 

### Endpoint Summary Table
| Feature            | Endpoint(s)                                                                                 |
|--------------------|-------------------------------------------------------------------------------------------|
| Auth               | /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/refresh, ...              |
| User Profile       | /api/user/profile, /api/user/profile/password, /api/user/profile/avatar                    |
| Company Mgmt       | /api/company, /api/company/:companyId/settings, /api/company/:companyId/deactivate, ...    |
| Roles/Permissions  | /api/company/:companyId/users/:userId/permissions, /api/auth/admin/users/:userId/unlock    |
| Funnel             | /api/funnel, /api/funnel/:companyId, /api/funnel/analytics                                 |
| Forms              | /api/form, /api/form/:companyId, /api/form/:formId/submit, ...                             |
| Leads              | /api/lead, /api/lead/:leadId, /api/lead/import, /api/lead/export, /api/lead/:leadId/notes, /api/lead/:leadId/attachments |
| Analytics          | /api/analytics/audit-logs, /api/analytics/leads-by-stage, ...                              | 
| Product Catalog    | /api/product, /api/product/:productId                                                      |
| Quotations         | /api/quotation, /api/quotation/:quotationId, /api/quotation/export/csv                     |
| Analytics         | /api/analytics/:companyId                                                                   |
| Exports           | /api/lead/export/csv, /api/quotation/export/csv, /api/form/export/csv                       | 