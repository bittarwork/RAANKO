# Open Questions

Record unresolved decisions here instead of inventing answers.

Status values: Open, Parked, Answered.

When a question is answered, add an ADR in `DECISIONS.md` if the answer is architectural or binding.

---

## OQ-001

Question:
Which programming language and backend framework will be used?

Impact:
Implementation, coding standards, and project structure cannot be finalized.

Status:
Answered

Answer:
TypeScript with NestJS. See ADR-008.

Must Be Answered Before:
Implementation of any application module

---

## OQ-002

Question:
Which frontend framework will be used for dashboards, portal, and public tracking?

Impact:
UI architecture, i18n approach, and frontend coding standards.

Status:
Answered

Answer:
TypeScript with Next.js and React in one frontend application. See ADR-008.

Must Be Answered Before:
Frontend implementation

---

## OQ-003

Question:
Which database will be used, and what physical multi-tenant strategy will be used: shared schema with `tenant_id`, schema-per-tenant, or database-per-tenant?

Impact:
Database design, isolation mechanism, migrations, and possible RLS.

Status:
Answered

Answer:
PostgreSQL with one shared schema and explicit `tenant_id` on tenant-scoped tables. See ADR-009.

Must Be Answered Before:
Physical database implementation

---

## OQ-004

Question:
Which cloud, file storage, email, and authentication providers will be used?

Impact:
File security, notifications, deployment, and operational cost.

Status:
Answered

Answer:
Managed PaaS hosting, PostgreSQL, Redis, S3-compatible storage, transactional email provider, Cloudflare DNS/edge, and built-in application auth. See ADR-008 and ADR-013.

Must Be Answered Before:
Infrastructure implementation

Notes:
Exact vendor within each capability class may be chosen at implementation time.

---

## OQ-005

Question:
What are the final commercial plan names, prices, billing cycles, and included limits?

Impact:
Billing UI copy and packaging. The entitlement engine itself does not require prices to be designed.

Status:
Parked

Notes:
Beta uses `Trial` and `Paid` plan placeholders without public pricing. Public commercial launch configuration remains blocked until the owner answers names, EUR prices, billing cycles, and limits. Do not invent prices.

Parked Date:
2026-09-03

Must Be Answered Before:
Public commercial launch configuration

---

Question:
During tenant suspension, what exactly happens to Customer Portal and Public Tracking?

Impact:
Customer communication and operational continuity.

Status:
Answered

Answer:
Company login and API are blocked. Customer portal is read-only. Public tracking remains active. See ADR-011.

Must Be Answered Before:
Suspension behavior implementation

---

## OQ-007

Question:
Is default branch creation always required during provisioning, or only when the company type needs it?

Impact:
Provisioning workflow and onboarding.

Status:
Answered

Answer:
Always create a default `Main Branch` during provisioning. See ADR-010 and provisioning design in `MULTI_TENANCY.md`.

Must Be Answered Before:
Tenant provisioning implementation

---

## OQ-008

Question:
Will MVP UI allow one user to switch between multiple tenant memberships, or only store that capability in the data model?

Impact:
Login, tenant resolution, and UX.

Status:
Answered

Answer:
MVP UI exposes one active tenant per session with no tenant switcher. Users with multiple memberships must log in via the correct company subdomain. Data model supports multiple memberships for Phase 2 switcher. See ADR-014 and `AUTHENTICATION_DESIGN.md`.

Must Be Answered Before:
Authentication UX design — answered

---

## OQ-009

Question:
Who can self-register a shipping company, or is Super Admin the only provisioning path in MVP?

Impact:
Onboarding, abuse control, and billing.

Status:
Answered

Answer:
Super Admin is the only provisioning path in Beta/MVP.

Must Be Answered Before:
Company onboarding implementation

---

## OQ-010

Question:
What legal retention period applies before permanent tenant deletion?

Impact:
Deletion workflow and compliance.

Status:
Parked

Notes:
MVP/Beta does not implement permanent tenant deletion. Retention period must be answered before any hard-delete workflow. Records stay suspended/archived.

Parked Date:
2026-09-03

Must Be Answered Before:
Permanent deletion implementation

---

## OQ-011

Question:
Which identifier format is used internally: UUID, ULID, or another scheme?

Impact:
Database schema and URL design.

Status:
Answered

Answer:
ULID for primary identifiers where string IDs are used. See ADR-012.

Must Be Answered Before:
Physical database implementation

---

## OQ-012

Question:
How will the first 3–5 Beta shipping companies be recruited?

Impact:
Beta validation and onboarding support model.

Status:
Parked

Notes:
Product Beta is technically ready for 3–5 trial tenants via Super Admin provisioning. Recruitment method is an operational owner decision outside the codebase. Residual risk accepted for Slice 14 staging.

Parked Date:
2026-09-03

Must Be Answered Before:
Beta launch planning (operational; not a code blocker)

---

## OQ-013

Question:
Which MENA legal and privacy requirements apply per target country?

Impact:
Compliance claims, retention, and privacy operations.

Status:
Parked

Notes:
No country-specific legal claims are made in the product. Public commercial launch and permanent deletion remain blocked until MENA privacy/retention requirements are confirmed by the owner.

Parked Date:
2026-09-03

Must Be Answered Before:
Public commercial launch and permanent deletion implementation
