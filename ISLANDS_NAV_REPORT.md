# BRIEF_ISLANDS_NAV — top islands, bottom nav and the index glance

## What changed

### Top islands (`src/features/chrome-v2/ChromeIsland.tsx`)
- Islands are 46px capsules (was 44) in the one shared glass `ISLAND_GLASS`
  (rgba(14,15,19,0.84), blur(22px) saturate(150%), 10% white hairline,
  0 10px 30px rgba(0,0,0,0.35)). Exported for the bottom nav.
- Logo island: 34px #16161A circle with the 24px mark; on `/` and `/clubhouse`
  it grows the page name "Clubhouse" once scrolled past 24px, and tapping it
  while already there dispatches `clbhouz-active-tab-retap { tabId: 'clubhouse' }`
  (navigates to `/clubhouse` from anywhere else).
- Index island: two-line cell — 16px index + move (`▾0.2` green `#34D77F` /
  `▴0.3` red `#FF5A4E` / nothing) over an `INDEX` caption. `lastIndexMove` now
  returns direction, size and timestamp (same 30-day recency and 0.05 epsilon).
  Disconnected state ("Connect HCP" → `/manage/handicap`), settled/visibility
  guards and business-actor suppression unchanged.
- Avatar island: 36px circle with a 2px amber frame and the existing unread
  badge (local circular exception to the squircle canon, per the mock).
- Top scrim: fixed fade behind the islands on `/` and `/clubhouse` only
  (`scrim` flag on the registry spec), cross-fading to the solid
  `rgba(12,12,14,0.92)` band past 24px. Feed backdrop untouched.
- `useChromeScrolled` added to the existing rAF scroll store
  (`src/hooks/useScrollDirection.ts`) — no new scroll listener.
- Clearance fallbacks updated: `CHROME_ISLAND_H_FALLBACK` 46,
  `NAV_PILL_H_FALLBACK` 66; measured tokens pick the real heights up.

### Bottom nav (`src/components/GlobalBottomNavigation.tsx`, `navigationTabs.ts`, `navIcons.tsx`)
- Expanded: one 66px glass pill, min(358px, 100vw − 32px); five tabs with
  22px outline icons, sentence-case 10.5px labels (no uppercase, no tracking),
  3px active bar. Share is the centre amber circle (54px, raised 2px).
- Condensed on scroll-down: centred icon-only capsule (52px), labels fade out
  over 120ms, active tab gets a 12% white slot. Reduced motion snaps.
- New outline icon set in `navIcons.tsx` (24 viewBox, round caps, mock's exact
  paths); the filled set stays for its other consumers (e.g. StatRow Trophy).
- Live Tour tab keeps LIVE_INK/LIVE_DIM; Courses keeps its amber count badge.
- Bottom fade layer added below the nav (zIndex 99).

### Index glance (`src/features/chrome-v2/IndexGlance.tsx`)
- Tapping the connected index island opens a portalled glance card anchored
  under the right island: current index + move ("▾ 0.2 this month" or dated),
  sparkline of the newest 20 indexed rounds plus "Now" (label "{n} rounds ago"
  matches the rounds drawn), Low index (365 days), Last round and vs par
  (+1 / E / −2), "Open your handicap" → `/handicap`.
- Closes on backdrop tap, Escape and route change; focus returns to the index
  cell; background is aria-hidden while open.

## Tests
- New `src/test/islandsNav.test.tsx` — 21 tests: lastIndexMove detail (4),
  island move text (3), glance open/data/close/focus/route (6), glance helpers
  (5), 24px scrolled threshold (1), expanded/condensed nav (2).
- No existing tests asserted the old uppercase labels, lozenge, squircle
  avatar, 44px island height or `/handicap` index navigation — none needed
  updating; none deleted, renamed or rewritten.

## Results
- Targeted: `islandsNav.test.tsx` 21/21.
- Full suite: **3,993/3,993 across 426 files, all passing** (last green
  baseline 3,956/423; delta = 21 new islands tests + 16 from the intervening
  course-viewer round-2 work).
- `tsgo --noEmit` clean.

## Notes / unverified
- The sparkline x-axis ends at 264px (not the mock's 268) so the 3.5px
  endpoint dot is not clipped by the SVG edge.
- Signed-in visual preview of the islands/nav/glance was not exercised in a
  browser this turn.
- No SQL, no migrations, no RPC or edge-function edits, `feed_config`
  untouched, `round_pool_cap` stays at 30, no native/Median config changes.
