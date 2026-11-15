# BRIEF_GUEST_CARD_REDESIGN — build report

## Files
- `src/features/guest/guestCopy.ts` — Clubhouse headline `[{text:'The global platform for golf'},{text:'.',amber:true}]` and body "Used by the golfers who play it and the businesses behind it."; `GUEST_CARD_CHROME_COPY.login` → 'Already a member? Log in'. All other surfaces/action copy unchanged.
- `public/locales/en/common.json` — `guest.card.login` → "Already a member? Log in". Other locales untouched (disabled, kept).
- `src/features/guest/guestGate.css` — card padding 22px 20px 16px; head 9px top margin, 26px/800/-0.025em/1.12, text-wrap balance (closable 30px right padding kept); body 14.5px. New `.guest-gate-circles` (centred, gap 18, margin-top 20), `.guest-gate-circ` (56×56, 50%, #0F0F12, 1px rgba(255,255,255,.14)), `.guest-gate-or` (13px, rgba(248,250,252,.42), margin 12px 0, text only), `.guest-gate-pill` (52px, r999, #F8FAFC/#0A0A0C, 16px/700/-0.01em, gap 10, active opacity .85), `.guest-gate-pill--first` (web margin-top 20), `.guest-gate-login` (margin-top 14, 14px/600, rgba(248,250,252,.62), sentence case) + `.guest-gate-login-caret` (rgba(248,250,252,.42), margin-left 5px). Removed `.guest-gate-btn`, `--apple`, `--ghost`, `--first`. Added `@media (max-width: 340px)`: head 22px, body 13.5px, circles 50×50 with row margin-top 16, or margin 9px 0, pill 48px/15px. Shade, position, card colours, kicker, close, focus rules and reduced-motion handling unchanged (verbatim strings the existing tests assert are preserved).
- `src/features/guest/GuestJoinCard.tsx` — in-app: centred round Apple (AppleLogo 22, #F8FAFC, aria-label "Continue with Apple") and Google (GoogleLogo 21, aria-label "Continue with Google") buttons calling `onChoice('apple'|'google')`; text-only "or"; white email pill with 18px stroke-2 lucide Mail calling `onChoice('email')`. Web: no round buttons, no "or", pill gets `--first`. Login link renders copy + aria-hidden "›" span, calls `onChoice('login')`. Portal, z-index, scroll lock, force-expand, close button and focus behaviour untouched.

## Test changes (src/test/guestBrowsing.test.tsx)
Changed assertions:
1. Line ~239 (gate host login): `getByRole('button', { name: 'ALREADY A MEMBER? LOG IN' })` → `{ name: 'Already a member? Log in' }` — brief §6; the "›" is aria-hidden so the accessible name excludes it.
2. "shows Apple first, then Google, in the Median app": `buttons.map((b) => b.textContent)` → `b.getAttribute('aria-label') ?? b.textContent` — the signed-off mock makes the round buttons icon-only, so the old textContent read returns '' and cannot survive; order is now read from the aria-labels the brief mandates. Implicitly authorised by the brief's icon-only change; named here per the reporting rule.

Added cases (4):
- "the Clubhouse headline joins to 'The global platform for golf.' with only the full stop amber" (also asserts the new body).
- "other surfaces keep their current copy" (explore + courses headline/body).
- "in the app shows the round Apple and Google buttons, a text-only 'or' and the email pill".
- "each button hands its choice to onChoice" (apple, google, email, login in order).

No tests deleted or renamed.

## Totals
- Focused: guestBrowsing + guestStage23 = 38/38 passed.
- Shards (each its own command): 1 = 2203/2203, 2 = 2120/2120, 3 = 2196/2196, 4 = 2229/2229.
- Full suite: 8,748 executed / 8,748 passed / 0 failed. Before: 8,744. Delta +4 = the four added cases above.
- Build: OK (2026-11-15T08:35:04Z).

## Not verified
No browser/visual check against the mock columns (app, web, 320-wide) and no real-device overflow check.
