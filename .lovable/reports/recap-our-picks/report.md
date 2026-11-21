# Season recap Our picks — stopped browser verification

## Scope

Matched the supplied ourPicks_390.html in the RecapOurRecord heading and figure layout; kept THE SEASON, THE POINTS LIST, card lists, record source, visibility gates and OurRecordSheet implementation unchanged. No SQL, migrations, feed_config changes, guest creation or authentication operations.

The signed-off drawing's frozen context differs from the build: THE SEASON retains its existing 15px/700 figures, 800-weight kicker/labels and shared compact rhythm, rather than the mock's 22px/700 figures and 14px gap. Those frozen surfaces were not restyled. The requested record figures alone use 22px/700 and a 14px heading gap. Existing disabled locale recap additions follow their established English-copy convention; the English-only locale switch is unchanged.

## Files changed

- `src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:182–198`: local scope ownership note; new heading/label keys; Button variant/size null; existing state-driven sheet opening preserved; record figures no longer carry the old inline 15px size.
- `src/styles/hybrid-hero.css:102–109`: record-only heading baseline and 12px gap; doubled link selector with no padding/height/background; 14px figure gap, three equal columns, 22px figures and requested label styling. Shared card-list link rules unchanged.
- `src/locales/en/tourhub.json:331–333`: ourPicks, winnersPicked, inTop10. Old ourRecord/won/top10 and existing howWePick retained.
- `src/locales/de/tourhub.json:127–129`, `es/tourhub.json:127–129`, `ja/tourhub.json:125–127`, `ko/tourhub.json:125–127`, `en-XA/tourhub.json:125–127`: same three new keys.
- `src/test/recapOurPicks.test.tsx:1–79`: nine new cases, real translation/router/query providers and real OurRecordSheet.
- `src/test/seasonRecap.test.tsx:141`: one authorised existing margin assertion updated.
- `roadmap.md:10–14`: unblocked brief, inventory and exact browser stop.
- `.lovable/reports/recap-our-picks/`: this report, full focused/shard/browser logs, unchanged browser verification script, 390px captures.

## New tests — nine cases

File: `src/test/recapOurPicks.test.tsx`.

1. keeps the heading and sheet action in one heading row
2. preserves event_count, won and top10 as the three published figures
3. opens the existing OurRecordSheet when the heading action is tapped
4. hides the block for disabled picks tour euro even with a record
5. hides the block for disabled picks tour pgad even with a record
6. hides the block when the published event count is zero
7. hides the block when the published event count is absent
8. hides the block without a published record
9. suppresses a stale record after a failed read

These test structure, server-payload figures, navigation and visibility. Copy, class/style and responsive checks are in the browser script instead of new Vitest styling tests.

## Existing test assertion change — one, no name/count change

File `src/test/seasonRecap.test.tsx:141`, case **shares completed rhythm and centres intrinsic aligned card columns**.

Old:

```ts
expect(css).toContain('.recap-record-figs{margin:var(--hero-content-gap) 0 0}');
```

New:

```ts
expect(css).toContain('.recap-record-figs{margin:14px 0 0;');
```

Reason: the brief explicitly replaces the record margin with 14px. Only the assertion encoding that superseded record-spacing rule changed; all other assertions and all 31 cases in the file remain. No test deleted or renamed. No failed check was edited to pass.

## Inventory and commands

The brief's live-board tee/zone baseline was 9,660 tests / 859 files. The subsequent delayed-round work added `roundDelay.test.ts` (29 cases) and `roundDelayOverview.test.tsx` (12 cases), producing the last reported full-suite baseline 9,701 / 861. This task adds only `recapOurPicks.test.tsx` (nine cases / one file): **9,710 tests / 862 files**. No existing file loses cases.

Focused command:

```text
./node_modules/.bin/vitest run src/test/recapOurPicks.test.tsx src/test/seasonRecap.test.tsx
```

40/40 tests passed across two files. This is filtered verification, not the full-suite total.

Each full-suite shard ran sequentially in a separate command, with complete output retained:

| Command | Passed tests | Passed files | Log |
|---|---:|---:|---|
| `./node_modules/.bin/vitest run --shard=1/4` | 2,391 | 216 | shard-1.log |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,368 | 216 | shard-2.log |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,428 | 216 | shard-3.log |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,523 | 214 | shard-4.log |
| **Total** | **9,710 / 9,710** | **862** | |

Zero Vitest failures. Relative to delayed-round shard totals 2,391 / 2,368 / 2,420 / 2,522, the new nine-case file enters shard 3, and unchanged `invalidateHandicapPrivacyCaches.test.ts` (one case) moves from shard 3 to shard 4 under the runner's partitioning. This explains +8 in shard 3 and +1 in shard 4; no assertion or count changed in that moved file. Both log inventories were compared by file and case count.

Latest observed harness build: **build OK**, 2026-11-21T22:48:54Z. No manual build/typecheck run.

## Browser evidence and exact stop

An isolated Vite page rendered the actual SeasonRecapBody with the drawing's Champions figures and a query-cache-seeded published-record-shaped payload (10 events, three winners, 15 top tens). This was not hosted live data or a physical phone. No sign-in or guest creation was needed.

Command:

```text
python3 /tmp/browser/recap-our-picks/check_recap.py
```

Before the stop at 390px, checks passed for:

- Heading `OUR PICKS · 2026`; link textContent `How we pick ›` with CSS uppercase.
- One 14px-high heading row, equal baseline (less than 1px delta), 14px gap to the figure grid.
- Equal 10px heading/link font sizes and colour; no page overflow.
- Published values 10 / 3 / 15, 22px/700 figure styling.
- Label text EVENTS / WINNERS / IN THE TOP 10.

Saved and visually inspected captures:

- `captures/our-picks-390.png`: isolated record block, link on the heading line.
- `captures/context-390.png`: unchanged season and points-list context above the record block.

The next check failed:

```text
File "/tmp/browser/recap-our-picks/check_recap.py", line 32, in main
    assert all(f['fontWeight']=='700' for f in facts['labels'])
           ~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError
```

The intended `.recap-record-figs span` rule has the same specificity as the shared `.cw-cell span` rule at `src/features/tourhub/tournament-v2/sections/completedWeek.css:23`, which declares weight 800. The browser failure establishes that the requested 700-weight labels were not achieved; other equal-specificity label/figure properties need cascade checking when continuation is authorised. No repair or rerun was made after the failure.

Under the stop rule, the following remain unverified: 320px capture, browser sheet opening, the later Button-base-class assertion, complete record-label geometry and exact visual match. The real sheet action is independently verified by the passing Vitest case. The temporary capture HTML/TSX page was deleted. The original browser script and full failure output are retained unchanged here.

Next step requires a ruling to fix the record-only cascade and resume the outstanding browser checks; no changes to shared THE SEASON styling or failed assertions are needed.