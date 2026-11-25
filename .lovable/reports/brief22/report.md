# Brief 22 — second geocoding pass

- A/B/C: `4f982af941` (one commit: `_shared/geocodeGolfSecondPass.ts`, batch/index wiring, `src/test/brief22SecondPass.test.ts`, 10 tests).
- Places `name`: case-insensitive substring of the place name; requires `categories`; punctuation must match. The second pass sends the longest distinctive token and checks every token locally. limit=500, no offset paging.
- Anchor: region → type=county then type=state; no region → type=state then type=country; cached per (region, sub_country) per run.
- Deployed geocode-played-clubs; not triggered.

## Shards (STOPPED)
| Shard | Result |
|---|---|
| 1/4 | 2,520/2,520, 231 files |
| 2/4 | 2,544/2,544, 231 files |
| 3/4 | 2,728/2,729 — STOP: `brief18EyebrowInk.test.tsx` "every Part 1 eyebrow declaration computes to rgb(248, 250, 252)" → Test timed out in 15000ms (ran 19,108ms) |
| 4/4 | not run |

No SQL, no migration.
