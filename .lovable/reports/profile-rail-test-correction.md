# Authorised profile rail test correction

Changed only `src/test/heroConnectExample.test.tsx:188` in the case `supplies both movements and five approved round figures`.

Old assertion: `expect(Array.from(tiles ?? []).map((tile) => tile.firstElementChild?.textContent)).toEqual(['86', '91', '84', '88', '90']);`

New assertion: `expect(Array.from(tiles ?? []).map((tile) => tile.querySelector('.profile-form-gross')?.textContent)).toEqual(['90', '88', '84', '91', '86']);`

Reason: the signed-off rendered rail is newest first. User separately authorised the gross-score selector because the first child now contains score and differential together. Data assertions remain exactly `[86, 91, 84, 88, 90]` and `[3.5, 5.4, -0.2, 0.8, 1.2]`. Existing `data-example-form-tile` retained on all five rail items. No production changes or other test changes in this follow-up. No cases deleted, renamed or added; one existing assertion rewritten as authorised.

## Full suite
Before **8,954**; after **8,954**, delta **0**, **776 files**. All passed, no failures or skipped tests.

Four separate sequential commands:
- `npx vitest run --maxWorkers=2 --shard=1/4`: **2,276** passed.
- `npx vitest run --maxWorkers=2 --shard=2/4`: **2,176** passed.
- `npx vitest run --maxWorkers=2 --shard=3/4`: **2,240** passed.
- `npx vitest run --maxWorkers=2 --shard=4/4`: **2,262** passed.

Logs: `/tmp/profile-rail-correction-shard1.log` through `shard4.log`. Preview signal: `build OK` 2026-11-16T09:34:16Z.

This resolves the specific stop reported in profile-index-and-form-stop.md. Original profile browser width checks and requested new geometry/deep-link tests were not performed/added in this explicitly limited follow-up; no claim of full original-brief verification. Authenticated checks remain unavailable for external_unmanaged backend.

No SQL, migration, feed_config, round_pool_cap or server changes.