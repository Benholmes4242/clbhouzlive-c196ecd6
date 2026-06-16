# iPad Responsive Audit — Staged Plan

**Goal:** Make every surface render correctly on iPad Mini / Air / Pro (portrait + landscape) for App Store review, without touching a single byte of the existing phone layout.

## Non-negotiable rules

1. **Mobile is frozen.** Every change is gated on a tablet-only media query (`@media (min-width: 768px)`) or a Tailwind `md:` / `lg:` prefix. No edits to default classes, default styles, default props, or any rule that fires below 768px.
2. **No redesigns.** Same components, same tokens, same flows — only scale, max-width, and layout-mode shifts at tablet sizes.
3. **One shared breakpoint contract** (added once, used everywhere):
   - `md` = 768px → iPad Mini portrait + iPad portrait
   - `lg` = 1024px → iPad Air/Pro portrait, iPad Mini landscape
   - `xl` = 1280px → iPad Pro 11/12.9 landscape
4. **Letterbox bg:** `#F8FAFC` (light routes) / `#0d0d0d` (dark routes) — already the page tokens, so the column blends edge-to-edge.
5. **Landscape:** wider centered column (per your answer) — single column, capped at ~720–820px.

## Architecture: how "tablet-only" is enforced

Rather than rewrite every component, we add **three primitives** + a CSS layer, then audit per surface:

1. **`PageRoot` tablet cap.** Already has `max-w-[480px] mx-auto`. We extend to:
   - `md:max-w-[600px]` (portrait tablet)
   - `lg:max-w-[680px]`
   - `xl:max-w-[760px]` (landscape iPad Pro)
   - Letterbox bg painted by a new outer wrapper using the route's resolved light/dark token.
2. **Sheet/Modal tablet mode.** Bottom-sheet primitives (`AdminSheet` already does this; comments sheet, profile hub sheet, review wizard, post studio, etc.) get a shared `@media (min-width: 768px)` rule: centered modal, `max-width: 560px`, `max-height: 85dvh`, rounded all corners, no edge-snap. We add a single utility class `.tablet-modal` and apply it to every sheet root.
3. **Fullscreen media viewers** (feed fullscreen, course media viewer, post studio preview): stay full-bleed but constrain controls/rails to `max-width: 720px md:` so buttons don't fly to screen edges.

## Stages (each ships independently, each verified before next)

### Stage T-0 — Foundations (this PR)
- Extend `PageRoot` with tablet max-widths + letterbox wrapper (route-token aware).
- Add `.tablet-modal` utility in `src/styles/theme-tokens.css`.
- Add `useIsTablet()` hook (≥768px and pointer:coarse OR ≥768 width regardless) for components that need JS-level branching.
- Update `tailwind.config` only if needed to confirm `md`/`lg`/`xl` breakpoints (they're standard Tailwind defaults — likely no change).
- **Risk:** very low. All changes are additive at `md:+`.

### Stage T-1 — Global chrome
- `GlobalHeader` + `TourHubShellTabs` + `CoursesShellTabs` + `BottomNavigation`: cap inner content to the same tablet widths; keep bar full-bleed.
- Bottom nav: center the 5-tab cluster at `md:` with `max-width: 600px`.
- Verify safe-area-top still works on iPad (no notch but status bar still 20px).

### Stage T-2 — Feed surfaces
- Clubhouse feed (`FullscreenFeed` + tiles): tablet column at 600/680/760 — virtualization already supports a constrained width, just cap the rail.
- Discover (Watch / Friends / Explore): tablet column.
- Course Media tab grid: shift from 3-col to 4-col at `md`, 5-col at `lg` (already responsive via `getResponsiveCols`; verify breakpoints align).

### Stage T-3 — Tour Hub
- Overview, Schedule, Players, Leaderboards, Live, Player Profile, Tournament Detail, College: each shell already routes through `TourHubShell` → `PageRoot`, so T-0 cap covers them. Per-tab verification + fixes for any hard-coded `w-screen` / `100vw` rules.

### Stage T-4 — Courses
- Courses index, course detail (all tabs: Overview, Holes, Reviews, Media, History, Top 100 Journey), course hub map modal (uses full-bleed override — verify still works on iPad).

### Stage T-5 — Profile & social
- Profile pages (own + viewing), Edit Profile wizard, Top Ten curation, Profile Hub Sheet, Caddie Bag, Course History, follower/following lists, Suggested Creators.

### Stage T-6 — Modals, sheets, overlays
- Apply `.tablet-modal` to every sheet root: Comments Sheet, Profile Hub Sheet, Review Wizard, Post Studio, Echo, Messaging (DMs), Media Viewer overlays, Notifications, Settings sheets, Auth login sheet, Dispatch bottom sheets.

### Stage T-7 — Forms, onboarding, auth, account
- Auth (login/signup), Profile Onboarding Wizard (100-pt), Settings index + sub-pages, Account, Admin v2 (already tablet-aware per AdminSheet), Business Profile edit wizard, Review Wizard.

### Stage T-8 — Specialized fullscreen
- Fullscreen feed / fullscreen media viewer / post studio media preview: keep full-bleed, cap controls + engagement rail to `md:max-w-[720px] mx-auto`.
- Pinch-to-zoom: verify still works (no regression to Pinch authority memory).

### Stage T-9 — Landscape pass
- Verify every page at 1024×768, 1180×820, 1366×1024 landscape: single column at ~760–820px, balanced negative space, header/nav not stretched, no tile clipping.

### Stage T-10 — App Store review checklist
- Tap target audit (≥44×44) at tablet sizes.
- No horizontal scroll bleed.
- No `100vw` usage that breaks at tablet widths (grep + fix on a per-case basis with `md:max-w-*`).
- iPad-specific screenshots at every required size for App Store.

## Per-stage verification

Each stage ends with: `npm run build` clean + screenshot at 768×1024, 1024×1366, 1366×1024 of every changed surface. No mobile (≤480w) screenshot should diff.

## What I'll NOT do without further sign-off

- Will not convert any single-column surface into a multi-pane "iPad split view" layout (e.g. messaging master/detail) — that's a redesign, not a port.
- Will not adjust font sizes globally — text scales are already legible; only spacing/widths shift.
- Will not touch any mobile breakpoint, mobile prop default, or anything below `md:`.

## Deliverable cadence

I'll ship **Stage T-0 + T-1 in the next message** (foundations + global chrome — the highest-leverage, lowest-risk slice that immediately makes the app look correct on iPad). Then we review screenshots together and you green-light T-2 onward stage-by-stage.

Tell me to proceed and I'll start T-0/T-1.
