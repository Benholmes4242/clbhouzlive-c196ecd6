# Brief 19 — geocode-played-clubs

Files: supabase/functions/geocode-played-clubs/index.ts, supabase/functions/geocode-played-clubs/rules.ts,
supabase/functions/_shared/pickGolfResult.ts, supabase/config.toml (verify_jwt = false), src/test/geocodePlayedClubs.test.ts (new, 8 tests).
Types already contained golf_clubs.geocode_attempted_at; no types change needed. No SQL, no migration, no admin UI change.

Response: { processed, located, noMatch, errors, remaining }. One summary log line per run.
Auth: x-internal-secret via requireInternalSecret, else is_admin RPC; anything else 403 (verified live: no-auth POST -> 403).
Coordinates: written only on a match, with update ... .is('latitude', null).is('longitude', null); existing coordinates cannot be overwritten.
HTTP error/timeout stamps nothing; first 429 ends the run.
Deployed: POST https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/geocode-played-clubs

| Shard | Files | Tests |
|---|---|---|
| 1/4 | 226 | 2,507 |
| 2/4 | 226 | 2,502 |
| 3/4 | 226 | 2,610 |
| 4/4 | 223 | 2,824 |
| Total | 901 | 10,443 |

Delta vs 10,435/900: +8 tests / +1 file, all from src/test/geocodePlayedClubs.test.ts. No existing test edited; no timeouts or retries.

## Brief 19b — reply immediately, background batch with time budget

- `handler.ts` (new): `createHandler` — auth synchronous (403 unchanged); authorised calls get `202 {"started":true}` and the batch runs through `EdgeRuntime.waitUntil`.
- `rules.ts`: `TIME_BUDGET_MS = 100_000`, `shouldStartNext(elapsedMs, processed)` (false past 100,000 ms or at 40).
- `index.ts`: Nominatim timeout 10 s → 8 s; one summary line `processed located noMatch errors remaining workListMs elapsedMs stopReason` (done|cap|budget|rateLimited|emptyWorkList); first httpError per run logged once (`status=N` or `Name: message`). Write rules unchanged.
- Tests: new `src/test/geocodePlayedClubsBudget.test.ts` (5). Existing 8 unedited, green.

| Shard | Files | Tests |
|---|---|---|
| 1/4 | 226 | 2,507 |
| 2/4 | 226 | 2,502 |
| 3/4 | 226 | 2,610 |
| 4/4 | 224 | 2,829 |
| **Total** | **902** | **10,448** |

Delta vs 10,443 / 901: +5 tests, +1 file, all from geocodePlayedClubsBudget.test.ts. No timeouts, no reruns.

Live verification: redeployed. Unauthenticated call → 403. The admin manual call could not be made from the agent (no admin session/token available on this external backend), so no 202 or summary line is quoted; workListMs not yet measured. The 08:36 log line (`processed=40 located=0 noMatch=0 errors=40 remaining=397`) is from the previous version.
