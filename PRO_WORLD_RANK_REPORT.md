# Pro world ranking — partial delivery, blocked sync

## Delivered
- `src/features/admin/components/AdminProWorldRanking.tsx`: one shared World ranking row, source and rank reads, empty/set/error states, Save via `admin_set_pro_owgr`, then Check now via `sync-pro-world-rankings` with `{ user_id }`; Change link; original RPC refusal text preserved.
- Mounted beside verified tour-pro rows in `AdminVerifiedCard.tsx`, outside their member-opening buttons.
- Mounted after pro facts in shared `VerificationsReview.tsx` for approved/accepted tour-pro requests with a requester ID. Both Inbox and Verifications use this detail body. Teaching pros/pending requests do not get the row.
- Local module header records shared read/save/check ownership. Existing pro flows preserved.

**Not operational end-to-end:** `sync-pro-world-rankings` was not created/deployed. Saving a link can persist it through Ben's existing RPC, but the subsequent Check now cannot succeed without the function. No claim that sync is shipped. No existing backend changes or schedule created.

## Source and data blocker
Exact public source fetched:
`https://www.owgr.com/playerprofile/mason-essam-31930`

HTTP 200, HTML, 165,609 bytes, plain User-Agent `clbhouz-rankings/1.0`, 15-second timeout. It identified Mason Essam, current rank **1436**, best rank **1354**, average points **0.0367**, total points **1.46860**, divisor **40**, actual events **39**. The embedded `__NEXT_DATA__` includes `props.pageProps.playerProfileData.playerProfileData.currentOWGRRank: 1436` and `lastOWGRRank: 1436`.

Neither saved HTML nor inspected player payload establishes the **ranking week's date**. “Download Player's Ranking History” has an empty initial link target. Follow-up public-script investigation did not establish a fetchable date/history source. **Season weekly ranks unavailable to this verified investigation, not proven absent from OWGR.** Never assign the fetch date/current Monday to an undated rank.

This is the standing stop condition for required data the source lacks: no speculative parser, mock rank/date pairing, undated history upsert or sync function was written. Saved research remains in `/tmp/owgr-research/` (temporary). The fetch is independent public research, **not** proof Ben has saved Mason's link or that a hosted history write/read works.

## Schedule convention (read-only)
Existing project documentation uses **pg_cron → net.http_post → Supabase Edge Function**. Concrete example: `verification-document-retention-purge`, daily 03:15 UTC, calls `verification-document-purge` with an `x-cron-secret` header backed by the function secret **CRON_SECRET**; companion orphan sweep is Sunday 03:45 UTC. Source: `docs/sql/verification_document_purge_cron.sql`.

This is a checked-in example, **not a live cron configuration audit**. Secret-name inventory does not list CRON_SECRET; do not assume that particular example is active/configured. The new brief explicitly permits the service role and caller-JWT `is_admin()` checks; its eventual no-body weekly call must authenticate accordingly, not inherit an unrelated purge secret silently. `SUPABASE_SERVICE_ROLE` is configured by name; no values read/reproduced.

`docs/ops/scheduled-job-result-blindness.md` warns that cron's successful HTTP dispatch does not prove the function succeeded. No scheduling SQL generated/executed, no schedule created, no secrets exposed. Weekly schedule instructions remain deferred until the sync source/date and function are complete.

## Verification and stop
Focused command:
`bunx vitest run src/test/proWorldRankAdmin.test.tsx src/test/proPolishAdmin.test.tsx src/test/proVerification1.test.tsx --maxWorkers=2`

**54/54 passed across 3 files**, including all four new admin tests. Existing `proPolishAdmin` has asynchronous act warnings, not failures; fixtures/assertions untouched.

Full-suite attempted command: `bunx vitest run --maxWorkers=2 --shard=1/4`.
- **Shard 1: 1,843 passed, 1 failed (1,844 total); 155 files passed, 1 failed.**
- Shards 2, 3, 4: **not run**, per stop instruction.

Exact known pre-existing failure:
```text
FAIL src/test/tourIsland.test.tsx > TourGlance > anchors left to the left island, not the right
AssertionError: expected '' to be 'min(346px, calc(100vw - 24px))' // Object.is equality
❯ src/test/tourIsland.test.tsx:235:30
expect(card.style.width).toBe('min(346px, calc(100vw - 24px))');
```
Complete output: `docs/verification/pro-world-rank/shard1.log`; focused output `focused.log` beside it.
Other previously documented failures untouched/not rerun: two `expRing1.test.tsx:31` border assertions (`expected '' to be 'none'`); 17 `ws3WatchBottom.test.tsx` missing `DARK_HAIRLINE` mock-export failures (EXP_RING_1_REPORT.md).

Latest preview status: **build OK** 2026-11-05T22:03:02Z; no manual build/typecheck. Authenticated hosted admin Save/Check/readback not verified; no user data writes used for tests. Parser/function tests not added because their required dated source remains blocked.

## Test ledger
- Prior expected inventory **7,046 / 623**, not full-suite verified (last confirmed green **7,024 / 620**).
- Added `proWorldRankAdmin.test.tsx`, four tests: empty link Save→check (exact pro payload); set rank/date + change; saved error; original RPC refusal and no check on refusal.
- New expected inventory **7,050 / 624**, not full-suite verified.
- No existing tests renamed, deleted or rewritten; **no old→new assertion changes**. Test dates/rank in the set-state case are explicit synthetic RPC fixtures, not claimed real ranking-week data.

No SQL, migrations, feed_config, round_pool_cap, native/Median, guest browsing, review wizard, news or round-plot edits.