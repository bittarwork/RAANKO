# Work Rules

These rules govern how AI agents and contributors work inside RAANKO.

They apply to every task unless the owner explicitly overrides them in writing.

---

## 1. Do Not Start With Code

Do not begin with code automatically.

First determine:

- Task goal
- Task type: Requirement, Bug, Improvement, or Decision
- Current development phase
- Affected module
- Impact on RAANKO

Implementation starts only after the Design gate is approved, or when the owner explicitly orders implementation of an already-approved design.

TASK-0001 is a documentation-governance exception already specified by the owner.

---

## 2. Determine the Current Phase Before Acting

Every piece of work belongs to one phase:

1. Analysis
2. Design
3. Implementation
4. Refinement
5. Review

Do only the work of the current phase.

Do not advance to a later phase without closing the previous phase through its gate and owner approval.

---

## 3. Do Not Invent Requirements

If a business rule is not confirmed in:

- `PROJECT_CONTEXT.md`
- `docs/project/REQUIREMENTS.md`
- an accepted ADR
- an explicit owner instruction

then it is not a requirement.

Classify every used statement as:

- Confirmed Requirement
- Recommendation
- Assumption
- Open Decision

---

## 4. Review System-Wide Impact

Before adding or changing a feature, evaluate impact on:

- Database
- Backend
- API
- Frontend
- Permissions
- Tenant isolation
- Audit logs
- Notifications
- Reports
- Customer portal
- Security
- Existing workflows
- Future scalability

---

## 5. Protect Core Boundaries

Always preserve:

- Multi-tenancy
- Security
- Permissions
- Financial accuracy
- Shipment lifecycle consistency

Do not modify previous business logic without explaining the change and recording it.

---

## 6. Running Code Is Not Completion

A task is not complete because the code works.

Follow `docs/rules/DEFINITION_OF_DONE.md` at the correct done-level.

---

## 7. Documentation After Important Changes

After every important task:

- Update the task file
- Update `docs/project/CURRENT_STATE.md`
- Update `docs/project/CHANGELOG.md` for actual changes
- Record new decisions in `docs/project/DECISIONS.md`
- Record new open questions and assumptions when they appear
- Update module documentation if the module already exists

Do not create extra narrative markdown files outside this system.

---

## 8. Language

- Source code, comments, identifiers, schema names, routes, and code file names: English only.
- Documentation and task files: English only.
- Conversation with the owner: Arabic only.

Use clear names. Do not abbreviate without a strong reason.

---

## 9. Engineering Quality

- Separate business logic from UI and infrastructure.
- Do not duplicate logic.
- Do not put secrets in code.
- Handle errors in a structured way.
- Write testable code.
- Respect module boundaries.
- Never trust client data.
- Never take `tenant_id` from a normal request to decide data ownership.

---

## 10. Scope Discipline

- Distinguish MVP, Phase 2, and Future.
- Do not implement Future features during MVP because they might be useful later.
- If a new idea appears during Refinement or Implementation, return it to Analysis.
- If a new request conflicts with prior architecture or a confirmed rule, stop and flag the conflict before deciding.

---

## 11. Task Lifecycle

Follow `docs/process/TASK_LIFECYCLE.md`.

Create or update a task file under `tasks/active/` for non-trivial work.

Move completed tasks to `tasks/completed/` after Review is approved.

---

## 12. Technology Decisions

Do not treat language, framework, database, cloud, storage, or authentication provider as final until:

1. Related analysis is complete enough
2. Alternatives are considered
3. An ADR is recorded
4. The owner accepts the decision
