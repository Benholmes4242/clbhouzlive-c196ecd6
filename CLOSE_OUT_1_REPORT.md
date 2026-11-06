# CLOSE_OUT_1 — revised fullscreen notch close-out

## Closed
FS_NOTCH_1, EXP_RING_1 and TOPTEN_SHEET_1 are closed on the requested focused/full-suite evidence. All four fresh shards are green; no known or unexpected failures remain in this run. The previously known TourGlance width failure did not recur. No flake reruns were needed.

## Delivered scope
- `src/lib/media/resolveRestingRect.ts`: replace `mediaAspect < 1 && widthFilledH >= 0.9 * usableH` with `mediaAspect <= 0.6`; update the authority header. Contain sizing, available-height cap, horizontal safe-inset centring, other-aspect geometry and unknown-dimension fallback are unchanged.
- `src/components/feed/FeedSlide.tsx`: add only `data-fs-media-frame` to the fullscreen image frame; no styling or playback changes.
- Only the two named test repairs below; synthetic portrait assertions unchanged. Two regression cases added for the revised inclusive threshold and just-wider exclusion.
- EXP_RING tests were already repaired: expRing1 normalizes whitespace on both sides; ws3WatchBottom retains real SquircleAvatar exports. Neither file was edited. The read-only background audit initially described stale report entries as current blockers; direct source inspection and fresh passing shards establish the current state.
- No SQL, migrations, RPC/edge-function edits or deployment; feed_config, round_pool_cap=30, native/Median configuration, guest browsing, review wizard, news and round plots untouched.

## Exact changed-test ledger
No test deleted, renamed or rewritten in full. Two existing cases edited; all other assertions/cases/fixtures preserved.

1. `src/test/fsNotch1.test.tsx`, `renders the scrim inside a top-0 portrait slide`:
   - Old selector: `container.querySelector('img[decoding="async"]')`
   - New selector: `container.querySelector('[data-fs-media-frame] img[decoding="async"]')`
   - Why: select the media frame image, not the blurred backdrop. Assertions remain `top === '0px'`, `height === '693.3333333333334px'`, `objectFit === 'contain'`, plus original scrim existence/location assertions. No assertion or expected value changed.
2. `src/lib/media/__tests__/fullscreenBand.test.ts`, `height-limits taller portraits and centres between lateral safe insets`:
   - Old: `expect(rect).toMatchObject({ top: 0, width: 754 / 3, height: 754, fit: 'contain' });`
   - New: `expect(rect).toMatchObject({ top: 0, height: 754, fit: 'contain' });` and `expect(rect.width).toBeCloseTo(754 / 3);`
   - Why: tolerate floating-point rounding only for width. Top, height, contain and lateral-inset centre assertions preserved.
3. `anchors synthetic portrait media without reserving a footer` is unchanged and now passes through the revised product rule.

Added cases, both in fullscreenBand.test.ts:
- `anchors the inclusive 3:5 threshold even without a reserved footer`: 3:5 returns `{ top: 0, left: 0, width: 390, height: 650, fit: 'contain' }`.
- `centres media just wider than 3:5 regardless of its width-filled height`: 601:1000 stays above safeTop, centred at 400.5, width390 and contain. This catches the retired height-percentage classification.

## Focused verification
Command:
```sh
bunx vitest run src/test/fsNotch1.test.tsx src/lib/media/__tests__/fullscreenBand.test.ts src/test/memberShotViewerPolish.test.tsx src/test/cb52VideoTimings.test.ts src/test/previewFix1.test.tsx --maxWorkers=2
```
53 tests / 5 files passed: 6 notch-slide, 19 fullscreen-band, 2 member-shot, 16 video-timing, 10 preview cases.

## Fresh full suite
Each shard ran as its own command, in order:
```sh
bunx vitest run --maxWorkers=2 --shard=1/4
bunx vitest run --maxWorkers=2 --shard=2/4
bunx vitest run --maxWorkers=2 --shard=3/4
bunx vitest run --maxWorkers=2 --shard=4/4
```

| Shard | Passed tests | Failed tests | Passed files |
|---|---:|---:|---:|
| 1 | 1,872 | 0 | 159 |
| 2 | 1,741 | 0 | 159 |
| 3 | 1,834 | 0 | 159 |
| 4 | 1,758 | 0 | 156 |
| **Total** | **7,205** | **0** | **633** |

Baseline from PRO_RESULT_ROUND_ROW_REPORT.md: 7,203 executed (7,200 passed + 3 known failures), 633 files. After: 7,205 passed, 633 files. Executed-test delta +2 is exactly the two named threshold regressions; passed-test delta +5 consists of those two plus the three resolved FS_NOTCH failures. fullscreenBand file17→19; fsNotch1 stays6. No file-count change.

Closure evidence also includes expRing1 3/3, ws3WatchBottom 41/41, topTenSheet1 4/4 and tourIsland 14/14. The former portrait failures pass in their original cases with the narrowly authorized repairs. No pre-existing failure appeared in this run.

Complete outputs: `docs/verification/close-out-1/focused.log` and `shard-1.log` through `shard-4.log`. Historical reports/logs retained rather than deleted.

Preview harness: `build OK` at 2026-11-06T06:33:30Z; no manual build/typecheck run. Existing non-failing React warnings remain in test logs. Hosted authenticated viewer playback/device verification was not requested in this close-out and is not claimed; evidence is the requested mounted-slide and geometry tests plus full suite.