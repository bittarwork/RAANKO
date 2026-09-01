# Permissions Model

Status: MVP permission catalog and default role matrix accepted.

See `AUTHENTICATION_DESIGN.md`, ADR-005, ADR-006, ADR-010.

---

## Two Administration Layers

- RAANKO Super Admin: platform namespace (`platform.*`)
- Company workspace: tenant namespace (module permissions below)

These must never be mixed in one role assignment.

---

## Membership

Access to a tenant is through `Membership`.

- MVP UI: one active tenant per session (OQ-008 answered)
- Data model supports multiple memberships per user

---

## Permission Key Format

```text
{domain}.{resource}.{action}
```

Actions used in MVP:

| Action | Meaning |
|---|---|
| `view` | Read/list/detail |
| `create` | Create new records |
| `update` | Edit existing records |
| `delete` | Soft-delete or archive where allowed |
| `approve` | Approve quotes and similar workflow steps |
| `export` | Excel/PDF export |
| `manage` | Full administrative control over the resource area |

Sensitive financial keys are separate from operational keys so buy prices and margins can be hidden without blocking shipment operations.

---

## Platform Permissions (Super Admin)

| Key | Description |
|---|---|
| `platform.tenants.view` | List and view companies |
| `platform.tenants.create` | Provision new tenant |
| `platform.tenants.update` | Edit tenant profile and lifecycle |
| `platform.tenants.suspend` | Suspend / reactivate tenant |
| `platform.subscriptions.manage` | Plans, trials, overrides |
| `platform.usage.view` | Usage snapshots |
| `platform.support.view` | RAANKO support tickets |
| `platform.support.manage` | Respond and close tickets |
| `platform.audit.view` | Platform audit logs |
| `platform.settings.manage` | Global platform configuration |
| `platform.users.manage` | Platform admin/support users |

Support Agent default: view tenants, view/respond support, view audit — no tenant provisioning or subscription overrides unless explicitly granted.

---

## Tenant Permission Catalog (MVP)

### Organization

| Key | Description |
|---|---|
| `organization.branches.view` | View branches |
| `organization.branches.manage` | Create/update branches |
| `organization.employees.view` | View employees and memberships |
| `organization.employees.manage` | Invite, edit, deactivate employees |
| `organization.roles.view` | View roles |
| `organization.roles.manage` | Create/edit roles and permission assignments |

### CRM

| Key | Description |
|---|---|
| `crm.customers.view` | View customers |
| `crm.customers.create` | Create customers |
| `crm.customers.update` | Edit customers |
| `crm.customers.delete` | Archive customers |
| `crm.customers.export` | Export customer list |
| `crm.activities.manage` | Notes, tasks, timeline activities |

### Suppliers and Rates

| Key | Description |
|---|---|
| `suppliers.suppliers.view` | View suppliers/carriers |
| `suppliers.suppliers.manage` | Create/edit/archive suppliers |
| `suppliers.rates.view` | View rate sheets and buy rates |
| `suppliers.rates.manage` | Edit rate sheets and charge templates |
| `suppliers.rates.import` | Excel rate import |

### Quotes and RFQ

| Key | Description |
|---|---|
| `quotes.rfq.view` | View RFQs |
| `quotes.rfq.manage` | Process RFQs from portal/internal |
| `quotes.quotes.view` | View quotes |
| `quotes.quotes.create` | Create quotes |
| `quotes.quotes.update` | Edit draft quotes |
| `quotes.quotes.approve` | Approve/send quotes |
| `quotes.quotes.delete` | Cancel/archive draft quotes |
| `quotes.quotes.export` | Export quote data |

### Bookings

| Key | Description |
|---|---|
| `bookings.bookings.view` | View bookings |
| `bookings.bookings.create` | Create bookings from quotes |
| `bookings.bookings.update` | Edit bookings |
| `bookings.bookings.delete` | Cancel bookings |

### Shipments and Tracking

| Key | Description |
|---|---|
| `shipments.shipments.view` | View shipments |
| `shipments.shipments.create` | Create shipments (direct or from booking) |
| `shipments.shipments.update` | Edit shipment details |
| `shipments.shipments.delete` | Cancel/archive shipments |
| `shipments.status.manage` | Change shipment status / timeline events |
| `shipments.tracking.manage` | Manage public/internal tracking events |

### Documents

| Key | Description |
|---|---|
| `documents.documents.view` | View and preview documents |
| `documents.documents.upload` | Upload documents |
| `documents.documents.download` | Download documents |
| `documents.documents.delete` | Archive documents |
| `documents.generated.create` | Trigger generated PDFs (quote, invoice, etc.) |

### Finance — Operational vs Sensitive

| Key | Description | Sensitivity |
|---|---|---|
| `finance.invoices.view` | View customer invoices | Standard financial |
| `finance.invoices.create` | Create/issue invoices | Standard financial |
| `finance.invoices.update` | Edit draft invoices | Standard financial |
| `finance.invoices.delete` | Void/credit-note path only; no hard delete | Standard financial |
| `finance.supplier_invoices.view` | View supplier invoices | Standard financial |
| `finance.supplier_invoices.manage` | Record supplier invoices | Standard financial |
| `finance.payments.view` | View payments | Standard financial |
| `finance.payments.manage` | Record payments and refunds | Standard financial |
| `finance.expenses.view` | View expenses | Standard financial |
| `finance.expenses.manage` | Record expenses | Standard financial |
| `finance.credit_notes.manage` | Issue credit notes | Standard financial |
| `finance.exchange_rates.manage` | Manage manual exchange rates | Standard financial |
| `finance.buy_prices.view` | View supplier buy rates on quotes/shipments | **Sensitive** |
| `finance.margins.view` | View margin on quote/shipment lines | **Sensitive** |
| `finance.profitability.view` | View shipment profitability reports | **Sensitive** |
| `finance.reports.view` | Financial reports and dashboards | Standard financial |
| `finance.reports.export` | Export financial reports | Standard financial |

Users with shipment access but without `finance.buy_prices.view` see sell-side operational data only.

### Reports and Search

| Key | Description |
|---|---|
| `reports.dashboard.view` | Operations dashboard |
| `reports.operational.view` | Operational reports |
| `reports.operational.export` | Export operational reports |
| `search.tenant.use` | Tenant-scoped global search |

### Settings

| Key | Description |
|---|---|
| `settings.company.view` | View company settings |
| `settings.company.manage` | Edit settings, branding, numbering, taxes, payment methods |
| `settings.notifications.manage` | Notification preferences for tenant |

### Support

| Key | Description |
|---|---|
| `support.company_requests.view` | View customer support requests |
| `support.company_requests.manage` | Respond to customer requests |
| `support.raanko_tickets.view` | View RAANKO tickets for this company |
| `support.raanko_tickets.create` | Open RAANKO support tickets |

### Import Jobs

| Key | Description |
|---|---|
| `imports.jobs.view` | View import job status |
| `imports.jobs.run` | Run Excel imports (customers, suppliers, rates) |

---

## Default Tenant Roles

Preset roles seeded at tenant provisioning. Company Owner may customize permission assignments except where noted.

| Role | Intent |
|---|---|
| Company Owner | Full tenant control including roles and settings |
| Company Admin | Full operations; same as Owner except role deletion restrictions (Recommendation) |
| Branch Manager | Branch-scoped operations and team oversight |
| Sales | CRM, quotes, customers, RFQ |
| Shipping Operations | Bookings, shipments, tracking, operational documents |
| Accountant | Full finance including sensitive profitability keys |
| Customer Service | Customers, portal support, operational shipment view |

Future roles (not in MVP seed): Warehouse Employee, Driver.

---

## Default Role Matrix

Legend: **Y** = granted, **—** = denied, **B** = granted with branch scope only

| Permission | Owner | Admin | Branch Mgr | Sales | Shipping Ops | Accountant | Customer Svc |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Organization** |
| organization.branches.view | Y | Y | B | — | — | — | — |
| organization.branches.manage | Y | Y | — | — | — | — | — |
| organization.employees.view | Y | Y | B | — | — | — | — |
| organization.employees.manage | Y | Y | — | — | — | — | — |
| organization.roles.view | Y | Y | — | — | — | — | — |
| organization.roles.manage | Y | Y | — | — | — | — | — |
| **CRM** |
| crm.customers.view | Y | Y | B | Y | Y | Y | Y |
| crm.customers.create | Y | Y | B | Y | — | — | Y |
| crm.customers.update | Y | Y | B | Y | — | — | Y |
| crm.customers.delete | Y | Y | — | — | — | — | — |
| crm.customers.export | Y | Y | B | Y | — | — | — |
| crm.activities.manage | Y | Y | B | Y | — | — | Y |
| **Suppliers** |
| suppliers.suppliers.view | Y | Y | B | Y | Y | Y | — |
| suppliers.suppliers.manage | Y | Y | — | — | Y | — | — |
| suppliers.rates.view | Y | Y | B | Y | Y | Y | — |
| suppliers.rates.manage | Y | Y | — | — | Y | — | — |
| suppliers.rates.import | Y | Y | — | — | Y | — | — |
| **Quotes** |
| quotes.rfq.view | Y | Y | B | Y | Y | — | Y |
| quotes.rfq.manage | Y | Y | B | Y | — | — | Y |
| quotes.quotes.view | Y | Y | B | Y | Y | Y | Y |
| quotes.quotes.create | Y | Y | B | Y | — | — | — |
| quotes.quotes.update | Y | Y | B | Y | — | — | — |
| quotes.quotes.approve | Y | Y | B | Y | — | — | — |
| quotes.quotes.delete | Y | Y | — | — | — | — | — |
| quotes.quotes.export | Y | Y | B | Y | — | — | — |
| **Bookings** |
| bookings.bookings.view | Y | Y | B | Y | Y | Y | Y |
| bookings.bookings.create | Y | Y | B | Y | Y | — | — |
| bookings.bookings.update | Y | Y | B | — | Y | — | — |
| bookings.bookings.delete | Y | Y | — | — | Y | — | — |
| **Shipments** |
| shipments.shipments.view | Y | Y | B | Y | Y | Y | Y |
| shipments.shipments.create | Y | Y | B | — | Y | — | — |
| shipments.shipments.update | Y | Y | B | — | Y | — | — |
| shipments.shipments.delete | Y | Y | — | — | Y | — | — |
| shipments.status.manage | Y | Y | B | — | Y | — | Y |
| shipments.tracking.manage | Y | Y | B | — | Y | — | Y |
| **Documents** |
| documents.documents.view | Y | Y | B | Y | Y | Y | Y |
| documents.documents.upload | Y | Y | B | Y | Y | — | Y |
| documents.documents.download | Y | Y | B | Y | Y | Y | Y |
| documents.documents.delete | Y | Y | — | — | Y | — | — |
| documents.generated.create | Y | Y | B | Y | Y | Y | — |
| **Finance** |
| finance.invoices.view | Y | Y | B | — | — | Y | — |
| finance.invoices.create | Y | Y | — | — | — | Y | — |
| finance.invoices.update | Y | Y | — | — | — | Y | — |
| finance.invoices.delete | Y | Y | — | — | — | Y | — |
| finance.supplier_invoices.view | Y | Y | — | — | — | Y | — |
| finance.supplier_invoices.manage | Y | Y | — | — | — | Y | — |
| finance.payments.view | Y | Y | B | — | — | Y | — |
| finance.payments.manage | Y | Y | — | — | — | Y | — |
| finance.expenses.view | Y | Y | B | — | — | Y | — |
| finance.expenses.manage | Y | Y | — | — | — | Y | — |
| finance.credit_notes.manage | Y | Y | — | — | — | Y | — |
| finance.exchange_rates.manage | Y | Y | — | — | — | Y | — |
| finance.buy_prices.view | Y | Y | — | Y | Y | Y | — |
| finance.margins.view | Y | Y | — | Y | — | Y | — |
| finance.profitability.view | Y | Y | B | — | — | Y | — |
| finance.reports.view | Y | Y | B | — | — | Y | — |
| finance.reports.export | Y | Y | — | — | — | Y | — |
| **Reports** |
| reports.dashboard.view | Y | Y | B | Y | Y | Y | Y |
| reports.operational.view | Y | Y | B | Y | Y | Y | Y |
| reports.operational.export | Y | Y | B | Y | — | Y | — |
| search.tenant.use | Y | Y | B | Y | Y | Y | Y |
| **Settings** |
| settings.company.view | Y | Y | B | — | — | Y | — |
| settings.company.manage | Y | Y | — | — | — | — | — |
| settings.notifications.manage | Y | Y | — | — | — | — | — |
| **Support** |
| support.company_requests.view | Y | Y | B | — | — | — | Y |
| support.company_requests.manage | Y | Y | B | — | — | — | Y |
| support.raanko_tickets.view | Y | Y | — | — | — | — | — |
| support.raanko_tickets.create | Y | Y | — | — | — | — | — |
| **Imports** |
| imports.jobs.view | Y | Y | B | — | Y | — | — |
| imports.jobs.run | Y | Y | — | — | Y | — | — |

### Branch Scope Rules

When a permission is marked **B** for Branch Manager:

- Queries filter `branch_id IN (membership branch scope)`
- Branch Manager default scope: assigned default branch only
- Company Owner and Company Admin: all branches
- Confirmed: Sales and Shipping Operations see buy prices by default in MVP
- Confirmed: Branch Manager is limited to assigned branch scope only
- Non–Branch Manager roles use tenant-wide branch scope in MVP

---

## Customer Portal Permissions

Portal users are not RBAC role holders. Access is enforced by portal account binding:

| Capability | Rule |
|---|---|
| View own quotes, shipments, invoices | Allowed for linked customer |
| Submit RFQ | Allowed when tenant write mode is full |
| Download own documents | Allowed when document visibility includes customer |
| View tracking | Allowed for own shipments |

Never visible to portal users:

- Buy prices, margins, profitability
- Other customers' records
- Internal notes and internal-only documents
- Employee and settings modules

---

## Public Tracking

Unauthenticated. Returns only public shipment events and non-sensitive shipment facts. No permission keys apply.

---

## Entitlements vs Permissions

| Check | Question |
|---|---|
| Entitlement | Is this feature included in the tenant's plan or override? |
| Write mode | Is the tenant allowed to mutate data right now? |
| Permission | Is this user allowed to perform the action? |

All three must pass for a protected write operation.

Example: `quotes.quotes.create` requires entitlement `feature.quotes`, write mode `full`, and user permission `quotes.quotes.create`.

---

## Implementation Rules

- Store permission assignments in `PermissionAssignment` linked to `Role`; never hard-code in UI only
- Seed default roles at tenant provisioning; allow Company Owner to customize
- Permission snapshot returned at login and refreshed on role change / session refresh
- Deny by default when permission is missing
- Super Admin does not inherit company permissions automatically; cross-tenant access uses platform endpoints only

---

## Related Documents

- `AUTHENTICATION_DESIGN.md`
- `SECURITY_ARCHITECTURE.md`
- `DATABASE_DESIGN.md`
