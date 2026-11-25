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

## Brief 19c — Nominatim → Photon (golf-course search)

- `_shared/geocodeGolfClub.ts` (new): Photon GET `q={name} {sub_country}&osm_tag=leisure:golf_course&limit=5&lang=en`, UA `clbhouz/1.0 (https://www.clbhouz.co.uk)`, 8 s timeout (AbortController). `pickPhotonGolf`: leisure/golf_course only, first whose state/county/country equals sub_country (trimmed, case-insensitive), coords from `[lng, lat]`, no town fallback. Result: match | noMatch | httpError{status|message} | blocked{403/429}.
- `_shared/pickGolfResult.ts` deleted (no importers remain).
- `geocode-played-clubs`: loop moved to `batch.ts` (injected I/O); `blocked` ends the run, stamps nothing, logs `stopReason=blocked status=N`. 202/waitUntil, 100 s/40 budget, null-only coordinate writes, stamp rules and 30-day window unchanged.
- `geocode-club`: logic in `handler.ts`; uses geocodeGolfClub; same `{latitude, longitude, cached}` / 404 / 502 shapes. Coordinate write is now conditional on both being null (previously unconditional, per brief). No client change.
- Attribution "Locations © OpenStreetMap contributors" (9.5px, A.FAINT, 400, nowrap, ellipsis): CoursesMapSection under the legend when the plot shows; WhereItIs under the map when `osmAttribution` is set — CourseAboutTab sets it when the course row lacks its own latitude/longitude (i.e. coords came from the club fallback).

### Test edits
- `src/test/geocodePlayedClubs.test.ts:2` import `pickGolfResult` → `pickPhotonGolf`.
- `:5-6` Nominatim `town`/`golf` fixtures → Photon `feat()` builder.
- `:8-21` the four `pickGolfResult` cases (golf wins over town; display_name contains sub_country; otherwise null; empty null) → four `pickPhotonGolf` cases (state match; country match; other state no match; non-golf ignored + empty list no match). The other 4 tests in the file are unchanged; file stays at 8 tests.
- New `src/test/geocodeGolfClub.test.ts` (6): 403/429 blocked, 500 httpError, timeout httpError, batch blocked stops and stamps nothing, geocode-club match → `{latitude, longitude, cached:false}`.

| Shard | Files | Tests |
|---|---|---|
| 1/4 | 226 | 2,507 |
| 2/4 | 226 | 2,502 |
| 3/4 | 226 | 2,610 |
| 4/4 | 225 | 2,835 |
| **Total** | **903** | **10,454** |

Delta vs 10,448 / 902: +6 tests, +1 file (geocodeGolfClub.test.ts). No timeouts, no reruns.

### Deploy / verify
Both functions deployed. The agent cannot read INTERNAL_FN_SECRET or hold an admin session, so no authenticated run was made and no summary line is quoted — Ben to trigger. Photon answered HTTP 200 to the same query shape from the sandbox (not from the edge runtime).

### Captures (fixture with real components, removed)
`c-map-390.png`, `c-map-320.png`, `c-where-390.png`, `c-where-320.png`. Attribution line scrollWidth = clientWidth at both widths; document width = viewport (no overflow).

## Brief 19d — Geoapify geocoder

- `_shared/geocodeGolfClub.ts`: Geoapify `/v1/geocode/search` (text "{name}, {sub_country}", format=json, limit=5, lang=en, apiKey from GEOAPIFY_API_KEY via URLSearchParams); 8 s timeout and User-Agent kept; 401/403/429 → blocked, other non-2xx → httpError; missing key → httpError 'GEOAPIFY_API_KEY not set'. `pickGeoapifyGolf` (name contains golf + state/county/country = sub_country; exact name preferred; finite lat/lon) replaces `pickPhotonGolf`; `photonUrl` deleted.
- `geocode-played-clubs`: work list = played clubs not attempted in 30 days missing coordinates, town, or region (region only where geo_regions has an active row for sub_country); missing-coordinates first, then members, then oldest attempt. On match: coordinates only where both null; region = county then state via geo_resolve then geo_region_aliases, written to golf_clubs and every golf_courses row of the club where null; town = city where null; 5 km haversine guard when coordinates pre-existed (`far` log line). Summary adds regionFilled, townFilled, farSkipped. Stamping/budget/blocked/202 unchanged.
- `geocode-club`: coordinates only, response shapes unchanged.
- Types: `golf_clubs.town` was already present in `src/integrations/supabase/types.ts` (regenerated from Ben's column); no edit needed.
- Attribution: in-app line unchanged. Geoapify's free plan requires a credit link on the clbhouz website — Ben to add.

### Test edits
- geocodePlayedClubs.test.ts:2-3 imports `pickPhotonGolf` → `pickGeoapifyGolf`, plus `resolveRegion`, `withinGuard`.
- :5-6 Photon `feat` fixture → Geoapify `res` fixture.
- :8-24 four pickPhotonGolf cases → five pickGeoapifyGolf cases (exact name, first in state, other state excluded, non-golf excluded, empty).
- :29 club fixture gains `town: 'Sevenoaks'` (new ClubRow shape; keeps the coordinate-only assertions meaning what they did).
- :48+ new: 5 region rules, 3 work-list, 2 distance guard.
- geocodeGolfClub.test.ts:11-15 calls pass explicit key `'k'`; added 401 blocked and missing-key httpError. :19 timeout passes `'k'`. :23 ClubRow gains `town: null`. :43 match result gains county/state/city.

### Shards
| Shard | Files | Tests |
|---|---|---|
| 1/4 | 226 | 2,507 |
| 2/4 | 226 | 2,502 |
| 3/4 | 226 | 2,621 |
| 4/4 | 225 | 2,837 |
| **Total** | **903** | **10,467** |

Delta vs 10,454 / 903: +13 tests, 0 files (geocodePlayedClubs +11: pick 4→5, +5 region, +3 work list, +2 distance; geocodeGolfClub +2: 401, missing key). No timeouts, no reruns. Both functions deployed; Ben triggers the live run.

## Brief 19e — distinctive matching, region consistency and town selection

### Rule and checked reach
Future lookups must locate the named golf club, not an unrelated golf result in the same country; town must use the first acceptable locality. Existing coordinates and non-null town/region are not repaired or overwritten.

| Place read | Outcome |
|---|---|
| `_shared/geocodeGolfClub.ts` | Both functions now share bracket removal, Golf Club suffix when absent, ten-result query, name/address_line1 fallback, first distinctive token (accent/case insensitive), and exact-name-first ordering. No distinctive tokens means noMatch. |
| `geocode-played-clubs/index.ts`, `batch.ts`, `rules.ts` | Candidate acceptance resolves county then state via the existing RPC/alias helper before any coordinate write. Existing-region mismatch rejects and tries the next candidate; unresolved regions remain acceptable. Summary includes `regionMismatch` (rejected-candidate count). Existing worklist, retry, caps, stamping, null-only writes and 5 km guard remain. |
| `geocode-club/index.ts`, `handler.ts` | Inherits the shared query/matching improvement. Coordinate-only, existing-coordinate cache and response shapes remain; the brief scopes region consistency to the played-clubs job. |
| `src/hooks/useCourseCoordinates.ts`, `CourseAboutTab.tsx:83` | Course About map fallback and its nearby-business coordinates invoke geocode-club; no independent Geoapify selection. Existing course coordinates are preserved. |
| `GolfDataLens.tsx:232-241` | Admin Health's Find a club's location invokes geocode-club; inherits matching, no client change. |
| Database-function source search | No Geoapify/geocode-club/geocode-played-clubs matching implementation found in checked repository SQL files. No SQL executed or written; live database function definitions not inspected. |

The geocode-club header mentions Home Club Weather, but repository caller search found no active weather invocation of this function; that historical comment is not treated as a verified live flow. No other Geoapify production matcher was found. Permissions, settings, schedules, attribution, feed_config and round_pool_cap were not changed.

Town selection is suburb → city → village, rejecting values containing Greater, starting London Borough, or equalling county/state/country (case-insensitive), then removing trailing Town. Selected town travels in the existing internal `city` field to preserve caller shape. No acceptable value yields null. Local ownership is documented in the geocoder/rules headers; root AGENTS.md was left unchanged at its size limit.

### Exact test edits and additions
No existing test was deleted, renamed, rewritten or had an assertion changed. Existing fixtures remain unchanged. Only these existing test files were extended:
- `src/test/geocodePlayedClubs.test.ts:2`: import `pickGeoapifyGolf, type GeoapifyResult` → `pickGeoapifyGolf, geoapifyUrl, geoapifyTown, type GeoapifyResult`; exposes query/locality rules for assertions.
- `src/test/geocodePlayedClubs.test.ts:25-82`: no cases → twelve new cases below (19 → 31 tests).
- `src/test/geocodeGolfClub.test.ts:36-69`: no helper/cases → injected regionBatch fixture plus three new cases below (8 → 11 tests).

| File:line | New case (old: absent) | Concrete new assertion | Why |
|---|---|---|---|
| geocodePlayedClubs.test.ts:25 | Brocket Hall rejects the three unrelated England results | `pickGeoapifyGolf(...).toBeNull()` | Verified Berrington/Lees/Mottram results must not match Brocket. |
| :32 | Ferndown matches and strips Town from the preferred suburb | `?.city).toBe('Ferndown')` | Verified suburb and suffix rule. |
| :37 | Gleneagles Scotland matches address_line1 after the Ohio results | `toEqual({ lat: 56.28, lng: -3.75, state: 'Scotland', county: 'Perth and Kinross', city: null })` | Missing name fallback, wrong-state exclusions. |
| :45 | East Sussex National prefers Uckfield over Wealden and Little Horsted | `?.city).toBe('Uckfield')` | Verified locality order. |
| :50 | Chelsfield Lakes uses Halstead rather than Greater London | `?.city).toBe('Halstead')` | Verified suburb. |
| :55 | a club with no distinctive token cannot match | `pickGeoapifyGolf(...).toBeNull()` | The Golf Club must not match. |
| :58 | distinctive tokens ignore accents, case and bracketed parts | `?.lat).toBe(50)` | Accented Hardelot token matches HARDELOT. |
| :65 | Ferndown query appends Golf Club with limit ten | `p.get('text')).toBe('Ferndown Golf Club, England')`; `p.get('limit')).toBe('10')` | Required query name and limit. |
| :70 | Hardelot query removes the bracketed course without another golf suffix | `get('text')).toBe("Golf d'Hardelot, France")` | Required bracket cleanup. |
| :74 | Greater and London Borough values fall through to village | `geoapifyTown(...)).toBe('Halstead')` | Both rejected prefixes permit village fallback. |
| :77 | county state and country values are not towns | `geoapifyTown(...)).toBeNull()` | Case-insensitive administrative-value rejection. |
| :80 | city is preferred to village when suburb is absent | `geoapifyTown(...)).toBe('Uckfield')` | Required second/third locality priority. |
| geocodeGolfClub.test.ts:51 | Hertfordshire rejects a candidate resolving to Merseyside before any coordinate write | `regionMismatch).toBe(1)`; `noMatch).toBe(1)`; `writeCoords).not.toHaveBeenCalled()`; `stamp).toHaveBeenCalledTimes(1)`; `logs.at(-1)).toContain('regionMismatch=1')` | Rejection before writes, noMatch stamp and summary evidence. |
| :59 | a region mismatch tries the next candidate | `regionMismatch).toBe(1)`; `located).toBe(1)`; `writeCoords).toHaveBeenCalledWith('b', { latitude: 52, longitude: -0.2 })` | Batch → real shared request wrapper → candidate validation → next-result write verified with injected I/O. |
| :65 | an unresolved candidate region is not rejected | `regionMismatch).toBe(0)`; `writeCoords).toHaveBeenCalledWith('b', { latitude: 51, longitude: -0.2 })` | No canonical resolution does not reject. |

Verified-response names/locality fields are taken from Ben's brief; numeric fixture coordinates are synthetic and no fixture writes reach the database. All pre-existing assertions, counts and fixtures are retained.

### Four sequential shards
Each was its own command, run once, in order:
`bunx vitest run --shard=N/4 --maxWorkers=2 --minWorkers=1` for N = 1, 2, 3, 4.
Complete stdout/stderr retained outside the repository in `/tmp/brief19e-shards/shard1.log` through `shard4.log`.

| Shard | Files passed | Tests passed |
|---|---:|---:|
| 1/4 | 226 | 2,507 |
| 2/4 | 226 | 2,502 |
| 3/4 | 226 | 2,633 |
| 4/4 | 225 | 2,840 |
| **Full suite** | **903** | **10,482** |

Before 10,467 / 903 → after 10,482 / 903: **+15 tests / 0 files**, reconciled by the twelve named new geocodePlayedClubs cases and three named new geocodeGolfClub cases above. All executed tests passed; no assertion failure, worker timeout or retry. Preview diagnostics reported build OK; `git diff --check` passed.

### Deployment and limits
Both functions deployed successfully:
- geocode-played-clubs source SHA-256 `dcd23cce544f4c0838dc85410168e1cfa713c2a44cc2ee5512871ae7351985db`.
- geocode-club source SHA-256 `a5022334dda0b9bf1dbe4d05315b7c1b7ff552714419becb4bb0d792321a9ba3`.

No authenticated production batch was invoked and no live Geoapify response or database-write result is claimed. Injected end-to-end matching/rejection/write tests passed; Ben's next authorised run supplies live summary evidence. Already-stored incorrect coordinates (including Brocket Hall) were not corrected by this forward-only change. No temporary app pages/files were created.
