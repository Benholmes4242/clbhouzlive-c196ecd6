# PF3B — video viewer, feed and titles

## Scope
Match signed-off panels 2–4 for detailed single-video posts. Keep photos, mixed posts, ordinary videos, PF1B hole/round elements, composer/edit screens and view tracking unchanged. Never show view counts.

## Build
1. **Shared details and eligibility**
   - Add `usePostVideoDetails(postIds)` with page-level batches of at most 100, signed-in non-guest gating, viewer-scoped per-post caching and empty results on errors.
   - Collect eligible IDs only from exactly-one-video posts. Reuse `parseChapters` without another parser or stored chapter data.
   - Share the detailed-video rule across feed and fullscreen: a nonempty title, credits, thanks, links, gear, or qualifying chapters.
2. **One About this video sheet**
   - Use existing sheet lifecycle/history and body portal, with an opt-in video appearance matching the reference. Preserve all existing sheet defaults.
   - Show title, short-form likes, posted date, full interactive description, then conditional Chapters, Filmed at, In this video, Links, Thanks to and Gear sections in that order.
   - Fullscreen chapter/timestamp taps seek through VideoEngine and close the sheet. Feed taps open the existing viewer using its `resumeAtSeconds` handoff.
   - Profile/course/business links use existing navigation contracts; external links use validated HTTPS addresses.
3. **Fullscreen**
   - Replace only detailed-video captions with wrapping title, word-boundary single-line teaser and current chapter door.
   - Read chapter playback position at most once per second with lane/owner checks.
   - Add proportional chapter gaps to the existing scrubber without changing height, colours, continuous fill, drag or seek. Preserve the no-chapter track.
4. **Feed**
   - Pass shared details down from the Clubhouse page; cards never fetch individually.
   - Put the detailed-video teaser below media and before the existing round row and actions; open the shared sheet from title/more. Preserve media taps.
5. **Creator grid and Watch**
   - Keep long-form posters, duration and course chips intact; add up-to-three-line word-safe title and existing relative age below them. Portrait tiles remain unchanged.
   - Read details in page batches for Watch; prefer their title in `videoTitle` while preserving the current fallback chain and tile geometry.

## Verification and reporting
- Add focused rule, batch/privacy, teaser/playback, segmented scrubber, sheet/navigation, feed ordering, grid and Watch tests. Name any existing assertion changed and quote old/new values.
- Baseline: **7,508 tests / 657 files**; the preceding authorized country-bar repair passed all four shards without failures.
- Run focused tests, then four fresh separate `--maxWorkers=2` shard commands. Only the brief's named country-bar and TourIsland failures may be carried; stop and report any other failure verbatim.
- Check detailed fullscreen/feed, creator Long form, legacy-video preservation and 320px teaser/sheet/grid layout. Report fixture-only evidence separately from hosted authenticated verification; Ben's device playback/seek check remains with Ben.
- Write `PF3B_VIEWER_REPORT.md` with inventory reconciliation, per-shard totals and each requested check.

## Technical ownership
- Read-side normalization and eligibility live together; the composer's chapter parser remains authoritative.
- Shared sheet and teaser own their presentation once; viewer/page callers supply metadata, navigation and engine callbacks.
- No SQL, migrations, deployed RPC/edge edits, native/Median changes, feed_config changes or pool-cap changes.
- The mock's frozen comment band and other unchanged elements retain the shipped appearance. Its incidental references to search/course collection or a new scorecard in the sheet do not expand this brief's scope.