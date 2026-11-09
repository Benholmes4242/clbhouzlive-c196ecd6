# Upcoming on the completed rhythm — baseline checkpoint

## Status

Not implemented yet. No application files or tests changed.
The user resolved the mock/brief figure-size difference in favour of **15px / 700**.

## Fresh before-change tests

Each command ran separately, one at a time:

| Command | Passed | Failed |
|---|---:|---:|
| `bunx vitest run --shard=1/4 --maxWorkers=2` | 2,084 | 0 |
| `bunx vitest run --shard=2/4 --maxWorkers=2` | 1,907 | 0 |
| `bunx vitest run --shard=3/4 --maxWorkers=2` | 2,053 | 0 |
| `bunx vitest run --shard=4/4 --maxWorkers=2` | 1,954 | 0 |
| **Total** | **7,998** | **0** |

This exactly matches the last reported baseline. Test inventory delta: zero.
No tests deleted, renamed, rewritten or added. Logs: `/tmp/upcoming-rhythm/before-{1,2,3,4}.log`.

## Measurements

Before/after measurements are not verified. The temporary browser fixture failed
at `UpcomingCourse` with the browser's exact message:

`useNavigate() may be used only in the context of a <Router> component.`

The fixture did supply MemoryRouter, but its direct dependency import and the
application's Vite-resolved router have different module identities. This is a
fixture failure, not an observed application error. No application code was
changed for this check. Earlier fixture errors were `createRoot is not a function`
and `Page.wait_for_function: Timeout 30000ms exceeded.` No screenshots or gap
measurements are claimed.

## Remaining work

- Share the completed heading/cell rhythm with upcoming THE EVENT and LAST YEAR.
- Apply board TOT type (15px / 700), 4px label gap, and completed cell padding.
- Remove additional upcoming section seam spacing, preserving course content.
- Use the shared board colour helper for completed figures and top-three scores.
- Add the requested tests and document any updated assertions.
- Obtain 390px before/after gap measurements on both page fixtures.
- Run focused tests and four fresh after-change shards, separately.

No SQL, migration, RPC/edge-function, guest, review-wizard, news, round-plot,
feed_config, round_pool_cap or native/Median changes were made.