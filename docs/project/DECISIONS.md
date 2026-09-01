# Decisions

Architecture and product decisions are recorded as ADRs.

Status values: Proposed, Accepted, Deprecated, Superseded.

Do not treat a recommendation as an accepted decision.

---

## ADR-001: Use tenant_id as the technical ownership boundary

Status: Accepted

Date: 2026-09-01

Context:
RAANKO serves multiple independent shipping companies on one platform. Operational data must be owned by exactly one tenant unless it is classified as global.

Decision:
Use `tenant_id` as the technical ownership boundary for tenant-scoped data. Do not blindly add `tenant_id` to global reference or platform tables.

Consequences:
- Every tenant-scoped operation must enforce tenant ownership from server-side context.
- Physical database strategy remains open.
- Identifier format remains open.

---

## ADR-002: One codebase for all tenants

Status: Accepted

Date: 2026-09-01

Context:
RAANKO must onboard companies through configuration, not by maintaining a separate application copy per company.

Decision:
One application and one maintainable codebase serve all subscribed companies. Tenant environments are provisioned, not forked.

Consequences:
- Branding, settings, workflows, numbering, and entitlements are configuration.
- Custom domain support can be added later without splitting the codebase.
- Exceptional enterprise isolation, if ever requested, would require a new ADR.

---

## ADR-003: Five-phase task workflow

Status: Accepted

Date: 2026-09-01

Context:
Unclear requirements and premature coding would create technical and product debt in a multi-tenant financial operations platform.

Decision:
All non-trivial work follows Analysis → Design → Implementation → Refinement → Review. Forward skipping is forbidden. Owner approval is required to pass a gate.

Consequences:
- Agents must not start code during analysis or before design approval.
- New ideas discovered late return to Analysis.
- TASK-0001 was an owner-specified documentation bootstrap.

---

## ADR-004: Documentation and governance system

Status: Accepted

Date: 2026-09-01

Context:
A single giant document would become unmaintainable. Agents need a stable master context plus small operational files.

Decision:
Use the repository documentation layout defined in TASK-0001: root `AGENTS.md` and `PROJECT_CONTEXT.md`, with `docs/` and `tasks/` operational files. Module documentation is created only when a module enters the roadmap.

Consequences:
- `CURRENT_STATE.md` is the first operational file to read after `AGENTS.md`.
- Confirmed requirements are not silently edited in `PROJECT_CONTEXT.md`.

---

## ADR-005: Membership model rather than a single user-to-company coupling

Status: Accepted

Date: 2026-09-01

Context:
A user may later belong to more than one shipping company or organization.

Decision:
Model access as User, Membership, Tenant, Role, and Permissions. MVP UI may still expose one tenant at a time.

Consequences:
- Authentication design must resolve current membership/tenant context.
- Super Admin platform access is a different layer from tenant membership.

---

## ADR-006: Entitlements instead of plan-name conditionals

Status: Accepted

Date: 2026-09-01

Context:
Commercial plans will change. Enterprise customers may need overrides.

Decision:
Feature access is determined by Feature, Plan Feature, Tenant Feature Override, and Subscription Entitlement. Do not scatter `if plan == "enterprise"` logic.

Consequences:
- Plan names and prices can change without rewriting module code.
- Super Admin can grant exceptions later without code changes.

---

## ADR-007: Technology stack is not selected yet

Status: Superseded by ADR-008, ADR-009, ADR-010, ADR-012, ADR-013

Date: 2026-09-01

Context:
Language, frameworks, database, cloud, storage, and auth providers were not specified as final.

Decision:
Do not treat any technology as selected. Recommendations may be recorded as assumptions until a dedicated decision task is completed.

Consequences:
- Coding standards remain technology-agnostic.
- Architecture documents may capture principles, not physical schemas or stack-specific implementations.

---

## ADR-008: Application technology stack

Status: Accepted

Date: 2026-09-01

Context:
System analysis is complete. The team is small, the Beta budget for infrastructure is low, and the product requires a multi-tenant SaaS with dashboards, customer portal, public tracking, background jobs, and strong type safety across a complex domain.

Decision:
Use the following stack for RAANKO MVP implementation:

- Architecture shape: modular monolith
- Backend: TypeScript, NestJS
- Frontend: TypeScript, Next.js (App Router), React
- Database: PostgreSQL
- ORM and migrations: Prisma
- Queue and cache: Redis with BullMQ
- File storage: S3-compatible object storage (Cloudflare R2 recommended for Beta)
- Transactional email: Resend or equivalent provider
- Authentication: built-in application auth with secure sessions or access/refresh tokens
- Hosting: managed PaaS for Beta (Railway, Render, or Fly.io)
- DNS and edge: Cloudflare in front of the existing company domain
- CI/CD: GitHub Actions
- Automated tests: Vitest for unit/integration, Playwright for critical E2E flows

Alternatives considered:
- Python/FastAPI + React: stronger for analytics, weaker for a single-language full-stack team using AI agents heavily
- Laravel/Inertia: viable, but not selected because the approved direction favors TypeScript end to end
- Microservices: rejected for Beta due to operational cost and tightly connected workflows

Consequences:
- Coding standards and repository structure can now be finalized for TypeScript.
- One language across backend and frontend reduces context switching for a two-person team.
- Next.js can serve company dashboard, portal, public tracking, and Super Admin surfaces with shared UI primitives.
- NestJS modules align with RAANKO business modules and support guards/interceptors for tenant and permission enforcement.
- Background work must use queue workers, not HTTP request threads.

---

## ADR-009: Physical multi-tenant database strategy

Status: Accepted

Date: 2026-09-01

Context:
RAANKO requires strict tenant isolation, relational financial data, reporting, and a small-team operational model. ADR-001 already selected `tenant_id` as the logical ownership boundary.

Decision:
Use one shared PostgreSQL database and one shared application schema.

- All TENANT_SCOPED tables include `tenant_id`
- GLOBAL and platform tables do not include `tenant_id`
- Tenant ownership is enforced in application services and repositories using trusted server-side tenant context
- PostgreSQL Row Level Security is recommended as defense in depth once core queries are stable
- Schema-per-tenant and database-per-tenant are deferred unless an exceptional enterprise requirement appears later

Consequences:
- Migrations remain simple for Beta.
- Cross-tenant reporting for Super Admin must use explicit platform queries with separate authorization.
- Automated tenant isolation tests become mandatory before release.
- Future enterprise isolation would require a new ADR.

---

## ADR-010: Modular monolith module boundaries

Status: Accepted

Date: 2026-09-01

Context:
RAANKO spans CRM, operations, finance, documents, portal, platform administration, and support. The workflows are tightly connected, but future modules such as warehouse and fleet must not be blocked.

Decision:
Implement RAANKO as one deployable application composed of bounded modules with explicit internal contracts.

Initial modules:

1. Platform Identity — users, memberships, auth, sessions, login activity
2. Platform Administration — Super Admin, Support Agent, platform audit, global settings
3. Tenant Management — tenant provisioning, slug/subdomain, lifecycle, onboarding, settings, branding
4. Subscription and Entitlements — plans, trials, limits, usage, overrides
5. Organization — branches, employees, roles, permissions
6. CRM — customers, activities, tasks, duplicate detection
7. Suppliers and Rates — suppliers, rate sheets, charge templates, imports
8. Quotes and RFQ — quotes, versions, RFQ, pricing calculations
9. Bookings — booking lifecycle and conversion from quotes
10. Shipments and Tracking — shipments, statuses, timeline, containers, public tracking
11. Documents — uploads, generated PDFs, visibility, storage access
12. Finance — invoices, payments, expenses, credit notes, profitability, exchange rates
13. Notifications — in-app and email delivery, preferences, templates
14. Reports and Search — dashboards, operational/financial reports, tenant search
15. Support — RAANKO tickets and company customer support requests
16. Import Jobs — Excel import pipelines and error reporting

Rules:
- Modules communicate through application services or domain events, not direct cross-module table access from controllers
- Shared kernel is limited to common infrastructure such as auth context, pagination, money/value objects, and audit helpers
- Future modules such as Warehouse, Fleet, Consolidation, and Integrations attach through new modules rather than rewriting core shipment/finance models

Consequences:
- The repository should use a module-oriented folder structure in backend and feature-oriented structure in frontend.
- Cross-module transactions must be designed explicitly where quote, booking, shipment, and finance flows connect.
- Later extraction to services remains possible at module seams.

---

## ADR-011: Tenant lifecycle behavior for trial, read-only, and suspension

Status: Accepted

Date: 2026-09-01

Context:
Discovery confirmed a 60-day trial, read-only mode after trial expiry, and configurable behavior during suspension.

Decision:
Distinguish company status, subscription status, and write access.

- Trial: full product write access for 60 days
- Trial expired / unpaid read-only: company users may view tenant data but cannot create or mutate operational/financial records; customer portal is also read-only and cannot submit new RFQs
- Suspended: company login and API access are blocked; customer portal is read-only; public tracking remains available for existing/active shipments
- Data is preserved in all non-deletion states

Consequences:
- Entitlements must expose a write-capability flag separate from login availability.
- Background jobs and portal endpoints must enforce read-only mode consistently.
- Super Admin manual activation moves a tenant from read-only to paid active.

---

## ADR-012: Internal identifier format

Status: Accepted

Date: 2026-09-01

Context:
RAANKO exposes public tracking, portal links, and APIs. Identifier guessing must be avoided.

Decision:
Use ULID for primary public-facing and internal entity identifiers where a string ID is appropriate.

- Tenant immutable internal ID: ULID or UUID accepted, prefer ULID for sortable creation time
- Public business numbers such as quote, shipment, and invoice numbers remain tenant-configurable sequences separate from primary keys

Consequences:
- URLs and APIs use non-sequential identifiers.
- Database indexing and sort-by-created-time are simpler with ULID.
- Human-readable numbers remain customizable per tenant.

---

## ADR-013: Beta infrastructure providers

Status: Accepted

Date: 2026-09-01

Context:
The project has a domain but no dedicated server yet. Beta infrastructure budget is approximately USD 0–20 per month.

Decision:
Use low-cost managed services for Beta:

- Application hosting: managed PaaS
- PostgreSQL: managed instance from the same PaaS or a small attached database service
- Redis: managed small instance for queue and cache
- Object storage: Cloudflare R2 or equivalent S3-compatible storage
- Email: Resend or equivalent transactional provider
- DNS/CDN/WAF front door: Cloudflare

Exact vendor choice may vary by availability and price at implementation time, but the capability classes above are fixed for Beta.

Consequences:
- Infrastructure setup can begin once implementation is approved.
- Production hardening and cost review are required before broad commercial launch.

---

## ADR-014: MVP auth UX and default permission policy

Status: Accepted

Date: 2026-09-01

Context:
Platform foundation design required final decisions on tenant switching UX, Super Admin 2FA, branch scope, and default visibility of buy prices for operational roles.

Decision:

1. MVP exposes one active tenant per session with no tenant switcher UI. Multi-membership remains in the data model.
2. Super Admin must enable and pass 2FA before production Beta launch. Company and portal 2FA is optional in MVP.
3. Branch Manager permissions are branch-scoped only, filtered by assigned branch.
4. Sales and Shipping Operations default roles include `finance.buy_prices.view` in the seeded permission matrix.

Consequences:
- Login UX is subdomain-specific per company in MVP.
- Platform admin accounts require TOTP setup before Beta production.
- Branch Manager queries always inject branch scope server-side.
- Quote and shipment screens show buy rates to Sales and Operations by default unless role is customized.

---

## ADR-015: Implementation tooling and Beta vendor selections

Status: Accepted

Date: 2026-09-01

Context:
ADR-008 and ADR-013 fixed capability classes but left some library and vendor choices open. Slice 1 scaffold requires final selections for monorepo tooling, UI stack, validation, and Beta providers.

Decision:

| Area | Selection |
|---|---|
| Monorepo | pnpm workspaces |
| UI | shadcn/ui + Tailwind CSS |
| i18n | next-intl |
| Shared validation | Zod in `packages/shared` |
| Beta hosting | Railway |
| Transactional email | Resend |
| Object storage | Cloudflare R2 |
| PDF generation | Puppeteer (HTML to PDF) |
| Excel import | ExcelJS |
| Password hashing | Argon2id |
| 2FA library | otplib (TOTP) |

API host for Beta: `api.raanko.com`. Super Admin host: `admin.raanko.com`. Tenant surfaces: `{slug}.raanko.com`.

Consequences:
- Repository bootstrap uses pnpm workspaces with `apps/api`, `apps/web`, and `packages/shared`.
- Frontend and backend share Zod schemas and TypeScript types from `packages/shared`.
- CI/CD targets Railway for API, web, PostgreSQL, and Redis in Beta.
- shadcn/ui and next-intl are added during web app setup in Slice 1–2.

