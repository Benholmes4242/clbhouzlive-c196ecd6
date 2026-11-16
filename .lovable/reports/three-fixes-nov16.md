# Three fixes Nov 16

## Delivered
- Shared newsAge long forms now read `Just now` and `Yesterday`; digit/date and short forms unchanged. Overview and News use the same helper.
- IndexGlance computes its one-decimal move from currentIndex minus the oldest drawn point, with roundsDrawn in move and caption and singular `round` at one. Improving green, drifting red, rounded-zero dim text/ink dot. Removed AMBER from this file. No-sparkline glanceMoveText and ChromeIsland latest revision unchanged.
- Enabled comment Send uses global semantic tokens for pure #FFFFFF background and #0A0A0C icon, without shadow. Disabled state and business identity amber unchanged; header comment updated.
- User chose inherited app font: IndexGlance opts its shared shell and button into inheritance without changing other glance variants.
- Window formatting ownership documented beside IndexGlance; no new read, navigation, storage or server architecture.

## Test accounting
Before: **8,948**. After: **8,954** across **776 files**, all passed, no failures/skips. Delta **+6**, entirely new cases in islandsNav.test.tsx. No deleted or renamed cases.

Authorised existing expectation updates:
- overviewNewsRebuild.test.tsx `long age at 0h`: prior `expect(newsAge(...,false,now)).toBe('just now')`; now `Just now`.
- Same file `long age at 24h` and `long age at 47h`: prior `expect(newsAge(...,false,now)).toBe('yesterday')`; now `Yesterday`.
- islandsNav.test.tsx `shows the move, sparkline and stats once data settles`: prior `expect(dialog.textContent).toContain('▾ 0.2 this month')`; now `▴ 0.2 over 3 rounds`, since oldest drawn 12.2 to current 12.4 is +0.2. Other assertions retained.
These four existing cases keep their names/count; the brief explicitly authorises the changed expectations. No other existing test changed.

Six added cases in islandsNav.test.tsx:
- `matches its seven-round text and end dot from oldest 13.4` (lower).
- Same parametrised case from oldest `11.4` (higher).
- Same parametrised case from oldest `12.43` (rounds to zero).
- `uses the singular one-round window and caption`.
- `retains the latest-revision wording without a sparkline`.
- `rounds the drawn change to one decimal and uses dim text with an ink level dot`.

Focused command: `npx vitest run src/test/islandsNav.test.tsx src/test/overviewNewsRebuild.test.tsx src/test/commentPhotoR2.test.tsx --maxWorkers=2` — **95 passed**.

Four separate sequential full-suite commands:
| Command | Passed |
| --- | ---: |
| `npx vitest run --maxWorkers=2 --shard=1/4` | 2,276 |
| `npx vitest run --maxWorkers=2 --shard=2/4` | 2,176 |
| `npx vitest run --maxWorkers=2 --shard=3/4` | 2,240 |
| `npx vitest run --maxWorkers=2 --shard=4/4` | 2,262 |
| Total | **8,954** |
Runner logs: `/tmp/three-fixes-focused.log`, `/tmp/three-fixes-shard1.log` through `shard4.log`.

## Browser checks and limits
- Live `/tourhub` and `/tourhub?tab=news` rendered at 320 and 375; real details read `4 min read · Yesterday`, with short pair ages unchanged.
- Browser-only actual IndexGlance fixtures rendered lower/higher/rounded-zero at both widths: seven-round text/caption, green/red/ink dots, 300px contained dialog. Screenshots inspected.
- Actual CommentComposer with isolated actor/input fixtures rendered enabled Send at both widths; after its existing transition computed background `rgb(255, 255, 255)`, icon `rgb(10, 10, 12)`, shadow `none`. Screenshots inspected.
- Shared News story fixtures checked age details with and without News engagement at both widths.
- Backend is `external_unmanaged`; authenticated glance and full comment-sheet submission were **not verified**. Fixture rendering is not claimed as signed-in end-to-end verification. Existing comment upload/submission tests passed.
- Browser harness initially had a duplicate-router import and overly broad selector; repaired only the disposable harness. No product test failed.
- Final preview signal: `build OK` at 2026-11-16T09:16:39Z.

No SQL, migration, feed_config, round_pool_cap, native or server changes. Earlier implementation saved in a6dd168cc3 and maintenance checkpoint e75c9f2612; this closeout preserves those commits.