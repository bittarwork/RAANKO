# Security Architecture

Status: Confirmed principles. Auth implementation detail in `AUTHENTICATION_DESIGN.md`.

---

## Objectives

Protect tenant data, financial data, documents, and platform administration from unauthorized access, accidental leakage, and casual destruction.

---

## Trust Boundaries

- Public tracking
- Authenticated customer portal
- Authenticated company workspace
- RAANKO Super Admin
- Background workers
- External integrations, when added

Each boundary has different authorization policy.

---

## Required Controls

- Secure authentication
- Password hashing
- Session or token security
- Email verification and password reset
- 2FA
- RBAC and object-level authorization
- Server-side tenant resolution
- Rate limiting
- Input validation
- File validation
- Private file storage and authorized download
- Audit logging
- Login activity
- Tenant-aware cache and jobs
- Soft-delete / archive for protected financial records

---

## Explicit Threats to Design Against

- Changing resource IDs to access another tenant
- Sending another tenant's `tenant_id` in a request body
- Using subdomain as the only access check
- Public document URLs
- Cache keys without tenant context
- Background jobs that process IDs without ownership checks
- Customer portal leakage of buy price or margin
- Super Admin / support invisible data access
- Hard delete of invoices, payments, or audit logs

---

## Support Access

Unrestricted invisible support access is forbidden.

Future impersonation requires:

- Explicit permission
- Visible impersonation state
- Reason, start, end
- Full audit
- Immediate exit
- Possible prohibition of high-sensitivity actions

---

## Testing

Tenant isolation tests are mandatory.

---

## Auth Implementation (MVP)

See `AUTHENTICATION_DESIGN.md`.

- Built-in application auth with JWT access tokens and rotating refresh tokens (ADR-008)
- Separate auth surfaces: platform, company, portal
- Argon2id or bcrypt password hashing
- TOTP 2FA infrastructure in MVP; Super Admin enforcement recommended before production Beta

## Not Decided

- WAF / edge controls beyond Cloudflare defaults
- Encryption-at-rest provider details
- Key management service selection
