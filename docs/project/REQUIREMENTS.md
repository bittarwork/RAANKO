# Requirements

This file lists confirmed platform-level requirements extracted from `PROJECT_CONTEXT.md`.

Module-level requirements will be detailed under `docs/modules/<module>/REQUIREMENTS.md` when that module enters Analysis.

Status values: Confirmed, Draft, Deferred, Rejected.

Priority values: MVP, Phase 2, Future.

Do not add requirements here from assumptions.

---

## REQ-PLT-001

Title: Multi-tenant SaaS platform

Status: Confirmed

Priority: MVP

Description:
RAANKO is one central application serving many independent shipping companies. Each company is a tenant with isolated data, branding, users, and operations. RAANKO is not itself a shipping company.

Acceptance Criteria:
- One codebase serves all tenants.
- A new company is onboarded by provisioning and configuration, not by deploying a separate application copy.
- No tenant can access another tenant's data.

---

## REQ-PLT-002

Title: Separate platform administration and company administration

Status: Confirmed

Priority: MVP

Description:
RAANKO Super Admin manages the platform. Company Admin manages one tenant. These layers must not be confused.

Acceptance Criteria:
- Super Admin can manage companies, plans, subscriptions, usage, and platform settings.
- Company Admin cannot access platform-level administration.
- Super Admin does not perform daily shipping operations unless a dedicated support permission exists.

---

## REQ-PLT-003

Title: Multiple interfaces from one platform

Status: Confirmed

Priority: MVP

Description:
The platform includes Super Admin dashboard, shipping company dashboard, employee interfaces, customer portal, public tracking, and versioned APIs. Native mobile apps are future.

Acceptance Criteria:
- Company operational users work in a company dashboard.
- Customers can use a customer portal.
- Public tracking is available without full dashboard login.
- APIs are versioned, for example `/api/v1/`.

---

## REQ-TNT-001

Title: Tenant identifier and slug

Status: Confirmed

Priority: MVP

Description:
Every tenant has an immutable unique internal identifier and a human-readable unique slug used in URLs.

Acceptance Criteria:
- Internal tenant identifier never changes when the slug is renamed.
- Slug is unique, lowercase, URL-safe, and validated against reserved words.
- Subdomain can help identify the tenant.
- Subdomain alone is never authorization.

---

## REQ-TNT-002

Title: Server-side tenant context

Status: Confirmed

Priority: MVP

Description:
Protected operations run inside a trusted tenant context derived from authentication and membership, not from client-supplied ownership IDs.

Acceptance Criteria:
- Normal create/read/update/delete/export/search/report/download operations do not trust client `tenant_id` as proof of ownership.
- Object-level authorization denies cross-tenant resource access without leaking the other tenant's data.
- Related tenant-scoped records must belong to the same tenant.

---

## REQ-TNT-003

Title: Global versus tenant-scoped data

Status: Confirmed

Priority: MVP

Description:
Entities are classified as GLOBAL or TENANT_SCOPED before schema design. `tenant_id` is not added blindly to every table.

Acceptance Criteria:
- Every entity in a design has an explicit classification.
- Tenant-scoped records enforce tenant ownership.
- Global records are not treated as company-private data.

---

## REQ-TNT-004

Title: Automated tenant provisioning

Status: Confirmed

Priority: MVP

Description:
Creating a company from Super Admin provisions the tenant environment.

Acceptance Criteria:
- Provisioning creates tenant identity, company profile, owner account invitation, default roles/permissions, settings, subscription/plan entitlements, numbering configuration, and subdomain assignment.
- Default branch is created when required.
- Provisioning is automated as much as practical and should be transaction-safe and idempotent where practical.

---

## REQ-TNT-005

Title: Company and subscription lifecycle

Status: Confirmed

Priority: MVP

Description:
Company status and subscription status are related but distinct. Suspension preserves data. Permanent deletion is delayed and privileged.

Acceptance Criteria:
- Company can be pending, trial, active, past due, suspended, cancelled, or archived.
- Suspension blocks company login and API access without deleting data.
- Reactivation restores access without recreating the company.
- Permanent deletion is not immediate.

---

## REQ-TNT-006

Title: Tenant branding and white label

Status: Confirmed

Priority: MVP

Description:
Each company has its own visual identity. Documents sent to its customers use that identity, not RAANKO identity.

Acceptance Criteria:
- Logo, colors, company information, and document branding are tenant settings.
- Frontend loads branding dynamically after tenant resolution.
- No shipping company identity is hardcoded in the application.

---

## REQ-ORG-001

Title: Branches

Status: Confirmed

Priority: MVP

Description:
A tenant may have multiple branches. Employees, shipments, customers, reports, and some settings can be branch-aware.

Acceptance Criteria:
- A company can create multiple branches.
- An employee can be linked to one or several branches.
- A shipment can be linked to a branch.
- Reports can be filtered by branch.

---

## REQ-IAM-001

Title: Authentication

Status: Confirmed

Priority: MVP

Description:
Users authenticate securely, with password reset, email verification, login activity, and 2FA support.

Acceptance Criteria:
- Passwords are hashed.
- Sessions or tokens are protected.
- Password reset and email verification exist.
- 2FA is supported.
- Login activity can be recorded.

---

## REQ-IAM-002

Title: Membership-based access

Status: Confirmed

Priority: MVP

Description:
Users are linked to tenants through membership, role, and permissions. The data model must not block future multi-company membership even if MVP UI exposes one company at a time.

Acceptance Criteria:
- Access is granted through tenant membership, not only a single hardcoded company field on the user.
- Company Owner or Company Admin exists for each tenant.

---

## REQ-IAM-003

Title: Fine-grained RBAC

Status: Confirmed

Priority: MVP

Description:
Initial roles exist, but permissions are configurable per role and module with View / Create / Update / Delete / Approve / Export as applicable.

Acceptance Criteria:
- Roles can be assigned to memberships.
- Permissions can be configured rather than only hardcoded by role name.
- Financial permissions are separate from operational permissions.
- Users cannot access modules they lack permission for.

---

## REQ-CRM-001

Title: Customer CRM

Status: Confirmed

Priority: MVP

Description:
Each tenant manages its customers, including profile, history, activities, attachments, and assigned salesperson.

Acceptance Criteria:
- Customers are tenant-scoped.
- Person and company customer types are supported.
- Shipment parties include customer, shipper, consignee, and notify party.
- Customer activity timeline is stored.

---

## REQ-SUP-001

Title: Supplier and carrier management

Status: Confirmed

Priority: MVP

Description:
Each tenant manages suppliers and carriers used to buy logistics services.

Acceptance Criteria:
- Suppliers are tenant-scoped.
- Multiple supplier types are supported.
- Supplier contact, services, currency, payment terms, notes, and rating can be stored.

---

## REQ-PRC-001

Title: Buy and sell pricing

Status: Confirmed

Priority: MVP

Description:
The system distinguishes buy rate and sell rate, supports additional charges, and calculates cost, selling price, gross profit, and margin.

Acceptance Criteria:
- A charge can have buy rate, sell rate, quantity, unit, currency, tax, and supplier.
- Totals for buying cost, selling price, gross profit, and profit margin are calculated.
- Customers cannot see buy prices or margin.

---

## REQ-QTE-001

Title: Quotes and PDF quotations

Status: Confirmed

Priority: MVP

Description:
Sales can create quotes, send them, and generate branded PDFs. Accepted quotes convert to bookings without re-entry.

Acceptance Criteria:
- Quote statuses include Draft, Sent, Viewed, Accepted, Rejected, Expired, and Cancelled.
- Quote numbering is tenant-specific.
- PDF uses tenant branding.
- Accepted quote can create a booking with transferred data.

---

## REQ-QTE-002

Title: Customer quote request

Status: Confirmed

Priority: MVP

Description:
A customer can submit an RFQ that Sales can convert into a quote.

Acceptance Criteria:
- RFQ is tenant-scoped and visible to permitted sales users.
- RFQ can include mode, origin, destination, cargo, weight, CBM, package type, pickup/delivery flags, notes, and attachments.

---

## REQ-BKG-001

Title: Bookings

Status: Confirmed

Priority: MVP

Description:
A booking can be created from an accepted quote and can later create a shipment. Direct shipment creation without a quote is also allowed.

Acceptance Criteria:
- Booking belongs to the current tenant.
- Booking can be created from an accepted quote.
- Shipment can be created from a booking.
- Direct shipment creation remains possible.

---

## REQ-SHP-001

Title: Create and manage shipments

Status: Confirmed

Priority: MVP

Description:
A permitted tenant employee can create and manage shipments, including cargo, parties, route, dates, and financial summary.

Acceptance Criteria:
- Shipment belongs to the current tenant.
- Customer and other tenant-scoped relations belong to the same tenant.
- Shipment number / tracking number follows tenant numbering settings and is unique.
- Creation is recorded in audit log.
- Financial summary is visible only with financial permission.

---

## REQ-SHP-002

Title: Configurable shipment workflow, timeline, and tracking

Status: Confirmed

Priority: MVP

Description:
Shipment statuses should be configurable by workflow. Every shipment has a timeline. Public and internal events are separated. Manual, external, and GPS events are conceptually separated.

Acceptance Criteria:
- Status workflow is not hardcoded as one list for every mode.
- Timeline events include status, title, description, date/time, location, employee, and visibility.
- Public tracking shows only public information.
- Customer-facing tracking updates when the company records an update.

---

## REQ-SHP-003

Title: Extensible transport modes and cargo

Status: Confirmed

Priority: MVP

Description:
Support sea, air, road, and vehicle shipping, plus FCL/LCL/FTL/LTL where relevant. Cargo can have multiple items and automatic CBM from dimensions.

Acceptance Criteria:
- New modes and types can be added without radical schema redesign.
- CBM is calculated when dimensions are present.

---

## REQ-DOC-001

Title: Document management and generated PDFs

Status: Confirmed

Priority: MVP

Description:
Documents can be uploaded, previewed, downloaded, and generated. Visibility and authorization are mandatory.

Acceptance Criteria:
- Documents are tenant-scoped.
- Visibility can be Internal, Customer Visible, or Supplier Visible.
- Download requires authorization.
- Quote, invoice, receipt, and delivery order PDFs can be generated with tenant identity.

---

## REQ-FIN-001

Title: Invoices, payments, and shipment profitability

Status: Confirmed

Priority: MVP

Description:
The system supports customer invoices, supplier invoices, payments, expenses, taxes, outstanding amounts, and shipment profitability. It is not a full ERP in MVP.

Acceptance Criteria:
- Customer and supplier invoices can be linked to shipments.
- Partial and multiple payments are supported.
- Profit uses revenue minus actual costs.
- Financial edits are audit-logged.
- Protected financial records are not casually hard-deleted.

---

## REQ-FIN-002

Title: Multi-currency and configurable tax

Status: Confirmed

Priority: MVP

Description:
Each company has a base currency and may transact in other currencies. Taxes are configurable and not hardcoded to one country.

Acceptance Criteria:
- Quotes, invoices, and costs can use currencies other than the company base currency.
- Exchange rates can be added later without rewriting the financial model.
- Tax rules are configurable per tenant/country needs.

---

## REQ-POR-001

Title: Customer portal

Status: Confirmed

Priority: MVP

Description:
Customers of a shipping company can use a portal for quotes, bookings, shipments, documents, invoices, payments, support requests, and notifications, without seeing internal data.

Acceptance Criteria:
- Portal data is limited to the customer's own records inside the tenant.
- Buy prices, margin, internal notes, and internal documents are hidden.

---

## REQ-NTF-001

Title: Notification center

Status: Confirmed

Priority: MVP

Description:
In-app and email notifications are required. The system should be event-driven. Push, WhatsApp, and SMS are future.

Acceptance Criteria:
- Operational and financial events can create notifications.
- Notifications are tenant-aware.
- Recipients only receive information they are allowed to see.

---

## REQ-RPT-001

Title: Company reports, dashboard, search, and export

Status: Confirmed

Priority: MVP

Description:
Each company has an operations dashboard, tenant-scoped search, reports, and Excel/PDF export according to permissions.

Acceptance Criteria:
- Company reports automatically use current tenant context.
- Search inside the company dashboard returns only tenant data.
- Export respects permissions.

---

## REQ-AUD-001

Title: Audit trail

Status: Confirmed

Priority: MVP

Description:
Sensitive operations are audited and are not easy to delete.

Acceptance Criteria:
- Audit records include tenant, user, action, entity, entity ID, timestamp, and old/new values when needed.
- Company audit and platform security monitoring can be distinguished.

---

## REQ-I18N-001

Title: Localization and timezones

Status: Confirmed

Priority: MVP

Description:
Arabic and English are required from the start, with correct RTL and LTR. Time is stored in UTC and displayed in company or user timezone.

Acceptance Criteria:
- UI text is not hardcoded in components.
- Additional languages can be added later.
- No single timezone is assumed for the platform.

---

## REQ-SUB-001

Title: Subscriptions, plans, limits, and entitlements

Status: Confirmed

Priority: MVP

Description:
Tenants are linked to plans with limits and feature entitlements. Plan names and prices are not fixed. Tenant-specific overrides must be possible without code changes.

Acceptance Criteria:
- Feature access is determined by entitlements, not scattered plan-name checks.
- User, branch, storage, and feature limits can be applied.
- Super Admin can view usage and subscription status.

---

## REQ-IMP-001

Title: Excel import

Status: Confirmed

Priority: MVP

Description:
Customers, suppliers, rates, and pricing can be imported through a controlled Excel flow.

Acceptance Criteria:
- Import supports upload, preview, mapping, validation, error report, and confirm.
- Import runs as a tenant-aware background-capable process.

---

## REQ-SUPT-001

Title: Separated support streams

Status: Confirmed

Priority: MVP

Description:
RAANKO support tickets and shipping-company customer support requests are separate.

Acceptance Criteria:
- A company can open a ticket with RAANKO.
- A customer can open a support request with the shipping company.
- The two streams are not mixed.

---

## REQ-FUT-001

Title: Architecture must not block deferred modules

Status: Confirmed

Priority: Future

Description:
Warehouse, fleet, GPS, native apps, carrier APIs, payments, e-signature, webhooks, and AI are not MVP, but the architecture must not make them nearly impossible.

Acceptance Criteria:
- Shipment model can later support master/house consolidation.
- Event model can later distinguish manual, external, and GPS events.
- Entitlements can later gate deferred modules.
