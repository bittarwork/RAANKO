# Coding Standards

This file contains technology-agnostic coding standards.

Do not add framework-specific rules here until the technology stack is accepted in `docs/project/DECISIONS.md`.

After stack selection, add separate sections for frontend, backend, database, and testing.

---

## 1. Language

- English only in source code, comments, identifiers, files, folders, schema names, routes, and tests.
- Names must be clear. Avoid unnecessary abbreviations.
- Prefer complete domain terms from `PROJECT_CONTEXT.md`, for example `tenant`, `shipment`, `quote`, `booking`, `consignee`.

---

## 2. Structure

- Separate business logic from UI and infrastructure.
- Keep module boundaries respected.
- Do not duplicate business rules across layers.
- A feature should have one authoritative place for a given business rule.

---

## 3. Trust and Input

- Never trust client data.
- Validate and sanitize all inputs.
- Validate uploaded files by type, size, and authorization.
- Never use a client-supplied `tenant_id` to decide data ownership on a normal tenant request.
- Resolve tenant from trusted server-side context.

---

## 4. Errors and Secrets

- Handle errors in a structured way.
- Do not put secrets, tokens, or credentials in code, commits, or client bundles.
- Do not log passwords, tokens, payment details, or unnecessary personal data.

---

## 5. Testability

- Write code that can be tested without the full UI.
- Tenant isolation tests are mandatory for tenant-owned operations.
- Do not consider a feature complete without the tests required by its acceptance criteria.

---

## 6. Data and Deletion

- Do not hard-delete protected financial records, shipments, invoices, payments, or documents casually.
- Prefer soft delete or archive according to the entity's rules.
- Keep auditability in mind when changing state.

---

## 7. Performance

- Use pagination and server-side filtering for lists.
- Do not load unbounded record sets.
- Keep heavy work off the main request where a queue is required.

---

## 8. Pending Stack-Specific Standards

The following will be added after decisions are accepted:

- Frontend component and state conventions
- Backend project layout
- Database naming and migration conventions
- API response conventions
- Test file layout
