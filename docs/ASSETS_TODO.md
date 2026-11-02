# Assets TODO

Figma MCP was **not connected** in this environment, so no node exports could be downloaded. The app currently uses a hand-built SVG logo, Lucide icons and CSS/SVG illustrations. No temporary Figma URLs exist in the codebase.

**Verification status:** every screen has been exercised in the browser and passes Lighthouse accessibility, best-practices and SEO at 1.00 (see `docs/QA_REPORT.md`). Pixel comparison against the Figma file is still blocked, because it requires the node exports below or a connected Figma MCP session.

To complete a pixel-accurate pass, please provide PNG exports (2x) for:

## Screens (393 × 852)

- [ ] Splash — `188:355`
- [ ] Onboarding — `237:679`
- [ ] Login — `202:205`
- [ ] Sign up — `209:415`
- [ ] Forgot password — `209:508`
- [ ] OTP — `481:613`
- [ ] Create new password — `498:515`
- [ ] Home Dashboard — `245:775`
- [ ] Transaction List — `287:526`
- [ ] Add Transaction — `287:928`
- [ ] Edit Transaction — `297:1185`
- [ ] Analytics — `297:1447`
- [ ] Budget — `316:277`
- [ ] Set Budget — `367:2639`
- [ ] Notifications — `340:1257`
- [ ] Profile — `367:2874`
- [ ] Edit Profile — `391:3213`
- [ ] Bottom Nav Bar variants — `367:2159`

## Desktop

- [ ] Desktop landing at 1440px — `965:1494`

## Design system (page `7:4`)

- [ ] Color token sheet / variable defs
- [ ] Typography specimen
- [ ] Button states (default, hover, focus, disabled, loading)
- [ ] Input states (default, focus, filled, error, disabled)
- [ ] Badges, toast, modal, skeleton loaders, calendar
- [ ] Brand logo (SVG export) and app icon
- [ ] Illustration exports used on Splash / Onboarding / empty states

## Replacement map

| Current placeholder | File | Replace with |
| --- | --- | --- |
| `SpendWellMark` SVG | `src/components/ui/Logo.tsx` | Figma logo SVG |
| `Avatar` initials | `src/components/ui/Avatar.tsx` | User photo or Figma avatar set |
| CSS onboarding art | `src/pages/auth/Onboarding.tsx` | Exported illustration PNG/SVG |
| Landing hero mock UI | `src/pages/Landing.tsx` | Exported hero image, if designed |

Once exports are available, place them in `src/assets/` and swap imports; do not hotlink Figma URLs.
