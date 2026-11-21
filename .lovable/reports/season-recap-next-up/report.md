# Season recap Next up — implementation and stopped verification

## Result and height ruling
Implemented the three-day automatic recap roll-on for all five overview tours, the loaded-event Next up card, season-over sentence and number-only tied Most wins. Recap points and the final-event line are removed from the photo; points remain in THE POINTS LIST. No SQL, migrations, feed_config changes, new fetches or changes to the body ordering/card list.

Ben's 21 November 20:36 UTC ruling supersedes the brief's fixed-height description: **keep today's growing height**. The footer follows the sentence inside the existing content block. PhotoBand's existing content positioning, title/kicker/sentence styling, top clearance and growing layout are unchanged. The mock's 470px photo and its approximate typography/buttons were not adopted. GLASS_CARD has different material, so the exact signed-off translucent footer material uses recap-only CSS and semantic global colour tokens instead.

## Stop: exact error
Command: `./node_modules/.bin/vitest run --shard=1/4`
Full output: `.lovable/reports/season-recap-next-up/shard-1.log`.

```text
FAIL src/test/tourOverviewHeroFixes.test.tsx > Tour overview hero fixes > the overview 53-day kicker reads STARTS 14 JAN and excludes FIRST TEE
AssertionError: expected 'Champions · Starts 14 JAN' to be 'Champions · STARTS 14 JAN' // Object.is equality
Expected: "Champions · STARTS 14 JAN"
Received: "Champions · Starts 14 JAN"
❯ src/test/tourOverviewHeroFixes.test.tsx:68:86
Test Files 1 failed | 214 passed (215)
Tests 1 failed | 2376 passed (2377)
```

This is the same prior Tour overview hero stop, not a new recap test failure. The failing assertion and its component/locale copy are untouched. No rerun, repairs, further shards or browser captures followed the failure.

## Verification and inventory
Focused command:
`./node_modules/.bin/vitest run src/test/seasonRecapNextUp.test.tsx src/test/seasonRecap.test.tsx src/test/seasonRecapPgaStandings.test.ts`

**58 / 58 passed, 3 files**: 22 new Next up cases, 31 existing recap cases, 5 existing PGA standings cases. Full output: `focused.log` in the report directory.

| Shard | Command | Tests | Files |
|---|---|---|---|
| 1 | `./node_modules/.bin/vitest run --shard=1/4` | 2,376 passed / 1 failed; 2,377 executed | 214 passed / 1 failed; 215 executed |
| 2 | Not run: stop | — | — |
| 3 | Not run: stop | — | — |
| 4 | Not run: stop | — | — |

Before inventory: **9,624 tests / 856 files**, the landed Tour overview hero brief's expected inventory (9,611 / 855 last fully passing + 13 Tour overview hero cases / 1 file). That prior 9,624 inventory was not a full passing result.
After expected inventory: **9,646 tests / 857 files**, exactly **+22 cases / +1 file**, all in `src/test/seasonRecapNextUp.test.tsx`. The full suite has not passed or been fully executed this turn. No tests deleted; four existing case names renamed below, with no count change. `seasonRecap.test.tsx` stays 31 before and after. The earlier `tourOverviewHeroFixes.test.tsx` stays 13, unchanged.

Preview compilation: latest observed entry `build OK` at 2026-11-21T20:36:08Z. `git diff --check` passed. No manual build/typecheck was run.

## Changed files and lines
- `src/features/tourhub/components/overview-v3/seasonRecapRules.ts:8–9,23–25,137–139`: shared RESULTS_HANDOVER_DAYS, updated tour-agnostic header, tied Most wins has no small line. Other between-season and freshness rules untouched.
- `src/features/tourhub/components/overview-v3/OverviewHero.tsx:65,78–91,201–205,426`: retain earliest loaded upcoming tournament per recap tour; pass it and the existing shared minute clock into the recap. Recap decisions tick with that clock. Remove a non-null assertion in the touched recap selection.
- `src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:4–14,39,43–65,68–111`: prefix season-over copy, inert Next up card, null figure/place/date props, footer handoff. Body untouched.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:4,63–64,94,250`: optional React footer following the sentence, with no geometry/style change.
- `src/features/tourhub/components/overview-v3/recapNextUp.css:1–21`: exact recap-only card material/type/layout and wrapping event/place text; no font-family declaration.
- `src/index.css:65–70`: six semantic footer colour/material tokens.
- `src/locales/en/tourhub.json:290–291`: new seasonOver and nextUp keys; finalEvent and tiedPlayers retained.
- `src/locales/de/tourhub.json:123–126`, `es/tourhub.json:123–126`, `ja/tourhub.json:121–124`, `ko/tourhub.json:121–124`, `en-XA/tourhub.json:124–127`: same English fallback keys, other text retained.
- `src/test/seasonRecap.test.tsx:59–70,94–117,151–156`: authorised existing rule/assertion changes, exact diff below.
- `src/test/seasonRecapNextUp.test.tsx:1–145`: 22 new cases listed below.
- `roadmap.md:3–8`: task, height ruling, stop and remaining blockers.
- `.lovable/reports/season-recap-next-up/`: this report, full focused/shard-one logs and status.

Architecture ownership is documented in the recap headers. The root AGENTS.md save was refused by its 12,288-byte budget; no existing rule was condensed, moved or changed.

## New tests, resolved names (22)
1. shares the three-day results handover: day three is not between seasons, day four is
2. a next event ten days away suppresses a recap even thirty days after the last event
3. a final race allows the recap one day after the last event
4. January first hands back to any loaded next event
5. pga rolls from a six-day-old final to recap instead of its 54-day upcoming slide
6. lpga rolls from a six-day-old final to recap instead of its 54-day upcoming slide
7. euro rolls from a six-day-old final to recap instead of its 54-day upcoming slide
8. champ rolls from a six-day-old final to recap instead of its 54-day upcoming slide
9. pgad rolls from a six-day-old final to recap instead of its 54-day upcoming slide
10. a live slide still wins over its tour recap
11. the earliest loaded next event supplies the footer, not a later slide
12. the band has no recap points figure or final-event text
13. Champions starts with the season-over line and names the Charles Schwab Cup winner
14. without fresh standings the season-over line precedes fourteen winners across twenty-eight events
15. Next up uses the shared days countdown and event/date text
16. Next up uses the shared hours countdown and event/date text
17. Next up uses the shared minutes countdown and event/date text
18. with no loaded next event the band has no Next up card
19. Korn Ferry preserves the top-twenty card sentence after the season line
20. tied most wins has only six and MOST WINS with no players line
21. a sole most-wins leader keeps his surname
22. Next up is inert and its tap retains the band action

## Existing test authorisations — every affected name and reason
All are in `src/test/seasonRecap.test.tsx`, whose count is unchanged (31).
- **exports the constants**: `expect(RECAP_AFTER_DAYS).toBe(7)` → `expect(RECAP_AFTER_DAYS).toBe(3)`. Reason: expressly requested shared three-day boundary; 21-day assertion unchanged.
- **7+ days after the last event with nothing in 21 days → recap** → **3+ days after the last event with nothing in 21 days → recap** (rename only). Assertions unchanged: October 19 and November 9 against October 11 still expect true. Reason: case label must describe the new rule.
- **within 7 days and not final → no recap; final → recap** → **within 3 days and not final → no recap; final → recap**. Both assertions use `now: at('2026-10-15')` → `now: at('2026-10-13')`, retaining false for raceFinal false and true for raceFinal true. Reason: the old four-day input is now legitimately recap-eligible.
- **renders kicker, title, final-event place line, points figure and Korn Ferry sentence** → **renders kicker, title and Korn Ferry season-over sentence without final-event line or points figure**. Old `expect(band.textContent).toContain('Final event · The Federal Club · 8–11 Oct')` → `.not.toContain(...)`; old `expect(fig.textContent).toBe('2,221Steelman')` → `expect(container.querySelector('[data-overview-recap-figure]')).toBeNull()`; old sentence `Steelman topped the points list. The top 20 earned PGA TOUR cards for 2027.` → `The 2026 season is over. Steelman topped the points list. The top 20 earned PGA TOUR cards for 2027.`. Reason: brief expressly removes figure/final-event line and prefixes the season line. Kicker/title assertions unchanged.
- **sentence copy for euro**, **sentence copy for lpga**, **sentence copy for pga**, **sentence copy for champ**: old `.toBe(sentence)` → `.toBe(`The 2026 season is over. ${sentence}`)`. The four unchanged old sentence values are quoted in the diff below. Reason: prefix the season line while retaining each race/card sentence.
- **stale standings hide the figure and use the winners sentence**: old `.toBe('20 different winners across 25 events.')` → `.toBe('The 2026 season is over. 20 different winners across 25 events.')`. Reason: season prefix also applies without fresh standings; figure-null assertion unchanged.
- **facts row without a card line: MOST WINS with surname, or players on a tie** → **facts row without a card line: MOST WINS with surname, or number only on a tie**. Old `.toEqual({ key: 'mostWins', value: '2', small: '3 players' })` → `.toEqual({ key: 'mostWins', value: '2' })`. Reason: expressly remove tied-players line; sole surname expectation unchanged.

Exact old/new assertion and name diff:

```diff
diff --git a/src/test/seasonRecap.test.tsx b/src/test/seasonRecap.test.tsx
index 0489119cb0..41f3b2a97e 100644
--- a/src/test/seasonRecap.test.tsx
+++ b/src/test/seasonRecap.test.tsx
@@ -56,17 +56,17 @@ function wrap(node: React.ReactNode) {
 
 describe('between-seasons rule', () => {
   const at = (iso: string) => new Date(`${iso}T12:00:00Z`);
-  it('exports the constants', () => { expect(RECAP_AFTER_DAYS).toBe(7); expect(RECAP_NEXT_EVENT_WINDOW_DAYS).toBe(21); });
-  it('7+ days after the last event with nothing in 21 days → recap', () => {
+  it('exports the constants', () => { expect(RECAP_AFTER_DAYS).toBe(3); expect(RECAP_NEXT_EVENT_WINDOW_DAYS).toBe(21); });
+  it('3+ days after the last event with nothing in 21 days → recap', () => {
     expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: null, raceFinal: false, now: at('2026-10-19') })).toBe(true);
     expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: '2027-01-20', raceFinal: false, now: at('2026-11-09') })).toBe(true);
   });
   it('a next event within 21 days → no recap', () => {
     expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: '2026-11-20', raceFinal: true, now: at('2026-11-09') })).toBe(false);
   });
-  it('within 7 days and not final → no recap; final → recap', () => {
-    expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: null, raceFinal: false, now: at('2026-10-15') })).toBe(false);
-    expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: null, raceFinal: true, now: at('2026-10-15') })).toBe(true);
+  it('within 3 days and not final → no recap; final → recap', () => {
+    expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: null, raceFinal: false, now: at('2026-10-13') })).toBe(false);
+    expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: null, raceFinal: true, now: at('2026-10-13') })).toBe(true);
   });
   it('1 January with a loaded next event → upcoming; with none → recap stays', () => {
     expect(isBetweenSeasons({ lastEnd: '2026-10-11', seasonYear: 2026, nextStart: '2027-03-01', raceFinal: false, now: at('2027-01-01') })).toBe(false);
@@ -91,16 +91,15 @@ describe('between-seasons rule', () => {
 });
 
 describe('recap band', () => {
-  it('renders kicker, title, final-event place line, points figure and Korn Ferry sentence', () => {
+  it('renders kicker, title and Korn Ferry season-over sentence without final-event line or points figure', () => {
     const { container } = wrap(<RecapPhotoBand slide={slide('pgad')} state={results} data={kf()} onOpen={() => {}} />);
     const band = container.querySelector('[data-overview-photo-band]')!;
     expect(band.getAttribute('data-overview-photo-state')).toBe('recap');
     expect(band.textContent).toContain('KORN FERRY TOUR · 2026 SEASON');
     expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('The season in review');
-    expect(band.textContent).toContain('Final event · The Federal Club · 8–11 Oct');
-    const fig = container.querySelector('[data-overview-recap-figure]')!;
-    expect(fig.textContent).toBe('2,221Steelman');
-    expect(container.querySelector('[data-overview-photo-situation]')!.textContent).toBe('Steelman topped the points list. The top 20 earned PGA TOUR cards for 2027.');
+    expect(band.textContent).not.toContain('Final event · The Federal Club · 8–11 Oct');
+    expect(container.querySelector('[data-overview-recap-figure]')).toBeNull();
+    expect(container.querySelector('[data-overview-photo-situation]')?.textContent).toBe('The 2026 season is over. Steelman topped the points list. The top 20 earned PGA TOUR cards for 2027.');
   });
   it.each([
     ['euro', 'Steelman won the Race to Dubai.'],
@@ -109,12 +108,12 @@ describe('recap band', () => {
     ['champ', 'Steelman won the Charles Schwab Cup.'],
   ])('sentence copy for %s', (tour, sentence) => {
     const data = tour === 'euro' || tour === 'champ' ? kf({ cardLine: null }) : kf();
-    expect(recapSentence(tour as never, data, 2026, t).map((s) => s.text).join('')).toBe(sentence);
+    expect(recapSentence(tour as never, data, 2026, t).map((s) => s.text).join('')).toBe(`The 2026 season is over. ${sentence}`);
   });
   it('stale standings hide the figure and use the winners sentence', () => {
     const { container } = wrap(<RecapPhotoBand slide={slide('pgad')} state={results} data={stale(kf())} onOpen={() => {}} />);
     expect(container.querySelector('[data-overview-recap-figure]')).toBeNull();
-    expect(container.querySelector('[data-overview-photo-situation]')!.textContent).toBe('20 different winners across 25 events.');
+    expect(container.querySelector('[data-overview-photo-situation]')?.textContent).toBe('The 2026 season is over. 20 different winners across 25 events.');
   });
 });
 
@@ -149,11 +148,11 @@ describe('recap body', () => {
     const cells = [...container.querySelectorAll('[data-recap-fact]')].map((c) => [c.getAttribute('data-recap-fact'), c.querySelector('b')!.textContent]);
     expect(cells).toEqual([['events', '25'], ['winners', '20'], ['cards', '20'], ['youngest', '19']]);
   });
-  it('facts row without a card line: MOST WINS with surname, or players on a tie', () => {
+  it('facts row without a card line: MOST WINS with surname, or number only on a tie', () => {
     expect(recapFactCells({ events: 30, winners: 22, maxWins: 3, mostWinsSurname: 'Hojgaard', tiedLeaders: 1, cards: null, youngest: null, tiedLabel: (n) => `${n} players` }))
       .toEqual([{ key: 'events', value: '30' }, { key: 'winners', value: '22' }, { key: 'mostWins', value: '3', small: 'Hojgaard' }]);
     expect(recapFactCells({ events: 30, winners: 22, maxWins: 2, mostWinsSurname: null, tiedLeaders: 3, cards: null, youngest: null, tiedLabel: (n) => `${n} players` })[2])
-      .toEqual({ key: 'mostWins', value: '2', small: '3 players' });
+      .toEqual({ key: 'mostWins', value: '2' });
   });
   it('stale standings hide the board, card list and CARDS/YOUNGEST', () => {
     const { container } = wrap(<SeasonRecapBody tour="pgad" year={2026} data={stale(kf())} />);
```

## Captures and outstanding work
390px and 320px Champions fixture captures were **not taken**, because shard one triggered the mandated stop before the capture stage. No temporary fixture page was created. Actual browser fit, two-line event wrapping and top-island clearance remain visually unverified; focused tests do not establish these measurements.

Remaining work: a ruling on the earlier `tourOverviewHeroFixes.test.tsx:68:86` uppercase assertion, then the permitted verification continuation and 390/320 fixture captures. The height question is settled and does not block implementation.
