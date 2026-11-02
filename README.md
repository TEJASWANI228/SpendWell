# SpendWell

A calm, mobile-first personal finance app built from the SpendWell Figma design. The Phase 1 frontend is complete and runs against a persistent mock API, with an HTTP client ready to swap in for the real backend.

## Quick start

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://127.0.0.1:5173/`. The splash screen leads to onboarding, then login.

Demo credentials are pre-filled on the login screen:

- Email: `alex@spendwell.app`
- Password: `spendwell123`

Any email plus a 6+ character password also works. Password-reset OTP accepts any 6 digits.

### Google sign-in

The Google button works out of the box in mock mode. New Google accounts are sent
through a short setup flow that asks for:

1. Monthly income
2. Whether you are a student
3. Current balance (only when the answer is “student”)

Returning users go straight to the dashboard.

To use the real Google account chooser, create an OAuth 2.0 Web client in Google
Cloud Console, add `http://localhost:5173` as an authorised JavaScript origin,
and set `VITE_GOOGLE_CLIENT_ID` in `.env.local`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm.cmd run dev` | Vite dev server |
| `npm.cmd run build` | Type-check and production build |
| `npm.cmd run preview` | Preview the production build |
| `npm.cmd run typecheck` | `tsc --noEmit` |

## Routes

- `/` — Splash
- `/onboarding`, `/login`, `/signup`, `/forgot-password`, `/otp`, `/create-password`
- `/setup` — new-user income, student and starting-balance setup
- `/app` — Home dashboard (protected)
- `/app/transactions`, `/app/transactions/new`, `/app/transactions/:id/edit`
- `/app/analytics`, `/app/budget`, `/app/budget/set`
- `/app/notifications`, `/app/profile`, `/app/profile/edit`
- `/landing` — desktop landing page

## Features

- **CSV Export**:
  - Export filtered or all transactions directly from the **Transactions** screen header with a single click.
  - Export full transaction history anytime from **Profile** → **Support** → **Export my data**.
  - RFC 4180 compliant CSV formatting with Excel/Google Sheets formula injection protection and UTF-8 BOM encoding.

## Deploying on Render

SpendWell is optimized for one-click deployment as a **Render Static Site**:

### Method 1: Using Render Blueprint (Automatic)

1. Push this repository to GitHub (or GitLab).
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your SpendWell repository.
5. Render will detect [`render.yaml`](file:///d:/SpendWell%20App/render.yaml) automatically, configure the build settings and SPA rewrites (`/* -> /index.html`), and deploy the app!

### Method 2: Manual Static Site Setup

1. Click **New +** → **Static Site** in the Render Dashboard.
2. Select your repository.
3. Configure the following settings:
   - **Name**: `spendwell`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Redirects/Rewrites**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
5. Click **Create Static Site**.

## Data layer

`src/api/client.ts` selects the implementation. Mock mode is the default and persists to `localStorage`:

- `spendwell.accounts.v1` — per-account transactions, budget, notifications and user profile
- `spendwell.session.v1` — auth session
- `spendwell.onboarded.v1` — onboarding completion

Legacy `spendwell.db.v1` data is migrated automatically into the first account.

Set `VITE_USE_MOCK=false` in `.env` (and `VITE_API_URL`) to use `src/api/http.ts` against the real API described in `docs/API_SPEC.md`.

## Documentation

- `docs/ARCHITECTURE.md` — system architecture and decisions
- `docs/API_SPEC.md` — REST contract
- `docs/DATA_MODEL.md` — entities and schema
- `docs/ROADMAP.md` — phased delivery plan
- `docs/QA_REPORT.md` — screen status, verification results and known deviations
- `docs/ASSETS_TODO.md` — Figma exports still needed
- `docs/API_REQUESTS.md` — endpoints the UI is waiting on

## Design tokens

Defined in `tailwind.config.js`: brand purple `#6f33ff`, action purple `#a783fc`, grey 50 `#eeeeee`, grey 700 `#3f3f42`, disabled `#828384`, Poppins, 10px card radius, and the mobile type scale (`h3` 32, `h4` 28, `h5` 24, `h6` 20, `pmd` 16, `psm` 14).

Contrast adjustments (`danger` `#e00000`, `ink-400` `#6f6f76`) are intentional and documented in the QA report.
