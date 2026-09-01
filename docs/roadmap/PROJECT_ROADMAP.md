# Project Roadmap

This is a high-level product roadmap. It is not a technology plan.

No architecture, database, or stack is selected here.

---

## Phase 0 — Governance

Status: In review via TASK-0001

- Agent operating rules
- Master context
- Work rules and definition of done
- Task workflow
- Requirements and decision records

---

## Phase 1 — System Analysis

Status: Next

Goal: understand the domain and freeze MVP capability boundaries.

Includes:

- Actor and permission map
- End-to-end operational workflows
- Entity inventory and GLOBAL / TENANT_SCOPED classification
- MVP versus later-capability freeze
- Critical open questions that block design

Does not include:

- Final technology selection unless a blocking decision is explicitly taken
- Database DDL
- Application code

---

## Phase 2 — Platform Foundation Design

Status: Not started

Depends on Phase 1.

Includes design of:

- Modular system shape
- Multi-tenancy enforcement model
- Identity, membership, and RBAC
- Tenant provisioning
- Entitlements
- Audit, files, jobs, and notification principles
- Technology recommendation and ADR

Implementation starts only after this design is approved.

---

## Phase 3 — MVP Implementation

Status: Not started

Build in vertical slices, generally:

1. Identity, tenants, branches, employees, roles, entitlements
2. CRM and suppliers
3. Quotes, pricing, bookings
4. Shipments, timeline, tracking, public tracking
5. Documents
6. Invoices, payments, profitability
7. Customer portal
8. Notifications, reports, search, import
9. Super Admin subscriptions and usage
10. Localization and company branding

Each slice follows Analysis → Design → Implementation → Refinement → Review.

---

## Phase 4 — MVP Hardening and Launch Readiness

Status: Not started

- Security isolation tests
- Performance of core lists and dashboards
- Onboarding polish
- Backup and operational runbooks at a practical level
- Release Done checklist

---

## Phase 5 — Phase 2 Product

Status: Future

Candidate capabilities after MVP:

- Custom domains
- Richer entitlements and billing operations
- Webhooks
- Broader integrations
- Consolidation support as a first-class workflow
- Support impersonation with full audit

---

## Phase 6 — Future Platform

Status: Future

- Warehouse management
- Fleet management
- GPS tracking
- Native customer and driver apps
- Carrier and airline APIs
- Accounting integrations
- Electronic payments and signatures
- AI document processing
