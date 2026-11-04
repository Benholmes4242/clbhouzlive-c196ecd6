# Your pick sheet v2 report

## Result
Implemented the signed-off field/board/summary/change/locked states, public viewer-keyed picks board, stable ActiveRing slots and opt-in gap colours, white sheet controls, overview See picks and MEMBERS’ PICKS doors, and event_count record continuation. Existing Pick guest gate, save refusals, other Tour comparisons and protected surfaces remain unchanged. System typography is preserved rather than loading the mock’s retired Geist.

The board contract was present in generated types; no SQL, migration, deployed RPC/edge, feed_config, pool cap, native/Median, review wizard, guest-browsing policy, news or round-plot changes.

## Verification
Focused command: `bunx vitest run src/test/yourPickSheet.test.tsx src/test/pickSheetV2.test.tsx src/test/integratedPicks.test.tsx src/test/tournamentPickInsights.test.tsx src/test/activeRing.test.tsx --maxWorkers=2`: **153/153**.
Full commands: `bunx vitest run --maxWorkers=2 --shard=n/4` for n=1,2,3,4:
- Shard 1: **1684/1684**, 146 files.
- Shard 2: **1580/1580**, 146 files.
- Shard 3: **1654/1654**, 146 files.
- Shard 4: **1657/1657**, 143 files.
- Total: **6575/6575 tests, 581 files**, no test failures or unhandled errors. No pre-existing failures encountered.
- Baseline: **6556/580** from HERO_HANDOVER_REPORT.md; delta **+19 tests/+1 file**, entirely `pickSheetV2.test.tsx` (19 new expanded cases). Existing `yourPickSheet.test.tsx` stays 28; `integratedPicks.test.tsx` stays 23. No test deleted. Shard redistribution results from adding one file.
- Full logs: `docs/verification/pick-sheet-v2/`.
- Latest automatic preview check: build OK at 07:40:24 UTC.

## Browser limitations
Real `/tourhub` checked at 390×844, no page errors. No live See picks/MEMBERS’ PICKS door was present in this visit, so the real board flow and mock visual parity are not verified. Hosted sign-in/saving is unavailable (`external_unmanaged`); authenticated save/readback is not claimed. Tests exercise successful save and board/state refetch with real providers, not a hosted account. No guest bypass or invented data used. Report event_count omitted when absent rather than substituting picks or inventing a total; hosted JSON not independently verified.

## Existing tests changed under brief authority
The following exact diffs name every changed existing assertion/setup and case name. Board fixtures and tee hook isolation are test apparatus; replacement cases encode explicitly retired followed tiles, summary opening and save-without-close rules. Existing error/refusal checks and counts remain.

### src/test/yourPickSheet.test.tsx
```diff
--- old
+++ new
@@ -11,6 +11,7 @@
 vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc } }));
 vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: mocks.user }) }));
 vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: () => mocks.guest ? { id: 'guest' } : null }));
+vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes', () => ({ usePickTeeTimes: () => ({ data: new Map(), isError: false }) }));
 vi.mock('@/lib/toast', () => ({ toast: { error: mocks.errorToast } }));
 
 import { YourPickSheet } from '@/features/tourhub/components/overview-v3/HybridHeroBands/YourPickSheet';
@@ -29,7 +30,13 @@
 const props = () => ({ open: true, onClose: close, tournamentId: 'event', eventName: 'Mexico Open', ourPicks, tourCode: 'pga' });
 const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}><MemoryRouter><I18nextProvider i18n={i18n}>{children}</I18nextProvider></MemoryRouter></QueryClientProvider>;
 function mount() { return render(<YourPickSheet {...props()} />, { wrapper }); }
-async function ready() { await screen.findByRole('radio', { name: 'Wyndham Clark' }); }
+async function ready() {
+  if (state.my_player_id) {
+    await screen.findByRole('button', { name: 'Change pick' });
+    fireEvent.click(screen.getByRole('button', { name: 'Change pick' }));
+  }
+  await screen.findByRole('radio', { name: 'Wyndham Clark' });
+}
 function submit() { return document.querySelector<HTMLButtonElement>('[data-pick-submit]') as HTMLButtonElement; }
 
 beforeEach(() => {
@@ -38,6 +45,7 @@
   mocks.user = { id: 'member', is_anonymous: false }; mocks.guest = false; mocks.errorToast.mockReset();
   state = { my_player_id: null, locks_at: '2026-11-05T07:40:00Z', locked: false, followed_pickers: 12, followed_top: [{ player_id: 'p0', player_name: names[0], picks: 5 }, { player_id: 'p3', player_name: names[3], picks: 1 }] };
   mocks.rpc.mockReset().mockImplementation(async (name: string, args: { p_player_id?: string }) => {
+    if (name === 'get_tournament_picks_board') return { data: [], error: null };
     if (name === 'get_pick_field') return { data: field, error: null };
     if (name === 'get_tournament_pick_state') return { data: [state], error: null };
     if (name === 'set_tournament_pick') {
@@ -59,11 +67,13 @@
     expect(screen.getAllByRole('radio').filter(item => item.getAttribute('aria-checked') === 'true')).toHaveLength(0);
     expect(mocks.rpc.mock.calls.some(call => call[0] === 'set_tournament_pick')).toBe(false);
   });
-  it('tapping a chosen followed tile again clears selection and disables submission', async () => {
-    mount(); await ready();
-    const tile = within(document.querySelector('[data-pick-followed]') as HTMLElement).getByRole('button', { name: 'Steven Fisk' });
-    fireEvent.click(tile); expect(screen.getByRole('radio', { name: 'Steven Fisk' })).toHaveAttribute('aria-checked', 'true');
-    fireEvent.click(tile); expect(screen.getByRole('radio', { name: 'Steven Fisk' })).toHaveAttribute('aria-checked', 'false'); expect(submit()).toBeDisabled();
+  it('the board segment opens the list and its footer returns to the field', async () => {
+    mount(); await ready();
+    fireEvent.click(screen.getByRole('tab', { name: "Who's picked who 0" }));
+    expect(screen.queryByRole('textbox')).toBeNull();
+    expect(document.querySelector('[data-picks-board]')).not.toBeNull();
+    fireEvent.click(screen.getByRole('button', { name: 'Pick a player' }));
+    expect(screen.getAllByRole('radio')).toHaveLength(10);
   });
   it('closing after clearing a saved pick preserves server and cached choice on reopening', async () => {
     state.my_player_id = 'p1'; const view = mount(); await ready();
@@ -85,26 +95,23 @@
     const rest = document.querySelector('[data-pick-field]');
     expect(Array.from(rest?.querySelectorAll('[data-pick-player]') ?? []).map(row => row.getAttribute('data-pick-player'))).toEqual(['p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']);
   });
-  it('reads only the field and state RPCs with tournament identity', async () => {
+  it('reads the field state and public board RPCs with tournament identity', async () => {
     mount(); await ready();
     expect(mocks.rpc).toHaveBeenCalledWith('get_pick_field', { p_tournament_id: 'event' });
     expect(mocks.rpc).toHaveBeenCalledWith('get_tournament_pick_state', { p_tournament_id: 'event' });
-    expect(new Set(mocks.rpc.mock.calls.map(call => call[0]))).toEqual(new Set(['get_pick_field', 'get_tournament_pick_state']));
-  });
-  it('shows followed tiles and singular/plural counts when at least one followed member picked', async () => {
-    mount(); await ready();
-    const tiles = document.querySelector('[data-pick-followed]') as HTMLElement;
-    expect(within(tiles).getAllByRole('button')).toHaveLength(2);
-    expect(tiles.textContent).toContain('5 picks'); expect(tiles.textContent).toContain('1 pick');
-  });
-  it('hides followed tiles when no followed member picked', async () => {
-    state.followed_pickers = 0; mount(); await ready();
-    expect(document.querySelector('[data-pick-followed]')).toBeNull();
-  });
-  it('tapping a followed tile chooses its field player', async () => {
-    mount(); await ready();
-    fireEvent.click(within(document.querySelector('[data-pick-followed]') as HTMLElement).getByRole('button', { name: 'Steven Fisk' }));
-    expect(screen.getByRole('radio', { name: 'Steven Fisk' })).toHaveAttribute('aria-checked', 'true');
+    expect(new Set(mocks.rpc.mock.calls.map(call => call[0]))).toEqual(new Set(['get_pick_field', 'get_tournament_pick_state', 'get_tournament_picks_board']));
+  });
+  it('the former followed tiles are absent even with followed pickers', async () => {
+    mount(); await ready(); expect(document.querySelector('[data-pick-followed]')).toBeNull();
+  });
+  it('both switch segments are present before a pick', async () => {
+    mount(); await ready(); expect(screen.getAllByRole('tab')).toHaveLength(2);
+    expect(screen.getByRole('tab', { name: 'Pick a player' })).toHaveAttribute('aria-selected','true');
+  });
+  it('board footer returns without submitting a pick', async () => {
+    mount(); await ready(); fireEvent.click(screen.getAllByRole('tab')[1]);
+    fireEvent.click(screen.getByRole('button',{name:'Pick a player'}));
+    expect(mocks.rpc.mock.calls.some(call=>call[0]==='set_tournament_pick')).toBe(false);
   });
   it('unranked metadata omits a missing country and keeps RPC order', async () => {
     mount(); await ready();
@@ -138,19 +145,26 @@
     fireEvent.click(screen.getByRole('radio', { name: 'Doug Ghim' }));
     expect(screen.getAllByRole('radio').filter(row => row.getAttribute('aria-checked') === 'true')).toHaveLength(1);
   });
-  it('submits tournament and player ids, actively refetches state and closes', async () => {
+  it('submits tournament and player ids, refetches state and board and returns to summary', async () => {
     const invalidate = vi.spyOn(client, 'invalidateQueries'); mount(); await ready();
     fireEvent.click(screen.getByRole('radio', { name: 'Tom Kim' })); fireEvent.click(submit());
-    await waitFor(() => expect(close).toHaveBeenCalledOnce());
+    await screen.findByRole('button', {name:'Change pick'}); expect(close).not.toHaveBeenCalled();
     expect(mocks.rpc).toHaveBeenCalledWith('set_tournament_pick', { p_tournament_id: 'event', p_player_id: 'p1' });
     expect(invalidate).toHaveBeenCalledWith({ queryKey: tournamentPickStateKey('event', 'member'), refetchType: 'active' });
     expect(mocks.rpc.mock.calls.filter(call => call[0] === 'get_tournament_pick_state')).toHaveLength(2);
     expect(client.getQueryData(tournamentPickStateKey('event', 'member'))).toMatchObject({ my_player_id: 'p1' });
-  });
-  it('opens with the current pick chosen and closes without rewriting that pick', async () => {
-    state.my_player_id = 'p1'; mount(); await ready();
-    await waitFor(() => expect(screen.getByRole('radio', { name: 'Tom Kim' })).toHaveAttribute('aria-checked', 'true'));
-    fireEvent.click(submit()); expect(close).toHaveBeenCalledOnce();
+    expect(mocks.rpc.mock.calls.filter(call => call[0] === 'get_tournament_picks_board')).toHaveLength(2);
+  });
+  it('opens on summary and keeping the preselected current pick never rewrites it', async () => {
+    state.my_player_id = 'p1'; mount();
+    await screen.findByRole('button', {name:'Change pick'});
+    expect(screen.queryAllByRole('radio')).toHaveLength(0);
+    fireEvent.click(screen.getByRole('button',{name:'Change pick'}));
+    expect(screen.getByRole('radio',{name:'Tom Kim'})).toHaveAttribute('aria-checked','true');
+    expect(submit()).toBeDisabled();
+    fireEvent.click(screen.getByRole('button',{name:'Keep Tom Kim'}));
+    expect(screen.getByRole('button',{name:'Change pick'})).toBeInTheDocument();
+    expect(close).not.toHaveBeenCalled();
     expect(mocks.rpc.mock.calls.some(call => call[0] === 'set_tournament_pick')).toBe(false);
   });
   it('reopening clears search and resets to the current pick', async () => {
@@ -161,10 +175,11 @@
     expect(screen.getByRole('textbox')).toHaveValue('');
     await waitFor(() => expect(screen.getByRole('radio', { name: 'Tom Kim' })).toHaveAttribute('aria-checked', 'true'));
   });
-  it('locked state renders header and refusal only, with no list or submit', async () => {
+  it('locked state renders header and read-only board with no field or submit', async () => {
     state.locked = true; mount(); await waitFor(() => expect(document.querySelector('[data-picks-locked]')).not.toBeNull());
     expect(screen.getByRole('heading').textContent).toBe('Who wins the Mexico Open?');
     expect(screen.queryByRole('textbox')).toBeNull(); expect(screen.queryAllByRole('radio')).toHaveLength(0); expect(submit()).toBeNull();
+    await waitFor(()=>expect(document.querySelector('[data-picks-board]')).not.toBeNull());
   });
   it('server lock refusal toasts exact copy and closes', async () => {
     writeError = 'picks are locked'; mount(); await ready(); fireEvent.click(screen.getByRole('radio', { name: 'Tom Kim' })); fireEvent.click(submit());
```

### src/test/integratedPicks.test.tsx
```diff
--- old
+++ new
@@ -33,8 +33,8 @@
   it.each([[0,0,'And you were the best pick in your circle of seven.'],[0,1,'And you were level best pick in your circle of seven.'],[1,0,'Only one of your circle of seven did better: their best pick was Fisk, T3.'],[2,0,'Two of your circle of seven did better: their best pick was Fisk, T3.']])('finished ahead=%i level=%i uses circle results',(ahead,level,text)=>{expect(finishedCircleLine({circle_pickers:7,ahead:Number(ahead),level:Number(level)},state,copy)).toBe(text);});
 });
 describe('integrated card states',()=>{
-  it('no pick combines question, exact lock copy, digit circle count and action',()=>{mount(<YourPickCard state={{...state,my_player_id:null}} phase="upcoming" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-pick-question]')?.textContent).toBe("Who's your winner?");expect(document.querySelector('[data-pick-how]')?.textContent).toBe('Beat your circle. One pick before the first tee, 03:19 Thursday, scored the same way as ours.');expect(document.querySelector('[data-followed-picks] > span:last-child')?.textContent).toBe('6 of your circle have picked. Most picked: Ghim.');expect(screen.getByRole('button',{name:'Pick'})).toBeTruthy();});
-  it('picked includes tee day and Change while circle line remains inside card',()=>{mount(<YourPickCard state={state} phase="upcoming" teeTime="2026-11-05T08:01:00Z" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-pick-question]')?.textContent).toBe("You're in. Now beat your circle.");expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Tees off 08:01 Thursday');expect(document.querySelector('[data-followed-picks]')?.closest('[data-your-pick-card]')).not.toBeNull();expect(screen.getByRole('button',{name:'Change'})).toBeTruthy();});
+  it('no pick combines question, exact lock copy, digit circle count and action',()=>{mount(<YourPickCard state={{...state,my_player_id:null}} phase="upcoming" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-pick-question]')?.textContent).toBe("Who's your winner?");expect(document.querySelector('[data-pick-how]')?.textContent).toBe('Beat your circle. One pick before the first tee, 03:19 Thursday, scored the same way as ours.');expect(document.querySelector('[data-pick-circle-text]')?.textContent).toBe('6 of your circle have picked. Most picked: Ghim.');expect(screen.getByRole('button',{name:'Pick'})).toBeTruthy();});
+  it('picked includes tee day and Change while circle line remains inside card',()=>{mount(<YourPickCard state={state} phase="upcoming" teeTime="2026-11-05T08:01:00Z" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-pick-question]')?.textContent).toBe("You're in. Over to Kim.");expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Tees off 08:01 Thursday');expect(document.querySelector('[data-followed-picks]')?.closest('[data-your-pick-card]')).not.toBeNull();expect(screen.getByRole('button',{name:'Change'})).toBeTruthy();});
   it('live heading and sentence separate circle from our best; finished has no circle footer',()=>{const view=mount(<YourPickCard state={{...state,locked:true}} circleRank={{circle_pickers:7,ahead:2,level:0}} phase="live" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-pick-question]')?.textContent).toBe('Two of your circle are ahead of you');expect(document.querySelector('[data-pick-how]')?.textContent).toBe('Your pick is behind Ghim, our best pick so far.');view.rerender(<YourPickCard state={state} circleRank={{circle_pickers:0,ahead:0,level:0}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-followed-picks]')).toBeNull();});
 });
 function Rank(){const q=useTournamentCircleRank('event',true);return <output>{q.data?.ahead}</output>;}
```

## New cases
- groups most picked first and breaks player ties alphabetically
- orders viewer then followed then everyone alphabetically
- uses username when display name is absent
- limits disclosure to six then expands and folds in place
- public board reads for %s without member state
- guest sheet is read-only with the same list and no footer
- empty board remains a genuine empty list
- saved pick opens summary and Change enters with current pick disabled
- Keep returns to summary without saving
- changing saves then returns to summary and refetches board without closing
- locked summary with own pick %s retains board without actions
- board read failure does not masquerade as empty picks
- See picks opens board or saved summary for picked=%s
- guest See picks bypasses Pick gate while Pick stays gated
- locked no-pick members door opens read-only board
- record continuation reads ten events not thirty picks
