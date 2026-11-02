# SpendWell — Architecture

> Status: design baseline for Phase 1. The Phase 1 frontend is implemented in `D:\SpendWell App`; see `docs/QA_REPORT.md` for screen status, verification results and known deviations.
> Owner: solo developer. Target: a production-shaped app that a single developer can finish and defend in an interview.

---

## 0. Assumptions (made because the brief leaves them open)

These are the defaults this document proceeds with. Each is cheap to change **before** the schema is migrated; expensive after.

| # | Assumption | Why | Cost to change later |
|---|---|---|---|
| A1 | **One currency per user.** The user's `currency` is chosen at sign-up (default `INR`) and becomes immutable once the user has a transaction. | Cross-currency analytics requires FX rates, historical rates, and a rate source. That is a different product. Locking the currency keeps every total a simple integer sum. | Medium — schema already stores a `currency` snapshot per transaction, so a future migration to multi-currency is possible. |
| A2 | Money is stored and transported as **integer minor units** (paise/cents). `24900` = ₹249.00. No floats anywhere, including CSV parsing. | Eliminates 0.1 + 0.2 rounding drift. It is a hard rule of this design. | None — this is the invariant, not a choice. |
| A3 | **Calendar dates, not timestamps**, for transactions and budgets. `Transaction.date` is a `DATE`; a budget's `month` is the first day of that month. | A coffee bought at 11 pm on the 31st belongs to that month regardless of server timezone. Storing a timestamp forces timezone conversion on every query and produces off-by-one-day bugs. | Low — `createdAt` still records the instant. |
| A4 | **Single-tenant-per-request:** every user-owned query is filtered by `userId` at the repository layer. There is no admin role in v1. | Simplest correct authorization model. Admin tooling is not on the roadmap. | Low, but adding admin later needs an explicit role and audit log. |
| A5 | **OTP is used for password reset only.** Sign-up logs the user in immediately; email verification is a Phase 6 stretch item. | The Figma flow (forgot password → OTP → new password) only requires reset OTP. Adding sign-up verification doubles email deliverability work for zero demo value. | Low — `PasswordResetOtp.purpose` is already an enum (`PASSWORD_RESET`, `EMAIL_VERIFY`). |
| A6 | **Recurring transactions run inside the API process** via `node-cron`, protected by a Postgres advisory lock. | One deployable, no extra queue infrastructure, and the lock makes it safe if a second instance appears. A dedicated worker is the scale-out path, not the starting point. | Low — the job calls a service method; moving it to a worker is a `server.ts` change. |
| A7 | **Search is substring search** (`ILIKE '%term%'`) on note and merchant, accelerated by a `pg_trgm` GIN index. No full-text ranking. | Users search "swiggy", not natural-language phrases. `pg_trgm` handles misspelling tolerance later if needed. | Low — swap the index and query, API shape unchanged. |
| A8 | **Offset pagination** (`page` + `pageSize`) for JSON lists; CSV export streams with keyset batching. | The UI needs page numbers and total counts; personal datasets are thousands of rows, where `OFFSET` is a non-issue. Streaming export avoids loading everything into memory. | Low — response envelope already has `meta`, so a cursor can be added alongside. |
| A9 | **Avatar is a URL** (`avatarUrl`), not an uploaded file. | File storage (S3, signed URLs, image resizing, virus scanning) is a project of its own. Not part of the Figma-critical path. | Low — add `POST /users/me/avatar` later. |
| A10 | **Category is required** on a transaction. Deleting a used category archives it instead of orphaning rows. | Budgets and analytics are category-based; uncategorized spend is a hole in the product. `onDelete: Restrict` enforces the rule at the DB. | Low — nullable `categoryId` is a migration away. |
| A11 | **Package manager: pnpm workspaces.** | Fast, disk-efficient, and workspace protocol (`workspace:*`) is built in. No Turborepo — two apps and one package do not justify a task graph. | Low. |
| A12 | **Express 5** (async errors are forwarded automatically) and **Vitest** for both apps, with Supertest for HTTP tests. | One test runner, one assertion style. Express 5 removes the `asyncHandler` boilerplate that Express 4 needs. | Low. |

Two questions are genuinely worth asking **before** the first migration, because they alter the data model:

1. Does SpendWell need to support **multiple currencies per user** (e.g. a student paying in INR and USD)? Assumption A1 says no. If yes, `Budget` needs a currency and analytics needs FX — say so now.
2. Are **budgets always monthly**? Assumption says yes (one row per user + category + calendar month). Weekly budgets would change the `Budget` unique key and every analytics query.

Everything else below is written to be changed cheaply.

---

## 1. System at a glance

SpendWell is a **modular monolith**: one Express API deployable, one React SPA, one Postgres database. Modules are separated by folder and by layer, not by network hop. This is deliberately boring. A solo developer gets transactional consistency, one deploy, one log stream, and no distributed-systems failure modes — and can still explain clear module boundaries in an interview.

```mermaid
flowchart LR
    subgraph Browser["User device (mobile-first)"]
        SPA["SpendWell Web<br/>React 19 + TS + Vite<br/>Tailwind + React Router<br/>TanStack Query + Recharts"]
    end

    subgraph Edge["Static hosting / CDN"]
        WEB["index.html + hashed assets"]
    end

    subgraph Server["API deployable (Docker)"]
        API["Express 5 API<br/>/api/v1"]
        MW["Middleware<br/>requestId · CORS · helmet<br/>rate limit · auth · Zod"]
        MOD["Modules<br/>auth · users · categories<br/>transactions · budgets<br/>analytics · notifications"]
        CRON["node-cron scheduler<br/>recurring rules<br/>retention cleanup"]
        MAIL["Mail adapter<br/>SMTP / Resend"]
    end

    DB[("PostgreSQL 16<br/>Prisma")]
    SMTP["Email provider"]
    GH["GitHub Actions<br/>lint · typecheck · test · build"]

    SPA -->|"HTTPS: static assets"| WEB
    SPA -->|"HTTPS JSON + httpOnly refresh cookie"| API
    API --> MW --> MOD
    MOD -->|"Prisma Client (parameterized SQL)"| DB
    CRON -->|"service calls, advisory lock"| MOD
    MAIL --> SMTP
    MOD --> MAIL
    GH -.->|"build image, run migrations"| Server
    GH -.->|"build assets"| WEB
```

**Why a monolith, in two sentences:** every write that matters (transaction + budget alert + notification) needs a single transaction, and that is trivial in one process. A queue and a worker would be justified at ~10× the traffic or when email/push volume becomes spiky; until then they add failure modes without adding user value.

### Request/response flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Web app
    participant R as Router
    participant M as Middleware chain
    participant Ctl as Controller
    participant S as Service
    participant Repo as Repository
    participant DB as PostgreSQL

    C->>R: GET /api/v1/transactions?page=2&categoryId=...
    R->>M: requestId → CORS → rateLimit → authenticate → validate(query)
    M->>Ctl: req.auth.userId, req.validated.query
    Ctl->>S: listTransactions(userId, filters)
    S->>Repo: findMany({ userId, ...filters, skip, take })
    Repo->>DB: SELECT ... WHERE "userId" = $1 AND ... ORDER BY date DESC
    DB-->>Repo: rows + total count
    Repo-->>S: domain records
    S-->>Ctl: DTO + pagination meta
    Ctl-->>C: 200 { data: [...], meta: {...} }
```

Every error thrown below the controller is converted once, in `errorHandler.ts`, into the documented envelope. Controllers never build error responses by hand.

### Authentication flow (access + refresh)

```mermaid
sequenceDiagram
    autonumber
    participant C as Web app
    participant A as Auth API
    participant DB as PostgreSQL

    C->>A: POST /auth/login { email, password }
    A->>DB: find user, bcrypt.compare
    A->>DB: insert RefreshToken (sha256 hash, familyId, expiresAt)
    A-->>C: 200 { accessToken (15 min), user } + Set-Cookie sw_refresh (httpOnly, 30 d)
    Note over C: Access token lives in memory only. Never localStorage.
    C->>A: GET /transactions (Authorization: Bearer ...)
    A-->>C: 401 TOKEN_EXPIRED
    C->>A: POST /auth/refresh (cookie sent automatically)
    A->>DB: lookup hash, check revoked/expired, mark rotated, insert replacement
    A-->>C: 200 { accessToken } + rotated cookie
    Note over C: Single-flight refresh in apiClient, then retry the original request once.
```

Refresh-token rotation with **family reuse detection**: if a already-rotated token is presented, the entire family is revoked and `REFRESH_TOKEN_REUSED` is returned. That turns a stolen cookie into a detectable event instead of a permanent backdoor.

---

## 2. Repository layout

```text
spendwell/
├─ apps/
│  ├─ web/                               # React SPA (mobile-first + desktop landing)
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ router.tsx                # route table, lazy-loaded pages
│  │  │  │  ├─ providers.tsx             # QueryClient, AuthProvider, Toaster
│  │  │  │  ├─ ProtectedRoute.tsx
│  │  │  │  └─ AppShell.tsx              # bottom nav (mobile) / sidebar (desktop)
│  │  │  ├─ pages/
│  │  │  │  ├─ landing/LandingPage.tsx
│  │  │  │  ├─ onboarding/OnboardingPage.tsx
│  │  │  │  ├─ auth/{Login,SignUp,ForgotPassword,VerifyOtp,ResetPassword}Page.tsx
│  │  │  │  ├─ dashboard/DashboardPage.tsx
│  │  │  │  ├─ transactions/{TransactionList,TransactionForm}Page.tsx
│  │  │  │  ├─ analytics/AnalyticsPage.tsx
│  │  │  │  ├─ budgets/{BudgetList,SetBudget}Page.tsx
│  │  │  │  ├─ notifications/NotificationsPage.tsx
│  │  │  │  └─ profile/{Profile,EditProfile}Page.tsx
│  │  │  ├─ features/
│  │  │  │  ├─ auth/                     # useAuth, auth.api.ts, tokenStore.ts
│  │  │  │  ├─ transactions/             # transaction.api.ts, useTransactions.ts, components/
│  │  │  │  ├─ categories/
│  │  │  │  ├─ budgets/
│  │  │  │  ├─ recurring/
│  │  │  │  ├─ analytics/
│  │  │  │  ├─ notifications/
│  │  │  │  └─ profile/
│  │  │  ├─ components/
│  │  │  │  ├─ ui/                       # Button, Input, Sheet, Dialog, Skeleton, EmptyState
│  │  │  │  ├─ charts/                    # Recharts wrappers with a shared theme
│  │  │  │  └─ layout/
│  │  │  ├─ lib/
│  │  │  │  ├─ apiClient.ts              # fetch + bearer + single-flight refresh
│  │  │  │  ├─ queryClient.ts
│  │  │  │  ├─ queryKeys.ts              # one key factory, no ad-hoc strings
│  │  │  │  ├─ money.ts                  # format minor units, parse major → minor
│  │  │  │  ├─ dates.ts                  # YYYY-MM-DD helpers, month ranges
│  │  │  │  └─ csv.ts
│  │  │  ├─ styles/index.css
│  │  │  └─ main.tsx
│  │  ├─ public/
│  │  ├─ index.html
│  │  ├─ vite.config.ts
│  │  ├─ tailwind.config.ts
│  │  ├─ tsconfig.json
│  │  └─ .env.example
│  │
│  ├─ api/                               # Express API
│  │  ├─ src/
│  │  │  ├─ server.ts                    # env validation, listen, cron, graceful shutdown
│  │  │  ├─ app.ts                       # express app factory (no listen) → testable
│  │  │  ├─ config/
│  │  │  │  ├─ env.ts                    # Zod-parsed process.env, fail fast
│  │  │  │  └─ constants.ts
│  │  │  ├─ routes/
│  │  │  │  ├─ index.ts                  # mounts /api/v1
│  │  │  │  ├─ auth.routes.ts
│  │  │  │  ├─ user.routes.ts
│  │  │  │  ├─ category.routes.ts
│  │  │  │  ├─ transaction.routes.ts
│  │  │  │  ├─ budget.routes.ts
│  │  │  │  ├─ recurring.routes.ts
│  │  │  │  ├─ analytics.routes.ts
│  │  │  │  ├─ notification.routes.ts
│  │  │  │  └─ health.routes.ts
│  │  │  ├─ controllers/                 # HTTP in → service call → DTO out
│  │  │  ├─ services/                    # business rules, transactions, no req/res
│  │  │  ├─ repositories/                # Prisma queries, always userId-scoped
│  │  │  ├─ middleware/
│  │  │  │  ├─ requestId.ts
│  │  │  │  ├─ authenticate.ts
│  │  │  │  ├─ validate.ts               # body | query | params
│  │  │  │  ├─ rateLimit.ts
│  │  │  │  ├─ notFound.ts
│  │  │  │  └─ errorHandler.ts
│  │  │  ├─ validators/                  # thin re-exports + API-only refinements
│  │  │  ├─ jobs/
│  │  │  │  ├─ scheduler.ts
│  │  │  │  ├─ recurring.job.ts
│  │  │  │  └─ cleanup.job.ts
│  │  │  ├─ lib/
│  │  │  │  ├─ prisma.ts                 # single PrismaClient
│  │  │  │  ├─ jwt.ts
│  │  │  │  ├─ password.ts               # bcrypt wrappers
│  │  │  │  ├─ otp.ts
│  │  │  │  ├─ mail.ts                   # MailAdapter interface + SMTP impl + console impl
│  │  │  │  ├─ money.ts                  # integer-only helpers, basis points
│  │  │  │  ├─ dates.ts                  # month bounds in a user's timezone
│  │  │  │  ├─ csv.ts                    # Papa Parse wrappers
│  │  │  │  ├─ logger.ts                 # pino
│  │  │  │  └─ asyncLock.ts
│  │  │  ├─ errors/
│  │  │  │  ├─ AppError.ts
│  │  │  │  └─ codes.ts
│  │  │  └─ types/express.d.ts           # req.auth, req.requestId, req.validated
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma
│  │  │  ├─ migrations/
│  │  │  └─ seed.ts
│  │  ├─ tests/
│  │  │  ├─ unit/                        # services, money, dates, CSV
│  │  │  ├─ integration/                 # Supertest + real Postgres
│  │  │  └─ helpers/
│  │  ├─ Dockerfile
│  │  ├─ vitest.config.ts
│  │  ├─ tsconfig.json
│  │  └─ .env.example
│
├─ packages/
│  └─ shared/                            # imported by both apps
│     ├─ src/
│     │  ├─ schemas/                     # Zod: auth, transaction, budget, ...
│     │  ├─ dto.ts                       # inferred request/response types
│     │  ├─ enums.ts                     # TransactionType, Frequency, ...
│     │  ├─ errorCodes.ts                # single source of truth for codes
│     │  └─ money.ts                     # pure integer math, safe on client & server
│     └─ package.json
│
├─ docs/                                 # these five documents
├─ infra/
│  ├─ docker-compose.yml                 # postgres + api + web (local/prod-like)
│  └─ nginx.conf                         # optional static + /api proxy
├─ .github/workflows/{ci,cd}.yml
├─ package.json                          # workspace scripts: dev, build, test, lint
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ .env.example
└─ README.md
```

**Why `packages/shared` exists.** The web app and API must agree on field names, limits, and error codes. Putting Zod schemas and inferred TypeScript types in one package means a breaking API change fails `tsc` in both apps at once. The trade-off is a build/watch step and occasional temptation to put business logic there — the rule is: **shared holds shapes and pure helpers only, never Prisma or Express types.**

**Why feature folders in web and layer folders in API.** The frontend changes by screen, so co-locating a screen's API calls, hooks, and components keeps a feature reviewable in one place. The backend changes by rule and needs a strict dependency direction to stay testable, so layers win there. Two different organizing principles on purpose.

---

## 3. Backend layering

Dependency direction is one-way:

```text
routes → middleware → controllers → services → repositories → Prisma
                                      ↘ lib (pure helpers)
```

| Layer | Owns | Must never |
|---|---|---|
| **Route** | HTTP verb + path, middleware order, controller binding | Contain logic or touch Prisma |
| **Middleware** | Cross-cutting: auth, validation, rate limit, request id | Know about a specific business rule |
| **Controller** | Read `req.auth`, `req.validated`, `req.params`; call one service; set status/cookies | Build Prisma queries or duplicate service rules |
| **Service** | Business invariants, ownership checks, multi-repo transactions, notification side effects, DTO mapping | Touch `req`/`res` or HTTP status codes |
| **Repository** | Prisma queries, `userId` scoping, index-friendly filters, pagination primitives | Decide whether an action is allowed |
| **lib** | Pure functions (money, dates, JWT, CSV) | Import Prisma or Express |

### Canonical example (transaction create)

```ts
// routes/transaction.routes.ts
router.post(
  '/',
  authenticate,
  validate({ body: createTransactionSchema }),
  transactionController.create,
);

// controllers/transaction.controller.ts
export async function create(req: Request, res: Response) {
  const dto = await transactionService.create(req.auth.userId, req.validated.body);
  res.status(201).json({ data: dto });
}

// services/transaction.service.ts
export async function create(userId: string, input: CreateTransactionInput) {
  const category = await categoryRepo.findOwned(userId, input.categoryId);
  if (!category) throw new AppError('CATEGORY_NOT_FOUND', 404);

  const user = await userRepo.findById(userId);
  const transaction = await transactionRepo.create({
    userId,
    categoryId: category.id,
    type: input.type,
    amount: input.amount,          // integer minor units, validated > 0
    currency: user.currency,       // snapshot, never trusted from the client
    date: input.date,              // YYYY-MM-DD → Date at UTC midnight
    note: input.note ?? null,
    merchant: input.merchant ?? null,
  });

  // Side effect after commit, idempotent by dedupeKey. A failed alert must not
  // roll back a successfully recorded expense.
  await budgetAlertService.evaluate(userId, transaction).catch(logError);
  return toTransactionDto(transaction);
}

// repositories/transaction.repository.ts
export function create(data: Prisma.TransactionUncheckedCreateInput) {
  return prisma.transaction.create({ data });
}
```

The `userId` comes from the verified JWT, never from the body. The repository signature makes the scope hard to forget: every read method takes `userId` as its first argument and places it first in the `where` clause.

### Validation

- Schemas live in `packages/shared/src/schemas`, are written with Zod, and are re-used by the web forms.
- `validate()` parses `body`, `query`, and `params` separately and puts results on `req.validated`; the raw `req.body` is never read downstream. Unknown keys are **stripped** (not rejected) so clients can add fields without breaking.
- Query params arrive as strings: use `z.coerce.number().int()` for numbers and a strict `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` for dates, then convert to `Date` in the service.
- Limits are explicit: `amount` ≤ 2_000_000_000 minor units (₹2 crore in paise; within PostgreSQL `Int`), `note` ≤ 280 chars, `pageSize` ≤ 100, CSV ≤ 5 MB / 5 000 rows.

### Ownership and authorization

There is exactly one authorization rule in v1: **the authenticated user may access only rows where `userId` matches**. It is enforced in three places, which is intentional defense in depth:

1. Repository methods always include `userId` in `where`.
2. Service methods that mutate by id call `findOwned(userId, id)` first.
3. Cross-user access returns **404**, not 403, so ids cannot be enumerated.

A future shared-budget feature is the point where this model changes; it is not in scope.

---

## 4. Error-handling strategy

One error type, one catalog, one serializer.

```ts
// errors/AppError.ts
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    public readonly details?: unknown,
    message?: string,
  ) {
    super(message ?? code);
  }
}
```

| Layer | Responsibility |
|---|---|
| Zod middleware | Convert `ZodError` → `AppError('VALIDATION_ERROR', 400, fieldErrors)` |
| Service | Throw semantic errors: `CATEGORY_NOT_FOUND`, `BUDGET_EXISTS`, `CURRENCY_LOCKED` |
| Prisma | Translate known codes in the handler: `P2002` → 409 `CONFLICT`, `P2025` → 404 `NOT_FOUND`, `P2003` → 409 `REFERENCE_CONFLICT`; everything else → 500 |
| `errorHandler` | Log once with `requestId`, `userId`, `code`, stack (server only); send the envelope |
| `notFound` | Unmatched route → 404 `ROUTE_NOT_FOUND` |
| Process | `unhandledRejection` / `uncaughtException` → log, stop accepting connections, exit non-zero |

Response envelope (identical for every endpoint):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "amount", "message": "Expected a positive integer in minor units" }]
  },
  "requestId": "req_01J9Z8K3"
}
```

Rules that keep this honest:

- **Known** errors (4xx) log at `warn`/`info` with no stack. **Unknown** errors (5xx) log at `error` with stack and are returned as a generic `INTERNAL_ERROR` — no Prisma messages, SQL, file paths, or secrets in the body.
- Production responses never include `error.stack`. Test environments may include it behind `NODE_ENV !== 'production'`.
- A `requestId` is generated (or accepted from a trusted proxy header) per request, echoed in the `X-Request-Id` response header, and included in every log line. This is what makes "user says it failed" debuggable.
- Errors thrown after headers are sent (e.g. during CSV streaming) cannot be turned into JSON; the stream is destroyed, the partial failure is logged with the `requestId`, and the export is documented as all-or-nothing per request.
- Client errors are not retried automatically except: one silent refresh on `401 TOKEN_EXPIRED`, and TanStack Query retries only idempotent GETs (max 2, exponential backoff).

`AppError` codes are a closed union in `packages/shared/src/errorCodes.ts`, so the web app can exhaustively map codes to UX copy and the API cannot invent a code the client does not know.

---

## 5. Frontend architecture

### Routing and screens

| Route | Screen (Figma "Penny Tracker") | Layout | Auth |
|---|---|---|---|
| `/` | Desktop landing page | Marketing | Public |
| `/onboarding` | Onboarding carousel | Bare | Public |
| `/login` | Login | Auth | Public (redirect if signed in) |
| `/signup` | Sign up | Auth | Public |
| `/forgot-password` | Forgot password | Auth | Public |
| `/verify-otp` | OTP (6 digits) | Auth | Public, requires `email` in router state |
| `/reset-password` | New password | Auth | Public, requires one-time `resetToken` in router state |
| `/app/dashboard` | Home dashboard | App shell | Private |
| `/app/transactions` | Transaction list | App shell | Private |
| `/app/transactions/new` | Add transaction | Sheet/full page | Private |
| `/app/transactions/:id/edit` | Edit transaction | Sheet/full page | Private |
| `/app/analytics` | Analytics | App shell | Private |
| `/app/budgets` | Budget overview (`?month=YYYY-MM`) | App shell | Private |
| `/app/budgets/set` | Set/edit budget | Sheet | Private |
| `/app/notifications` | Notifications | App shell | Private |
| `/app/profile` | Profile | App shell | Private |
| `/app/profile/edit` | Edit profile | App shell | Private |

**Splash is not a route.** It is a boot gate rendered while the app silently refreshes the session (`POST /auth/refresh`) and loads `/users/me`. A route adds a fake delay and a flash of splash on every navigation; a gate is both faster and honest. The Designer should treat it as a full-screen state with the SpendWell mark, max 800 ms.

**Two surfaces are not in the Figma screen list.** Recurring rules (Profile → Recurring) and CSV import/export (Transactions → ⋯ menu) need minimal designs for list, add/edit, file picker, preview, and result. They are deliberately entry points rather than new tabs, so the five-tab navigation stays intact. If the Designer prefers different placement, the API is unaffected.

### Data layer

- **TanStack Query** owns all server state. No `useEffect` fetching, no Redux.
- One `queryKeys` factory (`['transactions', filters]`, `['analytics','summary',month]`, …). Mutations invalidate the smallest affected prefixes: creating a transaction invalidates `transactions`, `analytics`, `budgets`, and `notifications`.
- `apiClient` wraps `fetch`:
  - attaches `Authorization: Bearer <accessToken>` from an in-memory store,
  - `credentials: 'include'` for the refresh cookie,
  - on `401 TOKEN_EXPIRED`, performs **one single-flight refresh** shared by all concurrent requests, then replays them; a second failure clears auth and redirects to `/login`,
  - normalizes `{ error }` envelopes into a typed `ApiError` with `code`, `message`, `details`, `requestId`.
- **Access token is in memory only** (module-level variable + React context). Refresh token is httpOnly and unreadable by JavaScript. This is the whole point of the two-token design: XSS cannot exfiltrate a long-lived credential.
- Optimistic updates only where the UX benefits and rollback is trivial (mark notification read, delete transaction). Everything else waits for the server.
- Forms: controlled React state + the shared Zod schema. Add `react-hook-form` only if form count grows past ~8 screens (Phase 2 decision, flagged as an optional dependency, not a stack change).

### Money and dates in the UI

- `money.ts` exposes `formatMinor(amount, currency)` using `Intl.NumberFormat` with `minimumFractionDigits` derived from the currency, and `parseMajorToMinor("249.5")` which parses the **string** (split on `.`, pad to the currency's exponent, `parseInt`) — never `parseFloat(x) * 100`.
- Every amount shown in the UI comes from the API as an integer; the client never computes a total by summing floats.
- Date pickers produce `YYYY-MM-DD`; charts receive `periodStart` labels from the server so the client does not re-bucket timezones.
- Charts are `React.lazy`-loaded so the dashboard's first paint does not pay for Recharts (~100 kB gzipped).

### Mobile-first layout

- Tailwind breakpoints: base = phone, `md` = tablet, `lg` = desktop.
- App shell: bottom tab bar (Dashboard, Transactions, Add, Analytics, Budgets) under `lg`; persistent sidebar at `lg+`. Add is a center FAB on mobile.
- The landing page is the only desktop-optimized marketing surface; the app itself stays single-column up to `xl`.
- Tap targets ≥ 44 px, safe-area insets for iOS, `prefers-reduced-motion` respected on charts and sheets.

---

## 6. Background jobs

| Job | Schedule | Work | Safety |
|---|---|---|---|
| `recurring.job` | every 15 min | Find active rules with `nextRunAt <= today` in the user's timezone; create the due transaction(s); advance `nextRunAt`; notify | Advisory lock + unique `(recurringRuleId, occurrenceDate)` + per-rule transaction |
| `cleanup.job` | daily 03:15 UTC | Delete expired/revoked refresh tokens, consumed OTPs older than 24 h, notifications older than 180 days, import batches older than 90 days | Idempotent deletes; bounded batches |
| `budgetAlert` | event-driven, not cron | After a transaction write, recompute the month's spend for the category and emit at most one warning + one exceeded notification per budget/month | Unique `(userId, dedupeKey)` on Notification |

The scheduler runs in the API process only when `CRON_ENABLED=true`. On boot it acquires `pg_try_advisory_lock(hashtext('spendwell:cron'))` and holds the connection for the process lifetime. If a second instance starts, it logs `cron_skipped: lock_held` and still serves HTTP. This is the cheap version of leader election, and the job's idempotency key makes even a mistaken double-run harmless.

Catch-up policy: on each run, rules may be overdue by more than one period (e.g. the API was down). The job generates at most `RECURRING_CATCHUP_DAYS` (default 60) of missed occurrences per rule per run and leaves `nextRunAt` in the future. It does **not** silently backfill years — it logs the gap and creates a `SYSTEM` notification for the user only if the gap exceeds the window.

---

## 7. Environment variables

All environment variables are parsed once at boot by `config/env.ts` with Zod. A missing or malformed value stops the process before the port opens. `.env.example` is committed; `.env` is never committed.

### API

| Variable | Example | Required | Notes |
|---|---|---|---|
| `NODE_ENV` | `development` | yes | `development \| test \| production` |
| `PORT` | `4000` | no (4000) | |
| `DATABASE_URL` | `postgresql://spendwell:spendwell@localhost:5432/spendwell?schema=public` | yes | `sslmode=require` in prod |
| `JWT_ACCESS_SECRET` | 64+ random chars | yes | ≥ 32 chars enforced |
| `JWT_ACCESS_TTL` | `15m` | no | Keep 10–20 min |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | no (30) | Sliding? No: absolute expiry; rotation issues a new absolute window |
| `REFRESH_COOKIE_NAME` | `sw_refresh` | no | |
| `COOKIE_DOMAIN` | `.spendwell.app` | prod | Empty on localhost |
| `COOKIE_SECURE` | `true` | prod | Must be `true` in prod |
| `COOKIE_SAMESITE` | `lax` | no | `none` only if web and API are on different sites (requires Secure) |
| `CORS_ORIGINS` | `http://localhost:5173` | yes | Comma-separated allowlist, no `*` with credentials |
| `BCRYPT_ROUNDS` | `12` | no (12) | 10 in tests for speed |
| `RATE_LIMIT_WINDOW_MS` | `60000` | no | |
| `RATE_LIMIT_MAX` | `300` | no | Per IP for anonymous, per user for authenticated |
| `MAIL_DRIVER` | `console` | no | `console \| smtp`; `console` prints OTP in dev |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | — | if smtp | |
| `MAIL_FROM` | `SpendWell <no-reply@spendwell.app>` | yes | |
| `CRON_ENABLED` | `true` | no (true) | `false` in test |
| `CRON_LOCK_KEY` | `spendwell:cron` | no | |
| `RECURRING_CATCHUP_DAYS` | `60` | no | Bounded backfill |
| `IMPORT_MAX_BYTES` | `5242880` | no | 5 MB |
| `IMPORT_MAX_ROWS` | `5000` | no | |
| `LOG_LEVEL` | `info` | no | pino levels |
| `TRUST_PROXY` | `1` | no | Needed for correct client IP behind a proxy |
| `SENTRY_DSN` | empty | no | Optional, Phase 6 |
| `APP_BASE_URL` | `https://spendwell.app` | yes | Used in email links |

### Web (Vite — these are public)

| Variable | Example | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000/api/v1` | Absolute URL; no secrets in `VITE_*` |
| `VITE_APP_NAME` | `SpendWell` | |
| `VITE_SENTRY_DSN` | empty | Optional |

Secrets (`JWT_*`, `DATABASE_URL`, SMTP) exist only in the API environment and in GitHub Actions secrets. CI never echoes them; `.env` files are git-ignored and only `.env.example` is tracked.

---

## 8. Security posture

- **Passwords:** bcrypt cost 12, max 72 bytes (bcrypt truncates beyond that — reject longer input instead of silently truncating), minimum 8 chars, checked against a small common-password list.
- **JWT:** HS256, `sub` = user id, `typ: "access"`, `aud: "spendwell-web"`, 15 min. Never put email or role in the token; the token is a pointer, not a profile.
- **Refresh tokens:** 256-bit random, only the SHA-256 hash is stored, scoped cookie path `/api/v1/auth`, `httpOnly`, `Secure`, `SameSite=Lax`, rotated on every use, family revocation on reuse.
- **OTP:** 6 digits, bcrypt-hashed (a 6-digit space is small; a slow hash makes offline guessing pointless), 10 min TTL, 5 attempts, single use, 60 s resend cooldown, generic `202` on forgot-password to prevent account enumeration.
- **Transport:** HTTPS only; HSTS at the edge; `helmet()` defaults; CORS allowlist with credentials.
- **Input:** Zod on every body/query/params; Prisma parameterizes queries (no string SQL with user input); `express.json({ limit: '100kb' })`; CSV parsed server-side with row caps.
- **Rate limits:** `/auth/login` and `/auth/register` 10/min/IP; `/auth/forgot-password` 3/hour/email + 10/hour/IP; `/auth/verify-otp` 5 attempts per OTP; imports 5/hour/user; global 300/min/user.
- **Headers/cookies:** no tokens in `localStorage`; no `Access-Control-Allow-Origin: *`; no secrets in logs (pino redact `req.headers.authorization`, `req.headers.cookie`, `password`, `passwordHash`, `code`, `token`).
- **Data deletion:** `DELETE /users/me` requires the password, cascades user-owned rows, and revokes all refresh tokens. Backups expire on a documented 14-day window.

---

## 9. Testing strategy

| Level | Tool | What it covers | Speed |
|---|---|---|---|
| Unit | Vitest | money parsing/formatting, month bounds per timezone, recurrence date math, CSV row validation, JWT helpers | < 2 s, no DB |
| Integration | Vitest + Supertest + Postgres (Docker service in CI) | Route → controller → service → repository; auth, scoping, pagination, conflict codes; one test per error code in the spec | ~30–60 s |
| Contract | Shared Zod schemas + typed DTOs | Compile-time guarantee that web and API agree | `tsc` |
| E2E (optional) | Playwright smoke | sign-up → add transaction → see dashboard total → set budget → see alert | CI nightly |

Test rules:

- Integration tests run against a **real Postgres**, not a mock. Prisma mocks hide exactly the bugs (`userId` scoping, unique constraints, `DATE` handling) worth testing.
- Every test creates its own user via a factory; tests never share fixtures and can run in parallel with a per-worker schema or a truncate hook.
- **Every fixed bug gets a regression test named after the bug**, and every new endpoint ships with at least: success, validation failure, unauthenticated, and cross-user 404.
- `npm run test:coverage` gates CI at 70% lines for `services/` and `lib/` only; chasing coverage in controllers is noise.

---

## 10. CI/CD and deployment

### GitHub Actions (`ci.yml`, on every PR)

1. `pnpm install --frozen-lockfile`
2. `pnpm lint` (ESLint + Prettier check)
3. `pnpm typecheck` (`tsc --noEmit` in web, api, shared)
4. `pnpm test` with a `postgres:16` service container; `prisma migrate deploy` against the CI database first
5. `pnpm build` (shared → api `tsc` → web `vite build`)
6. `docker build` the API image (no push on PRs)

`cd.yml` on `main`: build and push the API image to GHCR, run `prisma migrate deploy` as a release step, deploy the image, deploy the web build to static hosting. Migrations run **before** the new image starts; all migrations in a release must be backward-compatible with the previous image (expand → deploy → contract in a later release).

### Topology

- **Local:** `docker compose up` → Postgres 16 + API (hot reload) + web (Vite). One command, seeded data.
- **Production (realistic for one developer):** web on a static host/CDN, API on a small container host (Render/Fly/Railway), Postgres on a managed provider (Neon/Supabase/RDS) with daily backups and PITR if affordable. This avoids operating a database.
- **Alternative:** one small VM with `docker compose` (nginx, api, postgres) — cheaper, but backups and OS patching become your job. Pick managed Postgres if the budget allows; it is the part most likely to lose data.

Scaling notes to have ready for an interview: the API is stateless (JWT + DB-backed refresh tokens), so horizontal scaling is trivial; cron uses an advisory lock and must be disabled on all but one instance or moved to a worker; analytics is the first read path to need caching or a rollup table.

---

## 11. Key decisions and trade-offs

| Decision | Chosen because | Cost / when to revisit |
|---|---|---|
| Modular monolith, not microservices | One transaction boundary, one deploy, one log stream; the domain is small. | Revisit if a second team owns a module or email/import workloads starve HTTP. |
| Prisma over raw SQL/Kysely | Typed schema, migrations, and generated client in one tool; the schema doubles as documentation. | Complex analytics still needs `$queryRaw`; accept two query styles and keep raw SQL in repositories only. |
| Access token in memory + refresh cookie | XSS cannot read the long-lived credential; refresh is invisible to the user. | Page reload needs one refresh round-trip; the boot gate covers it. Remembering the user across tabs still works via the cookie. |
| Offset pagination for lists | Page numbers and totals are needed by the UI; per-user data is small. | Deep pages get slower around 10⁵ rows/user. Keyset is a documented upgrade; the envelope already supports adding `nextCursor`. |
| `DATE` for transactions | Avoids timezone off-by-one errors in "this month" totals. | Cannot represent two transactions at different times on the same day; `createdAt` keeps ordering. |
| Integer minor units | Exact totals, trivial sums in SQL, no decimal library. | Every boundary (CSV, forms, currency exponent) must convert carefully. One `money.ts` on each side owns it. |
| Single currency per user | No FX data source, no historical rates, exact aggregates. | Users who travel cannot mix currencies; see open question 1. |
| Cron in the API process | No queue, no extra service, adequate for daily-ish work. | If API instances > 1, lock or extract; the job is idempotent either way. |
| Category required | Analytics and budgets stay complete. | Users must pick a category before saving; the form defaults to the most-used one. |
| `pg_trgm` search | Substring search matches how people search transactions. | Extra index write cost and a manual migration; acceptable at this size. |
| Shared Zod package | Web and API cannot drift silently. | Coupling: a schema change touches both; that is the point. |

---

## 12. What is explicitly out of scope for v1

Bank sync (Plaid/Setu), multi-currency, shared/household budgets, receipt OCR, push notifications and email digests (in-app only), notification preferences, avatar/binary uploads (an external `avatarUrl` only), attachments, dark mode (design token ready but not required), admin panel, i18n, offline-first/PWA caching of mutations, and real-time updates. Listing these now prevents scope creep from looking like incomplete work.

---

## 13. Agent handoff (summary)

**Designer agent needs from me:** the route/screen table above (especially that splash is a boot state, not a route), every UI state driven by an API call (loading, empty, error, partial), the money/date formats, the enums and field limits, and the exact validation messages so error UI is designed rather than improvised.

**Debugger agent needs from me:** the env table + `.env.example`, `docker compose` ports and seed credentials, the `requestId`/log schema, the closed error-code catalog, the known failure modes (cron double-run, timezone month edges, refresh reuse), and the commands for migrate/seed/test.

Both lists are expanded in the final delivery message and in `ROADMAP.md` §12. The client contract reconciliation for the existing prototype is `API_SPEC.md` Appendix A.
