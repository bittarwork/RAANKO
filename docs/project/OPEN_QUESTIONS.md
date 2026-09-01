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
Open

Must Be Answered Before:
Implementation of any application module

---

## OQ-002

Question:
Which frontend framework will be used for dashboards, portal, and public tracking?

Impact:
UI architecture, i18n approach, and frontend coding standards.

Status:
Open

Must Be Answered Before:
Frontend implementation

---

## OQ-003

Question:
Which database will be used, and what physical multi-tenant strategy will be used: shared schema with `tenant_id`, schema-per-tenant, or database-per-tenant?

Impact:
Database design, isolation mechanism, migrations, and possible RLS.

Status:
Open

Must Be Answered Before:
Physical database implementation

---

## OQ-004

Question:
Which cloud, file storage, email, and authentication providers will be used?

Impact:
File security, notifications, deployment, and operational cost.

Status:
Open

Must Be Answered Before:
Infrastructure implementation

---

## OQ-005

Question:
What are the final commercial plan names, prices, billing cycles, and included limits?

Impact:
Billing UI copy and packaging. The entitlement engine itself does not require prices to be designed.

Status:
Open

Must Be Answered Before:
Public commercial launch configuration

Notes:
Do not assume prices. Example names Starter / Professional / Business / Enterprise are not final.

---

## OQ-006

Question:
During tenant suspension, what exactly happens to Customer Portal and Public Tracking?

Impact:
Customer communication and operational continuity.

Status:
Open

Must Be Answered Before:
Suspension behavior implementation

Confirmed so far:
- Company login blocked
- API access blocked
- Data preserved

---

## OQ-007

Question:
Is default branch creation always required during provisioning, or only when the company type needs it?

Impact:
Provisioning workflow and onboarding.

Status:
Open

Must Be Answered Before:
Tenant provisioning implementation

---

## OQ-008

Question:
Will MVP UI allow one user to switch between multiple tenant memberships, or only store that capability in the data model?

Impact:
Login, tenant resolution, and UX.

Status:
Open

Must Be Answered Before:
Authentication UX design

Confirmed so far:
- Data model must not block multi-membership

---

## OQ-009

Question:
Who can self-register a shipping company, or is Super Admin the only provisioning path in MVP?

Impact:
Onboarding, abuse control, and billing.

Status:
Open

Must Be Answered Before:
Company onboarding implementation

Confirmed so far:
- Super Admin can create companies

---

## OQ-010

Question:
What legal retention period applies before permanent tenant deletion?

Impact:
Deletion workflow and compliance.

Status:
Open

Must Be Answered Before:
Permanent deletion implementation

---

## OQ-011

Question:
Which identifier format is used internally: UUID, ULID, or another scheme?

Impact:
Database schema and URL design.

Status:
Open

Must Be Answered Before:
Physical database implementation

Notes:
Secure non-guessable identifiers are recommended.
