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
- **Subscription enforcement and join request flow**
- **Fine-grained permission checks and role hierarchy**

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

### **TODO: Leads, Products, Forms, Analytics**
- Endpoints for these modules will be added in future phases.

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
6. **Session Management:** User can view and revoke sessions.
7. **Admin/IT Support:** Can manage users (block/unblock/list).

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

---

**For questions or support, open an issue or contact the maintainer.** 