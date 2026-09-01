# RAANKO — Agent Operating Instructions

This file is mandatory for every AI agent working on RAANKO.

RAANKO is a multi-tenant logistics and freight management SaaS platform. It is not a single shipping company product, not a shipment-tracking app, and not a disposable prototype.

Read this file first. Then read `docs/project/CURRENT_STATE.md`. Then read only the documents required for the current task.

---

## 1. Absolute Rule

Do not start analysis, design, implementation, refinement, or review of a task until the task goal is explicit and the material questions below have answers that are good enough to proceed.

If the goal is unclear, ask. Do not invent missing business rules and treat them as facts.

---

## 2. Required Intake Questions

Every task must start by answering:

1. What is the commercial goal of this task?
2. Which user benefits from it?
3. What problem does it solve?
4. What is the expected outcome?
5. How will we know the task succeeded?
6. Is the task MVP, Phase 2, or Future?
7. What information is confirmed?
8. What decisions are still open?
9. What temporary assumptions are in use?
10. What constraints must be respected?
11. Which existing parts of RAANKO may be affected?
12. Which development phase is this task in right now?

After answering, produce this summary before doing the work:

```markdown
## Task Goal
## Business Value
## Target Users
## Confirmed Requirements
## Acceptance Criteria
## Constraints
## Assumptions
## Open Decisions
## Current Development Phase
```

Do not move to work until the goal is clear.

---

## 3. Required Reading Order

When returning to the project or starting a non-trivial task, read in this order:

1. `AGENTS.md`
2. `docs/project/CURRENT_STATE.md`
3. `docs/rules/WORK_RULES.md`
4. `docs/process/DEVELOPMENT_WORKFLOW.md`
5. `docs/process/PHASE_GATES.md`
6. Task file under `tasks/active/`
7. Relevant sections of `PROJECT_CONTEXT.md`
8. Relevant files under `docs/project/`, `docs/roadmap/`, `docs/architecture/`, and `docs/modules/`

Do not reload the entire repository documentation for a small, already-scoped task.

---

## 4. Development Phases

The only allowed forward path is:

Analysis → Design → Implementation → Refinement → Review

You may move backward. You must not skip forward.

- No design or code during Analysis.
- No implementation before the Design gate is approved.
- No new features during Refinement. New ideas return to Analysis.
- Review decides the destination. It does not silently mutate scope.

User approval is required to pass a phase gate.

---

## 5. Classification Discipline

Every statement used in work must be classified as one of:

- **Confirmed Requirement**
- **Recommendation**
- **Assumption**
- **Open Decision**

Never present a recommendation or assumption as a confirmed requirement.

Do not invent requirements. If a rule is not in `PROJECT_CONTEXT.md`, `docs/project/REQUIREMENTS.md`, an accepted ADR, or an explicit user instruction, it is not confirmed.

---

## 6. Language Rules

- Conversation with the project owner: Arabic only.
- All source code, comments, identifiers, database names, fields, functions, classes, types, routes, components, folders, and code file names: English only.
- Project documentation and task files: English only, unless the owner explicitly requests otherwise.

Do not create `.md` files except when the owner requests them or when an approved task in this governance system requires a documentation update.

---

## 7. Multi-Tenant Rule

One platform. One maintainable codebase. Many independent shipping companies.

Never propose a separate application codebase per shipping company unless an exceptional Enterprise requirement is explicitly introduced later.

For every tenant-owned feature, answer:

1. Who owns this data?
2. Is it GLOBAL or TENANT_SCOPED?
3. How is the current tenant resolved?
4. How is tenant ownership enforced?
5. Can another tenant guess the resource ID?
6. What happens if they try?
7. Does cache respect tenant boundaries?
8. Do background jobs preserve tenant context?
9. Do uploaded files respect tenant ownership?
10. Are reports scoped correctly?
11. Are audit logs tenant-aware?
12. Does this feature depend on subscription entitlements?
13. Does the employee also require a specific permission?

A tenant-owned feature is not complete until these questions have been evaluated.

Never trust `tenant_id` from a normal client request as proof of ownership. Resolve tenant from trusted server-side context.

---

## 8. Security and Permissions

- Tenant isolation is a security boundary, not a frontend filter.
- Object-level authorization is mandatory for tenant-owned resources.
- Financial permissions are separate from operational permissions.
- Customers must never see buy prices, profit margin, internal notes, or internal documents.
- Public tracking must never expose sensitive or financial data.
- Protected financial records, shipments, invoices, payments, and documents must not be hard-deleted casually.
- Do not log secrets or sensitive payloads.

---

## 9. Scope Control

- Distinguish MVP, Phase 2, and Future on every task.
- Do not implement Future features during MVP because they might be useful later.
- Architecture and data models must not make later modules nearly impossible.
- Do not choose language, framework, database, cloud, storage, or auth provider as final until the related analysis and decision are recorded.

---

## 10. Change Control

- Do not silently change confirmed business logic.
- If a new request conflicts with prior architecture or a business rule, stop and flag the conflict before deciding.
- Record accepted decisions in `docs/project/DECISIONS.md`.
- Record actual changes in `docs/project/CHANGELOG.md`.
- Keep `docs/project/CURRENT_STATE.md` accurate after every important task.
- Move completed tasks from `tasks/active/` to `tasks/completed/`.

---

## 11. Definition of Done

Code that runs is not done.

Follow `docs/rules/DEFINITION_OF_DONE.md` at the correct level:

- Task Done
- Feature Done
- Module Done
- Phase Done
- Release Done

---

## 12. Output Rules

Before implementation, think in this order:

Business requirement → User flow → Business rules → Data model → Permissions → Edge cases → API → UI → Security → Implementation

When implementation is allowed, keep diffs focused on the task. Do not add unsolicited extra features, refactors, or markdown files.

After each completed phase of a task, present the result to the owner and wait for approval before advancing.
