# View post removal — guest rerun ruling

## Result
No app files or test files were edited. No SQL, migrations, backend writes, feed_config or round_pool_cap changes.

The authorised standalone test passed once. Shard 3 was rerun once, then shard 4 ran as its own command. Shards 1 and 2 were not rerun. All final shards passed, with no failed tests.

## Commands and runner outputs
Full stdout/stderr, including warnings, is preserved in the linked logs. Runner summary output follows.

| Command | Test files | Tests passed / executed | Full output |
|---|---:|---:|---|
| `bunx vitest run src/test/guestStage24.test.tsx` | 1 | 5 / 5 | [guestStage24.log](guestStage24.log) |
| `bunx vitest run --shard=3/4` | 211 | 2,349 / 2,349 | [shard-3.log](shard-3.log) |
| `bunx vitest run --shard=4/4` | 208 | 2,447 / 2,447 | [shard-4.log](shard-4.log) |

```text
 RUN  v3.2.4 /dev-server
 ✓ src/test/guestStage24.test.tsx (5 tests) 81ms
 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  08:59:59
   Duration  2.97s (transform 183ms, setup 155ms, collect 338ms, tests 81ms, environment 612ms, prepare 391ms)

 Test Files  211 passed (211)
      Tests  2349 passed (2349)
   Start at  09:00:09
   Duration  179.69s (transform 46.65s, setup 229.49s, collect 741.60s, tests 196.31s, environment 1054.76s, prepare 167.92s)

 Test Files  208 passed (208)
      Tests  2447 passed (2447)
   Start at  09:03:16
   Duration  132.02s (transform 37.37s, setup 168.67s, collect 577.12s, tests 115.89s, environment 775.00s, prepare 126.95s)
```

Original shard 3 failure output is preserved in `original-shard-3.log`; the passing rerun does not overwrite it. Existing warnings remain in full output; they did not produce failed tests.

## Final suite accounting
| Shard | Files passed | Tests passed |
|---|---:|---:|
| 1 — retained original pass | 211 | 2,311 |
| 2 — retained original pass | 211 | 2,292 |
| 3 — authorised rerun | 211 | 2,349 |
| 4 | 208 | 2,447 |
| **Total** | **841** | **9,399 / 9,399** |

Before original View post brief: **9,400 across 841 files**. After: **9,399 across 841 files**. Only difference **−1**: `src/test/pf2HoleGuide.test.tsx`, deleted case **`the tap opens the post and never reaches the slide`**, asserting `expect(onSlideTap).not.toHaveBeenCalled()` after clicking View post. Why: the original brief explicitly authorised deleting the case because its button was removed. That file changed 14 → 13 cases. The two authorised case renames retain their counts; every original assertion change is quoted in the parent report. This ruling adds, deletes, renames or rewrites no tests.

The standalone 5 tests and original failed shard attempt are repeat executions, not additions to the final suite total.

## Fresh screenshots — isolated presentation verification, not live source shots
These captures mount the actual `ImmersiveFullscreenChrome` in Chromium, with isolated Sundridge video / Woking photo inputs and confirmed source-post IDs. They use the earlier signed-off mock's shared background photo, **not the actual Sundridge video or Woking photo from live posts**. The video scrubber is visible but no real video is playing (0:00 / 0:00). Do not treat these as live-gallery or playback evidence.

| State | 390px | 320px |
|---|---|---|
| Sundridge video presentation, THE NINTH | [390 screenshot](sundridge-video-390.png) | [320 screenshot](sundridge-video-320.png) |
| Woking photo presentation, THE FIRST | [390 screenshot](woking-photo-390.png) | [320 screenshot](woking-photo-320.png) |

Visually inspected all four captures: name/hole row is above the video scrubber or photo pills; View post is absent; no page or hole-tile horizontal overflow. At 320, names wrap without overlapping the tile. All four Share clicks read back the corresponding source ID through the supplied callback; video row exists only for the video input. No browser page errors. Detailed measurements are in `results.json`; reproducible capture setup is retained in the project report folder.

**Outstanding:** actual source-post Sundridge video and Woking photo screenshots/live interaction could not be authenticated because this project is `external_unmanaged`; authenticated end-to-end checks are unavailable. No credentials requested or guest minted. No live source posts were accessed or invented.

## Files saved in this ruling
Report, standalone and shard logs, original-failure log copy, four screenshots, capture script/log and measurements; parent report and roadmap status updated. No application, stylesheet, test or assertion changed. The prior report's last observed preview build was OK; current observability build log is absent, so no new build result is claimed. Actual viewer browser capture produced no page errors.