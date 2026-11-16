# Tour finished week — verification record

Shared finished chart, more-player row, four week figures, euro/pgad picks exclusions and completed member-card removal were saved in maintenance checkpoint 8c07925dd7. This records preceding runner evidence, not a rerun after the profile stop.

Full suite: 8,978 passed / 8,978 executed, 777 files; baseline 8,954 → +24. Commands were four separate sequential `npx vitest run --maxWorkers=2 --shard=1/4` through `--shard=4/4`. Split: 2,284 / 2,196 / 2,237 / 2,261. No failures/skips.

Added cases: completedWeekFacts +10 (cumulative/date-independent geometry, ties, four eliminated statuses, incomplete drop, three rounds, missing chart, more-player tap); tournamentPickInsights +5 (two disabled tour entrypoints, three lifecycle states); picksEnabledForTour +9 (pga/euro/lpga/champ/pgad/liv/other/uppercase EURO/PGAD). All existing replacements are one-for-one; zero deletions.

Gate sites: HeroBoardBand predictions/readiness/pick tee reads and card ids; PicksBlock and PickMemberBands outer mount guards; PicksSheet, YourPickSheet and OurRecordSheet mount guards; useOurPickRecord/useBeatTheModel/useMyPickOdds query guards; record tour list; RecapOurRecord; TournamentPage pick state, prediction read, pick ids and picks section; LiveBoard prediction read/pick ids; PlayerPage next-event predictions and pick action; HeroSection next-event pick door. Player next-event start-date read and tournament field reads remain for non-pick content. Records remain per-selected-tour, with disabled tours neither fetched nor selectable; no unsupported all-tour aggregate recomputation.

Browser: actual CompletedWeekBlock fixtures at 320/375/430 for DP World, PGA, playoff flag, second-place ties and three rounds; no overflow and end labels contained; more-row callback fired. RecapCardList actual component at all widths: left/right edges flush, equal inter-column gaps, no overflow. Public overview had zero completed blocks at inspection. Fixtures do not verify real selected-event wiring or authenticated PGA member pick results. Playoff fixture flag does not create a real tied playoff board. Full-player label lanes compressed long surnames to fit. Hole row remains existing build, including uppercase BEST and existing trophy colour, not the mock's frozen differences.

Screenshot exposed default button flex overriding the more-row grid. Presentation-only specificity correction is saved with profile follow-up, but not browser-reverified after its stop.

## Existing case replacements (exact old/new assertion inventory)
The following diff quotes every changed assertion, including unchanged context case names. Reasons: four approved week figures replace six; chart replaces path markup; new detail line replaces two-line week cells; completed viewer cards are absent; excluded tours leave record chips/recap; intrinsic spaced recap columns replace equal tracks. No other test assertions changed.

```diff
diff --git a/src/test/completedWeekFacts.test.tsx b/src/test/completedWeekFacts.test.tsx
index 711e47e1f1..1e9ae70635 100644
--- a/src/test/completedWeekFacts.test.tsx
+++ b/src/test/completedWeekFacts.test.tsx
@@ -1,8 +1,8 @@
-import { describe, expect, it } from 'vitest';
+import { describe, expect, it, vi } from 'vitest';
 import { readFileSync } from 'node:fs';
-import { render } from '@testing-library/react';
+import { fireEvent, render } from '@testing-library/react';
 
-import { holeTypeCells, holeTypeHeading, pathCells, weekCells, topThreeRows, championScoreLabel, type WeekFacts } from '@/features/tourhub/tournament-v2/data/weekFactsRules';
+import { holeTypeCells, holeTypeHeading, pathCells, wonChart, weekCells, topThreeRows, championScoreLabel, type WeekFacts } from '@/features/tourhub/tournament-v2/data/weekFactsRules';
 import { championNarrative } from '@/features/tourhub/tournament-v2/data/tournamentRules';
 import { CompletedWeekBlock } from '@/features/tourhub/tournament-v2/sections/CompletedWeekBlock';
 import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
@@ -86,22 +86,16 @@ describe('completed state — HOLE TYPE', () => {
 });
 
 describe('completed state — THE WEEK', () => {
-  const week = (f: WeekFacts) => weekCells(f).map((c) => [c.pos ? `${c.pos} ${c.value}` : c.value, c.label]);
-  it('WWT six cells in order', () => {
-    expect(week(WWT)).toEqual([
-      ['63', 'LOW · 5 PLAYERS'], ['30', 'BIRDIES · KIM'], ['69.7', 'AVG · PAR 72'],
-      ['−5', 'CUT · 75 MADE IT'], ['4th +0.22', 'HARDEST'], ['1st −0.73', 'EASIEST'],
-    ]);
-    expect(weekCells(WWT).find((c) => c.key === 'cut')?.under).toBe(true);
+  const week = (f: WeekFacts) => weekCells(f).map((c) => [c.value, c.label, c.detail]);
+  it('WWT four figures in order', () => {
+    expect(week(WWT)).toEqual([['63', 'Low round', '5 players'], ['30', 'Most birdies', 'Kim'], ['+0.22', 'Hardest', '4th hole'], ['−0.73', 'Easiest', '1st hole']]);
+    expect(weekCells(WWT).map(c => c.key)).toEqual(['low', 'birdies', 'hardest', 'easiest']);
   });
-  it('Abu Dhabi: no cut becomes FIELD', () => {
-    expect(week(ABU)).toEqual([
-      ['62', 'LOW · LAPORTA'], ['29', 'BIRDIES · MCILROY'], ['70.3', 'AVG · PAR 72'],
-      ['70', 'FIELD · NO CUT'], ['9th +0.16', 'HARDEST'], ['2nd −0.54', 'EASIEST'],
-    ]);
+  it('Abu Dhabi omits field and average even without a cut', () => {
+    expect(week(ABU)).toEqual([['62', 'Low round', 'Laporta'], ['29', 'Most birdies', 'McIlroy'], ['+0.16', 'Hardest', '9th hole'], ['−0.54', 'Easiest', '2nd hole']]);
   });
   it('missing hole statistics drop HARDEST and EASIEST', () => {
-    expect(weekCells({ ...WWT, hardest: null, easiest: null }).map((c) => c.key)).toEqual(['low', 'birdies', 'avg', 'cut']);
+    expect(weekCells({ ...WWT, hardest: null, easiest: null }).map((c) => c.key)).toEqual(['low', 'birdies']);
   });
   it('sub-lines starting with a word start with a capital', () => {
     const labels = [WWT, ABU].flatMap((f) => [...pathCells(f), ...(holeTypeCells(f) ?? []), ...weekCells(f)].map((c) => c.label));
@@ -126,10 +120,10 @@ describe('completed state — THE TOP THREE and PLAYOFF', () => {
   });
   it('the block renders the four sections', () => {
     const { container } = render(<CompletedWeekBlock facts={WWT} rows={[row('brown', 'Blades Brown', 1, false, -23, -9)]} onFullBoard={() => {}} />);
-    expect(container.querySelectorAll('[data-cw-section="path"] [data-cw-cell]')).toHaveLength(4);
+    expect(container.querySelectorAll('[data-cw-section="path"] circle')).toHaveLength(4);
     expect(container.querySelectorAll('[data-cw-section="holes"] [data-cw-cell]')).toHaveLength(3);
     expect(container.querySelectorAll('[data-cw-top-row]')).toHaveLength(1);
-    expect(container.querySelectorAll('[data-cw-section="week"] [data-cw-cell]')).toHaveLength(6);
+    expect(container.querySelectorAll('[data-cw-section="week"] [data-cw-cell]')).toHaveLength(4);
     expect(container.querySelector('[data-hero-full-leaderboard]')).not.toBeNull();
   });
   it('both pages render the same block through the one hook', () => {
@@ -152,11 +146,10 @@ describe('championNarrative — no repeated final round', () => {
 });
 
 describe('two-line completed figures', () => {
-  it('contains no separate sub-line or 11.5px style', () => {
+  it('hole cells retain two lines while week cells have the supplied detail', () => {
     const { container } = render(<CompletedWeekBlock facts={WWT} rows={[]} />);
-    expect(container.querySelectorAll('[data-cw-cell] em')).toHaveLength(0);
-    expect(readFileSync('src/features/tourhub/tournament-v2/sections/completedWeek.css', 'utf8')).not.toContain('11.5px');
-    for (const cell of container.querySelectorAll('[data-cw-cell]')) expect(cell.children).toHaveLength(2);
+    for (const cell of container.querySelectorAll('[data-cw-section="holes"] [data-cw-cell]')) expect(cell.children).toHaveLength(2);
+    expect(container.querySelectorAll('[data-cw-section="week"] em')).toHaveLength(4);
   });
   it('uses the shared score helper for negative, even and positive top-three values', async () => {
     const { getScoreColor } = await import('@/features/tourhub/_shared/scoreColor');
@@ -167,3 +160,49 @@ describe('two-line completed figures', () => {
     }
   });
 });
+
+
+describe('finished week chart', () => {
+  const field = () => [row('brown', 'Blades Brown', 1, true, -23, -9), row('a', 'First Runner', 2, true, -22, -8), row('b', 'Second Runner', 2, true, -22, -8), row('c', 'Third Player', 4, false, -20, -6)];
+  it('champion plus next two retain board order on ties and cumulative values', () => {
+    const chart = wonChart(WWT, field(), 335);
+    expect(chart?.lines.map(p => p.id)).toEqual(['brown', 'a', 'b']);
+    expect(chart?.lines[0]?.values).toEqual([0, 0, 0, -9]);
+    expect(chart?.lines[0]?.points.map(p => p.x)).toEqual([14, 86.33333333333333, 158.66666666666666, 231]);
+    expect(chart?.lines[0]?.points[3]?.y).toBeLessThan(chart?.lines[0]?.points[0]?.y ?? 0);
+  });
+  it('labels with equal finish scores are at least 13px apart', () => {
+    const labels = wonChart(WWT, field(), 335)?.lines.map(p => p.labelY).sort((a,b)=>a-b) ?? [];
+    expect(labels).toHaveLength(3);
+    expect(labels[1] - labels[0]).toBeGreaterThanOrEqual(13);
+    expect(labels[2] - labels[1]).toBeGreaterThanOrEqual(13);
+  });
+  it.each(['MC', 'CUT', 'WD', 'DQ'])('never selects %s finishers', status => {
+    const rows=field(); rows[1]={...rows[1],status};
+    expect(wonChart(WWT, rows, 335)?.lines.map(p=>p.id)).toEqual(['brown','b','c']);
+  });
+  it('drops an incomplete selected player without substituting a fourth', () => {
+    const rows=field(); rows[1]={...rows[1],round_2:null};
+    expect(wonChart(WWT, rows, 335)?.lines.map(p=>p.id)).toEqual(['brown','b']);
+  });
+  it('three rounds use three cumulative values and path positions', () => {
+    const chart=wonChart({...WWT,rounds:3,path:WWT.path.slice(0,3)},field(),335);
+    expect(chart?.lines[0]?.values).toEqual([0,0,0]);
+    expect(chart?.rounds.map(r=>r.label)).toEqual(['R1','R2','R3']);
+    expect(chart?.lines[0]?.points.map(p=>p.position?.position)).toEqual([9,6,9]);
+  });
+  it('hides for one round, no path or incomplete champion', () => {
+    expect(wonChart({...WWT,rounds:1},field(),335)).toBeNull();
+    expect(wonChart({...WWT,path:[]},field(),335)).toBeNull();
+    const rows=field(); rows[0]={...rows[0],round_1:null};
+    expect(wonChart(WWT,rows,335)).toBeNull();
+  });
+  it('full board row counts undisplayed rows and opens the existing board', () => {
+    const tap=vi.fn(); const {container}=render(<CompletedWeekBlock facts={WWT} rows={field()} onFullBoard={tap}/>);
+    const button=container.querySelector('[data-hero-full-leaderboard]');
+    expect(button).toHaveAttribute('data-field-size','4');
+    expect(button).toHaveAttribute('aria-label','Full leaderboard, 4 players');
+    expect(button?.querySelector('.cw-n')?.textContent).toBe('1 more players');
+    if(!button)throw new Error('Missing full board row');fireEvent.click(button);expect(tap).toHaveBeenCalledOnce();
+  });
+});
diff --git a/src/test/seasonRecap.test.tsx b/src/test/seasonRecap.test.tsx
index 6bf6adf2f2..88666e8f4e 100644
--- a/src/test/seasonRecap.test.tsx
+++ b/src/test/seasonRecap.test.tsx
@@ -140,7 +140,7 @@ describe('recap body', () => {
     expect(css).toContain('.recap-block{padding-top:var(--hero-section-gap)}');
     expect(css).toContain('.recap-figs{margin-top:var(--hero-content-gap)}');
     expect(css).toContain('.recap-record-figs{margin:var(--hero-content-gap) 0 0}');
-    expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(var(--recap-rows-3),auto);grid-auto-flow:column;column-gap:12px');
+    expect(css).toContain('grid-template-columns:repeat(3,minmax(0,max-content));justify-content:space-between;grid-template-rows:repeat(var(--recap-rows-3),auto);grid-auto-flow:column;column-gap:12px');
     expect(css).toContain('grid-template-columns:16px minmax(0,1fr);column-gap:7px');
     expect(css).toContain('.recap-cards span{text-align:right;');
   });
@@ -203,14 +203,14 @@ describe('recap body', () => {
     const { container: c2 } = wrap(<SeasonRecapBody tour="lpga" year={2026} data={kf({ cardLine: { label: 'TOP 20', n: 20 } })} />);
     expect(c2.querySelector('[data-recap-youngest]')!.textContent).toContain('earned her card');
   });
-  it('Our record hidden with no picks, shown with picks', () => {
+  it('Korn Ferry record remains hidden even with historical picks', () => {
     record.value = null;
     const { container, unmount } = wrap(<SeasonRecapBody tour="pgad" year={2026} data={kf()} />);
     expect(container.querySelector('[data-recap-record]')).toBeNull();
     unmount();
     record.value = { event_count: 21, won: 4, top10: 17 };
     const { container: c2 } = wrap(<SeasonRecapBody tour="pgad" year={2026} data={kf()} />);
-    expect(c2.querySelector('[data-recap-record]')!.textContent).toContain('OUR RECORD · 2026');
+    expect(c2.querySelector('[data-recap-record]')).toBeNull();
     record.value = null;
   });
   it('Champions with no standings shows EVENTS / WINNERS / MOST WINS only', () => {
@@ -261,10 +261,12 @@ describe('card list A', () => {
     expect(first.tagName).toBe('DIV');
     expect(container.querySelector('[data-recap-card="2"]')!.tagName).toBe('BUTTON');
   });
-  it('hybrid-hero.css has no centred max-content card grid and no 340px card rule', () => {
+  it('hybrid-hero.css spreads intrinsic columns in both widths without centring', () => {
     const css = readFileSync('src/styles/hybrid-hero.css', 'utf8');
     const cardRules = css.split('}').filter((r) => r.includes('.recap-cards'));
-    expect(cardRules.join('}')).not.toContain('max-content');
+    expect(cardRules.join('}')).toContain('repeat(3,minmax(0,max-content))');
+    expect(cardRules.join('}')).toContain('repeat(2,minmax(0,max-content))');
+    expect(cardRules.join('}')).toContain('justify-content:space-between');
     expect(cardRules.join('}')).not.toContain('justify-content:center');
     expect(css).not.toContain('max-width:340px){.recap-cards');
   });
diff --git a/src/test/tournamentPickInsights.test.tsx b/src/test/tournamentPickInsights.test.tsx
index 2f2b4ae1df..cbdef2b655 100644
--- a/src/test/tournamentPickInsights.test.tsx
+++ b/src/test/tournamentPickInsights.test.tsx
@@ -100,7 +100,7 @@ describe('tournament picks surfaces',()=>{
  it.each(['CUT','MC','WD','DQ'])('finished viewer and shared pick cards preserve the canonical %s token',(status)=>{
   const expected=status==='CUT'?'MC':status;
   mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:80,my_status:status,my_score:0}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);
-  expect(document.querySelector('.pick-mine-figure')?.textContent).toBe(expected);
+  expect(document.querySelector('[data-your-pick-card]')).toBeNull();
   expect(pickStatusToken(status)).toBe(expected);
  });
  it.each(['live','completed'] as const)('guest %s renders no pick card',(phase)=>{
@@ -129,7 +129,7 @@ describe('tournament picks surfaces',()=>{
  it('live picked card shows resolved comparison, score and thru',()=>{mount(<YourPickCard state={{...state,locked:true,my_player_id:'c',my_player_name:'Tom Kim',my_position:11,my_tied:true,my_score:-12,my_thru:9}} phase="live" ourResults={[result('a',80,'MC'),result('b',8),result('c',11)]} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Behind Ghim.');expect(document.querySelector('.pick-mine-figure')?.textContent).toContain('T11 −12THRU 9');});
  it('not-started live pick has tee text and no figures',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:1,my_score:0}} phase="live" ourResults={ours} started={false} teeTime="2026-11-05T13:05:00Z" tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-sub')?.textContent).toMatch(/^Tees off/);expect(document.querySelector('.pick-mine-figure')).toBeNull();});
  it('missed-cut card prints muted MC without score',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:80,my_status:'CUT',my_score:-12}} phase="live" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Missed the cut.');expect(document.querySelector('.pick-mine-figure')?.textContent).toBe('MC');});
- it('finished card separates real percentile from the best-pick heading',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:8,my_percentile:95}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Beat 95% of the field.');expect(document.querySelector('[data-pick-question]')?.textContent).toBe('You matched our best pick');});
+ it('finished card is absent even with a scored member pick',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:8,my_percentile:95}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-your-pick-card]')).toBeNull();});
  it('guest Pick calls the gate and never opens sheet',async()=>{
   mocks.guest=true;mocks.user=null;mocks.gate.mockReturnValue(true);const onPick=vi.fn();mount(<PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={ours} startedPlayers={new Set()} onPick={onPick}/>);
   fireEvent.click(await screen.findByRole('button',{name:'Pick'}));expect(mocks.gate).toHaveBeenCalledWith('pick');expect(onPick).not.toHaveBeenCalled();
@@ -152,7 +152,18 @@ describe('tournament picks surfaces',()=>{
   expect(document.querySelector('[data-overview-picks-sheet-fit]')).toBeNull();expect(document.querySelector('[data-overview-picks-sheet]')?.textContent).not.toContain('99%');
  });
  it('Why hides unchecked reason and keeps valid claim',async()=>{mount(<PicksSheet open onClose={()=>{}} picks={picks} predictions={null} eventName="Event" venueName={null} tournamentId="event"/>);await waitFor(()=>expect(document.querySelector('.pick-panel-case')?.textContent).toContain('Hits 72.3%'));expect(document.querySelector('.pick-panel-case')?.textContent).not.toContain('scrambling');});
- it('record tour chips have canonical order and switching uses event season',async()=>{mount(<OurRecordSheet open onClose={()=>{}} tour="pga" year={2026}/>);await screen.findByRole('button',{name:'PGA TOUR'});expect(Array.from(document.querySelectorAll('.pick-record-tours button')).map(b=>b.textContent)).toEqual(['PGA TOUR','DP World','LPGA','Champions','Korn Ferry']);fireEvent.click(screen.getByRole('button',{name:'LPGA'}));await waitFor(()=>expect(mocks.rpc).toHaveBeenCalledWith('get_our_pick_record',{p_tour:'lpga',p_year:2026}));});
+ it('record tour chips have canonical order and switching uses event season',async()=>{mount(<OurRecordSheet open onClose={()=>{}} tour="pga" year={2026}/>);await screen.findByRole('button',{name:'PGA TOUR'});expect(Array.from(document.querySelectorAll('.pick-record-tours button')).map(b=>b.textContent)).toEqual(['PGA TOUR','LPGA','Champions']);fireEvent.click(screen.getByRole('button',{name:'LPGA'}));await waitFor(()=>expect(mocks.rpc).toHaveBeenCalledWith('get_our_pick_record',{p_tour:'lpga',p_year:2026}));});
  it('record shows own dot, sorted board and newest-first ledger result tones',async()=>{mount(<OurRecordSheet open onClose={()=>{}} tour="pga" year={2026}/>);await waitFor(()=>expect(document.querySelector('[data-chance-row="you"]')).not.toBeNull());expect(Array.from(document.querySelectorAll('[data-beat-user]')).map(row=>row.getAttribute('data-beat-user'))).toEqual(['clbhouz','viewer','other']);expect(Array.from(document.querySelectorAll('[data-record-event]')).map(row=>row.getAttribute('data-record-event'))).toEqual(['new','old']);expect(document.querySelector('[data-result-tone="out"]')?.textContent).toBe('MC');expect(document.querySelector('[data-result-tone="win"]')?.textContent).toBe('1st');});
  it('no YOUR PICK rows when the member has no scored picks',async()=>{members=members.filter(m=>!m.is_viewer);myOdds={events:0,wins:0,random_win_pct:null};mount(<OurRecordSheet open onClose={()=>{}} tour="pga" year={2026}/>);await screen.findByRole('button',{name:'PGA TOUR'});expect(document.querySelector('[data-chance-row="you"]')).toBeNull();});
-});
\ No newline at end of file
+});
+
+describe('disabled tour pick entry points',()=>{
+ it.each(['euro','pgad'])('%s never mounts sheets or member reads',tour=>{
+  const view=mount(<><OurRecordSheet open onClose={()=>{}} tour={tour} year={2026}/><YourPickCard state={state} phase="completed" ourResults={ours} tourCode={tour} onPick={()=>{}}/><PicksSheet open tourCode={tour} tournamentId="event" onClose={()=>{}} picks={picks} predictions={null} eventName="Event" venueName={null}/><PickMemberBands tournamentId="event" tourCode={tour} seasonYear={2026} phase="live" currentRound={2} pickResults={ours} startedPlayers={new Set()} onPick={()=>{}}/></>);
+  expect(view.container).toBeEmptyDOMElement();expect(mocks.rpc).not.toHaveBeenCalled();
+ });
+ it.each(['upcoming','live','completed'] as const)('member card visibility in %s',phase=>{
+  const view=mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim'}} phase={phase} ourResults={ours} tourCode="pga" onPick={()=>{}}/>);
+  expect(view.container.querySelector('[data-your-pick-card]')!==null).toBe(phase!=='completed');
+ });
+});

```
