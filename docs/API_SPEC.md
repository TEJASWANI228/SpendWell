# SpendWell — REST API Specification

> Base URL: `https://api.spendwell.app/api/v1` (local: `http://localhost:4000/api/v1`)
> Version: `v1` · Contract owner: `packages/shared` (Zod schemas + inferred types)
> Status: design baseline. Any change to this file is a contract change and must update `packages/shared` in the same PR.

---

## 0. Assumptions

| # | Assumption |
|---|---|
| S1 | The web app and API are served from origins allowed by `CORS_ORIGINS`. The refresh cookie works because `credentials: 'include'` is set on the client and the API returns an explicit `Access-Control-Allow-Origin`, never `*`. |
| S2 | Access tokens are short-lived (15 min) and sent as `Authorization: Bearer`. Refresh tokens are **only** in the httpOnly cookie and never appear in a JSON body. |
| S3 | A user has exactly one currency; amounts are integer minor units. `amount` is always positive and `type` carries the direction. |
| S4 | Dates without time (`YYYY-MM-DD`) are calendar dates. Timestamps (`createdAt`, `expiresAt`) are ISO 8601 UTC with milliseconds. |
| S5 | `page`/`pageSize` pagination is used on every collection. `pageSize` max 100. Out-of-range `page` returns an empty `data` array with correct `meta`, not a 400. |
| S6 | Cross-user access returns **404 NOT_FOUND**, never 403, to avoid leaking existence. |
| S7 | There is no general-purpose `Idempotency-Key` in v1. Duplicate transaction creates on a network retry are possible; recurring and CSV writes are protected by database uniqueness instead. See §13. |
| S8 | CSV import is synchronous for files up to 5 MB / 5 000 rows. Larger files are rejected; async import is a future feature, not a v1 promise. |
| S9 | Email is normalized to lowercase and trimmed before lookup. Login errors never reveal whether the email exists. |
| S10 | `DELETE` is permanent for transactions/budgets. Categories archive when referenced. Notifications are historical and are not retracted when a transaction is deleted. |

---

## 1. Conventions

### 1.1 Headers

| Header | Direction | Notes |
|---|---|---|
| `Authorization: Bearer <accessToken>` | request | Required on all private endpoints |
| `Content-Type: application/json` | request | Except `multipart/form-data` for import |
| `Accept: application/json` | request | `text/csv` for export |
| `X-Request-Id` | both | Optional inbound; if absent the API generates one. Always echoed. Include it in bug reports. |
| `Set-Cookie: sw_refresh=...` | response | `HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=2592000` |
| `Retry-After` | response | Present on `429`; seconds |

### 1.2 Success envelope

Single resource:

```json
{ "data": { "id": "8f14e45f-ceea-4f2c-9d5b-1c0f4a2e9b77" } }
```

Collection:

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 137,
    "totalPages": 7,
    "hasMore": true
  }
}
```

Some collections add fields to `meta` (e.g. `summary`, `unreadCount`, `month`). Those are documented per endpoint.

### 1.3 Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "amount", "message": "Expected a positive integer in minor units" }
    ]
  },
  "requestId": "req_01J9Z8K3V7"
}
```

`details` is optional and shape depends on `code`:

- `VALIDATION_ERROR` → `[{ field, message }]`
- `RATE_LIMITED` → `{ retryAfterSeconds }`
- `IMPORT_*` → row errors live in the **success** body (`data.errors`), not here

### 1.4 Error codes (closed catalog)

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body/query/params failed Zod validation |
| 400 | `INVALID_DATE_RANGE` | `from > to`, or both `month` and `from`/`to` supplied |
| 400 | `OTP_INVALID` | Wrong 6-digit code (an attempt is consumed) |
| 400 | `IMPORT_INVALID_FILE` | Missing header, unreadable CSV, wrong file type |
| 401 | `UNAUTHENTICATED` | No/invalid bearer token |
| 401 | `TOKEN_EXPIRED` | Access token expired; client should refresh once |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password (deliberately indistinguishable) |
| 401 | `REFRESH_TOKEN_INVALID` | Missing, unknown, revoked, or expired refresh cookie |
| 401 | `REFRESH_TOKEN_REUSED` | A rotated token was presented; entire family revoked |
| 404 | `NOT_FOUND` | Resource does not exist **or is not owned by the caller** |
| 404 | `ROUTE_NOT_FOUND` | No route matches |
| 405 | `METHOD_NOT_ALLOWED` | Route exists, verb does not |
| 409 | `EMAIL_TAKEN` | Registration with an existing email |
| 409 | `CATEGORY_EXISTS` | Duplicate category name for this user (case-insensitive) |
| 409 | `BUDGET_EXISTS` | Budget already exists for `(category, month)` |
| 409 | `CURRENCY_LOCKED` | Currency change attempted after transactions exist |
| 409 | `CATEGORY_IN_USE` | Hard delete of a referenced category (only via `?hard=true`) |
| 409 | `CONFLICT` | Generic unique-constraint fallback (should be rare) |
| 413 | `PAYLOAD_TOO_LARGE` | JSON > 100 kB or CSV > 5 MB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Import not sent as `multipart/form-data` |
| 422 | `CATEGORY_TYPE_MISMATCH` | Income category on an expense (or vice versa) |
| 422 | `CATEGORY_TYPE_IMMUTABLE` | Attempt to change a category's `type` |
| 422 | `CATEGORY_ARCHIVED` | Operation requires an active category |
| 422 | `OTP_EXPIRED` | OTP past its 10-minute TTL |
| 422 | `OTP_LOCKED` | 5 failed attempts on the current OTP |
| 422 | `RESET_TOKEN_INVALID` | Reset token malformed, expired, or already used |
| 422 | `RANGE_TOO_LARGE` | Analytics range exceeds the granularity cap, or an export exceeds 100 000 rows |
| 422 | `IMPORT_ALL_ROWS_FAILED` | Every row failed validation; nothing written |
| 429 | `RATE_LIMITED` | Per-IP or per-user limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected server error (no internals leaked) |
| 503 | `SERVICE_UNAVAILABLE` | Readiness check failed (DB down) |

### 1.5 Pagination, sorting, filtering

- `page` ≥ 1 (default 1), `pageSize` ∈ [1, 100] (default 20).
- `total` is the count matching the **filters**, not the page.
- Sort parameters are allow-lists; an unknown value is a `VALIDATION_ERROR`, never a silent fallback.
- Default sort for transactions is `date_desc` with `id DESC` as a tiebreak, so pagination is stable when dates collide.

### 1.6 Money and dates

- All amount fields are integers in **minor units** (`24900` = ₹249.00). The client formats with the currency exponent.
- `currency` is ISO 4217 (`INR`, `USD`, `JPY`). It is returned once per transaction; the user object holds the account currency.
- `date` / `periodStart` / `month` are `YYYY-MM-DD`. A budget month is always the 1st (`2026-11-01`). Clients may send `month=2026-11`; the API normalizes to `2026-11-01`.
- `createdAt` / `updatedAt` / `expiresAt` are ISO 8601 UTC.
- Filter `from`/`to` are **inclusive** calendar dates; internally the API converts to a half-open range (`to + 1 day`, exclusive).

### 1.7 Rate limits

| Scope | Limit |
|---|---|
| Global, authenticated | 300 req/min/user |
| Global, anonymous | 60 req/min/IP |
| `POST /auth/register`, `POST /auth/login` | 10 req/min/IP |
| `POST /auth/forgot-password` | 3 req/hour/email + 10 req/hour/IP |
| `POST /auth/verify-otp` | 5 attempts/OTP (plus 10 req/min/IP) |
| `POST /transactions/import` | 5 req/hour/user |

`429` responses include `Retry-After` and `details.retryAfterSeconds`.

---

## 2. Auth

All auth endpoints are **public** (no bearer token required) except logout-all. The refresh cookie is the only credential that crosses requests.

### 2.1 `POST /auth/register`

Creates a user, seeds the 11 default categories, issues a session.

**Body**

```json
{
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "password": "CorrectHorse9"
}
```

| Field | Rules |
|---|---|
| `name` | 2–80 chars, trimmed |
| `email` | valid email, ≤ 320 chars, stored lowercase |
| `password` | 8–72 **bytes**, at least one letter and one digit, not in the common-password list |

**Response `201`** — also sets `sw_refresh` cookie.

```json
{
  "data": {
    "user": {
      "id": "3f1b7c9e-5d2a-4f8b-9c1d-7e6a0b2c4d51",
      "name": "Aarav Sharma",
      "email": "aarav@example.com",
      "currency": "INR",
      "timezone": "Asia/Kolkata",
      "avatarUrl": null,
      "onboardingCompletedAt": null,
      "emailVerifiedAt": null,
      "createdAt": "2026-11-03T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:** `400 VALIDATION_ERROR`, `409 EMAIL_TAKEN`, `429 RATE_LIMITED`.

### 2.2 `POST /auth/login`

**Body:** `{ "email": "...", "password": "..." }`

**Response `200`:** same shape as register (`user`, `accessToken`) + new refresh cookie.
Each login creates a **new token family**; sessions are independent.

**Errors:** `400`, `401 INVALID_CREDENTIALS` (identical body for unknown email and wrong password), `429`.

### 2.3 `POST /auth/refresh`

Reads the `sw_refresh` cookie. Rotates the token: the presented token is marked `revokedAt` and `replacedById`, and a new cookie is issued in the same family.

**Body:** none.

**Response `200`**

```json
{ "data": { "accessToken": "eyJ..." } }
```

**Errors:** `401 REFRESH_TOKEN_INVALID`, `401 REFRESH_TOKEN_REUSED` (family revoked; client must log in again).

**CSRF note:** the cookie is `SameSite=Lax`, the endpoint only accepts requests whose `Origin` is in `CORS_ORIGINS`, and it returns a token readable only by allowed origins. It does not mutate user data.

### 2.4 `POST /auth/logout`

Public (works even with an expired access token). Revokes the presented refresh token, clears the cookie.

**Response `204`** (no body).
**Errors:** none on the happy path; an unknown cookie is still `204` (idempotent).

### 2.5 `POST /auth/logout-all`

**Auth:** required.

Revokes **every** refresh-token family for the user and clears the current cookie. Used after a password change or "sign out everywhere".

**Response `204`.**
**Errors:** `401 UNAUTHENTICATED`, `401 TOKEN_EXPIRED`.

### 2.6 `POST /auth/forgot-password`

Sends a 6-digit OTP to the account email if it exists. Always responds `202` to prevent account enumeration. Doubles as "resend OTP" with a 60-second cooldown.

**Body:** `{ "email": "aarav@example.com" }`

**Response `202`**

```json
{ "data": { "message": "If an account exists, a code has been sent." } }
```

**Errors:** `400 VALIDATION_ERROR`, `429 RATE_LIMITED` (includes `retryAfterSeconds`, may be the 60 s cooldown).

**Email:** the OTP is valid for 10 minutes, 5 attempts. Only the bcrypt hash is stored. The previous unconsumed OTP for `PASSWORD_RESET` is invalidated when a new one is issued.

### 2.7 `POST /auth/verify-otp`

**Body**

```json
{ "email": "aarav@example.com", "code": "482913" }
```

**Response `200`**

```json
{
  "data": {
    "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 600
  }
}
```

`resetToken` is a signed JWT with `purpose: "pwd_reset"`, `jti` = OTP row id, 10-minute TTL, and is accepted only once (the OTP is marked consumed on successful reset).

**Errors:** `400 VALIDATION_ERROR`, `400 OTP_INVALID`, `422 OTP_EXPIRED`, `422 OTP_LOCKED`, `429 RATE_LIMITED`.

### 2.8 `POST /auth/reset-password`

**Body**

```json
{ "resetToken": "eyJ...", "newPassword": "NewCorrectHorse9" }
```

**Response `200`:** `{ "data": { "message": "Password updated. Please sign in again." } }`

Side effects: OTP marked consumed, **all** refresh-token families revoked, `lastLoginAt` untouched. The user must log in again with the new password.

**Errors:** `400 VALIDATION_ERROR`, `422 RESET_TOKEN_INVALID`, `429 RATE_LIMITED`.

---

## 3. Profile

### 3.1 `GET /users/me`

**Auth:** required.

```json
{
  "data": {
    "id": "3f1b7c9e-5d2a-4f8b-9c1d-7e6a0b2c4d51",
    "name": "Aarav Sharma",
    "email": "aarav@example.com",
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "avatarUrl": null,
    "onboardingCompletedAt": "2026-11-03T10:04:12.000Z",
    "emailVerifiedAt": null,
    "createdAt": "2026-11-03T10:00:00.000Z"
  }
}
```

**Errors:** `401 UNAUTHENTICATED`, `401 TOKEN_EXPIRED`.

### 3.2 `PATCH /users/me`

**Auth:** required. Partial update; omitted fields are unchanged.

```json
{
  "name": "Aarav S.",
  "currency": "INR",
  "timezone": "Asia/Kolkata",
  "avatarUrl": "https://cdn.example.com/avatars/3f1b.jpg"
}
```

| Field | Rules |
|---|---|
| `name` | 2–80 chars |
| `currency` | ISO 4217; **409 `CURRENCY_LOCKED`** if the user has any transaction |
| `timezone` | IANA identifier (validated against `Intl.supportedValuesOf('timeZone')`) |
| `avatarUrl` | valid `https` URL ≤ 512 chars, or `null` |

**Response `200`:** updated user object.
**Errors:** `400 VALIDATION_ERROR`, `401`, `409 CURRENCY_LOCKED`.

### 3.3 `PATCH /users/me/password`

**Body:** `{ "currentPassword": "...", "newPassword": "..." }`

**Response `204`.**
Revokes all refresh-token families **except the current one** (the user stays signed in on this device), and clears the cookie only if the current token cannot be identified.

**Errors:** `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS` (wrong current password), `401 UNAUTHENTICATED`.

### 3.4 `POST /users/me/onboarding-complete`

**Body:** none. Sets `onboardingCompletedAt = now()` if unset (idempotent).

**Response `200`:** `{ "data": { "onboardingCompletedAt": "2026-11-03T10:04:12.000Z" } }`
**Errors:** `401`.

### 3.5 `DELETE /users/me`

**Body:** `{ "password": "CorrectHorse9" }` (confirmation, so a stolen access token alone cannot destroy data).

**Response `204`.** Hard-deletes the user and all owned rows; refresh tokens are revoked as part of the cascade. The client clears local state and routes to `/`.

**Errors:** `400`, `401 INVALID_CREDENTIALS`, `401 UNAUTHENTICATED`.

---

## 4. Categories

A category belongs to one user. `type` is immutable because transactions and budgets depend on it. Categories are archived rather than orphaned.

Category object:

```json
{
  "id": "b7c1e2d3-4a5f-4e6b-8c9d-0a1b2c3d4e5f",
  "name": "Food & Dining",
  "type": "EXPENSE",
  "icon": "utensils",
  "color": "#F97316",
  "isArchived": false,
  "createdAt": "2026-11-03T10:00:00.000Z",
  "updatedAt": "2026-11-03T10:00:00.000Z"
}
```

### 4.1 `GET /categories`

**Auth:** required.

| Query | Type | Default | Notes |
|---|---|---|---|
| `type` | `INCOME \| EXPENSE` | — | optional filter |
| `includeArchived` | boolean | `false` | |
| `page` | int | 1 | |
| `pageSize` | int | 20 | max 100; the picker requests 100 |

Sort: `type ASC, name ASC` (deterministic, no query param).

**Response `200`:** paginated list of category objects.
**Errors:** `400 VALIDATION_ERROR`, `401`.

### 4.2 `GET /categories/:id`

**Response `200`:** category object.
**Errors:** `401`, `404 NOT_FOUND`.

### 4.3 `POST /categories`

**Body**

```json
{ "name": "Groceries", "type": "EXPENSE", "icon": "shopping-basket", "color": "#22C55E" }
```

| Field | Rules |
|---|---|
| `name` | 1–40 chars, trimmed, Title Case applied by API |
| `type` | required, `INCOME` or `EXPENSE` |
| `icon` | optional, key from the design icon set, ≤ 40 chars |
| `color` | optional, `#RRGGBB` |

**Response `201`:** category object.
**Errors:** `400`, `401`, `409 CATEGORY_EXISTS` (case-insensitive, including archived).

### 4.4 `PATCH /categories/:id`

**Body:** any of `name`, `icon`, `color`, `isArchived`. Sending `type` → `422 CATEGORY_TYPE_IMMUTABLE`.

**Response `200`:** updated category.
**Errors:** `400`, `401`, `404`, `409 CATEGORY_EXISTS`, `422 CATEGORY_TYPE_IMMUTABLE`.

### 4.5 `DELETE /categories/:id`

Default behavior is **safe**:

- If the category has **no** transactions, budgets, or recurring rules → hard delete.
- Otherwise → `isArchived = true`; history and budgets remain intact.

`?hard=true` forces deletion; if referenced it fails with `409 CATEGORY_IN_USE`.

**Response `200`**

```json
{ "data": { "id": "b7c1e2d3-...", "deleted": false, "archived": true } }
```

**Errors:** `400`, `401`, `404`, `409 CATEGORY_IN_USE`.

---

## 5. Transactions

Transaction object (category is embedded so the list screen renders in one request):

```json
{
  "id": "0d9c8b7a-6f5e-4d3c-2b1a-0f9e8d7c6b5a",
  "type": "EXPENSE",
  "amount": 24900,
  "currency": "INR",
  "date": "2026-11-03",
  "category": {
    "id": "b7c1e2d3-4a5f-4e6b-8c9d-0a1b2c3d4e5f",
    "name": "Food & Dining",
    "icon": "utensils",
    "color": "#F97316"
  },
  "note": "Lunch with team",
  "merchant": "Cafe Coffee Day",
  "source": "MANUAL",
  "recurringRuleId": null,
  "importBatchId": null,
  "createdAt": "2026-11-03T09:12:44.000Z",
  "updatedAt": "2026-11-03T09:12:44.000Z"
}
```

### 5.1 `GET /transactions`

**Auth:** required. Every result is scoped to the caller.

| Query | Type | Default | Rules |
|---|---|---|---|
| `page` | int | 1 | ≥ 1 |
| `pageSize` | int | 20 | 1–100 |
| `q` | string | — | 1–80 chars; case-insensitive substring on `note` **or** `merchant`; `%`/`_` escaped |
| `type` | enum | — | `INCOME \| EXPENSE` |
| `categoryId` | uuid | — | |
| `from` | date | — | inclusive |
| `to` | date | — | inclusive; must be ≥ `from` |
| `minAmount` | int | — | minor units, ≥ 0 |
| `maxAmount` | int | — | minor units, ≥ `minAmount` |
| `sort` | enum | `date_desc` | `date_desc`, `date_asc`, `amount_desc`, `amount_asc`, `created_desc` |

**Response `200`**

```json
{
  "data": [ { "id": "0d9c...", "type": "EXPENSE", "amount": 24900, "...": "..." } ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 137,
    "totalPages": 7,
    "hasMore": true,
    "summary": {
      "income": 8500000,
      "expense": 3124500,
      "net": 5375500,
      "count": 137
    }
  }
}
```

`meta.summary` is computed over **all rows matching the filters**, not just the page. It powers the "this month: spent / received" header without a second request. Cost is one extra aggregate query; acceptable at this scale.

**Errors:** `400 VALIDATION_ERROR`, `400 INVALID_DATE_RANGE`, `401`.

**Search implementation note:** `q` uses `ILIKE` over `note` and `merchant`, served by the `pg_trgm` GIN indexes. The query is:

```sql
WHERE "userId" = $1
  AND (note ILIKE '%' || $q || '%' OR merchant ILIKE '%' || $q || '%')
```

`%`, `_`, and `\` in `q` are escaped before interpolation; the value is still passed as a parameter.

### 5.2 `GET /transactions/:id`

**Response `200`:** transaction object.
**Errors:** `401`, `404 NOT_FOUND`.

### 5.3 `POST /transactions`

**Body**

```json
{
  "type": "EXPENSE",
  "amount": 24900,
  "categoryId": "b7c1e2d3-4a5f-4e6b-8c9d-0a1b2c3d4e5f",
  "date": "2026-11-03",
  "note": "Lunch with team",
  "merchant": "Cafe Coffee Day"
}
```

| Field | Rules |
|---|---|
| `type` | required enum |
| `amount` | required int, `1 … 2_000_000_000` (₹2 crore in paise; stays inside PostgreSQL `Int`) |
| `categoryId` | required uuid, active, owned, matching `type` |
| `date` | required, `2000-01-01 … 2100-01-01`, not more than 1 day in the future (timezone-aware) |
| `note` | optional, ≤ 280 chars |
| `merchant` | optional, ≤ 80 chars |

`currency` is **never** accepted from the client; it is copied from the user.
`source` is always `MANUAL`.

**Response `201`:** transaction object.
Side effect: budget alert evaluation runs after commit and may create a `BUDGET_WARNING` / `BUDGET_EXCEEDED` notification. A notification failure never fails the transaction.

**Errors:** `400`, `401`, `404 NOT_FOUND` (category missing/not owned), `422 CATEGORY_TYPE_MISMATCH`, `422 CATEGORY_ARCHIVED`.

### 5.4 `PATCH /transactions/:id`

**Body:** any subset of `type`, `amount`, `categoryId`, `date`, `note`, `merchant`.

- If `type` or `categoryId` changes, the final pair must still match.
- `currency` and `source` are immutable.
- Editing a generated (recurring) transaction is allowed; it does **not** alter the rule.
- Moving a transaction across months triggers budget re-evaluation for both months; alerts are deduped, so an old alert may remain in the inbox (notifications are history, not state).

**Response `200`:** updated transaction.
**Errors:** `400`, `401`, `404`, `422 CATEGORY_TYPE_MISMATCH`, `422 CATEGORY_ARCHIVED`.

### 5.5 `DELETE /transactions/:id`

**Response `204`.** Hard delete. Budget totals recompute on the next request; existing notifications are not deleted.

**Errors:** `401`, `404 NOT_FOUND`.

---

## 6. CSV import / export

### 6.1 `GET /transactions/export.csv`

**Auth:** required.

| Query | Type | Notes |
|---|---|---|
| `from` | date | optional |
| `to` | date | optional |
| `type` | enum | optional |
| `categoryId` | uuid | optional |

**Response `200`**

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="spendwell-transactions-2026-11-03.csv"
```

CSV columns (header always present, UTF-8 with BOM so Excel opens it correctly):

```csv
Date,Type,Amount,Currency,Category,Note,Merchant
2026-11-03,EXPENSE,249.00,INR,Food & Dining,Lunch with team,Cafe Coffee Day
2026-11-01,INCOME,85000.00,INR,Salary,Monthly salary,Acme Corp
```

- `Amount` is formatted in **major units** using the currency exponent (2 for INR). This is deliberate: spreadsheets and humans expect `249.00`, and re-import converts the string back to integer minor units without floats.
- Fields containing `,`, `"`, or newlines are quoted per RFC 4180; notes are sanitized of control characters.
- Streaming: keyset batches of 500 ordered by `(date DESC, id DESC)`, so memory stays flat for large exports. Row cap: 100 000 → `422 RANGE_TOO_LARGE` beyond that with a suggestion to narrow the date range.

**Errors:** `400`, `401`, `422 RANGE_TOO_LARGE`.

### 6.2 `GET /transactions/import/template`

**Auth:** required. Returns a CSV with the header and two example rows.

**Response `200`:** `text/csv`, `Content-Disposition: attachment; filename="spendwell-import-template.csv"`.

### 6.3 `POST /transactions/import`

**Auth:** required. `Content-Type: multipart/form-data`.

| Part / query | Rules |
|---|---|
| `file` (part) | required; `.csv`, ≤ 5 MB, ≤ 5 000 data rows, UTF-8 |
| `dryRun` (query) | boolean, default `false`; validates and returns the report without writing |
| `allowDuplicates` (query) | boolean, default `false`; bypasses fingerprint skipping |
| `createMissingCategories` (query) | boolean, default `false`; if true, unknown categories are created with the **type of the row** (first occurrence wins) |

**Required headers** (case-insensitive, order-independent): `date`, `type`, `amount`, `category`. Optional: `note`, `merchant`.

**Row rules**

| Column | Accepted | Rejected code |
|---|---|---|
| `date` | `YYYY-MM-DD` (also `YYYY/MM/DD` normalized) | `INVALID_DATE` |
| `type` | `INCOME`/`EXPENSE` (case-insensitive), also `CREDIT`/`DEBIT` | `INVALID_TYPE` |
| `amount` | decimal string, `> 0`, up to currency exponent decimals; no thousands separators; `1,234.50` rejected | `INVALID_AMOUNT` |
| `category` | case-insensitive match against active categories | `UNKNOWN_CATEGORY` |
| `category` type | must match row `type` | `CATEGORY_TYPE_MISMATCH` |
| `note` | ≤ 280 chars | `NOTE_TOO_LONG` |
| `merchant` | ≤ 80 chars | `MERCHANT_TOO_LONG` |

**Response `200`** (partial success or dry run)

```json
{
  "data": {
    "batchId": "c4a1...",
    "dryRun": false,
    "summary": {
      "rowCount": 42,
      "imported": 38,
      "skippedDuplicates": 2,
      "failed": 2,
      "createdCategories": 0
    },
    "errors": [
      { "row": 17, "code": "INVALID_AMOUNT", "message": "\"twelve\" is not a valid amount" },
      { "row": 31, "code": "UNKNOWN_CATEGORY", "message": "No active category named \"Pets\"" }
    ]
  }
}
```

- `errors` is capped at 100 entries (`errorReport` in `ImportBatch` keeps the same cap); `summary.failed` is the true count.
- Duplicates are detected by `sha256(userId | date | type | amountMinor | categoryId | lower(trim(note)))`. The same fingerprint twice in one file is reported as a duplicate, not an error.
- Writes happen in **one database transaction** in chunks of 500 via `createMany`. If every row fails validation, nothing is written and the response is `422 IMPORT_ALL_ROWS_FAILED`. If a DB error occurs mid-write, the batch is marked `FAILED`, nothing is committed, and the client gets `500`.
- `dryRun=true` returns `batchId: null` and writes nothing; it is what the "preview" step in the UI calls.

**Errors:** `400 VALIDATION_ERROR`, `400 IMPORT_INVALID_FILE` (bad/missing header, unparseable file), `401`, `413 PAYLOAD_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `422 IMPORT_ALL_ROWS_FAILED`, `429 RATE_LIMITED`.

**Routing note (implementation):** register the literal paths `GET /transactions/export.csv`, `GET /transactions/import/template`, and `POST /transactions/import` **before** `GET /transactions/:id`. Likewise register `GET /notifications/unread-count` before `GET /notifications/:id`. Express matches in declaration order; otherwise `export.csv` is parsed as an `:id` and fails UUID validation.

---

## 7. Budgets

Budget object. `spent`, `remaining`, `percentUsed`, and `status` are **computed** for the requested month.

```json
{
  "id": "e5f6a7b8-9c0d-4e1f-8a2b-3c4d5e6f7a8b",
  "category": {
    "id": "b7c1e2d3-4a5f-4e6b-8c9d-0a1b2c3d4e5f",
    "name": "Food & Dining",
    "icon": "utensils",
    "color": "#F97316"
  },
  "month": "2026-11-01",
  "limitAmount": 800000,
  "spent": 612500,
  "remaining": 187500,
  "percentUsed": 76.6,
  "alertThresholdPct": 80,
  "status": "OK",
  "createdAt": "2026-11-01T06:00:00.000Z",
  "updatedAt": "2026-11-02T08:30:00.000Z"
}
```

`status`: `OK` → below threshold, `WARNING` → at/above threshold but ≤ limit, `EXCEEDED` → spent > limit. Comparisons are integer cross-multiplications, never float division. `percentUsed` is display-only, rounded to one decimal.

### 7.1 `GET /budgets`

**Auth:** required.

| Query | Type | Default | Notes |
|---|---|---|---|
| `month` | `YYYY-MM` | current month (user timezone) | normalized to first day |
| `page` | int | 1 | |
| `pageSize` | int | 20 | max 100 |
| `status` | enum | — | optional filter: `OK`, `WARNING`, `EXCEEDED` (applied after aggregation) |

**Response `200`**

```json
{
  "data": [ { "...": "budget object" } ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 6,
    "totalPages": 1,
    "hasMore": false,
    "month": "2026-11-01",
    "summary": { "totalLimit": 3200000, "totalSpent": 2145000, "totalRemaining": 1055000 }
  }
}
```

Note: `status` filtering is applied in SQL after the spend aggregation so pagination totals stay correct.

**Errors:** `400 VALIDATION_ERROR`, `401`.

### 7.2 `POST /budgets`

**Body**

```json
{
  "categoryId": "b7c1e2d3-4a5f-4e6b-8c9d-0a1b2c3d4e5f",
  "month": "2026-11",
  "limitAmount": 800000,
  "alertThresholdPct": 80
}
```

| Field | Rules |
|---|---|
| `categoryId` | owned, **EXPENSE** category, active |
| `month` | `YYYY-MM`, within `2000-01 … 2100-12` |
| `limitAmount` | int, 1 … 2_000_000_000 |
| `alertThresholdPct` | int 1–100, default 80 |

**Response `201`:** budget object (with computed `spent`).
**Errors:** `400`, `401`, `404 NOT_FOUND`, `409 BUDGET_EXISTS`, `422 CATEGORY_ARCHIVED`.

### 7.3 `PATCH /budgets/:id`

**Body:** `{ "limitAmount"?: int, "alertThresholdPct"?: int }`. `categoryId` and `month` are immutable (delete and recreate instead).

**Response `200`:** updated budget object.
**Errors:** `400`, `401`, `404`.

### 7.4 `DELETE /budgets/:id`

**Response `204`.**
**Errors:** `401`, `404`.

### 7.5 `POST /budgets/copy` — optional (Phase 4 stretch)

Copies all budgets from one month to another in one transaction.

```json
{ "fromMonth": "2026-10", "toMonth": "2026-11", "overwrite": false }
```

**Response `200`:** `{ "data": { "fromMonth": "2026-10-01", "toMonth": "2026-11-01", "copied": 6, "skipped": 0 } }`
`overwrite: true` updates existing `(category, month)` rows instead of skipping them.
**Errors:** `400`, `401`, `409 BUDGET_EXISTS` (when `overwrite=false` and a single conflict would be created — in that case nothing is copied), `422`.

---

## 8. Recurring rules

Recurring rules generate transactions automatically. The rule is a **template**; generated rows are ordinary transactions with `source: "RECURRING"`, `recurringRuleId`, and `occurrenceDate`. The scheduler is described in `ARCHITECTURE.md` §6 and `INTERVIEW_NOTES.md` §1.

Recurring rule object:

```json
{
  "id": "f0a1b2c3-d4e5-4f60-8a7b-9c0d1e2f3a4b",
  "category": {
    "id": "b7c1e2d3-4a5f-4e6b-8c9d-0a1b2c3d4e5f",
    "name": "Rent",
    "icon": "home",
    "color": "#6366F1"
  },
  "type": "EXPENSE",
  "amount": 2500000,
  "currency": "INR",
  "note": "Monthly rent",
  "merchant": "Landlord",
  "frequency": "MONTHLY",
  "interval": 1,
  "startDate": "2026-01-31",
  "endDate": null,
  "nextRunAt": "2026-11-30",
  "lastRunAt": "2026-10-31",
  "isActive": true,
  "timezone": "Asia/Kolkata",
  "createdAt": "2026-01-31T06:00:00.000Z",
  "updatedAt": "2026-10-31T00:15:02.000Z"
}
```

`nextRunAt` is always the **next date that has not been generated**, in the rule's timezone. `currency` is derived from the user and is not writable.

### 8.1 `GET /recurring-rules`

**Auth:** required.

| Query | Type | Default | Notes |
|---|---|---|---|
| `isActive` | boolean | — | filter paused rules |
| `categoryId` | uuid | — | |
| `page` | int | 1 | |
| `pageSize` | int | 20 | max 100 |

Sort: `isActive DESC, nextRunAt ASC` (active rules first, soonest next).

**Response `200`:** paginated list of rule objects.
**Errors:** `400 VALIDATION_ERROR`, `401`.

### 8.2 `GET /recurring-rules/:id`

**Response `200`:** rule object.
**Errors:** `401`, `404 NOT_FOUND`.

### 8.3 `POST /recurring-rules`

**Body**

```json
{
  "categoryId": "b7c1e2d3-4a5f-4e6b-8c9d-0a1b2c3d4e5f",
  "type": "EXPENSE",
  "amount": 2500000,
  "note": "Monthly rent",
  "merchant": "Landlord",
  "frequency": "MONTHLY",
  "interval": 1,
  "startDate": "2026-01-31",
  "endDate": null
}
```

| Field | Rules |
|---|---|
| `categoryId` | owned, active, type matches |
| `type` | `INCOME \| EXPENSE` |
| `amount` | int, `1 … 2_000_000_000` |
| `note`, `merchant` | same limits as a transaction |
| `frequency` | `DAILY \| WEEKLY \| MONTHLY \| YEARLY` |
| `interval` | int 1–365 |
| `startDate` | `YYYY-MM-DD`; may be today or in the past (the job catches up, bounded) |
| `endDate` | optional, ≥ `startDate` |

`nextRunAt` is computed from `startDate` and the frequency (monthly uses `anchorDay = day(startDate)`, clamped per month). `timezone` is snapshotted from the user.

Creating a rule does **not** post a transaction synchronously. If `startDate <= today` the next scheduler run posts it (≤ 15 minutes). The response says `nextRunAt` so the UI can explain this.

**Response `201`:** rule object.
**Errors:** `400`, `400 INVALID_DATE_RANGE`, `401`, `404 NOT_FOUND`, `422 CATEGORY_TYPE_MISMATCH`, `422 CATEGORY_ARCHIVED`.

### 8.4 `PATCH /recurring-rules/:id`

**Body:** any of `amount`, `note`, `merchant`, `categoryId`, `frequency`, `interval`, `endDate`, `isActive`.

- Editing the **template** affects future occurrences only. Already-generated transactions are history and are never rewritten.
- Changing `frequency` or `interval` recomputes `nextRunAt` from the next future occurrence; it does not backfill the new schedule.
- `startDate` and `timezone` are immutable (delete and recreate for a different start).
- Pausing (`isActive: false`) stops future posts immediately; resuming recomputes `nextRunAt` if it is in the past.

**Response `200`:** rule object.
**Errors:** `400`, `400 INVALID_DATE_RANGE`, `401`, `404`, `422 CATEGORY_TYPE_MISMATCH`, `422 CATEGORY_ARCHIVED`.

### 8.5 `DELETE /recurring-rules/:id`

Soft-stops the rule (`isActive = false`) and keeps its transaction history. Idempotent; deleting an already-stopped rule still returns `204`.

**Response `204`.**
**Errors:** `401`, `404`.

**Note:** a rule is never hard-deleted from the API. That preserves `recurringRuleId` on history and avoids nulling the occurrence key. A future "purge rule + history" admin action would be a separate, explicit endpoint.

---

## 9. Analytics

All analytics endpoints are **read-only**, require auth, and accept exactly one of:

- `month=YYYY-MM` (shorthand for that calendar month), **or**
- `from=YYYY-MM-DD&to=YYYY-MM-DD` (inclusive).

Supplying both, or neither (except where a default is stated), is `400 INVALID_DATE_RANGE`.

Ranges are capped to keep query cost and chart legibility bounded. Beyond the cap: `422 RANGE_TOO_LARGE`.

### 9.1 `GET /analytics/summary`

Dashboard header + comparison with the previous period of equal length.

| Query | Type | Notes |
|---|---|---|
| `month` **or** `from`/`to` | | default: current month in user timezone |

**Response `200`**

```json
{
  "data": {
    "from": "2026-10-01",
    "to": "2026-10-31",
    "income": 8500000,
    "expense": 3124500,
    "net": 5375500,
    "transactionCount": 42,
    "avgDailyExpense": 100790,
    "daysInPeriod": 31,
    "daysElapsed": 31,
    "today": { "date": "2026-11-03", "expense": 128900 },
    "previous": { "income": 8200000, "expense": 2890000, "net": 5310000 },
    "change": { "income": 3.7, "expense": 8.1, "net": 1.2 },
    "topCategory": {
      "id": "b7c1e2d3-4a5f-4e6b-8c9d-0a1b2c3d4e5f",
      "name": "Food & Dining",
      "color": "#F97316",
      "total": 1200000,
      "share": 38.4
    }
  }
}
```

- `avgDailyExpense = expense / daysElapsed` (integer floor, `0` when `daysElapsed` is 0). For a partial month, `daysElapsed = today − from + 1` in the user's timezone, so a mid-month dashboard is not diluted by future days; the previous period is then compared over the **same number of elapsed days**, never against a full previous month.
- `change.*` is percent vs the previous period, rounded to one decimal; `null` when the previous value is 0.
- `topCategory` is `null` when there is no expense in the period.
- `today` is always the user's **current** calendar date and its expense total, regardless of the requested period. It is one extra index range scan on `(userId, date)` and powers the Home "spent today" card without a second request. Clients must not confuse it with `avgDailyExpense`, which describes the requested period.

**Errors:** `400`, `400 INVALID_DATE_RANGE`, `401`, `422 RANGE_TOO_LARGE` (> 24 months).

### 9.2 `GET /analytics/by-category`

Spend (or income) grouped by category for the donut chart.

| Query | Type | Default | Rules |
|---|---|---|---|
| `month` **or** `from`/`to` | | current month | |
| `type` | enum | `EXPENSE` | |
| `page` | int | 1 | |
| `pageSize` | int | 8 | max 50 |

**Response `200`**

```json
{
  "data": [
    { "categoryId": "b7c1...", "name": "Food & Dining", "color": "#F97316", "icon": "utensils", "total": 1200000, "share": 38.4, "transactionCount": 18 },
    { "categoryId": "a1b2...", "name": "Transport",     "color": "#3B82F6", "icon": "bus",     "total": 640000,  "share": 20.5, "transactionCount": 9 }
  ],
  "meta": {
    "page": 1,
    "pageSize": 8,
    "total": 9,
    "totalPages": 2,
    "hasMore": true,
    "period": { "from": "2026-11-01", "to": "2026-11-30" },
    "grandTotal": 3124500
  }
}
```

`share` is `total / grandTotal * 100`, rounded to one decimal. The chart's "Other" slice is the sum of pages ≥ 2; the client can request `pageSize=50` for the full breakdown screen.

**Errors:** `400`, `401`, `422 RANGE_TOO_LARGE`.

### 9.3 `GET /analytics/trend`

Income vs expense over time for the Recharts area/line chart.

| Query | Type | Default | Rules |
|---|---|---|---|
| `month` **or** `from`/`to` | | last 6 months | |
| `granularity` | enum | `month` | `day`, `week`, `month` |

Caps:

| Granularity | Max range | Max buckets |
|---|---|---|
| `day` | 92 days | 92 |
| `week` | 52 weeks | 52 |
| `month` | 24 months | 24 |

**Response `200`**

```json
{
  "data": [
    { "periodStart": "2026-06-01", "periodEnd": "2026-06-30", "label": "Jun", "income": 8500000, "expense": 6120000, "net": 2380000 },
    { "periodStart": "2026-07-01", "periodEnd": "2026-07-31", "label": "Jul", "income": 8500000, "expense": 5880000, "net": 2620000 }
  ],
  "meta": { "granularity": "month", "from": "2026-06-01", "to": "2026-11-30", "buckets": 6 }
}
```

Zero-filled buckets are guaranteed by `generate_series`; a month with no transactions appears with `0` values rather than disappearing. The server supplies `label` and period bounds so the client never re-buckets by timezone.

This is a bounded time-series projection (≤ 92 points), not a paginated collection; the hard cap is the pagination mechanism here.

**Errors:** `400`, `401`, `422 RANGE_TOO_LARGE`.

---

## 10. Notifications

Notification object:

```json
{
  "id": "d1e2f3a4-b5c6-4d7e-8f90-1a2b3c4d5e6f",
  "type": "BUDGET_WARNING",
  "title": "Food & Dining is at 80%",
  "body": "You've spent ₹6,125 of your ₹8,000 budget for November.",
  "data": { "budgetId": "e5f6...", "categoryId": "b7c1...", "month": "2026-11-01" },
  "readAt": null,
  "createdAt": "2026-11-03T09:12:45.000Z"
}
```

`data` is an opaque JSON object for deep-linking. Clients must tolerate unknown keys and unknown `type` values (forward compatibility).

### 10.1 `GET /notifications`

**Auth:** required.

| Query | Type | Default | Notes |
|---|---|---|---|
| `unreadOnly` | boolean | false | |
| `type` | enum | — | `BUDGET_WARNING`, `BUDGET_EXCEEDED`, `RECURRING_POSTED`, `SYSTEM` |
| `page` | int | 1 | |
| `pageSize` | int | 20 | max 100 |

Sort: `createdAt DESC, id DESC`.

**Response `200`:** paginated list; `meta.unreadCount` is the total unread for the user (independent of filters).

**Errors:** `400`, `401`.

### 10.2 `GET /notifications/unread-count`

Not a collection — a scalar for the tab badge.

**Response `200`:** `{ "data": { "count": 3 } }`
**Errors:** `401`.

### 10.3 `PATCH /notifications/:id/read`

Marks one notification read. **Idempotent**: already-read returns `200` with the existing `readAt`.

**Response `200`:** notification object.
**Errors:** `401`, `404 NOT_FOUND`.

### 10.4 `POST /notifications/read-all`

Marks every unread notification for the user as read.

**Body:** optional `{ "type": "BUDGET_WARNING" }` to scope by type.

**Response `200`:** `{ "data": { "updated": 4 } }`
**Errors:** `400`, `401`.

### 10.5 `DELETE /notifications/:id`

**Response `204`.**
**Errors:** `401`, `404`.

---

## 11. Health and meta

### 11.1 `GET /healthz` — public, liveness

```json
{ "status": "ok", "uptimeSeconds": 4213, "commit": "a1b2c3d" }
```

Returns `200` as long as the process is running. No DB call (a liveness probe must not fail because the DB is briefly unavailable).

### 11.2 `GET /readyz` — public, readiness

```json
{ "status": "ready", "checks": { "database": "up", "migrations": "up" } }
```

Executes `SELECT 1` and compares `_prisma_migrations` to the expected count. Returns `503 SERVICE_UNAVAILABLE` with the failing check otherwise.

### 11.3 `GET /meta` — public (optional, Phase 6)

Returns supported currencies, timezones, icon keys, and limits, so the client does not hard-code them.

---

## 12. Endpoint summary

| Method | Path | Auth | Success | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | — | 201 | sets cookie |
| POST | `/auth/login` | — | 200 | sets cookie |
| POST | `/auth/refresh` | cookie | 200 | rotates cookie |
| POST | `/auth/logout` | cookie | 204 | idempotent |
| POST | `/auth/logout-all` | bearer | 204 | all families |
| POST | `/auth/forgot-password` | — | 202 | no enumeration |
| POST | `/auth/verify-otp` | — | 200 | returns reset token |
| POST | `/auth/reset-password` | reset token | 200 | revokes sessions |
| GET | `/users/me` | bearer | 200 | |
| PATCH | `/users/me` | bearer | 200 | currency locked after history |
| PATCH | `/users/me/password` | bearer | 204 | keeps current session |
| POST | `/users/me/onboarding-complete` | bearer | 200 | idempotent |
| DELETE | `/users/me` | bearer | 204 | password confirmation |
| GET | `/categories` | bearer | 200 | paginated |
| GET | `/categories/:id` | bearer | 200 | |
| POST | `/categories` | bearer | 201 | |
| PATCH | `/categories/:id` | bearer | 200 | type immutable |
| DELETE | `/categories/:id` | bearer | 200 | archive or delete |
| GET | `/transactions` | bearer | 200 | filter/search/paginate |
| GET | `/transactions/:id` | bearer | 200 | |
| POST | `/transactions` | bearer | 201 | |
| PATCH | `/transactions/:id` | bearer | 200 | |
| DELETE | `/transactions/:id` | bearer | 204 | |
| GET | `/transactions/export.csv` | bearer | 200 | streamed CSV |
| GET | `/transactions/import/template` | bearer | 200 | CSV |
| POST | `/transactions/import` | bearer | 200 | multipart, partial success |
| GET | `/budgets` | bearer | 200 | month + computed spend |
| POST | `/budgets` | bearer | 201 | |
| PATCH | `/budgets/:id` | bearer | 200 | |
| DELETE | `/budgets/:id` | bearer | 204 | |
| POST | `/budgets/copy` | bearer | 200 | optional |
| GET | `/recurring-rules` | bearer | 200 | paginated |
| GET | `/recurring-rules/:id` | bearer | 200 | |
| POST | `/recurring-rules` | bearer | 201 | does not post immediately |
| PATCH | `/recurring-rules/:id` | bearer | 200 | future occurrences only |
| DELETE | `/recurring-rules/:id` | bearer | 204 | soft stop |
| GET | `/analytics/summary` | bearer | 200 | |
| GET | `/analytics/by-category` | bearer | 200 | paginated |
| GET | `/analytics/trend` | bearer | 200 | bounded buckets |
| GET | `/notifications` | bearer | 200 | paginated |
| GET | `/notifications/unread-count` | bearer | 200 | scalar |
| PATCH | `/notifications/:id/read` | bearer | 200 | idempotent |
| POST | `/notifications/read-all` | bearer | 200 | |
| DELETE | `/notifications/:id` | bearer | 204 | |
| GET | `/healthz` | — | 200 | liveness |
| GET | `/readyz` | — | 200/503 | readiness |
| GET | `/meta` | — | 200 | optional |

**Every collection is paginated** (`categories`, `transactions`, `budgets`, `recurring-rules`, `notifications`, `analytics/by-category`). `analytics/trend` is a bounded projection with an explicit bucket cap rather than a page cursor; that is documented in §9.3 and is the only intentional exception.

---

## 13. Concurrency, retries, and idempotency

| Operation | Duplicate risk | Protection |
|---|---|---|
| Refresh token | Two tabs refresh at once | Rotation is a single DB transaction; the loser gets `REFRESH_TOKEN_REUSED` and the client's single-flight refresh prevents it in the first place. |
| Recurring job | Two instances or a retried job | Advisory lock + unique `(recurringRuleId, occurrenceDate)`; `P2002` means "already posted" and is treated as success. |
| CSV import | Same file uploaded twice | Fingerprint unique per user; duplicates counted as `skippedDuplicates`. |
| Budget alerts | Transaction edited repeatedly around a threshold | Unique `(userId, dedupeKey)` on notifications; one warning + one exceeded per budget/month. |
| Create transaction | Client retries a timed-out POST | **Not** deduped in v1. The UI disables the submit button while pending and only auto-retries idempotent GETs. A future `Idempotency-Key` table is the upgrade path. |

---

## 14. Open questions that would change this contract

1. **Multi-currency** — adds `currency` to budgets and FX conversion to every analytics response. Contract-breaking; decide before Phase 3.
2. **Budget periods other than calendar months** — changes `month` to `periodStart`/`periodEnd` and every analytics param.
3. **Shared/household budgets** — changes ownership from `userId` to a `householdId`, touching every endpoint and index. This is the single most expensive future change; if it is even plausible, model `householdId` now.
4. **Async import** — would turn `POST /transactions/import` into `202 + jobId` and add `GET /imports/:id`. Only needed beyond 5 000 rows.

None of these are assumed in the current design; the assumptions in §0 stand unless you say otherwise.

---

## Appendix A. Client contract reconciliation

The Vite prototype at the repository root was written against an imagined API (`src/api/http.ts`, `src/api/types.ts`). This appendix is the single answer to `docs/API_REQUESTS.md` and the migration checklist for that client. It adds **no** endpoints beyond those already specified above; anything not listed here is not v1.

### A.1 Answers to the eight requests

| # | Request | v1 decision | Where | Client change |
|---|---|---|---|---|
| 1 | `POST /me/avatar` (multipart) | **Deferred.** v1 stores no binaries and runs no object storage. `PATCH /users/me` accepts only an `https` `avatarUrl` ≤ 512 chars. A data URL is rejected by validation. | §3.2 | Send a real URL, or render initials when `avatarUrl` is `null`. Do not persist `FileReader` output through `PATCH /users/me`. |
| 2 | `GET/PATCH /me/notification-preferences` | **Out of scope.** v1 notifications are in-app only; there is no email or push delivery, so there is nothing to prefer. | §10 | Remove or visibly disable the toggles with "Coming soon". Do not persist them locally as if they were saved. |
| 3 | `GET/POST/PATCH /categories` | **Already supported.** Full CRUD, archive semantics, `type` immutable. IDs are UUIDs, not a closed union. | §4 | Replace the `CategoryId` union with `string`; load categories from `GET /categories?pageSize=100&includeArchived=true` into the query cache. |
| 4 | `GET /budgets/:month/rollover` | **Rejected.** Budgets are per-category limits for one calendar month; unused money does not carry forward. `POST /budgets/copy` (optional, §7.5) copies limits without moving balances. | §7.5 | Delete the mocked rollover row from the Budget screen. Do not show a number the API will never return. |
| 5 | `GET /transactions/export?format=csv` | **Canonical path is `GET /transactions/export.csv`.** CSV is the only export format in v1; `format` is not a parameter. Filters are `from`, `to`, `type`, `categoryId`. | §6.1 | Request with `Accept: text/csv` and download the blob; use the `Content-Disposition` filename. Import uses `POST /transactions/import` (multipart). |
| 6 | `POST /auth/refresh`, `POST /auth/logout-all` | **Both already supported.** Refresh rotates the httpOnly cookie and returns a new access token; logout-all revokes every family. | §2.3, §2.5 | Stop storing the bearer token in `localStorage`. Keep it in memory, send `credentials: 'include'`, and refresh once on `401 TOKEN_EXPIRED` with a single-flight promise. |
| 7 | `GET /analytics?month=&compare=true` | **Use `GET /analytics/summary`.** It always returns `previous` and `change` over the equal-length preceding period; there is no `compare` flag and no combined analytics endpoint. | §9.1 | Two or three calls replace the one: `/analytics/summary`, `/analytics/by-category`, `/analytics/trend`. Cache them under separate query keys. |
| 8 | `GET/POST /recurring` | **Path is `/recurring-rules`**, with full CRUD and soft stop. | §8 | Rename the path. "Upcoming bills" is `GET /recurring-rules?isActive=true&pageSize=5` (sorted by `nextRunAt ASC`); posted occurrences appear in `/transactions` with `source: "RECURRING"`. |

### A.2 Prototype path map

| Prototype call | v1 call | Notes |
|---|---|---|
| `POST /auth/signup` | `POST /auth/register` | Response is `{ data: { user, accessToken } }` plus the refresh cookie, not `{ token, user }`. |
| `GET /me`, `PATCH /me` | `GET /users/me`, `PATCH /users/me` | same user shape; `timezone` is added, `phone` and `monthlyIncome` do not exist. |
| `GET /budgets/:month` | `GET /budgets?month=YYYY-MM` | Returns a **paginated list**, one row per category, plus `meta.summary`. There is no single global budget. |
| `PUT /budgets/:month` | `POST /budgets` then `PATCH /budgets/:id` | A second create for the same `(category, month)` is `409 BUDGET_EXISTS`; treat it as "edit the existing row". |
| `GET /dashboard` | No endpoint | Compose in parallel: `/analytics/summary` (`income`, `expense`, `net`, `today.expense`), `/transactions?pageSize=5&sort=date_desc` (`recent`), `/budgets?month=…` (`meta.summary.totalLimit/totalSpent/totalRemaining`), `/notifications/unread-count`. There is no lifetime `balance`; show the month `net` or `totalRemaining` and label it accordingly. Four cacheable queries beat one bespoke aggregate. |
| `GET /analytics?month=YYYY-MM` | `/analytics/summary` + `/analytics/by-category` + `/analytics/trend` | `savings` is `net`; `monthly` is `trend` with `granularity=month`; `byCategory` is `by-category`. |
| `GET /transactions` (bare array) | `GET /transactions` | Read `data` and `meta`; every list is paginated. `categoryId`, not `category`; `q`, not `query`. |
| `POST /transactions` with `paymentMethod` | `POST /transactions` | `paymentMethod` is not in v1. `amount` must be an integer in minor units. |
| `GET /notifications` (bare array) | `GET /notifications` | Envelope with `meta.unreadCount`; `read` becomes `readAt`. |
| `PATCH /notifications/:id/read` | `PATCH /notifications/:id/read` | Returns `{ data: notification }`; `POST /notifications/read-all` returns `{ data: { updated } }`, not `204`. |

### A.3 Required changes in `src/api/types.ts`

- **Money:** `amount`, `limitAmount`, `spent`, `remaining`, analytics totals → integers in minor units. Format only at render time; never do arithmetic on major-unit floats. The prototype's `src/lib/format.ts` must lose its float formatting path.
- **Enums:** `'income' | 'expense'` → `'INCOME' | 'EXPENSE'`; notification `type` → `BUDGET_WARNING | BUDGET_EXCEEDED | RECURRING_POSTED | SYSTEM`; transaction `source` → `MANUAL | RECURRING | IMPORT`.
- **Categories:** `CategoryId` union → `string`. `Category` gains `type`, `isArchived`, `createdAt`, `updatedAt`; `tint` is a presentation value the API does not return — derive it from `color`.
- **Transactions:** add `currency`, `merchant`, `recurringRuleId`, `importBatchId`, `updatedAt`; remove `paymentMethod`; `note` is nullable.
- **Budgets:** replace the global `{ amount, categoryLimits }` shape with the per-category budget object from §7 (`category`, `month`, `limitAmount`, `spent`, `remaining`, `percentUsed`, `status`, `alertThresholdPct`).
- **Users:** remove `phone` and `monthlyIncome`; add `timezone`, `onboardingCompletedAt`, `emailVerifiedAt`, `createdAt`. `joinedAt` is `createdAt`.
- **Notifications:** `read: boolean` → `readAt: string | null`; add `data: Record<string, unknown>`.
- **Session:** `{ token, user }` → access token held in memory only (`{ accessToken, user }` response). The refresh token is never readable by JavaScript.
- **Validation limits:** note 280 chars (prototype 80), merchant 80, name 2–80, password 8–72 bytes. The client mirrors `packages/shared`, not its own copy.

### A.4 Explicitly not in v1

Binary avatar storage, notification preferences and email/push delivery, budget rollover, a global non-category budget, `paymentMethod`, `phone`, `monthlyIncome`, a `/dashboard` aggregate endpoint, a combined `/analytics` endpoint, and a `format` query parameter on export. Each would either change the data model or add an integration (object storage, mail provider) that the roadmap does not fund.

**Repository note:** the prototype currently sits at the repository root, while `ARCHITECTURE.md` specifies `apps/web`. Move it to `apps/web` in Phase 1 rather than maintaining two frontends. `src/main.tsx` and `src/App.tsx` are missing, so the prototype is not runnable as committed.
