# Canonical fixed-shell specs

> Single source of truth for the fixed-shell pattern across Clbhouz.
> Updated whenever a rollout adds a new variant.

## Origin

Established with the Discover rollout (Watch / Explore / Friends / Videos / Clips).

See:

- `src/components/header/ShellSlot.tsx` — the primitive
- `src/components/watch/proshop/WatchMoodChips.tsx` — canonical chip implementation
- `src/components/discover/SegmentedControl.tsx` — canonical tab implementation
- CSS variables in `src/index.css`: `--shell-extra-h`, `--chrome-total-h`

## The shell

Three layers, top to bottom:

1. **CompactHeader** (locked, unchanged) — 55px content + safe-area top, dark-on-light, holds logo + magnifier + identity
2. **Row 1 of `<ShellSlot>`** — page tabs OR editorial title (subpage variant)
3. **Row 2 of `<ShellSlot>`** — filter chips OR per-page chrome (optional)

`ShellSlot` is `position: fixed; top: calc(55px + var(--sat))`. Below CompactHeader on the z-axis (z 29; header is z 30). Page bodies offset themselves with `paddingTop: var(--chrome-total-h)` — a CSS calc that composes CompactHeader height + safe-area + ShellSlot's measured height.

## Tab row specs (canonical — soft-squircle pills)

Single tab style for all destination tab strips (Discover 3 tabs, Courses 3 tabs, Tour Hub 5 tabs). Horizontal scroll handles overflow.

| Property | Value |
|---|---|
| Font size | 14px |
| Font weight | 700 active / 500 inactive |
| Letter-spacing | -0.01em |
| Pill height | 32px |
| Pill padding | `0 12px` |
| Border-radius | 8px (soft squircle) |
| Gap between tabs | 8px |
| Active background | `#FEF3E7` (cream — same as INVITE button) |
| Active border | `1px solid #F7931E` |
| Active text | `#c97a10` |
| Inactive background | `transparent` |
| Inactive border | `1px solid transparent` (preserves layout, no jump) |
| Inactive text | `#64748B` (`hsl(var(--muted-foreground))`) |
| Wrapper padding | `8px 16px` |
| Wrapper background | `#F8FAFC` (`hsl(var(--background))`) |
| Wrapper border-bottom | `0.5px solid rgba(15,23,42,0.06)` |
| Right-edge fade | 28px `linear-gradient(to right, transparent, #F8FAFC)` — only when row overflows |
| Transition | `all 0.15s` |

**Behavioural rules:**

- Horizontal scroll always on (`overflow-x: auto`, `-webkit-overflow-scrolling: touch`). Scrollbar hidden via `.segmented-scroller::-webkit-scrollbar { display: none }`.
- No snap-to-tab.
- Active tab does NOT auto-scroll into view on initial render. Tapping a partially-clipped tab smooth-scrolls it into view (`scrollIntoView({ inline: 'center', behavior: 'smooth' })`).
- Right-edge fade is conditional — render only when `scrollWidth > clientWidth` (ResizeObserver-driven).

Implementation references: `src/components/discover/SegmentedControl.tsx`, `src/features/tourhub/components/TourHubShellTabs.tsx`.

## Filter chip specs (canonical)

| Property | Value |
|---|---|
| Font size | 12px (label), 13px (emoji span) |
| Font weight | 600 |
| Letter-spacing | -0.01em |
| Chip height | 30px |
| Chip padding | `0 11px` |
| Border-radius | 15px |
| Gap between chips | 6px (`gap-1.5`) |
| Inner emoji↔label gap | 5px |
| Wrapper padding | `8.5px 16px 8.5px 16px`, right padding `28px` when overflow expected |
| Right-edge fade | `linear-gradient(to right, transparent, #F8FAFC)` over 28px (only when row overflows horizontally) |
| Active state | amber border `#F7931E` + tint `rgba(247,147,30,0.12)` + text `#c97a10` |
| Inactive state | transparent bg + `1.5px solid hsl(var(--border))` border + `hsl(var(--muted-foreground))` text |

Implementation reference: `WatchMoodChips.tsx`.

## Subpage variant (Videos / Clips)

Used when the page is a destination rather than a tab-tier surface:

- **Row 1:** editorial title — kicker (10px uppercase amber) + h1 (22px, weight 800, -0.025em). No subhead. Padding `14px 16px 12px`. Height ~58px.
- **Row 2:** canonical filter chips (specs above).
- **Shell extra total:** ~105px (vs ~84px for tab-tier pages).

Implementation references: `VideosSubpage.tsx`, `ClipsSubpage.tsx`.

## CSS variable contract

```css
:root {
  --shell-extra-h: 0px;  /* written by ShellSlot via ResizeObserver */
  --chrome-total-h: calc(55px + var(--sat, 0px) + var(--shell-extra-h, 0px));
}
```

Pages consume `--chrome-total-h`. They do not consume `--shell-extra-h` directly.

## Rules of the pattern

1. CompactHeader is **locked**. No page modifies it, hides it on scroll, or restyles it.
2. ShellSlot is **fixed**, not sticky. No `position: sticky`, no scroll thresholds, no IntersectionObserver-driven detach/re-stick.
3. Search lives in CompactHeader's magnifier opening `GlobalSearchOverlay`. Pages do not roll their own search bars.
4. Back navigation on detail/subpages comes from CompactHeader's existing back-arrow logic (`isBackArrowRoute` in `CompactHeader.tsx`). Pages do not render their own back affordances.
5. The shell is **measured**, not hard-coded. `ResizeObserver` on the slot writes `--shell-extra-h`; pages don't measure their own offset.
6. New page variants extend the doc, not the primitive. If a page needs a different Row 1 or Row 2, add a section here — do not fork `ShellSlot`.

## Variants currently live

| Variant            | Pages                                              | Row 1                | Row 2        |
|--------------------|----------------------------------------------------|----------------------|--------------|
| Tab-tier           | Discover/Watch, Discover/Explore, Discover/Friends | Soft-squircle pills (3 tabs) | filter chips |
| Tab-tier           | Tour Hub (Overview/Schedule/Players/Leaders/College) | Soft-squircle pills (5 tabs, scrolling) | per-page chrome (Schedule = season chips, Players = search/sort, Leaders = 4-stat chips, College = none) |
| Subpage            | Watch/Videos, Watch/Clips                          | editorial title      | filter chips |
| Subpage            | Tour Hub detail pages                              | editorial title (or none — CompactHeader back arrow handles nav) | Tournament Detail = 4-tab equal-width strip; Player/College = none |

## Tour Hub tab-tier variant

Same canonical pill spec as Discover (see "Tab row specs" above). Tour Hub renders 5 destinations on a horizontally-scrolling rail; College may require a swipe to reach on 375pt phones.

Tabs 1–4 (`Overview / Schedule / Players / Leaders`) drive `?tab=` on `/tourhub`. Tab 5 (`College`) is a virtual entry that navigates to `/tourhub/college-golf` and reads as active across all college sub-paths.

Implementation reference: `src/features/tourhub/components/TourHubShellTabs.tsx`

## Tour Hub subpage variant

Used on the four Tour Hub detail pages: `/tourhub/tournament/:id`,
`/tourhub/player/:id`, `/tourhub/college/profile/:slug`, `/tourhub/college/compare`.

- **Row 1:** none on Player/College (CompactHeader back arrow), or editorial title where applicable.
- **Row 2:**
  - **Tournament Detail** — 5-tab equal-width strip:
    `Overview / Leaderboard / Summary / Tee Times / Holes`. Drives `?tab=` on the page. Sub-page facet pattern (NOT the canonical destination pill spec) — equal-width flex row, amber underline, unchanged.
  - **Player / College Profile / College Compare** — no Row 2. ShellSlot collapses; pages still consume `--chrome-total-h` for offset.

Implementation references:
`src/features/tourhub/components/shell/TournamentTabsShellRow.tsx`,
`src/features/tourhub/pages/PlayerProfilePage.tsx`,
`src/features/tourhub/pages/CollegeProfilePage.tsx`,
`src/features/tourhub/pages/CollegeComparePage.tsx`.

## Acceptance — Tour Hub rollout

- [x] Bottom-sheet nav overlay deleted (`TourHubNavOverlay.tsx`, `TourNavWrapper.tsx`, `TourNavContext.tsx`, `useNavMenuData.ts` removed)
- [x] Burger button removed from `GlobalBottomNavigation`
- [x] 5-tab strip always visible across tab-tier routes via `TourHubShellTabs`
- [x] Subpage variant on all 4 detail pages
- [x] All PTR removed from Tour Hub pages
- [x] All `useStickyHeaderSafeArea` removed from Tour Hub pages
- [x] All in-page back links removed (CompactHeader handles back nav)
- [x] This doc updated with Tour Hub tab-tier + subpage variants


