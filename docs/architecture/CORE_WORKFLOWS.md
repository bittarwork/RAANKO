# Core Workflows

Status: Design accepted for MVP.

Sequence diagrams for primary business and platform flows. Implementation blocked until Design gate approval.

See ADR-010, ADR-011, `MULTI_TENANCY.md`, `AUTHENTICATION_DESIGN.md`.

---

## 1. Tenant Provisioning (Super Admin)

Super Admin is the only provisioning path in MVP (OQ-009).

```mermaid
sequenceDiagram
    autonumber
    actor SA as Super Admin
    participant UI as Platform UI
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Q as Redis Queue
    participant Email as Email Provider

    SA->>UI: Create company form
    UI->>API: POST /api/v1/platform/tenants
    API->>DB: Begin transaction
    API->>DB: Create Tenant + slug + subdomain
    API->>DB: Create Subscription (trial 60d)
    API->>DB: Apply plan entitlements
    API->>DB: Create default Main Branch
    API->>DB: Seed default roles + permissions
    API->>DB: Create numbering rules + settings
    API->>DB: Create Membership invite (Owner)
    API->>DB: Commit transaction
    API->>Q: Enqueue invitation email job
    Q->>Email: Send owner invitation
    API-->>UI: 201 Tenant created
    UI-->>SA: Show tenant detail + onboarding pending
```

Failure rules:

- Duplicate slug → `409 DUPLICATE`
- Transaction rolls back on any step failure
- Re-submit with same idempotency key returns existing tenant (Implementation detail)

---

## 2. Company Owner Onboarding

Progress is saved. Tenant becomes operational when required steps complete.

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Company Owner
    participant UI as Company UI
    participant API as NestJS API
    participant DB as PostgreSQL

    Owner->>UI: Open invitation link
    UI->>API: POST /auth/accept-invite
    API->>DB: Activate membership + set password
    Owner->>UI: Onboarding wizard
    UI->>API: PATCH /company/onboarding (step saves)
    API->>DB: Update TenantSettings + Branding
    Owner->>UI: Complete onboarding
    UI->>API: POST /company/onboarding/complete
    API->>DB: Mark onboarding complete
    API-->>UI: Redirect to dashboard
```

Onboarding steps (MVP):

1. Company profile confirmation
2. Branding (logo, colors)
3. Default currency, timezone, language
4. Tax and payment method defaults
5. Optional: first employee invite

---

## 3. Company Employee Login and Request Authorization

```mermaid
sequenceDiagram
    autonumber
    actor User as Employee
    participant UI as Company UI
    participant API as NestJS API
    participant DB as PostgreSQL

    User->>UI: Login at {slug}.raanko.com
    UI->>API: POST /auth/company/login
    API->>DB: Validate credentials + membership
    API->>DB: Load role permissions + entitlements + write mode
    API-->>UI: Access token + refresh cookie + permission snapshot
    User->>UI: Open shipments list
    UI->>API: GET /company/shipments (Bearer token)
    API->>API: Auth → tenant context → entitlement → permission → branch scope
    API->>DB: SELECT shipments WHERE tenant_id = ctx.tenantId [AND branch_id IN scope]
    API-->>UI: Paginated list (redacted fields by permission)
```

MVP: one active tenant per session. User must use correct subdomain (OQ-008 answered).

---

## 4. RFQ to Quote (Portal → Sales)

```mermaid
sequenceDiagram
    autonumber
    actor Cust as Customer (Portal)
    actor Sales as Sales User
    participant Portal as Portal UI
    participant Company as Company UI
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Q as Queue

    Cust->>Portal: Submit RFQ
    Portal->>API: POST /portal/rfq
    API->>API: Check write mode = full
    API->>DB: Create QuoteRequest
    API->>Q: Notify sales (in-app + email)
    Sales->>Company: Open RFQ inbox
    Company->>API: GET /company/rfq
    Sales->>Company: Create quote from RFQ
    Company->>API: POST /company/quotes
    API->>DB: Create Quote + lines (buy/sell charges)
    Sales->>Company: Approve and send quote
    Company->>API: POST /company/quotes/{id}/send
    API->>DB: Update quote status → sent
    API->>Q: Email quote PDF to customer
    API-->>Company: 200 Quote sent
```

Read-only tenant: portal RFQ submit returns `403 TENANT_READ_ONLY`.

---

## 5. Quote Acceptance to Booking

```mermaid
sequenceDiagram
    autonumber
    actor Cust as Customer
    actor Sales as Sales User
    participant Portal as Portal UI
    participant API as NestJS API
    participant DB as PostgreSQL

    Cust->>Portal: Accept quote
    Portal->>API: POST /portal/quotes/{id}/accept
    API->>DB: Quote status → accepted
    API->>Q: Notify sales
    Sales->>API: POST /company/bookings
    API->>DB: Create Booking from quote
    API->>DB: Link quote ↔ booking
    API-->>Sales: 201 Booking created
```

Beta constraint: one booking per accepted quote path.

---

## 6. Booking to Shipment (Operations)

```mermaid
sequenceDiagram
    autonumber
    actor Ops as Shipping Operations
    participant UI as Company UI
    participant API as NestJS API
    participant DB as PostgreSQL

    Ops->>UI: Create shipment from booking
    UI->>API: POST /company/shipments
    API->>DB: Create Shipment + parties + cargo
    API->>DB: Copy sell charges from quote/booking
    API->>DB: Generate tracking number
    API->>DB: Initial status from tenant workflow config
    Ops->>UI: Update status / add tracking event
    UI->>API: POST /company/shipments/{id}/events
    API->>DB: Create TrackingEvent
    API->>Q: Optional customer notification
```

Alternate path (no quote):

```text
POST /company/shipments (direct) → skip quote/booking linkage
```

---

## 7. Direct Shipment Creation (No Quote)

```mermaid
sequenceDiagram
    autonumber
    actor Ops as Shipping Operations
    participant API as NestJS API
    participant DB as PostgreSQL

    Ops->>API: POST /company/shipments (no quoteId)
    API->>API: Permission: shipments.shipments.create
    API->>DB: Create Shipment + manual charges
    API-->>Ops: 201 Shipment created
```

Profitability uses manually entered sell/supplier data when no quote exists.

---

## 8. Documents and Generated PDFs

```mermaid
sequenceDiagram
    autonumber
    actor User as Authorized User
    participant UI as Company UI
    participant API as NestJS API
    participant Q as Queue
    participant Store as Object Storage
    participant DB as PostgreSQL

    User->>UI: Generate quote PDF
    UI->>API: POST /company/quotes/{id}/generate-pdf
    API->>Q: Enqueue PDF job
    API-->>UI: 202 jobId
    Q->>API: Worker renders PDF
    API->>Store: Upload private object
    API->>DB: Create Document record (visibility rules)
    User->>UI: Download document
    UI->>API: GET /company/documents/{id}/download
    API->>API: Permission + tenant + visibility check
    API-->>UI: 302 signed URL
```

---

## 9. Customer Invoice and Payment

```mermaid
sequenceDiagram
    autonumber
    actor Acct as Accountant
    participant API as NestJS API
    participant DB as PostgreSQL

    Acct->>API: POST /company/invoices
    API->>DB: Create CustomerInvoice (draft)
    Acct->>API: POST /company/invoices/{id}/issue
    API->>DB: Status → issued (no hard delete after issue)
    Acct->>API: POST /company/payments
    API->>DB: Create Payment linked to invoice(s)
    API->>DB: Update outstanding balance
    API->>DB: Audit log financial mutation
    Acct->>API: GET /company/shipments/{id}/profitability
    API->>API: Require finance.profitability.view
    API->>DB: Compute revenue - supplier costs - expenses
    API-->>Acct: Profitability summary
```

Corrections after issue: credit note flow, not hard delete.

---

## 10. Supplier Invoice and Profit Calculation

```mermaid
sequenceDiagram
    autonumber
    actor Acct as Accountant
    participant API as NestJS API
    participant DB as PostgreSQL

    Acct->>API: POST /company/supplier-invoices
    API->>DB: Link to shipment
    API->>DB: Update actual cost on shipment
    Note over API,DB: Profit = revenue - supplier invoices - expenses
    Acct->>API: GET /company/shipments/{id}/profitability
    API-->>Acct: Net shipment profit (permission gated)
```

---

## 11. Public Tracking (Unauthenticated)

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Public User
    participant UI as Public UI
    participant API as NestJS API
    participant DB as PostgreSQL

    Guest->>UI: Open {slug}.raanko.com/track/{number}
    UI->>API: GET /public/track/{trackingNumber}
    API->>API: Resolve tenant from host
    API->>API: Rate limit by IP
    API->>DB: Find shipment by tracking number + tenant_id
    API->>API: Apply public field allowlist
    API-->>UI: Public timeline + non-sensitive facts only
```

Suspended tenant: public tracking remains for existing/active shipments (ADR-011).

---

## 12. Excel Import Job

```mermaid
sequenceDiagram
    autonumber
    actor User as Authorized User
    participant UI as Company UI
    participant API as NestJS API
    participant Q as Queue
    participant DB as PostgreSQL

    User->>UI: Upload Excel + column mapping
    UI->>API: POST /company/imports/jobs
    API->>DB: Create ImportJob (queued)
    API-->>UI: 202 pollUrl
    Q->>API: Worker validates rows
    API->>DB: Insert valid rows in batches
    API->>DB: Store error report for invalid rows
    API->>DB: ImportJob → completed / completed_with_errors
    User->>UI: Poll job status
    UI->>API: GET /company/imports/jobs/{id}
    API-->>UI: Summary + error download link
```

---

## 13. Tenant Lifecycle — Trial to Read-Only

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Scheduled Job
    participant API as NestJS API
    participant DB as PostgreSQL
    actor User as Company User
    actor Cust as Portal Customer

    Cron->>API: Check trial expiry
    API->>DB: Subscription → trial_expired
    API->>DB: Write mode → read_only
    User->>API: POST /company/shipments
    API-->>User: 403 TENANT_READ_ONLY
    Cust->>API: POST /portal/rfq
    API-->>Cust: 403 TENANT_READ_ONLY
    User->>API: GET /company/shipments
    API-->>User: 200 list (read allowed)
```

Super Admin manual activation restores full write mode.

---

## 14. Tenant Suspension

```mermaid
sequenceDiagram
    autonumber
    actor SA as Super Admin
    participant API as NestJS API
    participant DB as PostgreSQL
    actor User as Company User
    actor Guest as Public

    SA->>API: POST /platform/tenants/{id}/suspend
    API->>DB: Company status → suspended
    API->>DB: Revoke active company sessions
    User->>API: POST /auth/company/login
    API-->>User: 403 TENANT_ACCESS_BLOCKED
    Guest->>API: GET /public/track/{number}
    API-->>Guest: 200 (existing shipments only)
```

---

## 15. RAANKO Support Ticket

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Company Admin
    actor SA as Super Admin / Support
    participant API as NestJS API
    participant DB as PostgreSQL

    Admin->>API: POST /company/support/raanko-tickets
    API->>DB: Create RaankoSupportTicket
    SA->>API: GET /platform/support/tickets
    SA->>API: PATCH /platform/support/tickets/{id}
    API->>DB: Update status + thread
    API->>Q: Notify company admin
```

Separate from company customer support requests (`CompanySupportRequest`).

---

## Workflow Flexibility Summary

| Path | MVP Support |
|---|---|
| RFQ → Quote → Booking → Shipment | Yes |
| Quote → Shipment (skip explicit booking step) | Via booking creation |
| Direct Shipment (no quote) | Yes |
| Shipment → Invoice → Payment | Yes |
| Supplier invoice → Profit update | Yes |
| Credit note correction | Yes |
| Consolidation / Master-House | Future |

---

## Related Documents

- `UX_FLOWS.md`
- `API_CONTRACT_PRINCIPLES.md`
- `PERMISSIONS_MODEL.md`
