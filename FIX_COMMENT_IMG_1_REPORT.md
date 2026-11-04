# FIX_COMMENT_IMG_1 — stopped at server-source check

## Blocker
The implementation of `public.add_comment_v2` is not present in the inspected repository, archived source/docs or uploaded-file mirror. The brief requires verifying whether it rejects an absolute HTTPS media URL before implementing the upload change. The project stop rule covers data the brief assumes and the codebase lacks; no contract assumption or workaround was made.

Available evidence:
- `src/integrations/supabase/types.ts:20459–20471`: generated `add_comment_v2` RPC signature, including `p_media_url?: string`. It contains no function body or format/prefix/bucket constraints.
- `src/features/comments-v2/hooks/useCommentsV2.ts:431–436`: `supabase.rpc('add_comment_v2', { ... p_media_url: input.mediaUrl ?? undefined, ... })`. Client forwarding does not establish server acceptance.
- `supabase/migrations/20260626132118_13deb529-f620-4a95-9aae-92196447736e.sql:2–89` defines `send_message`, not `add_comment_v2`; its media argument is not evidence for comments. Existing source was only read; nothing executed or modified.

No rejecting clause can be quoted because the function body is unavailable. Needed from Ben: the current `add_comment_v2` function definition, including any helpers/checks that validate `p_media_url`. Do not run SQL to obtain it on Ben's behalf.

## Current behavior audited, unchanged
- CommentComposer still compresses feed images, calls the blocked `comment-images` upload, stores a bare pending path, and warns on upload failure.
- CommentImageV2 already renders `http(s)` URLs directly and signs bare paths from `comment-images` for3600 seconds. It remains exactly unchanged.
- No legacy image rows/objects migrated, moved or deleted.

## Test/build report
- Before: **6,603 tests / 583 files**, last verified in FIX_UPLOAD_PLAYER_1_REPORT.md.
- After: **6,603 tests / 583 files**; zero delta, no new/deleted/renamed/rewritten tests.
- No tests or shards run for this blocked task; no new pass or build claim.
- No pre-existing test failure identified. The source-audit command checking archived/uploaded source timed out after60 seconds; its output was retained at `/tmp/exec-logs/8fbc1c33-38db-45ed-bb99-a19da593caf3.log`. This is an investigation timeout, not a suite failure. Independent read-only audit confirmed the missing function source.

## Files touched
- `roadmap.md`: queued task and named server-contract blocker.
- `FIX_COMMENT_IMG_1_REPORT.md`: this stop report.
- Project memory: `mem://features/clubhouse/comment-photo-r2.md` and `mem://index.md`: saved the uploaded requirements.

No product or test source changed. No SQL, migrations/migration files, server/RPC/edge/native/Median changes. R2 guard/helper, guest browsing, review wizard, news, round plots and `feed_config` untouched; `round_pool_cap` remains30.