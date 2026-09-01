# Assumptions

Temporary assumptions. They are not confirmed requirements.

If an assumption becomes a decision, move it to `DECISIONS.md`.
If it is rejected, mark it Rejected and do not use it in implementation.

---

## ASM-001

Assumption:
A modular monolith is the initial application shape, with module boundaries that allow later extraction if needed.

Status:
Accepted as ADR-010

Must Be Confirmed Before:
System architecture decision

Classification:
Decision recorded in ADR-010

---

## ASM-002

Assumption:
PostgreSQL is a strong candidate for the primary database because of relational data, constraints, and optional row-level security.

Status:
Accepted as ADR-009

Must Be Confirmed Before:
Database implementation

---

## ASM-003

Assumption:
Shared application database with explicit `tenant_id` on tenant-scoped tables is the default isolation strategy being evaluated, with additional defense in depth.

Status:
Accepted as ADR-009

Must Be Confirmed Before:
Database implementation

Notes:
See ADR-009.

---

## ASM-004

Assumption:
MVP exposes one active tenant per login session even if the membership model supports multiple tenants.

Status:
Temporary

Must Be Confirmed Before:
Authentication UX design

---

## ASM-005

Assumption:
EUR is the default display currency in unspecified UI examples. Gregorian dates are used everywhere.

Status:
Temporary / Owner preference captured

Must Be Confirmed Before:
Company onboarding defaults

Notes:
Discovery confirmed Arabic default language for MENA tenants and country-based currency suggestion.

---

## ASM-006

Assumption:
Ports and airports may be treated as GLOBAL reference data, while warehouses remain TENANT_SCOPED.

Status:
Temporary

Must Be Confirmed Before:
Location data-model design

---

## ASM-007

Assumption:
Year 1 scale target after Beta is approximately 50 tenants, 100 concurrent users, and 5,000 shipments per month.

Status:
Temporary

Must Be Confirmed Before:
Infrastructure sizing review before production launch

---

## ASM-008

Assumption:
Beta infrastructure spend remains near USD 0–20 per month until revenue or launch needs justify an increase.

Status:
Temporary

Must Be Confirmed Before:
Production launch readiness review
