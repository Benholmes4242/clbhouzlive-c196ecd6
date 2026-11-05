# OWGR_UNBLOCK — STOP

## Result and source evidence
Ben's Monday-only ranking-date ruling and undated-event permission implemented in the new `sync-pro-world-rankings` entrypoint, parser and run helpers. No SQL, migrations, scheduling, other deployed-function edits, feed_config, cap, native/Median or protected-area changes.

**Not complete:** focused checks stopped on two further, unauthorized Explore assertion failures. No deployment, real Check now or shards after failure. Rank/parser checks pass, but hosted persistence is not verified.

Confirmed public page-used JSON sources:
- `https://apiweb.owgr.com/api/owgr/playerprofile/getPlayerProfileSummary?playerId=31930`: HTTP200, current1436, previous1436, total points1.4686023561587804. Light public summary replaces HTML for runtime reads. Monday UTC of this run is2026-11-02; previous2026-10-26. Dates are Ben's authorized convention, not OWGR payload dates.
- `https://apiweb.owgr.com/api/owgr/playerprofile/getPlayerProfileEventsTable?playerId=31930&year=-1&countingEventsNumber=52`:39 counting events, latest T31/MC/MC, ids/year/week/rankBefore/rankAfter/raw rankPoints.
- `https://apiweb.owgr.com/api/owgr/events/getEvent?eventId=11624`: actual event dates2026-10-15–2026-10-17, countryBelgium,48 results, scheduledRoundsCount3, isCurtailedtrue. Mason31930 result gross rounds71/75/73, sum219. No venue, par, explicit to-par or total-strokes field.

API routes are present in saved page constants; event source researched by a read-only agent and verified in the saved JSON. Evidence under `/tmp/owgr-research`; real rank/events/detail fixtures retained in `src/test/fixtures/owgr`.

## Remaining source limitation
`pro_event_rounds` stores `to_par`, not gross strokes. OWGR `resultScores.score` provides gross71/75/73 with no par. Writing them as to_par would corrupt scores. Parser retains gross-round evidence but returns no writeable rounds/to_par, and venue=null. Dates/country may import; no fabricated score conversion or venue. This portion awaits a source or a ruling, not a guess.

Season weekly rank history remains unverified; counting-event rankBefore/rankAfter is supplied for Ben's revised season-movement/best-rank RPC. No week/year-derived ranking-history rows.

## Implementation
- `owgrParse.ts`: current/prior rank, clean not-ranked/layout errors, UTC Mondays, normalized finishes,39-event fields, actual detail dates/country; gross scores never treated as to-par.
- `runSync.ts`: verified-tour-pro filtering, per-pro failure isolation, service/admin auth predicate.
- `index.ts`: JWT validation plus caller `is_admin()`, service-role allowance, strict optional UUID body, paged source/profile reads,1-second paced15-second public requests, once-per-event run cache, current Monday upsert/prior ignoreDuplicates, per-pro last_error, checked/updated/failed and warnings.
- Events: real-date3-day identity merge through existing helper, undated events never merge, possible same-name own rows warned, member rounds protected, Sportradar-linked pros skipped for event imports.
- `eventImportRules.ts`: start_date nullable, undated no-merge guard; all six original cases unchanged.
- New `src/test/owgrParse.test.ts`:18 cases and three saved real public fixtures.

Service secret names checked, no values exposed; SUPABASE_SERVICE_ROLE exists. Entry uses built-in SUPABASE_SERVICE_ROLE_KEY with that configured fallback. No new secret requested. Deployment/authenticated Mason link/readback not attempted after test stop.

## Exact authorized test-only edits
1. `src/test/tourIsland.test.tsx`: old `expect(card.style.width).toBe('min(346px, calc(100vw - 24px))');`; new lines244–245:
   - `expect(TOUR_GLANCE_CARD_WIDTH).toBe('min(346px, calc(100vw - 24px))');`
   - `expect(glanceShellSpy.mock.lastCall?.[0].cardStyle.width).toBe(TOUR_GLANCE_CARD_WIDTH);`
   Added lines11–18 wrapping the real GlanceShell in a prop spy, preserving positioning/lifecycle and every other assertion. `TourGlance.tsx` exports the same width literal and passes the constant to cardStyle; presentation value unchanged.
2. `src/test/expRing1.test.tsx:31`: old `expect(inner?.style.border).toBe('none');`; new `expect(inner?.style.borderWidth).not.toBe('2px');`. Parameterized active=false/true cases both use that line. No other assertion changed.
3. `src/test/ws3WatchBottom.test.tsx:58`: old `vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span data-stub="avatar" /> }));`; new `vi.mock('@/components/ui/SquircleAvatar', async (orig) => ({ ...(await orig<typeof import('@/components/ui/SquircleAvatar')>()), SquircleAvatar: () => <span data-stub="avatar" /> }));`. Full real exports preserved; type annotation only adds inference. No assertion changed.

No tests deleted or renamed. No existing cases rewritten beyond those authorized assertion lines. Fixture addition is the one GlanceShell spy and partial-avatar mock; existing six import-planning cases unchanged.

## Focused result and STOP
Command:
`bunx vitest run src/test/owgrParse.test.ts src/test/owgrEventImportRules.test.ts src/test/proWorldRankAdmin.test.tsx src/test/tourIsland.test.tsx src/test/expRing1.test.tsx src/test/ws3WatchBottom.test.tsx --maxWorkers=2`

**84 passed /2 failed /86 executed, six files.** Full output retained at `docs/verification/owgr-unblock/focused.log`.
- OWGR parser18/18; import rules6/6; admin4/4; Tour14/14; Watch41/41; Explore1/3.

Both failures are unchanged `src/test/expRing1.test.tsx:35:40`, active=false/true:
```text
AssertionError: expected 'rgba(255,255,255,0.22)' to be 'rgba(255, 255, 255, 0.22)' // Object.is equality
Expected: "rgba(255, 255, 255, 0.22)"
Received: "rgba(255,255,255,0.22)"
expect(overlay?.style.borderColor).toBe(DARK_HAIRLINE.split(',').join(', '));
```
They are newly exposed after the authorized border assertion fix, not authorized for repair. No product styling or assertion changed to bypass them.

Preview compiler flagged `owgrParse.ts(27,70): error TS2550: Property 'hasOwn' does not exist on type 'ObjectConstructor'. Do you need to change your target library? Try changing the 'lib' compiler option to 'es2022' or later.` Replaced it with identical `Object.prototype.hasOwnProperty.call` for target compatibility; no test assertions changed or tests rerun after stop. Updated preview status checked separately.

## Counts and four shards
Inventory before this continuation: expected7,072/626 (includes preceding FS_NOTCH_1 +16/+1); after expected **7,090/627**, solely new owgrParse18/+1. Last full green7,024/620. Intervening deltas: EXP_RING3/+1, Tour15/+1, TopTen4/+1, rank admin4/+1, events6/+1, FS_NOTCH16/+1, current parser18/+1 = +66/+7. Expected inventory, not executed-suite total.

Shard1: not run. Shard2: not run. Shard3: not run. Shard4: not run. Stop prevents pass-count claims.

Previously reported Tour width, Explore border-none, Watch missing-DARK_HAIRLINE failures now pass their authorized paths. Three existing FS_NOTCH_1 failures remain untouched (fsNotch1:37 wrong backdrop selector; fullscreenBand:65 exact floating point; fullscreenBand:75 synthetic threshold contradiction), and would block a full suite too; report/log retained.

## Mason Check now
Not run, not deployed, no rank/history/event-count/date/round persistence claimed. Hosted project auth external/unmanaged; no admin session available to browser tooling. Ben's saved Mason link not read. Public39-event source count is not an imported count. No request asking for credentials and no guest mint.