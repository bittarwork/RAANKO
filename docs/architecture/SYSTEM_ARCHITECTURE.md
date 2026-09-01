# System Architecture

Status: Design accepted pending owner review of the Design gate.

Implementation must not start until the Design gate is explicitly approved.

---

## Architecture Style

RAANKO is a modular monolith.

- One deployable application
- One codebase
- Many isolated tenants
- Internal modules with explicit boundaries
- Shared PostgreSQL database with tenant-scoped data enforced in application code

See ADR-008, ADR-009, ADR-010.

---

## System Boundaries

| Boundary | Users | Auth | Tenant Resolution |
|---|---|---|---|
| Public Tracking | Guest | None | Subdomain + tracking number |
| Customer Portal | Customer user | Customer auth | Subdomain + membership to customer account |
| Company Workspace | Tenant employees | Company auth | Subdomain + membership + permissions |
| Super Admin | Platform admins and support agents | Platform auth | Separate admin host or protected route namespace |
| Background Workers | System | Internal worker auth | Trusted tenant context from job payload |
| HTTP API `/api/v1` | Frontend and future integrations | Token/session by client type | Same rules as corresponding UI boundary |

---

## Technology Stack

| Layer | Choice |
|---|---|
| Backend | TypeScript, NestJS |
| Frontend | TypeScript, Next.js, React |
| Database | PostgreSQL |
| ORM | Prisma |
| Queue | Redis + BullMQ |
| Storage | S3-compatible object storage |
| Email | Transactional email provider |
| Hosting | Managed PaaS for Beta |
| CI/CD | GitHub Actions |

Details: ADR-008, ADR-013.

---

## Application Modules

Modules are bounded areas inside the monolith.

| Module | Owns | Depends On |
|---|---|---|
| Platform Identity | Users, credentials, sessions, login activity, password reset | — |
| Platform Administration | Super Admin, Support Agent, platform audit, global catalogs admin | Platform Identity |
| Tenant Management | Tenant, slug, subdomain, settings, branding, onboarding, lifecycle | Platform Identity, Subscription |
| Subscription and Entitlements | Plans, trial, limits, usage, overrides, write-access mode | Tenant Management |
| Organization | Branches, memberships, roles, permissions | Platform Identity, Tenant Management |
| CRM | Customers, activities, notes, tasks, duplicate rules | Organization |
| Suppliers and Rates | Suppliers, rate sheets, charge templates, rate import | Organization, Import Jobs |
| Quotes and RFQ | RFQ, quotes, versions, pricing, PDF generation trigger | CRM, Suppliers and Rates, Documents |
| Bookings | Booking lifecycle, conversion from quote | Quotes and RFQ |
| Shipments and Tracking | Shipments, statuses, timeline, containers, public tracking | Bookings, CRM, Organization |
| Documents | File metadata, visibility, signed download, generated PDF storage | Tenant Management, Shipments, Finance, Quotes |
| Finance | Invoices, supplier invoices, payments, credit notes, expenses, profitability | Shipments, Quotes, CRM, Documents |
| Notifications | In-app feed, email dispatch, preferences | Platform Identity, all event publishers |
| Reports and Search | Dashboards, reports, tenant-scoped search | Shipments, Finance, Quotes, CRM |
| Support | RAANKO tickets, customer support requests | Tenant Management, Notifications |
| Import Jobs | Excel imports, validation, error reports | CRM, Suppliers and Rates |

Future modules attach at the edges:
- Integrations
- Warehouse
- Fleet
- Consolidation

---

## Backend Structure

Recommended NestJS layout:

```text
apps/
  api/                 # NestJS HTTP API and workers
packages/
  shared/              # Shared types, constants, validation schemas
  ui/                  # Optional shared frontend component library

apps/api/src/
  platform/            # Super Admin and platform services
  modules/
    identity/
    tenant/
    subscription/
    organization/
    crm/
    suppliers/
    quotes/
    bookings/
    shipments/
    documents/
    finance/
    notifications/
    reports/
    support/
    imports/
  common/
    auth/
    tenant-context/
    permissions/
    audit/
    queue/
    storage/
    pagination/
```

Rules:
- Controllers stay thin
- Authorization and tenant checks happen before business logic
- Repositories or Prisma services never accept untrusted `tenant_id`
- Cross-module workflows use application services or domain events

---

## Frontend Structure

One Next.js application with route groups:

```text
app/
  (platform)/          # Super Admin
  (company)/           # Tenant employee dashboard
  (portal)/            # Customer portal
  (public)/track/      # Public tracking
  api/                 # Optional Next route handlers only if needed; primary API remains NestJS
```

UI principles:
- Desktop-first operational density
- Responsive portal and public tracking
- i18n for Arabic and English with RTL support
- Tenant branding loaded after tenant resolution

---

## Multi-Tenant Request Flow

```text
HTTP Request
  -> Host/subdomain resolution (hint only)
  -> Authentication
  -> Membership and role resolution
  -> Tenant context established server-side
  -> Entitlement check (feature + write mode)
  -> Permission and object-level authorization
  -> Module service / repository with scoped queries
  -> Response
```

Never authorize from subdomain alone.

See `MULTI_TENANCY.md`.

---

## API Architecture

- Versioned REST API under `/api/v1`
- Separate auth contexts for platform, company, and portal users
- Public tracking uses unauthenticated read endpoints with strict field allowlists
- Background-triggered work uses internal job APIs or service calls, not public endpoints
- Public API keys and webhooks are Phase 2

Response rules:
- Pagination on all list endpoints
- Server-side filtering and sorting
- Stable error format with authorization-safe messages

---

## Background Jobs

Queue-backed jobs for:
- Email delivery
- PDF generation
- Excel import processing
- Large report generation
- Notification fan-out

Each job payload carries trusted `tenant_id` when tenant-owned work is processed.

---

## File Storage Architecture

- Private object storage bucket
- Object key includes tenant ownership metadata
- Download requires authorization and uses short-lived signed URLs
- Generated PDFs are stored as documents after creation

---

## Audit Architecture

Two audit streams:
- Tenant audit log for company-owned actions
- Platform audit/security log for Super Admin and support actions

Sensitive actions include permission changes, financial mutations, status changes, support access, and document visibility changes.

---

## Deployment Architecture (Beta)

Environments:
- Local
- Staging
- Production

Beta topology:
- One API/worker service
- Managed PostgreSQL
- Managed Redis
- Object storage bucket
- Cloudflare DNS and proxy in front of the existing domain

---

## Testing Architecture

Mandatory test categories:
- Tenant isolation security tests
- Permission matrix tests for financial and operational actions
- Workflow tests for quote → booking → shipment → invoice
- Portal and public tracking redaction tests
- Import validation tests

---

## Explicitly Not Part of Current Design Gate

- Final DDL and index plan
- Full permission matrix tables
- Detailed UX wireframes
- Implementation task breakdown

These are the next Design outputs before Implementation Planning approval.
