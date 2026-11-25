# Brief 30 — stopped at focused verification

## Implemented, not deployed

- Shared town selection now ranks city/town/village within 5km before address fields, then suburb/hamlet. The original five-category circle/proximity request and limit 20 remain; code calculates distance.
- Match paths with an address locality now use that same selection instead of immediately accepting the address. Stored-pin reverse paths use the same selection.
- Compass/district-only labels are excluded case-insensitively. Existing nonempty towns are not resolved or written; the conditional town write also accepts an empty string.
- Read-only probe adds `town_step` and `distance_km`. Address selection has null distance because an address field supplies no settlement coordinates; no choice has null step/distance.
- Local ownership/order is documented in the shared helper header, respecting AGENTS.md's requirement that module-local architecture belongs beside its module.

## Stop: exact failures

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

Cause: the pre-existing `geoapifyPlaceName` exclusion `/district|borough|council/i` matches the **borough** substring in **Hildenborough**. Brief 30 A5 explicitly requires Hildenborough while A1 retains the existing exclusions. No assertion was weakened and no post-failure source fix was applied. Awaiting a ruling to make the borough exclusion match a standalone administrative word rather than legitimate names containing it.

Full focused output: `/root/shards30/focused.log`.

## Existing test changed

`src/test/brief28Geocode.test.ts`, **“no town from the first reverse makes one type=city request”**:
- Old: `expect(seen).toHaveLength(2)`.
- New: `expect(seen).toHaveLength(3)`.
- Why: A1 requires the nearby settlement request even when the city reverse request returns a usable address. The existing `expect(seen[1]).toContain('type=city')` and the Ballybunion town assertion remain unchanged; this case passed.

No existing test was deleted or renamed. Eleven new cases are in `src/test/brief30Geocode.test.ts`: the four specified examples, secondary fallback, nearest-primary response ordering, ten-label exclusions, match-path wiring, existing-town preservation, empty-string filling and probe step/distance.

## Full-suite accounting and deployment

- Latest accepted baseline: **10,664 tests / 929 files**.
- Inventory after edits: **930 files**, +1 (`brief30Geocode.test.ts`, 11 cases). Expected full population **10,675 / 930**, +11/+1; this is inventory arithmetic, not an executed full-suite result.
- Shards 1/4, 2/4, 3/4, 4/4: **not started**, because the focused failure requires stopping.
- Latest observed preview build log: **build OK**, 2026-11-25T21:23:10Z. No manual build/typecheck was run.
- Deployment: **not performed**; no deploy time. No live probe, batch, database write, trigger or schedule was performed.
- No SQL was run and no migration or migration file was written. `feed_config` and `round_pool_cap` were untouched.

The stopped-state commit is the commit containing this report; its hash is reported in chat.