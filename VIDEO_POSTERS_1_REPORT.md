# VIDEO_POSTERS_1

## Result and deployment
- Only the new `pick-video-poster` function was deployed successfully.
- URL: https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/pick-video-poster
- Live unauthenticated POST: **401** `{"error":"unauthorized"}`.
- Live authenticated `{ "limit": 1, "dryRun": true }`: **200**, checked 1, changed 1, kept 0, notReady 0; selected time 0, mean 110.55738333333403, sd 50.286763019932756, passed true. Dry run made no writes.
- Live authenticated limit 51: **400**, `Number must be less than or equal to 50`.
- Existing `INTERNAL_FN_SECRET` is configured and verified accepted. No secret values exposed.
- No cron schedule was created and no live write/backfill run was performed. The deployed function is ready for Ben's authorized invocation/scheduling.
- `changed` counts selected replacement URLs (would-change in dry run); the save RPC owns member-frame protection. Its supplied contract does not expose a before/after poster comparison, so this is not an independently measured count of byte-different database URLs.

## Implementation
- Candidate order, duration-minus-one bounds, floored/deduplicated quarter/midpoint, RGB-weighted luma statistics, inclusive 35/15 thresholds, first passing frame, highest mean+sd fallback, explicit full-size time URL live in pure `pick.ts`.
- New function uses service-role RPC calls only, sequential candidate fetches, 10-second fetch timeout, a 90-second new-row cutoff, per-row isolation, age-aware not-ready handling, strict input validation and CORS on responses. Dry run never saves.
- Stream thumbnail default now explicitly includes `&time=1s`; other URL behavior is unchanged.
- `posterSeconds` parses explicit nonnegative seconds, including zero and decimals.
- Watch lead and AutoplayLayer share preview-only metadata/seek/play and repeat lifecycle. Poster stays visible before playback at the intended time; real/fullscreen players are unchanged.

## Files touched
1. `supabase/functions/pick-video-poster/pick.ts` (new)
2. `supabase/functions/pick-video-poster/index.ts` (new)
3. `supabase/config.toml` (only new function section)
4. `src/utils/thumbnail.ts`
5. `src/uploads/posterUrl.ts`
6. `src/features/explore-magazine/watch/posterPreview.ts` (new)
7. `src/features/explore-magazine/watch/videoUnit.tsx`
8. `src/features/explore-magazine/watch/WatchLead.tsx`
9. `src/test/videoPosterPick.test.ts` (new)
10. `src/test/videoPosterUrl.test.ts` (new)
11. `src/test/videoPosterAutoplay.test.tsx` (new)
12. `AGENTS.md` (ownership pointer in managed block)
13. `roadmap.md`
14. `VIDEO_POSTERS_1_REPORT.md` (new)
15. Project memory `constraints/video-posters` and its index entry.

## Test inventory and exact commands
Last reported baseline: **5,971 tests / 545 files**, from the unringed-avatar fix.
After: **6,005 tests / 548 files**, all passed. Delta **+34 tests / +3 files**, solely:
- `videoPosterPick.test.ts`: +14.
- `videoPosterUrl.test.ts`: +9 (three parameterized parsing instances).
- `videoPosterAutoplay.test.tsx`: +11 (five parameterized zero-fallback instances).
No existing test was deleted, renamed, rewritten, or had its assertions/fixtures changed. Therefore there are no changed cases to quote. Existing Watch tests passed without modification.

Focused command:
`bunx vitest run src/test/videoPosterPick.test.ts src/test/videoPosterUrl.test.ts src/test/videoPosterAutoplay.test.tsx src/test/ws1WatchTop.test.tsx src/test/ws2WatchMiddle.test.tsx src/test/ws3WatchBottom.test.tsx --maxWorkers=2`
Result **125/125 tests, 6/6 files**. Output `/tmp/video-posters-focused.log`.

Full commands (four independent shards):
- `bunx vitest run --maxWorkers=2 --shard=1/4`: **1,501 / 137 files**.
- `bunx vitest run --maxWorkers=2 --shard=2/4`: **1,469 / 137 files**.
- `bunx vitest run --maxWorkers=2 --shard=3/4`: **1,501 / 137 files**.
- `bunx vitest run --maxWorkers=2 --shard=4/4`: **1,534 / 137 files**.
Total **6,005 / 548**, **0 failures, 0 unhandled errors**. Complete outputs retained as `/tmp/video-posters-shard1.log` through `/tmp/video-posters-shard4.log`. No pre-existing failures found in these runs; existing React act warnings remain warnings, not failures.

### Added case names
`videoPosterPick.test.ts`:
- “rejects a black frame”
- “rejects a flat dark fade with mean 18 and sd 0”
- “rejects white text on black with mean about 8 and sd about 24”
- “accepts a real golf frame with mean 120 and sd 30”
- “requires both thresholds inclusively”
- “uses weighted RGB luma and ignores alpha”
- “preserves candidate order without a known duration”
- “respects duration minus one and deduplicates percentage times”
- “appends floored quarter and midpoint after fixed candidates”
- “chooses the first passing candidate”
- “nothing passing chooses the highest mean plus sd”
- “empty candidates yield no choice”
- “canonical full-size URL always includes time zero”
- “canonical full-size URL includes the picked time”

`videoPosterUrl.test.ts`:
- “default stream thumbnail carries time=1s”
- “zero stream thumbnail carries time=0s”
- “unknown-duration derived poster carries time=1s”
- “non-stream images are unchanged”
- “posterSeconds parses 7s”
- “posterSeconds parses 0s”
- “posterSeconds parses 12.5s”
- “posterSeconds returns null with no time”
- “posterSeconds rejects invalid or embedded time text”

`videoPosterAutoplay.test.tsx`:
- “waits for metadata and seeks to the poster before play”
- “stays hidden before playing and ignores playing before the start point”
- “waits for seeked before play when a real seek is pending”
- “restarts at the poster on ended without native looping”
- “falls back to zero for null”
- “falls back to zero for /poster.jpg”
- “falls back to zero for /poster?time=0s”
- “falls back to zero for /poster?time=19s”
- “falls back to zero for /poster?time=30s”
- “cleans metadata and repeat handlers when inactive”
- “shares metadata-gated poster start and repeat while fullscreen intent remains zero” (covers WatchLead start/repeat; fullscreen intent is preserved in source, not asserted by this new case).

## Verification and limits
- Automatic build log latest checked: **build OK**, 2026-11-03T08:08:46Z. No manual build/typecheck was run, per environment policy.
- Real Chromium playback exercised the shared preview helper with an actual MP4 containing a two-second black intro. At visibility, currentTime **2.036372**, opacity **1**, no visible sample before 2s, loop **false**. Inspected `/tmp/browser/video-posters/playing.png`; the nonblack moving test pattern rendered. This verifies actual metadata/seek/play, not a signed-in Watch surface.
- External unmanaged authentication prevents signed-in Watch end-to-end readback. No claim of a live member poster save or full backfill completion.
- No SQL, migrations, existing edge-function edits, RPC edits, feed_config edits, native/Median changes, guest browsing, review wizard, news, or round plots were changed. round_pool_cap remains untouched at 30.