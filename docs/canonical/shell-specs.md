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

## Tab row specs (Discover variant — canonical)

| Property | Value |
|---|---|
| Font size | 16px |
| Font weight | 700 active / 500 inactive |
| Letter-spacing | -0.025em active / 0 inactive |
| Padding | `10px 4px 9px` |
| Gap between tabs | 34px |
| Underline | 2.5px, `linear-gradient(90deg, #F59E0B, #F7931E)` |
| `minHeight` | none (do not enforce 44px) |
| Row height | ~37px |

Implementation reference: `SegmentedControl.tsx`.

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
| Tab-tier           | Discover/Watch, Discover/Explore, Discover/Friends | Discover tabs        | filter chips |
| Subpage            | Watch/Videos, Watch/Clips                          | editorial title      | filter chips |
| Tour Hub tab-tier  | /tourhub (Overview/Schedule/Players/Leaders), /tourhub/college-golf | 5-destination Tour Hub tab strip | per-page chrome (Schedule = season chips, Players = search/sort, Leaders = 4-stat chips, College = none) |
| Tour Hub subpage   | /tourhub/tournament/:id, /tourhub/player/:id, /tourhub/college/profile/:slug, /tourhub/college/compare | (none — CompactHeader back arrow handles nav) | Tournament Detail = 4-tab strip (Overview/Leaderboard/Tee Times/Holes\|Summary); Player/College = none |

## Tour Hub tab-tier variant

Used on /tourhub for the 5-destination tab strip. Same anatomy as the Discover
tab-tier (Row 1 tabs, optional Row 2 chips), but Row 1 uses tighter specs to
fit 5 destinations on a 390pt phone.

| Property         | Discover | Tour Hub |
|------------------|----------|----------|
| Font size        | 16px     | 15px     |
| Gap between tabs | 34px     | 24px     |
| Row height       | ~37px    | ~36px    |

All other specs (padding `10px 4px 9px`, 2.5px amber gradient underline,
weights 700/500, letter-spacing -0.025em on active) identical to Discover.

Tabs 1–4 (`Overview / Schedule / Players / Leaders`) drive `?tab=` on
`/tourhub`. Tab 5 (`College`) is a virtual entry that navigates to
`/tourhub/college-golf` and reads as active across all college sub-paths.

Implementation reference: `src/features/tourhub/components/TourHubShellTabs.tsx`

## Variants planned

- Tour Hub detail/subpage (rollout brief PR 3) — editorial title + 4-tab Row 2 (Tournament Detail) or empty Row 2 (Player / College profiles)

