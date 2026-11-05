# OWGR events add-on — verified source, import blocked

## Public source and Mason result
Verified actual page-used GET:
`https://apiweb.owgr.com/api/owgr/playerprofile/getPlayerProfileEventsTable?playerId=31930&year=-1&countingEventsNumber=52`

HTTP **200**, top-level array of **39 counting events** for Mason Essam. One API request, ~0.28 seconds, 15-second timeout, User-Agent `clbhouz-rankings/1.0`, Accept application/json. Actual page scripts trace module 33839 through API constants 691 and GET helper 59095; not a guessed endpoint.

Latest three by source year/week:
1. Hulencourt Alps Tour Grand Final — **T31**, 2026 week 42, event ID 11624.
2. Memorial Giorgio Bordoni — **MC**, 2026 week 41, event ID 11609.
3. Hauts de France-Pas de Calais Open — **MC**, 2026 week 37, event ID 11561.

Fields supplied: `event`, `id`, `eventWeekId`, `tours`, `week`, `year`, `finish`, `rankPoints`, `weight`, `adjustedPoints`, `mbValue`, `mbPercentage`, `adjustedBonus`, `rankBefore`, `rankAfter`. Tours supply tour ID/name/fullName/code, currency ID and eligibility. `id` is the event identity, distinct from `eventWeekId`. Raw points are `rankPoints`; adjusted points are separate.

**Not supplied in this response:** event start/end dates, venue/country, to-par, round scores, official ranking-week date. Week/year do not establish actual event start/end dates. No dates or scores invented. Round imports would write none from this source. Season weekly ranking history is still not established.

Temporary evidence: `/tmp/owgr-research/mason31930-events-response.json`, `mason31930-event-sample.json`, headers and extracted page modules/chunks. This is a public source read, **not a hosted sync run**; Ben's saved link, existing member events and any merge execution were not read/written.

## Delivered scoped groundwork
- `supabase/functions/sync-pro-world-rankings/eventImportRules.ts`: pure import-target/round-protection/Sportradar-exclusion helpers only, with module ownership header. No entrypoint, request/auth handler or deployment.
- Repeated linked event chooses its existing identity; unlinked member event within three days chooses the same identity; multiple candidates fail rather than overwrite an arbitrary member event.
- Own `source='pro'` rounds excluded from import writes; absent rounds produce no writes; linked Sportradar identity suppresses event import.
- **These are planning helpers, not actual upserts.** Finish changes, conversion-in-place, preservation of attached hosted rounds and no-duplicates persistence are not end-to-end implemented or verified.

## Blockers and stop
Required dated source fields are missing from the confirmed response. `pro_events.start_date` is required and the three-day merge needs genuine start dates. Therefore no speculative `owgrParse.ts`, undated inserts, guessed week-derived start/end dates or deployed sync was created. The original ranking-date blocker remains.

Fresh shard 1 also stopped on the untouched, pre-existing Tour menu test:
```text
FAIL src/test/tourIsland.test.tsx > TourGlance > anchors left to the left island, not the right
AssertionError: expected '' to be 'min(346px, calc(100vw - 24px))' // Object.is equality
❯ src/test/tourIsland.test.tsx:235:30
expect(card.style.width).toBe('min(346px, calc(100vw - 24px))');
```
Other known untouched blockers not rerun: two `expRing1.test.tsx:31` border assertions (`expected '' to be 'none'`) and 17 `ws3WatchBottom.test.tsx` missing `DARK_HAIRLINE` mock-export failures.

## Tests and accounting
Focused: `bunx vitest run src/test/owgrEventImportRules.test.ts src/test/proWorldRankAdmin.test.tsx --maxWorkers=2` — **10/10 passed, 2 files**.
New `owgrEventImportRules.test.ts` has six cases: repeat identity with changed finish, three-day unlinked member target/boundary, ambiguous member match, member round protection, no source rounds, Sportradar-linked exclusion. All fixtures synthetic, not fabricated OWGR response schemas.

Full command attempted: `bunx vitest run --maxWorkers=2 --shard=1/4`.
- Shard 1: **1,845 passed, 1 failed, 1,846 total; 156 files passed, 1 failed.**
- Shards 2–4: **not run under stop rule**.
- Complete failure output retained: `docs/verification/pro-world-events/shard1.log`; focused log beside it.

Inventory before **expected 7,050 / 624**, after **expected 7,056 / 625**, +6 cases/+1 file by the named new file; full total not verified. Last confirmed green remains 7,024 / 620; intervening additions documented in prior reports. Shard allocation changed with the new file; +2 shard-1 cases is not the suite delta.
No existing tests deleted, renamed, rewritten or assertions changed. No parser/handler persistence tests claimed. Latest preview build log **build OK** 2026-11-05T22:09:39Z; no manual build/typecheck. No browser/hosted sync verification.

No SQL, migrations, schedule creation, existing edge deployment, feed_config, cap, native/Median, guest browsing, review wizard, news or round-plot changes.