# System Architecture

Status: Pending system analysis and an accepted architecture ADR.

Do not treat anything in this file as a final implementation plan.

---

## Confirmed Constraints

- One application and one maintainable codebase
- Many isolated shipping-company tenants
- Central RAANKO administration
- Modular enough to add warehouse, fleet, GPS, apps, and integrations later
- Security, tenant isolation, and audit are core
- Background processing must be possible for email, imports, reports, documents, and notifications
- Versioned APIs

---

## Recommendation, Not Decision

A modular monolith is currently the recommended starting shape because:

- The domain is tightly connected around tenant, quote, booking, shipment, document, and finance
- Premature microservices would add operational cost before product-market fit
- Clear module boundaries can allow later extraction

This remains ASM-001 until an architecture decision task is accepted.

---

## Interfaces

Expected interfaces, not yet designed:

- RAANKO Super Admin Dashboard
- Shipping Company Dashboard
- Customer Portal
- Public Tracking
- Versioned HTTP APIs

Native mobile applications are future clients of the same platform.

---

## Explicitly Not Decided

- Language and frameworks
- Deployment topology
- Database engine
- Physical tenancy strategy
- Queue technology
- Storage provider

---

## Next Work

Fill this file during platform foundation design after system analysis.
