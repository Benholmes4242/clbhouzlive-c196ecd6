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
