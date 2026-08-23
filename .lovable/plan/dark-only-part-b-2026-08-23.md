# Dark-only Part B

## Goal
Remove the remaining light-surface decisions from shared chrome and the named Discover cards without changing Part A’s canvas/token ramps, layout, type, radius, media, or excluded surfaces.

## Implementation

### 1. Repair the tone sources, not the rendered components
- Keep `ChromeIsland` and `GlobalBottomNavigation` using their existing light/dark branches.
- Make the chrome registry resolve dark by default, retaining Tour Hub’s light exception and the existing no-chrome behavior for Echo/Messages; their route canvas remains the separate near-black `#05070A` path.
- Make bottom-navigation theme resolution delegate to `isDarkChromeRoute()` instead of maintaining its own light-default route list.
- Do not hard-pin either component.

### 2. Convert the named Discover surfaces using existing tokens
- **Honours Board:** use `A.PANEL` for neutral heads, the existing gold wash token for ace heads, and the existing dark rarity gold for ace lettering. Ace remains visually rarer through the unique warm wash; albatross remains the neutral panel treatment.
- **Round tile well:** match the Clubhouse round-card treatment using its existing dark translucent well, `A.HAIRLINE` for the boundary, and the dark score-mark path. Update the 17px local score marks to the same dark over-par grounds and dark ink rules; keep the well-derived ring spacer and recompute moment-band blends against the dark well.
- **Most Played:** replace its private light ink/grey ramp with `SURFACE.dark` / `A`, invert the leader/viewer alpha grounds where required, and make PLAYED TO, rank, gross, counts, LOWEST, region, labels, chevron, hairline, and fade legible.
- **Leader ladders:** use `A.PANEL`, dark ink tiers, dark hairlines, and the existing light-alpha leader-row wash while preserving all geometry and typography.

### 3. Region dropdown
- Keep the shared shadcn Select primitive unchanged.
- Apply dark semantic classes/tokens only at the Discover `WeekFilters` call site so the trigger, popover, group label, options, counts, disabled rows, and selected/focus states remain readable without affecting other Select users.

### 4. Verification and report
- Run focused tests and lint/static checks.
- Inspect `/explore` at the current mobile viewport, including the opened region menu and a marked scorecard hole where available.
- Report: Part A’s actual resolver state, all resolver consumers, ace rarity treatment, all four well knock-ons, course-card figure audit, dropdown sharing, deferred Part A inventory items, and any incorrect assumptions found.

## Technical notes
- Two additional source files are required because the actual tone sources are not the two renderers: `src/features/chrome-v2/registry.ts` feeds `ChromeIsland`, and `src/hooks/useNavTheme.ts` feeds the bottom nav. Editing only the listed renderers or `globalHeaderRules.ts` would not fix both symptoms.
- The dropdown is a Discover-local wrapper around the shared shadcn Select; only the wrapper will change.
- No new color literal will be introduced.
