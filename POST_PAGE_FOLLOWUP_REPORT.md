# Post page follow-up — stopped on type validation

## Implemented
- Added exactly the authorised one-line mock to `src/test/profileFeedInViewGate.test.tsx`; nothing else in that file changed:
```ts
vi.mock('@/hooks/feed/usePostGolfTags', () => ({ usePostGolfTags: () => ({ withByPost: new Map(), slideTags: new Map() }) }));
```
- Added the outline Edit photo pill at the right of the tag sheet's photo header: height 32px, radius 999px, border using the existing `GP.line2` (rgba(255,255,255,0.16)), 12.5px/700. It closes the tag sheet then opens the existing media editor surface at the selected photo index. Existing page-one editor controls are unchanged.
- Added routing and actual inbox-render/click tests for the server's `tag` notification with `data.tag_kind: 'played_with'`.

## Notification ownership and evidence
Ben reports `trg_create_post_with_notification` is live on `public.post_with`. No SQL was run to independently inspect the trigger. No client-side notification was added.
`activityLinks.ts:270–273` already resolves a `tag` from `data.post_id`, falling back to `entity_id` for a post entity, to `/post/:id`.
`LedgerRow.tsx` renders the server's message without a special tag-kind rewrite. The new test renders the real inbox row with `Ben tagged you as playing with them in a post.`, clicks it, verifies it is marked read, and verifies `/post/post-1` is reached. This is fixture-backed UI evidence, not a live signed-in notification delivery check.
The existing `postPageGolf.test.tsx` test proving inserts make no client notification call remains unchanged and passes.

## Tests and reconciliation
Baseline requested: **4,962 tests**. Final executed and passing: **4,965/4,965 across 499 files**; no test failures or unhandled errors.

Commands:
- `bunx vitest run src/test/postPageFollowup.test.tsx src/test/postPageGolf.test.tsx src/test/profileFeedInViewGate.test.tsx`: 27/27, 3 files.
- `bunx vitest run --shard=1/2`: 2,423/2,423, 250 files.
- `bunx vitest run --shard=2/2`: 2,542/2,542, 249 files.

The +3 tests are all in new `src/test/postPageFollowup.test.tsx`:
1. `routes a tag row with tag_kind played_with to the post` — asserts `/post/post-1` using both post-id sources.
2. `renders the server message in the inbox and opens its post on tap` — asserts read-marking and destination after clicking the real row.
3. `closes the tag sheet before opening editing for the selected photo` — asserts callback order `['close', 'edit']`, sheet dismissal and selected photo identity `photo-2`.

No tests were deleted, renamed or rewritten; the approved mock adds no test case and changes no assertion.

## Stop — automatic type validation
The latest automatic preview validation at `2026-10-31T16:59:25Z` reported:
```text
src/test/postPageFollowup.test.tsx(53,35): error TS2741: Property 'frame' is missing in type '{ id: string; type: 'image'; previewUrl: string; }' but required in type 'StageMediaItem'.
```
This is a new test-fixture error introduced in this follow-up, not a pre-existing error. Work stopped when that surviving error was read. The prior build at `2026-10-31T16:58:35Z` was OK, but it does not establish the current build is clean. No manual build or typecheck was run.

## Outstanding proof and types
- The requested 390×844 page, hole-tagged photo/two people, tag sheet and Preview comparisons were not captured because of the stop above.
- This project's browser auth status is `external_unmanaged`; hosted authenticated end-to-end posting, tagging and inbox delivery checks are unavailable. No credentials were requested or fabricated.
- Median/iPhone picker DateTimeOriginal survival for photo and video remains unverified; no native changes.
- `post_with` is still absent from the generated database types. `lovable supabase --help` exposes diagnostics only, not types generation; the available platform tool inventory has no independent types-regeneration tool. The supplied integration guidance prohibits hand-editing the generated types. Regeneration therefore remains outstanding.
- Untyped access remains centralised at `src/features/post-v2/lib/postWith.ts:18`, `postWithTable()`, via `(supabase as any).from('post_with')`.

No SQL, migrations, trigger/RPC/edge changes, feed_config changes or native/Median changes. `round_pool_cap` stays 30.