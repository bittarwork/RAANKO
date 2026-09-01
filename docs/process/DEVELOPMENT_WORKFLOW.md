# Development Workflow

RAANKO work follows five phases.

The basic path is:

Analysis → Design → Implementation → Refinement → Review

You may move backward. You must not jump forward.

Forbidden:

- Analysis → Implementation
- Idea → Code
- Design → Review without implementation when implementation is required

---

## Phase 1: Analysis

No design artifacts that pretend to be final, and no code.

Determine:

- Commercial goal
- Problem
- Users
- Requirements
- Scope and out of scope
- User stories
- User flows
- Business rules
- Edge cases
- Required permissions
- Relationship to the rest of RAANKO
- Whether the work is MVP, Phase 2, or Future
- Open questions
- Testable acceptance criteria

Exit gate: see `docs/process/PHASE_GATES.md`.

Owner approval is required.

---

## Phase 2: Design

No implementation before the design is accepted.

Determine:

- Architecture impact
- Module boundaries
- Data model
- Entity relationships
- Tenant ownership classification
- API contracts
- Permission model
- UI structure
- Error handling
- Audit requirements
- Security threats
- Integration points
- Background jobs
- Notifications
- Migration strategy when needed

Do not finalize language, framework, database, cloud, storage, or auth provider before the related analysis exists and an ADR is accepted.

Exit gate: owner approval.

---

## Phase 3: Implementation

Code starts here.

Work in small tasks, generally in this order when applicable:

1. Database
2. Backend domain
3. Permissions
4. API
5. Frontend
6. Integrations
7. Automated tests
8. Documentation

Every implementation task must map to a requirement and an acceptance criterion.

Do not implement Future features during MVP because they might be useful later.

Exit gate: owner can review a complete, testable change.

---

## Phase 4: Refinement

Improve the result. Do not add random requirements.

May include:

- UX improvement
- Performance improvement
- Edge-case handling
- Better errors and messages
- Removing duplication
- Maintainability
- Accessibility
- Responsive behavior
- Query optimization
- Index review
- Security hardening
- Test quality

Any new feature discovered during refinement returns to Analysis.

---

## Phase 5: Review

Complete review before considering the slice ready.

Review includes:

- Functional review
- Business rules review
- Code review
- Security review
- Multi-tenant isolation review
- Permissions review
- Financial accuracy review when relevant
- UI/UX review when relevant
- Regression testing
- Documentation review
- Definition of Done review

Result must be one of:

- Approved
- Approved With Minor Notes
- Returned To Analysis
- Returned To Design
- Returned To Implementation
- Returned To Refinement

If a problem is found, return it to the phase that caused it. Do not silently patch a requirements problem during implementation.

---

## Mapping Problems Back

- Unclear requirement during implementation → return to Analysis
- Data model problem → return to Design
- Programming defect → return to Implementation
- Usability problem → return to Refinement

---

## Product Phases vs Task Phases

Do not confuse:

- The five-step workflow of a single task
- The product roadmap phases in `docs/roadmap/PROJECT_ROADMAP.md`

A task in Implementation can still belong to product MVP.
