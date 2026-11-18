# Tee-time group duplicate — fix delivered, suite stopped

## Change
Only the requested expression in `selectTeeGroups` changed:
```ts
const feature=(def&&!your.includes(def)?def:null)??ranked.map(...)
```
Every other expression in the function is identical. An upcoming defender group already in Your groups is excluded from Marquee; the existing world-rank fallback selects a non-your group, or returns no feature. Live selection is unchanged. No existing test edited, renamed or deleted by this fix. No SQL, migrations, RPC changes, feed_config changes or cap changes.

## Verification
Focused command: `npx vitest run src/test/yourPickRemoval.test.tsx src/test/tournamentV3Sections.test.tsx src/test/tournamentV3Rules.test.ts src/test/tournamentV3Page.test.tsx --maxWorkers=2`.
**81/81 passed**, four files (3 / 15 / 60 / 3). The existing duplicate-tag assertion passed unchanged. Rules file: **59 before / 60 after**.

Full-suite shards were run sequentially:
- `npx vitest run --maxWorkers=2 --shard=1/4`: **2,225/2,225 passed**, 202 files.
- `npx vitest run --maxWorkers=2 --shard=2/4`: **2,245 executed / 2,244 passed / one failed**, 202 files.
- Shards 3/4 and 4/4: **not run**, per stop rule.

Total executed: **4,470**; passed **4,469**; failed **one**. Full-suite passing total is **unavailable**, not 9,071. Last verified complete passing suite remains **9,164**. Expected full inventory: **9,071**.

### STOP
Untouched `src/test/tourPlayerHeroBand.test.tsx:18:310`:
```text
FAIL  src/test/tourPlayerHeroBand.test.tsx > signed-off tour player hero > next-start pick action opens only on an explicit tap
Error: Missing pick
 ❯ src/test/tourPlayerHeroBand.test.tsx:18:310
```
Its exact retained assertions and guard:
```ts
expect(p.onPick).not.toHaveBeenCalled();
const button=container.querySelector('[data-next-start] button');
if(!button)throw Error('Missing pick');
fireEvent.click(button);
expect(p.onPick).toHaveBeenCalledTimes(1);
expect(container.querySelector('[data-next-start]')).not.toBeNull();
```
This earlier pick-action contract still expects the removed member-pick button. No repair, rerun or further shard was attempted after this unexpected failure.

Preview harness: **2026-11-18T11:49:55Z — build OK**. `git diff --check` passed. No manual build/typecheck run. No authenticated end-to-end browser verification claimed; the four focused tests exercise actual tee section rendering and the selected-group rule.

## Inventory reconciliation against 9,164
| Change | Deleted | Added | Expected inventory |
| --- | ---: | ---: | ---: |
| Last completed suite | 0 | 0 | 9,164 |
| Your pick removal | 100 | 4 | 9,068 |
| iPhone excerpt fix | 0 | 2 | 9,070 |
| This duplicate fix | 0 | 1 | 9,071 |

**9,164 − 100 + 4 + 2 + 1 = 9,071** (net −93). Historical changed cases have zero count delta; names and original/replacement assertions are reproduced below. Historical source: committed `.lovable/reports/your-pick-removal.md`, checked against `git diff b50a6b1bde..9384c6cc1c -- src/test`. The retired expanded-case count sums to 100, including the one generated pro-member surface case.

### Four additions from Your pick removal
`src/test/yourPickRemoval.test.tsx`:
- `upcoming overview retains Our tournament picks without member-pick bands`: retains Our picks heading, excludes member pick question/strip.
- `tee tags prioritise Our pick then following then defending without viewer treatment`: exact ordered tags `[ourPick, following, defending]`, no viewer treatment or Your pick tag; unchanged in this fix.
- `no production import reaches a retired member-pick module`: forbidden production imports equal `[]`.
`src/test/playerRebuildPage.test.tsx`:
- `player Next retains event and start day without a member-pick action`: retains next event/date and no member pick button.

### Two additions from excerpt fix
`src/test/reviewExcerptTextFlow.test.tsx`:
- `media-first review body opts every nested member name into text flow`: nested opt-in flow, no default-flow names in body, retained AM badge, untouched header flow.
- `default member name preserves its existing structure including badge attributes`: original default markup inline snapshot retained.
No historical test changed/deleted/renamed by the excerpt fix.

### One addition from this fix
`src/test/tournamentV3Rules.test.ts`:
- `defender sharing a followed group appears once in your and marquee uses the top-ranked non-your group or stays empty`.
Assertions:
```ts
expect(selected.your).toEqual([shared]);
expect(selected.feature).toEqual([top]);
expect(selectTeeGroups([shared],'upcoming',new Set<string>(),new Set(['follow']),field,'def').feature).toEqual([]);
```
Fixture includes defender ranked 1 inside the followed group, eligible groups ranked 2 and 8, with field input deliberately unsorted. Tests highest-ranked eligible selection and empty fallback within the single requested case.

## Historical deletions and changed cases — names, assertions and reasons
## Deleted and changed tests (quoted original assertions)

### src/test/buttonBaseClassGuard.test.ts

### src/test/g2bTourHeaders.test.tsx

### src/test/guestTournamentPickLock.test.tsx

- Deleted 'signed-out viewers read both public scalar functions and never member state' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('signed-out viewers read both public scalar functions and never member state', async () => {
    mount(); await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('tournament_pick_is_locked', { p_tournament_id: 'event' }));
    expect(f.rpc).toHaveBeenCalledWith('tournament_pick_locks_at', { p_tournament_id: 'event' });
    expect(f.rpc).not.toHaveBeenCalledWith('get_tournament_pick_state', expect.anything());
  });
```

- Deleted 'anonymous viewers also use public lock reads' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('anonymous viewers also use public lock reads', async () => {
    f.user = { id: 'guest', is_anonymous: true }; mount();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('tournament_pick_locks_at', { p_tournament_id: 'event' }));
    expect(f.rpc).not.toHaveBeenCalledWith('get_tournament_pick_state', expect.anything());
  });
```

- Deleted 'the server locked flag removes the guest card' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('the server locked flag removes the guest card', async () => {
    f.locked = true; mount();
    await waitFor(() => expect(client.getQueryData(['tourhub', 'guest-pick-lock', 'event', undefined])).toEqual({ locks_at: f.time, locked: true }));
    expect(screen.queryByRole('button', { name: 'Pick' })).toBeNull();
  });
```

- Deleted 'null lock time stays null and unlocked rather than inventing a timestamp' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('null lock time stays null and unlocked rather than inventing a timestamp', async () => {
    f.time = null; mount();
    await waitFor(() => expect(client.getQueryData(['tourhub', 'guest-pick-lock', 'event', undefined])).toEqual({ locks_at: null, locked: false }));
    expect(screen.getByRole('button', { name: 'Pick' })).toBeTruthy();
  });
```

- Deleted 'members retain the member-state function and issue no public lock reads' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('members retain the member-state function and issue no public lock reads', async () => {
    f.user = { id: 'member', is_anonymous: false }; mount();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('get_tournament_pick_state', { p_tournament_id: 'event' }));
    expect(f.rpc).not.toHaveBeenCalledWith('tournament_pick_locks_at', expect.anything());
    expect(f.rpc).not.toHaveBeenCalledWith('tournament_pick_is_locked', expect.anything());
  });
```

### src/test/integratedPicks.test.tsx

- Deleted 'ahead=%i level=%i gives authoritative heading' (5 expanded cases): retired member-pick-only coverage.

```tsx
it.each([[0,0,"You're top of your circle"],[0,1,"You're level top of your circle"],[1,0,'One of your circle is ahead of you'],[2,0,'Two of your circle are ahead of you'],[10,0,'Ten of your circle are ahead of you']])('ahead=%i level=%i gives authoritative heading',(ahead,level,text)=>{expect(liveCircleHeading({circle_pickers:7,ahead:Number(ahead),level:Number(level)},copy)).toBe(text);});
```

- Deleted 'nobody picked gives against-ours and percentile, missing rank invents nothing' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('nobody picked gives against-ours and percentile, missing rank invents nothing',()=>{expect(liveCircleHeading({circle_pickers:0,ahead:0,level:0},copy)).toBe('You against our picks');expect(finishedCircleLine({circle_pickers:0,ahead:0,level:0},state,copy)).toBe('Beat 95% of the field.');expect(liveCircleHeading(null,copy)).toBe('');});
```

- Deleted 'live position %i compares with best active pick' (3 expanded cases): retired member-pick-only coverage.

```tsx
it.each([[1,'Your pick is ahead of all our picks.'],[3,'Your pick is level with Ghim, our best pick so far.'],[9,'Your pick is behind Ghim, our best pick so far.']])('live position %i compares with best active pick',(position,text)=>{expect(liveOurLine({...mine,position:Number(position)},ours,copy)).toBe(text);});
```

- Deleted 'own-model and eliminated cases take precedence' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('own-model and eliminated cases take precedence',()=>{expect(liveOurLine(mine,[mine,...ours],copy)).toBe('Your pick is one of ours.');expect(liveOurLine({...mine,status:'MC'},ours,copy)).toBe('Your pick missed the cut.');expect(liveOurLine({...mine,status:'WD'},ours,copy)).toBe('Your pick withdrew.');});
```

- Deleted 'finished position %i compares with best' (3 expanded cases): retired member-pick-only coverage.

```tsx
it.each([[1,'You beat our best pick'],[3,'You matched our best pick'],[9,'Our best pick beat yours']])('finished position %i compares with best',(position,text)=>{expect(finishedOurHeading({...mine,position:Number(position)},ours,copy)).toBe(text);});
```

- Deleted 'finished ahead=%i level=%i uses circle results' (4 expanded cases): retired member-pick-only coverage.

```tsx
it.each([[0,0,'And you were the best pick in your circle of seven.'],[0,1,'And you were level best pick in your circle of seven.'],[1,0,'Only one of your circle of seven did better: their best pick was Fisk, T3.'],[2,0,'Two of your circle of seven did better: their best pick was Fisk, T3.']])('finished ahead=%i level=%i uses circle results',(ahead,level,text)=>{expect(finishedCircleLine({circle_pickers:7,ahead:Number(ahead),level:Number(level)},state,copy)).toBe(text);});
```

- Deleted 'no pick combines question, exact lock copy, digit circle count and action' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('no pick combines question, exact lock copy, digit circle count and action',()=>{mount(<YourPickCard state={{...state,my_player_id:null}} phase="upcoming" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-pick-question]')?.textContent).toBe("Who's your winner?");expect(document.querySelector('[data-pick-how]')?.textContent).toBe('Beat your circle. One pick before the first tee, 03:19 Thursday, scored the same way as ours.');expect(document.querySelector('[data-pick-circle-text]')?.textContent).toBe('6 of your circle have picked. Most picked: Ghim.');expect(screen.getByRole('button',{name:'Pick'})).toBeTruthy();});
```

- Deleted 'picked includes tee day and Change while circle line remains inside card' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('picked includes tee day and Change while circle line remains inside card',()=>{mount(<YourPickCard state={state} phase="upcoming" teeTime="2026-11-05T08:01:00Z" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-pick-question]')?.textContent).toBe("You're in. Over to Kim.");expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Tees off 08:01 Thursday');expect(document.querySelector('[data-followed-picks]')?.closest('[data-your-pick-card]')).not.toBeNull();expect(screen.getByRole('button',{name:'Change'})).toBeTruthy();});
```

- Deleted 'live heading and sentence separate circle from our best; finished has no circle footer' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('live heading and sentence separate circle from our best; finished has no circle footer',()=>{const view=mount(<YourPickCard state={{...state,locked:true}} circleRank={{circle_pickers:7,ahead:2,level:0}} phase="live" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-pick-question]')?.textContent).toBe('Two of your circle are ahead of you');expect(document.querySelector('[data-pick-how]')?.textContent).toBe('Your pick is behind Ghim, our best pick so far.');view.rerender(<YourPickCard state={state} circleRank={{circle_pickers:0,ahead:0,level:0}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-followed-picks]')).toBeNull();});
```

- Deleted 'reads the RPC and refetches on matching board success only' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('reads the RPC and refetches on matching board success only',async()=>{mount(<Rank/>);await waitFor(()=>expect(f.rpc).toHaveBeenCalledTimes(1));expect(f.rpc).toHaveBeenCalledWith('get_tournament_circle_rank',{p_tournament_id:'event'});client.setQueryData(['tourhub','leaderboard','other'],[]);expect(f.rpc).toHaveBeenCalledTimes(1);client.setQueryData(['tourhub','leaderboard','event'],[]);await waitFor(()=>expect(f.rpc).toHaveBeenCalledTimes(2));});
```

- Deleted 'does not read for signed-out members' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('does not read for signed-out members',()=>{f.user=null;mount(<Rank/>);expect(f.rpc).not.toHaveBeenCalled();});
```

- Deleted 'does not read for anonymous members' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('does not read for anonymous members',()=>{f.user={id:'guest',is_anonymous:true};mount(<Rank/>);expect(f.rpc).not.toHaveBeenCalled();});
```

### src/test/overviewHeroBStrip.test.tsx

- Deleted 'renders the snapshot, member faces and both board actions' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('renders the snapshot, member faces and both board actions',()=>{
    const open=vi.fn();
    const v=mount(<PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="live" currentRound={3} pickResults={[]} startedPlayers={new Set()} boardByPlayer={new Map([['griffin',{position:22,tied:true,score:-11}]])} onPick={open}/>);
    expect(v.container.querySelector('[data-members-picks-name]')?.textContent).toBe('Griffin T22 −11');
    expect(v.container.textContent).toContain('Joint most picked · 1 of 2 members');
    expect(v.container.textContent).toContain('Picks for this week are locked.');
    expect(v.container.querySelectorAll('[data-members-picks-face]')).toHaveLength(2);
    const tile=v.container.querySelector('[data-members-picks-tile]');if(!tile)throw Error('Missing tile');fireEvent.click(tile);
    const link=v.getByRole('button',{name:'See every pick ›'});fireEvent.click(link);expect(open.mock.calls).toEqual([['board'],['board']]);
  });
```

- Deleted 'caps faces at three and uses genuine counts for an outright most picked' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('caps faces at three and uses genuine counts for an outright most picked',()=>{
    f.rows=[member('one'),member('two'),member('three'),member('four','malnati')];const v=mount(strip());
    expect(v.container.querySelectorAll('[data-members-picks-face]')).toHaveLength(3);
    expect(v.container.textContent).toContain('Most picked · 3 of 4 members');
  });
```

- Deleted 'uses singular and surname alone without a board entry' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('uses singular and surname alone without a board entry',()=>{
    f.rows=[member('one')];const v=mount(strip(new Map()));
    expect(v.container.querySelector('[data-members-picks-name]')?.textContent).toBe('Griffin');
    expect(v.container.textContent).toContain('Most picked · 1 of 1 member');
  });
```

- Deleted 'never shows the strip when the viewer has a pick' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('never shows the strip when the viewer has a pick',()=>{
    f.mine='griffin';const v=mount(strip());expect(v.container.querySelector('[data-members-picks-strip]')).toBeNull();
  });
```

- Changed 'renders actual components for narrow-screen verification with caller board spacing': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it('renders actual components for narrow-screen verification with caller board spacing',()=>{
    const entries=[{id:'j',position:1,score:-18,round_1:-8,round_2:-7,today:-3,today_round:3,thru:8,player:{id:'j',full_name:'Benjamin James'}},{id:'b',position:2,score:-16,round_1:-9,round_2:-6,today:-1,today_round:3,thru:8,player:{id:'b',full_name:'Peter Malnati'}}];
    const v=mount(<>{photo({kind:'live',round:3,totalRounds:4},'PGA TOUR WITH A VERY LONG TOUR NAME')}<HeroBoardSection tournamentId="event" entries={entries} phase="live" currentRound={3} totalRounds={4}/>{strip()}{photo({kind:'upcoming',variant:'far',countdown:'',meta:''},'CHAMPIONS TOUR')}</>);
    const header=v.container.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(header?.parentElement?.style.paddingTop).toBe('0px');
    if(process.env.OVERVIEW_B_BROWSER==='1'){mkdirSync('/tmp/browser/overview-b',{recursive:true});writeFileSync('/tmp/browser/overview-b/components.html',v.container.innerHTML);}
  });
```

Now:
```tsx
it('renders actual components for narrow-screen verification with caller board spacing',()=>{
    const entries=[{id:'j',position:1,score:-18,round_1:-8,round_2:-7,today:-3,today_round:3,thru:8,player:{id:'j',full_name:'Benjamin James'}},{id:'b',position:2,score:-16,round_1:-9,round_2:-6,today:-1,today_round:3,thru:8,player:{id:'b',full_name:'Peter Malnati'}}];
    const v=mount(<>{photo({kind:'live',round:3,totalRounds:4},'PGA TOUR WITH A VERY LONG TOUR NAME')}<HeroBoardSection tournamentId="event" entries={entries} phase="live" currentRound={3} totalRounds={4}/>{photo({kind:'upcoming',variant:'far',countdown:'',meta:''},'CHAMPIONS TOUR')}</>);
    const header=v.container.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(header?.parentElement?.style.paddingTop).toBe('0px');
    if(process.env.OVERVIEW_B_BROWSER==='1'){mkdirSync('/tmp/browser/overview-b',{recursive:true});writeFileSync('/tmp/browser/overview-b/components.html',v.container.innerHTML);}
  });
```

### src/test/pickRing.test.tsx

- Deleted 'YourPickCard pick face has the gradient ring and no data-active-ring' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('YourPickCard pick face has the gradient ring and no data-active-ring', () => {
    const { container } = render(<MemoryRouter><QueryClientProvider client={client}><I18nextProvider i18n={i18n}>
      <YourPickCard state={{ ...state, my_player_name: 'Tom Kim' } as never} phase="upcoming" ourResults={[]} tourCode="pga" onPick={() => {}} />
    </I18nextProvider></QueryClientProvider></MemoryRouter>);
    const face = container.querySelector('.pick-mine-face') as HTMLElement;
    expect(face).not.toBeNull();
    expect(face.querySelector('[data-active-ring]')).toBeNull();
    expect(face.querySelector('[data-avatar-ring-gradient]')).not.toBeNull();
  });
```

- Deleted 'YourPickSheet header pick face has the gradient ring and no data-active-ring' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('YourPickSheet header pick face has the gradient ring and no data-active-ring', async () => {
    render(<YourPickSheet open onClose={() => {}} tournamentId="event" eventName="Mexico Open" ourPicks={ourPicks} tourCode="pga" />, { wrapper });
    await screen.findByRole('button', { name: 'Change pick' });
    const mine = document.querySelector('[data-sheet-your-pick]') as HTMLElement;
    expect(mine).not.toBeNull();
    expect(mine.querySelector('[data-active-ring]')).toBeNull();
    expect(mine.querySelector('[data-avatar-ring-gradient]')).not.toBeNull();
  });
```

- Deleted 'chosen sheet row carries the gradient ring, unchosen rows the hairline, all at 36px' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('chosen sheet row carries the gradient ring, unchosen rows the hairline, all at 36px', async () => {
    render(<YourPickSheet open onClose={() => {}} tournamentId="event" eventName="Mexico Open" ourPicks={ourPicks} tourCode="pga" />, { wrapper });
    await screen.findByRole('button', { name: 'Change pick' });
    fireEvent.click(screen.getByRole('button', { name: 'Change pick' }));
    const chosenRow = await screen.findByRole('radio', { name: 'Wyndham Clark' });
    const unchosenRow = screen.getByRole('radio', { name: 'Doug Ghim' });
    fireEvent.click(chosenRow);
    expect(chosenRow.getAttribute('aria-checked')).toBe('true');
    const chosenAvatar = chosenRow.querySelector('.your-pick-avatar') as HTMLElement;
    const unchosenAvatar = unchosenRow.querySelector('.your-pick-avatar') as HTMLElement;
    expect(chosenAvatar.querySelector('[data-avatar-ring-gradient]')).not.toBeNull();
    expect(unchosenAvatar.querySelector('[data-avatar-ring-gradient]')).toBeNull();
    expect(unchosenAvatar.querySelector('[data-active-ring]')).toBeNull();
    expect(chosenAvatar.querySelector('[data-active-ring]')).toBeNull();
    // Same 36px footprint whether chosen or not — selecting a row moves nothing.
    const sizeOf = (el: HTMLElement) => (el.querySelector('.relative.overflow-hidden') as HTMLElement).style.width;
    expect(sizeOf(chosenAvatar)).toBe('36px');
    expect(sizeOf(unchosenAvatar)).toBe('36px');
  });
```

### src/test/pickSheetV2.test.tsx

- Deleted 'groups most picked first and breaks player ties alphabetically' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('groups most picked first and breaks player ties alphabetically',()=>{const groups=groupTournamentPicks([row('1','A','b'),row('2','B','a')]);expect(groups.map(g=>g.playerId)).toEqual(['a','b']);expect(groupTournamentPicks(rows).map(g=>g.members.length)).toEqual([7,1]);});
```

- Deleted 'orders viewer then followed then everyone alphabetically' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('orders viewer then followed then everyone alphabetically',()=>{expect(groupTournamentPicks(rows)[0]?.members.map(m=>m.user_id)).toEqual(['me','f','c','e','r','t','z']);});
```

- Deleted 'uses username when display name is absent' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('uses username when display name is absent',()=>{expect(groupTournamentPicks([row('z',''),row('a','')])[0]?.members.map(m=>m.user_id)).toEqual(['a','z']);});
```

- Deleted 'limits disclosure to six then expands and folds in place' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('limits disclosure to six then expands and folds in place',async()=>{mountSheet({initialView:'board'});const show=await screen.findByRole('button',{name:'Show all 7 ›'});expect(PICKS_VISIBLE_MEMBERS).toBe(6);expect(document.querySelector('[data-pick-group="a"]')?.querySelectorAll('[data-member-id]')).toHaveLength(6);fireEvent.click(show);expect(document.querySelector('[data-pick-group="a"]')?.querySelectorAll('[data-member-id]')).toHaveLength(7);fireEvent.click(screen.getByRole('button',{name:'Show fewer'}));expect(document.querySelector('[data-pick-group="a"]')?.querySelectorAll('[data-member-id]')).toHaveLength(6);});
```

- Deleted 'public board reads for %s without member state' (2 expanded cases): retired member-pick-only coverage.

```tsx
it.each(['signed out','anonymous'])('public board reads for %s without member state',async(mode)=>{h.user=mode==='signed out'?null:{id:'anon',is_anonymous:true};const hook=renderHook(()=>useTournamentPicksBoard('event'),{wrapper:wrap});await waitFor(()=>expect(hook.result.current.data).toHaveLength(8));expect(h.rpc).toHaveBeenCalledWith('get_tournament_picks_board',{p_tournament_id:'event'});expect(h.rpc.mock.calls.some(c=>c[0]==='get_tournament_pick_state')).toBe(false);});
```

- Deleted 'guest sheet is read-only with the same list and no footer' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('guest sheet is read-only with the same list and no footer',async()=>{h.user=null;mountSheet();await waitFor(()=>expect(document.querySelectorAll('[data-pick-group]')).toHaveLength(2));expect(screen.queryByRole('textbox')).toBeNull();expect(screen.queryByRole('button',{name:'Pick a player'})).toBeNull();expect(h.rpc.mock.calls.some(c=>c[0]==='get_tournament_pick_state')).toBe(false);});
```

- Deleted 'empty board remains a genuine empty list' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('empty board remains a genuine empty list',async()=>{rows=[];mountSheet({initialView:'board'});await waitFor(()=>expect(document.querySelector('[data-picks-board]')).not.toBeNull());expect(document.querySelectorAll('[data-pick-group]')).toHaveLength(0);});
```

- Deleted 'saved pick opens summary and Change enters with current pick disabled' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('saved pick opens summary and Change enters with current pick disabled',async()=>{state.my_player_id='a';mountSheet();await screen.findByRole('button',{name:'Change pick'});expect(document.querySelector('[data-sheet-your-pick]')).not.toBeNull();expect(screen.queryAllByRole('tab')).toHaveLength(0);fireEvent.click(screen.getByRole('button',{name:'Change pick'}));expect(screen.getByRole('radio',{name:'Ben Griffin'})).toHaveAttribute('aria-checked','true');expect(document.querySelector('[data-pick-submit]')).toBeDisabled();fireEvent.click(screen.getByRole('radio',{name:'Ben Griffin'}));expect(document.querySelector('[data-pick-submit]')).toBeDisabled();fireEvent.click(screen.getByRole('radio',{name:'Marco Penge'}));expect(document.querySelector('[data-pick-submit]')).toBeEnabled();});
```

- Deleted 'Keep returns to summary without saving' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('Keep returns to summary without saving',async()=>{state.my_player_id='a';mountSheet();fireEvent.click(await screen.findByRole('button',{name:'Change pick'}));fireEvent.click(screen.getByRole('radio',{name:'Marco Penge'}));fireEvent.click(screen.getByRole('button',{name:'Keep Ben Griffin'}));expect(document.querySelector('[data-sheet-your-pick]')).not.toBeNull();expect(h.rpc.mock.calls.some(c=>c[0]==='set_tournament_pick')).toBe(false);});
```

- Deleted 'changing saves then returns to summary and refetches board without closing' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('changing saves then returns to summary and refetches board without closing',async()=>{state.my_player_id='a';const close=vi.fn();mountSheet({onClose:close});fireEvent.click(await screen.findByRole('button',{name:'Change pick'}));fireEvent.click(screen.getByRole('radio',{name:'Marco Penge'}));fireEvent.click(screen.getByRole('button',{name:'Change to Marco Penge'}));await screen.findByRole('button',{name:'Change pick'});expect(state.my_player_id).toBe('b');expect(close).not.toHaveBeenCalled();expect(h.rpc.mock.calls.filter(c=>c[0]==='get_tournament_picks_board')).toHaveLength(2);});
```

- Deleted 'locked summary with own pick %s retains board without actions' (2 expanded cases): retired member-pick-only coverage.

```tsx
it.each([null,'a'])('locked summary with own pick %s retains board without actions',async(id)=>{state.locked=true;state.my_player_id=id;mountSheet();await waitFor(()=>expect(document.querySelector('[data-picks-board]')).not.toBeNull());expect(document.querySelector('[data-picks-locked]')).not.toBeNull();expect(screen.queryByRole('button',{name:'Change pick'})).toBeNull();expect(document.querySelector('[data-sheet-your-pick]')!==null).toBe(Boolean(id));});
```

- Deleted 'board read failure does not masquerade as empty picks' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('board read failure does not masquerade as empty picks',async()=>{h.rpc.mockImplementation(async()=>({data:null,error:{message:'unavailable'}}));mountSheet({initialView:'board'});await screen.findByRole('alert');expect(document.querySelector('[data-picks-board]')).toBeNull();});
```

- Deleted 'See picks opens board or saved summary for picked=%s' (2 expanded cases): retired member-pick-only coverage.

```tsx
it.each([false,true])('See picks opens board or saved summary for picked=%s',picked=>{const open=vi.fn();render(<YourPickCard state={{...state,my_player_id:picked?'a':null,my_player_name:'Ben Griffin'}} phase="upcoming" ourResults={[]} tourCode="pga" onPick={vi.fn()} onSeePicks={open} boardRows={rows}/>,{wrapper:wrap});fireEvent.click(screen.getByRole('button',{name:/See picks/}));expect(open).toHaveBeenCalledWith(picked?'field':'board');});
```

- Deleted 'guest See picks bypasses Pick gate while Pick stays gated' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('guest See picks bypasses Pick gate while Pick stays gated',async()=>{h.user=null;const open=vi.fn();render(<PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={[]} startedPlayers={new Set()} onPick={open}/>,{wrapper:wrap});fireEvent.click(await screen.findByRole('button',{name:/See picks/}));expect(open).toHaveBeenCalledWith('board');expect(h.gate).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Pick'}));expect(h.gate).toHaveBeenCalledWith('pick');expect(open).toHaveBeenCalledTimes(1);});
```

- Deleted 'locked no-pick members door opens read-only board' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('locked no-pick members door opens read-only board',async()=>{state.locked=true;const open=vi.fn();render(<PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="live" currentRound={1} pickResults={[]} startedPlayers={new Set()} onPick={open}/>,{wrapper:wrap});await waitFor(()=>expect(document.querySelector('[data-members-picks-tile]')).not.toBeNull());const door=document.querySelector('[data-members-picks-tile]');if(!door)throw Error('Missing door');fireEvent.click(door);expect(open).toHaveBeenCalledWith('board');});
```

- Changed 'record continuation reads ten events not thirty picks': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it('record continuation reads ten events not thirty picks',async()=>{render(<PicksBlock picks={[]} tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={[]} startedPlayers={new Set()} onOpenYourPick={vi.fn()} onOpenRecord={vi.fn()} onOpenPick={vi.fn()} boardByPlayer={new Map()} teeByPlayer={null} championPlayerId={null} championPlayerIds={[]} intro={null}/>,{wrapper:wrap});await waitFor(()=>expect(document.querySelector('[data-our-record-door] [data-pick-record-events]')?.textContent).toBe('from 10 events'));});
```

Now:
```tsx
it('record continuation reads ten events not thirty picks',async()=>{render(<PicksBlock picks={[]} tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={[]} startedPlayers={new Set()} onOpenRecord={vi.fn()} onOpenPick={vi.fn()} boardByPlayer={new Map()} teeByPlayer={null} championPlayerId={null} championPlayerIds={[]} intro={null}/>,{wrapper:wrap});await waitFor(()=>expect(document.querySelector('[data-our-record-door] [data-pick-record-events]')?.textContent).toBe('from 10 events'));});
```

### src/test/pk1RecordHeading.test.tsx

- Deleted 'member bands no longer own a record door' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('member bands no longer own a record door',()=>{const {container}=render(<PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="live" currentRound={2} pickResults={[]} startedPlayers={new Set()} onPick={()=>{}}/>,{wrapper:wrap});expect(container.querySelector('[data-our-record-door]')).toBeNull();});
```

### src/test/playerRebuildPage.test.tsx

- Deleted 'next pick goes to the existing guest action gate without sheet' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('next pick goes to the existing guest action gate without sheet',async()=>{mocks.guest=true;mocks.user={id:'guest',is_anonymous:true};header.next_tournament_id='next';header.next_name='Next';mount();fireEvent.click(await screen.findByRole('button',{name:'Pick her'}));expect(mocks.gate).toHaveBeenCalledWith('other');expect(document.querySelector('.your-pick-sheet')).toBeNull();});
```

- Deleted 'member next pick preselects the player and never sends automatically' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('member next pick preselects the player and never sends automatically',async()=>{header.next_tournament_id='next';header.next_name='Next';mount();fireEvent.click(await screen.findByRole('button',{name:'Pick her'}));const radio=await screen.findByRole('radio',{name:'Marisa Tojai'});await waitFor(()=>expect(radio).toHaveAttribute('aria-checked','true'));expect(mocks.rpc.mock.calls.some(c=>c[0]==='set_tournament_pick')).toBe(false);});
```

- Added `player Next retains event and start day without a member-pick action` (1).

### src/test/playerRebuildRules.test.ts

- Changed 'pick history %i uses %s': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it.each([[1,'once'],[2,'twice'],[3,'three times']])('pick history %i uses %s',(count,text)=>{expect(pickHistoryLine({picks:Array.from({length:count},()=>({won:false,name:'Event',position:'T4',end_date:'2026-01-01',tournament_id:'e'})),member_picks:0},'pga').bold).toBe(text);});
```

Now:
```tsx
it.each([[1,'once'],[2,'twice'],[3,'three times']])('pick history %i uses %s',(count,text)=>{expect(pickHistoryLine({picks:Array.from({length:count},()=>({won:false,name:'Event',position:'T4',end_date:'2026-01-01',tournament_id:'e'}))},'pga').bold).toBe(text);});
```

- Changed 'pick wins and best are server won/position owned': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it('pick wins and best are server won/position owned',()=>{const pick={won:true,name:'Event',position:'1',end_date:'2026-01-01',tournament_id:'e'};expect(pickHistoryLine({picks:[pick],member_picks:0},'lpga').rest).toBe('She won one of them.');expect(pickHistoryLine({picks:[{...pick,won:false}],member_picks:0},'pga').rest).toBe('His best finish for us: 1 at the Event.');});
```

Now:
```tsx
it('pick wins and best are server won/position owned',()=>{const pick={won:true,name:'Event',position:'1',end_date:'2026-01-01',tournament_id:'e'};expect(pickHistoryLine({picks:[pick]},'lpga').rest).toBe('She won one of them.');expect(pickHistoryLine({picks:[{...pick,won:false}]},'pga').rest).toBe('His best finish for us: 1 at the Event.');});
```

- Changed 'pick history parsing respects won and member count': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it('pick history parsing respects won and member count',()=>{expect(parsePickHistory({picks:[{won:false,name:'Event',end_date:'2026-01-01',position:'2',tournament_id:'e'}],member_picks:31})).toEqual({picks:[{won:false,name:'Event',end_date:'2026-01-01',position:'2',tournament_id:'e'}],member_picks:31});});
```

Now:
```tsx
it('pick history parsing respects won and ignores retired member count',()=>{expect(parsePickHistory({picks:[{won:false,name:'Event',end_date:'2026-01-01',position:'2',tournament_id:'e'}],member_picks:31})).toEqual({picks:[{won:false,name:'Event',end_date:'2026-01-01',position:'2',tournament_id:'e'}]});});
```

### src/test/proVerification2B.test.tsx

- Deleted generated `picks members: verified-only labels with one batched screen read` (1 case). Assertions: `expect(container.querySelectorAll(".pro-label")).toHaveLength(1)`; `expect(h.rpc.mock.calls.filter(c => c[0] === "get_pro_members")).toHaveLength(1)`; `expect(proReadIds()?.sort()).toEqual([...mountedIds(name)].sort())`; remaining inline-name assertions were shared unchanged. Only the retired board member surface was removed from the generated surface list.

### src/test/tournamentPickInsights.test.tsx

- Changed 'finished viewer and shared pick cards preserve the canonical %s token': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it.each(['CUT','MC','WD','DQ'])('finished viewer and shared pick cards preserve the canonical %s token',(status)=>{
  const expected=status==='CUT'?'MC':status;
  mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:80,my_status:status,my_score:0}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);
  expect(document.querySelector('[data-your-pick-card]')).toBeNull();
  expect(pickStatusToken(status)).toBe(expected);
 });
```

Now:
```tsx
it.each(['CUT','MC','WD','DQ'])('shared pick cards preserve the canonical %s token',(status)=>{
  const expected=status==='CUT'?'MC':status;
  expect(document.querySelector('[data-your-pick-card]')).toBeNull();
  expect(pickStatusToken(status)).toBe(expected);
 });
```

- Deleted 'guest %s renders no pick card' (2 expanded cases): retired member-pick-only coverage.

```tsx
it.each(['live','completed'] as const)('guest %s renders no pick card',(phase)=>{
  const view=mount(<YourPickCard guest state={null} phase={phase} ourResults={ours} tourCode="pga" onPick={vi.fn()}/>);
  expect(view.container).toBeEmptyDOMElement();
 });
```

- Deleted 'guest locked upcoming renders no pick card' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('guest locked upcoming renders no pick card',()=>{
  const view=mount(<YourPickCard guest state={{...state,locked:true}} phase="upcoming" ourResults={ours} tourCode="pga" onPick={vi.fn()}/>);
  expect(view.container).toBeEmptyDOMElement();
 });
```

- Deleted 'guest upcoming renders the card and Pick goes to the guest gate' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('guest upcoming renders the card and Pick goes to the guest gate',async()=>{
  mocks.guest=true;mocks.user=null;mocks.gate.mockReturnValue(true);
  const onPick=vi.fn();mount(<PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={ours} startedPlayers={new Set()} onPick={onPick}/>);
  const pick=await screen.findByRole('button',{name:'Pick'});
  expect(document.querySelector('[data-your-pick-card]')).not.toBeNull();
  fireEvent.click(pick);expect(mocks.gate).toHaveBeenCalledWith('pick');expect(onPick).not.toHaveBeenCalled();
 });
```

- Deleted 'upcoming no-pick card opens Pick and named current pick opens Change' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('upcoming no-pick card opens Pick and named current pick opens Change',()=>{
  const tap=vi.fn();const v=mount(<YourPickCard state={state} phase="upcoming" ourResults={ours} tourCode="pga" onPick={tap}/>);
  fireEvent.click(screen.getByRole('button',{name:'Pick'}));expect(tap).toHaveBeenCalledOnce();
  v.rerender(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim'}} phase="upcoming" ourResults={ours} tourCode="pga" onPick={tap}/>);
  expect(screen.getByRole('button',{name:'Change'})).toBeInTheDocument();
 });
```

- Deleted 'withdrawn pre-lock pick offers a new pick with withdrawal copy' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('withdrawn pre-lock pick offers a new pick with withdrawal copy',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_still_in_field:false}} phase="upcoming" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-name')?.textContent).toBe('Tom Kim has withdrawn');expect(screen.getByRole('button',{name:'Pick'})).toBeInTheDocument();});
```

- Deleted 'locked no-pick card is absent on live and finished' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('locked no-pick card is absent on live and finished',()=>{const v=mount(<YourPickCard state={{...state,locked:true}} phase="live" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-your-pick-card]')).toBeNull();v.rerender(<YourPickCard state={{...state,locked:true}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-your-pick-card]')).toBeNull();});
```

- Deleted 'live picked card shows resolved comparison, score and thru' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('live picked card shows resolved comparison, score and thru',()=>{mount(<YourPickCard state={{...state,locked:true,my_player_id:'c',my_player_name:'Tom Kim',my_position:11,my_tied:true,my_score:-12,my_thru:9}} phase="live" ourResults={[result('a',80,'MC'),result('b',8),result('c',11)]} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Behind Ghim.');expect(document.querySelector('.pick-mine-figure')?.textContent).toContain('T11 −12THRU 9');});
```

- Deleted 'not-started live pick has tee text and no figures' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('not-started live pick has tee text and no figures',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:1,my_score:0}} phase="live" ourResults={ours} started={false} teeTime="2026-11-05T13:05:00Z" tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-sub')?.textContent).toMatch(/^Tees off/);expect(document.querySelector('.pick-mine-figure')).toBeNull();});
```

- Deleted 'missed-cut card prints muted MC without score' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('missed-cut card prints muted MC without score',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:80,my_status:'CUT',my_score:-12}} phase="live" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Missed the cut.');expect(document.querySelector('.pick-mine-figure')?.textContent).toBe('MC');});
```

- Deleted 'finished card is absent even with a scored member pick' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('finished card is absent even with a scored member pick',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:8,my_percentile:95}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-your-pick-card]')).toBeNull();});
```

- Deleted 'guest Pick calls the gate and never opens sheet' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('guest Pick calls the gate and never opens sheet',async()=>{
  mocks.guest=true;mocks.user=null;mocks.gate.mockReturnValue(true);const onPick=vi.fn();mount(<PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={ours} startedPlayers={new Set()} onPick={onPick}/>);
  fireEvent.click(await screen.findByRole('button',{name:'Pick'}));expect(mocks.gate).toHaveBeenCalledWith('pick');expect(onPick).not.toHaveBeenCalled();
 });
```

- Changed 'followed singular and record row use server counts; zero hides both': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it('followed singular and record row use server counts; zero hides both',async()=>{
  record.won=1;record.top10=1;const onRecord=vi.fn();const bands=mount(<PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={ours} startedPlayers={new Set()} onPick={()=>{}}/>);
  await waitFor(()=>expect(document.querySelector('[data-followed-picks]')?.textContent).toContain('1 of your circle has picked.'));
  bands.unmount();
  const block=mount(<PicksBlock picks={[]} tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={ours} startedPlayers={new Set()} onOpenYourPick={()=>{}} onOpenRecord={onRecord} onOpenPick={()=>{}} boardByPlayer={new Map()} teeByPlayer={null} championPlayerId={null} championPlayerIds={[]} intro={null}/>);
  await waitFor(()=>expect(document.querySelector('[data-our-record-door]')).not.toBeNull());
  const door=document.querySelector('[data-our-record-door]');expect(door?.textContent).toContain('1 win · 1 top 10');if(door)fireEvent.click(door);expect(onRecord).toHaveBeenCalledOnce();
  record={...record,picks:0};client.setQueryData(['tourhub','our-pick-record','pga',2026],record);
  await waitFor(()=>expect(block.container.querySelector('[data-our-record-door]')).toBeNull());
 });
```

Now:
```tsx
it('record row uses server counts; zero hides it',async()=>{
  record.won=1;record.top10=1;const onRecord=vi.fn();  
  const block=mount(<PicksBlock picks={[]} tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={ours} startedPlayers={new Set()} onOpenRecord={onRecord} onOpenPick={()=>{}} boardByPlayer={new Map()} teeByPlayer={null} championPlayerId={null} championPlayerIds={[]} intro={null}/>);
  await waitFor(()=>expect(document.querySelector('[data-our-record-door]')).not.toBeNull());
  const door=document.querySelector('[data-our-record-door]');expect(door?.textContent).toContain('1 win · 1 top 10');if(door)fireEvent.click(door);expect(onRecord).toHaveBeenCalledOnce();
  record={...record,picks:0};client.setQueryData(['tourhub','our-pick-record','pga',2026],record);
  await waitFor(()=>expect(block.container.querySelector('[data-our-record-door]')).toBeNull());
 });
```

- Changed '%s never mounts sheets or member reads': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it.each(['euro','pgad'])('%s never mounts sheets or member reads',tour=>{
  const view=mount(<><OurRecordSheet open onClose={()=>{}} tour={tour} year={2026}/><YourPickCard state={state} phase="completed" ourResults={ours} tourCode={tour} onPick={()=>{}}/><PicksSheet open tourCode={tour} tournamentId="event" onClose={()=>{}} picks={picks} predictions={null} eventName="Event" venueName={null}/><PickMemberBands tournamentId="event" tourCode={tour} seasonYear={2026} phase="live" currentRound={2} pickResults={ours} startedPlayers={new Set()} onPick={()=>{}}/></>);
  expect(view.container).toBeEmptyDOMElement();expect(mocks.rpc).not.toHaveBeenCalled();
 });
```

Now:
```tsx
it.each(['euro','pgad'])('%s never mounts sheets or member reads',tour=>{
  const view=mount(<><OurRecordSheet open onClose={()=>{}} tour={tour} year={2026}/><PicksSheet open tourCode={tour} tournamentId="event" onClose={()=>{}} picks={picks} predictions={null} eventName="Event" venueName={null}/></>);
  expect(view.container).toBeEmptyDOMElement();expect(mocks.rpc).not.toHaveBeenCalled();
 });
```

- Deleted 'member card visibility in %s' (3 expanded cases): retired member-pick-only coverage.

```tsx
it.each(['upcoming','live','completed'] as const)('member card visibility in %s',phase=>{
  const view=mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim'}} phase={phase} ourResults={ours} tourCode="pga" onPick={()=>{}}/>);
  expect(view.container.querySelector('[data-your-pick-card]')!==null).toBe(phase!=='completed');
 });
```

### src/test/tournamentV3Page.test.tsx

### src/test/tournamentV3Rules.test.ts

- Changed 'your groups include own our followed in time order': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it('your groups include own our followed in time order',()=>expect(selectTeeGroups([...groups].reverse(),'upcoming','mine',new Set(['our']),new Set(['follow']),[],'def').your.map(g=>g.players[0].id)).toEqual(['our','mine','follow']));
```

Now:
```tsx
it('your groups include our picks and followed players in time order',()=>expect(selectTeeGroups([...groups].reverse(),'upcoming',new Set(['our']),new Set(['follow']),[],'def').your.map(g=>g.players[0].id)).toEqual(['our','follow']));
```

- Changed 'marquee is defender group': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it('marquee is defender group',()=>expect(selectTeeGroups(groups,'upcoming',null,new Set(),new Set(),[],'def').feature[0].players[0].id).toBe('def'));
```

Now:
```tsx
it('marquee is defender group',()=>expect(selectTeeGroups(groups,'upcoming',new Set(),new Set(),[],'def').feature[0].players[0].id).toBe('def'));
```

- Changed 'live last3 time order': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it('live last3 time order',()=>expect(selectTeeGroups([...groups].reverse(),'live',null,new Set(),new Set(),[],null).feature.map(g=>g.players[0].id)).toEqual(['mine','follow','def']));
```

Now:
```tsx
it('live last3 time order',()=>expect(selectTeeGroups([...groups].reverse(),'live',new Set(),new Set(),[],null).feature.map(g=>g.players[0].id)).toEqual(['mine','follow','def']));
```

### src/test/tournamentV3Sections.test.tsx

- Changed 'your pick tag and defending tag belong to selected groups': removed retired member-pick assertion/fixture or parameter while preserving surviving coverage.

Original:
```tsx
it('your pick tag and defending tag belong to selected groups',()=>{const {container}=mount(<TeeV3Section {...teeProps}/>);expect(container.querySelectorAll('.tv-tag-you')).toHaveLength(1);expect(container.querySelector('.tv-your-face')).toBeTruthy();expect(screen.getByText('DEFENDING')).toBeTruthy();});
```

Now:
```tsx
it('our pick tag and defending tag belong to selected groups',()=>{const {container}=mount(<TeeV3Section {...teeProps}/>);expect(container.querySelectorAll('.tv-tag')).toHaveLength(2);expect(screen.getByText('OUR PICK')).toBeTruthy();expect(screen.getByText('DEFENDING')).toBeTruthy();});
```

### src/test/upcomingLastYearBoard.test.tsx

### src/test/yourPickSheet.test.tsx

- Deleted 'tapping a chosen row again clears local selection and disables submission' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('tapping a chosen row again clears local selection and disables submission', async () => {
    mount(); await ready();
    const row = screen.getByRole('radio', { name: 'Tom Kim' });
    fireEvent.click(row); expect(row).toHaveAttribute('aria-checked', 'true'); expect(submit()).toBeEnabled();
    fireEvent.click(row); expect(row).toHaveAttribute('aria-checked', 'false'); expect(submit()).toBeDisabled();
    expect(screen.getAllByRole('radio').filter(item => item.getAttribute('aria-checked') === 'true')).toHaveLength(0);
    expect(mocks.rpc.mock.calls.some(call => call[0] === 'set_tournament_pick')).toBe(false);
  });
```

- Deleted 'the board segment opens the list and its footer returns to the field' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('the board segment opens the list and its footer returns to the field', async () => {
    mount(); await ready();
    fireEvent.click(screen.getByRole('tab', { name: "Who's picked who 0" }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(document.querySelector('[data-picks-board]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pick a player' }));
    expect(screen.getAllByRole('radio')).toHaveLength(10);
  });
```

- Deleted 'closing after clearing a saved pick preserves server and cached choice on reopening' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('closing after clearing a saved pick preserves server and cached choice on reopening', async () => {
    state.my_player_id = 'p1'; const view = mount(); await ready();
    const row = screen.getByRole('radio', { name: 'Tom Kim' });
    await waitFor(() => expect(row).toHaveAttribute('aria-checked', 'true'));
    fireEvent.click(row); expect(submit()).toBeDisabled();
    view.rerender(<YourPickSheet {...props()} open={false} />);
    expect(state.my_player_id).toBe('p1');
    expect(client.getQueryData(tournamentPickStateKey('event', 'member'))).toMatchObject({ my_player_id: 'p1' });
    expect(mocks.rpc.mock.calls.some(call => call[0] === 'set_tournament_pick')).toBe(false);
    view.rerender(<YourPickSheet {...props()} />); await ready();
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Tom Kim' })).toHaveAttribute('aria-checked', 'true'));
  });
```

- Deleted 'renders our three in prop rank order with numbered tags and no field duplicates' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('renders our three in prop rank order with numbered tags and no field duplicates', async () => {
    mount(); await ready();
    const ours = document.querySelector('[data-pick-ours]');
    expect(Array.from(ours?.querySelectorAll('[data-pick-player]') ?? []).map(row => row.getAttribute('data-pick-player'))).toEqual(['p0', 'p2', 'p1']);
    expect(Array.from(ours?.querySelectorAll('[data-our-pick]') ?? []).map(tag => tag.textContent)).toEqual(['Our pick 1', 'Our pick 2', 'Our pick 3']);
    const rest = document.querySelector('[data-pick-field]');
    expect(Array.from(rest?.querySelectorAll('[data-pick-player]') ?? []).map(row => row.getAttribute('data-pick-player'))).toEqual(['p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']);
  });
```

- Deleted 'reads the field state and public board RPCs with tournament identity' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('reads the field state and public board RPCs with tournament identity', async () => {
    mount(); await ready();
    expect(mocks.rpc).toHaveBeenCalledWith('get_pick_field', { p_tournament_id: 'event' });
    expect(mocks.rpc).toHaveBeenCalledWith('get_tournament_pick_state', { p_tournament_id: 'event' });
    expect(new Set(mocks.rpc.mock.calls.map(call => call[0]))).toEqual(new Set(['get_pick_field', 'get_tournament_pick_state', 'get_tournament_picks_board']));
  });
```

- Deleted 'the former followed tiles are absent even with followed pickers' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('the former followed tiles are absent even with followed pickers', async () => {
    mount(); await ready(); expect(document.querySelector('[data-pick-followed]')).toBeNull();
  });
```

- Deleted 'both switch segments are present before a pick' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('both switch segments are present before a pick', async () => {
    mount(); await ready(); expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('tab', { name: 'Pick a player' })).toHaveAttribute('aria-selected','true');
  });
```

- Deleted 'board footer returns without submitting a pick' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('board footer returns without submitting a pick', async () => {
    mount(); await ready(); fireEvent.click(screen.getAllByRole('tab')[1]);
    fireEvent.click(screen.getByRole('button',{name:'Pick a player'}));
    expect(mocks.rpc.mock.calls.some(call=>call[0]==='set_tournament_pick')).toBe(false);
  });
```

- Deleted 'unranked metadata omits a missing country and keeps RPC order' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('unranked metadata omits a missing country and keeps RPC order', async () => {
    mount(); await ready();
    expect(screen.getByRole('radio', { name: 'Alejandro Fierro' }).querySelector('.your-pick-text')?.textContent).toBe('Alejandro FierroNot ranked');
    expect(screen.getByRole('radio', { name: 'Mauricio Figueroa' }).textContent).toContain('Not ranked · United States');
  });
```

- Deleted 'fi search matches all five required surname prefixes in field order' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('fi search matches all five required surname prefixes in field order', async () => {
    mount(); await ready(); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'fi' } });
    expect(screen.getAllByRole('radio').map(row => row.getAttribute('aria-label'))).toEqual(['Steven Fisk', 'Tony Finau', 'Patrick Fishburn', 'Alejandro Fierro', 'Mauricio Figueroa']);
    expect(document.querySelector('[data-pick-followed]')).toBeNull();
  });
```

- Deleted 'search retains our pick rank tags' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('search retains our pick rank tags', async () => {
    mount(); await ready(); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'kim' } });
    expect(screen.getAllByRole('radio')).toHaveLength(1);
    expect(screen.getByRole('radio').querySelector('[data-our-pick]')).toHaveAttribute('data-our-pick', '3');
  });
```

- Deleted 'zzz search shows a no-match line with its query' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('zzz search shows a no-match line with its query', async () => {
    mount(); await ready(); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zzz' } });
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(document.querySelector('[data-pick-no-results]')?.textContent).toBe('No one in the field matches "zzz".');
  });
```

- Deleted 'clear search returns the full sectioned list' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('clear search returns the full sectioned list', async () => {
    mount(); await ready(); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'fi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('textbox')).toHaveValue(''); expect(screen.getAllByRole('radio')).toHaveLength(10);
  });
```

- Deleted 'requires one chosen row before enabling the named pick button' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('requires one chosen row before enabling the named pick button', async () => {
    mount(); await ready(); expect(submit()).toBeDisabled(); expect(submit().textContent).toBe('Choose a player');
    fireEvent.click(screen.getByRole('radio', { name: 'Tom Kim' }));
    expect(submit()).toBeEnabled(); expect(submit().textContent).toBe('Pick Tom Kim');
    fireEvent.click(screen.getByRole('radio', { name: 'Doug Ghim' }));
    expect(screen.getAllByRole('radio').filter(row => row.getAttribute('aria-checked') === 'true')).toHaveLength(1);
  });
```

- Deleted 'submits tournament and player ids, refetches state and board and returns to summary' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('submits tournament and player ids, refetches state and board and returns to summary', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries'); mount(); await ready();
    fireEvent.click(screen.getByRole('radio', { name: 'Tom Kim' })); fireEvent.click(submit());
    await screen.findByRole('button', {name:'Change pick'}); expect(close).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith('set_tournament_pick', { p_tournament_id: 'event', p_player_id: 'p1' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: tournamentPickStateKey('event', 'member'), refetchType: 'active' });
    expect(mocks.rpc.mock.calls.filter(call => call[0] === 'get_tournament_pick_state')).toHaveLength(2);
    expect(client.getQueryData(tournamentPickStateKey('event', 'member'))).toMatchObject({ my_player_id: 'p1' });
    expect(mocks.rpc.mock.calls.filter(call => call[0] === 'get_tournament_picks_board')).toHaveLength(2);
  });
```

- Deleted 'opens on summary and keeping the preselected current pick never rewrites it' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('opens on summary and keeping the preselected current pick never rewrites it', async () => {
    state.my_player_id = 'p1'; mount();
    await screen.findByRole('button', {name:'Change pick'});
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button',{name:'Change pick'}));
    expect(screen.getByRole('radio',{name:'Tom Kim'})).toHaveAttribute('aria-checked','true');
    expect(submit()).toBeDisabled();
    fireEvent.click(screen.getByRole('button',{name:'Keep Tom Kim'}));
    expect(screen.getByRole('button',{name:'Change pick'})).toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
    expect(mocks.rpc.mock.calls.some(call => call[0] === 'set_tournament_pick')).toBe(false);
  });
```

- Deleted 'reopening clears search and resets to the current pick' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('reopening clears search and resets to the current pick', async () => {
    const view = mount(); await ready(); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'fi' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Tony Finau' }));
    view.rerender(<YourPickSheet {...props()} open={false} />); state.my_player_id = 'p1';
    view.rerender(<YourPickSheet {...props()} />); await ready();
    expect(screen.getByRole('textbox')).toHaveValue('');
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Tom Kim' })).toHaveAttribute('aria-checked', 'true'));
  });
```

- Deleted 'locked state renders header and read-only board with no field or submit' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('locked state renders header and read-only board with no field or submit', async () => {
    state.locked = true; mount(); await waitFor(() => expect(document.querySelector('[data-picks-locked]')).not.toBeNull());
    expect(screen.getByRole('heading').textContent).toBe('Who wins the Mexico Open?');
    expect(screen.queryByRole('textbox')).toBeNull(); expect(screen.queryAllByRole('radio')).toHaveLength(0); expect(submit()).toBeNull();
    await waitFor(()=>expect(document.querySelector('[data-picks-board]')).not.toBeNull());
  });
```

- Deleted 'server lock refusal toasts exact copy and closes' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('server lock refusal toasts exact copy and closes', async () => {
    writeError = 'picks are locked'; mount(); await ready(); fireEvent.click(screen.getByRole('radio', { name: 'Tom Kim' })); fireEvent.click(submit());
    await waitFor(() => expect(close).toHaveBeenCalledOnce()); expect(mocks.errorToast).toHaveBeenCalledWith('Picks are locked. Play has started.');
  });
```

- Deleted 'removed field player refusal refetches field and leaves sheet open' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('removed field player refusal refetches field and leaves sheet open', async () => {
    writeError = 'that player is not in the field'; mount(); await ready(); fireEvent.click(screen.getByRole('radio', { name: 'Tom Kim' })); fireEvent.click(submit());
    await waitFor(() => expect(mocks.rpc.mock.calls.filter(call => call[0] === 'get_pick_field')).toHaveLength(2));
    expect(close).not.toHaveBeenCalled(); expect(mocks.errorToast).toHaveBeenCalledWith('That player is no longer in the field.'); expect(submit()).toBeDisabled();
  });
```

- Deleted 'uses real shared squircle avatars for every player' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('uses real shared squircle avatars for every player', async () => {
    mount(); await ready();
    for (const row of screen.getAllByRole('radio')) {
      const face = row.querySelector('[style*="34%"]'); expect(face).not.toBeNull();
      expect(Array.from(row.querySelectorAll<HTMLElement>('.your-pick-avatar [style]')).some(element => element.style.borderRadius === '50%')).toBe(false);
    }
  });
```

- Deleted 'null lock time shows only the live field count' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('null lock time shows only the live field count', async () => {
    state.locks_at = null; mount(); await ready(); expect(document.querySelector('.your-pick-subline')?.textContent).toBe('10 players');
  });
```

- Deleted 'pick state read is disabled for %s' (3 expanded cases): retired member-pick-only coverage.

```tsx
it.each(['signed out', 'anonymous', 'guest'])('pick state read is disabled for %s', async mode => {
    if (mode === 'signed out') mocks.user = null;
    if (mode === 'anonymous') mocks.user = { id: 'anon', is_anonymous: true };
    if (mode === 'guest') mocks.guest = true;
    const hook = renderHook(() => useTournamentPickState('event'), { wrapper });
    expect(hook.result.current.fetchStatus).toBe('idle'); expect(mocks.rpc).not.toHaveBeenCalled();
  });
```

- Deleted 'matches case-insensitive starts across spaces dots and hyphens, not substrings' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('matches case-insensitive starts across spaces dots and hyphens, not substrings', () => {
    expect(searchPickField(field, 'FI').map(player => player.player_id)).toEqual(['p3', 'p4', 'p5', 'p6', 'p7']);
    expect(searchPickField(field, 'j').map(player => player.player_id)).toEqual(['p8']);
    expect(searchPickField(field, 'peter').map(player => player.player_id)).toEqual(['p9']);
    expect(searchPickField(field, 'isk')).toEqual([]);
  });
```

- Deleted 'formats lock time in viewer-local 24 hour time and full weekday' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('formats lock time in viewer-local 24 hour time and full weekday', () => {
    const value = '2026-11-05T07:40:00Z'; const date = new Date(value);
    expect(localPickLock(value)).toEqual({ time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`, day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()] });
    expect(localPickLock(null)).toBeNull(); expect(localPickLock('bad')).toBeNull();
  });
```

- Deleted 'country metadata is title case with null omitted' (1 expanded cases): retired member-pick-only coverage.

```tsx
it('country metadata is title case with null omitted', () => {
    expect(pickCountry('SOUTH KOREA')).toBe('South Korea'); expect(pickCountry(null)).toBe('');
  });
```

### Added src/test/yourPickRemoval.test.tsx (3)
- 'upcoming overview retains Our tournament picks without member-pick bands'
```tsx
it('upcoming overview retains Our tournament picks without member-pick bands', () => {
    const { container } = mount(<PicksBlock picks={[]} tourCode="pga" tournamentId="event" seasonYear={2026} currentRound={null} pickResults={[]} phase="upcoming" onOpenRecord={() => {}} onOpenPick={() => {}} boardByPlayer={new Map()} teeByPlayer={null} startedPlayers={new Set()} championPlayerId={null} championPlayerIds={[]} intro={null} />);
    expect(container.querySelector('[data-overview-picks-heading]')).not.toBeNull();
    expect(container.querySelector('[data-overview-picks-heading]')).toHaveTextContent(en.overview.hero.ourPicks);
    expect(container.querySelector('[data-pick-question], [data-members-picks-strip]')).toBeNull();
  });
```
- 'tee tags prioritise Our pick then following then defending without viewer treatment'
```tsx
it('tee tags prioritise Our pick then following then defending without viewer treatment', () => {
    const groups = [{ teeTime: '2026-11-19T08:00Z', startingHole: 1, players: [{ id: 'a', name: 'Player A' }, { id: 'b', name: 'Player B' }, { id: 'c', name: 'Player C' }] }];
    const { container } = mount(<TeeV3Section groups={groups} phase="upcoming" round={1} rounds={[1]} onRound={() => {}} onAll={() => {}} meta={{ start_date: '2026-11-19', tour_code: 'pga' } as TournamentMeta} picks={new Set(['a'])} follows={new Set(['a', 'b'])} field={[]} defender="c" rows={[]} />);
    const tags = [...container.querySelectorAll('.tv-tee-player .tv-tag')].map(tag => tag.textContent);
    expect(tags).toEqual([en.tournament.v3.ourPick, en.tournament.v3.following, en.tournament.v3.defending]);
    expect(container.querySelector('.tv-tag-you, .tv-your-face')).toBeNull();
    expect(tags).not.toContain(en.tournament.v3.yourPick);
  });
```
- 'no production import reaches a retired member-pick module'
```tsx
it('no production import reaches a retired member-pick module', () => {
    const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.name === 'test' ? [] : entry.isDirectory() ? files(join(dir, entry.name)) : /\.[cm]?[jt]sx?$/.test(entry.name) ? [join(dir, entry.name)] : []);
    const forbidden = /(?:import|export)[\s\S]*?from\s*['"][^'"]*\/(?:YourPickCard|YourPickSheet|PickMemberBands|TournamentPicksBoard|useTournamentCircleRank)['"]|import\s*\(['"][^'"]*\/(?:YourPickCard|YourPickSheet|PickMemberBands|TournamentPicksBoard|useTournamentCircleRank)['"]\)/;
    expect(files('src').filter(file => !/\.(test|spec)\./.test(file) && forbidden.test(readFileSync(file, 'utf8')))).toEqual([]);
  });
```
## Inventory reconciliation
Deleted 100 expanded cases; added 4; zero test-file renames. Expected inventory **9,164 − 100 + 4 = 9068**. This is an expected count, not a passing full-suite total. All case changes are listed above; buttonBaseClassGuard only loses three retired-module allowlist entries, and g2bTourHeaders only loses the retired onPick fixture prop. Existing Our picks cases remain.

## Verification stop

## Additional historical setup-only file changes (zero test delta)
No case was renamed or rewritten at these sites; retired props/mocks/allowlist entries were removed, with every assertion unchanged. The affected files and exact edits follow.
```diff
diff --git a/src/test/buttonBaseClassGuard.test.ts b/src/test/buttonBaseClassGuard.test.ts
index 9c2d00b18f..7ab55e1252 100644
--- a/src/test/buttonBaseClassGuard.test.ts
+++ b/src/test/buttonBaseClassGuard.test.ts
@@ -62,9 +62,6 @@ const KNOWN = new Set([
   'src/features/pro-profile/ProSeasonSection.tsx:pro-profile-row',
   'src/features/profile-sheet-v2/components/YourCourseOpenContent.tsx:yc2-link',
   'src/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet.tsx:pick-panel-chip',
-  'src/features/tourhub/components/overview-v3/HybridHeroBands/TournamentPicksBoard.tsx:your-pick-show-all',
-  'src/features/tourhub/components/overview-v3/HybridHeroBands/YourPickCard.tsx:pick-follow-line',
-  'src/features/tourhub/components/overview-v3/HybridHeroBands/YourPickSheet.tsx:your-pick-row',
   'src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:recap-name',
   'src/features/tourhub/components/overview-v3/UpcomingOverviewSections.tsx:upcoming-player-row',
   'src/features/tourhub/tournament-v2/sections/CompletedWeekBlock.tsx:cw-lr',
diff --git a/src/test/g2bTourHeaders.test.tsx b/src/test/g2bTourHeaders.test.tsx
index 76ea7e31e6..d6b7e252ff 100644
--- a/src/test/g2bTourHeaders.test.tsx
+++ b/src/test/g2bTourHeaders.test.tsx
@@ -34,7 +34,7 @@ function Name({ name, kind }: { name: string | null; kind: 'tournament' | 'playe
   if (!name) return null;
   return kind === 'tournament'
     ? <TournamentHero nameRef={ref} meta={{ id: 'e', name } as TournamentMeta} phase="upcoming" rows={[]} field={[]} last={[]} holes={[]} image={null} />
-    : <HeroSection nameRef={ref} player={{ id: 'p', full_name: name } as TourPlayer} header={null} results={[]} tour="pga" race={null} following={false} busy={false} onFollow={() => {}} onPick={() => {}} />;
+    : <HeroSection nameRef={ref} player={{ id: 'p', full_name: name } as TourPlayer} header={null} results={[]} tour="pga" race={null} following={false} busy={false} onFollow={() => {}} />;
 }
 function NamedPage({ name, kind }: { name: string | null; kind: 'tournament' | 'player' }) {
   return <><IslandBackCapsule label="Go back" onBack={() => {}} /><Name name={name} kind={kind} /></>;
diff --git a/src/test/tournamentV3Page.test.tsx b/src/test/tournamentV3Page.test.tsx
index 3528885fe2..8ad3b60ba7 100644
--- a/src/test/tournamentV3Page.test.tsx
+++ b/src/test/tournamentV3Page.test.tsx
@@ -13,7 +13,7 @@ vi.mock('@/features/tourhub/hooks/useTourHubData',()=>({useTourLeaderboard:()=>(
 vi.mock('@/features/tourhub/hooks/useBatchCourseImages',()=>({useBatchCourseImages:()=>({data:new Map()})}));
 vi.mock('@/features/tourhub/hooks/useLeaderboardRealtime',()=>({useLeaderboardRealtime:()=>{}}));
 vi.mock('@/features/tourhub/hooks/useTournamentStatusRealtime',()=>({useTournamentStatusRealtime:()=>{}}));
-vi.mock('@/features/tourhub/hooks/useTournamentPick',()=>({usePickField:()=>({data:[]}),useTournamentPickState:()=>({data:null})}));
+vi.mock('@/features/tourhub/hooks/useTournamentPick',()=>({usePickField:()=>({data:[]})}));
 vi.mock('@/features/tourhub/hooks/useAIPredictions',()=>({useAIPredictions:()=>({data:null})}));
 vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4',()=>({useTournamentLastYearTop4:()=>({data:[]})}));
 vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows',()=>({useTourPlayerFollows:()=>({ids:new Set()})}));
diff --git a/src/test/upcomingLastYearBoard.test.tsx b/src/test/upcomingLastYearBoard.test.tsx
index bf408d4ad2..d7614c9b1d 100644
--- a/src/test/upcomingLastYearBoard.test.tsx
+++ b/src/test/upcomingLastYearBoard.test.tsx
@@ -17,7 +17,6 @@ vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournament
 vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: fixture.rows }) }));
 vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes', () => ({ usePickTeeTimes: () => ({ data: new Map() }) }));
 vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: () => null }));
-vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/YourPickSheet', () => ({ YourPickSheet: () => null }));
 vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup', () => ({ LeadersGroup: () => null }));
 
 import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';

```

Logs: `/tmp/tee-group-fix/focused.log`, `shard1.log`, `shard2.log`.
