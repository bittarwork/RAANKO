# Task Lifecycle

Every owner request to the AI agent follows this lifecycle.

---

## 1. Register the Task

Create or update a file:

`tasks/active/TASK-NNNN-short-slug.md`

Use the template in `tasks/templates/TASK_TEMPLATE.md`.

---

## 2. Determine the Goal

Answer the intake questions in `AGENTS.md`.

Write the required summary in the task file:

- Task Goal
- Business Value
- Target Users
- Confirmed Requirements
- Acceptance Criteria
- Constraints
- Assumptions
- Open Decisions
- Current Development Phase

Do not start the work until the goal is clear.

---

## 3. Classify the Task

One of:

- Requirement
- Bug
- Improvement
- Decision

---

## 4. Determine Current Phase

One of:

- Analysis
- Design
- Implementation
- Refinement
- Review

---

## 5. Determine Affected Module

Name the module or shared concern, for example:

- authentication
- tenants
- customers
- quotes
- bookings
- shipments
- documents
- accounting
- subscriptions
- platform-governance

---

## 6. Analyze Impact

Record impact on:

- Tenant isolation
- Security
- Permissions
- Financial data
- Existing workflows
- Documentation

---

## 7. Execute Only the Current Phase

Do not perform later-phase work.

---

## 8. Present the Result

Show the owner the phase output and wait for approval before advancing.

---

## 9. Update Project Records

When the phase or task ends:

- Update the task file
- Update `docs/project/CURRENT_STATE.md`
- Update `docs/project/CHANGELOG.md` if something actually changed
- Record decisions, assumptions, and open questions
- Update module docs if they exist

---

## 10. Advance Only Through a Gate

Move to the next phase only when `docs/process/PHASE_GATES.md` is satisfied.

---

## 11. Close the Task

After Review is approved:

- Set review result
- Move the file to `tasks/completed/`
- Update current state and changelog

---

## Task File Location Examples

- Active: `tasks/active/TASK-0001-project-foundation.md`
- Completed: `tasks/completed/TASK-0001-project-foundation.md`
