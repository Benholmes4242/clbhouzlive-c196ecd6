# Three stopped-build ruling — remaining keyboard fixture stop

## Files changed
- `src/test/memberShotPosts.test.ts`: one authorized source substring assertion.
- `src/test/keyboardDismiss.test.tsx`: one authorized mock return field.
- `roadmap.md`, this report and four full command logs.

No application code changes. `ActorSheet` remains unchanged. `activeRing.test.tsx`, `ms1MessagesHeadToHead.test.tsx`, `reviewGridScores.test.tsx` and `fullscreenStackAndUploadWhite.test.tsx` remain unchanged. The previously authorized Friend fixture correction was already present.

## Exact changes, old → new

### memberShotPosts.test.ts:155
Case: `synthetic fullscreen slides never mount the post_views tracker or post-keyed likers`.

```text
expect(src('src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx')).toContain('{!syntheticPosts && <div style={{ pointerEvents:');
→
expect(src('src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx')).toContain('{!syntheticPosts && likeState.count > 0 && <div style={{ pointerEvents:');
```

Why: explicitly authorized to preserve the synthetic gate assertion while matching the new positive-like wrapper. Every other line in the file is unchanged.

### keyboardDismiss.test.tsx:12
Mock only:
```text
useComposerActor: () => ({ activeActor: h.actor, selectActor: h.noop, applyDraftActor: h.noop })
→
useComposerActor: () => ({ activeActor: h.actor, availableActors: [], selectActor: h.noop, applyDraftActor: h.noop })
```

Why: exact fixture-only addition authorized by clause 5. All eleven case names and all assertions remain unchanged. No other line in this file changed.

### reviewGridScores.test.tsx
Already present, no edit in this ruling: `displayName: 'Friend'` → `name: 'Friend'`, authorized by clause 4. All seven cases pass in the new standalone command.

No cases deleted, renamed or replaced. Test inventory before/after this ruling: **9,373 expected → 9,373 expected**, delta zero. Last complete verified full pass: **9,352**, reconciled by +3 `fullscreenStackAndUploadWhite`, +7 `reviewGridScores`, +11 `keyboardDismiss` = expected 9,373. This request does not verify a complete suite total.

## Commands and results, in requested order

| Exact command | Executed | Passed | Failed | Output |
| --- | ---: | ---: | ---: | --- |
| `bunx vitest run src/test/activeRing.test.tsx` | 28 | 28 | 0 | active-ring.log |
| `bunx vitest run src/test/fullscreenStackAndUploadWhite.test.tsx` | 3 | 3 | 0 | fullscreen-stack.log |
| `bunx vitest run src/test/reviewGridScores.test.tsx` | 7 | 7 | 0 | review-grid.log |
| `bunx vitest run src/test/keyboardDismiss.test.tsx` | 11 | 10 | 1 | keyboard-dismiss.log |
| `bunx vitest run src/test/memberShotPosts.test.ts` | Not run | — | — | Stopped at keyboard failure |
| `bunx vitest run --shard=1/4` | Not run | — | — | Stopped |
| `bunx vitest run --shard=2/4` | Not run | — | — | Stopped |
| `bunx vitest run --shard=3/4` | Not run | — | — | Stopped |
| `bunx vitest run --shard=4/4` | Not run | — | — | Stopped |

Standalone aggregate: **49 executed / 48 passed / 1 failed**, not a full-suite run. ActiveRing passes all 28 unchanged, so no rail HTML capture or timing edits are needed under clause 2. The ms1MessagesHeadToHead timeout exception was not exercised because the shards were not reached.

## Remaining error, verbatim

```text
FAIL src/test/keyboardDismiss.test.tsx > wizard keyboard dismissal > (f) both real wizard shells show the shared pill while typing
TypeError: Cannot read properties of undefined (reading 'map')
❯ ActorSheet src/features/post-v2/components/ActorSheet.tsx:21:24
  {availableActors.map(a => {
```

The fixture correction was applied exactly, but the remaining reader is different:
```text
ActorSheet.tsx:18: const { availableActors } = useActiveActor();
keyboardDismiss.test.tsx:9: useActiveActor: () => ({ activeActor: h.actor })
```
StageComposer consumes only activeActor/selectActor/applyDraftActor from useComposerActor and does not pass availableActors to ActorSheet. Adding it to the authorized mock therefore cannot satisfy ActorSheet's separate context read. Case (f) still fails during mounting, before any assertion or the review iteration.

Stopped without adding an app-side safeguard, changing the useActiveActor mock, repairing another fixture, rerunning, or starting subsequent commands. The next needed ruling is permission to add `availableActors: []` to the **useActiveActor** mock in this new test file; it was not the mock named in this ruling.

Preview harness: **2026-11-20T19:44:34Z — build OK**. No manual build/typecheck. No SQL, migration files, feed_config or round_pool_cap changes. No browser/device or authenticated claims; this was test-only work, and the earlier physical-device checks remain unverified.