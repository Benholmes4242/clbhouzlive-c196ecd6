# Course Detail Dark Migration

## Goal
Move the course detail shell and all five tabs to the shipped Courses dark ramp without changing layout, behavior, typography, score vocabularies, amber semantics, or retained light-theme handicap consumers.

## Part A — Repair live regressions first

1. **Fix Media controls**
   - Invert `CourseMediaHeader` selection styling: selected uses light `INK` fill with canvas ink; unselected uses the dark translucent well, white hairline, and muted ink.
   - Apply the matching count tones and make both light-filled add buttons use canvas ink so the Plus remains visible.
2. **Correct shared scorecard surfaces at the source callsites**
   - Change both `CardScorecardSheet` score-mark mounts and `HolesScoringKey` to `surface="dark"`; do not edit `ScoreMark`.
   - Leave `RoundCardHoleStrip` unchanged and document its actual handicap-card surface in the completion report.
   - Check Clubhouse, Activity ledger, and one Discover consumer before continuing. Stop and report any worse rendering across the shared sheet’s consumer graph.
3. **Clear inverted-label traps**
   - Sweep every file in this migration for `INK`/`A.INK` light fills paired with white labels and flip labels only.
   - Include the known `ClaimCourseSheet` primary/check controls and report every additional match.
4. **Part A checkpoint**
   - Run focused tests/type validation and browser-check Media plus a deliberately poor scorecard containing several bogeys and double+ results before Parts B–D.

## Part B — Champions tab

1. Remove the course-only `.hcp-light` wrapper and explicit `theme="light"` from `GolfClubView`; preserve all light branches because `FriendSheet` and handicap `PageRoot` still depend on them.
2. Before changing the legends tree, finish and record the component-by-component theme audit:
   - components with a real light/dark split,
   - bare light literals outside a split,
   - any component with no dark branch.
3. Let `CourseLegendsDrilldown` show the page canvas instead of `#F4F6F9` in either theme.
4. Audit `FullCourseLeaderboardSheet` as its own portal surface and explicitly report whether its light path remains reachable after the course mount becomes dark. Do not delete unreachable branches.
5. Stop rather than patch around a Champions component that lacks or breaks its shipped dark branch.

## Part C — Shell and Course tab

1. **Shell**
   - Import the analytical `A` ramp in `GolfClubView` and migrate the error state and hero fallback to `A.INK`, `A.MUTE`, `A.CANVAS`, `A.BORDER`, and the requested translucent secondary fill.
   - Preserve both photography scrims at `rgba(15,23,42,0.5)` and verify `CourseTabs` already inherits the dark background.
2. **Course content**
   - Convert `NearbySection` to analytical tokens.
   - Convert `AboutMediaStrip` placeholders, borders, glyphs, and helper copy to the specified stronger white-alpha values and dark text roles while preserving its already-correct photographic overlays.
   - Convert `ClaimCourseSheet` hairlines, primary-label contrast, skeletons, cards, logo wells, errors, and footer to `A`; make the sheet itself dark.
3. Sweep the remaining Course-tab components listed in the brief (`About`, action rows, Top 100 row, community score, record book) for stranded shared-token/light-logic combinations and change presentation only.

## Part D — Reviews, Media, and You

1. **Reviews and Media**
   - Replace white review panels/controls with dark wells or `A.PANEL`; invert the tee filter and CTA; replace the `!bg-white` Select override with the dark well treatment.
   - Replace all three noncanonical amber utility sites in review/media error and sign-in actions with the brand `AMBER` token.
2. **You tab upstream token repair**
   - Repoint only `_constants.ts` `INK` to `#F8FAFC`; keep `DEEP_AMBER`, both `SC_*` scales, `RAMP`, `RAMP_TOPAR`, and `DIFFICULTY_RAMP` unchanged.
   - Sweep the five named consumers (`BirdieMapSummary`, `PersonalHoleFeatureCards`, `HolesScoringKey`, `HoleFeatureCards`, `HoleGlyph`) for logic that assumed dark ink on a light surface. Make `HoleGlyph` grounds legible only; do not alter any scoring shape/meaning.
3. **Large You-tab surfaces**
   - Convert every light canvas/card/control/text literal in `HoleDataSheet`, `ScoringBreakdownSection`, `CourseTeeCard`, and `AddHolePhotoRow` to the existing analytical/course tokens.
   - Preserve all calculations, charts, ordering, geometry, and score semantics.
   - Include the full pre-change literal inventory for these four files in the final report; the brief’s stated counts are treated as lower bounds, not targets.

## Verification and Reporting

- Run focused tests/type checks after each independent part, with Part A completed and validated before Parts B–D.
- Browser-check the course detail shell and all five tabs at desktop and narrow mobile, including the explicit acceptance states: Media controls, bad-round scorecard/key, Champions canvas and portal sheet, Course placeholders/claim flow, Reviews controls, and the error state.
- Run a final per-file literal sweep for both hex cases and role/context, covering `#0F172A`, `#FFFFFF`/`#fff`, `#F4F6F9`, `#F1F5F9`, `#F4F4F5`, `rgba(15,23,42`, `bg-white`, `!bg-white`, and arbitrary `bg-[#…]` utilities. Preserve only the two explicitly approved hero-photo scrims and explain any other intentional match.
- Report:
  - exact patterns and per-file counts from the final sweep,
  - legends components with light-only/no-dark handling,
  - `RoundCardHoleStrip`’s actual surface,
  - the full four-file You-tab literal inventory,
  - all additional light-fill/white-label traps,
  - `FullCourseLeaderboardSheet` branch reachability,
  - any stop-condition failure or incorrect premise in the brief.
