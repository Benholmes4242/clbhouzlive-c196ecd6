# Season recap rhythm — verification checkpoint

## Implemented
- THE SEASON and THE POINTS LIST headings restored; Full list remains absent.
- Facts and Our record use shared completed cell tokens and board TOT 15px/700.
- Intrinsic two-column card list centred as a pair, 34px apart; number slots 18px with 10px name gap.
- At ≤340px, equal columns and a 6px gap prevent the supplied Top 20 names truncating.
- Board rows, photo, champion figure, sentence and read logic unchanged.

## Tests
Before commands, each separately: `bunx vitest run --shard=N/4 --maxWorkers=2`.
Before counts: 2,084 / 1,907 / 2,053 / 1,958 = **8,002**, zero failures.
After counts before the final heading-alignment adjustment: 2,087 / 1,907 / 2,053 / 1,958 = **8,005**, zero failures.
After that adjustment only shard 1 was rerun: **2,087 passed**. Shards 2–4 require fresh reruns against the latest stylesheet; do not treat the earlier results as final-state verification.
Focused: `bunx vitest run src/test/seasonRecap.test.tsx src/test/heroBlocks.test.tsx --maxWorkers=2`: **41 passed**.
Logs: `/tmp/recap-rhythm/{before,after}-{1,2,3,4}.log`, `final-1.log`, `focused.log`.

### Inventory delta: +3
Added in `seasonRecap.test.tsx`:
- `restores both section headings without a Full list action`
- `facts and record reuse the two-line TOT cells`
- `shares completed rhythm and centres intrinsic aligned card columns`
No tests deleted or renamed.
Existing `heroBlocks.test.tsx` case `RecapStandings renders no kicker or Full list link`: old `expect(stand).not.toContain('boardKicker')` replaced by `expect(stand).toContain('overview.recap.pointsHeading')`, because the brief restores the heading. Name retained.
Existing `seasonRecap.test.tsx` case `board: trophy for first, rounded points, no board header row`: added `expect(board.querySelector('h2')).not.toBeNull()`; obsolete FINAL-heading absence and Full-list absence assertions retained. Name retained.

## Measurements at 390px
Production-component fixture with real stylesheet:
- First heading: previously absent; now 18px below chip anchor (same completed fixture distance).
- Facts labels → points heading: previously no heading, old board header started 24px below labels; new heading starts 16px below.
- Points heading → table: absent → 9px.
- Last board row → card heading: 18 → 16px.
- Card heading → list: 0 → 9px.
- List → youngest line: 10 → 9px.
- Youngest line → Our record heading: 22 → 16px.
- Our record heading → figures: 12 → **13px**, still needs correction to 9px; right-side action controls the header line box.

320/390/430 fixtures show no figure, label or card-name overflow after equal-column fallback. Narrow intrinsic list would not fit; 320 fallback columns are 141px each with 6px gap.
Fixture screenshots remain `/tmp/browser/recap-rhythm/final_{320,390,430}.png` (not user attachments).
Our record fixture uses the real section with a prefilled query cache, not a real signed-in record read.

## Pending
- Correct remaining Our record 13px content gap to shared 9px, then focused and four fresh final-state shards.
- Authenticated live page and device verification not performed.
- Board-header brief recorded in roadmap; no board-header implementation started.

No SQL, migrations, deployed RPC/edge functions, feed_config, round_pool_cap, native/Median, guest browsing, review wizard, news or round plots changed.