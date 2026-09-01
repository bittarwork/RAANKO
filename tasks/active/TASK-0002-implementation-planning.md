# TASK-0002: MVP Implementation Planning by Vertical Slice

## Goal

Define the ordered vertical slices that will take RAANKO from empty repository to MVP-ready product, with clear dependencies, acceptance criteria, and module boundaries per slice.

## Business Value

Prevents chaotic full-stack development, ensures tenant isolation and auth are built before business modules, and gives the team a reviewable delivery sequence.

## Target Users

- Project owner
- Development agents
- Future contributors

## Current Phase

Design

## Task Type

Requirement

## Scope

- Vertical slice order and dependencies
- Per-slice module scope, acceptance criteria, and test requirements
- Repository structure decision for monorepo bootstrap (Slice 1)
- Physical schema design trigger per slice (not full DDL in this task)

## Out of Scope

- Writing application code
- Full DDL for all modules
- UI wireframes or Figma
- Commercial pricing (OQ-005)

## Confirmed Requirements

- Follow ADR-008 stack: NestJS, Next.js, PostgreSQL, Prisma, Redis/BullMQ
- Follow ADR-010 module boundaries
- Each slice must be demoable and testable before the next slice starts
- Tenant isolation tests mandatory from Slice 2 onward
- Design documents in `docs/architecture/` are the source of truth

## Acceptance Criteria

- Vertical slices are ordered with explicit dependencies
- Each slice lists affected modules, acceptance criteria, and mandatory tests
- Slice 1 (scaffold) is ready to enter Implementation upon owner approval
- No slice skips auth/tenant context enforcement
- Financial slice respects permission separation from operations

## Constraints

- No code in this task
- MVP scope only — see `docs/roadmap/MVP_SCOPE.md`
- Physical DDL starts slice-by-slice, not all at once

## Assumptions

- Design gate is approved by owner (2026-09-01)
- Beta uses Trial and Paid plan placeholders without public pricing
- One developer/agent team working sequentially through slices

## Open Questions

- OQ-005, OQ-010, OQ-012, OQ-013 do not block Slice 1–4

## Current Development Phase

Design (Implementation Planning)

## Affected Modules

All MVP modules — delivery order defined below.

## Tenant Impact

Every slice that touches tenant data must enforce server-side tenant context from Slice 2 onward.

## Security Impact

Slice 2 delivers auth pipeline. Later slices inherit guards — they must not reimplement auth ad hoc.

## Permissions Impact

Slice 4 delivers RBAC seed and enforcement. Later slices register permission keys from `PERMISSIONS_MODEL.md`.

## Financial Impact

Slice 10 delivers finance. No slice before Slice 10 exposes buy prices without permission checks.

---

## Vertical Slice Plan

### Slice 1 — Repository Scaffold and Dev Environment

**Modules:** none (infrastructure)

**Deliverables:**
- Monorepo: `apps/api` (NestJS), `apps/web` (Next.js), `packages/shared`
- Prisma setup with empty migration baseline
- Docker Compose: PostgreSQL, Redis
- GitHub Actions: lint, typecheck, test on PR
- Environment config pattern (`.env.example`)
- Health check endpoint

**Acceptance:**
- `docker compose up` starts local stack
- API and web dev servers run
- CI passes on empty test suite

**Tests:** smoke test for health endpoint

---

### Slice 2 — Platform Identity and Auth Foundation

**Modules:** Platform Identity

**Depends on:** Slice 1

**Deliverables:**
- User, Session, RefreshToken entities (Prisma)
- Auth endpoints: company, platform, portal login/logout/refresh/me
- JWT access + rotating refresh cookie
- Auth guards per surface
- Tenant context middleware (membership resolution)
- Password hash, forgot/reset, email verification stubs
- Super Admin 2FA (TOTP) — required before Beta production
- Login activity logging

**Acceptances:**
- Company login on matching subdomain succeeds; mismatch fails
- Platform token rejected on company routes
- Refresh rotation works; reuse revokes session family
- Tenant context available in request scope

**Tests:**
- Cross-tenant login rejection
- Surface isolation tests
- Refresh token rotation test

---

### Slice 3 — Super Admin and Tenant Provisioning

**Modules:** Platform Administration, Tenant Management, Subscription and Entitlements

**Depends on:** Slice 2

**Deliverables:**
- Platform admin UI shell + login with 2FA
- `POST /platform/tenants` provisioning transaction
- Tenant lifecycle: trial, active, read-only, suspended
- Default branch, roles, permissions seed (from matrix)
- Owner invitation email job
- Subscription trial (60 days) and write-mode flags
- Entitlement catalog and plan feature seed

**Acceptance:**
- Super Admin creates tenant end-to-end
- Owner invite email queued
- Suspended tenant blocks company login
- Read-only tenant allows GET, blocks POST/PATCH/DELETE

**Tests:**
- Provisioning idempotency / rollback
- Lifecycle write-mode enforcement
- Tenant isolation on platform tenant list

---

### Slice 4 — Company Onboarding and Organization

**Modules:** Organization (partial Tenant Management UI)

**Depends on:** Slice 3

**Deliverables:**
- Invitation accept + set password flow
- Onboarding wizard with saved progress
- Branches CRUD
- Employee invite and membership management
- Role and permission assignment UI
- Branch scope enforcement for Branch Manager
- Company settings and branding

**Acceptance:**
- Owner completes onboarding → dashboard
- Branch Manager sees only assigned branch data
- Permission denied returns 403 server-side

**Tests:**
- Permission matrix tests for default roles
- Branch scope filter tests

---

### Slice 5 — CRM (Customers)

**Modules:** CRM, Import Jobs (customers only)

**Depends on:** Slice 4

**Deliverables:**
- Customer CRUD with soft delete
- Activity timeline, notes, tasks
- Customer list pagination, search, export
- Excel customer import job

**Acceptance:**
- CRUD respects permissions and tenant scope
- Import job async with error report

**Tests:**
- Tenant isolation on customer ID guess
- Import validation tests

---

### Slice 6 — Suppliers and Rates

**Modules:** Suppliers and Rates, Import Jobs (suppliers/rates)

**Depends on:** Slice 5

**Deliverables:**
- Supplier CRUD
- Rate sheets and charge templates
- Excel import for rates
- Buy rate visibility gated by `finance.buy_prices.view`

**Acceptance:**
- Sales/Ops see buy rates by default per ADR-014
- User without permission sees sell-only view

**Tests:**
- Field redaction tests for buy prices

---

### Slice 7 — Quotes and RFQ

**Modules:** Quotes and RFQ, Notifications (basic)

**Depends on:** Slice 6

**Deliverables:**
- RFQ inbox (internal)
- Quote CRUD, versioning, approve/send
- Quote line charges with buy/sell/margin
- Portal RFQ submit (when write mode full)
- Quote PDF generation job (stub → Slice 9 full)
- Email/in-app notification on RFQ and quote sent

**Acceptance:**
- Portal RFQ blocked in read-only mode
- Approve requires permission
- Margin hidden without `finance.margins.view`

**Tests:**
- RFQ → quote workflow test
- Portal redaction tests

---

### Slice 8 — Bookings, Shipments, and Public Tracking

**Modules:** Bookings, Shipments and Tracking

**Depends on:** Slice 7

**Deliverables:**
- Booking from accepted quote
- Direct shipment creation
- Shipment CRUD, parties, cargo, containers
- Configurable status workflow
- Tracking events (internal + public flag)
- Public tracking page (unauthenticated, field allowlist)
- Suspended tenant: public tracking still works for active shipments

**Acceptance:**
- Quote → booking → shipment path works
- Direct shipment path works
- Public tracking shows no financial data

**Tests:**
- Workflow transition tests
- Public tracking redaction tests
- Cross-tenant tracking number isolation

---

### Slice 9 — Documents

**Modules:** Documents

**Depends on:** Slice 8

**Deliverables:**
- Private upload to object storage
- Document metadata, visibility rules
- Signed download URLs
- Generated PDFs for quotes (and invoice template prep)
- Preview in UI

**Acceptance:**
- Direct bucket URL insufficient for download
- Customer-visible vs internal visibility enforced

**Tests:**
- Unauthorized download rejected
- Cross-tenant document access rejected

---

### Slice 10 — Finance

**Modules:** Finance

**Depends on:** Slice 9

**Deliverables:**
- Customer invoices (draft, issue)
- Supplier invoices linked to shipments
- Payments, expenses, credit notes
- Exchange rates (manual)
- Shipment profitability calculation
- Financial audit logging
- Invoice/receipt PDF generation

**Acceptance:**
- Issued invoice cannot hard-delete
- Profitability requires `finance.profitability.view`
- Payment recording updates outstanding balance

**Tests:**
- Financial permission separation tests
- Profit calculation accuracy fixture test
- Audit log on financial mutation

---

### Slice 11 — Dashboard, Reports, and Search

**Modules:** Reports and Search

**Depends on:** Slice 10

**Deliverables:**
- Operations dashboard widgets (permission-gated)
- Operational and financial reports
- Tenant-scoped global search
- Excel/PDF export (async for large)

**Acceptance:**
- Widgets hidden without permission (not empty broken state)
- Search respects branch scope
- Monthly profit widget requires profitability permission

**Tests:**
- Dashboard permission gating tests
- Search tenant isolation tests

---

### Slice 12 — Notifications and Support

**Modules:** Notifications, Support

**Depends on:** Slice 4 (can parallel after Slice 8 for notifications)

**Deliverables:**
- In-app notification feed
- Email dispatch via queue
- Notification preferences
- Company customer support requests (portal + company)
- RAANKO support tickets (company → platform)

**Acceptance:**
- RAANKO support separate from company customer support
- Notifications deep-link to entities

**Tests:**
- Notification delivery job test
- Support ticket tenant scoping

---

### Slice 13 — Customer Portal Complete

**Modules:** Portal surface integration

**Depends on:** Slices 7, 8, 9, 10, 12

**Deliverables:**
- Portal shell with branding
- Portal login
- RFQ, quotes (view/accept), shipments, tracking, invoices, documents, support
- Read-only mode UX (banner, disabled actions)

**Acceptance:**
- Customer never sees buy price, margin, internal notes
- Portal token cannot call company API

**Tests:**
- Portal redaction suite
- Portal ↔ company API isolation

---

### Slice 14 — Beta Hardening and Release Readiness

**Modules:** all

**Depends on:** Slices 1–13

**Deliverables:**
- Full tenant isolation test suite
- Permission matrix regression suite
- E2E: quote → shipment → invoice (Playwright)
- Rate limiting on auth and public tracking
- Staging deployment on managed PaaS
- Super Admin 2FA enforced in production config
- Error monitoring hookup (Recommendation)

**Acceptance:**
- All mandatory test categories from `SYSTEM_ARCHITECTURE.md` pass
- Staging demo path complete for one trial tenant

**Tests:**
- Full regression and E2E suite

---

## Slice Dependency Graph

```text
S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8 → S9 → S10 → S11
                              ↘ S12 (after S4, full after S8)
                                        S13 (after S7–S12)
                                              S14
```

---

## Implementation Notes

- Start each slice with physical Prisma schema for that slice only, then migrate
- Do not build all tables upfront
- Each slice ends with Review before next slice Implementation begins
- Keep `CURRENT_STATE.md` updated after each slice Review

## Testing Evidence

Not applicable until Implementation. Each slice defines its own test requirements above.

## Documentation Updates

- `CURRENT_STATE.md` when TASK-0002 is approved
- Per-slice module docs under `docs/modules/` when slice enters Implementation

## Review Result

Not started
