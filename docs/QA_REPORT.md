# SpendWell — Frontend QA Report

> Status: Phase 1 frontend complete. Built from the supplied design tokens and screen inventory.
> Last verified: 2026-11-03.

## 1. Environment

| Item | Value |
| --- | --- |
| Project | `D:\SpendWell App` |
| Stack | Vite 6, React 18, TypeScript strict, Tailwind 3, React Router 6, TanStack Query 5, React Hook Form + Zod, Recharts 2 |
| Dev server | `http://127.0.0.1:5173/` (`npm.cmd run dev`) |
| Mock API | Enabled by default. Set `VITE_USE_MOCK=false` in `.env` to use the HTTP client selected in `src/api/client.ts`. |
| Persistence | `localStorage` keys `spendwell.db.v1`, `spendwell.session.v1`, `spendwell.onboarded.v1` |
| Demo credentials | `alex@spendwell.app` / `spendwell123` (pre-filled). Any email + 6+ character password works. |
| Reset OTP | Any 6 digits. |

## 2. Routes

| Screen | Route | Auth |
| --- | --- | --- |
| Splash | `/` | Public |
| Onboarding | `/onboarding` | Public |
| Login | `/login` | Public |
| Sign up | `/signup` | Public |
| Forgot password | `/forgot-password` | Public |
| OTP | `/otp` | Public (expects email in router state) |
| Create new password | `/create-password` | Public (expects reset token in router state) |
| Home Dashboard | `/app` | Protected |
| Transaction List | `/app/transactions` | Protected |
| Add Transaction | `/app/transactions/new` | Protected |
| Edit Transaction | `/app/transactions/:id/edit` | Protected |
| Analytics | `/app/analytics` | Protected |
| Budget | `/app/budget` | Protected |
| Set Budget | `/app/budget/set` | Protected |
| Notifications | `/app/notifications` | Protected |
| Profile | `/app/profile` | Protected |
| Edit Profile | `/app/profile/edit` | Protected |
| Desktop landing | `/landing` | Public |
| Not found | `*` | Public |

`/app/*` is wrapped in `RequireAuth`; an unauthenticated visit redirects to `/login`.

## 3. Screen status

| Screen | What is implemented | States covered |
| --- | --- | --- |
| Splash | Brand gradient, logo, tagline, loading indicator, auto-advance to onboarding or dashboard | Loading, reduced-motion-safe animation |
| Onboarding | 3 slides with CSS/SVG art, dots, skip/next, persists completion | Keyboard-operable dots, 44px targets |
| Login | Email/password, remember me, password reveal, demo hint, social placeholders, dynamic welcome toast | Validation, submit loading, API error, disabled |
| Sign up | Name/email/password/confirm, strength meter, terms link, social placeholders | Validation, loading, error, disabled |
| Forgot password | Email form, validation, resend navigation, toast | Loading, error, disabled |
| OTP | 6 individual inputs, auto-advance, paste, arrows/backspace, resend timer | Invalid/error, loading, disabled, resend countdown |
| Create new password | Password + confirm, strength checklist, reveal, reset mutation | Validation, loading, API error, disabled |
| Home Dashboard | Balance card with hide/show, income/expense summary, quick actions, budget ring, recent activity, daily insight | Skeleton, error/retry, empty recent activity, hidden balance |
| Transaction List | Search, type filter, grouped-by-date list, totals, add/edit links | Skeleton, empty (no data), empty (no matches), error |
| Add Transaction | Shared transaction form: type, amount, category, date, note, merchant | Validation, loading, error, cancel |
| Edit Transaction | Loads by id, same form, delete with confirm modal | Loading, not found, saving, delete pending |
| Analytics | Month switcher, income vs expense bar chart, category donut with legend, summary tiles | Skeleton, empty month, error |
| Budget | Month switcher, summary ring, category progress list, rollover toggle, edit CTA | Skeleton, empty/zero budget, error |
| Set Budget | Total amount, per-category allocation, even split, remaining indicator | Validation, loading, error, save bar |
| Notifications | Filter (all/unread), grouped list, mark one/all read, unread indicator | Skeleton, empty all, empty unread, pending |
| Profile | Avatar header, account links, preferences toggles, currency modal, logout confirm | Loading, local preference persistence, modal focus trap |
| Edit Profile | Avatar preview, name/email/phone/income, fixed save bar | Validation, loading, saving, error |
| Desktop landing | 1440px layout, nav, hero mock UI, features, results, testimonials, CTA, footer | Responsive down to mobile, hover/focus states |
| Bottom nav | 5 destinations, centre add button, active state | Hidden on Edit Profile and auth routes |
| Not found | Branded 404 with dashboard/landing links | Static |

## 4. Cross-cutting implementation

- **Design tokens** — colors, Poppins type scale (`h3`–`h6`, `pmd`, `psm`, `caption`), radii (`card` 10px), shadows and animations live in `tailwind.config.js`. No hard-coded Figma URLs or remote images.
- **Responsive shell** — app screens use a centred max-width phone container on wide viewports; desktop landing uses a 1440px content frame.
- **Shared components** — Button, Input, Textarea, Select, Card, Badge, Avatar, ProgressBar, RingProgress, Modal, Toast, Skeleton, EmptyState, SegmentedControl, Switch, PasswordStrength, SocialButtons, Logo.
- **Data layer** — typed `SpendWellApi` interface with interchangeable mock (`src/api/mock.ts`) and HTTP (`src/api/http.ts`) clients; TanStack Query hooks in `src/api/queries.ts`; no `any` in application code.
- **Accessibility** — visible focus rings, labelled form fields, `aria-invalid`/`role="alert"` errors, 44px minimum tap targets, alt text on images, `main` landmarks on every page, reduced-motion CSS, keyboard-operable modal and navigation.
- **States** — hover/focus/disabled/loading buttons, error messages, skeleton loaders, empty states, confirm dialogs and toast feedback.

## 5. Verification performed

### Build and types

```
npm.cmd run typecheck   # passes
npm.cmd run build       # passes
```

Production output is split into `react`, `query`, `forms`, `charts` and app chunks so no chunk exceeds 500 kB.

### Lighthouse

Latest run on `/app` after the final edits:

| Category | Score |
| --- | --- |
| Accessibility | 1.00 |
| Best practices | 1.00 |
| SEO | 1.00 |

The same 1.00 accessibility/best-practices/SEO result was recorded earlier on `/app/transactions`, `/app/transactions/new`, `/app/transactions/txn-01/edit`, `/app/analytics`, `/app/budget`, `/app/budget/set`, `/app/notifications`, `/app/profile`, `/app/profile/edit`, `/onboarding`, `/landing` and `/login`.

### Functional QA

| Flow | Result |
| --- | --- |
| Add transaction | Pass — new row appears in list and dashboard; totals update |
| Edit transaction | Pass — form pre-fills; saved values persist |
| Delete transaction | Pass — confirm modal; row removed; DB restored after test |
| Set budget + even split | Pass — total and category limits persist |
| Mark notification read / mark all | Pass — unread counts and empty states update |
| Edit profile save | Pass — name and details persist |
| Route protection | Pass — unauthenticated `/app` redirects to `/login` |
| Login | Pass — session created; dashboard loads; welcome toast shows user name |
| Sign up | Pass — account created, session stored, dashboard loads; demo DB restored after test |
| Forgot password → OTP → create password → login | Pass — email carried to OTP; any 6 digits verify; new password accepted; redirect to login with toast |
| Empty states | Pass — Home, Transactions and Analytics verified with a cleared DB; original data restored |
| Console errors | None on verified routes |

## 6. Known deviations and gaps

1. **Figma pixel comparison is not possible in this environment.** Figma MCP was not connected and no PNG exports were supplied. Layout, spacing and component states are built from the written tokens and screen inventory. See `docs/ASSETS_TODO.md`.
2. **Contrast-driven color adjustments.** The supplied red `#ff0000` was darkened to `#e00000` for text/icon contrast, and `ink-400` was set to `#6f6f76`. The original `#828384` is retained as the `disabled` token. These are deliberate accessibility deviations.
3. **Placeholder brand art.** The logo is a hand-built SVG (`src/components/ui/Logo.tsx`), onboarding art is CSS/SVG, and avatars fall back to initials. Replace with Figma exports when available.
4. **Home month-over-month badge removed.** The design shows a “12.4% vs last month” pill, but neither `Dashboard` nor the API spec exposes previous-month totals. Showing a hard-coded percentage would be misleading, so the badge is omitted until `GET /analytics?compare=true` (or an equivalent dashboard field) exists.
5. **Profile preferences are local-only.** Weekly summary, budget alerts and app lock toggles persist in component state; there is no preferences endpoint yet.
6. **Currency selection is display-only.** Changing the currency reformats amounts but does not convert them. The data model is single-currency by design (Architecture A1).
7. **Export and payment methods are placeholders.** They surface a toast; the export endpoint is listed in `docs/API_REQUESTS.md`.
8. **Search and filtering are client-side** against the loaded transaction page, which is appropriate for the mock dataset but should move to the API for large accounts.
9. **Social sign-in is a placeholder** and shows a “coming soon” toast.
10. **OTP resend is demo-only** and does not send email.

## 7. How to run

```powershell
npm.cmd install
npm.cmd run dev      # http://127.0.0.1:5173/
npm.cmd run build    # production build
npm.cmd run preview  # preview the production build
```

To reset the demo data, clear the `spendwell.*` keys in `localStorage` and reload.
