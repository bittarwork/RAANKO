# Multi-Tenancy

Status: Design accepted pending owner review of the Design gate.

See ADR-001, ADR-002, ADR-005, ADR-006, ADR-009, ADR-011.

---

## Model

- One platform
- One codebase
- One shared PostgreSQL schema for Beta
- Many independent shipping companies
- Isolated data, branding, users, permissions, and operational workflows
- Central RAANKO administration

A tenant is provisioned, not forked.

---

## Identity

- Immutable internal `tenant_id` using ULID (ADR-012)
- Unique URL-safe slug
- Slug rename does not change `tenant_id`
- Subdomain helps resolution: `{slug}.raanko.com`
- Custom domain is future
- Subdomain is never authorization

---

## Resolution and Context

Resolution hints:
- Request host / subdomain
- Authenticated membership
- API credentials in future phases

Trusted context for protected work:
- Current user
- Current tenant
- Current role
- Current permissions
- Current branch when applicable
- Subscription entitlements when applicable
- Write mode: full, read-only, or blocked

Never trust client-supplied `tenant_id` on normal tenant operations.

```text
Authenticated User
  -> Membership
  -> Server Tenant Context
  -> Entitlement and Write Mode
  -> Authorized Query / Command
```

---

## Physical Strategy

Beta uses shared PostgreSQL with explicit `tenant_id` on TENANT_SCOPED tables.

Defense in depth:
1. Authentication
2. Server tenant context
3. Application service filtering
4. Centralized repository / ORM scope
5. Authorization policies
6. Optional PostgreSQL RLS
7. Automated isolation tests

Schema-per-tenant and database-per-tenant are not selected for Beta.

---

## Data Classification

Classify every entity before schema design:
- GLOBAL
- TENANT_SCOPED
- PLATFORM

Do not put `tenant_id` on every table by default.

Relationships between tenant-scoped records must stay inside one tenant.

Initial classification lives in `DATABASE_DESIGN.md`.

---

## Provisioning

Super Admin creates a company. Platform provisioning should create:
- Tenant record and ULID
- Slug and subdomain
- Trial subscription and entitlements
- Default roles and permissions
- Company Owner invitation
- Default branch `Main Branch`
- Default numbering rules
- Default language, currency, timezone, and branding placeholders

Provisioning must be transaction-safe and idempotent where practical.

Beta company creation path: Super Admin only.

---

## Lifecycle

Company status and subscription status are related but distinct.

| State | Company Login | API | Company Write | Portal | Public Tracking |
|---|---|---|---|---|---|
| Trial (0–60 days) | Allowed | Allowed | Allowed | Full | Active |
| Trial expired / unpaid read-only | Allowed | Allowed | Read-only | Read-only | Active |
| Paid active | Allowed | Allowed | Allowed | Full | Active |
| Suspended | Blocked | Blocked | Blocked | Read-only | Active |
| Cancelled / archived | Policy-driven | Blocked | Blocked | Policy-driven | Policy-driven |

Permanent deletion is staged and privileged:
`suspend -> cancel -> archive -> retention -> privileged permanent delete`

---

## Write-Mode Enforcement

Read-only mode blocks create/update/delete on:
- Customers, suppliers, rates
- RFQ, quotes, bookings, shipments
- Documents upload and generated document triggers
- Invoices, payments, expenses, imports

Read-only mode still allows:
- Viewing dashboards, records, documents, and reports according to permissions
- Public tracking visibility

Implementation must centralize write-mode checks alongside permissions.

---

## Cross-Cutting Enforcement

Tenant context must be present in:
- Queries
- Reports
- Search
- Cache keys
- Background jobs
- File storage metadata and paths
- Audit logs

Knowing a file path or public identifier alone is not sufficient to download protected data.

---

## Support Access

Support Agent capabilities in Beta:
- Manage RAANKO support tickets
- View tenant metadata read-only
- No unrestricted operational data browsing
- No impersonation

Impersonation remains a future explicit administrative feature with full audit.

---

## Cache and Jobs

- Cache keys that store tenant-owned data must include tenant context
- Jobs carry trusted tenant context in payload
- Workers revalidate ownership before mutation

---

## Tests

Isolation tests are mandatory security tests.

Minimum scenarios:
- Tenant A user cannot read, update, delete, export, or download Tenant B resources by ID guessing
- Client-supplied `tenant_id` is ignored for authorization
- Portal user sees only allowed customer records
- Public tracking never exposes financial or internal fields
- Read-only tenant cannot mutate protected resources
