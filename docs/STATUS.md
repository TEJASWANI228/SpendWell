# SpendWell — STATUS

> Last updated: 2026-11-03 by **DESIGNER** (3-feature sprint).
> Update this file at the end of every role turn.

---

## Current phase

**Phase 1 — Foundation & Auth** (frontend complete; backend not yet started)

---

## Done ✅

| What | Owner | Notes |
|---|---|---|
| Phase 1 frontend — all 18 screens | DESIGNER | Verified in QA_REPORT.md; Lighthouse 1.00 on all routes |
| Design tokens | DESIGNER | `tailwind.config.js`; brand purple `#6f33ff`, Poppins, 10px radius |
| Shared component library | DESIGNER | Button, Input, Card, Modal, Toast, Skeleton, EmptyState, and 14 others |
| Mock API + localStorage persistence | DESIGNER | `src/api/mock.ts`; swappable via `VITE_USE_MOCK` |
| HTTP client stub | DESIGNER | `src/api/http.ts`; ready for real backend |
| Architecture doc | ARCHITECT | `docs/ARCHITECTURE.md`; assumptions A1–A12 |
| API contract | ARCHITECT | `docs/API_SPEC.md` + Appendix A (8 resolved API requests) |
| Data model | ARCHITECT | `docs/DATA_MODEL.md` |
| Roadmap | ARCHITECT | `docs/ROADMAP.md`; Phases 1–6 (~335 h) |
| Interview notes | ARCHITECT | `docs/INTERVIEW_NOTES.md`; 3 hard problems documented |
| Agent role definitions | ARCHITECT | `docs/agents/architect.md`, `designer.md`, `debugger.md` |
| **Google sign-in (mock flow)** | DESIGNER | `SocialButtons` → `useGoogleSignIn` → `mock.auth.googleSignIn()` → dashboard. HTTP stub redirects to `/auth/google`. Build ✅ |
| **INR currency everywhere** | DESIGNER | `SEED_USER.currency = 'INR'`; `format.ts` locale → `en-IN`, default currency → `INR`; all 41 seed amounts in realistic INR values; notifications updated to ₹. Build ✅ |
| **Rich seed data for new users** | DESIGNER | `mock.auth.signup()` now calls `freshDb()` so every new account lands with 41 transactions, a ₹60,000 budget, and 6 notifications. Build ✅ |

---

## In progress 🔄

| What | Owner | Blocked on |
|---|---|---|
| Phase 2 backend — Monorepo scaffold (task 1.1) | — | Not started; next task |

---

## Blocked 🔴

| What | Blocked by | Written in |
|---|---|---|
| Home month-over-month badge | `GET /analytics?compare=true` not implemented | QA_REPORT.md §6 item 4, API_REQUESTS.md item 7 |
| Notification preference persistence | `PATCH /me/notification-preferences` not implemented | QA_REPORT.md §6 item 5, API_REQUESTS.md item 2 |
| Export button | `GET /transactions/export` not implemented | QA_REPORT.md §6 item 7, API_REQUESTS.md item 5 |
| Avatar upload | `POST /me/avatar` not implemented | API_REQUESTS.md item 1 |
| API-backed search/filter | Backend needed | QA_REPORT.md §6 item 8 |
| Real Google OAuth (backend) | `GET /auth/google` + callback endpoint needed | Phase 2 backend work |

---

## Next 👉

1. **ARCHITECT** — Begin Phase 2 backend design: monorepo scaffold, env variable table, Docker Compose service list, and `POST /auth/google` OAuth callback spec.
2. **DESIGNER** — No new screen work until Phase 2 API is live.
3. **DEBUGGER** — No open bugs. Standby for Phase 2 backend tests.

---

## Open issues

*None — see `docs/ISSUES.md`.*

---

## Phase gates (from ROADMAP.md)

| Phase | Gate condition | Status |
|---|---|---|
| 1 | Frontend builds, types pass, all screens verified | ✅ Passed |
| 2 | Auth flow works end-to-end against real Postgres | ⏳ Not started |
| 3 | Dashboard charts pull from real aggregation queries | ⏳ Not started |
| 4 | Budget alerts fire and are stored idempotently | ⏳ Not started |
| 5 | Recurring job passes idempotency drill | ⏳ Not started |
| 6 | CI green, app deployed, p95 latency measured | ⏳ Not started |
