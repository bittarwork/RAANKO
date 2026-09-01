# MVP Scope

This file freezes what belongs in the first launchable product.

If a capability is not listed here, it is out of MVP unless the owner changes this file and records the decision.

---

## In Scope

Platform:

- One application, many tenants
- Super Admin dashboard for companies, plans, subscriptions, usage, support, and system settings
- Automated tenant provisioning
- Company lifecycle and suspension without data deletion
- Entitlements, limits, and tenant overrides
- Subdomain-based tenant resolution
- Arabic and English
- Multi-currency
- Company branding / white label on customer-facing documents
- Audit logs
- Versioned APIs

Company workspace:

- Branches
- Employees
- Roles and configurable permissions
- Customers CRM with activity timeline
- Suppliers / carriers
- Quotes, charges, buy/sell pricing, branded PDF
- RFQ from customer portal
- Bookings from accepted quotes
- Direct shipment creation without quote
- Shipments, configurable status workflow, timeline, tracking
- Public tracking without sensitive data
- Documents upload/download/preview and generated quote/invoice/receipt/delivery-order PDFs
- Customer invoices, supplier invoices, payments, expenses, outstanding amounts, shipment profitability
- Configurable payment methods: cash, bank transfer, cheque
- Configurable taxes
- In-app and email notifications
- Company dashboard, reports, tenant-scoped search
- Excel and PDF export according to permissions
- Excel import for customers, suppliers, rates, and pricing
- Customer portal
- Company customer support requests
- RAANKO support tickets from the company
- Onboarding workflow with saved progress

---

## Explicitly Out of Scope for MVP

- Warehouse management and inventory
- Fleet management
- Full GPS tracking
- Driver app
- Customer native mobile app
- Carrier / airline / vessel / flight APIs
- QuickBooks / Xero
- Electronic payments and credit-card processing
- Electronic signature
- AI document reading and advanced AI analytics
- Custom domain
- Custom email sender
- Webhooks
- CSV export as a dedicated product requirement
- Document versioning
- Support impersonation
- Tenant-level restore promises
- Self-serve public pricing pages, unless later added by decision

---

## MVP Quality Constraints

- Tenant isolation enforced server-side
- Object-level authorization
- Financial permission separation
- No casual hard delete of protected financial records
- Mandatory tenant-isolation tests
- UTC storage with timezone display
- Pagination and server-side filtering on lists
- Background-capable handling for email, imports, large reports, and document generation

---

## Not Frozen

- Exact commercial plan names and prices
- Technology stack
- Physical database strategy
- Exact suspended-tenant behavior for portal and public tracking
