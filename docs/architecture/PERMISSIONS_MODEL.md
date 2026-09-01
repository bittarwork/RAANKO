# Permissions Model

Status: Confirmed principles. Detailed matrix is pending module analysis.

---

## Two Administration Layers

- RAANKO Super Admin: platform
- Company Admin / Company Owner: one tenant

These must never be mixed.

---

## Membership

Access to a tenant is through membership.

MVP UI may use one active tenant per session.

The model must remain able to support multiple memberships later.

---

## Initial Tenant Roles

- Company Owner
- Company Admin
- Branch Manager
- Sales
- Shipping Operations
- Accountant
- Customer Service
- Warehouse Employee — Future
- Driver — Future

Role names are not a sufficient permission system.

Permissions must be configurable per role and module.

---

## Permission Actions

Where applicable:

- View
- Create
- Update
- Delete
- Approve
- Export

---

## Confirmed Permission Areas

At minimum, roles can be granted or denied capabilities over:

- Customers
- Quotes, including approve
- Shipments, including status change
- Bookings
- Documents
- Financial data
- Invoices
- Payments
- Reports
- Employees
- Settings
- Suppliers
- Branches

Financial permissions are separate from operational permissions.

---

## Customer Portal Permissions

A customer user sees only their own allowed records.

Never visible to customers:

- Buy prices
- Profit margin
- Internal notes
- Internal documents

---

## Public Tracking

Unauthenticated tracking sees only public shipment events and non-sensitive shipment facts.

---

## Entitlements vs Permissions

- Entitlements decide whether a tenant may use a feature at all
- Permissions decide whether a specific user in that tenant may perform an action

Both checks are required.

---

## Next Work

During system analysis, produce a permission matrix per MVP module.
Do not hard-code the matrix only in UI components.
