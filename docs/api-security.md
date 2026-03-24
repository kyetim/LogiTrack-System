# LogiTrack — API & Security

## Authentication

All API endpoints are protected with **JWT (JSON Web Token)** using an Access + Refresh Token architecture.

| Token | Expiry | Purpose |
|---|---|---|
| Access Token | 15 minutes | API request authentication |
| Refresh Token | 7 days | Silent token renewal |

Refresh tokens are stored hashed in the database (`refresh_tokens` table) and are rotated on each use.

---

## Authorization — Role-Based Access Control (RBAC)

| Role | Access Level |
|---|---|
| `ADMIN` | Full system access |
| `DISPATCHER` | Shipment management, driver assignment |
| `DRIVER` | Own shipments, own profile, support tickets |
| `COMPANY_OWNER` | Company data, invoices, reports |
| `COMPANY_MANAGER` | Company data, read-only reports |

**Key rule:** Drivers can only access shipments assigned to them. This is enforced at the service layer, not just at the route guard level.

---

## Input Validation

All incoming data is validated server-side using `class-validator` + `class-transformer` via NestJS pipes:

- DTOs enforce type safety and field constraints
- `sanitize-html` is applied to user-generated text fields
- File uploads are validated for MIME type and size before processing

---

## Infrastructure Security

| Measure | Implementation |
|---|---|
| Rate limiting | NestJS Throttler (configurable per route) |
| HTTP headers | Helmet middleware |
| CORS | Whitelist-based allowed origins |
| Password hashing | bcrypt (salt rounds: 10) |
| Cookie security | `httpOnly`, `secure`, `sameSite` flags |

---

## Audit Logging

Every significant action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT) is recorded in the `audit_logs` table with:

- `userId` — who performed the action
- `entityType` + `entityId` — what was affected
- `oldValues` / `newValues` — what changed (JSON diff)
- `ipAddress` + `userAgent` — request context
- `createdAt` — timestamp

This provides a complete, tamper-evident trail of all system activity.
