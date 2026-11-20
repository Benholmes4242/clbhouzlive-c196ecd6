# Played with — stop swallowing the save error

**Status: STOPPED on two unexpected edit-test fixture failures.** Application changes are implemented; edit verification and all four shards remain incomplete. No test was repaired after failure.

## Implemented
- `writePostWith` returns `{ saved, error }`, preserving Supabase's code, message, details and hint exactly, retaining its warning and existing insert payload, filtering and table.
- `syncPostWith` returns the first delete/insert error, or null. A delete error stops further tagging writes. `removeMeFromPost` is unchanged.
- Create/edit call one shared reporter: `toast.error("Couldn't save who you played with. {message}{code suffix}", { duration: 8000 })`; analytics event `post_with_write_failed` carries code/message/details/hint/count/mode.
- Create continues publishing/uploading and derives success names only from saved IDs. Edit continues toward its existing success screen, which carries no Played with names.
- No SQL, migration, feed_config, insert-payload, RLS, notification-flow or round_pool_cap changes.

## Files changed
- `src/features/post-v2/lib/postWith.ts`: return contracts and first-error propagation.
- `src/features/post-v2/lib/postWithError.ts`: new shared error presentation. Its header records local ownership; root AGENTS.md is unchanged and near its budget.
- `src/features/post-v2/hooks/usePostSubmit.ts`: report create failures and use saved IDs.
- `src/features/post-v2/StageComposer.tsx`: report edit sync failures.
- `src/test/composerTagging.test.tsx`: authorised return-shape mock update only.
- `src/test/pf3cRoundWrites.test.tsx`: authorised return-shape mock update only.
- `src/test/postWithErrorSurface.test.ts`: nine new cases.
- `roadmap.md`: request and stop.
- This report and `played-with-save-errors-focused.log`: full retained test output.

## Exact stop
Command:
```text
bunx vitest run src/test/postWithErrorSurface.test.ts src/test/composerTagging.test.tsx src/test/pf3cRoundWrites.test.tsx src/test/postPageGolf.test.tsx
```
52 executed: **50 passed, 2 failed**, four files (three passed, one failed), 7.48 seconds.

Both failures are in `src/test/postWithErrorSurface.test.ts`:
1. `Played with save errors > edit save sync error shows the same toast, tracks edit and reaches success` (75ms).
2. `Played with save errors > successful edit emits no failure toast or event` (15ms).

Tool's exact error and location:
```text
TypeError: supabase.from(...).select(...).eq is not a function
 ❯ src/features/post-v2/StageComposer.tsx:222:8
    220|       .from('posts')
    221|       .select('status, scheduled_at, visibility')
    222|       .eq('id', editPostId)
       |        ^
```
The newly written test's Supabase mock returns a Promise directly from `select`, whereas the existing edit-status read chains `eq` and `maybeSingle`. This is a fixture failure, not evidence of a real Supabase failure. Repairing that new fixture requires authorisation under the standing unexpected-failure stop rule. No rerun or assertion adjustment occurred.

## Four sequential shards
| Requested command | Outcome |
| --- | --- |
| `bunx vitest run --shard=1/4` | Not run: focused-test stop |
| `bunx vitest run --shard=2/4` | Not run: focused-test stop |
| `bunx vitest run --shard=3/4` | Not run: focused-test stop |
| `bunx vitest run --shard=4/4` | Not run: focused-test stop |

No full-suite executed or passing total is available for this request. Last complete passing suite from the supplied history: **9,301**. Before this request the expected inventory is **9,320** = 9,301 + six `overviewTypeScale.test.tsx` cases + thirteen `playedWithTags.test.tsx` cases from the two intervening briefs. After this request expected inventory is **9,329** = 9,320 + nine cases below. This is an expected inventory reconciliation, not a verified full-suite total; the prior two briefs did not complete all shards.

## Every existing test change
No existing test deleted, renamed, rewritten, or assertion changed. Only these two mock contracts changed, as expressly authorised in TESTS:
- `composerTagging.test.tsx:34`: `writePostWith: async () => []` → `writePostWith: async () => ({ saved: [], error: null })`. 12 cases before/after; all original assertions unchanged. Why: new return contract.
- `pf3cRoundWrites.test.tsx:8`: `writePostWith:async()=>[]` → `writePostWith:async()=>({saved:[],error:null})`. 13 cases before/after; all original assertions unchanged. Why: new return contract.

`postPageGolf.test.tsx` was run unchanged: 18 cases. No changes to Tour tests or the outstanding Tour spacing assertion.

## New test inventory: 0 → 9
All in `src/test/postWithErrorSurface.test.ts`:
1. `insert error returns saved [] and exact Supabase diagnostic fields` — passed; `expect(await writePostWith('post-1', 'me', ['a'])).toEqual({ saved: [], error: failure })`.
2. `submit failure still resolves the post, reports diagnostics and omits success names` — passed; result matches `{ kind: 'published', postId: 'post-1', playedWithNames: [] }`, exact eight-second toast and create event fields/count 3.
3. `media submit failure still starts uploading and omits unsaved names` — passed; result matches uploading/post-1/empty names; upload starts once; same create failure diagnostics.
4. `edit save sync error shows the same toast, tracks edit and reaches success` — FAILED before assertions; intended exact toast/event with mode edit/count 1, and absent composer submit footer after success.
5. `successful submit preserves saved names without a toast or failure event` — passed; names equal Thomas/Danny/Mike, no toast or track call.
6. `successful edit emits no failure toast or event` — FAILED before assertions; intended no toast and no post_with_write_failed event.
7. `sync returns the delete error first without attempting an insert` — passed; exact error returned, insert not called.
8. `sync returns the insert error after a successful delete` — passed; exact error returned and delete targets user_id/a.
9. `null code is omitted from toast and all nullable diagnostics stay null` — passed; exact unsuffixed Refused toast/duration 8000 and null code/details/hint event.

## Verification limits
- Harness: latest entry `build OK`, 2026-11-20T17:47:15Z. No manual build/typecheck run.
- Create publication/upload continuation checked with the real submit hook and mocked Supabase, not a real account.
- Empty success names verified through the submit result, not a rendered success-screen assertion. Edit mounted tests did not reach the save.
- Authenticated end-to-end checking is unavailable: this project's browser auth status is `external_unmanaged`. No credentials requested, session minted, SQL run, or real post created. Phone screenshots and real Supabase diagnostic capture remain unverified.