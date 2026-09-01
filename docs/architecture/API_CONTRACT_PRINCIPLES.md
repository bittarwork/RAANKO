# API Contract Principles

Status: Design accepted for MVP. Implementation blocked until Design gate approval.

Base path: `/api/v1`

See `AUTHENTICATION_DESIGN.md`, `SYSTEM_ARCHITECTURE.md`, ADR-008, ADR-010.

---

## Goals

- One versioned REST API consumed by Next.js surfaces and future integrations
- Consistent request/response shapes across modules
- Authorization-safe errors with no cross-tenant data leakage
- Pagination and filtering on every list endpoint
- Clear separation of platform, company, portal, and public namespaces

---

## URL Structure

```text
/api/v1/{namespace}/{resource}
/api/v1/{namespace}/{resource}/{id}
/api/v1/{namespace}/{resource}/{id}/{sub-resource}
```

| Namespace | Prefix | Auth | Tenant Context |
|---|---|---|---|
| Platform | `/api/v1/platform/` | Platform token | Explicit tenant ID only on admin endpoints that operate on a tenant |
| Company | `/api/v1/company/` | Company token | From membership + host hint |
| Portal | `/api/v1/portal/` | Portal token | From portal account + host hint |
| Public | `/api/v1/public/` | None or tracking token | Subdomain hint only; strict read allowlists |
| Auth | `/api/v1/auth/` | Mixed | See `AUTHENTICATION_DESIGN.md` |

Examples:

```text
GET    /api/v1/company/shipments
GET    /api/v1/company/shipments/{id}
POST   /api/v1/company/quotes/{id}/approve
GET    /api/v1/platform/tenants
POST   /api/v1/platform/tenants
GET    /api/v1/portal/shipments
GET    /api/v1/public/track/{trackingNumber}
POST   /api/v1/company/imports/jobs
```

Rules:

- Nouns for resources, verbs as sub-resources or actions (`/approve`, `/cancel`, `/send`)
- No tenant ID in URL path for normal company operations
- Platform endpoints that target a tenant use `/api/v1/platform/tenants/{tenantId}/...`
- Breaking changes require `/api/v2`; additive changes stay in v1

---

## HTTP Methods

| Method | Use |
|---|---|
| GET | Read single resource or list |
| POST | Create resource or non-idempotent action |
| PATCH | Partial update |
| PUT | Full replace when the resource is a complete document (rare in MVP) |
| DELETE | Soft-delete or archive only where business rules allow |

Idempotency:

- POST create returns `201` with `Location` header
- Action endpoints (`POST .../approve`) return `200` or `409` if state invalid
- Support `Idempotency-Key` header on financial POST actions (Recommendation for MVP; required before production scale)

---

## Authentication Headers

| Header | Use |
|---|---|
| `Authorization: Bearer {accessToken}` | All authenticated API calls |
| `Cookie: refresh_token=...` | Browser refresh flow only |
| `Accept-Language: ar \| en` | Response message locale preference |
| `X-Request-Id` | Client-generated or server-assigned correlation ID |
| `Idempotency-Key` | Financial and provisioning mutations |

Company and portal requests must originate from the matching tenant host in production. Local dev may use header override documented in developer setup (Implementation phase).

---

## Standard Response Envelope

### Success — single resource

```json
{
  "data": {
    "id": "01JABC...",
    "type": "shipment",
    "attributes": { }
  },
  "meta": {
    "requestId": "01JREQ..."
  }
}
```

### Success — list (paginated)

```json
{
  "data": [
    { "id": "01J...", "type": "shipment", "attributes": { } }
  ],
  "meta": {
    "requestId": "01JREQ...",
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "totalItems": 142,
      "totalPages": 6
    }
  }
}
```

### Success — action with side effects

```json
{
  "data": {
    "id": "01J...",
    "type": "quote",
    "attributes": { "status": "sent" }
  },
  "meta": {
    "requestId": "01JREQ...",
    "warnings": []
  }
}
```

### Error

```json
{
  "error": {
    "code": "TENANT_READ_ONLY",
    "message": "This company account is in read-only mode.",
    "details": [],
    "requestId": "01JREQ..."
  }
}
```

Rules:

- `message` is safe for end users; no stack traces in production
- `details` holds field-level validation errors when applicable
- `code` is stable machine-readable string
- Cross-tenant or unauthorized resource access returns `404` or `403` with generic message — never confirm another tenant's resource exists

---

## Standard Error Codes

| HTTP | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid input |
| 401 | `UNAUTHENTICATED` | Missing or expired token |
| 403 | `FORBIDDEN` | Authenticated but not allowed |
| 403 | `TENANT_READ_ONLY` | Tenant in read-only mode |
| 403 | `TENANT_ACCESS_BLOCKED` | Suspended tenant |
| 403 | `FEATURE_NOT_AVAILABLE` | Missing entitlement |
| 404 | `NOT_FOUND` | Resource not found or not visible |
| 409 | `CONFLICT` | Invalid state transition |
| 409 | `DUPLICATE` | Unique constraint (e.g. customer email) |
| 422 | `BUSINESS_RULE_VIOLATION` | Valid syntax but business rule failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Pagination, Filtering, Sorting

All list endpoints support:

| Query Param | Default | Max |
|---|---|---|
| `page` | 1 | — |
| `pageSize` | 25 | 100 |
| `sort` | `-createdAt` | whitelisted fields only |
| `filter[field]` | — | per-resource whitelist |
| `search` | — | tenant-scoped full-text where supported |

Examples:

```text
GET /api/v1/company/shipments?page=2&pageSize=50&sort=-createdAt
GET /api/v1/company/shipments?filter[status]=in_transit&filter[branchId]=01J...
GET /api/v1/company/customers?search=acme
```

Rules:

- Never return unbounded lists
- Filter and sort field names are whitelisted per resource
- Branch-scoped users receive automatic branch filter injection server-side

---

## Field Visibility and Redaction

Response serialization applies policy by auth surface and permissions:

| Data | Company employee | Portal | Public |
|---|---|---|---|
| Sell prices | If permitted | Own quotes/shipments | Never |
| Buy prices | `finance.buy_prices.view` | Never | Never |
| Margins / profit | `finance.margins.view` / `finance.profitability.view` | Never | Never |
| Internal notes | Employee modules | Never | Never |
| Internal documents | Permission-based | Customer-visible only | Never |
| Tracking events | Full timeline | Own shipments | Public events only |

Use explicit DTO mappers per surface. Do not rely on frontend to hide fields.

---

## Dates, Money, and Identifiers

| Type | API Format |
|---|---|
| Timestamps | ISO 8601 UTC (`2026-09-01T18:30:00Z`) |
| Dates | ISO 8601 date (`2026-09-01`) |
| Money | Integer minor units + `currency` code (`amount: 125000, currency: "EUR"`) |
| Primary IDs | ULID strings |
| Business numbers | Separate fields (`shipmentNumber`, `quoteNumber`) |

Display formatting (timezone, locale, currency symbol) is a frontend concern. API stores and returns canonical values.

---

## Async and Long-Running Operations

Heavy work returns `202 Accepted` with a job reference:

```json
{
  "data": {
    "id": "01JJOB...",
    "type": "importJob",
    "attributes": {
      "status": "queued"
    }
  },
  "meta": {
    "requestId": "01JREQ...",
    "pollUrl": "/api/v1/company/imports/jobs/01JJOB..."
  }
}
```

Used for:

- Excel imports
- Large report generation
- Bulk PDF generation
- Email dispatch is fire-and-forget from caller perspective (job internal)

Client polls job status or receives notification when complete.

---

## File Upload and Download

Upload:

```text
POST /api/v1/company/documents/upload
Content-Type: multipart/form-data
```

Returns document metadata. Virus scan and validation may transition status to `processing` → `available`.

Download:

```text
GET /api/v1/company/documents/{id}/download
→ 302 redirect to short-lived signed URL
```

Signed URLs expire in minutes. Direct bucket URLs are never returned as permanent links.

---

## Webhooks and Public API Keys

Phase 2. MVP API is browser-first via Next.js. Design leaves room for:

- `/api/v1/integrations/...` namespace
- Event catalog: `shipment.updated`, `quote.accepted`, etc.

Do not implement in MVP.

---

## Versioning and Deprecation

- Version in URL path (`/api/v1`)
- Deprecation header: `Deprecation: true`, `Sunset: {date}` when introduced
- Minimum 90-day deprecation window for external consumers (Future)

---

## OpenAPI and Contract Testing

- Generate OpenAPI 3.1 spec from NestJS decorators or schema definitions during Implementation
- Contract tests verify pagination envelope, error shape, and redaction rules
- Permission matrix tests call endpoints with each default role fixture

---

## Module Endpoint Map (MVP, Design Level)

| Module | Company Prefix | Portal Prefix | Platform Prefix |
|---|---|---|---|
| Identity / Auth | `/auth/company/` | `/auth/portal/` | `/auth/platform/` |
| Organization | `/company/branches`, `/company/employees`, `/company/roles` | — | — |
| CRM | `/company/customers` | `/portal/profile` | — |
| Suppliers | `/company/suppliers`, `/company/rate-sheets` | — | — |
| Quotes | `/company/quotes`, `/company/rfq` | `/portal/rfq`, `/portal/quotes` | — |
| Bookings | `/company/bookings` | `/portal/bookings` | — |
| Shipments | `/company/shipments` | `/portal/shipments` | — |
| Tracking | `/company/shipments/{id}/events` | `/portal/shipments/{id}/tracking` | `/public/track/{trackingNumber}` |
| Documents | `/company/documents` | `/portal/documents` | — |
| Finance | `/company/invoices`, `/company/payments`, etc. | `/portal/invoices` | — |
| Reports | `/company/dashboard`, `/company/reports` | — | `/platform/usage` |
| Support | `/company/support/requests` | `/portal/support/requests` | `/platform/support/tickets` |
| Imports | `/company/imports/jobs` | — | — |
| Tenants | — | — | `/platform/tenants` |
| Subscriptions | `/company/subscription` (read) | — | `/platform/tenants/{id}/subscription` |

---

## Related Documents

- `AUTHENTICATION_DESIGN.md`
- `PERMISSIONS_MODEL.md`
- `CORE_WORKFLOWS.md`
- `UX_FLOWS.md`
