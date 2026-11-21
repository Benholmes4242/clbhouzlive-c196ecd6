# Live board tee availability and leaders’ course time

## Changes
- `src/features/tourhub/components/overview-v3/HybridHeroBands/LiveHeroBoard.tsx:9–10,71–83`: retain requested round for the tee read; show its tee header/cells only on `isSuccess` with at least one parseable tee time. Pending, empty, invalid-only and failed reads use `{ today: false, nextTee: null, thruLive: false }`. The existing THRU column remains, exactly as that specified layout requires; no placeholders or other column changes.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup.tsx:4–5,27,34,61,69–70`: optional zone forwarded to content; use the canonical `venueTee` day/time, retaining device formatting without a zone.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx:518`: pass `live.zone`, the same value passed to LiveHeroBoard.
- `src/test/liveBoardTeeAndZone.test.tsx`: ten new cases listed below. No existing tests/assertions deleted, renamed or rewritten.
- `roadmap.md:3–6`: completion and count reconciliation; this report and full logs added.

## New tests and inventory reconciliation
Baseline: **9,650 tests / 858 files**. After: **9,660 tests / 859 files**, all passing. Delta: **+10 tests / +1 file**, entirely `src/test/liveBoardTeeAndZone.test.tsx`:

1. Line 60: `between rounds with an empty successful tee read has no R4 TEE header or tee cells`
2. Line 65: `keeps the no-tee layout until the next-round read settles successfully`
3. Line 69: `a successful read with only invalid tee times has no tee column`
4. Line 73: `tee times arriving add the R4 TEE header and course-time cells`
5. Line 82: `a failed tee read hides the column even when cached tee times remain`
6. Line 86: `leaders with America/New_York and a 16:00 UTC tee read Tees off Sat 11:00`
7. Line 90: `leaders without a zone preserve today’s device-time day and time`
8. Line 94: `leaders take both weekday and time from the course zone across midnight`
9. Line 99: `the tee-times section renders nothing without groups`
10. Line 103: `HeroBoardBand passes the live board’s course zone to the leaders group`

No existing assertion needs updating: existing next-tee layout-helper tests describe the requested layout, not a rendered tee column with an empty read; existing device-time checks omit the new optional zone.

## Verification
Focused command: `./node_modules/.bin/vitest run src/test/liveBoardTeeAndZone.test.tsx src/test/tourLiveStates.test.tsx src/test/cb58LeadersGroup.test.tsx` — **106/106**, three files.

Each full-suite command ran separately, sequentially:

| Command | Tests | Files | Full output |
|---|---:|---:|---|
| `./node_modules/.bin/vitest run --shard=1/4` | 2,377/2,377 | 215 | `shard-1.log` |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,341/2,341 | 215 | `shard-2.log` |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,419/2,419 | 215 | `shard-3.log` |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,523/2,523 | 214 | `shard-4.log` |
| **Total** | **9,660/9,660** | **859** | |

Compared with the prior 2,377 / 2,341 / 2,419 / 2,513 totals, only shard 4 gains ten cases. Adding one file redistributes file boundaries to 215 / 215 / 215 / 214; total gains one file. No unexpected failures or count differences.

`LiveFirstTees` already filters invalid times and returns null with no valid groups (`LiveOverviewSections.tsx:72–73`); it remains unchanged and is exercised by the empty-section regression.

Latest harness signal: `build OK`, 2026-11-21T22:05:33Z. No SQL, migrations, feed_config or round_pool_cap changes.

Verification uses real rendered components with controlled read fixtures and real English provider. The arrival flow rerenders and reads back the header/time; the band test checks board/group agreement. Live hosted data, browser captures and physical-device checks were not performed or claimed. Focused output includes a non-failing React act warning from the band test; retained verbatim.