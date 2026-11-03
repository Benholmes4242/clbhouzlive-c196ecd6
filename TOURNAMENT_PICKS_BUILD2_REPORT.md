# Tournament picks build 2 — focused regression stop

## Result
Implemented the overview additions, tapped-player Why we picked them sheet, Our record sheet and four published-RPC hooks. User rulings retained: same three stats in course order for all event picks; compare only active other picks, without “One of our picks.”; Kim T11 versus Ghim T8 and Clark MC reads “Behind Ghim.”. No comparison when no active other pick remains. Existing cards retain their start/status/tee/champion/Needs engine.

Build1's authorized assertion correction passed **25/25**; new build2 file passed **44/44**; retired copy-contract file passed **5/5**.

**STOP:** three existing live tee-heading assertions conflict with the new Live “ROUND {n} · LIVE” heading. No assertion/product correction or rerun was made after this focused run. Full shards and browser verification were not run.

## Command and exact errors
`bunx vitest run src/test/yourPickSheet.test.tsx src/test/tournamentPickInsights.test.tsx src/test/picksSheetCopy.test.ts src/test/picksBeforeFirstTee.test.tsx src/test/picksFieldCheck.test.ts src/test/tourOverviewPicksTeeLine.test.tsx src/test/tourOverviewNotStartedPicks.test.tsx src/test/tourHeroRefinements.test.tsx --maxWorkers=2`

**117 passed / 120 executed / 8 files; 3 failures; no unhandled errors reported.** Full stdout/stderr: `/tmp/tournament-picks2/focused.log`.

1. `src/test/tourOverviewPicksTeeLine.test.tsx:119:27`, **“heading shows the label while a card shows a tee time”**:
   `AssertionError: expected null not to be null`
   Assertion: `expect(heading()).not.toBeNull();`
2. `src/test/tourOverviewPicksTeeLine.test.tsx:136:27`, **“the label disappears when the last pick starts”**:
   `AssertionError: expected null not to be null`
   Assertion: `expect(heading()).not.toBeNull();`
3. `src/test/tourOverviewPicksTeeLine.test.tsx:170:23`, **“heading: full label when the row fits, day alone when it would overflow, back when it widens”**:
   `AssertionError: expected undefined to be 'TEE TIMES · FRIDAY' // Object.is equality`
   Assertion: `expect(label()).toBe(\`TEE TIMES · ${day}\`);`

These tests still mount live events and look for the old tee-day heading. The new heading is implemented per Part A §1; all three tests remain untouched. Next scoped ruling should determine whether to move these tee-heading cases to Upcoming (retaining fit/visibility assertions) and add a Live round-heading assertion. No pre-existing failure was observed in this run other than the historical build1 AF assertion, now resolved.

## Reconciliation
Last reported full green: **6,091 / 552 files**, ER3.1.
Build1 candidate: **6,116 / 553**, +25 new tests in `yourPickSheet.test.tsx`.
Build2 candidate: **6,160 / 554**, +44 new tests in `tournamentPickInsights.test.tsx`. These are candidate inventory totals, not full-suite passes. `picksSheetCopy.test.ts` remains5 cases; the authorized build1 correction adds/removes zero. No deleted tests.

### Authorized changed tests
- `yourPickSheet.test.tsx`, **“unranked metadata omits a missing country and keeps RPC order”**: `expect(screen.getByRole('radio', { name: 'Alejandro Fierro' }).textContent).toBe('Alejandro FierroNot ranked')` → `.querySelector('.your-pick-text')?.textContent` with the same expected value. Why: Ben authorized excluding canonical avatar initials from player text.
- `picksSheetCopy.test.ts`, **“step1/2/3/4 Lead and Body keys exist and are non-empty”** → **“independent/combine/check/lock method Lead and Body keys exist and are non-empty”**. Old assertions: `expect(typeof picksSheet[\`step${n}Lead\`]).toBe('string')`, `.length > 0`, same for Body. New assertions inspect `picksSheet.method[\`${key}Lead\`]` / Body with identical type/nonempty guards. Why: build2 explicitly removes old steps and replaces four paragraphs. Four cases before/after.
- `picksSheetCopy.test.ts`, **“figDifficulty labels the course difficulty figure”**: `expect(picksSheet.figDifficulty).toBe('COURSE DIFFICULTY')` → `.toBe('DIFFICULTY')`. Why: signed-off figure label. One case before/after.

### New44 cases
- Verdict counts0/1/2/3 of three (4).
- Two-pick verdicts; champion identity and cut/withdrawal clauses (2).
- All-ahead/behind; mixed/level; resolved Kim example; no-active-other comparison (4).
- Final position1/8/20 compared with best active pick (3).
- Mexico event stat order; unknown/duplicate/default stat selection (2).
- Ordinals1/2/3/11/12/13/84 (7).
- Checked numeric reason acceptance; all numbers/tolerance/year filtering (2).
- Lowest catch and LPGA pronouns; no-weakness floor; middle putting (3).
- Model agreement/grouping/gender; winning score none/one/several; sorted beat board (3).
- Upcoming Pick/Change; pre-lock withdrawal; locked no-pick; live resolved score/thru; not-started tee; missed-cut token; final percentile/comparison; guest gate; followed singular/record singular (9).
- Tapped-player Why tabs/models/no-fit/no-probability; checked reason rendering; record tour ordering/refetch; viewer dot/sorted board/ledger; no-dot without own scored picks (5).

## Every file touched in build2
- `src/test/yourPickSheet.test.tsx`
- `src/test/picksSheetCopy.test.ts`
- `src/test/tournamentPickInsights.test.tsx` (new)
- `src/features/tourhub/hooks/usePickInsights.ts` (new)
- `src/features/tourhub/hooks/useTournamentPick.ts`
- `src/features/tourhub/hooks/useAIPredictions.ts`
- `src/features/tourhub/hooks/useHeroCarouselData.ts`
- `src/features/tourhub/components/overview-v3/OverviewHero.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet.tsx` (new)
- `src/features/tourhub/components/overview-v3/HybridHeroBands/YourPickCard.tsx` (new)
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PickMemberBands.tsx` (new)
- `src/features/tourhub/components/overview-v3/HybridHeroBands/pickInsightRules.ts` (new)
- `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css` (new)
- `src/index.css`
- `public/locales/en/tourhub.json`
- `public/locales/en-XA/tourhub.json`
- `AGENTS.md`, `roadmap.md`, `TOURNAMENT_PICKS_BUILD1_REPORT.md`, this report.
- Memory: `mem://features/tourhub/tournament-picks-build2`, `mem://index.md`.

## Unfinished verification and implementation gaps
- Automatic build inspected **2026-11-03T11:29:04Z — build OK**. Intermediate syntax/missing-import errors were resolved before focused tests. No manual typecheck/build.
- Full four shards **not run** after stop; no failing shard log exists. Browser/mock comparison and authenticated write/readback not verified.
- `supabase/functions/score-predictions/index.ts:157–158` casing request remains untouched because it is an existing edge function. Requires a scoped exception to the standing prohibition; no deployment claimed.
- Why result percentile currently derives from full board position/count rather than published record event picks; it needs authoritative scored-record integration before release. No server-score equivalence is claimed.
- Finished verdict paragraph numbers are not yet separated into bold spans; tabs do not yet add arrow-key roving; benchmark label collision logic is basic. en-XA keys mirror English but new build2 values are not pseudo-expanded. Further mock parity is unverified.
- Win probabilities/course-fit scores do not render. Data is read through existing RPCs; no SQL, migration, RPC/edge-function definition, feed_config, round_pool_cap, native/Median, review wizard, news or round plot changes.
- Scope preserved: guest Pick invokes existing gate; no guest browsing rewrite. Actual overview supplies event-owned tour/season, including real underlying tour on pseudo-major slides.