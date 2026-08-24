# AUDIT_TOUR_TOKENS — PART A (corrected)

Target: `src/features/tourhub/_shared/tokens.ts`

## 1. Corrected importer scan

Previous pass parsed only `import { … } from '…'`. Re-run now covers:
`import … from`, `export { … } from`, `export * from`, and bare `import '…'`,
across both alias (`@/features/tourhub/_shared/tokens`) and relative
(`../_shared/tokens`, `../../_shared/tokens`) specifiers.

| Form | Files |
| --- | --- |
| `import … from` | 77 |
| `export { … } from` (re-export) | 1 |
| `export * from` | 0 |
| bare `import '…'` | 0 |
| **TOTAL DISTINCT FILES** | **78** |

Previous figure: 76. Delta: +2, both from the widened statement forms and the
relative-path sweep.

### Re-exporters (invisible to the old pass)

- `src/features/courses/components/holes/_constants.ts:29`
  `export { TOPAR_UNDER_LIGHT as SC_FILL_BIRDIE } from '@/features/tourhub/_shared/tokens'`
- `src/features/courses/components/holes/_constants.ts:47`
  `export { TOPAR_UNDER_DARK as SC_BIRDIE_DARK } from '@/features/tourhub/_shared/tokens'`

Both re-exported tokens are **HOLD**, so no file moves into FLIP or MIXED as a
result. Bucket placement: `_constants.ts` → **HOLD** (re-export only, no local
consumption of a FLIP token).

Second-order reach (files consuming the re-exported names) — 7 files, all HOLD
by inheritance:
`explore-tab-new/courseled/RoundShape.tsx`, `holes/HoleGlyph.tsx`,
`holes/HoleDataSheet.tsx`, `courses/_shared/ScoreMark.tsx`,
`feed/PostRoundCard.tsx`, `whs/sections/trends/StablefordCard.tsx`,
`whs/sections/last-round-card/CinemaCardShapeStrip.tsx`
(+ `src/test/discoverHeroSelection.test.ts`).

**No FLIP token reaches the app through a re-export.**

## 2. Local `const INK` declarations in tourhub — all six

| File | Value | Classification |
| --- | --- | --- |
| `overview/sections/TIPicksCarousel.tsx:38` | `#0E1013` | **GENUINELY NEW VALUE** — a seventh distinct ink, in no table. Near-black, not `INK_DEEP` (#0A0E14) and not `CHARCOAL` (#15171F). |
| `overview/sections/ConnectHandicapTile.tsx:28` | `#0F172A` | WILL NOT FOLLOW THE FLIP — pinned copy of the light `INK`. |
| `components/TourIslandLeft.tsx:15` | `#0F172A` | WILL NOT FOLLOW THE FLIP — chrome island, still a light capsule surface, so currently correct in place. |
| `leaderboard/BoardTable.tsx:40` | `#0F172A` | WILL NOT FOLLOW THE FLIP. |
| `leaderboard/LeaderboardTab.tsx:35` | `#0F172A` | WILL NOT FOLLOW THE FLIP. |
| `components/overview-v3/HybridHeroBands/InsightSheet.tsx:40` | `= A.INK` | ALREADY DARK, CORRECT — tracks the analytical ramp. |

Adjacent pinned copies in the same files (recorded, not classified separately):
`TIPicksCarousel` `INK_60`/`INK_45` (ink-alpha on light),
`ConnectHandicapTile` `INK_SECONDARY` `#64748B`,
`CinematicHeroFullBleed` `INK_BASE` `#0D1E16` (a hero gradient base, not an ink).

## 3. STOP 1 resolution — ScoreMark removed from the blast radius

`src/features/courses/_shared/ScoreMark.tsx` — three values pinned locally,
three imports dropped from the tour token file. Zero visual change.

- `MARK_NUMERAL_ON_FILL = '#FFFFFF'` replaces `SURFACE` as the under-par numeral.
  Named for what it is: white text on a saturated red disc, on both surfaces,
  theme-independent. Cannot be repointed by a surface change.
- `LIGHT_BOGEY_GROUND = 'rgba(15,23,42,0.06)'` (was `INK_TINT_06`)
- `LIGHT_DOUBLE_GROUND = 'rgba(15,23,42,0.12)'` (was `HAIRLINE_INK_12`)
- The `:70` comment is replaced, not deleted: it now records that these are
  deliberately NOT sourced from the tour ramp because that ramp is going dark
  while these serve the light path.

`src/components/explore-tab-new/courseled/RoundShape.tsx` — dead imports
`HAIRLINE_INK_12` and `INK_TINT_06` removed (grounds are re-declared from
`WHITE_ALPHA_18` at :518-519). `TOPAR_EVEN_LIGHT` and `WHITE_ALPHA_18` are live
and retained.

`TourHubOverviewSkeleton` — left alone; the flip fixes it.

## 4. STOP 2 — waived

The MIXED gate measured co-import of `FONT`/`AMBER`/`HERO_MIN_H`, not
separability. Proceeding on 43% MIXED.

## 5. Part C — score-theme callsites

Seven in-scope `getScoreColor(…, 'light')` callsites changed to `'dark'`:

1. `tournament-v2/sections/TeeTimesFirstGroups.tsx:141`
2. `schedule-v2/SeasonRow.tsx:411`
3. `schedule-v2/SeasonRow.tsx:464`
4. `players-v2/PlayersTab.tsx:432`
5. `player-v2/sections/TournamentsSection.tsx:100`
6. `college-v2/profile/sections/ThisWeek.tsx:210`
7. `leaderboard/BoardTable.tsx:100`

Out of scope, left as `'light'`: `overview/sections/OnTheCourse.tsx:147`
(overview hero tree) — now the only `'light'` callsite left in tourhub.

`MiniBoard.tsx` — prop default flipped `'light'` → `'dark'`; the `:70` comment
no longer claims `'light'` is canonical and now records that `'dark'` is the
canon and `'light'` survives only for unflipped light chrome islands.

`TourSideMenu.tsx` — see the shared-chrome note in section 6.

## 6. CHARCOAL / SLATE_50 — recorded, NOT converged

Both recordings in `_shared/tokens.ts` now carry a one-line note that they share
a value with a dark-ramp token for a DIFFERENT reason and must not be merged on
the strength of the value alone.
