# Authentication and Authorization Design

Status: Design accepted for MVP.

Scope: MVP platform foundation. Implementation blocked until Design gate approval.

See ADR-005, ADR-008, ADR-011, `MULTI_TENANCY.md`, `PERMISSIONS_MODEL.md`, `SECURITY_ARCHITECTURE.md`.

---

## Goals

- Secure sign-in for platform admins, company employees, and customer portal users
- Trusted server-side tenant context on every protected request
- Separation of authentication (who), tenant context (where), entitlements (what the company may use), and permissions (what the user may do)
- Data model ready for multi-tenant membership without requiring MVP UI for tenant switching

---

## Auth Surfaces

| Surface | Host / Route | Actor | Identity Store |
|---|---|---|---|
| Super Admin | `admin.raanko.com` or protected `(platform)` route group | Platform user with `PlatformRole` | Global `User` + platform role |
| Company Workspace | `{slug}.raanko.com` / `(company)` | Employee with tenant `Membership` | Global `User` + `Membership` |
| Customer Portal | `{slug}.raanko.com` / `(portal)` | Customer portal user | Global `User` + portal account linked to `Customer` |
| Public Tracking | `{slug}.raanko.com` / `(public)/track` | Guest | None |
| Background Workers | Internal only | Worker process | Internal service credential |

Each surface uses separate auth guards and token/session namespaces. A company employee token must not authorize Super Admin routes, and vice versa.

---

## Identity Model

### Global User

One email/password identity per person across the platform.

- Email is globally unique
- Password stored with a strong adaptive hash (Argon2id preferred; bcrypt acceptable for MVP)
- Email verification required before first protected write in production Beta
- Account lockout after repeated failed login attempts
- Optional 2FA (TOTP) for company and portal users in MVP
- **Required 2FA for Super Admin** before production Beta (Confirmed Requirement)

### Platform Access

| PlatformRole | Purpose |
|---|---|
| `super_admin` | Full platform administration |
| `support_agent` | Limited platform support; no unrestricted invisible access |

Platform roles are not tenant memberships. A user may hold a platform role and one or more tenant memberships.

### Tenant Membership

Links `User` to `Tenant` with:

- `role_id` — tenant role (preset or custom)
- `status` — invited, active, suspended, removed
- `default_branch_id` — optional default branch for branch-scoped users
- `invited_at`, `accepted_at`, `last_active_at`

One user may have multiple memberships across tenants. MVP exposes **one active tenant per session** (OQ-008 open; see Assumption below).

### Customer Portal Account

Links `User` to one `Customer` record inside one tenant.

- Portal user sees only records allowed for that customer account
- Portal auth is scoped to the tenant resolved from subdomain **and** the portal account's tenant/customer binding
- A portal user must not access company employee APIs

---

## Session and Token Strategy

Built-in application auth (ADR-008). No external auth provider in MVP.

### Company and Platform Web (Next.js + NestJS)

| Token | Format | Lifetime | Storage | Purpose |
|---|---|---|---|---|
| Access token | Signed JWT | 15 minutes | Memory on client; sent as `Authorization: Bearer` | API authorization |
| Refresh token | Opaque random token | 30 days sliding | `httpOnly`, `Secure`, `SameSite=Lax` cookie | Rotate access token |
| CSRF token | Double-submit or same-site cookie pattern | Session-bound | Cookie + header for mutating browser requests | Protect cookie-backed refresh |

Refresh tokens are stored **hashed** in the database with:

- `user_id`
- `auth_surface` — `platform`, `company`, `portal`
- `tenant_id` — required for company and portal surfaces
- `membership_id` or `portal_account_id`
- `session_id`
- `expires_at`, `revoked_at`, `rotated_from_id`
- device metadata: IP, user agent fingerprint hash, created location hint

On refresh, issue a new refresh token and revoke the previous one (rotation). Reuse of a revoked refresh token revokes the whole session family.

### Session Record

Each login creates a `Session` row for audit and device management:

- `id`, `user_id`, `auth_surface`, `tenant_id` when applicable
- `created_at`, `last_seen_at`, `expires_at`, `revoked_at`
- IP, user agent, device label when available
- `revoked_reason` — logout, password change, admin revoke, suspicious reuse

Future: user-visible active session list and remote revoke. MVP stores the data; UI can be minimal.

### Public Tracking

No session. Read-only endpoints with strict field allowlists and rate limiting.

---

## Login Flows

### Company Employee Login

```text
POST /api/v1/auth/company/login
  body: email, password, optional tenant_slug hint from host

1. Resolve tenant slug from Host header (hint only)
2. Validate email/password for global User
3. Find active Membership for User + Tenant
4. Reject if tenant lifecycle blocks login (suspended company)
5. Load role permissions and subscription write mode
6. Create Session + refresh cookie + access token
7. Return user profile, tenant branding summary, permissions snapshot, entitlements snapshot
```

If host subdomain and membership tenant slug mismatch → reject with generic auth failure (do not reveal whether the user exists in another tenant).

MVP: no tenant picker after login. User must use the correct company subdomain.

### Platform Admin Login

```text
POST /api/v1/auth/platform/login

1. Validate email/password
2. Verify PlatformRole present and active
3. Create platform-scoped Session (no tenant_id on token)
4. Return platform permissions snapshot
```

Platform routes never resolve tenant from subdomain alone.

### Customer Portal Login

```text
POST /api/v1/auth/portal/login

1. Resolve tenant from Host
2. Validate email/password
3. Verify portal account for tenant + customer binding
4. Enforce portal read-only mode when tenant write mode is read-only (ADR-011)
5. Create portal-scoped Session tied to portal account
```

Portal registration in MVP: invitation or account creation by company user, not open self-signup (aligned with Super Admin-only company provisioning).

### Password Reset and Email Verification

- Password reset: time-limited single-use token sent by email; invalidate other reset tokens on success; revoke all refresh sessions on password change
- Email verification: required before sensitive actions in production Beta
- Invitation accept: membership invite token → set password → verify email if needed → activate membership

---

## Request Authorization Pipeline

Every protected HTTP request passes through guards in this order:

```text
1. Transport security (HTTPS, secure cookies)
2. Authentication — validate access token or refresh flow
3. Auth surface guard — platform vs company vs portal namespace
4. Tenant resolution
     - Company/Portal: Host subdomain hint + membership/account tenant must match
     - Platform: explicit tenant_id only on cross-tenant admin endpoints, never from client body alone
5. Membership / portal account status check
6. Tenant lifecycle and write mode (ADR-011)
     - full write, read-only, login blocked
7. Entitlement check — feature enabled for tenant
8. Permission check — action allowed for user's role
9. Branch scope filter when applicable
10. Object-level authorization — resource belongs to tenant (and branch/customer scope)
11. Handler execution
```

Failure responses:

| Case | HTTP | Body |
|---|---|---|
| Not authenticated | 401 | Generic unauthorized |
| Authenticated but wrong surface | 403 | Forbidden |
| Wrong tenant / no membership | 403 | Forbidden (same message as not found where appropriate) |
| Read-only tenant | 403 | `TENANT_READ_ONLY` code |
| Suspended tenant login | 403 | `TENANT_ACCESS_BLOCKED` |
| Missing permission | 403 | Forbidden |
| Missing entitlement | 403 | `FEATURE_NOT_AVAILABLE` |
| Cross-tenant resource ID | 404 or 403 | Never leak other tenant data |

---

## Tenant Context Object

Built once per request and attached to NestJS request context:

```typescript
interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  writeMode: 'full' | 'read_only' | 'blocked';
  subscriptionStatus: string;
  entitlements: Set<string>;
}

interface AuthContext {
  userId: string;
  sessionId: string;
  authSurface: 'platform' | 'company' | 'portal';
  platformRole?: 'super_admin' | 'support_agent';
  membershipId?: string;
  roleId?: string;
  permissions: Set<string>;
  branchIds?: string[]; // null = all branches when role is not branch-scoped
  customerId?: string; // portal only
  tenant?: TenantContext;
}
```

Repositories and services receive `AuthContext` from trusted middleware, never from raw request body fields.

---

## Authorization Layers

| Layer | Question | Source |
|---|---|---|
| Authentication | Who is this user? | Access token + session |
| Tenant binding | Which company workspace? | Membership / portal account + host hint |
| Entitlement | Is the feature enabled for this company? | Subscription + overrides |
| Write mode | Is mutation allowed now? | Trial / billing lifecycle |
| Permission | May this user perform the action? | Role permission assignments |
| Branch scope | Which branch rows apply? | Membership default + role branch policy |
| Object-level | Does this record belong to the authorized scope? | Service/repository query filters |

Customer portal skips employee permissions but enforces customer record scope and portal visibility rules.

---

## Permission Enforcement

- Permission keys are stable strings (`crm.customers.view`) — see `PERMISSIONS_MODEL.md`
- `@RequirePermission('crm.customers.view')` decorator on controllers/handlers
- UI menu visibility uses the same permission keys from the login snapshot; server remains authoritative
- Financial sensitivity uses dedicated keys (`finance.buy_prices.view`, `finance.profitability.view`)
- Super Admin platform permissions use a separate `platform.*` namespace

Default role templates are seeded at tenant provisioning. Company Owner may customize role permissions unless restricted by policy (Recommendation: Owner and Admin roles cannot be stripped of `organization.roles.manage`).

---

## 2FA Design

MVP includes TOTP-based 2FA:

- Setup: QR secret, backup codes (hashed storage), per user
- Verification: required at login when enabled
- Platform Super Admin: 2FA required before production Beta launch (Confirmed Requirement)
- Company and portal users: optional in MVP, configurable enforcement later

---

## Security Controls

- Rate limit login, password reset, and public tracking endpoints
- Constant-time credential comparison path
- Do not enumerate accounts via login or reset responses
- Audit log: login success/failure, password change, 2FA change, session revoke, permission-denied on sensitive resources
- CORS restricted to known frontend origins
- Content Security Policy on frontend surfaces

---

## Background Jobs and Internal Calls

Jobs carry:

- `tenant_id` from the triggering record, validated at enqueue time
- `actor_user_id` when user-initiated
- Never process a job payload `tenant_id` without verifying the referenced entity belongs to that tenant

Worker authentication uses an internal secret or mTLS between worker and API — not a user refresh token.

---

## Confirmed Design Decisions

| Item | Decision |
|---|---|
| OQ-008 tenant switcher UI | One active tenant per session; no switcher UI in MVP; data model supports multiple memberships |
| 2FA Super Admin | Required before production Beta |
| 2FA company users | Optional in MVP |
| Admin host | `admin.raanko.com` for Beta (Assumption) |
| Session list UI | Session records stored in MVP; full management UI in Phase 2 |

---

## API Endpoints (Design Level)

| Method | Path | Surface | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/company/login` | Company | Subdomain must match membership |
| POST | `/api/v1/auth/company/logout` | Company | Revoke session |
| POST | `/api/v1/auth/company/refresh` | Company | Rotate tokens |
| POST | `/api/v1/auth/platform/login` | Platform | |
| POST | `/api/v1/auth/platform/logout` | Platform | |
| POST | `/api/v1/auth/platform/refresh` | Platform | |
| POST | `/api/v1/auth/portal/login` | Portal | |
| POST | `/api/v1/auth/portal/logout` | Portal | |
| POST | `/api/v1/auth/portal/refresh` | Portal | |
| POST | `/api/v1/auth/password/forgot` | Shared | Rate limited |
| POST | `/api/v1/auth/password/reset` | Shared | Token single-use |
| POST | `/api/v1/auth/email/verify` | Shared | |
| GET | `/api/v1/auth/me` | All authenticated | Returns auth + permission snapshot |

Invitation and 2FA setup endpoints belong to Organization and Platform Identity modules respectively.

---

## Testing Requirements

Before release:

- Cross-tenant login rejection when subdomain does not match membership
- Token from company surface rejected on platform routes
- Read-only tenant blocks mutating verbs with consistent error code
- Suspended tenant blocks company login
- Portal token cannot access employee endpoints
- Refresh token rotation and reuse detection
- Permission denied enforced server-side even if UI hides a button
- Object-level ID guessing returns safe response

---

## Related Documents

- `PERMISSIONS_MODEL.md` — permission keys and MVP matrix
- `MULTI_TENANCY.md` — tenant resolution and write modes
- `SECURITY_ARCHITECTURE.md` — threat model and controls
- `DATABASE_DESIGN.md` — User, Membership, Role, Session entities
