# Tour Overview redesign — Design A

## Confirmed before implementation

- The page already has one tour selector in the shared Tour Hub header/picker. No second tour control will be added.
- The four repo findings are correct: the picks panel logic exists without mounted row markup; the board gate is live-only; `WorldRankings` and `VenueRecordBand` are currently unmounted.
- The live `public.sr_leaderboards` schema has a numeric `money` column. The completed board will therefore use **PRIZE**, formatted by `formatEarnings`; it will not fall back to round four.
- `MiniBoard` is shared with tournament pages, so the overview-specific column order and completed PRIZE treatment will be isolated to `theme="heroBoard"` plus an explicit phase. Tournament-page boards remain unchanged.
- The existing top control is a picker capsule rather than a duplicate chip rail. This satisfies the instruction to reuse the existing control, but differs visually from the mock’s chip wording.
- Project typography requires Geist and zero negative letter spacing. Where the brief specifies negative tracking, the project-wide typography rule wins; sizes, weights, line heights, clamping, and hierarchy will still follow the brief.

## Part 1 — Build and stop

1. **Page shell and grid**
   - Preserve the offline banner, `PAGE_CANVAS` and its explanatory comment, `NAV_CLEARANCE`, `ScrollToTopGlass`, and the applied-tour effect.
   - Introduce shared overview layout values for `PAGE_EDGE = 10` and `TEXT_EDGE = 24` and apply the 32px section rhythm.
   - Keep the hero and board as one composition, with the board 10px below the photo rather than participating in section spacing.
   - Leave current lower sections mounted until Part 2, so Part 1 changes only the requested upper-page system.

2. **Three-state 300px hero**
   - Preserve carousel ordering, swipe behavior, picker jump, 250ms viewing updates, and slide crossfade.
   - Keep `PHOTO_BAND_HEIGHT` and `OVERVIEW_HERO_HEIGHT` unchanged; set the overview total to exactly 300px and remove only the overview ticker/terminal content.
   - Rebuild the overview `PhotoBand` presentation as the inset 10px, 18px-radius image with canonical scrim, one state pill, the shared left identity block, and the conditional right-side live/countdown/champion facts.
   - Make the whole photo navigate through `tournamentRoute`, while ensuring swipes do not accidentally navigate.
   - Derive tied-leader text, countdown breakpoints, champion margin/playoff copy, and score colours only from available data; absent facts reserve no space.
   - Keep non-overview/cancelled/news consumers stable through additive props or an overview-specific presentation path.

3. **One board card**
   - Change the render gate to any available board, upcoming three-up, or picks row.
   - Render five live/completed rows through `MiniBoard`; for `heroBoard` only use `POS | PLAYER | TOT | THRU`, and `POS | PLAYER | TOT | PRIZE` when completed.
   - Add completed `money` to the leaderboard read/type used by this card and format it with `formatEarnings`.
   - Build the upcoming three-up from the existing tee-time, defending-champion/prior-result, and field-strength hooks. Each cell collapses independently.
   - Mount the existing picks logic and `PicksPanel` behind the specified OUR PICKS row; preserve pick marks, phase behavior, and amber’s documented clbhouz meaning.
   - Add the single full leaderboard/results action at the card foot using `tournamentRoute`.
   - Stop mounting live stat-strip and course-shape content from the overview. Keep their data files/components intact and report whether equivalent tournament-page content exists.

4. **Skeleton and Part 1 verification**
   - Replace the overview skeleton with only the certain 300px hero and board hold.
   - Measure both rendered blocks at 390px and use those measurements rather than JSX arithmetic.
   - Add focused tests for all three hero states, missing facts, tied leaders, countdown breakpoints, board phases, PRIZE, independent three-up collapse, picks-only/no-picks gates, CTA routing, and unchanged tournament-page `MiniBoard` grammar.
   - Check 320px and 390px overflow with the supplied long tournament, course, surname, and tied-leader cases; capture 390px live/upcoming/completed screenshots.
   - Run focused tests, type checks, and the production build.
   - **Report Part 1 and stop. Part 2 will not begin until the user responds.**

## Part 2 — Only after Part 1 report

1. **Shared section grammar**
   - Add `OverviewSectionHead` for 20px/800 real-word headings with optional right action, aligned to `TEXT_EDGE`.
   - Keep `SectionShell` unchanged for other Tour surfaces.

2. **Venue and Also this week**
   - Retreatment `VenueRecordBand` as one compact raised row keyed to the currently viewed tournament, preserving its existing data and below-floor routing gates.
   - Add `AlsoThisWeek`, reuse the already-loaded hero carousel data, exclude the active slide, cap at four rows, and route each row to its tournament.

3. **Coming up**
   - Keep `useComingUp`, `displayEventName`, `surnameOf`, exclusion, schedule routing, and major semantics.
   - Replace daily horizontal pagination with two vertical weekly groups, up to four events each, with independently collapsing defender columns and no nested scrolling.

4. **World rankings**
   - Mount `WorldRankings` directly with an independent four-chip board selector defaulting to World.
   - Replace the spotlight layout with five equal rows and restore movement from `RankingsRow.movement`, explicitly using trend colours rather than score colours.
   - Return null for an empty selected board and keep player links where an ID exists.

5. **News**
   - Add `OverviewNews`, call `useTourStories` once, and render one lead plus up to three compact rows with the specified relative-time rules and story routes.

6. **Cleanup, copy, and final verification**
   - Remove College and Course of the Week from the page.
   - Delete only files proven to have zero remaining importers after the rebuild; retain shared hooks/components and report every survivor and importer.
   - Add/retire English `tourhub` keys only; do not modify disabled locale files.
   - Test every conditional section absent in isolation so no heading, gap, or hold remains.
   - Recheck 320px/390px overflow, capture the full page through its foot at 390px, run focused/full relevant tests, type checks, and production build, then report deletion constraints and any contradictions.

## Technical notes

- All visual values will use existing semantic Tour tokens, adding shared overview tokens only where the design introduces a new semantic role.
- No database changes are planned. The schema inspection was read-only.
- `useTournamentFieldStrength` currently returns `null` by design because no entries source exists, so the FIELD cell will normally be absent until that hook gains real data.
- The skeleton board height cannot be finalized honestly until Part 1 is rendered at 390px; the report will include the measured hero and board heights.
