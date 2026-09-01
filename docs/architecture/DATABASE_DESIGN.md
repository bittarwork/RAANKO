# Database Design

Status: Logical design accepted. Physical DDL is not started.

Engine: PostgreSQL (ADR-009)

Physical strategy: shared schema with `tenant_id` on TENANT_SCOPED tables.

Primary identifiers: ULID for primary keys where string IDs are used (ADR-012).

---

## Design Rules

Before writing DDL:

1. Classify GLOBAL vs TENANT_SCOPED vs PLATFORM
2. Define relationships and ownership
3. Define business numbers separately from primary keys
4. Define audit and soft-delete requirements
5. Define financial locking rules
6. Define indexes after query patterns are known

---

## GLOBAL

| Entity | Notes |
|---|---|
| Country | Reference data |
| Currency | Reference data |
| GlobalShippingMode | Sea, Air, Road, etc. |
| Port | Pending Arabic aliases in Phase 2 |
| Airport | Pending Arabic aliases in Phase 2 |
| PlatformConfig | System-wide settings |
| Plan | Commercial plan definition without fixed prices in code |
| Feature | Entitlement feature catalog |
| PlanFeature | Plan to feature mapping |

---

## PLATFORM

| Entity | Notes |
|---|---|
| User | Global identity; may belong to many tenants |
| PlatformRole | Super Admin, Support Agent |
| PlatformAuditLog | Platform security and admin actions |
| RaankoSupportTicket | Company to RAANKO support |

---

## TENANT_SCOPED

| Entity | Notes |
|---|---|
| Tenant | Company workspace root |
| TenantSettings | Language, currency, timezone, tax defaults |
| TenantBranding | Logo, colors, document branding |
| Branch | Includes default Main Branch |
| Membership | User to tenant link |
| Role | Preset and customizable tenant roles |
| PermissionAssignment | Role and permission mapping |
| NumberingRule | Quote, shipment, invoice, booking prefixes |
| Subscription | Trial, paid, status, dates |
| TenantFeatureOverride | Super Admin overrides |
| UsageSnapshot | Users, branches, storage, shipments |
| Customer | Person or company |
| CustomerActivity | Timeline, notes, tasks |
| Supplier | Includes carrier types |
| RateSheet | Supplier route/mode buy rates |
| ChargeTemplate | Fuel, BAF, etc. |
| QuoteRequest | RFQ from portal or internal |
| Quote | Versioned quote header |
| QuoteLine | Charges and discounts |
| Booking | One booking per quote in Beta |
| Shipment | Core operational record |
| ShipmentCargoItem | Cargo lines |
| ShipmentParty | Shipper, consignee, notify |
| ShipmentContainer | FCL container data |
| TrackingEvent | Public/internal timeline events |
| Document | Uploaded and generated files metadata |
| CustomerInvoice | AR |
| SupplierInvoice | AP |
| Payment | Includes refunds/reversals |
| CreditNote | Issued invoice corrections |
| Expense | Shipment-linked or overhead |
| ExchangeRate | Tenant manual rates |
| Notification | In-app notifications |
| NotificationPreference | Category preferences |
| CompanySupportRequest | Customer to company support |
| ImportJob | Excel import runs |
| TenantAuditLog | Tenant-owned sensitive actions |

---

## Key Relationships

```text
Tenant
  -> Branch
  -> Membership -> User
  -> Customer -> QuoteRequest -> Quote -> Booking -> Shipment
  -> Supplier -> RateSheet
  -> Shipment -> TrackingEvent
  -> Shipment -> Document
  -> Shipment -> CustomerInvoice / SupplierInvoice / Expense
  -> Payment -> CustomerInvoice
```

Beta constraints:
- One active shipment path per booking
- Quote versions share a quote family identifier
- Business numbers are unique per tenant, not globally

---

## Financial Integrity Rules

- Issued invoices are not hard-deleted
- Corrections use credit notes or controlled reversal payments
- Shipment profitability uses estimated values from quote/sell charges and actual values from supplier invoices and expenses
- Financial edits require audit logging

---

## Soft Delete and Archive

Soft delete or archived status preferred for:
- Customers
- Suppliers
- Documents where policy allows
- Protected financial records use status transitions instead of delete

---

## Indexing Priorities (Design Level)

High-frequency access paths:
- `(tenant_id, tracking_number)`
- `(tenant_id, quote_number)`
- `(tenant_id, invoice_number)`
- `(tenant_id, customer_id, created_at)`
- `(tenant_id, shipment_status)`
- `(tenant_id, branch_id, created_at)`

Full index design happens during physical schema design.

---

## Row Level Security

RLS is recommended after core tenant scoping is implemented and tested in application code.

RLS policies must mirror application tenant context, not replace it.

---

## Not Started

- Exact table and column names
- Migration files
- Materialized views
- Reporting read models
