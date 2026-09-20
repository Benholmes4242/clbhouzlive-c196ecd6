# L2 — Leaders becomes The Season

## Data findings that shape the build

- **Subject threshold:** the database has comparable PGA points standings for only **2025 and 2026**, not five completed prior seasons. That is fewer than the required three, so the implementation will use the brief's stated **0.25 placeholder** rather than claim a derived threshold. The available ratios are **2025: 0.506** and **2026: 0.305**; older season records contain no player-stat rows. The current 2026 ratio therefore selects a **player subject: Scottie Scheffler**.
- **Race-module gate:** measured per-event point awards exist in `sr_leaderboards.points`, keyed by `player_id` and `tournament_id`; event order comes from `sr_tournaments.end_date`. The line module will use those recorded awards only. It will render only when the selected tour/season has enough dated events to form a real series; otherwise it will use **2-ALT**, using `tour_season_rankings.position_change` where available and omitting the band when neither measured series nor movement exists. No interpolation.
- **Twenty categories:** the current PGA payload contains all values needed for the twenty-category registry except strokes-gained-around-the-green. Existing columns plus provider `raw_data.statistics` supply points, events, top-25s, cuts, birdies per round, scrambling, and strokes gained total. Categories with no measured values will not render as empty bands.

## Build

1. **Strengthen the category registry and data hook**
   - Add category group, direction, formatter, description key, and `meaningfulBehind` metadata.
   - Populate the complete available category set without changing any calculation.
   - Make every display read the category-owned delta rule; money, ranking points, and counts never show a behind delta.
   - Add season subject facts, recorded race-series data, movement fallback data, remaining-event count, and recent-leader-change state.

2. **Replace equal boards with a deterministic season-magazine selector**
   - Compute player-versus-race subject from the points margin and the 0.25 placeholder.
   - Select one-number, duel, and tied-list categories by the stated rules.
   - Enforce the two-module player cap and expose selection decisions for tests/reporting.
   - Exclude earnings from magazine modules.

3. **Build the five magazine shapes**
   - Full-bleed portrait lead with neutral-ground fallback, bottom scrim, templated localized copy, and three proofs.
   - Recorded four-line cumulative points race when data qualifies; otherwise the non-ranked four-row movement block.
   - One-number feature, optional close duel, and tied top-three list using the specified geometry.
   - One final “All 20 season stats” door; remove every per-module full-list action and all live dots.

4. **Add the full-page season-stat index**
   - Add a pushed Tour route with back navigation and the existing tour lens.
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
