# API Requests

Endpoints/fields the UI needs that are not yet in `docs/API_SPEC.md` (or need confirmation from the Architect).

> **Answered.** Every item below is resolved in `API_SPEC.md` Appendix A. Do not implement against this file; implement against that appendix and `packages/shared`.
>
> **Frontend status:** the Phase 1 app runs against the mock API. Items 1, 2, 4, 5 and 6 are still UI placeholders or local-only state; the remaining items are implemented in the mock layer or are not yet surfaced. See `docs/QA_REPORT.md` §6.

1. **Avatar upload** — `POST /me/avatar` (multipart, max 2 MB) returning `{ avatarUrl }`. The Edit Profile screen currently keeps a local preview and saves a data URL through `PATCH /me`.
2. **Notification preferences** — `GET/PATCH /me/notification-preferences` with `{ budgetAlerts, weeklySummary, productUpdates }`. Profile shows the toggles but only persists them locally today.
3. **Category management** — `GET/POST/PATCH /categories` so custom categories can be added from Set Budget. Currently `CategoryId` is a closed union.
4. **Budget rollover** — `GET /budgets/:month/rollover` returning `{ unused, carriedForward }`. The Budget screen shows a rollover row that is mocked.
5. **Export** — `GET /transactions/export?format=csv&from=&to=` returning a CSV file. The Profile "Export data" row is a placeholder.
6. **Auth session refresh** — `POST /auth/refresh` and `POST /auth/logout-all`. The client currently stores a single bearer token.
7. **Analytics comparison** — `GET /analytics?month=YYYY-MM&compare=true` adding `previous: { income, expense }` so the Analytics screen can show deltas without a second request.
8. **Recurring transactions** — `GET/POST /recurring` for upcoming bills surfaced on Home. Not yet designed; listed for roadmap alignment.
