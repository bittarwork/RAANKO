# Multi-Tenancy

This file records confirmed multi-tenancy principles. It does not select a database engine or physical tenancy strategy.

See `PROJECT_CONTEXT.md` sections 81–122 and ADR-001, ADR-002, ADR-005, ADR-006.

---

## Model

- One platform
- One codebase
- Many independent shipping companies
- Isolated data, branding, users, permissions, and operational workflows
- Central RAANKO administration

A tenant is provisioned, not forked.

---

## Identity

- Immutable internal `tenant_id`
- Unique URL-safe slug
- Slug rename does not change `tenant_id`
- Subdomain helps resolution
- Custom domain is future
- Subdomain is never authorization

---

## Resolution and Context

Trusted context for protected work:

- Current user
- Current tenant
- Current role
- Current permissions
- Current branch when applicable
- Subscription entitlements when applicable

Tenant is derived from authentication and membership, plus host/domain as a hint.

Never trust client-supplied `tenant_id` on normal tenant operations.

---

## Data Classification

Classify every entity before schema design:

- GLOBAL
- TENANT_SCOPED

Do not put `tenant_id` on every table by default.

Relationships between tenant-scoped records must stay inside one tenant.

---

## Isolation Layers

Required:

1. Authentication
2. Server tenant context
3. Application/service filtering
4. Centralized data-access tenant scope
5. Authorization policies
6. Automated isolation tests

Recommended when the selected database supports it:

- Database row-level security

---

## Provisioning

Super Admin creates a company and the platform provisions identity, owner invitation, default roles, settings, entitlements, numbering, subdomain, and default branch when required.

Provisioning should be automated, transaction-safe, and idempotent where practical.

---

## Lifecycle

Company status and subscription status are distinct.

Suspension preserves data and blocks company login and API access.

Customer portal and public tracking behavior during suspension is an open question.

Deletion is staged: suspend → cancel → archive → retention → privileged permanent delete.

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

Knowing a file path is not sufficient to download it.

---

## Support Access

Support staff do not have invisible unrestricted access.

Impersonation is a future administrative feature and must be explicit, visible, time-bounded, and fully logged.

---

## Tests

Isolation tests are mandatory security tests.
