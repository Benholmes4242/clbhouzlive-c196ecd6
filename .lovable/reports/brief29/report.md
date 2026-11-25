# Brief 29 close-out

## Parts and commits

- **A — Region anchor:** `6d8e70e200`. Region requests are untyped, use `limit=5`, and select the first `county` or `state`; city-only answers provide no region anchor. Nation anchors remain typed state then country.
- **B — Resorts:** `e71f63a5bb`. `SAME_PLACE_KM` changed from 2 to 5; 3km qualifies and 20km does not.
- **C — Place-suffixed names:** source/logging `f427bbad94`; authorized new-test correction `3267257532`. Places uses the first non-weak distinctive token, with longest-token fallback. Rule 2 runs only when rule 1 has no qualifying candidate; the matched rule is logged and returned for the probe.
- **D — Sharper first pass:** `55196a41ca`. Region is included in forward text and GB/IE/US countrycode filters are applied as specified.
- **E — Nearby towns:** `3b1e5cba45`. After both reverse lookups fail, populated places within 5km are distance-ranked, preferring city/town/village over suburb/hamlet and applying the existing exclusions. Townless first/second-pass matches use the same lookup.
- **F — Probe:** `adc9aa4298`. The read-only probe reports the chosen anchor, picker rule, nearby-town request and choice, including townless matched coordinates.
- **G — Deploy:** deployment only, no separate source commit. Only `geocode-played-clubs` was deployed; deploy completion was recorded at **2026-11-25T21:11:03Z**. Source SHA-256: `be6b1863944aa472fe6743c5c2de3e348b7f47200f0977828e6ab9149ed3f02f`. It was not triggered or scheduled, and no live probe or database write was performed.

## Existing tests and authorized correction

- No existing test assertion was changed and no test was deleted or renamed.
- `src/test/brief22SecondPass.test.ts` fixture changed from `{ place_id: 'ANCHOR' }` to `{ place_id: 'ANCHOR', result_type: 'state' }`, because A1 now requires a county/state result type. Assertions are unchanged.
- No existing test was pinned to 2km, so B1 required no old assertion update.
- During focused development, the new `src/test/brief29Geocode.test.ts` test **“Old Thorns rejects other Old places but accepts one containing thorns”** failed because exact “Old Thorns” qualifies under rule 1. Work stopped and the failure was reported. Ben authorized changing only its new assertion: **old** `expect(pickSecondPass([...oldPlaces, { name: 'Old Thorns', lat: 51.3, lon: 0.3 }], 'Old Thorns')).toMatchObject({ lat: 51.3, pickerRule: 2 })`; **new** `expect(pickSecondPass([...oldPlaces, { name: 'Old Thorns', lat: 51.3, lon: 0.3 }], 'Old Thorns')).toMatchObject({ lat: 51.3, pickerRule: 1 })`. Source remained unchanged.
- The other half of C3 was already present and remains unchanged in that same test: `expect(pickSecondPass(oldPlaces, 'Old Thorns')).toBeNull()`, where `oldPlaces` contains “Old Course” and “Old Hall”. Neither rule can qualify because both distinctive tokens are absent from every candidate; in particular, no candidate contains “thorns”.

## Verification

- Typecheck: `oj typecheck -b --noEmit` passed.
- Focused geocoding suite: **89 tests / 6 files passed**.
- Shard 1/4: **2,549 tests / 233 files passed**.
- Shard 2/4: **2,556 tests / 233 files passed**.
- Shard 3/4: **2,748 tests / 233 files passed**.
- Shard 4/4: **2,811 tests / 230 files passed**.
- Total: **10,664 tests / 929 files**, against Brief 28's **10,648 / 928**: **+16 tests / +1 file**, all from `src/test/brief29Geocode.test.ts`.
- Shard logs: `/root/shards29/`.
- Latest build log entry: build OK.

No SQL was run and no migration or migration file was written. `feed_config` and `round_pool_cap` were untouched.
