# Definition of Done

A task, feature, module, phase, or release is not done because code runs.

Use the correct done-level. Completing a small task does not mean a module is complete.

---

## 1. Task Done

A task is done when:

- Goal and requirements are documented in the task file
- Acceptance criteria are met
- Work stayed inside the current phase
- Confirmed requirements were not replaced by assumptions
- Open questions that block the next phase are recorded
- Affected documentation is updated
- Owner has seen the result of the current phase

---

## 2. Feature Done

A feature is done when all of the following are true:

- Goal and requirements are documented
- Acceptance criteria are satisfied
- Tenant isolation is respected
- Permissions are verified
- Edge cases are handled
- Inputs are validated and protected
- Required tests pass
- No financial or sensitive data is leaked
- Impact on other modules was reviewed
- Documentation is updated
- New decisions are recorded
- `CURRENT_STATE.md` is updated
- `CHANGELOG.md` is updated
- No material unanswered questions remain
- Final feature review is completed

For tenant-owned features, the multi-tenant questions in `AGENTS.md` must also be evaluated.

---

## 3. Module Done

A module is done when:

- Module overview, requirements, business rules, user flows, data model, API, permissions, edge cases, and testing notes exist under `docs/modules/<module>/`
- MVP scope of the module is implemented
- Feature Done is true for every in-scope feature
- Cross-feature consistency is reviewed
- Tenant, permission, audit, and financial rules are consistent inside the module
- The module changelog is updated

---

## 4. Phase Done

A project development phase, for example MVP platform foundation, is done when:

- All in-scope modules for that phase meet Module Done or are explicitly deferred with owner approval
- Phase gate in `docs/process/PHASE_GATES.md` is passed
- Open questions that block the next phase are closed or explicitly accepted as residual risk
- `CURRENT_STATE.md` reflects the new phase

This is separate from the five-step task workflow. Do not confuse "Analysis phase of a task" with "MVP phase of the product".

---

## 5. Release Done

A release is done when:

- In-scope features meet Feature Done
- Security review for tenant isolation and permissions is complete
- Financial calculations used in the release are reviewed
- Localization for Arabic and English is complete for in-scope UI
- No critical defects remain
- Release notes exist in `CHANGELOG.md`
- Owner approval is recorded

---

## 6. Security and Data Checks Required for Feature Done

- Tenant isolation is enforced server-side
- Object-level authorization holds
- Customer-facing surfaces hide buy prices, margin, internal notes, and internal documents
- Public tracking hides sensitive and financial data
- Documents require authorization before download
- Protected financial records are not casually hard-deleted
- Audit trail exists for sensitive actions

---

## 7. Review Outcomes

Review does not have to fix every issue inside the review step.

Valid outcomes:

- Approved
- Approved With Minor Notes
- Returned To Analysis
- Returned To Design
- Returned To Implementation
- Returned To Refinement

Send the work back to the phase where the problem originated.
