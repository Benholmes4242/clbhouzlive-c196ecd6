# RULING — keyboardDismiss.test.tsx (f), resolved

## Change (fixture only)
src/test/keyboardDismiss.test.tsx line 9:
- old: `vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: h.actor }) }));`
- new: `vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: h.actor, availableActors: [] }) }));`
Line 12 (useComposerActor with availableActors: []) kept. No app change; no ActorSheet safeguard. No assertion changed.

## Focused run (focused.log)
`bunx vitest run src/test/fullscreenStackAndUploadWhite.test.tsx src/test/reviewGridScores.test.tsx src/test/keyboardDismiss.test.tsx src/test/memberShotPosts.test.ts`
4 files, 36/36 passed (3 + 7 + 11 + 15). Case (f) passed.

## Full suite (one run, sequential)
| Command | Passed | Failed | Files | Log |
|---|---|---|---|---|
| `bunx vitest run --shard=1/4` | 2,290 | 0 | 209 | shard-1.log |
| `bunx vitest run --shard=2/4` | 2,277 | 0 | 209 | shard-2.log |
| `bunx vitest run --shard=3/4` | 2,351 | 0 | 209 | shard-3.log |
| `bunx vitest run --shard=4/4` | 2,455 | 0 | 209 | shard-4.log |
| **Total** | **9,373** | **0** | **836** | |

Reconciliation: 9,352 (last full pass) + 3 fullscreenStackAndUploadWhite + 7 reviewGridScores + 11 keyboardDismiss = 9,373. Matches expected.
ms1MessagesHeadToHead did not time out in this run.
