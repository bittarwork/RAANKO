# Security Rules

These rules are mandatory. They are a security boundary, not optional cleanup.

---

## 1. Tenant Isolation

- Tenant isolation is a security boundary.
- It must be enforced in the backend.
- Frontend filtering is not sufficient.
- Subdomain alone is never authorization.
- Client-supplied `tenant_id` is never proof of ownership for normal tenant operations.
- Guessing or changing a resource ID must not expose another tenant's data.
- Related tenant-scoped records must belong to the same tenant.

---

## 2. Authentication and Sessions

- Use secure authentication.
- Hash passwords with a modern algorithm.
- Protect sessions and tokens.
- If JWT is used, use access and refresh token handling appropriate to the chosen design.
- Support password reset and email verification.
- 2FA is required in the platform capability set.
- Login activity must be recordable.

---

## 3. Authorization

- Check permissions on every protected operation.
- Use object-level authorization, not only route-level checks.
- Financial permissions are separate from operational permissions.
- Employees must not see modules they cannot access.
- Customers must not see buy prices, profit margin, internal notes, or internal documents.
- Public tracking must not expose sensitive or financial data.
- Super Admin and Company Admin are different administration layers.

---

## 4. Files and Documents

- Do not use permanent public URLs for operational documents.
- Prefer private storage and short-lived signed URLs.
- Authorization is required before download.
- Knowing a file path is not sufficient to download it.
- Associate files with tenant ownership.

---

## 5. Audit

- Record sensitive create, update, delete, permission, financial, and status-change actions.
- Tenant-owned audit logs must include tenant, user, action, entity, and timestamp.
- Audit logs must not be easy to delete.
- Support impersonation, if implemented later, must be explicit, visible, time-bounded, and fully logged.

---

## 6. Validation and Abuse Protection

- Validate and sanitize inputs.
- Validate uploaded files.
- Apply rate limiting.
- Protect authentication endpoints against abuse.

---

## 7. Tenant-Aware Infrastructure

- Cache keys that store tenant data must include tenant context.
- Background jobs must carry trusted tenant context and verify ownership before processing.
- Search and reports inside a company workspace are tenant-scoped.
- Super Admin search and reports use different authorization policies.

---

## 8. Data Retention

- Do not hard-delete protected financial records casually.
- Suspension and cancellation preserve data.
- Permanent tenant deletion is a privileged, delayed, high-risk operation.

---

## 9. Logging Hygiene

- No secrets in logs.
- No raw tokens in logs.
- No unnecessary financial or personal payloads in logs.

---

## 10. Mandatory Tests

Automated tests must verify that one tenant cannot read, update, delete, export, or download another tenant's resources.

These are mandatory security tests.
