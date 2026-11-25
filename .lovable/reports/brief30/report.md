# Brief 30 — close-out

## Implemented and deployed

- Shared town selection now ranks city/town/village within 5km before address fields, then suburb/hamlet. The original five-category circle/proximity request and limit 20 remain; code calculates distance.
- Match paths with an address locality now use that same selection instead of immediately accepting the address. Stored-pin reverse paths use the same selection.
- Compass/district-only labels are excluded case-insensitively. Existing nonempty towns are not resolved or written; the conditional town write also accepts an empty string.
- Read-only probe adds `town_step` and `distance_km`. Address selection has null distance because an address field supplies no settlement coordinates; no choice has null step/distance.
- Local ownership/order is documented in the shared helper header, respecting AGENTS.md's requirement that module-local architecture belongs beside its module.
- Administrative exclusions now use `/\b(district|borough|council)\b/i`. Peterborough, Hildenborough, Scarborough, Loughborough, Marlborough, Farnborough and Gainsborough remain valid; Tonbridge and Malling Borough, Sevenoaks District and London Borough of Bromley remain excluded.

## Commits

- `3178beb0af`: original Brief 30 implementation, eleven new tests, the existing request-count assertion change, and the initial stop report.
- `90c2c3a6cf`: authorised whole-word exclusion and one additional Peterborough/administrative-name test; no existing assertion changed in this continuation.
- Close-out report and roadmap: the final commit containing this update (hash supplied in the closing reply).

## Initial stop: exact failures (resolved by the authorised source fix)

Command:

```text
bunx vitest run src/test/brief30Geocode.test.ts src/test/brief29Geocode.test.ts src/test/brief28Geocode.test.ts src/test/brief22SecondPass.test.ts src/test/geocodeGolfClub.test.ts src/test/geocodePlayedClubs.test.ts --maxWorkers=1 --no-file-parallelism
```

**95 executed: 92 passed, 3 failed; 5 passing files / 1 failing file (6 total).** No retry occurred.

1. `src/test/brief30Geocode.test.ts:25:15`, **“Nizels chooses Hildenborough at 2km over the council-like address city”**:
   `AssertionError: expected { kind: 'town', place: null, …(4) } to match object { town: 'Hildenborough', townStep: 1 }`
   Expected `town: 'Hildenborough', townStep: 1`; received `town: 'Tonbridge and Malling', townStep: 2`.
2. `src/test/brief30Geocode.test.ts:80:23`, **“match path checks nearby settlements even when the match supplies an address city”**:
   `AssertionError: expected "spy" to be called with arguments: [ …(2) ]`
   Expected town write `'Hildenborough'`; received `'Tonbridge and Malling'`.
3. `src/test/brief30Geocode.test.ts:101:32`, **“probe exposes selected step and distance for an address-bearing match without writes”**:
   `AssertionError: expected { Object (requests, nearby, ...) } to match object { would_choose: 'Hildenborough', …(1) }`
   Expected `would_choose: 'Hildenborough', town_step: 1`; received `would_choose: 'Tonbridge and Malling', town_step: 2`.

Cause: the pre-existing `geoapifyPlaceName` exclusion `/district|borough|council/i` matched the **borough** substring in **Hildenborough**. Work stopped. Ben subsequently authorised whole-word matching for all three administrative words plus one new test. That source fix resolved all three failures with their assertions unchanged; the fresh focused run passed 96/96. No unexpected failure occurred in the four subsequent sequential shards.

Full focused output: `/root/shards30/focused.log`.

## Existing test changed

`src/test/brief28Geocode.test.ts`, **“no town from the first reverse makes one type=city request”**:
- Old: `expect(seen).toHaveLength(2)`.
- New: `expect(seen).toHaveLength(3)`.
- Why: A1 requires the nearby settlement request even when the city reverse request returns a usable address. The existing `expect(seen[1]).toContain('type=city')` and the Ballybunion town assertion remain unchanged; this case passed.

This is the only existing test changed across Brief 30. No existing test was deleted or renamed; no existing assertion changed after the whole-word ruling.

## Added tests: exact reconciliation

`src/test/brief30Geocode.test.ts` adds **12 cases / 1 file** (eleven in `3178beb0af`, one in `90c2c3a6cf`):

1. keeps Peterborough and compound settlement names but excludes whole-word administrative labels
2. Nizels chooses Hildenborough at 2km over the council-like address city
3. Ballybunion beats a closer suburb and address parish on the reverse path
4. no settlement within 5km and address Northeast gives no town
5. London keeps address Richmond ahead of a nearby suburb when there is no primary settlement
6. falls back to the nearest hamlet only after both primary settlements and address fail
7. distance in code chooses the nearest primary rather than response order
8. rejects all ten compass or district labels in mixed case but preserves real compound names
9. match path checks nearby settlements even when the match supplies an address city
10. never changes or resolves an existing town
11. fills an empty-string town
12. probe exposes selected step and distance for an address-bearing match without writes

## Shared-path audit

Rule: real settlement names must not be rejected merely because they contain an administrative word; standalone district/borough/council labels must still be excluded.

Code read: `_shared/geocodeGolfClub.ts` first-pass address fields; `_shared/geocodeGolfSecondPass.ts` second-pass fields, nearby primary/secondary settlements and reverse/address fallbacks; `geocode-played-clubs/batch.ts` matched and stored-pin town paths; `geocode-played-clubs/index.ts` production wiring and conditional town writes; `geocode-played-clubs/probe.ts` read-only selection; `geocode-club/index.ts` on-demand course/weather fallback. All town-selection paths share `geoapifyPlaceName`; no duplicate exclusion needed changing. The on-demand function persists coordinates only, not towns, so it was not redeployed. Existing nonempty towns remain untouched. No database function was executed or altered.

## Full-suite accounting and deployment

- Latest accepted baseline: **10,664 tests / 929 files**.
- Fresh focused command: the command above, **96 tests / 6 files passed**; log `/root/shards30/focused-authorised.log`.
- Shard command for each N, in order, reading each result before starting the next: `bunx vitest run --shard=N/4 --maxWorkers=1 --no-file-parallelism --reporter=dot`.

| Shard | Passing / executed tests | Passing / executed files |
| --- | ---: | ---: |
| 1/4 | 2,549 / 2,549 | 233 / 233 |
| 2/4 | 2,556 / 2,556 | 233 / 233 |
| 3/4 | 2,754 / 2,754 | 233 / 233 |
| 4/4 | 2,817 / 2,817 | 231 / 231 |
| Total | **10,676 / 10,676** | **930 / 930** |

- Full-suite delta: **+12 tests / +1 file**, entirely the twelve named cases above; the one existing assertion change does not change population. No tests were lost. Shard logs: `/root/shards30/shard1.log` through `shard4.log`.
- Last available preview build signal from the authorised source-edit turn: **build OK**, 2026-11-25T21:27:11Z. The observability mount was unavailable during close-out, so no newer build signal is claimed. No manual build/typecheck was run.
- Successfully deployed **geocode-played-clubs only**; completion recorded at **2026-11-25T22:04:27Z** (UTC timestamp taken after the deployment tool confirmed success).
- Submitted source SHA-256: `e5f7aa5776e292434b27bd9612e45a7c29e7b653e00803d05f36cabed208ba34`.
- No live probe, batch, database write, trigger or schedule was performed. Deployment success is verified; live lookup/write behaviour is not claimed.
- No SQL was run and no migration or migration file was written. `feed_config` and `round_pool_cap` were untouched.