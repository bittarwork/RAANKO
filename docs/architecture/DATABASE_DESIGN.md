# Database Design

Status: Logical inventory only. Physical schema is not started.

No database engine is selected. No tables should be created from this file yet.

---

## Design Rules

Before physical schema:

1. Understand the domain
2. Identify entities
3. Identify relationships
4. Classify GLOBAL vs TENANT_SCOPED
5. Identify business rules
6. Identify audit requirements
7. Identify soft-delete requirements
8. Identify financial relations
9. Identify future extensibility
10. Then design the database

---

## GLOBAL Candidates

These are currently classified as global or platform-level:

- Country
- Currency
- Platform configuration
- Plan
- Feature
- PlanFeature
- Global shipping mode catalog
- Ports and airports, pending ASM-006 confirmation

---

## TENANT_SCOPED Candidates

- Tenant / Company
- Branch
- Membership
- Role
- Permission assignment
- Tenant settings and branding
- Numbering rule
- Subscription
- TenantFeatureOverride
- Usage snapshot
- Customer
- Customer activity
- Supplier
- Rate / charge template
- Quote
- Quote charge
- Quote request / RFQ
- Booking
- Shipment
- Shipment item / cargo
- Shipment party
- Tracking event
- Document
- Customer invoice
- Supplier invoice
- Payment
- Expense
- Notification
- Company support ticket
- Customer support request
- Task
- Audit log for tenant actions
- Import job

---

## Platform-Level but Sensitive

- Super Admin users and platform roles
- Platform audit / security monitoring
- Support impersonation records, when implemented

These are not ordinary tenant records.

---

## User Model Note

User identity should be separable from membership.

A user may later belong to multiple tenants through memberships.

---

## Future Extensibility Watchpoints

- Master/house shipment
- Manual vs external vs GPS events
- Exchange rates
- Warehouse, fleet, and vehicle records
- Document versions

---

## Not Decided

- Engine
- Shared schema vs schema-per-tenant vs database-per-tenant
- Identifier format
- Exact table names
- Indexing
- RLS
