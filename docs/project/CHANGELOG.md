# Changelog

This file records what actually changed, not future plans.

---

## 2026-09-03

### Changed

- Approved TASK-0002 Implementation Planning and started MVP slice delivery.
- Implemented MVP slices 1–14 including auth, tenants, organization, CRM, suppliers, quotes, shipments, documents, finance, reports, notifications, support, portal, and Beta hardening.
- Parked OQ-005, OQ-010, OQ-012, and OQ-013 for Beta; public commercial launch still requires owner answers (prices not invented).
- Added Phase 2 APIs and Future entitlement-gated endpoints. Trial/Paid seeds do not enable Future features.

---

## 2026-09-01

### Added

- Initial project governance and documentation system.
- `AGENTS.md` mandatory agent operating instructions.
- `PROJECT_CONTEXT.md` master context.
- Work rules, definition of done, coding standards, and security rules.
- Five-phase development lifecycle, phase gates, and task lifecycle.
- Project roadmap, MVP scope, and future scope.
- Initial confirmed requirements, open questions, assumptions, and ADRs.
- Multi-tenancy and security architecture principle documents.
- Task and documentation templates.
- TASK-0001 project foundation task file.

### Changed

- Standardized tenant ownership terminology to `tenant_id`.
- Completed Discovery analysis Rounds 1–23 with owner approval to enter Design.
- Accepted ADR-008 through ADR-013 for stack, physical multi-tenancy, module boundaries, lifecycle behavior, identifiers, and Beta infrastructure.
- Superseded ADR-007 now that the technology stack is selected.
- Updated `SYSTEM_ARCHITECTURE.md`, `MULTI_TENANCY.md`, and `DATABASE_DESIGN.md` with platform foundation design.
- Answered open questions OQ-001, OQ-002, OQ-003, OQ-004, OQ-006, OQ-007, OQ-009, and OQ-011.
- Promoted architecture assumptions ASM-001, ASM-002, and ASM-003 into accepted ADRs.

### Changed (continued)

- Added `AUTHENTICATION_DESIGN.md` with session/token strategy, auth surfaces, login flows, and authorization pipeline.
- Expanded `PERMISSIONS_MODEL.md` with full MVP permission catalog and default role matrix.
- Updated `SECURITY_ARCHITECTURE.md` to reference built-in auth design.
- Added `API_CONTRACT_PRINCIPLES.md`, `CORE_WORKFLOWS.md`, and `UX_FLOWS.md`.
- Accepted ADR-014 for MVP auth UX and default permission policy.
- Answered OQ-008 (one tenant per session, no switcher in MVP).
- Updated `SYSTEM_ARCHITECTURE.md` and `CURRENT_STATE.md` — platform foundation design complete.
- Created `TASK-0002-implementation-planning.md` with 14 vertical slices for MVP delivery.
