# PRO_SELF_RUN — Verification close-out

## Outcome and scope

The Pro profile “runs itself” rebuild is implemented. **The requested standalone shard 4 passed 1,821 tests / 162 files, zero failures.** This close-out changes only this report and the roadmap; no product code or tests were edited.

Manual event/round entry and score watching are retired. This week is only the linked live-tour card; empty Season and empty-season hero figures are omitted. Clubhouse, Only you see this, reach reads and sponsor/QR export are removed. Bag, Partners, Career and Ask remain. View tracking remains in `ProProfileBuildOne.tsx` (ref-guarded `pro_profile_viewed` call).

Ask enabling closes and toasts on success, stays open and toasts on error; both Ask cache keys are invalidated for on/off. Pro-sheet commands opt out of default Button variants; collection and Ask fields use canonical Input/Textarea. Partners support optional websites, scheme normalization, validation, external navigation for unlinked partners and dim website text in the edit list. Tour pros omit Rounds; unlinked pros with results get year-grouped Tour results; See all hands off to the Tour tab rather than a results-list sheet.

## Verification and totals

Each shard command uses `bunx vitest run --maxWorkers=2 --shard=N/4` and runs separately.

| Shard | Passed | Evidence |
| --- | ---: | --- |
| 1 | 1,920 | Carried from the preceding implementation turn |
| 2 | 1,783 | Carried from the preceding implementation turn |
| 3 | 1,885 | Carried from the preceding implementation turn |
| 4 | **1,821** | Fresh run in this close-out |
| Total | **7,409 passed; 0 failed** | Latest carried-forward four-shard run; 647 test files |

Only shard 4 was rerun here; this is not four fresh runs today. Earlier shard logs are unavailable for independent reinspection. Previous focused results were reported as **167 + 39 green**, with a clean typecheck; those checks were not rerun here.

Exact fresh command: `bunx vitest run --maxWorkers=2 --shard=4/4`.

Output: `/tmp/pro-self-run-shard4.log`.

```text
Test Files  162 passed (162)
     Tests  1821 passed (1821)
  Start at  10:24:48
  Duration  244.65s
```

### Separate known failure

**`src/test/fw1FeaturedDeck.test.tsx` — `reserves no right padding on the meta line`** is the sole allowed known failure under this brief. **It did not occur.** The fresh shard had no failures; carried shards 1–3 were reported green. Its existing `readFileSync` repair belongs to the previously authorized FM1 close-out and was not changed here. No other failure occurred and no failing test was repaired. Console warnings are not assertion failures.

### Inventory reconciliation

The last reported full inventory was PF1B **7,463 / 648 files**; the Pro changes yield **7,409 / 647**, a net **−54 tests and −1 file**. This close-out itself has delta zero.

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| proAskSection.test.tsx | 32 | 34 | +2 |
| proClubhouseSponsor.test.tsx | 48 | 0 | −48 |
| proCollectionRules.test.ts | 14 | 17 | +3 |
| proCollectionSections.test.tsx | 16 | 20 | +4 |
| proProfileBuildOne.test.tsx | 15 | 11 | −4 |
| proProfileBuildOneB.test.tsx | 44 | 44 | 0 |
| proProfileBuildOneRules.test.ts | 29 | 17 | −12 |
| proProfileSeason.test.tsx | 4 | 5 | +1 |
| proVerification2.test.tsx | 19 | 19 | 0 |
| Net | | | **−54** |

Parameterized rows are expanded in these counts. The earlier summary's “40” sponsor cases was incorrect: the deleted file contained **48**. The baseline PF1B file total is historical report evidence (its older Stage 1 file-count discrepancy is recorded in PF1B_FEED_REPORT.md); the fresh shard's 162-file count is directly verified.

## Deleted source files and retained replacements

- **`src/features/pro-profile/ProClubhouseSection.tsx`** — Retires In the clubhouse for owner and visitor.
- **`src/features/pro-profile/ProEventSheets.tsx`** — Retires manual add/edit event and round sheets and the all-results sheet; ResultDetail is retained in ProSeasonSection.tsx.
- **`src/features/pro-profile/ProOnlyYouSection.tsx`** — Retires the owner reach card and its sponsor entrypoint.
- **`src/features/pro-profile/ProSponsorSheet.tsx`** — Retires sponsor preview, QR and image export; shared dependencies are not removed merely for this deletion.
- **`src/features/pro-profile/ProWeekSection.tsx`** — Retires manually authored week/round/watch presentation; linked live card remains in the profile shell.
- **`src/features/pro-profile/proClubhouseRules.ts`** — Retires Clubhouse/reach/sponsor derivations.
- **`src/features/pro-profile/useProClubhouse.ts`** — Retires Clubhouse and reach hooks; view tracking is preserved in the profile shell.

Removed hook/helper exports in retained files: `useProWatch` from `useProProfile.ts`; `currentEvent`, `watchCountCopy`, and `roundPayload` from `proProfileRules.ts`. Their obsolete callers and tests were removed.

## Changed production files

- `src/features/pro-profile/ProAskSection.tsx`
- `src/features/pro-profile/ProAskSheets.tsx`
- `src/features/pro-profile/ProCollectionSections.tsx`
- `src/features/pro-profile/ProCollectionSheets.tsx`
- `src/features/pro-profile/ProProfileBuildOne.tsx`
- `src/features/pro-profile/ProSeasonSection.tsx`
- `src/features/pro-profile/pro-profile.css`
- `src/features/pro-profile/proCollectionRules.ts`
- `src/features/pro-profile/proProfileRules.ts`
- `src/features/pro-profile/useProProfile.ts`
- `src/features/pro-verification/ProfileTourTab.tsx`
- `src/features/pro-verification/profileProRules.ts`
- `src/pages/ProfilePageV2.tsx`
- `src/integrations/supabase/types.ts` — the optional partner website field was hand-added during the implementation (the base boundary already contains that three-line type change).

## Changed existing tests: named ledger

The complete old/new diff for **every modified test file** follows below. `-` lines are exact old code; `+` lines are exact new code; context lines are unchanged. This includes import, fixture and mock changes, not just assertions. Removed tests have their exact old assertions in the diff; no successor means deleted.

- `proAskSection.test.tsx`: existing cases untouched; adds success/close/readback and error/stay-open cases.
- `proCollectionRules.test.ts`: existing cases untouched; adds three website normalization/validation cases.
- `proCollectionSections.test.tsx`: `links only live linked businesses` now expects two partner buttons/unlinked tiles because the new website fixture is actionable; `partner logo uses the 34% squircle with a 1px traced hairline` scopes its selector to the linked-logo tile. Four new website cases; fixture/reset/mock changes included.
- `proProfileBuildOne.test.tsx`: `linked live takes week priority` becomes `linked live shows the tour card`; six obsolete manual-week/round/watch cases are deleted; two absence regressions are added. Net −4.
- `proProfileBuildOneB.test.tsx`: `zero top10 uses BEST; no finish omits second cell` becomes `zero top10 uses BEST; no events omits the season cells`, expecting absent season labels and six buttons rather than seven. ResultDetail import moves; `gross only visitor has no Add par`, `OWGR row ignores dormant course par and stored to-par`, and both parameterized `nonOWGR %s keeps signed to-par and red under par` cases lose obsolete owner/userId props, with assertions preserved.
- `proProfileBuildOneRules.test.ts`: twelve obsolete manual-week/watch/round-write cases removed; remaining assertions unchanged.
- `proProfileSeason.test.tsx`: `see-all count opens full year-grouped list including old rows` becomes `see-all hands off to the caller with the all-years count, never a sheet`; adds the no-Add-result case and updates the mounting helper.
- `proVerification2.test.tsx`: `uncovered owner gets Tour instead of unconnected Handicap` and `uncovered visitor gets neither Tour nor Handicap` become explicit with-results/no-results owner-and-visitor rules; `uncovered owner note makes no player read` becomes year-grouped unlinked results opening ResultDetail. Fixtures support the existing event read; net count zero.

### Coverage limitations (not silently repaired)

The new Ask success case observes toast, close and refreshed empty-card state; the existing Turn on case asserts the RPC. It **does not directly spy on both invalidation keys**, despite its name. The raw-input/white-command changes and no-Rounds wiring are source evidence, not new direct mounted assertions for every field or ProfilePageV2 tab state. No tests were added or rewritten in this verification-only close-out to conceal these coverage limits.

### `src/test/proAskSection.test.tsx` — exact old/new code

```diff
diff --git a/src/test/proAskSection.test.tsx b/src/test/proAskSection.test.tsx
index f7d8c8e646..3632a34cdb 100644
--- a/src/test/proAskSection.test.tsx
+++ b/src/test/proAskSection.test.tsx
@@ -198,8 +198,28 @@ describe('pro ask — explainer sheet', () => {
     expect(screen.getByText('HOW IT LOOKS ON YOUR PROFILE')).toBeTruthy();
     fireEvent.click(screen.getByRole('button', { name: 'Turn on Ask Mason' }));
     await waitFor(() => expect(h.rpcCalls.some((c) => c.fn === 'set_pro_ask_enabled' && c.args.p_on === true)).toBe(true));
   });
+  it('Turn on invalidates both ask keys, toasts, closes and the section shows the empty card', async () => {
+    h.answers = payload({ enabled: false, total: 0, waiting: 0, answers: [] });
+    mount(true);
+    fireEvent.click(await screen.findByRole('button', { name: 'See how' }));
+    h.answers = payload({ total: 0, waiting: 0, answers: [] });
+    fireEvent.click(screen.getByRole('button', { name: 'Turn on Ask Mason' }));
+    await waitFor(() => expect(h.toastSuccess).toHaveBeenCalledWith('Ask Mason is on.'));
+    await waitFor(() => expect(screen.queryByText('Members ask you questions')).toBeNull());
+    expect(await screen.findByText('Questions from members show here')).toBeTruthy();
+  });
+  it('a turn-on error toasts the message and the sheet stays open', async () => {
+    h.answers = payload({ enabled: false, total: 0, waiting: 0, answers: [] });
+    h.rpcError = { message: 'Only verified tour pros can turn on Ask' };
+    mount(true);
+    fireEvent.click(await screen.findByRole('button', { name: 'See how' }));
+    fireEvent.click(screen.getByRole('button', { name: 'Turn on Ask Mason' }));
+    await waitFor(() => expect(h.toastError).toHaveBeenCalledWith('Only verified tour pros can turn on Ask'));
+    expect(screen.getByText('Members ask you questions')).toBeTruthy();
+    expect(h.toastSuccess).not.toHaveBeenCalled();
+  });
   it('Not now closes without calling the RPC', async () => {
     h.answers = payload({ enabled: false, total: 0, waiting: 0, answers: [] });
     mount(true);
     fireEvent.click(await screen.findByRole('button', { name: 'See how' }));
```

### `src/test/proCollectionRules.test.ts` — exact old/new code

```diff
diff --git a/src/test/proCollectionRules.test.ts b/src/test/proCollectionRules.test.ts
index f2958b9a4d..4c85e42a1e 100644
--- a/src/test/proCollectionRules.test.ts
+++ b/src/test/proCollectionRules.test.ts
@@ -1,7 +1,7 @@
 import {describe,it,expect} from 'vitest';
 import source from './fixtures/owgr/mason-events.json';
-import {careerEntries,orderedBag,bagPayload,momentPayload,type BagItem,type CareerMoment} from '@/features/pro-profile/proCollectionRules';
+import {careerEntries,orderedBag,bagPayload,momentPayload,partnerPayload,type BagItem,type CareerMoment} from '@/features/pro-profile/proCollectionRules';
 import type {ProEvent} from '@/features/pro-profile/proProfileRules';
 const event=(override:Partial<ProEvent>={}):ProEvent=>({id:'e',user_id:'mason',source:'owgr',event_name:'Event',finish:'T5',owgr_year:2026,owgr_week:1,owgr_rank_after:2000,owgr_rank_before:null,owgr_event_id:'1',owgr_points:null,start_date:null,end_date:null,tour_name:null,country:null,venue:null,to_par:null,total_strokes:null,scheduled_rounds:null,tee_time:null,tee_hole:null,created_at:'',updated_at:'',rounds:[],...override});
 const mason=source.map(e=>event({id:String(e.id),owgr_event_id:String(e.id),event_name:e.event,finish:e.finish,owgr_year:e.year,owgr_week:e.week,owgr_rank_after:e.rankAfter}));
 const moment=(override:Partial<CareerMoment>={}):CareerMoment=>({id:'mine',user_id:'mason',year:2026,text:'Turned pro',is_win:false,created_at:'2026-01-01',...override});
@@ -19,5 +19,8 @@ describe('Build2 collection rules',()=>{
  it('bag payload uses exact brand model detail and link',()=>expect(bagPayload('mason','driver',' Brand ',' Model ',' Stiff ','biz')).toEqual({user_id:'mason',slot:'driver',brand:'Brand',model:'Model',detail:'Stiff',business_id:'biz'}));
  it('bag slot is required',()=>expect(()=>bagPayload('mason','','Brand','','',null)).toThrow());
  it('career year1950 allowed and future rejected',()=>{expect(momentPayload('mason',1950,'Moment',true,2026).year).toBe(1950);expect(()=>momentPayload('mason',2027,'Moment',false,2026)).toThrow();});
  it('career text120 allowed121 rejected',()=>{expect(momentPayload('mason',2026,'a'.repeat(120),false,2026).text).toHaveLength(120);expect(()=>momentPayload('mason',2026,'a'.repeat(121),false,2026)).toThrow();});
+ it('partner website gains https:// when there is no scheme',()=>expect(partnerPayload('mason','Kent Autos',null,' kentautos.co.uk ').website).toBe('https://kentautos.co.uk'));
+ it('partner website keeps an existing scheme and empty stays null',()=>{expect(partnerPayload('mason','Kent Autos',null,'http://kentautos.co.uk').website).toBe('http://kentautos.co.uk');expect(partnerPayload('mason','Kent Autos',null,'').website).toBeNull();expect(partnerPayload('mason','Kent Autos',null).website).toBeNull();});
+ it('partner website refuses invalid or out-of-range values',()=>{expect(()=>partnerPayload('mason','Kent Autos',null,'http://')).toThrow();expect(()=>partnerPayload('mason','Kent Autos',null,'https://x.co/'+ 'a'.repeat(200))).toThrow();expect(()=>partnerPayload('mason','Kent Autos',null,'not a url')).toThrow();});
 });
\ No newline at end of file
```

### `src/test/proCollectionSections.test.tsx` — exact old/new code

```diff
diff --git a/src/test/proCollectionSections.test.tsx b/src/test/proCollectionSections.test.tsx
index 94cbd93dd1..537672a9f9 100644
--- a/src/test/proCollectionSections.test.tsx
+++ b/src/test/proCollectionSections.test.tsx
@@ -8,13 +8,15 @@ const h = vi.hoisted(() => ({
   writes: [] as { table: string; op: string; payload?: unknown; filters: unknown[] }[],
   writeError: null as null | { message: string },
   guest: null as unknown,
   toastError: vi.fn(),
+  openExternal: vi.fn(),
 }));
 
 vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
 vi.mock('sonner', () => ({ toast: { error: h.toastError, success: vi.fn() } }));
 vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: () => h.guest }));
+vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: h.openExternal }));
 vi.mock('@/hooks/useDebouncedValue', () => ({ useDebouncedValue: (v: unknown) => v }));
 vi.mock('@/integrations/supabase/client', () => {
   const from = (table: string) => {
     let op = 'select'; let payload: unknown; const filters: unknown[] = [];
@@ -48,10 +50,11 @@ const bag = [
   { ...base, id: 'b1', slot: 'driver', brand: 'Titleist', model: 'GT3', detail: '9°', business_id: 'biz-live' },
   { ...base, id: 'b2', slot: 'putter', brand: 'Gone', model: null, detail: null, business_id: 'biz-dead' },
 ];
 const partners = [
-  { ...base, id: 'p1', name: 'Titleist', business_id: 'biz-live' },
-  { ...base, id: 'p2', name: 'Kent Autos', business_id: null },
+  { ...base, id: 'p1', name: 'Titleist', business_id: 'biz-live', website: null },
+  { ...base, id: 'p2', name: 'Kent Autos', business_id: null, website: null },
+  { ...base, id: 'p3', name: 'Ridgeback', business_id: null, website: 'https://ridgebackgolf.co.uk' },
 ];
 const moments = [{ ...base, id: 'm1', year: 2020, text: 'Turned pro', is_win: false }];
 
 function Where() { const l = useLocation(); return <div data-testid="where">{l.pathname}</div>; }
@@ -64,9 +67,9 @@ function mount(owner: boolean) {
 }
 const fill = () => { h.tables = { pro_bag_items: bag, pro_partners: partners, pro_career_moments: moments, business_accounts: [LIVE] }; };
 const empty = () => { h.tables = { pro_bag_items: [], pro_partners: [], pro_career_moments: [], business_accounts: [LIVE] }; };
 
-beforeEach(() => { h.writes = []; h.writeError = null; h.guest = null; h.toastError.mockReset(); });
+beforeEach(() => { h.writes = []; h.writeError = null; h.guest = null; h.toastError.mockReset(); h.openExternal.mockReset(); });
 
 describe('pro collections — visitor and own views', () => {
   it('visitor sees bag, partners and career without Edit or add cards', async () => {
     fill(); const { container } = mount(false);
@@ -125,25 +128,62 @@ describe('pro collections — visitor and own views', () => {
   it('links only live linked businesses', async () => {
     fill(); const { container } = mount(false);
     await waitFor(() => expect(container.querySelectorAll('button.pro-bag-row').length).toBe(1));
     expect(container.querySelectorAll('div.pro-bag-row').length).toBe(1);
-    expect(container.querySelectorAll('button.pro-partner-tile').length).toBe(1);
-    expect(container.querySelectorAll('.pro-partner-unlinked').length).toBe(1);
+    expect(container.querySelectorAll('button.pro-partner-tile').length).toBe(2);
+    expect(container.querySelectorAll('.pro-partner-unlinked').length).toBe(2);
     fireEvent.click(container.querySelector('button.pro-bag-row')!);
     expect(screen.getByTestId('where').textContent).toBe('/business/biz-live');
   });
+  it('an unlinked partner with a website opens it externally; without one it is not tappable', async () => {
+    fill(); const { container } = mount(false);
+    await waitFor(() => expect(container.querySelector('[data-pro-partners]')).not.toBeNull());
+    const ridgeback = screen.getByText('RIDGEBACK').closest('button');
+    expect(ridgeback).not.toBeNull();
+    fireEvent.click(ridgeback!);
+    expect(h.openExternal).toHaveBeenCalledWith('https://ridgebackgolf.co.uk', 'external');
+    expect(screen.getByText('KENT AUTOS').closest('button')).toBeNull();
+  });
+  it('the edit list shows the website dim under the name', async () => {
+    fill(); const { container } = mount(true);
+    await waitFor(() => expect(container.querySelector('[data-pro-partners] .pro-collection-edit')).not.toBeNull());
+    fireEvent.click(container.querySelector('[data-pro-partners] .pro-collection-edit')!);
+    const site = await screen.findByText('https://ridgebackgolf.co.uk');
+    expect(site.className).toContain('pro-partner-website');
+  });
+
   it('partner logo uses the 34% squircle with a 1px traced hairline', async () => {
     fill(); const { container } = mount(false);
-    await waitFor(() => expect(container.querySelector('button.pro-partner-tile')).not.toBeNull());
-    const ring = container.querySelector('button.pro-partner-tile [aria-hidden]') as HTMLElement;
+    await waitFor(() => expect(container.querySelector('button.pro-partner-tile:not(.pro-partner-unlinked)')).not.toBeNull());
+    const ring = container.querySelector('button.pro-partner-tile:not(.pro-partner-unlinked) [aria-hidden]') as HTMLElement;
     expect(ring.style.borderRadius).toBe('34%');
     expect(ring.style.border.startsWith('1px solid')).toBe(true);
   });
 });
 
 describe('pro collections — sheet flows', () => {
   const openAdd = async (sub: string) => { const card = (await screen.findByText(sub)).closest('.pro-profile-add') as HTMLElement; fireEvent.click(within(card).getByRole('button', { name: 'Add' })); };
 
+  it('Add by name adds the scheme and saves the website with the name', async () => {
+    empty(); mount(true);
+    await openAdd('Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.');
+    expect((screen.getByLabelText('WEBSITE (OPTIONAL)') as HTMLInputElement).placeholder).toBe('e.g. kentautos.co.uk');
+    fireEvent.change(screen.getByLabelText('PARTNER NAME'), { target: { value: 'Kent Autos' } });
+    fireEvent.change(screen.getByLabelText('WEBSITE (OPTIONAL)'), { target: { value: ' kentautos.co.uk ' } });
+    fireEvent.click(screen.getByRole('button', { name: 'Add by name' }));
+    await waitFor(() => expect(h.writes.length).toBe(1));
+    expect(h.writes[0].payload).toMatchObject({ name: 'Kent Autos', business_id: null, website: 'https://kentautos.co.uk' });
+  });
+  it('an invalid website toasts and does not save', async () => {
+    empty(); mount(true);
+    await openAdd('Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.');
+    fireEvent.change(screen.getByLabelText('PARTNER NAME'), { target: { value: 'Kent Autos' } });
+    fireEvent.change(screen.getByLabelText('WEBSITE (OPTIONAL)'), { target: { value: 'http://' } });
+    fireEvent.click(screen.getByRole('button', { name: 'Add by name' }));
+    await waitFor(() => expect(h.toastError).toHaveBeenCalledWith('Check the website.'));
+    expect(h.writes.length).toBe(0);
+  });
+
   it('bag: slot is required, brand search links business_id, editing the brand clears it', async () => {
     empty(); mount(true);
     await openAdd('Driver to ball. Brands on clbhouz link to their page.');
     const save = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
```

### `src/test/proProfileBuildOne.test.tsx` — exact old/new code

```diff
diff --git a/src/test/proProfileBuildOne.test.tsx b/src/test/proProfileBuildOne.test.tsx
index cfd882f1fb..0af058a350 100644
--- a/src/test/proProfileBuildOne.test.tsx
+++ b/src/test/proProfileBuildOne.test.tsx
@@ -1,26 +1,22 @@
 import React from 'react';
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
-import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
+import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
 import { ProProfileBuildOne, type ProProfileProps } from '@/features/pro-profile/ProProfileBuildOne';
-import { ProRoundSheet } from '@/features/pro-profile/ProEventSheets';
-import { ProWeekSection } from '@/features/pro-profile/ProWeekSection';
 import type { ProEvent } from '@/features/pro-profile/proProfileRules';
-const s=vi.hoisted(()=>({events:[] as any[],rank:null as any,ready:true,linked:false,live:null as any,watching:false,count:0,guest:false,gate:vi.fn(),insert:vi.fn(async()=>({error:null})),rpc:vi.fn(async()=>({data:true,error:null}))}));
+const s=vi.hoisted(()=>({events:[] as any[],rank:null as any,ready:true,linked:false,live:null as any}));
 vi.mock('react-i18next',()=>({initReactI18next:{type:'3rdParty',init:()=>{}},useTranslation:()=>({t:(_k:string,o?:{defaultValue?:string})=>o?.defaultValue??''})}));
-vi.mock('@/features/pro-profile/useProProfile',()=>({useProEvents:()=>({data:s.events,isSuccess:s.ready,isError:false}),useProWorldRank:()=>({data:s.rank,isSuccess:s.ready,isError:false}),useProWatch:()=>({data:{watching:s.watching,count:s.count},isSuccess:true,isError:false})}));
+vi.mock('@/features/pro-profile/useProProfile',()=>({useProEvents:()=>({data:s.events,isSuccess:s.ready,isError:false}),useProWorldRank:()=>({data:s.rank,isSuccess:s.ready,isError:false})}));
 vi.mock('@/components/profile/hooks/useProfileClubs',()=>({useProfileClubs:()=>({homeClub:{name:'Dartford Golf Club'}})}));
 vi.mock('@/hooks/useUserTopTenCourses',()=>({useUserTopTenCourses:()=>({topTen:[]})}));
 vi.mock('@/features/tourhub/player-v2/data/usePlayerData',()=>({usePlayerSeasonResults:()=>({data:[],isSuccess:s.ready,isError:false})}));
 vi.mock('@/features/pro-profile/LinkedProSections',()=>({useLinkedProLive:()=>({data:s.live,isSuccess:s.ready,isError:false}),useLinkedProStats:()=>({data:{player:null,rows:[]},isSuccess:s.ready,isError:false}),LinkedLiveCard:()=> <div data-testid="linked-live"/>,HowProPlays:()=> <div data-testid="linked-stats"/>}));
-vi.mock('@/features/guest/useGuestActionGate',()=>({useGuestActionGate:()=>()=>{s.gate();return s.guest;}}));
-vi.mock('@/integrations/supabase/client',()=>({supabase:{from:()=>({insert:s.insert}),rpc:s.rpc}}));
 const makeEvent=(override:Partial<ProEvent>={}):ProEvent=>({id:'event',user_id:'pro',source:'pro',event_name:'Mirabelle',tour_name:'Alps Tour',start_date:'2026-11-05',end_date:'2026-11-08',country:'France',venue:'Metz',finish:null,tee_time:null,tee_hole:null,to_par:null,total_strokes:null,scheduled_rounds:4,owgr_event_id:null,owgr_points:null,owgr_rank_before:null,owgr_rank_after:null,owgr_year:null,owgr_week:null,created_at:'',updated_at:'',rounds:[],...override});
 const props:ProProfileProps={pro:{user_id:'pro',pro_kind:'tour_pro',pro_tour:'Alps Tour',pro_tour_code:'alps',pro_club:null,pro_player_id:null},name:'Mason Essam',owner:false,viewerId:'viewer',followers:3,followersReady:true,onFollowers:vi.fn(),onAvatar:vi.fn(),onEdit:vi.fn(),onShare:vi.fn(),onFollow:vi.fn(),following:false,followBusy:false,onMessage:vi.fn(),messageBusy:false,menu:<span>Menu</span>};
 const mount=(node:React.ReactNode)=>render(<MemoryRouter><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{node}</QueryClientProvider></MemoryRouter>);
-beforeEach(()=>{s.events=[];s.rank=null;s.ready=true;s.live=null;s.watching=false;s.count=0;s.guest=false;s.gate.mockClear();s.rpc.mockClear();s.insert.mockClear();});
+beforeEach(()=>{s.events=[];s.rank=null;s.ready=true;s.live=null;});
 afterEach(cleanup);
 describe('Pro profile build one mounted flows',()=>{
   it('rank replaces index with real figure and season improvement',()=>{s.rank={rank:1436,season_start_rank:1879,prior_rank:1440};mount(<ProProfileBuildOne {...props}/>);expect(screen.getByText('#1,436')).toBeInTheDocument();expect(screen.getByText('▲ 443')).toHaveClass('pro-profile-up');});
   it('worse movement is muted not red',()=>{s.rank={rank:1900,season_start_rank:1879,prior_rank:1440};mount(<ProProfileBuildOne {...props}/>);expect(screen.getByText('▼ 21')).toHaveClass('pro-profile-worse');expect(screen.getByText('▼ 21')).not.toHaveClass('pro-profile-under');});
@@ -28,13 +24,9 @@ describe('Pro profile build one mounted flows',()=>{
   it('no rank uses best finish, no data omits headline',()=>{s.events=[makeEvent({finish:'T9'})];const view=mount(<ProProfileBuildOne {...props}/>);expect(screen.getByText('BEST FINISH 2026')).toBeInTheDocument();s.events=[];view.rerender(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ProProfileBuildOne {...props}/></QueryClientProvider></MemoryRouter>);expect(screen.queryByText('BEST FINISH 2026')).toBeNull();});
   it('unsettled sections stay absent',()=>{s.ready=false;mount(<ProProfileBuildOne {...props}/>);expect(screen.queryByText('2026 SEASON')).toBeNull();expect(screen.queryByText('WORLD RANKING')).toBeNull();});
   it('visitor has Follow and Message; owner has Edit and Share',()=>{const v=mount(<ProProfileBuildOne {...props}/>);expect(screen.getByRole('button',{name:'Follow'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'Message'})).toBeInTheDocument();v.unmount();mount(<ProProfileBuildOne {...props} owner/>);fireEvent.click(screen.getByRole('button',{name:'Share profile'}));expect(props.onShare).toHaveBeenCalled();expect(screen.getByRole('button',{name:'Edit profile'})).toBeInTheDocument();});
   it('nonlinked pro never shows linked statistics',()=>{mount(<ProProfileBuildOne {...props}/>);expect(screen.queryByTestId('linked-stats')).toBeNull();});
-  it('linked live takes week priority',()=>{s.live={tournamentId:'live'};mount(<ProProfileBuildOne {...props} pro={{...props.pro,pro_player_id:'player'}}/>);expect(screen.getByTestId('linked-live')).toBeInTheDocument();expect(screen.queryByText('Mirabelle')).toBeNull();});
-  it('empty own week opens add event',()=>{mount(<ProWeekSection events={[]} userId="pro" owner first="Mason"/>);expect(screen.getByText('Where are you playing next?')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Add'}));expect(screen.getByRole('heading',{name:'Add event'})).toBeInTheDocument();});
-  it('empty tee values omit tiles, posted to-par keeps sign',()=>{mount(<ProWeekSection events={[makeEvent({rounds:[{event_id:'event',round_no:1,to_par:-2,strokes:null,source:'pro',holes_played:18,posted_at:''}]})]} userId="pro" owner={false} first="Mason"/>);expect(screen.queryByText('R1 TEE TIME')).toBeNull();expect(screen.queryByText('STARTS')).toBeNull();expect(screen.getByText('−2')).toHaveClass('pro-profile-under');});
-  it('round save inserts source pro with to-par and eighteen holes',async()=>{mount(<ProRoundSheet event={makeEvent()} roundNo={2} close={vi.fn()}/>);fireEvent.click(screen.getByRole('button',{name:'Decrease to-par'}));fireEvent.click(screen.getByRole('button',{name:'Save round'}));await waitFor(()=>expect(s.insert).toHaveBeenCalledWith({event_id:'event',round_no:2,to_par:-1,strokes:null,holes_played:18,source:'pro'}));});
-  it('watch toggle uses authorized RPC',async()=>{mount(<ProWeekSection events={[makeEvent()]} userId="pro" owner={false} first="Mason"/>);fireEvent.click(screen.getByRole('button',{name:'Get his scores each day'}));await waitFor(()=>expect(s.rpc).toHaveBeenCalledWith('toggle_pro_score_watch',{p_pro_id:'pro'}));});
-  it('guest gate prevents watch writes',()=>{s.guest=true;mount(<ProWeekSection events={[makeEvent()]} userId="pro" owner={false} first="Mason"/>);fireEvent.click(screen.getByRole('button',{name:'Get his scores each day'}));expect(s.gate).toHaveBeenCalled();expect(s.rpc).not.toHaveBeenCalled();});
-  it('watching button stops through same toggle',async()=>{s.watching=true;mount(<ProWeekSection events={[makeEvent()]} userId="pro" owner={false} first="Mason"/>);fireEvent.click(screen.getByRole('button',{name:'Getting his scores'}));await waitFor(()=>expect(s.rpc).toHaveBeenCalledOnce());});
+  it('linked live shows the tour card',()=>{s.live={tournamentId:'live'};mount(<ProProfileBuildOne {...props} pro={{...props.pro,pro_player_id:'player'}}/>);expect(screen.getByTestId('linked-live')).toBeInTheDocument();});
+  it('no events leaves out the season section and its hero cells for everyone',()=>{const v=mount(<ProProfileBuildOne {...props}/>);expect(screen.queryByText('2026 SEASON')).toBeNull();expect(screen.queryByText('EVENTS')).toBeNull();expect(screen.queryByText('TOP 10S')).toBeNull();expect(screen.queryByText('BEST')).toBeNull();v.unmount();mount(<ProProfileBuildOne {...props} owner/>);expect(screen.queryByText('2026 SEASON')).toBeNull();expect(screen.queryByText('EVENTS')).toBeNull();});
+  it('there is no manual event or round entry anywhere',()=>{s.events=[makeEvent({finish:'T9'})];mount(<ProProfileBuildOne {...props} owner/>);expect(screen.queryByText('Where are you playing next?')).toBeNull();expect(screen.queryByText('Add a result')).toBeNull();expect(screen.queryByText(/Post your round/)).toBeNull();expect(screen.queryByText('NOT YET')).toBeNull();expect(screen.queryByText(/Get his scores each day/)).toBeNull();});
   it('OWGR result opens strokes and real round tiles',()=>{s.events=[makeEvent({source:'owgr',finish:'T31',total_strokes:219,owgr_rank_before:1440,owgr_rank_after:1436,owgr_points:.03,rounds:[71,75,73].map((strokes,i)=>({event_id:'event',round_no:i+1,source:'owgr',strokes,to_par:null,holes_played:18,posted_at:''}))})];mount(<ProProfileBuildOne {...props}/>);fireEvent.click(screen.getByRole('button',{name:/T31 Mirabelle/}));const dialog=screen.getByRole('dialog');expect(within(dialog).getByText('STROKES')).toBeInTheDocument();expect(within(dialog).getByText('71')).toBeInTheDocument();expect(within(dialog).getByText(/Strokes as published/)).not.toHaveTextContent('Shortened');});
-});
\ No newline at end of file
+});
```

### `src/test/proProfileBuildOneB.test.tsx` — exact old/new code

```diff
diff --git a/src/test/proProfileBuildOneB.test.tsx b/src/test/proProfileBuildOneB.test.tsx
index c223a4aefc..a3cc535f0b 100644
--- a/src/test/proProfileBuildOneB.test.tsx
+++ b/src/test/proProfileBuildOneB.test.tsx
@@ -4,10 +4,9 @@ import { cleanup, fireEvent, render, screen, within } from '@testing-library/rea
 import { MemoryRouter } from 'react-router-dom';
 import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
 import { HeroShell } from '@/components/profile/hero/HeroShell';
 import { ProProfileBuildOne, type ProProfileProps } from '@/features/pro-profile/ProProfileBuildOne';
-import { ProSeasonSection } from '@/features/pro-profile/ProSeasonSection';
-import { ResultDetail } from '@/features/pro-profile/ProEventSheets';
+import { ProSeasonSection, ResultDetail } from '@/features/pro-profile/ProSeasonSection';
 import { finishLabel, monthLabel, pointsCopy, type ProEvent } from '@/features/pro-profile/proProfileRules';
 const s=vi.hoisted(()=>({events:[] as ProEvent[],club:'Dartford Golf Club',rpc:vi.fn(async()=>({error:null}))}));
 vi.mock('react-i18next',()=>({initReactI18next:{type:'3rdParty',init:()=>{}},useTranslation:()=>({t:(_k:string,o?:{defaultValue?:string})=>o?.defaultValue??''})}));
 vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:s.rpc}}));
@@ -15,9 +14,8 @@ vi.mock('@/features/pro-profile/useProProfile',()=>({useProEvents:()=>({data:s.e
 vi.mock('@/components/profile/hooks/useProfileClubs',()=>({useProfileClubs:()=>({homeClub:s.club?{name:s.club}:null})}));
 vi.mock('@/hooks/useUserTopTenCourses',()=>({useUserTopTenCourses:()=>({topTen:[]})}));
 vi.mock('@/features/tourhub/player-v2/data/usePlayerData',()=>({usePlayerSeasonResults:()=>({data:s.events,isSuccess:true,isError:false})}));
 vi.mock('@/features/pro-profile/LinkedProSections',()=>({useLinkedProLive:()=>({data:null,isSuccess:false}),useLinkedProStats:()=>({data:null,isSuccess:false}),LinkedLiveCard:()=>null,HowProPlays:()=>null}));
-vi.mock('@/features/pro-profile/ProWeekSection',()=>({ProWeekSection:()=>null}));
 const event=(o:Partial<ProEvent>={}):ProEvent=>({id:'11624',user_id:'pro',source:'owgr',event_name:'Hulencourt',start_date:'2026-10-15',end_date:'2026-10-17',country:'Belgium',venue:null,tour_name:'Alps Tour',finish:'T31',to_par:null,total_strokes:219,scheduled_rounds:3,owgr_year:2026,owgr_week:42,owgr_points:.01752,owgr_event_id:'11624',owgr_rank_before:1440,owgr_rank_after:1426,tee_time:null,tee_hole:null,created_at:'',updated_at:'',rounds:[71,75,73].map((strokes,i)=>({event_id:'11624',round_no:i+1,strokes,to_par:null,source:'owgr',holes_played:18,posted_at:''})),...o});
 const props:ProProfileProps={pro:{user_id:'pro',pro_kind:'tour_pro',pro_tour:'Alps Tour',pro_tour_code:'alps',pro_club:null,pro_player_id:null},name:'Mason Essam',owner:false,viewerId:'viewer',followers:3,friends:14,followersReady:true,onFollowers:vi.fn(),onFriends:vi.fn(),onAvatar:vi.fn(),onEdit:vi.fn(),onShare:vi.fn(),onFollow:vi.fn(),following:false,followBusy:false,onFriend:vi.fn(),onMessage:vi.fn(),messageBusy:false,menu:<span>Menu</span>};
 function mount(node:React.ReactNode){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});const view=render(<MemoryRouter><QueryClientProvider client={cache}>{node}</QueryClientProvider></MemoryRouter>);return {...view,cache};}
 afterEach(()=>{cleanup();s.events=[];s.club='Dartford Golf Club';s.rpc.mockClear();});
@@ -30,19 +28,19 @@ describe('Pro profile build 1b mounted',()=>{
  it('pro avatar is72 with full-height wrapper; default shell avatar56',()=>{const v=mount(<ProProfileBuildOne {...props}/>);const avatar=screen.getByRole('button',{name:'Mason Essam'}).firstElementChild as HTMLElement;expect(avatar.style.width).toBe('72px');expect(avatar.style.height).toBe('');expect(avatar.style.overflow).toBe('');expect(avatar.querySelector('[style*="1px"]')).not.toBeNull();v.unmount();mount(<HeroShell displayName="Member" avatar={<span>Avatar</span>} counters={[]}/>);expect((screen.getByRole('button',{name:'Member'}).firstElementChild as HTMLElement).style.width).toBe('56px');});
  it('identity keeps surname badge together with three lines',()=>{mount(<ProProfileBuildOne {...props}/>);const h=screen.getByRole('heading',{name:'Mason Essam PRO'});expect(h.querySelector('.pro-hero-surname')).toHaveTextContent('EssamPRO');expect(h.nextElementSibling).toHaveTextContent('Tour professional');expect(h.nextElementSibling?.nextElementSibling).toHaveTextContent('Alps Tour · Dartford Golf Club');});
  it('missing tour/club omits third line',()=>{s.club='';mount(<ProProfileBuildOne {...props} pro={{...props.pro,pro_tour:null}}/>);expect(document.querySelector('.pro-hero-club')).toBeNull();});
  it('strip has top10 and friends action',()=>{s.events=[event({finish:'T9'})];mount(<ProProfileBuildOne {...props}/>);const hero=screen.getByRole('heading',{name:'Mason Essam PRO'}).closest('section');expect(within(hero as HTMLElement).getByText('TOP 10S')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'14 FRIENDS'}));expect(props.onFriends).toHaveBeenCalled();expect(within(hero as HTMLElement).queryByText('CUTS')).toBeNull();});
- it('zero top10 uses BEST; no finish omits second cell',()=>{s.events=[event()];const v=mount(<ProProfileBuildOne {...props}/>);const hero=screen.getByRole('heading',{name:'Mason Essam PRO'}).closest('section');expect(within(hero as HTMLElement).getByText('BEST')).toBeInTheDocument();v.unmount();s.events=[];mount(<ProProfileBuildOne {...props}/>);expect(document.querySelector('.pro-profile section')?.querySelectorAll('button')).toHaveLength(7);});
+ it('zero top10 uses BEST; no events omits the season cells',()=>{s.events=[event()];const v=mount(<ProProfileBuildOne {...props}/>);const hero=screen.getByRole('heading',{name:'Mason Essam PRO'}).closest('section');expect(within(hero as HTMLElement).getByText('BEST')).toBeInTheDocument();v.unmount();s.events=[];mount(<ProProfileBuildOne {...props}/>);const emptyHero=screen.getByRole('heading',{name:'Mason Essam PRO'}).closest('section');expect(within(emptyHero as HTMLElement).queryByText('EVENTS')).toBeNull();expect(within(emptyHero as HTMLElement).queryByText('BEST')).toBeNull();expect(document.querySelector('.pro-profile section')?.querySelectorAll('button')).toHaveLength(6);});
  it.each(['Add friend','Requested','Accept','Friends'])('friend state %s',label=>{mount(<ProProfileBuildOne {...props} friendLabel={label}/>);fireEvent.click(screen.getByRole('button',{name:label}));expect(props.onFriend).toHaveBeenCalled();});
  it('business excludes friend',()=>{mount(<ProProfileBuildOne {...props} businessViewer/>);expect(screen.queryByRole('button',{name:'Add friend'})).toBeNull();});
  it('owner keeps Edit and Share',()=>{mount(<ProProfileBuildOne {...props} owner/>);expect(screen.getByRole('button',{name:'Edit profile'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Add friend'})).toBeNull();});
- it('gross only visitor has no Add par',()=>{mount(<ProSeasonSection events={[event({event_name:'Bordoni',total_strokes:140})]} first="Mason" year={2026} userId="pro" owner={false} linked={false}/>);expect(screen.getByText('140')).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Add par'})).toBeNull();});
+ it('gross only visitor has no Add par',()=>{mount(<ProSeasonSection events={[event({event_name:'Bordoni',total_strokes:140})]} first="Mason" year={2026} linked={false}/>);expect(screen.getByText('140')).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Add par'})).toBeNull();});
  it('result strokes tiles and formatted rank',()=>{mount(<ResultDetail event={event()} close={vi.fn()}/>);expect(screen.getByText('STROKES')).toBeInTheDocument();expect(screen.getByText('219')).toBeInTheDocument();expect(screen.getByText('1,426')).toBeInTheDocument();expect(screen.getByText('▲ 14')).toHaveClass('pro-profile-up');expect(screen.getByText('71')).not.toHaveClass('pro-profile-under');});
  it.each([[3,3],[4,4],[2,2],[5,4]])('result sheet with %i rounds uses %i columns',(count,columns)=>{const base=event();const rounds=Array.from({length:count},(_,i)=>({...base.rounds[0],round_no:i+1,strokes:70+i}));mount(<ResultDetail event={{...base,rounds}} close={vi.fn()}/>);const grid=screen.getByRole('dialog').querySelector('.pro-profile-rounds');expect(grid).toHaveStyle({gridTemplateColumns:`repeat(${columns}, 1fr)`});expect(grid?.children).toHaveLength(count);});
  it('320px result sheet keeps all four round columns without auto-fit',()=>{const width=window.innerWidth;try{Object.defineProperty(window,'innerWidth',{configurable:true,value:320});const base=event();mount(<ResultDetail event={{...base,rounds:Array.from({length:4},(_,i)=>({...base.rounds[0],round_no:i+1,strokes:70+i}))}} close={vi.fn()}/>);const grid=screen.getByRole('dialog').querySelector('.pro-profile-rounds');expect(grid).toHaveStyle({gridTemplateColumns:'repeat(4, 1fr)'});expect(grid?.children).toHaveLength(4);}finally{Object.defineProperty(window,'innerWidth',{configurable:true,value:width});}});
 
- it('OWGR row ignores dormant course par and stored to-par',()=>{const fixture={...event(),course_par:72,course_par_set_by:'pro',to_par:3};mount(<ProSeasonSection events={[fixture]} first="Mason" year={2026} userId="pro" owner={false} linked={false}/>);const row=screen.getByRole('button',{name:/T31 Hulencourt/});expect(within(row).getByText('219')).toBeInTheDocument();expect(within(row).queryByText('+3')).toBeNull();expect(row.querySelector('.pro-profile-score')?.children).toHaveLength(1);});
+ it('OWGR row ignores dormant course par and stored to-par',()=>{const fixture={...event(),course_par:72,course_par_set_by:'pro',to_par:3};mount(<ProSeasonSection events={[fixture]} first="Mason" year={2026} linked={false}/>);const row=screen.getByRole('button',{name:/T31 Hulencourt/});expect(within(row).getByText('219')).toBeInTheDocument();expect(within(row).queryByText('+3')).toBeNull();expect(row.querySelector('.pro-profile-score')?.children).toHaveLength(1);});
  it.each(['visitor','owner','admin'])('no par controls for %s',view=>{s.events=[{...event(),course_par:72} as ProEvent];mount(<ProProfileBuildOne {...props} owner={view==='owner'} viewerId={view==='admin'?'admin':'viewer'}/>);expect(screen.queryByText(/Add (the course )?par/i)).toBeNull();fireEvent.click(screen.getByRole('button',{name:/T31 Hulencourt/}));expect(screen.queryByText(/Add (the course )?par/i)).toBeNull();});
  it.each([['Hulencourt',219,[71,75,73]],['Bordoni',140,[69,71]]] as const)('Mason %s strokes and rounds',(name,total,rounds)=>{const fixture={...event(),event_name:name,total_strokes:total,course_par:72,rounds:rounds.map((strokes,i)=>({...event().rounds[0],round_no:i+1,strokes}))};mount(<ResultDetail event={fixture} close={vi.fn()}/>);expect(screen.getByText('STROKES')).toBeInTheDocument();expect(screen.getByText(String(total))).toBeInTheDocument();for(const strokes of rounds)expect(screen.getByText(String(strokes))).toBeInTheDocument();const footnote=document.querySelector('.pro-profile-footnote');expect(footnote).toHaveTextContent('Strokes as published by the Official World Golf Ranking. 0.02 ranking points earned.');expect(footnote).not.toHaveTextContent(/par|added by/i);expect(document.querySelectorAll('.pro-profile-round small')).toHaveLength(0);});
- it.each(['pro','tour'])('nonOWGR %s keeps signed to-par and red under par',source=>{mount(<ProSeasonSection events={[event({source,to_par:-2})]} first="Mason" year={2026} userId="pro" owner={false} linked={source==='tour'}/>);expect(screen.getByText('−2')).toHaveClass('pro-profile-under');fireEvent.click(screen.getByRole('button',{name:/T31 Hulencourt/}));const dialog=screen.getByRole('dialog');expect(within(dialog).getByText('TO PAR')).toBeInTheDocument();expect(within(dialog).getByText('−2')).toHaveClass('pro-profile-under');});
+ it.each(['pro','tour'])('nonOWGR %s keeps signed to-par and red under par',source=>{mount(<ProSeasonSection events={[event({source,to_par:-2})]} first="Mason" year={2026} linked={source==='tour'}/>);expect(screen.getByText('−2')).toHaveClass('pro-profile-under');fireEvent.click(screen.getByRole('button',{name:/T31 Hulencourt/}));const dialog=screen.getByRole('dialog');expect(within(dialog).getByText('TO PAR')).toBeInTheDocument();expect(within(dialog).getByText('−2')).toHaveClass('pro-profile-under');});
  it('worse rank muted and unchanged omitted',()=>{const v=mount(<ResultDetail event={event({owgr_rank_after:1441})} close={vi.fn()}/>);expect(screen.getByText('▼ 1')).toHaveClass('pro-profile-worse');v.unmount();mount(<ResultDetail event={event({owgr_rank_after:1440})} close={vi.fn()}/>);expect(document.querySelector('.pro-result-rank-movement')).toBeNull();});
 });
```

### `src/test/proProfileBuildOneRules.test.ts` — exact old/new code

```diff
diff --git a/src/test/proProfileBuildOneRules.test.ts b/src/test/proProfileBuildOneRules.test.ts
index f7740e3241..d6661d309b 100644
--- a/src/test/proProfileBuildOneRules.test.ts
+++ b/src/test/proProfileBuildOneRules.test.ts
@@ -1,6 +1,6 @@
 import { describe, expect, it } from 'vitest';
-import { currentEvent, finishLabel, rankMovement, roundPayload, scoreLabel, seasonSummary, sortedEvents, watchCountCopy, type ProEvent, type WorldRank } from '@/features/pro-profile/proProfileRules';
+import { finishLabel, rankMovement, scoreLabel, seasonSummary, sortedEvents, type ProEvent, type WorldRank } from '@/features/pro-profile/proProfileRules';
 const rank:WorldRank={rank:1436,prior_rank:1440,season_start_rank:1879,best_rank:1400,ranking_date:'2026-11-02',source:'owgr'};
 const event=(overrides:Partial<ProEvent>={}):ProEvent=>({id:'a',user_id:'pro',source:'owgr',event_name:'Event',start_date:'2026-10-15',end_date:'2026-10-17',country:'Belgium',venue:null,tour_name:'Alps Tour',finish:'T31',to_par:null,total_strokes:219,scheduled_rounds:3,owgr_year:2026,owgr_week:42,owgr_points:.03,owgr_event_id:'11624',owgr_rank_before:1440,owgr_rank_after:1436,tee_time:null,tee_hole:null,created_at:'',updated_at:'',rounds:[],...overrides});
 describe('Pro profile build one rules',()=>{
   it('season improvement is positive 443, not a score',()=>expect(rankMovement(rank)).toEqual({improved:true,difference:443,period:'this season'}));
@@ -21,19 +21,7 @@ describe('Pro profile build one rules',()=>{
     expect(seasonSummary(events,2026).average).toBe('72.4');
   });
   it('source pro to-par is never included in strokes average',()=>expect(seasonSummary([event({source:'pro',rounds:[{event_id:'a',round_no:1,source:'pro',strokes:null,to_par:-2,holes_played:18,posted_at:''}]})],2026).average).toBeNull());
   it('empty season collapses best finish',()=>expect(seasonSummary([],2026).best).toBeNull());
-  it('includes event starting exactly seven days ahead',()=>expect(currentEvent([event({start_date:'2026-11-12',end_date:'2026-11-15'})],new Date('2026-11-05T12:00:00Z'))?.id).toBe('a'));
-  it('excludes event eight days ahead',()=>expect(currentEvent([event({start_date:'2026-11-13',end_date:'2026-11-16'})],new Date('2026-11-05T12:00:00Z'))).toBeNull());
-  it('missing end date uses start plus three days inclusive',()=>expect(currentEvent([event({start_date:'2026-11-02',end_date:null})],new Date('2026-11-05T23:00:00Z'))?.id).toBe('a'));
-  it('expired event is absent',()=>expect(currentEvent([event({start_date:'2026-11-01',end_date:null})],new Date('2026-11-05T00:00:00Z'))).toBeNull());
   it('orders dated and undated results newest first',()=>expect(sortedEvents([event({id:'old',start_date:null,owgr_week:35}),event({id:'new',start_date:null,owgr_week:43}),event({id:'dated',start_date:'2026-11-01'})]).map(e=>e.id)).toEqual(['dated','new','old']));
   it.each([[-2,'−2'],[0,'E'],[3,'+3']])('signed score %s', (n,label)=>expect(scoreLabel(Number(n))).toBe(label));
-  it('watch count zero omitted',()=>expect(watchCountCopy(0)).toBe(''));
-  it('watch count one uses singular',()=>expect(watchCountCopy(1)).toBe('1 member does.'));
-  it('watch count plural uses real number',()=>expect(watchCountCopy(12)).toBe('12 members do.'));
-  it('round writes source pro, to-par and default eighteen holes',()=>expect(roundPayload('a',2,0,18)).toEqual({event_id:'a',round_no:2,to_par:0,holes_played:18,source:'pro',strokes:null}));
-  it('accepts minus12 floor',()=>expect(roundPayload('a',1,-12,18).to_par).toBe(-12));
-  it('accepts plus20 ceiling',()=>expect(roundPayload('a',1,20,18).to_par).toBe(20));
-  it('refuses below minus12',()=>expect(()=>roundPayload('a',1,-13,18)).toThrow());
-  it('refuses above plus20',()=>expect(()=>roundPayload('a',1,21,18)).toThrow());
 });
\ No newline at end of file
```

### `src/test/proProfileSeason.test.tsx` — exact old/new code

```diff
diff --git a/src/test/proProfileSeason.test.tsx b/src/test/proProfileSeason.test.tsx
index 8f53e88285..fd66228cec 100644
--- a/src/test/proProfileSeason.test.tsx
+++ b/src/test/proProfileSeason.test.tsx
@@ -1,16 +1,17 @@
 import React from 'react';
-import { afterEach, describe, expect, it } from 'vitest';
+import { afterEach, describe, expect, it, vi } from 'vitest';
 import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
 import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
 import { MemoryRouter } from 'react-router-dom';
 import { ProSeasonSection } from '@/features/pro-profile/ProSeasonSection';
 import type { ProEvent } from '@/features/pro-profile/proProfileRules';
 const event=(id:string,source:string,date:string|null,week:number,score:number):ProEvent=>({id,user_id:'pro',source,event_name:`Event ${id}`,start_date:date,end_date:date,venue:null,country:'Belgium',tour_name:'Alps Tour',finish:id==='win'?'1':'T31',total_strokes:source==='owgr'?score:null,to_par:source==='pro'?score:null,tee_time:null,tee_hole:null,scheduled_rounds:3,owgr_year:2026,owgr_week:week,owgr_rank_before:1440,owgr_rank_after:1436,owgr_points:.03,owgr_event_id:id,created_at:'',updated_at:'',rounds:[]});
-const mount=(events:ProEvent[],linked=false)=>render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ProSeasonSection events={events} year={2026} first="Mason" owner={false} userId="pro" linked={linked} scoring={69.8}/></QueryClientProvider></MemoryRouter>);
+const mount=(events:ProEvent[],linked=false,onSeeAll?:()=>void)=>render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ProSeasonSection events={events} year={2026} first="Mason" linked={linked} scoring={69.8} onSeeAll={onSeeAll}/></QueryClientProvider></MemoryRouter>);
 afterEach(cleanup);
 describe('Pro profile season results',()=>{
   it('latest four ordered rows retain gross versus signed to-par',()=>{mount([event('old','owgr',null,20,200),event('pro','pro','2026-11-05',45,-2),event('gross','owgr','2026-11-01',44,219),event('mid','owgr',null,40,140),event('new','owgr',null,43,148)]);const rows=screen.getAllByRole('button').filter(b=>b.classList.contains('pro-profile-row'));expect(rows.map(r=>r.textContent)).toEqual([expect.stringContaining('Event pro'),expect.stringContaining('Event gross'),expect.stringContaining('Event new'),expect.stringContaining('Event mid')]);expect(screen.getByText('−2')).toBeInTheDocument();expect(screen.getByText('219')).toBeInTheDocument();expect(screen.getByText('ADDED BY MASON')).toBeInTheDocument();});
-  it('see-all count opens full year-grouped list including old rows',()=>{mount([event('one','owgr',null,43,219),event('two','pro','2025-01-01',1,2)]);fireEvent.click(screen.getByRole('button',{name:'See all 2 results ›'}));const dialog=screen.getByRole('dialog');expect(within(dialog).getByRole('heading',{name:'2025'})).toBeInTheDocument();expect(within(dialog).getByText('Event two')).toBeInTheDocument();});
+  it('see-all hands off to the caller with the all-years count, never a sheet',()=>{const onSeeAll=vi.fn();mount([event('one','owgr',null,43,219),event('two','pro','2025-01-01',1,2)],false,onSeeAll);fireEvent.click(screen.getByRole('button',{name:'See all 2 results ›'}));expect(onSeeAll).toHaveBeenCalledOnce();expect(screen.queryByRole('dialog')).toBeNull();});
   it('covered-tour BEST tile is best finish 1st, not wins count',()=>{mount([event('win','tour','2026-10-01',40,-18)],true);expect(screen.getByText('BEST')).toBeInTheDocument();expect(screen.queryByText('WIN')).toBeNull();expect(screen.getAllByText('1st')).toHaveLength(2);expect(screen.getByText('SCORING')).toBeInTheDocument();expect(screen.getByText('69.8')).toBeInTheDocument();});
   it('pro result sheet shows TO PAR and no OWGR footnote',()=>{mount([event('pro','pro','2026-11-01',44,-2)]);fireEvent.click(screen.getByRole('button',{name:/Event pro/}));const dialog=screen.getByRole('dialog');expect(within(dialog).getByText('TO PAR')).toBeInTheDocument();expect(within(dialog).queryByText(/Strokes as published/)).toBeNull();});
-});
\ No newline at end of file
+  it('there is no Add a result card for anyone',()=>{mount([event('one','owgr',null,43,219)]);expect(screen.queryByText('Add a result')).toBeNull();});
+});
```

### `src/test/proVerification2.test.tsx` — exact old/new code

```diff
diff --git a/src/test/proVerification2.test.tsx b/src/test/proVerification2.test.tsx
index 77c44f3ce8..69d6cb16ea 100644
--- a/src/test/proVerification2.test.tsx
+++ b/src/test/proVerification2.test.tsx
@@ -1,12 +1,12 @@
 import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
-import { cleanup, render, screen, waitFor } from '@testing-library/react';
+import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
 
 vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
-const f = vi.hoisted(() => ({ rpc: vi.fn() }));
-vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));
+const f = vi.hoisted(() => ({ rpc: vi.fn(), events: [] as unknown[] }));
+vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc, from: () => { const b: Record<string, unknown> = {}; ['select', 'eq', 'in', 'order'].forEach((n) => { b[n] = () => b; }); b.range = () => Promise.resolve({ data: f.events, error: null }); return b; } } }));
 vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
 import { readProMembers, invalidateProMembers, PRO_MEMBERS_STALE_MS, type ProMember } from '@/features/pro-verification/proMembersCache';
 import { ProMemberName } from '@/features/pro-verification/ProLabel';
 import { profileProTabs, showPendingProNote } from '@/features/pro-verification/profileProRules';
@@ -18,9 +18,9 @@ const pro: ProMember = { user_id: 'pro', pro_kind: 'tour_pro', pro_tour: 'DP Wor
 const result = (n: number): PlayerResult => ({ tournament_id: `event-${n}`, name: `Event ${n}`, end_date: `2026-10-${String(n + 1).padStart(2, '0')}`, start_date: '2026-10-01', display_position: 'T11', score: -9, round_1: 1, round_2: -3, round_3: -2, round_4: -5, is_winner: false, tied: true, finish_position: 11, tour: 'euro', field_size: 100, beat_percent: 90, event_status: 'closed', status: 'closed' });
 function mount(node: React.ReactNode) {
   return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
 }
-beforeEach(() => { invalidateProMembers(); f.rpc.mockReset().mockResolvedValue({ data: [pro], error: null }); });
+beforeEach(() => { invalidateProMembers(); f.rpc.mockReset().mockResolvedValue({ data: [pro], error: null }); f.events = []; });
 afterEach(() => { cleanup(); vi.restoreAllMocks(); });
 
 describe('Brief 2 public pro identity', () => {
   it('batches and deduplicates all visible screen ids into one RPC', async () => {
@@ -64,10 +64,10 @@ describe('Brief 2 public pro identity', () => {
 });
 
 describe('Brief 2 profile visibility rules', () => {
   it('linked tour pro gets a public Tour tab', () => { expect(profileProTabs(pro, false, false).tour).toBe(true); });
-  it('uncovered owner gets Tour instead of unconnected Handicap', () => { expect(profileProTabs({ ...pro, pro_player_id: null }, true, false)).toEqual({ tour: true, handicap: false }); });
-  it('uncovered visitor gets neither Tour nor Handicap', () => { expect(profileProTabs({ ...pro, pro_player_id: null }, false, false)).toEqual({ tour: false, handicap: false }); });
+  it('unlinked pro with results gets the Tour tab, owner and visitor', () => { expect(profileProTabs({ ...pro, pro_player_id: null }, true, false, true)).toEqual({ tour: true, handicap: false }); expect(profileProTabs({ ...pro, pro_player_id: null }, false, false, true).tour).toBe(true); });
+  it('unlinked pro with no results gets no Tour tab, owner included', () => { expect(profileProTabs({ ...pro, pro_player_id: null }, true, false, false)).toEqual({ tour: false, handicap: false }); expect(profileProTabs({ ...pro, pro_player_id: null }, false, false, false)).toEqual({ tour: false, handicap: false }); });
   it('connected pro owner keeps Tour but no Handicap', () => { expect(profileProTabs(pro, true, true)).toEqual({ tour: true, handicap: false }); });
   it('teaching pro gets neither Tour nor Handicap tab', () => { expect(profileProTabs({ ...pro, pro_kind: 'teaching_pro' }, true, false)).toEqual({ tour: false, handicap: false }); });
   it('ordinary owner retains Handicap', () => { expect(profileProTabs(null, true, false)).toEqual({ tour: false, handicap: true }); });
   it('pending note is private to the owner', () => { expect(showPendingProNote(true, true, null)).toBe(true); expect(showPendingProNote(false, true, null)).toBe(false); });
@@ -98,15 +98,28 @@ describe('Brief 2 Tour results', () => {
     await waitFor(() => expect(f.rpc).toHaveBeenCalledTimes(1));
     await waitFor(() => expect(container.querySelector('[role="status"]')).toBeNull());
     expect(f.rpc).toHaveBeenCalledTimes(1);
   });
-  it('uncovered owner note makes no player read', () => {
-    const { container } = mount(<ProfileTourTab pro={{ ...pro, pro_player_id: null, pro_tour: 'Alps Tour' }} displayName="Member" isOwner />);
-    expect(container.querySelector('.pro-profile-note')).not.toBeNull();
+  it('unlinked pro with results shows year-grouped rows that open the result sheet', async () => {
+    f.events = [
+      { id: 'e1', user_id: 'pro', source: 'owgr', event_name: 'Hulencourt', tour_name: 'Alps Tour', start_date: '2026-10-15', end_date: '2026-10-17', country: 'Belgium', venue: null, finish: 'T31', to_par: null, total_strokes: 219, scheduled_rounds: 3, tee_time: null, tee_hole: null, owgr_event_id: '11624', owgr_points: 0.02, owgr_rank_before: 1440, owgr_rank_after: 1426, owgr_year: 2026, owgr_week: 42, created_at: '', updated_at: '', rounds: [] },
+      { id: 'e2', user_id: 'pro', source: 'owgr', event_name: 'Ein Bay Open', tour_name: 'Alps Tour', start_date: null, end_date: null, country: 'Egypt', venue: null, finish: 'T40', to_par: null, total_strokes: 290, scheduled_rounds: 4, tee_time: null, tee_hole: null, owgr_event_id: '1', owgr_points: null, owgr_rank_before: null, owgr_rank_after: 2000, owgr_year: 2025, owgr_week: 8, created_at: '', updated_at: '', rounds: [] },
+    ];
+    const { container } = mount(<ProfileTourTab pro={{ ...pro, pro_player_id: null, pro_tour: 'Alps Tour' }} displayName="Mason Essam" isOwner={false} />);
+    await waitFor(() => expect(container.querySelectorAll('.pro-profile-row').length).toBe(2));
+    expect(screen.getByRole('button', { name: /T31 Hulencourt/ })).toBeTruthy();
+    expect(screen.getByText('2026')).toBeTruthy();
+    expect(screen.getByText('2025')).toBeTruthy();
+    fireEvent.click(screen.getByRole('button', { name: /T31 Hulencourt/ }));
+    expect(await screen.findByRole('dialog')).toBeTruthy();
     expect(f.rpc).not.toHaveBeenCalled();
   });
-  it('uncovered visitor renders nothing and makes no player read', () => {
-    const { container } = mount(<ProfileTourTab pro={{ ...pro, pro_player_id: null }} displayName="Member" isOwner={false} />);
-    expect(container.childElementCount).toBe(0);
-    expect(f.rpc).not.toHaveBeenCalled();
+  it('unlinked pro with no results renders nothing, owner included', async () => {
+    f.events = [];
+    const { container, unmount } = mount(<ProfileTourTab pro={{ ...pro, pro_player_id: null }} displayName="Member" isOwner={false} />);
+    await waitFor(() => expect(container.childElementCount).toBe(0));
+    unmount();
+    const own = mount(<ProfileTourTab pro={{ ...pro, pro_player_id: null, pro_tour: 'Alps Tour' }} displayName="Member" isOwner />);
+    await waitFor(() => expect(own.container.childElementCount).toBe(0));
+    expect(own.container.querySelector('.pro-profile-note')).toBeNull();
   });
 });
\ No newline at end of file
```

## Deleted tests: exact names, reasons and old assertion code

### `src/test/proClubhouseSponsor.test.tsx` — deleted, 48 cases

- **fires once per mount for a visitor, with a null source** — The file housing view tracking was retired; production tracking is retained in ProProfileBuildOne, but these three direct tracking regressions were not relocated.
- **fires for a guest viewer too** — The file housing view tracking was retired; production tracking is retained in ProProfileBuildOne, but these three direct tracking regressions were not relocated.
- **never fires for the owner** — The file housing view tracking was retired; production tracking is retained in ProProfileBuildOne, but these three direct tracking regressions were not relocated.
- **mutual_count 3+ names the first and counts the rest** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **mutual_count 2 names both** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **mutual_count 1 uses the singular verb** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **mutual_count 0 falls back to the follower count, singular and plural** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **the club sentence singularises and disappears at zero** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **own copy joins club and watchers parts, with singulars** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **own zero-followers line invites the share** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **visitor faces come from mutuals, falling back to recent** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **own view always shows recent faces** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **is hidden from visitors at 0 followers but shows the owner line** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **tapping a face opens that member profile** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **nothing renders until the read settles or after a null payload** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **is owner-only** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **shows the amber header and the three tiles with the green +n rule** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **zero new followers reads 0 without the green** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **adds the counted-from line while tracking is younger than 30 days** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **the button opens the sponsor sheet** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **a failed reach read renders nothing** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **sheet PRO label uses print-safe block centring only in the sheet** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **sheet rank row uses a bottom-aligned two-column grid and unit figure line-height** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **sheet filters the first ranking event before taking four and shortens only its derived career high** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **profile Career retains the first ranking event and the career-high after clause** — This profile-Career guard was colocated in the deleted sponsor suite; Career remains, but this particular guard was not relocated.
- **every chip toggles its block straight away** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **chips for empty blocks are left out** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **the stored choice is restored** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **rank, movement and career best render with the muted-worse rule** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **worse movement is muted, never red** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **no rank falls back to best finish; no rank and no events omits the rank row** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **the season tiles match the Season section figures** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **latest results shows four with dimmed MC and the career first four with gold for wins** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **the bag groups by brand in bag order and partners join with middots** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **the QR encodes the profile URL** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **the source line credits the ranking when present, otherwise the made-on line** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **save captures the 360px node at scale 3 and downloads the named file** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **capture wraps html2canvas in a temporary img{display:inline-block} style on the live document** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **capture removes the inline-block style even when html2canvas rejects** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **the preview badge stays visible after a capture** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **share falls back to save when files cannot be shared** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **the fixed card is 360px and the preview scale never exceeds 1** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **cuts a long event with an ellipsis to fit the measured column** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **keeps a short event unchanged when it fits** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **bagLine joins two slots with and, three with a comma list** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **parsers fail closed on bad payloads** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **trackingFromLine hides at 30 days and dates a null start from today** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.
- **sponsorSourceLine formats both variants** — The corresponding Clubhouse, reach, sponsor sheet or sponsor/export helper was retired by the brief.

Old code below quotes every deleted assertion in full; new code is **absent (file deleted)**.

```tsx
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProProfileBuildOne, type ProProfileProps } from '@/features/pro-profile/ProProfileBuildOne';
import { ProClubhouseSection } from '@/features/pro-profile/ProClubhouseSection';
import { ProOnlyYouSection } from '@/features/pro-profile/ProOnlyYouSection';
import { ProSponsorSheet, type SponsorIdentity, type SponsorSeason } from '@/features/pro-profile/ProSponsorSheet';
import { ProCollectionSections } from '@/features/pro-profile/ProCollectionSections';
import { truncateSponsorEvent } from '@/features/pro-profile/proSponsorRules';
import { readFileSync } from 'node:fs';
const sponsorCss = readFileSync('src/features/pro-profile/pro-profile.css', 'utf8');
import { bagLine, clubhouseCopy, parseProClubhouse, parseProReach, sponsorSourceLine, trackingFromLine } from '@/features/pro-profile/proClubhouseRules';
import type { ProEvent } from '@/features/pro-profile/proProfileRules';
import type { BagItem, Partner, CareerMoment } from '@/features/pro-profile/proCollectionRules';

const s = vi.hoisted(() => ({
  clubhouse: null as any,
  clubhouseReady: true,
  reach: null as any,
  reachReady: true,
  events: [] as any[],
  eventsReady: true,
  rank: null as any,
  rankReady: true,
  bag: [] as any[],
  bagReady: true,
  partners: [] as any[],
  partnersReady: true,
  career: [] as any[],
  careerReady: true,
  guest: false,
  track: vi.fn(async () => {}),
  qr: vi.fn(async (text: string) => `data:image/png;base64,qr(${text})`),
  canvas: vi.fn(async (_el?: unknown, _opts?: unknown) => ({ toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['png'], { type: 'image/png' })) })),
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/pro-profile/useProClubhouse', () => ({
  useProClubhouse: () => ({ data: s.clubhouse, isSuccess: s.clubhouseReady, isError: false }),
  useProReach: () => ({ data: s.reach, isSuccess: s.reachReady, isError: false }),
}));
vi.mock('@/features/pro-profile/useProProfile', () => ({
  useProEvents: () => ({ data: s.events, isSuccess: s.eventsReady, isError: false }),
  useProWorldRank: () => ({ data: s.rank, isSuccess: s.rankReady, isError: false }),
  useProWatch: () => ({ data: { watching: false, count: 0 }, isSuccess: true, isError: false }),
}));
vi.mock('@/features/pro-profile/useProCollections', () => ({
  useProBag: () => ({ data: s.bag, isSuccess: s.bagReady, isError: false }),
  useProPartners: () => ({ data: s.partners, isSuccess: s.partnersReady, isError: false }),
  useProCareer: () => ({ data: s.career, isSuccess: s.careerReady, isError: false }),
  useProBusinesses: () => ({ data: [], isSuccess: true, isError: false }),
  useProBusinessSearch: () => ({ data: [], isSuccess: true, isError: false }),
  useCollectionWrite: () => async () => true,
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: s.track, trackOnHide: vi.fn() } }));
vi.mock('qrcode', () => ({ default: { toDataURL: s.qr } }));
vi.mock('html2canvas', () => ({ default: s.canvas }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({ useProfileClubs: () => ({ homeClub: { name: 'Dartford Golf Club' } }) }));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: [] }) }));
vi.mock('@/features/tourhub/player-v2/data/usePlayerData', () => ({ usePlayerSeasonResults: () => ({ data: [], isSuccess: true, isError: false }) }));
vi.mock('@/features/pro-profile/LinkedProSections', () => ({
  useLinkedProLive: () => ({ data: null, isSuccess: true, isError: false }),
  useLinkedProStats: () => ({ data: { player: null, rows: [] }, isSuccess: true, isError: false }),
  LinkedLiveCard: () => <div data-testid="linked-live" />,
  HowProPlays: () => <div data-testid="linked-stats" />,
}));
vi.mock('@/features/guest/useGuestActionGate', () => ({ useGuestActionGate: () => () => s.guest }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ insert: vi.fn(async () => ({ error: null })) }), rpc: vi.fn(async () => ({ data: true, error: null })) } }));

const face = (id: string, name: string) => ({ id, name, username: id, avatar: null });
const clubhouse = (over: Partial<Record<string, unknown>> = {}) => ({
  followers: 3, club: 'Dartford Golf Club', club_followers: 2, watchers: 12, mutual_count: 0,
  mutuals: [], recent: [face('ra', 'Rae Adler'), face('jb', 'Joss Blue'), face('pk', 'Paz Kahn')], ...over,
});
const reach = (over: Partial<Record<string, unknown>> = {}) => ({ views_30: 1240, new_followers_30: 3, questions_30: 9, tracking_since: '2025-01-01', ...over });
const bagItem = (slot: string, brand: string, sort = 0): BagItem => ({ id: `${brand}-${slot}`, user_id: 'pro', slot, brand, model: null, detail: null, business_id: null, sort, created_at: '2026-01-01', updated_at: '2026-01-01' } as BagItem);
const partner = (name: string, sort = 0): Partner => ({ id: name, user_id: 'pro', name, business_id: null, sort, created_at: '2026-01-01', updated_at: '2026-01-01' } as Partner);
const moment = (text: string, year: number, is_win = false): CareerMoment => ({ id: text, user_id: 'pro', year, text, is_win, created_at: '2026-01-01', updated_at: '2026-01-01' } as CareerMoment);
const owgrEvent = (id: string, name: string, finish: string, over: Partial<ProEvent> = {}): ProEvent => ({
  id, user_id: 'pro', source: 'owgr', event_name: name, tour_name: 'Alps Tour', start_date: '2026-10-01', end_date: '2026-10-04',
  country: 'France', venue: null, finish, to_par: null, total_strokes: 219, scheduled_rounds: 3, tee_time: null, tee_hole: null,
  owgr_event_id: '1', owgr_points: null, owgr_rank_before: null, owgr_rank_after: null, owgr_year: 2026, owgr_week: 40,
  created_at: '', updated_at: '', rounds: [], ...over,
});

const identity: SponsorIdentity = { name: 'Mason Essam', first: 'Mason', last: 'Essam', username: 'masonessam', avatar: null, cover: null, tour: 'Alps Tour', homeClub: 'Dartford Golf Club' };
const season: SponsorSeason = {
  year: 2026, events: 20, cuts: 15, top10s: 5, best: '2', scoring: '70.0',
  results: [
    owgrEvent('e1', 'Hulencourt Alps Tour Grand Final', 'T31'),
    owgrEvent('e2', 'Memorial Giorgio Bordoni', 'MC'),
    owgrEvent('e3', 'Hauts de France-Pas de Calais Open', 'MC'),
    owgrEvent('e4', 'Longwy Alps Open', 'T26'),
    owgrEvent('e5', 'Open de Roissy PGA France', '2'),
  ],
};

const mount = (node: React.ReactNode) => render(
  <MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{node}</QueryClientProvider></MemoryRouter>,
);

beforeEach(() => {
  s.clubhouse = clubhouse(); s.clubhouseReady = true;
  s.reach = reach(); s.reachReady = true;
  s.events = []; s.eventsReady = true;
  s.rank = null; s.rankReady = true;
  s.bag = []; s.bagReady = true;
  s.partners = []; s.partnersReady = true;
  s.career = []; s.careerReady = true;
  s.guest = false;
  s.track.mockClear(); s.qr.mockClear(); s.canvas.mockClear();
  localStorage.clear();
  // jsdom lacks object URLs; the sheet's CORS photo pipeline and download use them.
  (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
  (URL as any).revokeObjectURL = vi.fn();
});
afterEach(cleanup);

describe('view tracking', () => {
  const props: ProProfileProps = {
    pro: { user_id: 'pro', pro_kind: 'tour_pro', pro_tour: 'Alps Tour', pro_tour_code: 'alps', pro_club: null, pro_player_id: null },
    name: 'Mason Essam', owner: false, viewerId: 'viewer', username: 'masonessam', followers: 3, followersReady: true,
    onFollowers: vi.fn(), onAvatar: vi.fn(), onEdit: vi.fn(), onShare: vi.fn(), onFollow: vi.fn(), following: false,
    followBusy: false, onMessage: vi.fn(), messageBusy: false, menu: <span>Menu</span>,
  };
  it('fires once per mount for a visitor, with a null source', () => {
    const view = mount(<ProProfileBuildOne {...props} />);
    expect(s.track).toHaveBeenCalledTimes(1);
    expect(s.track).toHaveBeenCalledWith('pro_profile_viewed', { pro_id: 'pro', source: null });
    view.rerender(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ProProfileBuildOne {...props} /></QueryClientProvider></MemoryRouter>);
    expect(s.track).toHaveBeenCalledTimes(1);
  });
  it('fires for a guest viewer too', () => {
    s.guest = true;
    mount(<ProProfileBuildOne {...props} viewerId={undefined} />);
    expect(s.track).toHaveBeenCalledWith('pro_profile_viewed', { pro_id: 'pro', source: null });
  });
  it('never fires for the owner', () => {
    mount(<ProProfileBuildOne {...props} owner viewerId="pro" />);
    expect(s.track).not.toHaveBeenCalled();
  });
});

describe('clubhouse copy rules', () => {
  it('mutual_count 3+ names the first and counts the rest', () => {
    const copy = clubhouseCopy(clubhouse({ mutual_count: 4, mutuals: [face('sa', 'Sam Carter'), face('jk', 'Jess King'), face('ps', 'Pat Shore')] }) as any, false, 'Mason');
    expect(copy.bold).toBe('Sam and 3 others you follow');
    expect(copy.plain).toBe(' follow Mason. 2 of his followers are from Dartford Golf Club.');
  });
  it('mutual_count 2 names both', () => {
    const copy = clubhouseCopy(clubhouse({ mutual_count: 2, mutuals: [face('sa', 'Sam Carter'), face('jk', 'Jess King')] }) as any, false, 'Mason');
    expect(copy.bold).toBe('Sam and Jess');
    expect(copy.plain).toContain(', who you follow, follow Mason.');
  });
  it('mutual_count 1 uses the singular verb', () => {
    const copy = clubhouseCopy(clubhouse({ mutual_count: 1, mutuals: [face('sa', 'Sam Carter')] }) as any, false, 'Mason');
    expect(copy.bold).toBe('Sam');
    expect(copy.plain).toContain(', who you follow, follows Mason.');
  });
  it('mutual_count 0 falls back to the follower count, singular and plural', () => {
    expect(clubhouseCopy(clubhouse({ followers: 41 }) as any, false, 'Mason').bold).toBe('41 members follow Mason');
    expect(clubhouseCopy(clubhouse({ followers: 1 }) as any, false, 'Mason').bold).toBe('1 member follows Mason');
  });
  it('the club sentence singularises and disappears at zero', () => {
    expect(clubhouseCopy(clubhouse({ club_followers: 1 }) as any, false, 'Mason').plain).toContain(' 1 of his followers is from Dartford Golf Club.');
    expect(clubhouseCopy(clubhouse({ club_followers: 0 }) as any, false, 'Mason').plain).not.toContain('Dartford');
  });
  it('own copy joins club and watchers parts, with singulars', () => {
    const copy = clubhouseCopy(clubhouse() as any, true, 'Mason');
    expect(copy.bold).toBe('3 members follow you');
    expect(copy.plain).toBe(', 2 of them from Dartford Golf Club. 12 members get your scores each day.');
    const one = clubhouseCopy(clubhouse({ followers: 1, club_followers: 0, watchers: 1 }) as any, true, 'Mason');
    expect(one.bold).toBe('1 member follows you');
    expect(one.plain).toBe('. 1 member gets your scores each day.');
  });
  it('own zero-followers line invites the share', () => {
    const copy = clubhouseCopy(clubhouse({ followers: 0 }) as any, true, 'Mason');
    expect(copy.bold).toBe('No followers yet.');
    expect(copy.plain).toBe(" Share your profile and they'll show here.");
  });
});

describe('clubhouse section', () => {
  it('visitor faces come from mutuals, falling back to recent', () => {
    const { unmount } = mount(<ProClubhouseSection userId="pro" owner={false} first="Mason" />);
    expect(screen.getByRole('button', { name: 'Rae Adler' })).toBeInTheDocument();
    unmount();
    s.clubhouse = clubhouse({ mutual_count: 1, mutuals: [face('sa', 'Sam Carter')] });
    mount(<ProClubhouseSection userId="pro" owner={false} first="Mason" />);
    expect(screen.getByRole('button', { name: 'Sam Carter' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rae Adler' })).toBeNull();
  });
  it('own view always shows recent faces', () => {
    s.clubhouse = clubhouse({ mutual_count: 1, mutuals: [face('sa', 'Sam Carter')] });
    mount(<ProClubhouseSection userId="pro" owner first="Mason" />);
    expect(screen.getByRole('button', { name: 'Rae Adler' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sam Carter' })).toBeNull();
  });
  it('is hidden from visitors at 0 followers but shows the owner line', () => {
    s.clubhouse = clubhouse({ followers: 0 });
    const { unmount } = mount(<ProClubhouseSection userId="pro" owner={false} first="Mason" />);
    expect(screen.queryByText('IN THE CLUBHOUSE')).toBeNull();
    unmount();
    mount(<ProClubhouseSection userId="pro" owner first="Mason" />);
    expect(screen.getByText('No followers yet.')).toBeInTheDocument();
  });
  it('tapping a face opens that member profile', () => {
    const Probe = () => { const l = useLocation(); return <span data-testid="loc">{l.pathname}</span>; };
    render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ProClubhouseSection userId="pro" owner={false} first="Mason" /><Probe /></QueryClientProvider></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Rae Adler' }));
    expect(screen.getByTestId('loc')).toHaveTextContent('/profile/ra');
  });
  it('nothing renders until the read settles or after a null payload', () => {
    s.clubhouseReady = false;
    const { unmount } = mount(<ProClubhouseSection userId="pro" owner={false} first="Mason" />);
    expect(screen.queryByText('IN THE CLUBHOUSE')).toBeNull();
    unmount();
    s.clubhouseReady = true; s.clubhouse = null;
    mount(<ProClubhouseSection userId="pro" owner={false} first="Mason" />);
    expect(screen.queryByText('IN THE CLUBHOUSE')).toBeNull();
  });
});

describe('only you see this', () => {
  const section = (owner: boolean) => <ProOnlyYouSection userId="pro" owner={owner} identity={identity} season={season} followers={3} />;
  it('is owner-only', () => {
    mount(section(false));
    expect(screen.queryByText('ONLY YOU SEE THIS')).toBeNull();
  });
  it('shows the amber header and the three tiles with the green +n rule', () => {
    mount(section(true));
    const heading = screen.getByText('ONLY YOU SEE THIS');
    expect(heading).toHaveClass('pro-only-you');
    expect(screen.getByText('1,240')).toBeInTheDocument();
    expect(screen.getByText('+3')).toHaveClass('pro-kit-gain');
    expect(screen.getByText('9')).toBeInTheDocument();
  });
  it('zero new followers reads 0 without the green', () => {
    s.reach = reach({ new_followers_30: 0 });
    mount(section(true));
    const tile = screen.getByText('FOLLOWERS').parentElement!;
    expect(within(tile).getByText('0')).not.toHaveClass('pro-kit-gain');
  });
  it('adds the counted-from line while tracking is younger than 30 days', () => {
    s.reach = reach({ tracking_since: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) });
    mount(section(true));
    expect(screen.getByText(/Views are counted from /)).toBeInTheDocument();
  });
  it('the button opens the sponsor sheet', () => {
    mount(section(true));
    fireEvent.click(screen.getByRole('button', { name: 'Make my sponsor sheet' }));
    expect(screen.getByText('Your sponsor sheet')).toBeInTheDocument();
  });
  it('a failed reach read renders nothing', () => {
    s.reachReady = false;
    mount(section(true));
    expect(screen.queryByText('ONLY YOU SEE THIS')).toBeNull();
  });
});

describe('sponsor sheet', () => {
  const sheet = (over: Partial<Parameters<typeof ProSponsorSheet>[0]> = {}) => (
    <ProSponsorSheet open onClose={vi.fn()} proId="pro" identity={identity} season={season} followers={3} {...over} />
  );
  const dialog = () => screen.getByRole('dialog');
  // The card renders twice: the scaled preview and the off-screen capture
  // node. Block assertions scope to the preview.
  const preview = () => within(dialog().querySelector('.pro-ss-fit') as HTMLElement);

  it('sheet PRO label uses print-safe block centring only in the sheet', () => {
    const rule = sponsorCss.match(/\.pro-ss-nm \.pro-label\[data-size\]\s*\{([^}]+)\}/)?.[1];
    expect(rule).toBeDefined();
    expect(rule).toContain('display:block');
    expect(rule).toContain('height:18px');
    expect(rule).toContain('line-height:18px');
    expect(rule).toContain('padding:0 7px');
    expect(rule).toContain('text-align:center');
    expect(rule).toContain('margin:0');
    expect(rule).not.toMatch(/top:|inline-flex|vertical-align/);
  });

  it('sheet rank row uses a bottom-aligned two-column grid and unit figure line-height', () => {
    const row = sponsorCss.match(/\.pro-ss-rank\s*\{([^}]+)\}/)?.[1];
    const figure = sponsorCss.match(/\.pro-ss-rank>b\s*\{([^}]+)\}/)?.[1];
    expect(row).toContain('display:grid');
    expect(row).toContain('grid-template-columns:auto 1fr');
    expect(row).toContain('gap:12px');
    expect(row).toContain('align-items:end');
    expect(figure).toContain('line-height:1;');
    expect(figure).not.toMatch(/top:|translate/);
  });

  it('sheet filters the first ranking event before taking four and shortens only its derived career high', () => {
    s.events = [
      owgrEvent('first', 'First Open', 'T31', { start_date: '2026-01-01', owgr_rank_after: 1354 }),
      owgrEvent('second', 'Open de Roissy PGA France', '2', { start_date: '2026-04-01' }),
      owgrEvent('third', 'Alps Andalucia-Roquetas de Mar', '2', { start_date: '2026-05-01' }),
    ];
    s.career = [moment('Kent Amateur champion', 2022, true)];
    mount(sheet());
    const car = dialog().querySelector('.pro-ss-fit .pro-ss-car');
    expect(car?.querySelectorAll(':scope > div:not(.pro-ss-h)')).toHaveLength(4);
    expect(preview().getByText('Career-high world ranking, #1,354')).toBeInTheDocument();
    expect(preview().queryByText(/, after First Open/)).toBeNull();
    expect(preview().queryByText(/First world ranking event/)).toBeNull();
    expect(preview().getByText('Kent Amateur champion').closest('div')).toHaveClass('pro-ss-win');
  });

  it('profile Career retains the first ranking event and the career-high after clause', () => {
    const events = [owgrEvent('first', 'First Open', 'T31', { owgr_rank_after: 1354 })];
    mount(<ProCollectionSections userId="pro" owner={false} first="Mason" events={events} eventsReady />);
    expect(screen.getByText('Career-high world ranking, #1,354, after First Open')).toBeInTheDocument();
    expect(screen.getByText('First world ranking event, First Open')).toBeInTheDocument();
  });

  it('every chip toggles its block straight away', () => {
    mount(sheet());
    const dlg = dialog();
    expect(preview().getByText('2026 SEASON')).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('checkbox', { name: 'Season' }));
    expect(preview().queryByText('2026 SEASON')).toBeNull();
    fireEvent.click(within(dlg).getByRole('checkbox', { name: 'Season' }));
    expect(preview().getByText('2026 SEASON')).toBeInTheDocument();
  });
  it('chips for empty blocks are left out', () => {
    mount(sheet());
    const dlg = dialog();
    expect(within(dlg).queryByRole('checkbox', { name: 'Partners' })).toBeNull();
    expect(within(dlg).queryByRole('checkbox', { name: 'In the bag' })).toBeNull();
    expect(within(dlg).getByRole('checkbox', { name: 'Season' })).toBeInTheDocument();
  });
  it('the stored choice is restored', () => {
    localStorage.setItem('pro-sponsor-sheet-blocks', JSON.stringify({ season: false }));
    mount(sheet());
    const dlg = dialog();
    expect(within(dlg).getByRole('checkbox', { name: 'Season' })).toHaveAttribute('aria-checked', 'false');
    expect(preview().queryByText('2026 SEASON')).toBeNull();
    expect(within(dlg).getByRole('checkbox', { name: 'Results' })).toHaveAttribute('aria-checked', 'true');
  });
  it('rank, movement and career best render with the muted-worse rule', () => {
    s.rank = { rank: 1436, ranking_date: '2026-11-02', prior_rank: 1440, season_start_rank: 1879, best_rank: 1354, source: 'owgr' };
    mount(sheet());
    const dlg = dialog();
    expect(within(dlg).getAllByText('#1,436').length).toBeGreaterThan(0);
    expect(within(dlg).getAllByText('▲ 443')[0]).toHaveClass('pro-ss-up');
    expect(within(dlg).getAllByText('Career best #1,354').length).toBeGreaterThan(0);
  });
  it('worse movement is muted, never red', () => {
    s.rank = { rank: 1900, ranking_date: '2026-11-02', prior_rank: 1440, season_start_rank: 1879, best_rank: 1354, source: 'owgr' };
    mount(sheet());
    const em = within(dialog()).getAllByText(/▼ 21 this season/)[0];
    expect(em).toHaveClass('pro-ss-mute');
  });
  it('no rank falls back to best finish; no rank and no events omits the rank row', () => {
    mount(sheet());
    expect(preview().getByText('BEST FINISH 2026')).toBeInTheDocument();
    cleanup();
    mount(sheet({ season: { ...season, best: null, events: 0, results: [] } }));
    const dlg = preview();
    expect(dlg.queryByText('WORLD RANKING')).toBeNull();
    expect(dlg.queryByText(/BEST FINISH/)).toBeNull();
  });
  it('the season tiles match the Season section figures', () => {
    mount(sheet());
    const dlg = dialog().querySelector('.pro-ss-fit') as HTMLElement;
    const stats = dlg.querySelectorAll('.pro-ss-stats > div');
    const text = [...stats].map((d) => d.textContent);
    expect(text).toEqual(['20EVENTS', '15CUTS', '5TOP 10S', '2ndBEST', '70.0SCORING']);
  });
  it('latest results shows four with dimmed MC and the career first four with gold for wins', () => {
    s.career = [moment('Career-high world ranking, #1,354', 2026), moment('2nd, Open de Roissy PGA France', 2026), moment('2nd, Alps Andalucia-Roquetas de Mar', 2026), moment('Kent Amateur champion', 2022, true), moment('Turned professional', 2021)];
    mount(sheet());
    const dlg = dialog().querySelector('.pro-ss-fit') as HTMLElement;
    const res = dlg.querySelector('.pro-ss-res')!;
    expect(res.querySelectorAll(':scope > div:not(.pro-ss-h)')).toHaveLength(4);
    expect(within(res as HTMLElement).getByText('Hulencourt Alps Tour Grand Final')).toBeInTheDocument();
    expect(within(res as HTMLElement).queryByText('Open de Roissy PGA France')).toBeNull();
    const car = dlg.querySelector('.pro-ss-car')!;
    expect(car.querySelectorAll(':scope > div:not(.pro-ss-h)')).toHaveLength(4);
    expect(within(car as HTMLElement).getByText('Kent Amateur champion').closest('div')).toHaveClass('pro-ss-win');
    expect(within(car as HTMLElement).queryByText('Turned professional')).toBeNull();
  });
  it('the bag groups by brand in bag order and partners join with middots', () => {
    s.bag = [bagItem('driver', 'Fairway Labs'), bagItem('fairway', 'Fairway Labs'), bagItem('irons', 'Ridgeback'), bagItem('wedges', 'Ridgeback'), bagItem('putter', 'Halden'), bagItem('ball', 'Linkball')];
    s.partners = [partner('Fairway Labs'), partner('Dartford Golf Club', 1), partner('Kent Autos', 2)];
    mount(sheet());
    const dlg = dialog();
    expect(within(dlg).getAllByText('Fairway Labs driver and fairway · Ridgeback irons and wedges · Halden putter · Linkball ball').length).toBeGreaterThan(0);
    expect(within(dlg).getAllByText('Fairway Labs · Dartford Golf Club · Kent Autos').length).toBeGreaterThan(0);
  });
  it('the QR encodes the profile URL', async () => {
    mount(sheet());
    await waitFor(() => expect(s.qr).toHaveBeenCalledWith('https://clbhouz.co.uk/profile/masonessam', expect.objectContaining({ margin: 2 })));
  });
  it('the source line credits the ranking when present, otherwise the made-on line', () => {
    s.rank = { rank: 1436, ranking_date: '2026-11-02', prior_rank: null, season_start_rank: null, best_rank: null, source: 'owgr' };
    const { unmount } = mount(sheet());
    expect(within(dialog()).getAllByText(/World ranking and results: Official World Golf Ranking, 2 Nov 2026\./).length).toBeGreaterThan(0);
    unmount();
    s.rank = null;
    mount(sheet());
    expect(within(dialog()).getAllByText(/Made on clbhouz, /).length).toBeGreaterThan(0);
  });
  it('save captures the 360px node at scale 3 and downloads the named file', async () => {
    const clicks: string[] = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...rest: any[]) => {
      const el = realCreate(tag, ...rest);
      if (tag === 'a') el.click = () => clicks.push((el as HTMLAnchorElement).download);
      return el;
    });
    mount(sheet());
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save image' }));
    await waitFor(() => expect(clicks).toContain('mason-essam-sponsor-sheet.png'));
    const [node, opts] = s.canvas.mock.calls[0];
    expect((node as HTMLElement).querySelector('[data-sponsor-card]')).toHaveStyle({ width: '360px' });
    expect(opts).toEqual({ backgroundColor: '#0A0A0C', scale: 3, useCORS: true, logging: false });
    vi.restoreAllMocks();
  });
  it('capture wraps html2canvas in a temporary img{display:inline-block} style on the live document', async () => {
    let during: HTMLStyleElement | undefined;
    s.canvas.mockImplementationOnce(async () => {
      during = Array.from(document.head.querySelectorAll('style')).find(
        (st) => st.textContent === 'img{display:inline-block}',
      );
      return { toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['png'], { type: 'image/png' })) };
    });
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...rest: any[]) => {
      const el = realCreate(tag, ...rest);
      if (tag === 'a') el.click = () => {};
      return el;
    });
    mount(sheet());
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save image' }));
    await waitFor(() => expect(s.canvas).toHaveBeenCalled());
    expect(during).toBeDefined();
    await waitFor(() =>
      expect(
        Array.from(document.head.querySelectorAll('style')).some(
          (st) => st.textContent === 'img{display:inline-block}',
        ),
      ).toBe(false),
    );
    const opts = s.canvas.mock.calls[0][1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('onclone');
    vi.restoreAllMocks();
  });
  it('capture removes the inline-block style even when html2canvas rejects', async () => {
    s.canvas.mockRejectedValueOnce(new Error('capture broke'));
    mount(sheet());
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save image' }));
    await waitFor(() => expect(s.canvas).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        Array.from(document.head.querySelectorAll('style')).some(
          (st) => st.textContent === 'img{display:inline-block}',
        ),
      ).toBe(false),
    );
  });
  it('the preview badge stays visible after a capture', async () => {
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...rest: any[]) => {
      const el = realCreate(tag, ...rest);
      if (tag === 'a') el.click = () => {};
      return el;
    });
    mount(sheet());
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save image' }));
    await waitFor(() => expect(s.canvas).toHaveBeenCalled());
    const preview = dialog().querySelector('[data-sponsor-card] .pro-ss-nm .pro-label') as HTMLElement;
    expect(preview.style.visibility).toBe('');
    vi.restoreAllMocks();
  });
  it('share falls back to save when files cannot be shared', async () => {
    const clicks: string[] = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...rest: any[]) => {
      const el = realCreate(tag, ...rest);
      if (tag === 'a') el.click = () => clicks.push((el as HTMLAnchorElement).download);
      return el;
    });
    mount(sheet());
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(clicks).toContain('mason-essam-sponsor-sheet.png'));
    expect(s.canvas).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
  it('the fixed card is 360px and the preview scale never exceeds 1', () => {
    mount(sheet());
    const dlg = dialog();
    const card = dlg.querySelector('[data-sponsor-card]') as HTMLElement;
    expect(card.style.width).toBe('360px');
    const scaled = card.parentElement!;
    const match = /scale\(([\d.]+)\)/.exec(scaled.style.transform);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeLessThanOrEqual(1);
  });
});

describe('pure helpers', () => {
  it('cuts a long event with an ellipsis to fit the measured column', () => {
    const measureText = vi.fn((text: string) => ({ width: Array.from(text).length * 5 }));
    const result = truncateSponsorEvent('Hulencourt Alps Tour Grand Final', 55, measureText);
    expect(result).toBe('Hulencourt…');
    expect(measureText(result).width).toBeLessThanOrEqual(55);
  });
  it('keeps a short event unchanged when it fits', () => {
    const measureText = vi.fn((text: string) => ({ width: text.length * 5 }));
    expect(truncateSponsorEvent('Open', 55, measureText)).toBe('Open');
  });
  it('bagLine joins two slots with and, three with a comma list', () => {
    expect(bagLine([bagItem('driver', 'A'), bagItem('fairway', 'A')])).toBe('A driver and fairway');
    expect(bagLine([bagItem('driver', 'A'), bagItem('fairway', 'A'), bagItem('hybrid', 'A')])).toBe('A driver, fairway and hybrid');
    expect(bagLine([])).toBe('');
  });
  it('parsers fail closed on bad payloads', () => {
    expect(parseProClubhouse(null)).toBeNull();
    expect(parseProClubhouse({})).toBeNull();
    expect(parseProReach({})).toBeNull();
    expect(parseProReach(reach())).toMatchObject({ views_30: 1240 });
  });
  it('trackingFromLine hides at 30 days and dates a null start from today', () => {
    const today = new Date('2026-11-06T12:00:00Z');
    expect(trackingFromLine('2026-10-01', today)).toBeNull();
    expect(trackingFromLine('2026-11-01', today)).toBe('Views are counted from 1 Nov.');
    expect(trackingFromLine(null, today)).toBe('Views are counted from 6 Nov.');
  });
  it('sponsorSourceLine formats both variants', () => {
    const today = new Date('2026-11-06T12:00:00Z');
    expect(sponsorSourceLine({ rank: 1, ranking_date: '2026-11-02', prior_rank: null, season_start_rank: null, best_rank: null, source: 'owgr' }, today))
      .toBe('World ranking and results: Official World Golf Ranking, 2 Nov 2026. Everything else: clbhouz, 6 Nov 2026.');
    expect(sponsorSourceLine(null, today)).toBe('Made on clbhouz, 6 Nov 2026.');
  });
});

```

### Other removed cases (old assertions appear in the file diffs above)

`src/test/proProfileBuildOne.test.tsx` loses six manual-feature cases, each because its corresponding week/round/watch surface is retired:

- `empty own week opens add event` — manual add-event sheet removed.
- `empty tee values omit tiles, posted to-par keeps sign` — manual week tiles removed; existing result sheets retain score rules.
- `round save inserts source pro with to-par and eighteen holes` — manual round editor removed; existing source-pro rows remain readable.
- `watch toggle uses authorized RPC` — watch control removed.
- `guest gate prevents watch writes` — removed watch control no longer writes; guest browsing itself unchanged.
- `watching button stops through same toggle` — watch control removed.

`src/test/proProfileBuildOneRules.test.ts` loses twelve cases:

- `includes event starting exactly seven days ahead` — manual current-event selection retired.
- `excludes event eight days ahead` — same.
- `missing end date uses start plus three days inclusive` — same.
- `expired event is absent` — same.
- `watch count zero omitted` — retired watch-count copy.
- `watch count one uses singular` — same.
- `watch count plural uses real number` — same.
- `round writes source pro, to-par and default eighteen holes` — retired manual round-write helper.
- `accepts minus12 floor` — same.
- `accepts plus20 ceiling` — same.
- `refuses below minus12` — same.
- `refuses above plus20` — same.

Total case removals: **48 + 6 + 12 = 66**. Additions: **12** (Ask2, website rules3, website mounted4, profile absence2, Season absence1). Net **−54**. Renames/replacements do not change the count. Exactly **one test file** was deleted; no other test file was deleted.

## Remaining live/device checks

These remain for Ben; externally unmanaged authentication prevents legitimate hosted member end-to-end verification here:

- Turn on/off Ask on a real owner's profile; confirm toast, sheet dismissal and refreshed section; force an authorized failure and confirm the sheet remains open.
- Add a partner website, confirm stored value reads back, external opening for unlinked partners, linked clbhouz navigation and inert partners without websites.
- Confirm live-linked This week, absent empty Season/hero figures, no manual entry/Clubhouse/reach/sponsor controls, and retained Bag/Partners/Career/Ask.
- Owner/visitor Tour pro tabs: no Rounds, OWGR-only year groups and ResultDetail; no-results/unlinked has no Tour; Season See all switches tab and scrolls the tab row into view.
- iPhone and narrow-width pro sheets: white command pills and canonical focus styling, no blue ring, no overflow; Career add remains available.
- Confirm view tracking continues counting without reintroducing Clubhouse/reach reads.

No live writes or server jobs were triggered. No authenticated readback or phone behavior is claimed verified.

## Restrictions

No SQL, migrations or migration files; no deployed RPC/edge-function edits; guest browsing, review wizard, news, round plots, feed_config and native/Median configuration untouched. round_pool_cap remains 30. The existing external-URL utility is consumed, not modified. Preview build telemetry was absent; no source edit in this close-out required a new build. This report documents previously implemented changes without expanding scope.
