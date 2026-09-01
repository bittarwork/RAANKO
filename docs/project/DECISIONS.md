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

Status: Accepted

Date: 2026-09-01

Context:
Language, frameworks, database, cloud, storage, and auth providers were not specified as final.

Decision:
Do not treat any technology as selected. Recommendations may be recorded as assumptions until a dedicated decision task is completed.

Consequences:
- Coding standards remain technology-agnostic.
- Architecture documents may capture principles, not physical schemas or stack-specific implementations.
