# UX Flows

Status: Design accepted for MVP. Wireframes are Implementation-phase detail.

Desktop-first operational density. Arabic and English with RTL support. Currency display: EUR default, SYP where configured.

See `CORE_WORKFLOWS.md`, `AUTHENTICATION_DESIGN.md`, `PERMISSIONS_MODEL.md`, PROJECT_CONTEXT §62–63.

---

## Design Principles

- Professional, information-dense SaaS — not minimal-empty UI
- Desktop-first for company workspace; responsive for portal and public tracking
- Tenant branding loaded after tenant resolution (logo, colors, company name)
- Module visibility driven by permission snapshot from login
- Destructive and financial actions require confirmation
- Read-only and suspended states shown prominently in shell banner
- UTC storage; display in tenant timezone

---

## Surface Map

| Surface | Route Group | Primary Users |
|---|---|---|
| Super Admin | `(platform)` / `admin.raanko.com` | Platform admins, support agents |
| Company Workspace | `(company)` / `{slug}.raanko.com` | Tenant employees |
| Customer Portal | `(portal)` / `{slug}.raanko.com/portal` | Customer users |
| Public Tracking | `(public)/track` | Guests |

---

## 1. Super Admin — Login

```text
[Login Page]
  Email + Password
  → 2FA challenge (required before production Beta)
  → Platform dashboard

Errors: generic "Invalid credentials" — no account enumeration
```

Post-login home: companies list with status filters (trial, active, suspended, read-only).

---

## 2. Super Admin — Provision Company

```text
[Companies] → [Create Company]
  Step 1: Company name, slug (auto-suggest), country, owner email
  Step 2: Plan (Trial default), trial start
  Step 3: Review → Submit
  → Success: tenant detail page + "Invitation sent"
  → Owner appears as "Pending invite"
```

Validation inline: slug uniqueness, reserved words, email format.

No self-serve signup in MVP.

---

## 3. Super Admin — Tenant Lifecycle Actions

From tenant detail:

| Action | Confirmation | Effect shown in UI |
|---|---|---|
| Activate paid | Yes | Banner cleared on next company login |
| Suspend | Yes + reason | Company login blocked message |
| Move to read-only | Optional note | Company sees read-only banner |
| Extend trial | Date picker | Updated subscription card |

Audit trail visible on tenant detail tab.

---

## 4. Company — Invitation and First Login

```text
[Email link] → [Set Password] → [Verify Email if required]
  → [Onboarding Wizard] (progress saved)
      Step 1: Confirm company profile
      Step 2: Upload logo, pick brand colors
      Step 3: Currency, timezone, language (AR/EN)
      Step 4: Tax + payment methods defaults
      Step 5: Invite first employee (optional, skippable)
  → [Dashboard]
```

If user lands on wrong subdomain: generic login failure, link to support.

MVP: no tenant switcher. Multi-membership users use correct company URL per tenant.

---

## 5. Company — Login (Returning User)

```text
[{slug}.raanko.com/login]
  Email + Password
  → Optional 2FA if enabled
  → Dashboard

Shell states:
  - Normal: standard nav
  - Read-only: persistent amber banner "Account is read-only — contact admin"
  - Trial ending soon: dismissible warning with days remaining
```

Session expired → redirect to login with return URL.

---

## 6. Company — Shell and Navigation

```text
┌─────────────────────────────────────────────────────────┐
│ Logo (tenant) │ Global Search │ Notifications │ Profile │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │ Main content area                            │
│ (modules │                                              │
│  by perm)│                                              │
└──────────┴──────────────────────────────────────────────┘
```

Sidebar modules (hidden if no view permission):

- Dashboard
- Customers
- Quotes & RFQ
- Bookings
- Shipments
- Documents
- Finance (submenu if any finance permission)
- Suppliers & Rates
- Reports
- Support
- Settings (employees, branches, roles, company settings)

Financial submenu items gated separately (e.g. profitability requires `finance.profitability.view`).

Branch Manager: branch selector in header if user has branch scope; lists auto-filtered.

---

## 7. Company — Dashboard

Widgets (permission and data gated):

| Widget | Permission / Rule |
|---|---|
| Active shipments count | `shipments.shipments.view` |
| Delayed shipments | same |
| Quotes awaiting response | `quotes.quotes.view` |
| Pending bookings | `bookings.bookings.view` |
| Outstanding invoices | `finance.invoices.view` |
| Monthly revenue | `finance.reports.view` |
| Monthly profit | `finance.profitability.view` |
| Upcoming arrivals/departures | `shipments.shipments.view` |
| Recent activity | timeline from CRM/shipments |
| Notifications | all authenticated |
| Tasks | `crm.activities.manage` |

Layout: card grid, dense tables on drill-down. No widget shown if permission missing (not empty placeholder).

---

## 8. Company — Customer CRM Flow

```text
[Customers List] → search, filter, pagination, export
  → [Customer Detail]
      Tabs: Overview | Activities | Quotes | Shipments | Invoices | Documents
      → [Add Activity / Task]
      → [Create Quote] (shortcut)
  → [New Customer] form
  → [Import Customers] → upload Excel → map columns → preview errors → confirm
```

Duplicate detection warning on create (email/phone match).

---

## 9. Company — RFQ and Quote Flow

```text
[RFQ Inbox] → RFQ detail
  → [Create Quote] pre-filled from RFQ
  → [Quote Editor]
      Lines: charge, buy rate (if permitted), sell rate, margin (if permitted)
      Version history sidebar
      Actions: Save draft | Approve & Send | Generate PDF
  → [Quote Detail] status timeline
```

Sales sees buy rates and margins by default (owner confirmed).

Approve action requires `quotes.quotes.approve`.

Read-only tenant: all mutation buttons disabled with tooltip citing read-only mode.

---

## 10. Company — Booking and Shipment Flow

```text
[Bookings List] → [Booking Detail]
  → [Create Shipment from Booking]

[Shipments List] → filters by status, branch, mode, date
  → [Shipment Detail]
      Tabs: Overview | Cargo | Parties | Timeline | Documents | Finance
      → [Add Tracking Event]
      → [Change Status] (workflow-aware dropdown)
      → [Link Documents]
      → [Create Invoice]
  → [New Shipment Direct] (no quote path)
```

Status changes logged in timeline. Invalid transitions show inline error.

---

## 11. Company — Finance Flow

```text
[Finance Overview]
  → [Customer Invoices] → create / issue / record payment
  → [Supplier Invoices] → link to shipment
  → [Payments] → allocate to invoices
  → [Expenses]
  → [Credit Notes]
  → [Exchange Rates]

[Shipment Detail → Finance tab]
  Profitability panel (only if finance.profitability.view)
  Buy/margin columns (respect finance.buy_prices.view / finance.margins.view)
```

Issued invoice: no delete button — void via credit note flow with confirmation.

---

## 12. Company — Settings and RBAC

```text
[Settings]
  → Company profile & branding
  → Branches
  → Employees → invite → assign role → assign branch (optional)
  → Roles & Permissions → matrix editor (Owner/Admin only)
  → Numbering rules
  → Tax & payment methods
  → Notification preferences
  → Subscription (read-only view: plan, trial dates, usage)
```

Role permission editor uses same keys as `PERMISSIONS_MODEL.md`.

Branch Manager role: UI shows branch assignment as required on invite.

---

## 13. Customer Portal — Login and Home

```text
[{slug}.raanko.com/portal/login]
  Email + Password
  → [Portal Home]
      My Shipments | My Quotes | My Invoices | RFQ | Documents | Support
```

Portal shell uses tenant branding. No employee modules visible.

Read-only tenant: RFQ submit hidden; banner explains view-only mode.

---

## 14. Customer Portal — RFQ and Quote Acceptance

```text
[Submit RFQ] → form (origin, destination, cargo, incoterm, notes)
  → Confirmation "Request submitted"

[My Quotes] → quote detail → view PDF → [Accept Quote] / [Decline]
  → Accept confirmation modal
  → Status updates; notification to sales
```

Customer never sees buy price, margin, or internal notes.

---

## 15. Customer Portal — Shipment Tracking and Documents

```text
[My Shipments] → shipment detail
  → Tracking timeline (customer-visible events)
  → Linked documents (customer-visible only)
  → Download PDF

[Support] → new request → thread view
```

---

## 16. Public Tracking

```text
[{slug}.raanko.com/track]
  Input: tracking number
  → Result page:
      Status, origin/destination (non-sensitive), public timeline, ETA if available
  No login required
  Rate limited; no financial or internal data
```

Mobile-friendly layout. Arabic/English toggle.

---

## 17. Global Search (Company)

```text
Header search box → dropdown results grouped by type:
  Shipments | Quotes | Bookings | Invoices | Customers | Containers | BL/AWB

Click result → navigate to detail
Requires search.tenant.use
Branch-scoped users: results within branch scope only
```

---

## 18. Notifications

```text
[Bell icon] → panel with unread count
  Categories: RFQ, quote, shipment status, invoice, payment, support, system
  → Click → deep link to entity
  Mark read / mark all read

[Settings → Notifications] → email + in-app toggles per category
```

---

## 19. Import Flow (Shared Pattern)

Used for customers, suppliers, rates:

```text
[Import] → download template (optional)
  → Upload file
  → Column mapping screen
  → Validation preview (errors highlighted)
  → Confirm import
  → Progress indicator (async job)
  → Results: X imported, Y errors → download error report
```

---

## 20. Error and Empty States

| State | UX |
|---|---|
| 403 forbidden | Full page "You don't have access" + link to dashboard |
| 404 not found | Generic not found — no leak |
| Read-only block | Toast + banner; action button disabled |
| Suspended login | Dedicated page with support contact |
| Empty list | Illustration + primary action (e.g. "Create first customer") |
| Network error | Retry button |

---

## 21. Localization and RTL

- Language switcher: AR / EN in profile or header
- RTL layout mirroring for Arabic
- Dates formatted in tenant timezone
- Money: `€1,250.00` or `£S 1,250,000` per tenant currency setting
- Number inputs accept locale decimal separator in UI; API uses canonical format

---

## 22. MVP UX Out of Scope

- Tenant switcher for multi-membership users
- Custom domain branding URL
- Support impersonation UI
- Native mobile apps
- Advanced drag-drop workflow builder
- Full session/device management UI (data stored; minimal revoke in MVP)

---

## Related Documents

- `CORE_WORKFLOWS.md`
- `API_CONTRACT_PRINCIPLES.md`
- `AUTHENTICATION_DESIGN.md`
