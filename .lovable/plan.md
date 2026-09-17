# Tour Overview H12 — Story band and Coming Up rail

## Outcome
Reorder the overview to:

```text
hero photo → tournament board → story photograph → Also this week → Coming Up rail → World rankings → News photograph + rows
```

The longest uninterrupted run of list sections will be **two**: Also This Week followed by World Rankings only after the horizontal Coming Up material break is counted between them. When the story freshness gate fails, the top of the page deliberately closes up with no reserved band space.

## Build

### 1. Select one fresh story for the hero tournament
- Add a small, testable selector over the existing newest-first `tour_stories` feed.
- Prefer the newest photographed story matching the hero's current `viewingTournamentId` within seven days.
- Otherwise choose the newest photographed story of any kind within 48 hours.
- Otherwise return no story; invalid dates and stories without photographs never qualify.
- Keep the existing query, publication guard, ordering, tour lens, routes, and instrumentation unchanged.

### 2. Render the full-bleed story band
- Mount it immediately after `OverviewHero`, with 26px separation from the tournament actions when present.
- Use a stable 230px image area, square corners, cover crop, bottom scrim, 24px text line, and the specified two-line headline treatment.
- Reuse the existing story route and relative-time formatting; the whole band is one tap target.
- If image loading fails, remove the band rather than leaving a text-only panel or gap.

### 3. Deduplicate News
- Lift the shared story read and band selection into the overview page so Story Band and News use one ordered dataset.
- Pass the selected story and its id to the two presentation sections.
- News filters out the band story before choosing its lead and next three rows.
- Preserve the existing News shape. If only the band story exists, News has no lead or rows and therefore does not render; if remaining stories lack a lead photograph, keep them as rows rather than inventing a photo treatment.

### 4. Replace Coming Up groups with a six-event rail
- Remove week grouping and render the first six eligible events in existing chronological order.
- Keep the section heading and Full schedule action.
- Build a rail-only horizontal scroller: mandatory snap, 24px edge padding, 10px gap, fixed 210px items, start alignment, and transform optimization.
- Keep items flat on the page canvas: no fill, radius, or shadow; use only the specified vertical separator.
- Show full tour kicker, two-line tournament name, one-line venue, and amber day/date. Each item remains a tournament link.
- Contain horizontal overflow inside the rail; two events remain fixed-width and left-aligned.

## Verification
- Add focused tests for matched-story precedence, 7-day and 48-hour boundaries, photo requirement, no-band closure, News exclusion, six-event ordering, and removal of week grouping.
- At 390px, capture the complete page in two or three scrolling frames to judge the whole-page rhythm.
- Exercise tournament-matched, generic fallback, and forced-stale no-band fixtures; confirm the band and News never share an id.
- At 320px, confirm 210px rail items, rail-only horizontal scrolling, no page overflow, and the two-event left-aligned case.
- Run the focused Tour Overview tests, TypeScript checks, and the project build; report any unrelated pre-existing failure separately.

## Current-data note
The feed currently has 14 published stories and all 14 have photographs. Its newest generic story is dated 15 Sep 2026, so at the current 17 Sep check it is outside the 48-hour fallback window; the no-band state is a genuine normal state. Tournament-linked stories are available for exercising the seven-day preferred branch when their tournament is shown in the hero.

## Built-state contradictions superseded by H12
- Coming Up's weekly headers and vertical rows are removed.
- Overview News no longer owns an independent unfiltered top-four slice; it receives the shared ordered feed and excludes the band selection.
- The page's existing 32px section stack cannot express the required 26px story-band seam, so that seam becomes explicit while the remaining section cadence stays unchanged.
- No filled rail cards will be built; H1's flat-page rule wins over the mock.
