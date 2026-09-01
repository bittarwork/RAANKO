# Phase Gates

A phase is not finished because work happened. It is finished when its gate is satisfied and the owner approves.

---

## Gate A — Analysis Complete

May pass only if:

- The commercial goal is clear
- Material requirements are documented
- Critical questions are resolved or explicitly parked with accepted risk
- Scope and out of scope are defined
- Acceptance criteria are testable
- MVP / Phase 2 / Future classification is stated
- Tenant, permission, and financial impact are identified at analysis level
- The owner approved the analysis

Forbidden if passing this gate: starting implementation.

---

## Gate B — Design Complete

May pass only if:

- Design covers the accepted requirements
- Entity relationships are not ambiguous
- Every new or changed entity is classified GLOBAL or TENANT_SCOPED
- Tenant isolation is explained
- Permissions are documented
- API and data contracts are consistent
- Edge cases are handled in the design
- Security threats relevant to the slice are addressed
- Background jobs, files, cache, and search impact are considered when relevant
- The owner approved the design

Forbidden if passing this gate: introducing unanalyzed requirements.

---

## Gate C — Implementation Complete

May pass only if:

- Code for the accepted design is complete
- Required tests pass
- Requirements in scope are implemented
- No critical defects remain
- Documentation for the change is updated
- The change is reviewable
- No Future-scope extras were added

---

## Gate D — Refinement Complete

May pass only if:

- Agreed polish items are done
- No new feature entered this phase
- Known edge cases in scope are handled
- Quality issues found in implementation are addressed or returned

---

## Gate E — Review Complete

May pass only if a formal result is recorded:

- Approved
- Approved With Minor Notes
- or returned to a previous phase

Approved With Minor Notes still requires the notes to be tracked.

A slice is not release-ready until Feature Done or Module Done in `docs/rules/DEFINITION_OF_DONE.md` is satisfied at the intended level.

---

## Gate Failure Rule

If a gate fails, stay in the current phase or return backward.

Never skip a failed gate by starting the next phase.
