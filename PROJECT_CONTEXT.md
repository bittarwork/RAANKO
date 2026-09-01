# RAANKO — Project Master Context

This document is the official master context for RAANKO.

Do not silently change confirmed requirements here. Material changes must be recorded in `docs/project/DECISIONS.md` and `docs/project/CHANGELOG.md`.

Status of statements in this file:

- Numbered rules and capabilities below are **Confirmed Requirements**, unless marked otherwise.
- Plan names, plan prices, exact commercial packaging, and unspecified technologies are **not confirmed**.
- Future modules are confirmed as future intent, not MVP scope.

---

# 1. Core Idea

RAANKO is a central multi-tenant SaaS platform for managing shipping and logistics companies.

It is not a simple application and not a system belonging to one shipping company.

Several independent shipping companies can create their own accounts and use the platform for daily operations.

Each shipping company is an independent Tenant.

Each company has:

- Its own account
- Its own employees
- Its own customers
- Its own branches
- Its own shipments
- Its own quotes
- Its own invoices
- Its own suppliers and carriers
- Its own documents
- Its own settings
- Its own logo and visual identity
- Data fully isolated from other companies

No company may access another company's data.

A higher administrative layer exists:

**RAANKO Administration**

It manages all shipping companies subscribed to the platform.

---

# 2. Nature of the System

RAANKO is not only a mobile application.

It is an integrated SaaS system that may consist of several interfaces:

1. RAANKO Super Admin Dashboard
2. Shipping Company Dashboard
3. Employee Interfaces
4. Customer Portal
5. Customer Mobile Application — Future
6. Driver Mobile Application — Future
7. Public Shipment Tracking Interface
8. APIs and Integrations

The platform must be designed from the start so it can become a global, scalable product.

---

# 3. Primary Users

## 3.A RAANKO Super Admin

Platform administrator.

Can:

- Add shipping companies
- Edit company data
- Activate or deactivate a company
- Manage subscriptions
- Manage plans
- See user counts per company
- See company consumption
- Follow payments
- Follow subscription expiration dates
- Manage technical support
- Follow errors
- Monitor platform usage
- Manage global system settings
- Manage countries, currencies, and core services
- View platform statistics

Super Admin must not use the system to perform daily shipping operations of companies except when a dedicated support or administration permission exists.

## 3.B Shipping Company

Each shipping company receives an independent Workspace / Tenant.

A company may have:

- Multiple branches
- Multiple employees
- Multiple customers
- Different settings
- Different logo
- Different colors
- Dedicated domain or subdomain in the future
- Different currencies
- Different tax numbers

Examples:

- `company-a.raanko.com`
- `company-b.raanko.com`

Custom domains are a future capability.

---

# 4. Companies and Branches

The system must support:

- Multiple companies on the platform
- Multiple branches per company
- Linking an employee to one or several branches
- Linking a shipment to a branch
- Linking a customer to a branch when needed
- Reports by branch
- Settings by company
- Branch-specific settings when needed

Branch data may include:

- Name
- Country
- City
- Address
- Phone
- Email
- Timezone
- Currency
- Tax information
- Manager

---

# 5. Employees and Permissions

The system must include advanced Role-Based Access Control (RBAC).

Initial roles:

- Company Owner
- Company Admin
- Branch Manager
- Sales
- Shipping Operations
- Accountant
- Customer Service
- Warehouse Employee — Future
- Driver — Future

Permissions must not be hardcoded only as these role names.

Fine-grained permissions must be configurable per role, for example:

- View / Create / Edit / Delete Customers
- View / Create / Approve Quotes
- View / Edit Shipments
- Change Shipment Status
- View Financial Data
- Create Invoice
- Record Payment
- View / Export Reports
- Manage Employees
- Manage Settings

Support View / Create / Update / Delete / Approve / Export by module.

---

# 6. Types of Shipping Companies Served

RAANKO must not assume that every shipping company owns its own transport fleet.

Two main types:

## Freight Forwarder / Shipping Broker

The company intermediates between the customer and:

- Shipping lines
- Airlines
- Trucking companies
- Drivers
- Warehouses
- Agents
- Customs brokers
- Other logistics providers

The company buys transport at one price and sells it to the customer at another.

The system must calculate:

Selling Price - Buying Cost = Gross Profit

including additional fees and expenses.

## Transportation / Logistics Operator

Some companies own trucks, drivers, warehouses, vehicles, routes, and fleet.

Architecture must allow Fleet Management later without rebuilding the system.

---

# 7. CRM

The system must include an internal CRM.

Customer data may include:

- Customer Type
- Person / Company
- Company Name
- Contact Person
- Phone
- Email
- Country
- City
- Address
- Tax Number
- Preferred Currency
- Notes

Shipment parties must be supported:

- Customer
- Shipper
- Consignee
- Notify Party

The customer may also be the shipper or consignee, or they may be different people or companies.

CRM must include:

- Customer Profile
- Quotes History
- Shipments History
- Invoices History
- Payments History
- Notes
- Calls
- Tasks
- Activities
- Attachments
- Assigned Sales Employee

An activity timeline must be stored for each customer.

---

# 8. Suppliers and Carriers

Supplier / Carrier Management is required.

Supplier types:

- Shipping Lines
- Airlines
- Trucking Companies
- Individual Drivers
- Shipping Agents
- Freight Agents
- Warehouses
- Customs Brokers
- Port Service Providers
- Other Logistics Suppliers

Supplier data includes:

- Company Name
- Contact Details
- Country
- Service Types
- Routes
- Pricing
- Currency
- Payment Terms
- Notes
- Rating
- Performance History

The system should later be able to compare multiple supplier offers for the same service.

---

# 9. Transport Modes

Primary modes:

- Sea Freight
- Air Freight
- Road Freight
- Vehicle Shipping

Other modes must be addable later.

---

# 10. Shipment Types

Sea / Road shipments may include:

- FCL
- LCL
- FTL
- LTL

The system must be extensible for new types without a radical database redesign.

---

# 11. Cargo Information

A shipment may contain one or several items.

Cargo data may include:

- Description
- Commodity
- HS Code
- Quantity
- Packages
- Package Type
- Gross Weight
- Net Weight
- Length
- Width
- Height
- Volume
- CBM
- Chargeable Weight
- Dangerous Goods
- Temperature Requirement
- Special Instructions

CBM must be calculated automatically when dimensions are available.

---

# 12. Locations

Support:

- Countries
- Cities
- Ports
- Airports
- Warehouses
- Pickup Locations
- Delivery Locations

A shipment may include:

- Origin
- Port of Loading
- Port of Discharge
- Destination
- Pickup Address
- Delivery Address

depending on shipment mode.

---

# 13. Pricing System

A complete pricing system is required.

Core concepts:

- **Buy Rate**: price obtained from supplier or carrier
- **Sell Rate**: price sold to the customer

Charges may include:

- Freight
- Documentation Fee
- Customs Fee
- Handling Fee
- Port Charges
- Delivery Fee
- Pickup Fee
- Insurance
- Fuel Surcharge
- Storage
- Tax
- VAT
- Other Charges

Each charge may include:

- Description
- Quantity
- Unit
- Buy Rate
- Sell Rate
- Currency
- Tax
- Supplier

The system must calculate:

- Total Buying Cost
- Total Selling Price
- Gross Profit
- Profit Margin %

---

# 14. Quotes

A sales employee can create a quote for a customer.

A quote contains:

- Quote Number
- Customer
- Origin
- Destination
- Shipping Mode
- Shipment Type
- Cargo Information
- Charges
- Buy Cost
- Selling Price
- Currency
- Taxes
- Valid Until
- Terms and Conditions
- Notes

Quote statuses:

- Draft
- Sent
- Viewed
- Accepted
- Rejected
- Expired
- Cancelled

After customer acceptance:

Accepted Quote → Booking

Data must not be re-entered. Quote information must transfer automatically into the booking.

---

# 15. PDF Quotation

The system must generate a professional PDF quote using:

- Company logo
- Company colors
- Company information
- Customer information
- Quote number
- Services
- Prices
- Taxes
- Terms
- Validity
- Signature area

Each company must receive a PDF with its own identity, not RAANKO identity.

RAANKO should be white-label as much as possible toward the shipping company's customers.

---

# 16. Bookings

After a quote is accepted, a booking is created.

A booking contains:

- Booking Number
- Customer
- Shipper
- Consignee
- Shipping Method
- Shipment Type
- Cargo
- Route
- Supplier
- Cost
- Selling Price
- Dates
- Documents
- Notes

A shipment can be created from a booking.

---

# 17. Shipments

Shipment is the core operational entity.

Each shipment must receive a unique tracking number automatically.

Example:

`RAA-2026-000012`

or a numbering system customizable per company.

Shipment information may include:

- Tracking Number
- Internal Reference
- Booking Reference
- Customer
- Shipper
- Consignee
- Carrier
- Shipping Line
- Airline
- Driver
- Agent
- Origin
- Destination
- Port of Loading
- Port of Discharge
- ETD
- ETA
- Actual Departure
- Actual Arrival
- Cargo
- Containers
- Documents
- Costs
- Revenue
- Profit
- Responsible employees

---

# 18. Shipment Status

Status system must be flexible.

Example statuses:

- Draft
- Booked
- Awaiting Pickup
- Picked Up
- At Origin Warehouse
- Customs Processing
- Ready for Departure
- Departed
- In Transit
- Transshipment
- Arrived at Destination
- Customs Clearance
- Out for Delivery
- Delivered
- Completed
- Delayed
- Cancelled

Do not assume all shipping modes use the same statuses.

Configurable shipment status workflow is preferred.

---

# 19. Shipment Timeline

Every shipment must have a timeline.

Each event contains:

- Status
- Title
- Description
- Date
- Time
- Location
- Employee
- Public / Internal

Public events are visible to the customer.

Internal events are visible only to employees.

---

# 20. Real-Time Shipment Tracking

Customers of shipping companies must be able to track shipments.

In the first phase there may be no actual GPS.

Real-time here means: any update made by the shipping company appears immediately to the customer.

Later possible additions:

- GPS tracking
- Carrier APIs
- Airline APIs
- Shipping line APIs

Design must separate:

- Manual tracking events
- External tracking events
- GPS events

---

# 21. Public Tracking

A customer must be able to open a tracking page without full dashboard login when needed.

They enter a tracking number and see public shipment information.

Do not display financial or sensitive information in public tracking.

---

# 22. Documents

The project includes a Document Management System.

Documents may exist between:

- Shipping company
- Customer
- Supplier
- Carrier
- Driver
- Agent

Document types include:

- Quotation
- Commercial Invoice
- Customer Invoice
- Supplier Invoice
- Packing List
- Bill of Lading
- House Bill of Lading
- Master Bill of Lading
- AWB
- HAWB
- MAWB
- Delivery Order
- Proof of Delivery
- Contract
- Customs Documents
- Certificates
- Other Documents

Support:

- Upload
- Download
- Preview
- Delete according to permissions
- Versioning in the future
- Document Type
- Related Shipment / Customer / Invoice / Supplier
- Visibility: Internal, Customer Visible, Supplier Visible

---

# 23. Generated Documents

Some documents must be generated by the system:

- Quotation PDF
- Invoice PDF
- Receipt PDF
- Delivery Order PDF
- Shipping documents in the future

Generated documents must use company logo, identity, contact details, tax number, customer data, and dynamic content.

---

# 24. Accounting and Finance

RAANKO is not a full ERP accounting system in the first phase, but it includes financial operations linked to shipping operations.

Support:

- Customer Invoices
- Supplier Invoices
- Payments Received
- Payments Made
- Expenses
- Revenue
- Taxes
- Outstanding Amounts
- Shipment Profitability

---

# 25. Customer Invoice

An invoice may contain:

- Invoice Number
- Customer
- Shipment
- Quote
- Issue Date
- Due Date
- Currency
- Items
- Tax
- VAT
- Discount
- Total
- Paid
- Remaining

Statuses:

- Draft
- Issued
- Partially Paid
- Paid
- Overdue
- Cancelled

---

# 26. Supplier Invoice

Supplier invoices must be recorded and linked to the shipment so true profit can be calculated:

Revenue - Supplier Costs - Other Expenses = Net Shipment Profit

---

# 27. Payments

Support:

- Full payment
- Partial payment
- Multiple payments

Payment methods are configurable, such as:

- Cash
- Bank Transfer
- Cheque
- Credit Card — Future
- Online Payment — Future

---

# 28. Multi-Currency

The system must be multi-currency from the start.

Examples: USD, EUR, GBP, AED, SAR, JOD, TRY, SYP, and others.

Each company may have a base currency, but can create quotes, invoices, and costs in other currencies.

Financial architecture must allow exchange rates later.

Unless a task explicitly says otherwise, application-facing money amounts use EUR or SYP. If unspecified, default display currency is EUR.

Date formatting is Gregorian.

---

# 29. Taxes and VAT

Because the platform is global, do not hard-code a specific tax.

Support:

- Custom tax rates
- VAT
- Multiple tax rules
- Tax number
- Country-specific configuration

---

# 30. Customer Portal

Each shipping company may give its customers accounts.

The customer portal allows:

- View dashboard
- Request quote
- View quotes
- Accept quote
- Reject quote
- Create booking
- View bookings
- View shipments
- Track shipment
- View timeline
- Download documents
- View invoices
- Download invoices
- View payments
- Create support request
- Receive notifications

The customer must not see internal information such as:

- Supplier buy price
- Profit margin
- Internal notes
- Internal documents

---

# 31. Quote Request

A customer can create a Request for Quote (RFQ).

RFQ may include:

- Shipping Mode
- Origin
- Destination
- Cargo
- Weight
- CBM
- Package Type
- Pickup Required
- Delivery Required
- Notes
- Attachments

It reaches Sales. An employee then converts it into a Quote.

---

# 32. Notifications

A Notification Center is required.

Types:

- In-App
- Email
- Push — Future
- WhatsApp — Future
- SMS — Future

Triggers may include quote, booking, shipment, document, invoice, payment, and support events.

Notification system should be designed as event-driven as much as possible.

---

# 33. Reports and Analytics

Each company must have a dashboard and reports, including revenue, costs, profit, shipment counts, status/mode/country/route breakdowns, best customers, profitable customers, best lines and suppliers, employee performance, outstanding and overdue invoices, delayed shipments, and monthly revenue/profit.

Reports must support filters:

- Date range
- Company
- Branch
- Employee
- Customer
- Shipment type
- Shipping mode
- Currency
- Status

Inside a company dashboard, company scope is automatic from tenant context. The company admin must not need to select their own `company_id`.

---

# 34. Export

Support:

- Excel export
- PDF export
- CSV in the future

Respect user permissions.

---

# 35. Audit Log

A complete audit trail is required for sensitive operations.

Record:

- User
- Company / Tenant
- Action
- Entity
- Entity ID
- Old value when needed
- New value when needed
- Timestamp
- IP address when needed
- Device / Session when needed

Audit logs must not be easy to delete.

---

# 36. Security

Security is core, not an extra feature.

Support:

- Secure authentication
- Password hashing
- Session security
- Access tokens
- Refresh tokens if JWT is used
- RBAC
- Tenant isolation
- Rate limiting
- Input validation
- File validation
- Secure file storage
- Encryption where appropriate
- Audit logs
- Two-factor authentication (2FA)
- Password reset
- Email verification
- Login activity
- Device / Session management in the future

---

# 37. Multi-Tenant Data Isolation

Any entity belonging to a company must be linked to Tenant / Company.

It must not be technically possible to access another tenant's data by changing an ID in a request.

Tenant isolation must be enforced in the backend, not only the frontend.

---

# 38. File Security

Documents must not be permanently available through public URLs.

Prefer:

- Private storage
- Signed URLs
- Authorization check before download

---

# 39. Localization

From the start:

- Arabic
- English

Other languages must be addable.

RTL and LTR must work correctly.

Do not hard-code UI text inside components. Use an internationalization system.

---

# 40. Timezones

Store time in a standard form such as UTC.

Display according to company timezone or user timezone.

Do not assume one timezone for the platform.

---

# 41. White Label

Each company may have:

- Logo
- Primary color
- Secondary color
- Company name
- Email
- Phone
- Website
- Address
- Invoice template
- Quote template

Future:

- Custom domain
- Custom email sender

---

# 42. Importing Data

Excel import is required, especially for:

- Customers
- Suppliers
- Rates
- Pricing

Shipments later.

Import flow:

Upload → Preview → Column mapping → Validation → Error report → Confirm import

---

# 43. API Architecture

The system must provide organized APIs.

Think from the start about integration with shipping lines, airlines, GPS, payment gateways, accounting systems, WhatsApp, external CRM, and e-commerce stores.

Use versioned APIs, for example `/api/v1/`.

---

# 44. Webhooks

Webhooks are a future capability, for events such as:

- `shipment.updated`
- `shipment.delivered`
- `quote.accepted`
- `invoice.created`
- `payment.received`

---

# 45. Future Integrations

Roadmap includes shipping line APIs, airline APIs, flight/vessel tracking, GPS, maps, WhatsApp Business API, email/SMS providers, QuickBooks, Xero, payment gateways, electronic signature, cloud storage, and customs systems when available.

---

# 46. Warehouses — Future Module

Future warehouse management: multiple warehouses, locations, inventory, incoming/outgoing cargo, storage charges, cargo status, shipment linking.

---

# 47. Shipment Consolidation — Future Module

Later, several shipments may be grouped into a master shipment, especially LCL and LTL consolidation.

Concepts such as Master Shipment, House Shipment, Master Bill, and House Bill must be considered in the shipment data model.

---

# 48. Fleet Management — Future Module

Future: vehicles, trucks, drivers, documents, maintenance, fuel, trips, assignments, routes, GPS, driver app.

---

# 49. GPS Tracking — Future

When added, drivers, trucks, containers, and shipments may be tracked, with location history on a map.

---

# 50. Artificial Intelligence — Future

Future capabilities may include AI document processing, suggested pricing, delay prediction, profit analysis, customer insights, document classification, and support assistants.

These are not core MVP features.

---

# 51. Electronic Signature — Future

Later, quotes, contracts, delivery documents, and proof of delivery may be signed electronically.

---

# 52. Mobile Applications

The primary platform must be the SaaS system first.

Later:

- Customer mobile app
- Driver mobile app
- Operations mobile app if needed

---

# 53. RAANKO Is Not a Shipping Company

RAANKO does not perform shipping operations itself.

RAANKO is a software platform that gives shipping companies tools to manage their operations.

Any carrier, shipping line, driver, or agent is a supplier or service provider working with the shipping company on RAANKO.

---

# 54. Tenant Concept

Every user must operate inside a clear context:

- RAANKO Super Admin
- or Company A
- or Company B

There must be no mixing of data.

For every backend query, ask:

- What is the current tenant?
- Does this data belong to that tenant?

---

# 55. Subscription SaaS Model

RAANKO is a subscription product.

The system must support:

- Plans
- Subscriptions
- Billing cycles
- Trial period
- Subscription status
- User limits
- Branch limits
- Storage limits
- Feature limits

Example plan names: Starter, Professional, Business, Enterprise.

Plan names and prices are **not final**. Do not assume prices without a request.

---

# 56. Feature Flags / Entitlements

Modules and features should be enableable and disableable by plan, such as advanced reports, API access, custom domain, multiple branches, accounting integrations, AI, fleet, and warehouse.

Do not scatter `if plan == "enterprise"` checks through the application.

Prefer:

- Feature
- Plan Feature
- Tenant Feature Override
- Subscription Entitlement

---

# 57. Support System

A shipping company can open a ticket with RAANKO.

Customers of a shipping company can open support requests with the shipping company.

Keep RAANKO Support and Shipping Company Customer Support separate.

---

# 58. Core Business Workflow

Customer → RFQ → Sales review → Quote → Customer accepts → Booking → Shipment → Operations → Tracking events → Documents → Invoice → Payment → Delivery → Shipment completed → Profit calculation → Reports

The system must not be fully locked to this path. Some companies may create a shipment directly without a quote.

---

# 59. Supplier Workflow

Company requests rate → carrier provides buy rate → company adds margin → sell rate → quote sent → customer accepts → carrier booking confirmed → shipment created → supplier invoice recorded → customer invoice recorded → profit calculated

---

# 60. Shipment Profitability

Every shipment must have a financial summary.

This information appears only to users with financial permission.

---

# 61. Search

Global search must support tracking number, shipment number, booking number, quote number, invoice number, customer name, phone, email, container number, BL number, AWB number, and supplier.

Company dashboard search is tenant-scoped.

RAANKO Super Admin search is a separate platform capability with different authorization.

---

# 62. Dashboard UX

Shipping company dashboard must be a professional SaaS dashboard showing the most important information quickly:

- Active shipments
- Delayed shipments
- Quotes awaiting response
- Pending bookings
- Outstanding invoices
- Monthly revenue
- Monthly profit
- Upcoming arrivals
- Upcoming departures
- Recent activity
- Notifications
- Tasks

---

# 63. UX Principles

The system must be professional, modern, clean, fast, responsive, easy to learn, scalable, and suitable for desktop-heavy operational work.

Mobile responsive matters, but operations dashboards will mostly be used on desktop.

Do not sacrifice important information density for a purely minimal look.

Goal: clean information-dense SaaS UI.

---

# 64. Performance

Consider pagination, server-side filtering, indexing, useful caching, lazy loading, efficient queries, background jobs, queues, file processing, report generation, and notification processing.

Do not load thousands of records at once.

---

# 65. Background Jobs

Do not perform the following inside the main HTTP request when they are heavy:

- Sending emails
- Generating large reports
- Processing Excel imports
- Generating documents
- External API synchronization
- Notifications
- AI document processing

These must be able to run on a queue / worker architecture.

---

# 66. Data Deletion

Do not use hard delete casually, especially for invoices, payments, shipments, documents, and financial records.

Prefer soft delete, archived status, and audit trail according to the entity.

---

# 67. Database Design Principle

Do not start creating tables randomly.

Before writing schema:

1. Understand the domain
2. Identify entities
3. Identify relationships
4. Identify tenant ownership
5. Identify business rules
6. Identify audit requirements
7. Identify soft-delete requirements
8. Identify financial relations
9. Identify future extensibility
10. Then design the database

---

# 68. Architecture Principle

When proposing architecture, prioritize:

- Maintainability
- Security
- Scalability
- Clear separation of concerns
- Multi-tenancy
- Modularity
- Testability
- Performance
- Developer experience

Do not use microservices only because the project is large.

A modular monolith may be more reasonable at the start, with a design that allows later service extraction.

Any architecture decision must explain why.

This paragraph is a **Recommendation**, not a final technology decision.

---

# 69. MVP vs Future Features

Always distinguish:

- MVP
- Phase 2
- Future / Enterprise

Do not try to build all future features in the first release.

Database and architecture must not make later additions nearly impossible.

---

# 70. Core MVP

Priority components:

- Authentication
- Multi-tenant architecture
- Companies
- Branches
- Employees
- Roles and permissions
- Customers CRM
- Suppliers
- Quotes
- Pricing
- Bookings
- Shipments
- Shipment tracking
- Shipment timeline
- Documents
- Invoices
- Payments
- Basic accounting
- Notifications
- Customer portal
- Reports
- Audit logs
- RAANKO Super Admin
- Subscription management
- Localization
- Multi-currency
- Company branding

---

# 71. Not in Core MVP

Can be deferred:

- Warehouse management
- Inventory
- Fleet management
- Full GPS tracking
- Driver app
- Customer native mobile app
- Carrier APIs
- Airline APIs
- QuickBooks
- Xero
- Electronic payments
- Electronic signature
- AI document reading
- Advanced AI analytics

These must still be considered architecturally.

---

# 72. Terminology

Use these terms consistently:

- **RAANKO**: the SaaS platform itself
- **Tenant**: shipping company registered on the platform
- **Company**: shipping company / tenant
- **Branch**: company branch
- **Customer**: customer of the shipping company
- **Shipper**: party sending the cargo
- **Consignee**: party receiving the cargo
- **Supplier**: service provider working with the shipping company
- **Carrier**: actual transporter
- **Quote**: price offer
- **Booking**: reservation
- **Shipment**: actual shipping operation
- **Tracking Event**: event in the shipment timeline

Technical ownership field name: `tenant_id`.

---

# 73. Important Business Rules

1. Each tenant's data must be isolated.
2. The customer does not see buy prices.
3. The customer does not see profit margin.
4. An employee does not see a module they lack permission for.
5. An accepted quote can be converted into a booking.
6. A booking can be converted into a shipment.
7. A shipment has a unique tracking number.
8. Documents can be linked to several entities according to type.
9. Financial transactions must not be modified without an audit trail.
10. Shipment profit depends on revenue and actual costs.
11. Company branding appears on documents sent to its customers.
12. Public tracking does not display sensitive information.
13. The system must be multi-language and multi-currency.
14. Financial permissions must be separate from operational permissions.
15. Every important shipment change must be recorded in the timeline or audit log according to its nature.

---

# 74. When Adding a New Feature

Do not treat it in isolation.

Analyze impact on:

- Database
- Backend
- API
- Frontend
- Permissions
- Tenant isolation
- Audit logs
- Notifications
- Reports
- Customer portal
- Security
- Existing workflows
- Future scalability

---

# 75. When Writing Code

All names of variables, functions, classes, interfaces, types, tables, fields, routes, endpoints, components, folders, files, and code comments must be English.

Do not use Arabic identifiers.

---

# 76. Do Not Assume Unspecified Technologies

If the following are not decided, do not treat any technology as final:

- Programming language
- Frontend framework
- Backend framework
- Database
- Cloud provider
- Storage provider
- Authentication provider
- Mobile framework

A stack may be recommended with reasons and alternatives.

---

# 77. Do Not Invent Requirements

If information is not confirmed, do not invent a business rule and treat it as fact.

Use:

- Assumption
- Recommendation
- Open Decision

---

# 78. Required Thinking Method

Do not start with code unless explicitly asked, or unless the current task has passed the Implementation gate.

Start with:

Business requirement → User flow → Business rules → Data model → Permissions → Edge cases → API requirements → UI requirements → Security → Implementation when needed

---

# 79. Agent Role

The agent is part of the RAANKO development team.

When answering:

- Bind the answer to the full project context
- Keep consistency
- Do not offer shallow solutions
- Watch multi-tenancy, security, permissions, scalability, financial accuracy, shipment lifecycle, and future integrations
- Do not rebuild existing features in a conflicting way
- Warn if a decision will create large technical debt
- Suggest improvements only when there is a real engineering or commercial reason
- Always distinguish requirement from recommendation
- Do not change existing business logic without explaining it

---

# 80. Final Product Goal

Build a global SaaS platform that a small shipping company can start using easily, while a larger company with multiple branches, many employees, a large customer base, high shipment volume, many suppliers, and complex financial operations can use it without needing to switch systems.

The product must start practical and launchable, then expand gradually into a complete logistics management platform.

---

# 81. Multi-Tenant Architecture — Core System Model

RAANKO must be designed as a true multi-tenant SaaS system.

The platform consists of:

- One application
- One central platform
- Multiple independent shipping companies

Each shipping company operates inside its own isolated tenant workspace.

RAANKO must not create or maintain a separate copy of the source code for every shipping company.

The same application and codebase serve all subscribed companies.

---

# 82. Tenant Provisioning

When a new shipping company is created from the RAANKO Super Admin Dashboard, the platform should automatically provision the required tenant environment.

Provisioning should create or configure as much as practical:

- Unique company / tenant ID
- Company profile
- Company administrator account
- Company settings
- Branding configuration
- Default branch if required
- Subscription and plan
- Feature access
- User / branch / storage limits
- Company-specific numbering configuration
- Default roles and permissions
- Default shipment workflow when appropriate
- Company URL / subdomain
- Localization, currency, timezone, and tax settings

This process should be automated as much as possible.

---

# 83. Tenant Identifier

Every shipping company must have a unique immutable internal identifier.

Conceptually `company_id` or `tenant_id`.

Implementation should preferably use a secure identifier such as UUID / ULID where appropriate instead of relying only on sequential numeric IDs.

The implementation decision depends on the selected database and architecture.

This identifier preference is a **Recommendation** until a database decision is accepted.

---

# 84. Tenant URL / Subdomain

Each shipping company should be capable of having its own platform URL, for example:

- `tawam.raanko.com`
- `alpha.raanko.com`

The subdomain identifies or helps identify the tenant.

Future Enterprise customers may use `portal.companyname.com` through custom domain support.

Architecture must support:

- Subdomain-based tenant resolution
- Eventually custom-domain tenant resolution

---

# 85. Tenant Resolution

When a request reaches RAANKO, the system must determine which tenant is being accessed.

Resolution may depend on:

- Authenticated user
- Subdomain
- Custom domain
- Secure tenant context
- API credentials

The subdomain alone must never be trusted as authorization.

The authenticated user's company membership and permissions must also be validated.

---

# 86. Authentication and Tenant Context

After login, the system establishes a secure tenant context.

Every protected request should know:

- Current user
- Current tenant
- Current role
- Current permissions
- Current branch when applicable
- Subscription / feature access when applicable

---

# 87. Tenant-Specific Dashboard

After login, the user must see only their company environment, including branding and operational data.

No data belonging to another tenant should appear.

Do not hard-code any shipping company identity into the application.

---

# 88. Tenant Branding

Tenant settings may contain company name, logo, favicon, colors, contact details, invoice/quotation branding, document footer, default language, default currency, and timezone.

The frontend should load these settings dynamically after tenant resolution.

---

# 89. Tenant-Owned Data

Most operational entities belong to a specific tenant and must contain or otherwise enforce tenant ownership.

---

# 90. Global Data vs Tenant Data

Not every table belongs to one company.

Classify every entity as:

- **GLOBAL**
- or **TENANT_SCOPED**

before designing its schema.

Do not blindly add `tenant_id` to every table.

Examples of global data:

- Countries
- Currencies
- System plans
- Global shipping modes
- Platform configuration
- Potentially ports and airports

Examples of tenant-owned data:

- Customers
- Shipments
- Quotes
- Employees via membership
- Suppliers
- Invoices
- Payments
- Documents
- Branches

---

# 91. Mandatory Tenant Isolation

Tenant isolation is a security boundary.

It must not depend only on frontend filtering.

The tenant should normally be derived from trusted authentication and server-side context.

Conceptually:

Authenticated User → Tenant Membership → Server Tenant Context → Authorized Database Query

---

# 92. Never Trust Tenant IDs From Client Requests

For normal tenant operations, the backend must never trust a `tenant_id` supplied directly by the frontend as proof of ownership.

`tenant_id` must be determined from the authenticated server-side tenant context.

This applies to create, read, update, delete, export, document download, search, and reports.

---

# 93. Object-Level Authorization

If a Tawam employee requests an Alpha resource ID, the server must return an authorization-safe response and must never expose Alpha data.

Changing an ID, URL, query parameter, GraphQL argument, API request, or frontend state must never allow cross-tenant access.

---

# 94. Database-Level Tenant Protection

Whenever supported by the selected database and architecture, additional database-level protection should be considered.

PostgreSQL Row Level Security is a **Recommendation**, not a confirmed implementation choice.

Preferred protection layers:

1. Authentication
2. Tenant context
3. Application service filtering
4. Repository / ORM tenant scope
5. Database row-level security when available
6. Authorization policies
7. Automated security tests

Defense in depth is preferred.

---

# 95. Tenant-Aware Queries

Any query involving tenant-owned data should automatically operate inside the current tenant.

Tenant filtering should be centralized where possible.

Developers should not have to remember to add a tenant filter in hundreds of unrelated queries without protection.

---

# 96. Tenant-Aware Relationships

A Tawam shipment must never reference an Alpha customer.

A Tawam invoice must never reference an Alpha shipment.

Business logic must verify that related tenant-scoped entities belong to the same tenant.

---

# 97. User Membership

A user should not necessarily be permanently tied to only one tenant.

Prefer:

User → Membership → Company/Tenant → Role → Permissions

This allows a future case where one user belongs to multiple companies.

If multi-company membership is not exposed in the initial MVP, the data model should still avoid blocking this capability.

---

# 98. Company Admin

Each company should have at least one Company Owner or Company Admin.

They manage their own workspace.

They must not have access to RAANKO platform-level administration.

---

# 99. RAANKO Super Admin vs Company Admin

These are two different administration layers and must never be confused.

---

# 100. RAANKO Super Admin Dashboard

Separate administrative dashboard with modules such as:

- Companies
- Subscriptions
- Plans
- Payments
- Usage
- Support
- Platform monitoring
- Feature management
- Audit / Security
- System settings

---

# 101. Company Lifecycle

A company may have lifecycle states such as:

- Pending
- Trial
- Active
- Past Due
- Suspended
- Cancelled
- Archived

Distinguish **Company Status** from **Subscription Status**. They are related but not necessarily identical.

Business logic determines what functionality remains available.

---

# 102. Suspending a Tenant

RAANKO Super Admin must be able to suspend a company.

Suspension must not immediately delete company data.

Possible behavior:

- Company login: blocked
- Customer portal: configurable
- Public tracking: configurable
- API access: blocked
- Background integrations: paused where appropriate
- Data, documents, subscription history, and audit logs: preserved

Reactivation should restore access without recreating the company.

Exact customer-portal and public-tracking behavior during suspension is an **Open Decision**.

---

# 103. Subscription Plans

Each tenant should be linked to a subscription plan.

Exact commercial plans are not finalized and must not be treated as fixed requirements.

---

# 104. Feature Entitlements

Feature access must be determined through a structured entitlement system, not scattered plan-name checks.

---

# 105. Tenant Overrides

RAANKO Super Admin may eventually need to override plan limitations for individual customers without modifying source code.

---

# 106. Tenant Usage Tracking

RAANKO should track relevant tenant usage such as active users, branches, customers, shipments, documents, storage, API requests, and integration usage.

Exact metering depends on the subscription model.

---

# 107. Company Onboarding

When a company is first created, an onboarding workflow can guide its administrator through configuration, with progress saving.

---

# 108. Tenant Provisioning Workflow

RAANKO Super Admin → Create Company → Generate Tenant ID → Create Company Record → Create Subscription → Apply Plan Entitlements → Create Company Owner Account → Create Default Roles and Permissions → Create Default Settings → Create Default Branch when required → Assign Subdomain → Initialize Numbering Rules → Send Company Owner Invitation → Company Owner Completes Onboarding → Tenant Becomes Operational

Provisioning should ideally be transaction-safe and idempotent where practical.

---

# 109. Company Slug

Each tenant should have a human-readable unique slug.

Slug rules:

- Unique
- Lowercase
- URL-safe
- Reserved-word validation
- Rename rules

Changing the slug must not change the tenant's internal immutable identifier.

---

# 110. Tenant Storage Isolation

Uploaded files must respect tenant boundaries.

Storage architecture should clearly associate files with tenant ownership.

Knowing the file path must never be sufficient to download it.

Authorization is still required.

---

# 111. Tenant-Aware Cache

Any future caching layer must include tenant context in cache keys where required.

---

# 112. Tenant-Aware Background Jobs

Queues and background jobs must carry trusted tenant context and validate ownership before processing.

---

# 113. Tenant-Aware Search

Company dashboard search must search only inside the active tenant.

---

# 114. Tenant-Aware Reports

Every report inside the company dashboard must automatically operate inside tenant context.

RAANKO Super Admin may use separate cross-tenant aggregate reports.

---

# 115. Tenant-Aware Audit Logs

Every tenant-owned audit log should identify tenant, user, action, entity, and timestamp.

This enables company audit trail and separately RAANKO platform security monitoring.

---

# 116. Support Access to Tenant Data

RAANKO support staff should not automatically have unrestricted invisible access to customer company data.

If support access is implemented, it should include explicit permission, support role, temporary access, impersonation with logging, reason for access, audit trail, and session expiration.

High-sensitivity operations may be prohibited while impersonating a customer.

---

# 117. Impersonation — Future Administrative Feature

"Login as Company Admin" is a future support feature, not ordinary authentication.

When impersonating:

- Clearly show impersonation state
- Record who initiated it, which tenant was accessed, start and end time, and important actions
- Allow immediate exit
- Never hide impersonation from security logs

---

# 118. Tenant Deletion

Deleting a company is a high-risk operation.

Do not immediately permanently delete a tenant and all its data.

Prefer:

Active → Suspended → Cancelled → Archived → Retention Period → Permanent Deletion if legally and operationally permitted

Permanent tenant deletion should require explicit privileged action and consider financial records, audit logs, legal retention, backups, documents, invoices, and customer data.

---

# 119. Tenant Backup and Recovery

Backup strategy must consider tenant recovery.

Do not promise tenant-specific restoration until the actual infrastructure supports it.

---

# 120. Multi-Tenant Security Testing

Automated tests must explicitly verify tenant isolation.

These tests are mandatory security tests, not optional unit tests.

---

# 121. Multi-Tenant Development Rule

Whenever a tenant-owned feature is designed or implemented, the questions in `AGENTS.md` section 7 must be answered.

A feature is not complete until those concerns have been evaluated.

---

# 122. Core Multi-Tenant Principle

One platform.

One maintainable codebase.

Many independent shipping companies.

Strictly isolated data.

Independent branding.

Independent users and permissions.

Independent operational workflows.

Centralized RAANKO administration.

Never propose creating a separate application codebase for every shipping company unless an exceptional Enterprise requirement is explicitly introduced in the future.

RAANKO should onboard a new shipping company primarily through configuration and provisioning, not through deploying a new copy of the application.
