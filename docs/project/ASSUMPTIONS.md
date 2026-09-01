# Assumptions

Temporary assumptions. They are not confirmed requirements.

If an assumption becomes a decision, move it to `DECISIONS.md`.
If it is rejected, mark it Rejected and do not use it in implementation.

---

## ASM-001

Assumption:
A modular monolith is the initial application shape, with module boundaries that allow later extraction if needed.

Status:
Temporary

Must Be Confirmed Before:
System architecture decision

Classification:
Recommendation currently recorded as a working assumption

---

## ASM-002

Assumption:
PostgreSQL is a strong candidate for the primary database because of relational data, constraints, and optional row-level security.

Status:
Temporary

Must Be Confirmed Before:
Database implementation

---

## ASM-003

Assumption:
Shared application database with explicit `tenant_id` on tenant-scoped tables is the default isolation strategy being evaluated, with additional defense in depth.

Status:
Temporary

Must Be Confirmed Before:
Database implementation

Notes:
This is not accepted yet. See OQ-003.

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

---

## ASM-006

Assumption:
Ports and airports may be treated as GLOBAL reference data, while warehouses remain TENANT_SCOPED.

Status:
Temporary

Must Be Confirmed Before:
Location data-model design
