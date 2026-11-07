# PF1_STAGE1 report

## Result and remaining verification
Composer now has play-date/claim/GPS course prefill, 18-hole selection, nine multi-select shot tags, personal round attachment, pending source-linked guide writes and retained-media drafts. Manual course choices are retained. Attached rounds write attached_score_id only; posts.whs_score_id and RPC implementations remain untouched.

**Not a complete live close-out:** authenticated write/readback, club identity, restart/reopen and delete-cascade checks are unavailable with external unmanaged authentication. The signed-out composer was opened at /post-v2; it cannot exercise member operations. Preview actor picker already renders its resolved actor avatar/crest with SquircleAvatar and no explicit letter placeholder; it was not changed. The personal/business Preview actor-switch check remains unverified.

## Tests
Baseline: 7,408 tests / 645 files. After: **7,437 tests / 648 files, all passed**. Delta +29 cases in three new files (19 golf +6 drafts +4 guide). Existing tests changed/deleted/renamed/rewritten: **none**.
Focused: `bunx vitest run src/test/pf1ComposerGolf.test.tsx src/test/pf1HoleGuide.test.ts src/test/pf1Drafts.test.ts src/test/viewPost1Composer.test.tsx src/test/previewFix1.test.tsx src/test/previewFix2.test.tsx src/test/postPageGolf.test.tsx --maxWorkers=2`:70/70.

Each full-suite shard ran as its own command:
| Command | Tests passed | Files | Failures |
|---|---:|---:|---:|
| bunx vitest run --maxWorkers=2 --shard=1/4 |1918|162|0|
| bunx vitest run --maxWorkers=2 --shard=2/4 |1816|162|0|
| bunx vitest run --maxWorkers=2 --shard=3/4 |1884|162|0|
| bunx vitest run --maxWorkers=2 --shard=4/4 |1819|162|0|
Known tourIsland failure did not appear. No unexpected failures. Output retained in /tmp/pf1/focused.log and shard1.log–shard4.log. Latest preview build OK2026-11-07T08:35:50Z; intermediate missing import was corrected before tests.

## Requested checks
1. Personal played-today course, hole15/view/attached round and real post/guide rows: **live unverified**; pure patch and guide insertion tests pass, but authenticated end-to-end is unavailable.
2. Club claimed course/no attach/full name320px: **live unverified**; source precedence and business exclusion tests pass. Isolated course fixture at320px wraps without horizontal overflow; actual club Posting as row not verified.
3. Two photos plus clip, close app/reopen draft: **live unverified**; draft adapter order/crop/frame/trim/filter/course/hole/tags/round restore tests pass. Actual save-to-reopen through hosted UI not exercised.
4. Delete post removes guide row: **unverified**; relies on Ben’s existing cascade, no SQL/read or deletion attempted.
5.320px: isolated actual golf controls measured clientWidth320/scrollWidth320; hole15 and view selected via real controls. Course name and guide copy wrap. Whole authenticated composer and every sheet remain unverified. Screenshots /tmp/browser/pf1/320.png and live.png.

## Draft and upload behavior
Existing draftMediaUpload/addDraftMedia helpers retain storage references, display_order, edits, filter and metadata. Restored images without crop baking reuse remote URLs; Stream clips reuse stream IDs with trim metadata. Cropped images are downloaded and re-uploaded because final pixels must be baked. The scheduled time is not stored; only its truthful warning remains. Draft metadata is deleted after submit handoff; media assets are not deleted because the post uses them.
Guide writes occur after successful finalize, per ready post_media row, with both source IDs; unique violations ignored and failures logged without failing posts. A ten-minute ready-update subscription covers deferred rows while the client remains alive. **Limit:** this client-only lane is not durable across a killed app; no prohibited server changes were made. Subscription/query handoff race and deferred completion after app closure remain unverified.

## Scope and signed-off differences
The resolved prefill rule is played today/yesterday, never synced within24hours or time-of-day wording. CourseCardPanel’s existing useCourseTeeSets source supplies hole metadata; absent data shows only the ordinal. Multi-course tagging remains. Existing per-photo tagging/Played with were retained rather than silently retiring behavior not expressly removed; they differ from the simplified mock. Shared ShareFooter, success/View post, feed/fullscreen cards and PREVIEW_FIX_2 untouched. No SQL, migration, deployed RPC/edge, feed_config, round_pool_cap, native/Median or protected review/news/round-plot changes.

## Files
- src/features/post-v2/StageComposer.tsx
- src/features/post-v2/hooks/useStageComposer.ts
- src/features/post-v2/hooks/usePostSubmit.ts
- src/features/post-v2/hooks/useDrafts.ts
- src/features/post-v2/lib/postUploadController.ts
- src/features/post-v2/lib/composerGolfRules.ts
- src/features/post-v2/lib/composerGolfReads.ts
- src/features/post-v2/lib/composerDrafts.ts
- src/features/post-v2/lib/postHoleGuide.ts
- src/features/post-v2/components/golf/ComposerGolf.tsx
- src/features/post-v2/components/golf/composerGolf.css
- src/index.css
- public/locales/en/composer.json
- public/locales/en-XA/composer.json
- src/test/pf1ComposerGolf.test.tsx
- src/test/pf1Drafts.test.ts
- src/test/pf1HoleGuide.test.ts

## Added cases (complete ledger)

### src/test/pf1ComposerGolf.test.tsx
- claimed course takes precedence over round and GPS
- today round takes precedence over GPS
- yesterday round remains eligible
- older round is not prefilled
- GPS fills only without a recent round or claim
- no matching source remains empty
- manual choice is never overwritten
- nearest course is within two kilometres
- business actors cannot attach a round
- a round beyond seven days cannot be attached
- attaching writes attached_score_id and never round-post whs_score_id
- hole toggles set and clear and never accepts nineteen
- nine shot-tag values exactly match the server catalogue
- guide requires a hole and media
- editor mode is photo-only for photos and generic for mixed or clips
- mounted hole controls set then clear the selection
- no course hides hole controls
- Different round returns the selected score
- changing primary course clears hole and attached round

### src/test/pf1Drafts.test.ts
- restores media order, crop, frame and filter
- restores clip trim and poster with its Stream source
- reopens course, hole, tags, round, visibility and ordered media
- saving retains every local file and its edits in display order
- already stored media is reused rather than uploaded twice
- failed media save rejects rather than claiming a complete draft

### src/test/pf1HoleGuide.test.ts
- inserts one pending row per ready media item with both source ids
- processing media is deferred
- a unique violation is ignored
- guide write failure does not fail the post
