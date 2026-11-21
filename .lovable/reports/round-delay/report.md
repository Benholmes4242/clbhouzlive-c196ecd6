# Derived scheduled-round delay

## Result and scope
Implemented one shared delay rule across the overview hero, leaders’ group and Also this week. Event must match the existing LIVE_STATUSES; round must be scheduled or null; its earliest valid tee must be **more than 60 minutes** ago; no board row may have the same today_round with thru > 0. Starters, changed round status and republished future tee times remove delay automatically.

The hero uses its existing minute clock and the cached next-round tee source. Leaders and weekly rows use that shared clock where supplied, otherwise tick each minute. Also this week adds one batched current-round tee query, selecting tournament_id, round_number and tee_time and joining results by both tournament and round. No new provider calls, SQL, migrations or feed_config changes.

Provider-suspended handling, tournament pages, top-left live counts, situation notes, other hero content and boards remain unchanged. Weekly delayed caption inherits its existing grey rather than the live-green selector, and omits only the live dot.

## Changed files and lines
- `src/features/tourhub/overview/roundDelay.ts:1–48`: helper contract, 60-minute constant, exact starter predicate and optional minute clock.
- `src/features/tourhub/components/overview-v3/HybridHero.tsx:34,133–148,187`: read between-round tees, derive delay on existing clock and pass delayed round.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:75,102,136`: overview-only delayed-round opt-in.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/heroStateLine.ts:16,20`: delayed wording before after-round wording, only for live state.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup.tsx:28–29,39–41,66–80`: delay inputs, event-wide earliest tee, shared predicate and Delayed line.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx:223–224,350–351,522`: pass event/round status and clock to live leaders.
- `src/features/tourhub/components/overview-v3/OverviewHero.tsx:496–497`: pass existing event status and minute clock.
- `src/features/tourhub/overview/sections/useAlsoWeekData.ts:1–45`: batched current-round tees and round-aware cache identity.
- `src/features/tourhub/overview/sections/AlsoThisWeek.tsx:11,31,38`: shared clock and round-keyed first tee forwarded to rows.
- `src/features/tourhub/overview/sections/AlsoWeekEvent.tsx:22–27,37,42`: shared delay rule, label and grey/no-dot presentation.
- Locale keys added only: en `:164,340`; en-XA `:183,248`; de/es `:124,216`; ja/ko `:122,214`, in `src/locales/<locale>/tourhub.json`.
- New tests: `src/test/roundDelay.test.ts:1–95` and `src/test/roundDelayOverview.test.tsx:1–125`.
- `roadmap.md:3–9`, this report, full logs and captures.

Rule ownership is documented in the new helper’s header. Root AGENTS.md was not changed: its protected content is already at the size budget and none was compressed.

## Casing ruling and existing tests
Ben’s 22:12 ruling supersedes only the brief’s mistaken mixed-case hero test string:
- Brief expectation: `PGA Tour · Round 3 · Delayed`.
- Correct new assertion: `PGA Tour · ROUND 3 · DELAYED`.
- Reason: existing round, afterRound and stateSuspended translations are stored in capitals; keep `ROUND {{round}} · DELAYED` consistent.

**No existing test/assertion was deleted, renamed or rewritten.** This corrected expectation was applied before creating/running the new render test. Non-English disabled locales receive the new keys with English values, preserving the existing English-only policy; en-XA uses its existing bracketed convention.

## Suite totals and commands
Baseline after the landed live-board tee/zone brief: **9,660 passed / 859 files**.
After: **9,701 passed / 861 files**. Delta: **+41 cases / +2 files**, solely 29 `roundDelay` and 12 `roundDelayOverview` cases. Every new case is named in `test-inventory.md`. No other test inventory changes.

Focused command:
`./node_modules/.bin/vitest run src/test/roundDelay.test.ts src/test/roundDelayOverview.test.tsx src/test/alsoWeekReads.test.ts src/test/alsoWeekRebuild.test.tsx src/test/tourOverviewHeroFixes.test.tsx src/test/tourLiveStates.test.tsx src/test/liveBoardTeeAndZone.test.tsx`

Result: **178/178 across 7 files**. The prior liveBoardTeeAndZone non-failing act warning remains unchanged and is retained in the log.

Each shard ran as its own command, sequentially, with full output retained:

| Command | Tests passed | Files | Log |
|---|---:|---:|---|
| `./node_modules/.bin/vitest run --shard=1/4` | 2,391/2,391 | 216 | `shard-1.log` |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,368/2,368 | 216 | `shard-2.log` |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,420/2,420 | 216 | `shard-3.log` |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,522/2,522 | 213 | `shard-4.log` |
| **Total** | **9,701/9,701** | **861** | |

Adding files redistributes shard boundaries; individual shard differences are not case deletions. Full inventory reconciles exactly with the two new files. No unexpected failures.

## Captures and browser checks
- `captures/rsm-delay-390.png`
- `captures/rsm-delay-320.png`
- `captures/rsm-republished-320.png`

The disposable page rendered the actual PhotoBand, LeadersGroupContent and AlsoWeekEvent with the shared helper and RSM-shaped fixture: round 3 scheduled, first tee 14:10 UTC, clock 21:47 UTC, completed round-2 figures and no current-round starters. The course photo is an existing placeholder, not claimed to depict Sea Island. The fixture player is explicitly labelled Fixture leader.

At both widths, inspected screenshots and browser assertions show:
- `PGA Tour · ROUND 3 · DELAYED` in the amber hero kicker.
- `Round 3 · Delayed` in the leaders’ line, no live dot.
- `ROUND 3 · DELAYED` in the weekly row, no green dot; caption colour exactly matches existing grey `rgba(248,250,252,0.62)`.
- No page overflow: clientWidth/scrollWidth 390/390 and 320/320.

Browser interaction removes delay after a current-round hole arrives, restores the weekly live dot, and removes delay after tee republication to 22:00 UTC; leaders then shows `Tees off Sat 17:00` in course time. No browser page errors. Measurements retained in `measurements.json`; temporary page removed.

These are isolated real-component fixtures, not live hosted-data, full-chrome or physical-phone checks. Actual HybridHero read/clock wiring and AlsoThisWeek batch forwarding are covered by render tests.

The separate Our picks block remains waiting for its missing signed-off `ourPicks_390.html` drawing; it was not changed here.