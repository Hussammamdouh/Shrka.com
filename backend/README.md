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
- [Authentication Flow](#authentication-flow)
- [Testing](#testing)
- [Contribution](#contribution)

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
### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/verify-email` — Verify email with code
- `POST /api/auth/resend-verification` — Resend verification code
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh JWT token
- `POST /api/auth/logout` — Logout
- `POST /api/auth/forgot-password` — Request password reset code
- `POST /api/auth/verify-reset-code` — Verify password reset code
- `POST /api/auth/reset-password` — Reset password

### Sessions
- `GET /api/auth/sessions` — List active sessions
- `POST /api/auth/sessions/revoke` — Revoke a session

### Admin/IT Support
- `GET /api/auth/admin/users` — List all users
- `POST /api/auth/admin/users/:userId/block` — Block user
- `POST /api/auth/admin/users/:userId/unblock` — Unblock user

## Authentication Flow
1. **Register:** User registers and receives a verification code via email.
2. **Verify Email:** User verifies email with code.
3. **Login:** User logs in (must be verified).
4. **Refresh Token:** Use refresh token (httpOnly cookie) to get new access token.
5. **Forgot/Reset Password:** User requests reset code, verifies, and sets new password.
6. **Session Management:** User can view and revoke sessions.
7. **Admin/IT Support:** Can manage users (block/unblock/list).

## Testing
- Use the provided Postman collection (`ShrkaAuth.postman_collection.json`) to test all endpoints.
- Ensure your `.env` is configured for email sending to test verification and password reset.

## Contribution
- Fork the repo and create a feature branch.
- Follow the existing code style and structure.
- Write clear commit messages.
- Submit a pull request with a description of your changes.

---

**For questions or support, open an issue or contact the maintainer.** 