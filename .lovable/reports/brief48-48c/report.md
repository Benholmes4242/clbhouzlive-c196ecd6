# Briefs 48–48C — final report

28 November 2026. Code, tests and deployment were accepted by Ben; this close-out supplies the requested screenshots and complete named test accounting. No further code changes were made.

## 1. Files changed across the briefs

### Application and presentation

- `src/features/tourhub/components/overview-v3/ComingUpSlot.tsx`
- `src/features/tourhub/components/overview-v3/HybridHero.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`
- `src/features/tourhub/components/overview-v3/HybridOverviewShell.tsx`
- `src/features/tourhub/components/overview-v3/HybridPhotoFrame.tsx`
- `src/features/tourhub/components/overview-v3/LiveOverviewSections.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHero.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridComingUp.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridPhoto.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridPicks.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridRecap.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridSections.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridUpcoming.tsx`
- `src/features/tourhub/components/overview-v3/OverviewTourSwitcher.tsx`
- `src/features/tourhub/components/overview-v3/hybridOverviewRules.ts`
- `src/features/tourhub/components/overview-v3/overviewShells.tsx`
- `src/features/tourhub/components/overview-v3/upcomingOverviewRules.ts`
- `src/features/tourhub/components/overview-v3/useUpcomingOverview.ts`
- `src/features/tourhub/components/tabs/OverviewPageV3.tsx`
- `src/features/tourhub/overview/sections/AlsoThisWeek.tsx`
- `src/features/tourhub/overview/sections/AlsoWeekHybridCard.tsx`
- `src/features/tourhub/skins/SkinsSections.tsx`
- `src/locales/en/tourhub.json`
- `src/styles/tour-overview-hybrid.css`

### Tests

- `src/test/alsoWeekSection.test.tsx` — authorised rewrite
- `src/test/effectiveCurrentRound.test.tsx` — authorised rewrite
- `src/test/overviewCloseTheGap.test.tsx` — authorised rewrite
- `src/test/overviewHybridPhotoNavigation.test.tsx` — new
- `src/test/overviewRhythm.test.tsx` — authorised rewrite
- `src/test/overviewRoundParity.test.tsx` — authorised rewrite
- `src/test/overviewTourButtons.test.tsx` — authorised rewrite
- `src/test/overviewUpcomingCupRead.test.tsx` — new
- `src/test/roundDelayOverview.test.tsx` — authorised rewrite
- `src/test/seasonRecapNextUp.test.tsx` — authorised rewrite
- `src/test/tourChampionAvatarCandidates.test.tsx` — authorised rewrite
- `src/test/tourMoversNoTile.test.tsx` — authorised rewrite
- `src/test/tourOverviewGate.test.tsx` — authorised rewrite
- `src/test/tourOverviewHeroFixes.test.tsx` — authorised rewrite
- `src/test/tourOverviewHybrid48.test.tsx` — new
- `src/test/tourOverviewShellV2.test.tsx` — authorised rewrite

### Report/evidence

`roadmap.md`, `.lovable/reports/brief48-48c/report.md`, `historical-attempts.md`, the test-delta ledger and screenshots. The earlier diagnostic/focused logs remain preserved. Shared tournament-page defaults were not intentionally restyled; the combined accepted suite includes the existing tournament/board safeguards. This is not a new manual tournament-page screenshot comparison.

## 2. Rewritten tests — names, assertions and reasons

No existing test file or case was deleted. Existing files keep the same declaration counts; parameterized cases remain in their original files. Renamed cases are listed old → new below. Shared fixture/selector edits are quoted in the full patch for their file.

### `src/test/alsoWeekSection.test.tsx`

Reason: The weekly cards now use the hybrid heading/name markers and omit the retired heading dot; membership and event ordering stay protected.

- **two live events count as two live in the section head**

  Old assertion(s):

```ts
expect(v.container.querySelector('[data-overview-title]')?.textContent).toBe('Three more events, two live');
expect(v.container.querySelector('[data-overview-live-dot]')).not.toBeNull();
expect(v.container.querySelectorAll('.also-event')).toHaveLength(3);
```

  Replacement assertion(s):

```ts
expect(v.container.querySelector('[data-hero-head-title]')?.textContent).toBe('Three more events, two live');
expect(v.container.querySelector('[data-overview-live-dot]')).toBeNull();
expect(v.container.querySelectorAll('[data-also-event]')).toHaveLength(3);
```

- **no live events hide the count**

  Old assertion(s):

```ts
expect(v.container.querySelector('[data-overview-title]')?.textContent).toBe('c');
expect(v.container.querySelectorAll('.also-event')).toHaveLength(1);
```

  Replacement assertion(s):

```ts
expect(v.container.querySelector('[data-hero-head-title]')?.textContent).toBe('c');
expect(v.container.querySelectorAll('[data-also-event]')).toHaveLength(1);
```

- **viewed event is excluded from rows and live count**

  Old assertion(s):

```ts
expect(v.container.querySelector('[data-overview-title]')?.textContent).toBe('a, round three');
expect(v.container.querySelector('[data-overview-live-dot]')).not.toBeNull();
expect([...v.container.querySelectorAll('.also-title')].map(e=>e.textContent)).toEqual(['a']);
```

  Replacement assertion(s):

```ts
expect(v.container.querySelector('[data-hero-head-title]')?.textContent).toBe('a, round three');
expect(v.container.querySelector('[data-overview-live-dot]')).toBeNull();
expect([...v.container.querySelectorAll('.ov48-also-name')].map(e=>e.textContent)).toEqual(['a']);
```

- **carousel order and four-event cap remain unchanged**

  Old assertion(s):

```ts
expect([...v.container.querySelectorAll('.also-title')].map(e=>e.textContent)).toEqual(['d','b','a','e']);
expect(v.container.querySelector('[data-overview-title]')?.textContent).toBe('Four more events, four live');
```

  Replacement assertion(s):

```ts
expect([...v.container.querySelectorAll('.ov48-also-name')].map(e=>e.textContent)).toEqual(['d','b','a','e']);
expect(v.container.querySelector('[data-hero-head-title]')?.textContent).toBe('Four more events, four live');
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/alsoWeekSection.test.tsx b/src/test/alsoWeekSection.test.tsx
index bd7b4eb33d..176ee6d540 100644
--- a/src/test/alsoWeekSection.test.tsx
+++ b/src/test/alsoWeekSection.test.tsx
@@ -17,10 +17,10 @@ afterEach(()=>{cleanup();vi.useRealTimers();fixtures.slides=[];fixtures.guest=tr
 function slide(id:string,type:HeroSlide['type']='live'):HeroSlide {return {type,tournament:{id,name:id,status:type==='live'?'inprogress':'closed',startDate:'2026-10-29',endDate:'2026-11-01',currentRound:3,tourSlug:'pga',tourName:'PGA Tour'} as HeroSlide['tournament']};}
 function open(){vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));const qc=new QueryClient({defaultOptions:{queries:{retry:false}}});return render(<QueryClientProvider client={qc}><MemoryRouter><I18nextProvider i18n={i18n}><AlsoThisWeek/></I18nextProvider></MemoryRouter></QueryClientProvider>);}
 describe('weekly section membership and heading',()=>{
-  it('two live events count as two live in the section head',()=>{fixtures.slides=[slide('a'),slide('b'),slide('c','completed')];const v=open();expect(v.container.querySelector('[data-overview-title]')?.textContent).toBe('Three more events, two live');expect(v.container.querySelector('[data-overview-live-dot]')).not.toBeNull();expect(v.container.querySelectorAll('.also-event')).toHaveLength(3);});
-  it('no live events hide the count',()=>{fixtures.slides=[slide('c','completed')];const v=open();expect(v.container.querySelector('[data-overview-live-dot]')).toBeNull();expect(v.container.querySelector('[data-overview-title]')?.textContent).toBe('c');expect(v.container.querySelectorAll('.also-event')).toHaveLength(1);});
-  it('viewed event is excluded from rows and live count',()=>{fixtures.slides=[slide('viewed'),slide('a')];const v=open();expect(v.container.querySelector('[data-overview-title]')?.textContent).toBe('a, round three');expect(v.container.querySelector('[data-overview-live-dot]')).not.toBeNull();expect([...v.container.querySelectorAll('.also-title')].map(e=>e.textContent)).toEqual(['a']);});
-  it('carousel order and four-event cap remain unchanged',()=>{fixtures.slides=['d','b','a','e','f'].map(id=>slide(id));const v=open();expect([...v.container.querySelectorAll('.also-title')].map(e=>e.textContent)).toEqual(['d','b','a','e']);expect(v.container.querySelector('[data-overview-title]')?.textContent).toBe('Four more events, four live');});
+  it('two live events count as two live in the section head',()=>{fixtures.slides=[slide('a'),slide('b'),slide('c','completed')];const v=open();expect(v.container.querySelector('[data-hero-head-title]')?.textContent).toBe('Three more events, two live');expect(v.container.querySelector('[data-overview-live-dot]')).toBeNull();expect(v.container.querySelectorAll('[data-also-event]')).toHaveLength(3);});
+  it('no live events hide the count',()=>{fixtures.slides=[slide('c','completed')];const v=open();expect(v.container.querySelector('[data-overview-live-dot]')).toBeNull();expect(v.container.querySelector('[data-hero-head-title]')?.textContent).toBe('c');expect(v.container.querySelectorAll('[data-also-event]')).toHaveLength(1);});
+  it('viewed event is excluded from rows and live count',()=>{fixtures.slides=[slide('viewed'),slide('a')];const v=open();expect(v.container.querySelector('[data-hero-head-title]')?.textContent).toBe('a, round three');expect(v.container.querySelector('[data-overview-live-dot]')).toBeNull();expect([...v.container.querySelectorAll('.ov48-also-name')].map(e=>e.textContent)).toEqual(['a']);});
+  it('carousel order and four-event cap remain unchanged',()=>{fixtures.slides=['d','b','a','e','f'].map(id=>slide(id));const v=open();expect([...v.container.querySelectorAll('.ov48-also-name')].map(e=>e.textContent)).toEqual(['d','b','a','e']);expect(v.container.querySelector('[data-hero-head-title]')?.textContent).toBe('Four more events, four live');});
   it('empty section renders nothing',()=>{const v=open();expect(v.container.querySelector('section')).toBeNull();});
   it('next-week upcoming event stays excluded',()=>{const s=slide('future','upcoming');s.tournament.startDate='2026-11-05';fixtures.slides=[s];const v=open();expect(v.container.querySelector('section')).toBeNull();});
 });
\ No newline at end of file
```

### `src/test/effectiveCurrentRound.test.tsx`

Reason: The hybrid kicker is uppercase, between-rounds copy is ROUND n COMPLETE, and the retired short-form node is absent; round authority stays protected.

- **hero kicker reads PGA Tour · ROUND 3 · DELAYED with round 3 tees**

  Old assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · ROUND 3 · DELAYED');
```

  Replacement assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 3 · DELAYED');
```

- **normal between-rounds hero still reads AFTER ROUND 3** → **normal between-rounds overview hero reads ROUND 3 COMPLETE**

  Old assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 3');
```

  Replacement assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 3 COMPLETE');
```

- **the photo kicker carries the tour-prefixed short form for the narrow layout** → **the hybrid photo keeps the same round authority without the retired short-form node**

  Old assertion(s):

```ts
expect(view.container.querySelector('[data-kicker-short]')?.getAttribute('data-kicker-short')).toBe('PGA Tour · R3 · DELAYED');
```

  Replacement assertion(s):

```ts
expect(view.container.querySelector('[data-kicker-short]')).toBeNull();
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 3 · DELAYED');
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/effectiveCurrentRound.test.tsx b/src/test/effectiveCurrentRound.test.tsx
index 5680c66366..a2017e94f2 100644
--- a/src/test/effectiveCurrentRound.test.tsx
+++ b/src/test/effectiveCurrentRound.test.tsx
@@ -82,13 +82,13 @@ describe('RSM shape names round 3 and DELAYED everywhere', () => {
   it('hero kicker reads PGA Tour · ROUND 3 · DELAYED with round 3 tees', () => {
     f.rows = rsm; f.groups = [group];
     const view = mount(<HybridHero slide={{ type: 'live', tournament } as unknown as HeroSlide} state={{ kind: 'live', round: 4, totalRounds: 4 }} now={now} activeTournamentId="rsm" onSelectTour={() => {}} onOpenTournament={() => {}} />);
-    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · ROUND 3 · DELAYED');
+    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 3 · DELAYED');
     expect(f.read).toHaveBeenCalledWith('rsm', 3, { enabled: true });
   });
-  it('normal between-rounds hero still reads AFTER ROUND 3', () => {
+  it('normal between-rounds overview hero reads ROUND 3 COMPLETE', () => {
     f.rows = rsm.map(e => ({ ...e, round_3: -1, today: -1, today_round: 3 })); f.groups = [{ ...group, teeTime: '2026-11-22T16:00:00Z' }];
     const view = mount(<HybridHero slide={{ type: 'live', tournament } as unknown as HeroSlide} state={{ kind: 'live', round: 4, totalRounds: 4 }} now={now} activeTournamentId="rsm" onSelectTour={() => {}} onOpenTournament={() => {}} />);
-    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 3');
+    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 3 COMPLETE');
   });
   it('picks heading reads ROUND 3 · DELAYED', () => {
     const state = rsmState();
@@ -129,9 +129,10 @@ describe('narrow hero kicker short forms', () => {
     expect(heroStateLineShort(t as never, { kind: 'live', round: 3, totalRounds: 4 })).toBe('R3');
     expect(heroStateLineShort(t as never, { kind: 'live', round: 4, totalRounds: 4 })).toBe('FINAL ROUND');
   });
-  it('the photo kicker carries the tour-prefixed short form for the narrow layout', () => {
+  it('the hybrid photo keeps the same round authority without the retired short-form node', () => {
     f.rows = rsm; f.groups = [group];
     const view = mount(<HybridHero slide={{ type: 'live', tournament } as unknown as HeroSlide} state={{ kind: 'live', round: 4, totalRounds: 4 }} now={now} activeTournamentId="rsm" onSelectTour={() => {}} onOpenTournament={() => {}} />);
-    expect(view.container.querySelector('[data-kicker-short]')?.getAttribute('data-kicker-short')).toBe('PGA Tour · R3 · DELAYED');
+    expect(view.container.querySelector('[data-kicker-short]')).toBeNull();
+    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 3 · DELAYED');
   });
 });
```

### `src/test/overviewCloseTheGap.test.tsx`

Reason: The champion moves into the photo glass card and the separate champion strip is retired.

- **finished: band → champion block → chip row → board** → **finished: champion photo band → switcher → board, no separate champion strip**

  Old assertion(s):

```ts
expect(order(container)).toEqual(['band', 'champion', 'chips', 'board']);
```

  Replacement assertion(s):

```ts
expect(order(container)).toEqual(['band', 'chips', 'board']);
expect(container.querySelector('[data-overview-champion]')).toBeNull();
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/overviewCloseTheGap.test.tsx b/src/test/overviewCloseTheGap.test.tsx
index a64f215ca8..da88209904 100644
--- a/src/test/overviewCloseTheGap.test.tsx
+++ b/src/test/overviewCloseTheGap.test.tsx
@@ -99,10 +99,11 @@ describe('no floor above the band', () => {
 });
 
 describe('block order', () => {
-  it('finished: band → champion block → chip row → board', () => {
+  it('finished: champion photo band → switcher → board, no separate champion strip', () => {
     f.slides = [slide('c', 'pga', 'completed')];
     const { container } = mount();
-    expect(order(container)).toEqual(['band', 'champion', 'chips', 'board']);
+    expect(order(container)).toEqual(['band', 'chips', 'board']);
+    expect(container.querySelector('[data-overview-champion]')).toBeNull();
   });
   it('live and upcoming: band → chip row → board, no champion block', () => {
     f.slides = [slide('l', 'pga', 'live')];
```

### `src/test/overviewRhythm.test.tsx`

Reason: Coming up is five list rows, not a separate next panel plus four rows; StoryBand follows Coming up.

- **fills the next panel and four rows after all above-page exclusions** → **fills five list rows after all above-page exclusions**

  Old assertion(s):

```ts
expect(container.querySelector('[data-coming-next]')).toHaveAttribute('data-coming-next', 'next0');
expect([...container.querySelectorAll('[data-coming-up-item]')].map(e => e.getAttribute('data-coming-up-item'))).toEqual(['next1', 'next2', 'next3', 'next4']);
```

  Replacement assertion(s):

```ts
expect(container.querySelector('[data-coming-next]')).toBeNull();
expect([...container.querySelectorAll('[data-coming-up-item] .ov48-list-name')].map(e => e.textContent)).toEqual(['next0', 'next1', 'next2', 'next3', 'next4']);
```

- **next kicker includes a tag when comingTag supplies one** → **the hybrid list does not render the retired next-panel tag**

  Old assertion(s):

```ts
expect(container.querySelector('[data-coming-next] [data-coming-tag]')).toHaveAttribute('data-coming-tag', 'finale');
```

  Replacement assertion(s):

```ts
expect(container.querySelector('[data-coming-next]')).toBeNull();
expect(container.querySelector('[data-coming-tag]')).toBeNull();
expect(container.querySelectorAll('[data-coming-up-item]')).toHaveLength(1);
```

- **page order is hero band week coming-up slot rankings News** → **page order is hero week coming-up band slot rankings News**

  Old assertion(s):

```ts
expect([...container.querySelectorAll('[data-order], [data-overview-story-band], .coming-up')].map(e => e.getAttribute('data-order') ?? e.getAttribute('data-overview-story-band') ?? 'coming-up')).toEqual(['hero', 'band', 'week', 'coming-up', 'slot', 'rankings', 'news']);
```

  Replacement assertion(s):

```ts
expect([...container.querySelectorAll('[data-order], [data-overview-story-band], [data-overview-band="comingUp"]')].map(e => e.getAttribute('data-order') ?? e.getAttribute('data-overview-story-band') ?? 'coming-up')).toEqual(['hero', 'week', 'coming-up', 'band', 'slot', 'rankings', 'news']);
```

- **page has no slot when no fresh unused story remains**

  Old assertion(s):

```ts
expect(container.querySelector('[data-order="week"]')?.nextElementSibling).toBe(container.querySelector('[data-order="rankings"]'));
```

  Replacement assertion(s):

```ts
expect(container.querySelector('[data-order="week"]')?.nextElementSibling).toBe(container.querySelector('[data-overview-story-band]'));
expect(container.querySelector('[data-overview-story-band]')?.nextElementSibling).toBe(container.querySelector('[data-order="rankings"]'));
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/overviewRhythm.test.tsx b/src/test/overviewRhythm.test.tsx
index 3fc8060898..9c53886b99 100644
--- a/src/test/overviewRhythm.test.tsx
+++ b/src/test/overviewRhythm.test.tsx
@@ -62,21 +62,23 @@ describe('Overview rhythm event selection', () => {
   it('uses canonical tour order for equal purses', () => {
     expect(selectComingUpRail([event('champ', undefined, 3, 'champ'), event('euro', undefined, 3, 'euro'), event('pga', undefined, 3, 'pga')]).map(e => e.id)).toEqual(['pga', 'euro', 'champ']);
   });
-  it('fills the next panel and four rows after all above-page exclusions', () => {
+  it('fills five list rows after all above-page exclusions', () => {
     state.slides = [slide('hero', 'upcoming'), slide('week', 'live'), slide('final', 'completed')];
     state.rows = [...state.slides.map(s => event(s.tournament.id)), ...Array.from({ length: 9 }, (_, i) => event(`next${i}`))];
     const { container } = mount(<ComingUpSlot />);
     expect(state.read).toHaveBeenCalledWith(null, 12);
-    expect(container.querySelector('[data-coming-next]')).toHaveAttribute('data-coming-next', 'next0');
-    expect([...container.querySelectorAll('[data-coming-up-item]')].map(e => e.getAttribute('data-coming-up-item'))).toEqual(['next1', 'next2', 'next3', 'next4']);
+    expect(container.querySelector('[data-coming-next]')).toBeNull();
+    expect([...container.querySelectorAll('[data-coming-up-item] .ov48-list-name')].map(e => e.textContent)).toEqual(['next0', 'next1', 'next2', 'next3', 'next4']);
   });
   it('passes the selected tour lens unchanged to the twelve-event read', () => {
     state.tour = 'lpga'; mount(<ComingUpSlot />); expect(state.read).toHaveBeenCalledWith('lpga', 12);
   });
-  it('next kicker includes a tag when comingTag supplies one', () => {
+  it('the hybrid list does not render the retired next-panel tag', () => {
     state.rows = [{ ...event('finale'), name: 'DP World Tour Championship' }];
     const { container } = mount(<ComingUpSlot />);
-    expect(container.querySelector('[data-coming-next] [data-coming-tag]')).toHaveAttribute('data-coming-tag', 'finale');
+    expect(container.querySelector('[data-coming-next]')).toBeNull();
+    expect(container.querySelector('[data-coming-tag]')).toBeNull();
+    expect(container.querySelectorAll('[data-coming-up-item]')).toHaveLength(1);
   });
   it('next kicker omits the chip when comingTag is absent', () => {
     state.rows = [event('ordinary')]; const { container } = mount(<ComingUpSlot />); expect(container.querySelector('[data-coming-tag]')).toBeNull();
@@ -127,10 +129,10 @@ describe('Overview rhythm story slot', () => {
     const selection = selectOverviewNews([story('band'), story('slot'), ...Array.from({ length: 7 }, (_, i) => story(`news${i}`))], ['band', 'slot']);
     expect(selection.hero?.id).toBe('news0'); expect(selection.features.map(s => s.id)).toEqual(['news1', 'news2']); expect(selection.rows.map(s => s.id)).toEqual(['news3', 'news4', 'news5']);
   });
-  it('page order is hero band week coming-up slot rankings News', () => {
+  it('page order is hero week coming-up band slot rankings News', () => {
     state.stories = [{ ...story('band'), tournament_id: 'hero' }, story('slot', 'lpga')]; state.rows = [event('next')];
     const { container } = mount(<OverviewPageV3 />);
-    expect([...container.querySelectorAll('[data-order], [data-overview-story-band], .coming-up')].map(e => e.getAttribute('data-order') ?? e.getAttribute('data-overview-story-band') ?? 'coming-up')).toEqual(['hero', 'band', 'week', 'coming-up', 'slot', 'rankings', 'news']);
+    expect([...container.querySelectorAll('[data-order], [data-overview-story-band], [data-overview-band="comingUp"]')].map(e => e.getAttribute('data-order') ?? e.getAttribute('data-overview-story-band') ?? 'coming-up')).toEqual(['hero', 'week', 'coming-up', 'band', 'slot', 'rankings', 'news']);
     expect(container.querySelector('[data-order="news"]')).toHaveAttribute('data-excluded', 'band,slot');
   });
   it('slot uses the News tour lens while first band selection stays unchanged', () => {
@@ -143,6 +145,7 @@ describe('Overview rhythm story slot', () => {
     state.stories = [{ ...story('band'), tournament_id: 'hero' }];
     const { container } = mount(<OverviewPageV3 />);
     expect(container.querySelector('[data-overview-photo-slot]')).toBeNull();
-    expect(container.querySelector('[data-order="week"]')?.nextElementSibling).toBe(container.querySelector('[data-order="rankings"]'));
+    expect(container.querySelector('[data-order="week"]')?.nextElementSibling).toBe(container.querySelector('[data-overview-story-band]'));
+    expect(container.querySelector('[data-overview-story-band]')?.nextElementSibling).toBe(container.querySelector('[data-order="rankings"]'));
   });
 });
\ No newline at end of file
```

### `src/test/overviewRoundParity.test.tsx`

Reason: The overview kicker spelling/presentation changes while hero and picks retain the same canonical round/state authority.

- **$name names the same round and state**

  Old assertion(s):

```ts
expect(view.container.querySelector('[data-overview-first-tee]')).not.toBeNull();
```

  Replacement assertion(s):

```ts
expect(view.container.querySelector('[data-overview-glass-card]')).not.toBeNull();
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/overviewRoundParity.test.tsx b/src/test/overviewRoundParity.test.tsx
index edeb57c03f..7d1a5e5525 100644
--- a/src/test/overviewRoundParity.test.tsx
+++ b/src/test/overviewRoundParity.test.tsx
@@ -37,12 +37,12 @@ const player = { id: 'a', full_name: 'Player A' };
 const inPlay: BoardEntry = { id: 'a', player, position: 1, score: -10, round_1: -4, round_2: -5, round_3: -1, today: -1, today_round: 3, thru: 7 };
 const beforeR3: BoardEntry = { ...inPlay, score: -9, round_3: null, today: -5, today_round: 2, thru: 18 };
 const fixtures = [
-  { name: 'in play R3', kind: 'live', round: 3, rows: [inPlay], status: 'inprogress', tee: past, hero: 'PGA Tour · ROUND 3', picks: 'OUR TOURNAMENT PICKS · ROUND 3' },
-  { name: 'after R3', kind: 'live', round: 3, rows: [{ ...inPlay, thru: 18 }], status: 'closed', tee: future, hero: 'PGA Tour · AFTER ROUND 3', picks: 'OUR TOURNAMENT PICKS' },
-  { name: 'R3 delayed', kind: 'live', round: 3, rows: [beforeR3], status: 'scheduled', tee: past, hero: 'PGA Tour · ROUND 3 · DELAYED', picks: 'OUR TOURNAMENT PICKS · DELAYED' },
-  { name: 'R3 suspended', kind: 'suspended', round: 3, rows: [inPlay], status: 'suspended', tee: past, hero: 'PGA Tour · ROUND 3 · SUSPENDED', picks: 'OUR TOURNAMENT PICKS · SUSPENDED' },
-  { name: 'before the first tee', kind: 'live', round: 1, rows: [{ id: 'a', player, position: 1, score: 0, thru: 0 }], status: 'scheduled', tee: future, hero: 'PGA Tour · ROUND 1', picks: 'OUR TOURNAMENT PICKS' },
-  { name: 'final round', kind: 'live', round: 4, rows: [{ ...inPlay, round_4: -1, today_round: 4 }], status: 'inprogress', tee: past, hero: 'PGA Tour · FINAL ROUND', picks: 'OUR TOURNAMENT PICKS · FINAL ROUND' },
+  { name: 'in play R3', kind: 'live', round: 3, rows: [inPlay], status: 'inprogress', tee: past, hero: 'PGA TOUR · ROUND 3 · LIVE', picks: 'OUR TOURNAMENT PICKS · ROUND 3' },
+  { name: 'after R3', kind: 'live', round: 3, rows: [{ ...inPlay, thru: 18 }], status: 'closed', tee: future, hero: 'PGA TOUR · ROUND 3 COMPLETE', picks: 'OUR TOURNAMENT PICKS' },
+  { name: 'R3 delayed', kind: 'live', round: 3, rows: [beforeR3], status: 'scheduled', tee: past, hero: 'PGA TOUR · ROUND 3 · DELAYED', picks: 'OUR TOURNAMENT PICKS · DELAYED' },
+  { name: 'R3 suspended', kind: 'suspended', round: 3, rows: [inPlay], status: 'suspended', tee: past, hero: 'PGA TOUR · ROUND 3 · SUSPENDED', picks: 'OUR TOURNAMENT PICKS · SUSPENDED' },
+  { name: 'before the first tee', kind: 'live', round: 1, rows: [{ id: 'a', player, position: 1, score: 0, thru: 0 }], status: 'scheduled', tee: future, hero: 'PGA TOUR · ROUND 1 · STARTS 22:00', picks: 'OUR TOURNAMENT PICKS' },
+  { name: 'final round', kind: 'live', round: 4, rows: [{ ...inPlay, round_4: -1, today_round: 4 }], status: 'inprogress', tee: past, hero: 'PGA TOUR · FINAL ROUND · LIVE', picks: 'OUR TOURNAMENT PICKS · FINAL ROUND' },
 ] as const;
 type Fixture = Omit<(typeof fixtures)[number], 'status'> & { status: string };
 function stateOf(fixture: Fixture): HeroState { return fixture.kind === 'suspended' ? { kind: 'suspended', round: fixture.round, totalRounds: 4, reason: null } : { kind: 'live', round: fixture.round, totalRounds: 4 }; }
@@ -80,7 +80,7 @@ describe('overview hero and picks share one round state', () => {
     const view = render(<Harness fixture={fixture} />, { wrapper: wrapper(clientFor(fixture)) });
     expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe(fixture.hero);
     expect(view.container.querySelector('[data-live-picks] [data-hero-head-eyebrow]')?.textContent).toBe(fixture.picks);
-    if (fixture.round === 1) expect(view.container.querySelector('[data-overview-first-tee]')).not.toBeNull();
+    if (fixture.round === 1) expect(view.container.querySelector('[data-overview-glass-card]')).not.toBeNull();
     const eyebrow = view.container.querySelector('[data-live-picks] [data-hero-head-eyebrow]')?.textContent ?? '';
     expect(eyebrow).toBe(eyebrow.toLocaleUpperCase());
   });
```

### `src/test/overviewTourButtons.test.tsx`

Reason: The overview-only five-segment switcher replaces variable RailChips, keeping selection and slide ordering.

- **renders one chip per slide in OVERVIEW_TOUR_ORDER, with no chip for a tour without a slide** → **renders all five tour segments even when a tour has no slide**

  Old assertion(s):

```ts
expect(chips().map((c) => c.textContent)).toEqual(['PGA', 'LPGA', 'Champions', 'Korn Ferry']);
expect(chips().some((c) => c.textContent === 'DP World')).toBe(false);
```

  Replacement assertion(s):

```ts
expect(chips()).toHaveLength(5);
expect(chips().map(c => c.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false', 'false', 'false']);
expect(f.heroSlides.length).toBe(before);
```

- **labels a same-tour pair "{TOUR} · {token}", live first then by start date** → **uses one segment per tour and selects its live slide first**

  Old assertion(s):

```ts
expect(chips().map((c) => c.textContent)).toEqual(['PGA · World', 'PGA · Bermuda']);
```

  Replacement assertion(s):

```ts
expect(chips()).toHaveLength(5);
expect(chips().filter(c => c.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
expect(screen.getByTestId('hybrid-hero')).toHaveAttribute('data-slide-id', 'pga-live');
```

- **drops LIV, the pseudo-major and other unlisted tours from both the chips and the carousel**

  Old assertion(s):

```ts
expect(chips().map((c) => c.textContent)).toEqual(['PGA']);
```

  Replacement assertion(s):

```ts
expect(chips()).toHaveLength(5);
expect(selectedChip()).toBe(chips()[0]);
```

- **uses the canonical RailChips with toggle semantics — no new chip styles** → **uses the overview-only switcher with toggle semantics**

  Old assertion(s):

```ts
expect(row.className).toContain('hide-scrollbar');
expect(row.className).toContain('overview-tour-chips');
expect(source).toContain("from '@/components/ui/RailChips'");
```

  Replacement assertion(s):

```ts
expect(row.className).toBe('ov48-switcher');
expect(source).toContain('<OverviewTourSwitcher');
expect(source).not.toContain("from '@/components/ui/RailChips'");
```

- **a Korn Ferry slide from the fallback renders a Korn Ferry chip, fifth**

  Old assertion(s):

```ts
expect(chips().map((c) => c.textContent)).toEqual(['PGA', 'LPGA', 'DP World', 'Champions', 'Korn Ferry']);
```

  Replacement assertion(s):

```ts
expect(chips()).toHaveLength(5);
expect(screen.getByTestId('hybrid-hero')).toHaveAttribute('data-slide-id', 'pgad-next');
```

- **chips are flex 1 1 auto, centred and unwrapped; the row scrolls only on overflow** → **five segments share fixed grid tracks with a narrow-screen font rule**

  Old assertion(s):

```ts
expect(chip.style.flex).toBe('1 1 auto');
expect(chip.style.textAlign).toBe('center');
expect(chip.style.whiteSpace).toBe('nowrap');
expect(chip.style.minWidth).toBe('max-content');
expect(chipRow().style.overflowX).toBe('auto');
expect(css).toContain('.overview-tour-chips { padding: 14px 20px 2px;');
expect(css).toMatch(/max-width: 359px\) \{ \.overview-tour-chips \{ --rail-chip-gap: 4px; --rail-chip-font: 11px;/);
expect(css).toContain('clamp(3px,');
```

  Replacement assertion(s):

```ts
expect(chips()).toHaveLength(5);
expect(css).toContain('grid-template-columns:repeat(5,minmax(0,1fr))');
expect(css).toContain('@media(max-width:359px) { .ov48-switcher > button { font-size:11px; }');
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/overviewTourButtons.test.tsx b/src/test/overviewTourButtons.test.tsx
index 4afac12f33..be93dbc1d1 100644
--- a/src/test/overviewTourButtons.test.tsx
+++ b/src/test/overviewTourButtons.test.tsx
@@ -89,7 +89,7 @@ describe('overview tour chip row', () => {
     expect(OVERVIEW_TOUR_ORDER).toEqual(['pga', 'lpga', 'euro', 'champ', 'pgad']);
   });
 
-  it('renders one chip per slide in OVERVIEW_TOUR_ORDER, with no chip for a tour without a slide', () => {
+  it('renders all five tour segments even when a tour has no slide', () => {
     // Deliberately scrambled hook output: the overview reorders it.
     f.slides = [
       slide('pgad-1', 'pgad', 'upcoming'),
@@ -98,18 +98,22 @@ describe('overview tour chip row', () => {
       slide('lpga-1', 'lpga', 'upcoming'),
     ];
     mountHero();
-    expect(chips().map((c) => c.textContent)).toEqual(['PGA', 'LPGA', 'Champions', 'Korn Ferry']);
-    // euro (DP World) has no slide → no chip.
-    expect(chips().some((c) => c.textContent === 'DP World')).toBe(false);
+    expect(chips()).toHaveLength(5);
+    expect(chips().map(c => c.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false', 'false', 'false']);
+    const before = f.heroSlides.length;
+    fireEvent.click(chips()[2]);
+    expect(f.heroSlides.length).toBe(before);
   });
 
-  it('labels a same-tour pair "{TOUR} · {token}", live first then by start date', () => {
+  it('uses one segment per tour and selects its live slide first', () => {
     f.slides = [
       slide('pga-up', 'pga', 'upcoming', 'The Bermuda Championship'),
       slide('pga-live', 'pga', 'live', 'World Wide Technology Championship'),
     ];
     mountHero();
-    expect(chips().map((c) => c.textContent)).toEqual(['PGA · World', 'PGA · Bermuda']);
+    expect(chips()).toHaveLength(5);
+    expect(chips().filter(c => c.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
+    expect(screen.getByTestId('hybrid-hero')).toHaveAttribute('data-slide-id', 'pga-live');
   });
 
   it('tapping a chip makes that slide active and reports the viewing tour, same as a swipe', async () => {
@@ -159,21 +163,22 @@ describe('overview tour chip row', () => {
       slide('pga-1', 'pga', 'live'),
     ];
     mountHero();
-    expect(chips().map((c) => c.textContent)).toEqual(['PGA']);
+    expect(chips()).toHaveLength(5);
+    expect(selectedChip()).toBe(chips()[0]);
     expect(f.heroSlides).toContain('pga-1');
     expect(f.heroSlides).not.toContain('liv-1');
     expect(f.heroSlides).not.toContain('major-1');
   });
 
-  it('uses the canonical RailChips with toggle semantics — no new chip styles', () => {
+  it('uses the overview-only switcher with toggle semantics', () => {
     f.slides = [slide('pga-1', 'pga', 'live'), slide('lpga-1', 'lpga', 'live')];
     mountHero();
     const row = chipRow();
-    expect(row.className).toContain('hide-scrollbar');
-    expect(row.className).toContain('overview-tour-chips');
+    expect(row.className).toBe('ov48-switcher');
     chips().forEach((chip) => expect(chip.getAttribute('aria-pressed')).not.toBeNull());
     const source = readFileSync('src/features/tourhub/components/overview-v3/OverviewHero.tsx', 'utf8');
-    expect(source).toContain("from '@/components/ui/RailChips'");
+    expect(source).toContain('<OverviewTourSwitcher');
+    expect(source).not.toContain("from '@/components/ui/RailChips'");
     expect(source).not.toContain('railChipStyle(');
   });
 });
@@ -183,24 +188,18 @@ describe('URGENT_FIX close-the-gap: five buttons that fill the row', () => {
     f.slides = [slide('pga-1', 'pga', 'live'), slide('lpga-1', 'lpga', 'upcoming'), slide('euro-1', 'euro', 'completed'), slide('champ-1', 'champ', 'upcoming')];
     f.fallback = [slide('pgad-next', 'pgad', 'upcoming')];
     mountHero();
-    expect(chips().map((c) => c.textContent)).toEqual(['PGA', 'LPGA', 'DP World', 'Champions', 'Korn Ferry']);
+    expect(chips()).toHaveLength(5);
+    fireEvent.click(chips()[4]);
+    expect(screen.getByTestId('hybrid-hero')).toHaveAttribute('data-slide-id', 'pgad-next');
   });
 
-  it('chips are flex 1 1 auto, centred and unwrapped; the row scrolls only on overflow', () => {
+  it('five segments share fixed grid tracks with a narrow-screen font rule', () => {
     f.slides = OVERVIEW_TOUR_ORDER.map((t) => slide(`${t}-1`, t, 'upcoming'));
     mountHero();
-    chips().forEach((chip) => {
-      expect(chip.style.flex).toBe('1 1 auto');
-      expect(chip.style.textAlign).toBe('center');
-      expect(chip.style.whiteSpace).toBe('nowrap');
-      expect(chip.style.minWidth).toBe('max-content');
-    });
-    // overflow-x:auto scrolls only when content exceeds the row; labels never squeeze.
-    expect(chipRow().style.overflowX).toBe('auto');
-    const css = readFileSync('src/styles/hybrid-hero.css', 'utf8');
-    expect(css).toContain('.overview-tour-chips { padding: 14px 20px 2px;');
-    expect(css).toMatch(/max-width: 359px\) \{ \.overview-tour-chips \{ --rail-chip-gap: 4px; --rail-chip-font: 11px;/);
-    expect(css).toContain('clamp(3px,');
+    expect(chips()).toHaveLength(5);
+    const css = readFileSync('src/styles/tour-overview-hybrid.css', 'utf8');
+    expect(css).toContain('grid-template-columns:repeat(5,minmax(0,1fr))');
+    expect(css).toContain('@media(max-width:359px) { .ov48-switcher > button { font-size:11px; }');
   });
 });
```

### `src/test/roundDelayOverview.test.tsx`

Reason: The hybrid uppercase/delay/between-round kicker and weekly card replace old markers; underlying delay and tee authority stay protected.

- **hero kicker reads PGA Tour · ROUND 3 · DELAYED after the scheduled first tee**

  Old assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · ROUND 3 · DELAYED');
```

  Replacement assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 3 · DELAYED');
```

- **hero reverts to after-round wording when a current-round player records a hole before a score arrives**

  Old assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 2');
```

  Replacement assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 2 COMPLETE');
```

- **hero keeps after-round wording before the one-hour boundary**

  Old assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 2');
```

  Replacement assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 2 COMPLETE');
```

- **republished future tee times remove the hero delay**

  Old assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 2');
```

  Replacement assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 2 COMPLETE');
```

- **provider-suspended hero handling remains unchanged**

  Old assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · ROUND 3 · SUSPENDED');
```

  Replacement assertion(s):

```ts
expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 3 · SUSPENDED');
```

- **weekly section consumes the batched round-keyed tee while retaining its live count** → **weekly hybrid card uses the effective round without the retired live-count dot**

  Old assertion(s):

```ts
expect(view.container.querySelector('.also-state')?.textContent).toBe('ROUND 3 · DELAYED');
expect(view.container.querySelector('[data-overview-live-dot]')).not.toBeNull();
```

  Replacement assertion(s):

```ts
expect(view.container.querySelector('.ov48-also-kicker')?.textContent).toBe('PGA TOUR · ROUND 3');
expect(view.container.querySelector('[data-overview-live-dot]')).toBeNull();
expect(view.container.querySelectorAll('[data-also-event]')).toHaveLength(1);
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/roundDelayOverview.test.tsx b/src/test/roundDelayOverview.test.tsx
index a79c7338c3..c6202fa81a 100644
--- a/src/test/roundDelayOverview.test.tsx
+++ b/src/test/roundDelayOverview.test.tsx
@@ -54,7 +54,7 @@ describe('RSM-shaped derived delay displays', () => {
   it('hero kicker reads PGA Tour · ROUND 3 · DELAYED after the scheduled first tee', () => {
     setup();
     const view = mount(<HybridHero {...heroProps} />);
-    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · ROUND 3 · DELAYED');
+    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 3 · DELAYED');
     expect(f.read).toHaveBeenCalledWith('rsm', 3, { enabled: true });
   });
   it('hero reverts to after-round wording when a current-round player records a hole before a score arrives', () => {
@@ -63,22 +63,22 @@ describe('RSM-shaped derived delay displays', () => {
     expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toContain('DELAYED');
     f.rows = [{ ...rows[0], today: null, today_round: 3, thru: 1 }];
     view.rerender(<HybridHero {...heroProps} />);
-    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 2');
+    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 2 COMPLETE');
   });
   it('hero keeps after-round wording before the one-hour boundary', () => {
     setup();
     const view = mount(<HybridHero {...heroProps} now={new Date('2026-11-21T15:09:00Z')} />);
-    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 2');
+    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 2 COMPLETE');
   });
   it('republished future tee times remove the hero delay', () => {
     setup(); f.groups = [{ ...group, teeTime: '2026-11-21T22:00:00Z' }];
     const view = mount(<HybridHero {...heroProps} />);
-    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · AFTER ROUND 2');
+    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 2 COMPLETE');
   });
   it('provider-suspended hero handling remains unchanged', () => {
     setup();
     const view = mount(<HybridHero {...heroProps} state={{ kind: 'suspended', round: 3, totalRounds: 4, reason: null }} />);
-    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA Tour · ROUND 3 · SUSPENDED');
+    expect(view.container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('PGA TOUR · ROUND 3 · SUSPENDED');
   });
   it('leaders group shows Delayed from the same event, round and earliest tee', () => {
     setup();
@@ -118,10 +118,11 @@ describe('RSM-shaped derived delay displays', () => {
     expect(view.container.querySelector('.also-state')?.textContent).toBe('ROUND 3');
     expect(view.container.querySelector('.also-live-dot')).not.toBeNull();
   });
-  it('weekly section consumes the batched round-keyed tee while retaining its live count', () => {
+  it('weekly hybrid card uses the effective round without the retired live-count dot', () => {
     setup(); vi.useFakeTimers(); vi.setSystemTime(now);
     const view = mount(<AlsoThisWeek />);
-    expect(view.container.querySelector('.also-state')?.textContent).toBe('ROUND 3 · DELAYED');
-    expect(view.container.querySelector('[data-overview-live-dot]')).not.toBeNull();
+    expect(view.container.querySelector('.ov48-also-kicker')?.textContent).toBe('PGA TOUR · ROUND 3');
+    expect(view.container.querySelector('[data-overview-live-dot]')).toBeNull();
+    expect(view.container.querySelectorAll('[data-also-event]')).toHaveLength(1);
   });
 });
\ No newline at end of file
```

### `src/test/seasonRecapNextUp.test.tsx`

Reason: The Next up card keeps its event-selection rule but uses the new overview name marker.

- **%s rolls from a six-day-old final to recap instead of its 54-day upcoming slide**

  Old assertion(s):

```ts
expect(container.querySelector('.recap-next-up-name')?.textContent).toBe(next.name);
```

  Replacement assertion(s):

```ts
expect(container.querySelector('[data-recap-next-up] .ov48-next-name')?.textContent).toBe(next.name);
```

- **the earliest loaded next event supplies the footer, not a later slide**

  Old assertion(s):

```ts
expect(container.querySelector('.recap-next-up-name')?.textContent).toBe(next.name);
```

  Replacement assertion(s):

```ts
expect(container.querySelector('[data-recap-next-up] .ov48-next-name')?.textContent).toBe(next.name);
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/seasonRecapNextUp.test.tsx b/src/test/seasonRecapNextUp.test.tsx
index bf1286910f..7db1eee380 100644
--- a/src/test/seasonRecapNextUp.test.tsx
+++ b/src/test/seasonRecapNextUp.test.tsx
@@ -73,7 +73,7 @@ describe('Season recap Next up', () => {
     const { container } = mount(<OverviewHero />);
     await waitFor(() => expect(container.querySelector('[data-overview-photo-state="recap"]')).not.toBeNull());
     expect(container.querySelector('[data-non-recap="upcoming"]')).toBeNull();
-    expect(container.querySelector('.recap-next-up-name')?.textContent).toBe(next.name);
+    expect(container.querySelector('[data-recap-next-up] .ov48-next-name')?.textContent).toBe(next.name);
   });
   it('a live slide still wins over its tour recap', () => {
     fixture.slides = [{ type: 'live', tournament: tournament({ status: 'inprogress' }) }];
@@ -86,7 +86,7 @@ describe('Season recap Next up', () => {
     fixture.slides = [{ type: 'upcoming', tournament: { ...next, id: 'later', name: 'Later event', startDate: '2027-02-01' } }, { type: 'upcoming', tournament: next }];
     fixture.candidates = new Map([['champ', { last: tournament(), seasonId: 'season', raceFinal: false }]]);
     const { container } = mount(<OverviewHero />);
-    expect(container.querySelector('.recap-next-up-name')?.textContent).toBe(next.name);
+    expect(container.querySelector('[data-recap-next-up] .ov48-next-name')?.textContent).toBe(next.name);
   });
   it('the band has no recap points figure or final-event text', () => {
     const { container } = mount(<RecapPhotoBand slide={slide} state={state} data={data} onOpen={() => {}} />);
```

### `src/test/tourChampionAvatarCandidates.test.tsx`

Reason: The champion glass card replaces the old overview PhotoBand/strip without changing champion face source selection.

- **renders the shared .tv-champion block with the narrative and "BY TWO", and drops the photo sentence and Full board link** → **renders the overview champion glass without the retired PhotoBand sentence or full-board link**

  Old assertion(s):

```ts
expect(fixture.photoProps?.segments).toEqual([]);
expect(fixture.photoProps?.onFullBoard).toBeUndefined();
```

  Replacement assertion(s):

```ts
expect(fixture.photoProps).toBeNull();
expect(container.querySelector('[data-overview-glass-card]')).not.toBeNull();
expect(container.querySelector('[data-overview-photo-situation]')).toBeNull();
expect(container.querySelector('[data-overview-full-board]')).toBeNull();
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/tourChampionAvatarCandidates.test.tsx b/src/test/tourChampionAvatarCandidates.test.tsx
index edf5b7be7a..a32ab8c918 100644
--- a/src/test/tourChampionAvatarCandidates.test.tsx
+++ b/src/test/tourChampionAvatarCandidates.test.tsx
@@ -82,7 +82,7 @@ describe('Tour champion avatar candidates', () => {
     expect(fixture.championProps?.playerKey).toBe('winner-key');
   });
 
-  it('renders the shared .tv-champion block with the narrative and "BY TWO", and drops the photo sentence and Full board link', () => {
+  it('renders the overview champion glass without the retired PhotoBand sentence or full-board link', () => {
     const slide: HeroSlide = { type: 'completed', tournament: {
       id: 'india', name: 'India Championship', status: 'closed', startDate: '2026-10-15', endDate: '2026-10-18',
       venueName: null, venueCourseName: null, venueCity: null, venueState: null, venueCountry: null, venuePar: 72, venueYardage: null,
@@ -101,7 +101,9 @@ describe('Tour champion avatar candidates', () => {
     // The photo band (mocked here) is handed no sentence and no Full board
     // link on a completed event with a champion; the band-height derivation
     // itself is pinned in tourOverviewMergedAiry against the real PhotoBand.
-    expect(fixture.photoProps?.segments).toEqual([]);
-    expect(fixture.photoProps?.onFullBoard).toBeUndefined();
+    expect(fixture.photoProps).toBeNull();
+    expect(container.querySelector('[data-overview-glass-card]')).not.toBeNull();
+    expect(container.querySelector('[data-overview-photo-situation]')).toBeNull();
+    expect(container.querySelector('[data-overview-full-board]')).toBeNull();
   });
 });
```

### `src/test/tourMoversNoTile.test.tsx`

Reason: The overview and shells now deliberately use three mover/pick tiles instead of the former unframed rows.

- **(a) has no border-top in the band or its shell**

  Old assertion(s):

```ts
expect(shell.style.borderTop).toBe('');
expect(shell.style.padding).toBe('12px 20px 10px');
```

  Replacement assertion(s):

```ts
expect(shell?.style.borderTop).toBe('');
expect(shell?.querySelectorAll('[data-shell-mover-card]')).toHaveLength(3);
```

- **(f) picks and mover shells both lose the tile** → **(f) hybrid picks and mover shells use three tiles each**

  Old assertion(s):

```ts
expect(card.style.border).toBe('');
expect(card.style.borderRadius).toBe('');
expect(card.style.padding).toBe('0px');
```

  Replacement assertion(s):

```ts
expect(container.querySelectorAll('[data-tour-shell="picks"] .ov48-tile')).toHaveLength(3);
expect(container.querySelectorAll('[data-tour-shell="movers"] .ov48-mover')).toHaveLength(3);
```

- **(g) Brief 44: the three-mover row and the movers shell row both use three equal columns**

  Old assertion(s):

```ts
expect(row.style.gridTemplateColumns).toBe('repeat(3, minmax(0,1fr))');
expect(row.style.marginTop).toBe('8px');
expect(row.querySelectorAll('[data-shell-mover-card]')).toHaveLength(3);
expect(row.querySelector('[style*="border-radius: 34%"]')).toBeNull();
```

  Replacement assertion(s):

```ts
expect(row?.querySelectorAll('[data-shell-mover-card]')).toHaveLength(3);
expect(row?.querySelector('[style*="border-radius: 34%"]')).toBeNull();
```

- **(h) the picks shell has no separator line**
  Assertions retain their meaning; updated shared selector/fixture access is quoted below.

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/tourMoversNoTile.test.tsx b/src/test/tourMoversNoTile.test.tsx
index 743b94c4e5..8783360492 100644
--- a/src/test/tourMoversNoTile.test.tsx
+++ b/src/test/tourMoversNoTile.test.tsx
@@ -12,14 +12,15 @@ import { EMPTY_OVERVIEW_SHAPE, TourOverviewShell } from '@/features/tourhub/comp
 afterEach(cleanup);
 const mount = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
 const card = (k: string) => ({ key: k, name: `Player ${k}`, candidates: [], delta: 2, toPar: -2, gross: 70 });
-const band = (n: number) => { const v = mount(<RoundMovementBand round={2} cards={['a', 'b', 'c'].slice(0, n).map(card)} />); const m = v.container.querySelector<HTMLElement>('[data-overview-movement]')!; return { m, row: m.children[1] as HTMLElement, cards: [...m.querySelectorAll<HTMLElement>('[data-overview-movement-card]')] }; };
+const band = (n: number) => { const v = mount(<RoundMovementBand round={2} cards={['a', 'b', 'c'].slice(0, n).map(card)} />); const m = v.container.querySelector<HTMLElement>('[data-overview-movement]'); if (!m) throw new Error('Missing movement band'); return { m, row: m.children[1] as HTMLElement, cards: [...m.querySelectorAll<HTMLElement>('[data-overview-movement-card]')] }; };
 
 describe('Biggest movers without tiles', () => {
   it('(a) has no border-top in the band or its shell', () => {
     expect(band(3).m.style.borderTop).toBe('');
     const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, movers: true }} />);
-    const shell = container.querySelector<HTMLElement>('[data-tour-shell="movers"]')!;
-    expect(shell.style.borderTop).toBe(''); expect(shell.style.padding).toBe('12px 20px 10px');
+    const shell = container.querySelector<HTMLElement>('[data-tour-shell="movers"]');
+    expect(shell?.style.borderTop).toBe('');
+    expect(shell?.querySelectorAll('[data-shell-mover-card]')).toHaveLength(3);
   });
   it('(b) Brief 44: three movers sit in three equal left-aligned columns', () => {
     const { row, cards } = band(3);
@@ -38,25 +39,21 @@ describe('Biggest movers without tiles', () => {
     const c = band(3).cards[0];
     expect(c.style.border).toBe(''); expect(c.style.background).toBe(''); expect(c.style.borderRadius).toBe(''); expect(c.querySelector('img')).toBeNull();
   });
-  it('(f) picks and mover shells both lose the tile', () => {
+  it('(f) hybrid picks and mover shells use three tiles each', () => {
     const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, movers: true, picks: { recordLines: 1, sentenceLines: 1 } } as never} />);
-    for (const sel of ['[data-tour-shell="picks"] [data-shell-small-card]', '[data-tour-shell="movers"] [data-shell-mover-card]']) {
-      const card = container.querySelector<HTMLElement>(sel)!;
-      expect(card.style.border).toBe(''); expect(card.style.borderRadius).toBe(''); expect(card.style.padding).toBe('0px');
-    }
+    expect(container.querySelectorAll('[data-tour-shell="picks"] .ov48-tile')).toHaveLength(3);
+    expect(container.querySelectorAll('[data-tour-shell="movers"] .ov48-mover')).toHaveLength(3);
   });
   it('(g) Brief 44: the three-mover row and the movers shell row both use three equal columns', () => {
     expect(band(3).row.style.gridTemplateColumns).toBe('repeat(3, minmax(0,1fr))');
     const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, movers: true }} />);
-    const row = container.querySelector<HTMLElement>('[data-tour-shell="movers"] [data-shell-mover-card]')!.parentElement as HTMLElement;
-    expect(row.style.gridTemplateColumns).toBe('repeat(3, minmax(0,1fr))');
-    expect(row.style.marginTop).toBe('8px');
-    expect(row.querySelectorAll('[data-shell-mover-card]')).toHaveLength(3);
-    expect(row.querySelector('[style*="border-radius: 34%"]')).toBeNull();
+    const row = container.querySelector<HTMLElement>('[data-tour-shell="movers"] .ov48-movers');
+    expect(row?.querySelectorAll('[data-shell-mover-card]')).toHaveLength(3);
+    expect(row?.querySelector('[style*="border-radius: 34%"]')).toBeNull();
   });
   it('(h) the picks shell has no separator line', () => {
     const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, picks: { recordLines: 1, sentenceLines: 1 } } as never} />);
-    const picks = container.querySelector<HTMLElement>('[data-tour-shell="picks"]')!;
+    const picks = container.querySelector<HTMLElement>('[data-tour-shell="picks"]'); if (!picks) throw new Error('Missing picks shell');
     expect(picks.querySelector('[data-overview-picks-hairline]')).toBeNull();
     expect([...picks.children].every(c => (c as HTMLElement).style.borderTop === '')).toBe(true);
   });
```

### `src/test/tourOverviewGate.test.tsx`

Reason: The hybrid loading shell reserves default hero/switcher/tiles/board/movers/course/picks geometry before optional lower bands.

- **missing shape draws the hero only** → **missing shape draws the default live hybrid geometry**

  Old assertion(s):

```ts
expect(shellNames(container)).toEqual(['hero']);
```

  Replacement assertion(s):

```ts
expect(shellNames(container)).toEqual(['hero', 'chips', 'tiles', 'board', 'movers', 'course', 'picks']);
```

- **fresh shape draws exactly its flagged shells in page order** → **fresh shape draws hybrid bands then its flagged lower shells in page order**

  Old assertion(s):

```ts
expect(shellNames(container)).toEqual(['hero', 'board', 'comingUp', 'news']);
```

  Replacement assertion(s):

```ts
expect(shellNames(container)).toEqual(['hero', 'chips', 'tiles', 'board', 'movers', 'course', 'picks', 'comingUp', 'news']);
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/tourOverviewGate.test.tsx b/src/test/tourOverviewGate.test.tsx
index 40ad74de5b..424f2e2cd4 100644
--- a/src/test/tourOverviewGate.test.tsx
+++ b/src/test/tourOverviewGate.test.tsx
@@ -14,8 +14,8 @@ describe('Tour overview one load', () => {
  it('holds every section until all five ids report, then reveals once', () => { const { container, rerender } = render(<Gate ready={['hero', 'stories', 'alsoThisWeek', 'comingUp']} />); expect(container.querySelector('[data-tour-overview-fallback]')).toBeTruthy(); expect(screen.getByTestId('hero').parentElement).toHaveStyle({ display: 'none' }); rerender(<Gate ready={[...TOUR_OVERVIEW_GATE_IDS]} />); expect(container.querySelector('[data-tour-overview-fallback]')).toBeNull(); expect(screen.getByTestId('hero').parentElement).not.toHaveStyle({ display: 'none' }); });
  it('disabled no-other-events queries count as settled without isLoading', () => { expect(overviewQueryReady({ status: 'pending' }, false)).toBe(true); expect(overviewQueryReady({ status: 'pending' }, true)).toBe(false); const { container } = render(<PageLoadGate expect={['alsoThisWeek']} fallback={<i data-testid="waiting" />}><Section id="alsoThisWeek" ready={overviewQueryReady({ status: 'pending' }, false)} /></PageLoadGate>); expect(container.querySelector('[data-testid="waiting"]')).toBeNull(); });
  it('waits on first-slide bands only, not later-slide reads', () => { function Band({ ready }: { ready: boolean }) { useOverviewBandReady('first-band', ready); useOverviewBandReady('later-band', false); return null; } const ui = (ready: boolean) => <PageLoadGate expect={['hero']} fallback={<i data-testid="waiting" />}><OverviewReadinessBand hero id="hero" base expect={['first-band']}><Band ready={ready} /></OverviewReadinessBand></PageLoadGate>; const { rerender } = render(ui(false)); expect(screen.queryByTestId('waiting')).toBeTruthy(); rerender(ui(true)); expect(screen.queryByTestId('waiting')).toBeNull(); });
- it('missing shape draws the hero only', () => { const { container } = render(<TourOverviewShell shape={readOverviewShape()} />); expect(shellNames(container)).toEqual(['hero']); });
- it('fresh shape draws exactly its flagged shells in page order', () => { localStorage.setItem('tour-overview-shape:v5:pga', JSON.stringify({ ...EMPTY_OVERVIEW_SHAPE, boardRows: 10, comingNext: { lastLines: 1, nameLines: 1 }, newsLead: true, at: Date.now() })); const { container } = render(<TourOverviewShell shape={readOverviewShape('pga')} />); expect(shellNames(container)).toEqual(['hero', 'board', 'comingUp', 'news']); });
+ it('missing shape draws the default live hybrid geometry', () => { const { container } = render(<TourOverviewShell shape={readOverviewShape()} />); expect(shellNames(container)).toEqual(['hero', 'chips', 'tiles', 'board', 'movers', 'course', 'picks']); });
+ it('fresh shape draws hybrid bands then its flagged lower shells in page order', () => { localStorage.setItem('tour-overview-shape:v5:pga', JSON.stringify({ ...EMPTY_OVERVIEW_SHAPE, boardRows: 10, comingNext: { lastLines: 1, nameLines: 1 }, newsLead: true, at: Date.now() })); const { container } = render(<TourOverviewShell shape={readOverviewShape('pga')} />); expect(shellNames(container)).toEqual(['hero', 'chips', 'tiles', 'board', 'movers', 'course', 'picks', 'comingUp', 'news']); });
  it('shape over twelve hours old falls back to hero only', () => { localStorage.setItem('tour-overview-shape:v5:all', JSON.stringify({ ...EMPTY_OVERVIEW_SHAPE, boardRows: 10, at: Date.now() - OVERVIEW_SHAPE_MAX_AGE - 1 })); expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE); });
  it('throwing and unreadable storage fall back to hero only', () => { localStorage.setItem('tour-overview-shape:v5:all', '{'); expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE); vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); }); expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE); });
  it('writes actual rendered shape once after reveal', () => { const spy = vi.spyOn(Storage.prototype, 'setItem'); function Content({ ready }: { ready: boolean }) { const ref = useRef<HTMLDivElement>(null); return <><Section id="hero" ready={ready} /><div ref={ref}><ShapeAfterReveal lens="pga" root={ref} /><div data-hero-board-row /><div id="content-below-hero"><div><div><section data-also-event /><section data-coming-next /><section data-rank-row /><section data-news-shape="hero" /></div></div></div></div></>; } const ui = (ready: boolean) => <PageLoadGate expect={['hero']}><Content ready={ready} /></PageLoadGate>; const { rerender } = render(ui(false)); expect(spy).not.toHaveBeenCalled(); rerender(ui(true)); expect(spy).toHaveBeenCalledTimes(1); expect(readOverviewShape('pga')).toMatchObject({ boardRows: 1, alsoEvents: [{ rows: 0, sitLines: 1 }], comingNext: { lastLines: 1, nameLines: 1 }, rankingsRows: 1, newsLead: true }); rerender(ui(false)); expect(spy).toHaveBeenCalledTimes(1); });
```

### `src/test/tourOverviewHeroFixes.test.tsx`

Reason: Only the overview tour prefix is uppercase; far-future start wording and first-tee exclusions remain.

- **the overview 53-day kicker reads STARTS 14 JAN and excludes FIRST TEE**

  Old assertion(s):

```ts
expect(container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('Champions · Starts 14 JAN');
```

  Replacement assertion(s):

```ts
expect(container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('CHAMPIONS TOUR · Starts 14 JAN');
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/tourOverviewHeroFixes.test.tsx b/src/test/tourOverviewHeroFixes.test.tsx
index aaec707fcc..4e29d0eabf 100644
--- a/src/test/tourOverviewHeroFixes.test.tsx
+++ b/src/test/tourOverviewHeroFixes.test.tsx
@@ -65,7 +65,7 @@ describe('Tour overview hero fixes', () => {
     const form = startDayForm(start, 'UTC', now);
     const slide = { type: 'upcoming', tournament: { id: 'event', name: 'Champions event', startDate: start, endDate: '2027-01-17', tourSlug: 'champ', tourName: 'Champions', venueName: 'Course' } } as HeroSlide;
     const { container } = mount(<><HybridHero slide={slide} state={{ kind: 'upcoming', variant: 'far', countdown: '', meta: '' }} now={now} activeTournamentId="event" onSelectTour={() => {}} onOpenTournament={() => {}} /><UpcomingFacts first="2027-01-14T08:00:00Z" zone="UTC" field={132} purse={3000000} par={72} yards={7000} startDayNamed={form.weekday} /></>);
-    expect(container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('Champions · Starts 14 JAN');
+    expect(container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('CHAMPIONS TOUR · Starts 14 JAN');
     expect(container.querySelector('[data-upcoming-fact="firstTee"]')).toBeNull();
     expect([...container.querySelectorAll('[data-upcoming-fact]')].map(c => c.getAttribute('data-upcoming-fact'))).toEqual(['field', 'purse', 'par', 'yards']);
     const caller = readFileSync('src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx', 'utf8');
```

### `src/test/tourOverviewShellV2.test.tsx`

Reason: Loading geometry follows the hybrid bands, five Coming up rows, two-line weekly cards, and retired sentence/LeadersGroup/next-panel removal.

- **renders present bands in page order and omits absent bands**

  Old assertion(s):

```ts
expect(names()).toEqual(['hero', 'chips', 'movers', 'board', 'picks', 'leaders', 'story', 'alsoThisWeek', 'comingUp', 'rankings', 'news']);
expect(names()).toEqual(['hero']);
```

  Replacement assertion(s):

```ts
expect(names()).toEqual(['hero', 'chips', 'tiles', 'board', 'movers', 'course', 'picks', 'alsoThisWeek', 'comingUp', 'story', 'rankings', 'news']);
expect(names()).toEqual(['hero', 'chips', 'tiles', 'board', 'movers', 'course', 'picks']);
```

- **renders exactly every remembered row and item count**

  Old assertion(s):

```ts
expect(container.querySelectorAll('[data-shell-leaders-row]')).toHaveLength(3);
expect(container.querySelectorAll('[data-shell-coming-row]')).toHaveLength(4);
expect(container.querySelectorAll('.coming-month')).toHaveLength(2);
```

  Replacement assertion(s):

```ts
expect(container.querySelectorAll('[data-shell-leaders-row]')).toHaveLength(0);
expect(container.querySelectorAll('[data-shell-coming-row]')).toHaveLength(5);
expect(container.querySelectorAll('.coming-month')).toHaveLength(0);
```

- **renders supplied player and situation parts without a tie cap** → **renders two name lines and two score lines per hybrid weekly card**

  Old assertion(s):

```ts
expect(events.map(node => node.querySelectorAll('[data-shell-board-row]').length)).toEqual([4, 3, 3]);
expect(events.map(node => node.querySelectorAll('.also-sit [data-shell-bar]').length)).toEqual([2, 1, 1]);
```

  Replacement assertion(s):

```ts
expect(events.map(node => node.querySelectorAll('[data-shell-board-row]').length)).toEqual([0, 0, 0]);
expect(events.map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([5, 5, 5]);
```

- **renders the supplied coming names and news headline and details lines**

  Old assertion(s):

```ts
expect([...container.querySelectorAll('.coming-row-name')].map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([1, 2, 1, 2]);
```

  Replacement assertion(s):

```ts
expect([...container.querySelectorAll('[data-shell-coming-row]')].map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([4, 4, 4, 4, 4]);
```

- **places the story outside the column with a 26px top margin** → **places the story inside the column after Coming up**

  Old assertion(s):

```ts
expect(story?.parentElement).toBe(column?.parentElement);
expect(story?.nextElementSibling).toBe(column);
expect(story).toHaveStyle({ marginTop: '26px' });
```

  Replacement assertion(s):

```ts
expect(story?.parentElement).toBe(column);
expect(story?.previousElementSibling).toBe(container.querySelector('[data-tour-shell="comingUp"]'));
```

- **draws exactly the supplied picks and Coming next lines** → **does not draw retired picks sentence or Coming next lines**

  Old assertion(s):

```ts
expect(container.querySelectorAll('[data-shell-picks-sentence] [data-shell-bar]')).toHaveLength(3);
expect(container.querySelectorAll('[data-shell-picks-record] [data-shell-bar]')).toHaveLength(2);
expect(container.querySelectorAll('.coming-name [data-shell-bar]')).toHaveLength(2);
expect(container.querySelectorAll('.coming-last-text [data-shell-bar]')).toHaveLength(3);
```

  Replacement assertion(s):

```ts
expect(container.querySelectorAll('[data-shell-picks-sentence] [data-shell-bar]')).toHaveLength(0);
expect(container.querySelectorAll('[data-shell-picks-record] [data-shell-bar]')).toHaveLength(0);
expect(container.querySelectorAll('.coming-name [data-shell-bar]')).toHaveLength(0);
expect(container.querySelectorAll('[data-tour-shell="picks"] .ov48-tile')).toHaveLength(3);
expect(container.querySelectorAll('[data-shell-coming-row]')).toHaveLength(1);
expect(container.querySelectorAll('.coming-last-text [data-shell-bar]')).toHaveLength(0);
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/tourOverviewShellV2.test.tsx b/src/test/tourOverviewShellV2.test.tsx
index ce4fb649cb..b38fcb23cc 100644
--- a/src/test/tourOverviewShellV2.test.tsx
+++ b/src/test/tourOverviewShellV2.test.tsx
@@ -25,8 +25,8 @@ describe('Tour counted skeleton shape v5', () => {
    function Content() { const ref = useRef<HTMLDivElement>(null); useSectionReady('hero', true); return <div ref={ref}><ShapeAfterReveal lens="all" root={ref} /><div data-overview-chip-row /><div data-overview-movement /><div data-hero-full-leaderboard /><div data-overview-picks /><div data-overview-story-band />{Array.from({ length: 10 }, (_, i) => <div key={i} data-hero-board-row />)}{full.alsoEvents.map((event, i) => <React.Fragment key={i}><div data-leaders-group-row /><div data-also-event data-overview-band="alsoThisWeek">{Array.from({ length: event.rows }, (_, j) => <div key={j} data-hero-board-row />)}<div className="also-sit" data-lines={event.sitLines} style={{ lineHeight: '20px' }} /></div></React.Fragment>)}<div data-coming-next />{full.comingMonths.map((month, i) => <React.Fragment key={i}><div data-coming-month />{month.map((lines, j) => <div key={j} data-coming-up-item><div className="coming-row-name" data-lines={lines} style={{ lineHeight: '20px' }} /></div>)}</React.Fragment>)}{[0, 1, 2, 3, 4].map(i => <div key={i} data-rank-row />)}<div data-climb-card /><div data-news-shape="hero" />{full.newsPair.map((item, i) => <News key={i} kind="pair" {...item} />)}{full.newsList.map((item, i) => <News key={i} kind="row" {...item} />)}</div>; }
    render(<PageLoadGate expect={['hero']}><Content /></PageLoadGate>); expect(readOverviewShape()).toEqual({ ...full, at: expect.any(Number) });
  });
- it('renders present bands in page order and omits absent bands', () => { const { container, rerender } = render(<TourOverviewShell shape={full} />); const names = () => [...container.querySelectorAll('[data-tour-shell]')].map(n => n.getAttribute('data-tour-shell')); expect(names()).toEqual(['hero', 'chips', 'movers', 'board', 'picks', 'leaders', 'story', 'alsoThisWeek', 'comingUp', 'rankings', 'news']); rerender(<TourOverviewShell shape={EMPTY_OVERVIEW_SHAPE} />); expect(names()).toEqual(['hero']); });
- it('renders exactly every remembered row and item count', () => { const { container } = render(<TourOverviewShell shape={full} />); expect(container.querySelectorAll('[data-tour-shell="board"] [data-shell-board-row]')).toHaveLength(10); expect(container.querySelectorAll('[data-shell-leaders-row]')).toHaveLength(3); expect(container.querySelectorAll('[data-shell-also-event]')).toHaveLength(3); expect(container.querySelectorAll('[data-shell-coming-row]')).toHaveLength(4); expect(container.querySelectorAll('.coming-month')).toHaveLength(2); expect(container.querySelectorAll('[data-shell-rank-row]')).toHaveLength(5); expect(container.querySelectorAll('[data-shell-news-list]')).toHaveLength(3); });
+ it('renders present bands in page order and omits absent bands', () => { const { container, rerender } = render(<TourOverviewShell shape={full} />); const names = () => [...container.querySelectorAll('[data-tour-shell]')].map(n => n.getAttribute('data-tour-shell')); expect(names()).toEqual(['hero', 'chips', 'tiles', 'board', 'movers', 'course', 'picks', 'alsoThisWeek', 'comingUp', 'story', 'rankings', 'news']); rerender(<TourOverviewShell shape={EMPTY_OVERVIEW_SHAPE} />); expect(names()).toEqual(['hero', 'chips', 'tiles', 'board', 'movers', 'course', 'picks']); });
+ it('renders exactly every remembered row and item count', () => { const { container } = render(<TourOverviewShell shape={full} />); expect(container.querySelectorAll('[data-tour-shell="board"] [data-shell-board-row]')).toHaveLength(10); expect(container.querySelectorAll('[data-shell-leaders-row]')).toHaveLength(0); expect(container.querySelectorAll('[data-shell-also-event]')).toHaveLength(3); expect(container.querySelectorAll('[data-shell-coming-row]')).toHaveLength(5); expect(container.querySelectorAll('.coming-month')).toHaveLength(0); expect(container.querySelectorAll('[data-shell-rank-row]')).toHaveLength(5); expect(container.querySelectorAll('[data-shell-news-list]')).toHaveLength(3); });
  it('contains only neutral surfaces and no svg', () => { const { container } = render(<TourOverviewShell shape={full} />); expect(container.querySelector('svg')).toBeNull(); const allowed = new Set(['', 'transparent', 'rgb(10, 10, 12)', 'rgb(22, 22, 26)', 'rgb(30, 30, 35)', 'rgb(38, 38, 44)']); for (const node of container.querySelectorAll<HTMLElement>('*')) { expect(allowed.has(node.style.backgroundColor)).toBe(true); expect(node.style.color).not.toMatch(/green|red|rgb\(0, 128, 0\)|rgb\(255, 0, 0\)/); } });
  it('rejects every malformed per-item array', () => {
    const bad: Record<string, unknown[]> = {
@@ -37,23 +37,23 @@ describe('Tour counted skeleton shape v5', () => {
    };
    for (const [key, values] of Object.entries(bad)) for (const value of values) { store({ [key]: value }); expect(readOverviewShape('all', 1000), `${key}: ${JSON.stringify(value)}`).toEqual(EMPTY_OVERVIEW_SHAPE); }
  });
- it('renders supplied player and situation parts without a tie cap', () => {
+ it('renders two name lines and two score lines per hybrid weekly card', () => {
    const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, alsoEvents: [{ rows: 4, sitLines: 2 }, { rows: 3, sitLines: 1 }, { rows: 3, sitLines: 1 }] }} />);
    const events = [...container.querySelectorAll('[data-shell-also-event]')];
    expect(events.map(node => node.querySelectorAll('[data-shell-tie-row]').length)).toEqual([0, 0, 0]);
-   expect(events.map(node => node.querySelectorAll('[data-shell-board-row]').length)).toEqual([4, 3, 3]);
-   expect(events.map(node => node.querySelectorAll('.also-sit [data-shell-bar]').length)).toEqual([2, 1, 1]);
+   expect(events.map(node => node.querySelectorAll('[data-shell-board-row]').length)).toEqual([0, 0, 0]);
+   expect(events.map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([5, 5, 5]);
  });
  it('renders the supplied coming names and news headline and details lines', () => {
    const { container } = render(<TourOverviewShell shape={full} />);
-   expect([...container.querySelectorAll('.coming-row-name')].map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([1, 2, 1, 2]);
+   expect([...container.querySelectorAll('[data-shell-coming-row]')].map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([4, 4, 4, 4, 4]);
    expect([...container.querySelectorAll('.overview-news-row h3')].map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([2, 3, 2]);
    expect([...container.querySelectorAll('.overview-news-row .overview-news-details')].map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([1, 2, 1]);
    expect([...container.querySelectorAll('.overview-news-pair h3')].map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([2, 2]);
  });
- it('places the story outside the column with a 26px top margin', () => {
+ it('places the story inside the column after Coming up', () => {
    const { container } = render(<TourOverviewShell shape={full} />); const story = container.querySelector('[data-tour-shell="story"]'); const column = container.querySelector('[data-shell-below-column]');
-   expect(story?.parentElement).toBe(column?.parentElement); expect(story?.nextElementSibling).toBe(column); expect(story).toHaveStyle({ marginTop: '26px' }); expect(column).toHaveStyle({ paddingTop: '32px', gap: '32px' });
+   expect(story?.parentElement).toBe(column); expect(story?.previousElementSibling).toBe(container.querySelector('[data-tour-shell="comingUp"]')); expect(column).toHaveStyle({ paddingTop: '32px', gap: '32px' });
  });
 
  it('rejects malformed v5 picks and Coming next objects', () => {
@@ -66,12 +66,14 @@ describe('Tour counted skeleton shape v5', () => {
    render(<PageLoadGate expect={['hero']}><Content /></PageLoadGate>);
    expect(readOverviewShape()).toMatchObject({ picks: { sentenceLines: 3, recordLines: 2 }, comingNext: { lastLines: 3, nameLines: 2 } });
  });
- it('draws exactly the supplied picks and Coming next lines', () => {
+ it('does not draw retired picks sentence or Coming next lines', () => {
    const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, picks: { sentenceLines: 3, recordLines: 2 }, comingNext: { lastLines: 3, nameLines: 2 } }} />);
-   expect(container.querySelectorAll('[data-shell-picks-sentence] [data-shell-bar]')).toHaveLength(3);
-   expect(container.querySelectorAll('[data-shell-picks-record] [data-shell-bar]')).toHaveLength(2);
-   expect(container.querySelectorAll('.coming-name [data-shell-bar]')).toHaveLength(2);
-   expect(container.querySelectorAll('.coming-last-text [data-shell-bar]')).toHaveLength(3);
+   expect(container.querySelectorAll('[data-shell-picks-sentence] [data-shell-bar]')).toHaveLength(0);
+   expect(container.querySelectorAll('[data-shell-picks-record] [data-shell-bar]')).toHaveLength(0);
+   expect(container.querySelectorAll('.coming-name [data-shell-bar]')).toHaveLength(0);
+   expect(container.querySelectorAll('[data-tour-shell="picks"] .ov48-tile')).toHaveLength(3);
+   expect(container.querySelectorAll('[data-shell-coming-row]')).toHaveLength(1);
+   expect(container.querySelectorAll('.coming-last-text [data-shell-bar]')).toHaveLength(0);
  });
 
  it('counts one text line inside a padded min-height record row', () => {
```

## Accepted full-suite results

The accepted combined run covered Briefs 48–48C and 49 together, sequentially on 28 November 2026. No tests were re-run for this screenshot/report-only request.

```text
npx vitest run --maxWorkers=2 --shard=1/4
npx vitest run --maxWorkers=2 --shard=2/4
npx vitest run --maxWorkers=2 --shard=3/4
npx vitest run --maxWorkers=2 --shard=4/4
```

| Shard | Passed tests | Passed files | UTC start | Duration |
|---|---:|---:|---|---:|
| 1/4 | 2,597 | 240 | 09:10:33 | 340.42s |
| 2/4 | 2,580 | 240 | 09:16:37 | 362.38s |
| 3/4 | 2,767 | 240 | 09:23:03 | 564.89s |
| 4/4 | 2,915 | 240 | 09:32:41 | 545.10s |
| **Total** | **10,859** | **960** | | |

**Zero failures.** Last passing baseline: **10,804 tests / 955 files** at `6b450d8dc8`. Difference: **+55 tests / +5 files**. Compared with the previous 10,859/960 attempt, suite scope is unchanged; its one obsolete parity assertion is now authorised and passing. No pre-existing failures are carried into the passing baseline or the accepted run.

| Added test file | Added executed cases |
|---|---:|
| `src/test/tourOverviewHybrid48.test.tsx` | 37 |
| `src/test/overviewUpcomingCupRead.test.tsx` | 3 |
| `src/test/overviewHybridPhotoNavigation.test.tsx` | 2 |
| `src/test/brief49ClubhousePostArrival.test.tsx` | 8 |
| `src/test/brief49TopTenAlertsPills.test.tsx` | 5 |
| **Total** | **55** |

Briefs 48–48C contribute **42 cases / 3 files**; Brief 49 contributes **13 cases / 2 files**. Rewritten existing cases contribute no count delta. Full runner logs are retained at `.lovable/reports/brief49/close/shard1.log` through `shard4.log`. The complete 55-case addition inventory, with parameterized names expanded, is in [test-delta.md](test-delta.md).

## 4. Screenshots and observations

| Requested view | Captured event/data | Widths | Evidence filenames |
|---|---|---|---|
| Live overview | BMW Australian PGA Championship, **between rounds / ROUND 3 COMPLETE** | 390, 320 | `live-between-rounds-real-*` |
| Final overview | The Farmers Insurance Skins Game, actual finished result: Jackson Koivun 7 skins, last 4 in a playoff | 390, 320 | `final-skins-real-*` |
| Completed stroke supplement | Clearly labelled four-player Australian PGA illustrative final; not the real event result | 390, 320 | `final-stroke-overview-fixture-*` |
| Upcoming overview | Grant Thornton Invitational, LPGA slide, 11–13 December | 390, 320 | `upcoming-real-*` |
| Season finished | Champions Tour 2026 recap, Stewart Cink; Sony Championship Hawaii Next up | 390, 320 | `season-finished-real-*` |
| Skins slide | Four-player 16-of-18-hole illustrative live scenario | 390 | `skins-overview-fixture-390.png` |
| Team slide | Illustrative ten-team Grant Thornton field led by Kim / Wilson | 390 | `team-overview-fixture-390.png` |

The public live event was between rounds when captured, so its neutral no-dot kicker is expected; the green in-play team and skins variants are represented by test data. No completed stroke event was the selected current overview slide, so the actual completed Skins slide supplies the real final evidence, with an extra labelled stroke fixture. The available upcoming overview slide was Grant Thornton; Hero World Challenge remains visible in Coming up. The available season-finished overview was Champions, not a fabricated PGA recap.

Real screenshot metrics: root client/scroll width agree at 390 and 320; photo band height 460px; title 30px at 390 and 26px at 320. Visual review confirms the five switcher segments fit and the narrow live board hides the previous round. The final stroke supplement shows R3/R4 at 320. Conditional sections absent from actual reads were not filled with invented live data; these captures do not prove every optional chart/picks/cards state or every format. Fixture backgrounds/header framing are disclosed in the screenshot index.

No final capture page errors were recorded. Temporary capture-script module/provider and data-shape errors were resolved **in the apparatus only**, without app or test changes. The screenshots, source labels and geometry manifest are in the delivered screenshot archive.

## 5. Historical stops and accepted corrections

- The earlier preserved-navigation regression at `tourOverviewPicksChipsFullBoard.test.tsx:265` reported `expected "spy" to be called 1 times, but got 0 times`. Ben approved restoring the root photo band click/Enter/Space handlers, label and focusability; the protecting test was not edited, and the accepted full run passes it.
- The initial old-layout diagnostic failures are retained in `historical-attempts.md`/`close-audit.log`; they are not carried as pre-existing failures in the final passing suite. Their authorised rewrites are named and quoted above.
- Below 360px hero title/name/figure are 26/14/28px; the narrow hardest/easiest gap is 10px.
- Every 800 weight in these briefs/mocks is 700 under Ben's ruling; other sizes, colours and tracking remain as specified.
- Upcoming cup slides alone may mount the unchanged cup leaderboard read. Two team rows show the cup card; error/fewer rows use the ordinary countdown. Other slides add no cup read.

## process-push-queue deployment

**Successfully deployed**, using the existing worker and its shared `notifRoute.ts` import. The deployment tool confirmed:

```text
Successfully deployed edge functions: process-push-queue
process-push-queue source_sha256:
04b15a2dba54222272ca421d0ac32d2cbec18d20922c9c7a1e889efde1b25584
```

This is deployment confirmation, not verification of an actual delivered native push. No queue processing or notification send was invoked for screenshots. Previously delivered `/post/<id>` links remain supported.

## Scope and constraints

This final request changed **reports and evidence only**: no application, test, function or configuration changes, no additional test run, no new deployment or push sent. The accepted source remains `b409d1ef40`.

No SQL, migrations or migration files. `feed_config` untouched; `round_pool_cap` remains 30. No native/Median changes and no security “Fix all”. No new security scan was requested or run, so this report makes no new security-findings claim. No credentials requested or authentication bypass added to the app. Temporary test-data readers/providers are confined to isolated browser fixtures and cannot contact the live backend.
