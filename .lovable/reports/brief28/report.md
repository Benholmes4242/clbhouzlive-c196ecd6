# Brief 28 — geocoding test mode, missed towns, wrong pins, national fallback

- A probe: `5bd395edd2` (probe.ts, handler). Builds only with `4a827bc9da` (shared helpers).
- B–E: `4a827bc9da`. Tests: `8c049235b3`.
- F: deployed `geocode-played-clubs` only, 2026-11-25T20:18:19Z. Not triggered, nothing scheduled.

New run-summary fields: `wrongPinCleared`, `regionCorrected`, `coursesFilled` (log line also `regionCorrected club=<id> from=<old> to=<new>`, `wrongPinCleared club=<id>`).

Existing test changed: `brief22SecondPass.test.ts` "a candidate whose county resolves to another stored region is rejected"
- old: `expect(r.kind).toBe('noMatch');`
- new: `expect(r).toMatchObject({ kind: 'match', national: true });`
- why: D2 retries nation-anchored without the stored-region guard; the regional pass still rejects.

Shards: 2,533/232; 2,544/232; 2,749/232; 2,822/232 = 10,648/928 vs 10,636/927 (+12/+1, all in new `brief28Geocode.test.ts`). No SQL, no migration.
