# L2 — Leaders becomes The Season

## Data findings that shape the build

- **Subject threshold:** the database has comparable PGA points standings for only **2025 and 2026**, not five completed prior seasons. That is fewer than the required three, so the implementation will use the brief's stated **0.25 placeholder** rather than claim a derived threshold. Only one completed prior season is populated: **2025: 0.506**. The current **2026 ratio is 0.305**; older completed seasons contain no player-stat rows. The current ratio therefore selects a **player subject: Scottie Scheffler**.
- **Race-module gate:** per-event awards exist in `sr_leaderboards.points`, but current-season coverage is incomplete (PGA and European Tour: two dated events; LIV: one; LPGA and Korn Ferry: none) while the standings are current through September. A line would therefore present a partial year as the season. The build will take **2-ALT**: `tour_season_rankings.position_change` for non-PGA tours and the latest measured `sr_player_statistics_snapshots` rank change for PGA. No interpolation.
- **Measured categories only:** PGA currently has **19** measured categories; strokes-gained-around-the-green has no measured value. European Tour, LPGA, Korn Ferry, and LIV each expose **2** measured categories: points and wins. The index title and door both read **“All season stats”** without a number. Empty categories and empty groups never render; a tour with no measured categories gets one plain-language empty state.
- **Qualifying shapes by tour:** PGA qualifies for lead, movement, one-number, duel, and tied list. European Tour, LIV, and Korn Ferry qualify for lead, movement, and tied-wins list. LPGA qualifies only for lead and movement because its wins leader is not tied, so LPGA takes the named reduced edition (lead plus full standings). The cap remains active everywhere.

## Build

1. **Strengthen the category registry and data hook**
   - Add category group, direction, formatter, description key, and `meaningfulBehind` metadata.
   - Populate the complete available category set without changing any calculation.
   - Make every display read the category-owned delta rule; money, ranking points, and counts never show a behind delta.
   - Add season subject facts, measured standings-movement data, remaining-event count, and recent-leader-change state.

2. **Replace equal boards with a deterministic season-magazine selector**
   - Compute player-versus-race subject from the points margin and the 0.25 placeholder.
   - Select one-number, duel, and tied-list categories by the stated rules.
   - Enforce the two-module player cap and expose selection decisions for tests/reporting.
   - Exclude earnings from magazine modules.
   - When fewer than three magazine modules qualify, use a named reduced edition: lead plus a full standings treatment of the race. Keep the two-appearances-per-player cap.

3. **Build the five magazine shapes**
   - Full-bleed portrait lead with neutral-ground fallback, bottom scrim, templated localized copy, and three proofs.
   - Use the non-ranked four-row movement block because the current per-event award series is incomplete.
   - One-number feature, optional close duel, and tied top-three list using the specified geometry.
   - One final “All 20 season stats” door; remove every per-module full-list action and all live dots.

4. **Add the full-page season-stat index**
   - Add a pushed Tour route with back navigation and the existing tour lens.
   - Render only the selected tour’s measured categories and only non-empty groups; the title is “All season stats”.
   - Group available categories under the seven requested headings.
   - Every row includes its current leader (or localized tied-player count), figure, and unit.
   - Search matches category names and leading-player names; the data shape will retain full rows so a later “all categories a player ranks in” search can attach without redesign.

5. **Upgrade the existing full-list sheet**
   - Add the season/player-count eyebrow, category title, localized explanation, and amber leader block.
   - Use rank/name/flag/figure rows with no avatars or live state, P5 hairlines, and no trailing divider.
   - Keep search and existing category deep links.

6. **Copy, compatibility, and verification**
   - Add real lead, standfirst, explanations, group labels, search, tie, and module copy in all six locales.
   - Keep old `?tab=leaderboards&category=` links working and preserve existing analytics while adding index/module events separately.
   - Add focused tests for threshold fallback, category metadata, selection/cap rules, gate behavior, ties, and index search.
   - Verify at 320px and 390px: lead lines/scrim, one-number collision, duel ellipsis, index truncation, no blank modules, one scroll owner, right-edge alignment, and last-row hairlines.

## Authored copy extension point

The lead-copy resolver will accept an optional localized authored override before choosing the state template. A future Wire workflow can provide that override without changing module selection or layout.
