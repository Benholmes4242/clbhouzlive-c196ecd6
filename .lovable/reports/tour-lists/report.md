# Tour upcoming history and season points

## Result and scope
- Overview and tournament pages share UpcomingLastYear with the existing WonChart, prior edition facts/board, and original list fallback. Chart drawing, completedWeek.css, CompletedWeekBlock, live/completed sections, course section, picks and field section are unchanged.
- Prior id/year/winning score are exposed beside the existing finisher-array data, preserving Coming up and Clubhouse readers. Upcoming-only prior reads use the existing useTournamentWeekFacts and useTourLeaderboard hooks; errors discard stale chart data.
- Facts keep FIRST TEE, FIELD, PURSE, PAR, YARDS order and four-cell cap, then consider PAR 5S and WON AT. PAR 5S requires every numbered course hole 1–18 to carry par; yardage is not required. WON AT is the actual prior winner's to-par score, with the existing red token.
- Points rows add BEHIND: leader —, then leader points minus row points via fmtPoints, at 15px/600 in muted ink. Shared head/row tracks preserve name ellipsis and the gold trophy.
- No SQL, migrations, feed_config, round_pool_cap, historical writes or deployments.

## Tests and exact commands
Baseline: **9,407 tests / 843 files**. Final: **9,411/9,411 tests / 844 files**.

| Command | Files | Passed / executed |
|---|---:|---:|
| `bunx vitest run --shard=1/4` | 211 | 2,311 / 2,311 |
| `bunx vitest run --shard=2/4` | 211 | 2,292 / 2,292 |
| `bunx vitest run --shard=3/4` | 211 | 2,346 / 2,346 |
| `bunx vitest run --shard=4/4` | 211 | 2,462 / 2,462 |

Commands ran separately in strict sequence, without failures or reruns. Complete runner output: [1](shard-1.log), [2](shard-2.log), [3](shard-3.log), [4](shard-4.log).
The changing per-shard counts versus the prior run reflect Vitest distributing the new file; the sole suite delta is +4 in one file, named below. No tests deleted.

Added `src/test/upcomingLastYearWon.test.tsx`:
1. `(a) prior facts and board render the shared chart and three key items for the actual rounds`
2. `(b) no prior facts keeps the original list; invalid charts fall back and no prior edition stays absent`
3. `(c) PAR 5S and WON AT fill available cells in order while the cap remains four and pars require all 18 holes`
4. `(d) points Behind is an em dash for the leader and the formatted difference for other rows`

Initial focused command: `bunx vitest run src/test/upcomingLastYearWon.test.tsx src/test/upcomingHeroNewOrder.test.tsx src/test/upcomingLastYearBoard.test.tsx src/test/upcomingOverviewPlus.test.tsx src/test/heroBlocks.test.tsx src/test/lastYearTourScope.test.tsx src/test/seasonRecap.test.tsx src/test/completedWeekFacts.test.tsx src/test/tournamentV3Page.test.tsx` — **124/124**. [Output](focused.log).
Preview initially reported TS2345 at new test lines 43–45: fixture holes lacked `course_par, course_name`. Added those fields to the new fixture only; no assertion changed. Preview then reported build OK.
After the four shards, the chart-heading Last year text was uppercased to match the mock. No chart drawing, tests or rules changed. Refreshed all screenshots and ran `bunx vitest run src/test/upcomingLastYearWon.test.tsx src/test/upcomingHeroNewOrder.test.tsx src/test/heroBlocks.test.tsx` — **27/27**. [Final focused output](final-focused.log). The full shards precede this final copy-only correction.

## Every changed existing assertion
Full exact patch: [authorised-test-diff.patch](authorised-test-diff.patch).

`src/test/upcomingHeroNewOrder.test.tsx`: case renamed from `facts row is the flex space-between band with four cells` to `facts row is the equal-column grid band with four cells`.
- Old: `expect(css).toContain('.upcoming-event-facts{display:flex;justify-content:space-between;gap:8px;margin:var(--hero-section-gap) 20px 0}');`
- New: `expect(css).toContain('.upcoming-event-facts{display:grid;gap:8px;margin:var(--hero-section-gap) 20px 0}');`
- Why: expressly authorised fact layout moves from edge distribution to equal columns. Other assertions in the case are unchanged.

`src/test/heroBlocks.test.tsx`: existing case name unchanged.
- Old: `expect(page).toContain('<UpcomingLastYear rows={lastYear??[]}/>');`
- New: `expect(page).toContain('<UpcomingLastYear rows={lastYear??[]} facts={priorHistory.facts}');`
- Why: expressly authorised shared UpcomingLastYear call now receives prior facts and board data. Its no-LastYearSection assertion is unchanged.

No other existing tests or assertions were changed, renamed, rewritten or deleted. The finisher data-array shape remains compatible, so lastYearTourScope and all existing fallback-list tests pass unchanged.

## Phone captures and limitations
Eight captures render the actual sections and canonical data hooks through controlled, source-labelled fixture responses, not static mock markup. Verified: 4/3 chart columns, three key items, no-facts list fallback, PAR/YARDS/PAR 5S/WON AT values and red score, BEHIND —/30/603, upcoming prior-id reads and no prior reads in season state, no overflow at either width, no browser page errors.

| State | 390 | 320 |
|---|---|---|
| Four-round edition (Puig −18, Ding −16, Voke −15) | [390](four-390.png) | [320](four-320.png) |
| Three-round prior edition | [390](three-390.png) | [320](three-320.png) |
| No week facts: original list | [390](fallback-390.png) | [320](fallback-320.png) |
| Korn Ferry season points | [390](season-390.png) | [320](season-320.png) |

[Contact sheet](captures.png). [Browser checks](results.json). [Capture output](capture.log).
Authenticated live-event/readback verification remains unavailable (`external_unmanaged`); these are fixture captures, not evidence that the named server edition contains the sample round histories. No credentials or guest sessions were requested or created.

Mock differences on preserved elements: the existing WonChart/finished stylesheet retains its font weights, tracking, guide geometry and red (#F0544A); mock chart positions are illustrative while the build consumes supplied server positions. Existing fact figure/label typography is preserved as required. Existing season row/name/PTS sizes and 31px row height are preserved; the mock illustrates larger names/18px PTS and 44px rows. Only new points tracks/BEHIND and requested fact layout/history change. No frozen typography was silently adopted.

## Files changed
- `src/features/tourhub/hooks/useTournamentLastYearTop4.ts`
- `src/features/tourhub/components/overview-v3/usePriorEditionHistory.ts` (new)
- `src/features/tourhub/components/overview-v3/useUpcomingOverview.ts`
- `src/features/tourhub/components/overview-v3/UpcomingOverviewSections.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`
- `src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx`
- `src/features/tourhub/tournament-v2/TournamentPage.tsx`
- `src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx`
- `src/features/tourhub/tournament-v2/data/useTournamentWeekFacts.ts` (ownership comment only)
- `src/styles/hybrid-hero.css`
- `src/locales/en/tourhub.json` (three new keys; no removed keys)
- `src/test/upcomingLastYearWon.test.tsx` (new)
- `src/test/upcomingHeroNewOrder.test.tsx`
- `src/test/heroBlocks.test.tsx`
- `roadmap.md`
- `.lovable/reports/tour-lists/` (report, full output, captures and capture script)
