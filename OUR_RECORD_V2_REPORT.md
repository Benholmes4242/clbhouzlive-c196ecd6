# Our record v2 report

Implemented event_count tiles, weekly-best clbhouz circle columns, wins/top10/Beat/events sorting, individual ledger rows and anonymous Agreement/method copy. Ben ruled MC for missed cut, WD for withdrawals and DQ for disqualification, dim with no score; this overrides the mock helper only. Other mock styling uses semantic tokens and the existing system font, not retired Geist. Benchmark sentence/bar unchanged.

## Tests
Focused command: `bunx vitest run src/test/ourRecordV2.test.tsx src/test/tournamentPickInsights.test.tsx src/test/picksSheetCopy.test.ts src/test/pickSheetV2.test.tsx --maxWorkers=2`: 104/104.
Four full commands: `bunx vitest run --maxWorkers=2 --shard=n/4`, n=1–4:
- 1: 1705/1705, 146 files.
- 2: 1569/1569, 146 files.
- 3: 1663/1663, 146 files.
- 4: 1662/1662, 144 files.
Total: **6599/6599 across 582 files**, zero failures/unhandled errors; no pre-existing failure encountered. Baseline6575/581 +24 new cases in ourRecordV2.test.tsx =6599/582. tournamentPickInsights remains56; no existing test deleted. Shard redistribution comes from the new file.
Full output: docs/verification/our-record-v2/.

## Rewritten tests
Only tournamentPickInsights.test.tsx changed: record fixture supplies event_count/best and member wins/top10; anonymous agreement replaces provider/gender output, sort order uses weekly-best/wins, votes show ranks only, winning ledger token becomes1st. Every old/new assertion and renamed case is quoted below; unrelated assertions remain.

```diff
--- old
+++ new
@@ -12,7 +12,7 @@
 vi.mock('@/features/guest/guestGateStore',()=>({getGuestUser:()=>mocks.guest?{id:'guest'}:null}));
 vi.mock('@/features/guest/useGuestActionGate',()=>({useGuestActionGate:()=>mocks.gate}));
 vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes',()=>({usePickTeeTimes:()=>({data:new Map()})}));
-import { finishedVerdict, compareLivePick, compareFinishedPick, chooseFitStats, ordinal, filterCheckedReasons, lowestFit, catchSentence, modelVoteNote, winningScoreRange, sortedBeatRows, type PickResult } from '@/features/tourhub/components/overview-v3/HybridHeroBands/pickInsightRules';
+import { finishedVerdict, compareLivePick, compareFinishedPick, chooseFitStats, ordinal, filterCheckedReasons, lowestFit, catchSentence, agreementNote, winningScoreRange, sortedBeatRows, type PickResult } from '@/features/tourhub/components/overview-v3/HybridHeroBands/pickInsightRules';
 import { YourPickCard } from '@/features/tourhub/components/overview-v3/HybridHeroBands/YourPickCard';
 import { pickStatusToken } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock';
 import { PicksSheet } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet';
@@ -36,8 +36,8 @@
 beforeEach(()=>{
  client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}}); mocks.guest=false;mocks.user={id:'viewer',is_anonymous:false};mocks.gate.mockReset().mockReturnValue(false);
  state={my_player_id:null,locked:false,locks_at:'2026-11-05T07:40:00Z',followed_pickers:1,followed_top:[{player_id:'a',player_name:'Wyndham Clark',picks:1}]};
- record={tours:['liv','pgad','champ','lpga','euro','pga'],picks:30,won:3,top10:13,avg_percentile:73,first_event_date:'2026-03-15',events:[{tournament_id:'old',name:'Old event',end_date:'2026-10-01',picks:[{player_id:'a',player_name:'Clark',position:1,tied:false,status:null,percentile:100}]},{tournament_id:'new',name:'Mexico Open',end_date:'2026-11-01',picks:[{player_id:'a',player_name:'Clark',position:80,tied:false,status:'CUT',percentile:19},{player_id:'b',player_name:'Ghim',position:6,tied:true,status:null,percentile:95}]}]};
- members=[{user_id:'viewer',display_name:'Me',username:'me',profile_photo_url:null,picks:9,avg_percentile:81,is_viewer:true},{user_id:'other',display_name:'Danny',username:'danny',profile_photo_url:null,picks:10,avg_percentile:77,is_viewer:false}];
+ record={tours:['liv','pgad','champ','lpga','euro','pga'],picks:30,event_count:10,best:{events:10,wins:3,top10:9,avg_percentile:94},won:3,top10:13,avg_percentile:73,first_event_date:'2026-03-15',events:[{tournament_id:'old',name:'Old event',end_date:'2026-10-01',picks:[{player_id:'a',player_name:'Clark',position:1,tied:false,status:null,percentile:100}]},{tournament_id:'new',name:'Mexico Open',end_date:'2026-11-01',picks:[{player_id:'a',player_name:'Clark',position:80,tied:false,status:'CUT',percentile:19},{player_id:'b',player_name:'Ghim',position:6,tied:true,status:null,percentile:95}]}]};
+ members=[{user_id:'viewer',display_name:'Me',username:'me',profile_photo_url:null,picks:9,wins:1,top10:3,avg_percentile:81,is_viewer:true},{user_id:'other',display_name:'Danny',username:'danny',profile_photo_url:null,picks:10,wins:0,top10:2,avg_percentile:77,is_viewer:false}];
  mocks.rpc.mockReset().mockImplementation(async(name:string)=>({data:name==='get_our_pick_record'?record:name==='get_beat_the_model'?members:name==='get_tournament_pick_state'?[state]:name==='get_pick_fit'?fits:name==='get_pick_field'?picks.map(p=>({player_id:p.playerId,full_name:p.playerName,world_rank:p.worldRanking,photo_url:null,headshot_override:null,country:p.country})):name==='get_event_winning_scores'?[{winning_score:-24},{winning_score:-17}]:[],error:null}));
 });
 afterEach(()=>{cleanup();client.clear();});
@@ -87,12 +87,12 @@
  it('catch selects lowest of all six and uses LPGA pronouns',()=>{const low=lowestFit(fits);expect(low?.stat).toBe('driving_accuracy');if(low)expect(catchSentence(low,'lpga')).toBe('She misses more fairways than most.');});
  it('a sixty-or-better floor gives the no-weakness line',()=>{expect(catchSentence({...fits[0],percentile:60},'pga')).toBe('No real weakness: his lowest number is still above the middle of the tour.');});
  it('putting middle 40–60 uses middle-of-pack copy',()=>{expect(catchSentence(fits[4],'pga')).toBe('Middle of the pack on the greens.');});
- it('model notes show agreement and grouped votes with correct gender',()=>{
-  expect(modelVoteNote([{model:'claude',rank:1},{model:'gpt4',rank:1},{model:'gemini',rank:1}],'lpga')).toBe('All three models ranked her first.');
-  expect(modelVoteNote([{model:'claude',rank:3},{model:'gpt4',rank:4},{model:'gemini',rank:3}],'pga')).toBe('Claude and Gemini had him third, GPT fourth.');
+ it('agreement notes count anonymous reads without provider names',()=>{
+  expect(agreementNote([{model:'claude',rank:1},{model:'gpt4',rank:1},{model:'gemini',rank:1}])).toBe('First in all three of our reads.');
+  expect(agreementNote([{model:'claude',rank:3},{model:'gpt4',rank:4},{model:'gemini',rank:3}])).toBe('Third in two of our three reads, fourth in the other.');
  });
  it('winning scores omit none, distinguish one and span several',()=>{expect(winningScoreRange([])).toBeNull();expect(winningScoreRange([-18])).toEqual({single:true,best:-18,worst:-18});expect(winningScoreRange([-17,-24,-20])).toEqual({single:false,best:-24,worst:-17});});
- it('beat rows include clbhouz sorted by average then picks',()=>{expect(sortedBeatRows([...members,{...members[1],user_id:'tie',avg_percentile:73,picks:31}],record).map(r=>r.user_id)).toEqual(['viewer','other','tie','clbhouz']);});
+ it('beat rows include weekly-best clbhouz sorted by wins top10 Beat then events',()=>{expect(sortedBeatRows([...members,{...members[1],user_id:'tie',avg_percentile:73,picks:31}],record).map(r=>r.user_id)).toEqual(['clbhouz','viewer','other','tie']);});
 });
 describe('tournament picks surfaces',()=>{
  it.each(['CUT','MC','WD','DQ'])('finished viewer and shared pick cards preserve the canonical %s token',(status)=>{
@@ -137,15 +137,15 @@
   await waitFor(()=>expect(document.querySelector('[data-followed-picks]')?.textContent).toContain('1 of your circle has picked.'));
   const door=document.querySelector('[data-our-record-door]');expect(door?.textContent).toContain('1 win · 1 top 10');if(door)fireEvent.click(door);expect(onRecord).toHaveBeenCalledOnce();
  });
- it('Why tabs open on tapped player, switch names and expose models without course fit or probability',async()=>{
+ it('Why tabs open on tapped player, switch names and expose anonymous reads without course fit or probability',async()=>{
   mount(<PicksSheet open onClose={()=>{}} picks={picks} predictions={null} eventName="Mexico Open" venueName="Vidanta" tournamentId="event" initialPlayerId="c"/>);
   expect(screen.getByRole('tab',{name:'Tom Kim'})).toHaveAttribute('aria-selected','true');
   fireEvent.click(screen.getByRole('tab',{name:'Wyndham Clark'}));expect(document.querySelector('.pick-panel-name')?.textContent).toBe('Wyndham Clark');
-  await waitFor(()=>expect(document.querySelector('.pick-panel-votes')?.textContent).toContain('Claude1st'));
+  await waitFor(()=>expect(document.querySelector('.pick-panel-votes')?.textContent).toBe('1st1st1st'));
   expect(document.querySelector('[data-overview-picks-sheet-fit]')).toBeNull();expect(document.querySelector('[data-overview-picks-sheet]')?.textContent).not.toContain('99%');
  });
  it('Why hides unchecked reason and keeps valid claim',async()=>{mount(<PicksSheet open onClose={()=>{}} picks={picks} predictions={null} eventName="Event" venueName={null} tournamentId="event"/>);await waitFor(()=>expect(document.querySelector('.pick-panel-case')?.textContent).toContain('Hits 72.3%'));expect(document.querySelector('.pick-panel-case')?.textContent).not.toContain('scrambling');});
  it('record tour chips have canonical order and switching uses event season',async()=>{mount(<OurRecordSheet open onClose={()=>{}} tour="pga" year={2026}/>);await screen.findByRole('button',{name:'PGA TOUR'});expect(Array.from(document.querySelectorAll('.pick-record-tours button')).map(b=>b.textContent)).toEqual(['PGA TOUR','DP World','LPGA','Champions','Korn Ferry','LIV Golf']);fireEvent.click(screen.getByRole('button',{name:'LPGA'}));await waitFor(()=>expect(mocks.rpc).toHaveBeenCalledWith('get_our_pick_record',{p_tour:'lpga',p_year:2026}));});
- it('record shows own dot, sorted board and newest-first ledger result tones',async()=>{mount(<OurRecordSheet open onClose={()=>{}} tour="pga" year={2026}/>);await waitFor(()=>expect(document.querySelector('[data-viewer-dot]')).not.toBeNull());expect(Array.from(document.querySelectorAll('[data-beat-user]')).map(row=>row.getAttribute('data-beat-user'))).toEqual(['viewer','other','clbhouz']);expect(Array.from(document.querySelectorAll('[data-record-event]')).map(row=>row.getAttribute('data-record-event'))).toEqual(['new','old']);expect(document.querySelector('[data-result-tone="out"]')?.textContent).toBe('MC');expect(document.querySelector('[data-result-tone="win"]')?.textContent).toBe('1');});
+ it('record shows own dot, sorted board and newest-first ledger result tones',async()=>{mount(<OurRecordSheet open onClose={()=>{}} tour="pga" year={2026}/>);await waitFor(()=>expect(document.querySelector('[data-viewer-dot]')).not.toBeNull());expect(Array.from(document.querySelectorAll('[data-beat-user]')).map(row=>row.getAttribute('data-beat-user'))).toEqual(['clbhouz','viewer','other']);expect(Array.from(document.querySelectorAll('[data-record-event]')).map(row=>row.getAttribute('data-record-event'))).toEqual(['new','old']);expect(document.querySelector('[data-result-tone="out"]')?.textContent).toBe('MC');expect(document.querySelector('[data-result-tone="win"]')?.textContent).toBe('1st');});
  it('record has no viewer dot without scored own picks',async()=>{members=members.filter(m=>!m.is_viewer);mount(<OurRecordSheet open onClose={()=>{}} tour="pga" year={2026}/>);await screen.findByRole('button',{name:'PGA TOUR'});expect(document.querySelector('[data-viewer-dot]')).toBeNull();});
 });```

## Every visible string changed
- `public/locales/en/tourhub.json` / `overview.picksSheet.models`: `THE THREE MODELS` → `AGREEMENT`
- `public/locales/en/tourhub.json` / `overview.picksSheet.modelRead`: `The models’ read:` → `OUR READ`
- `public/locales/en/tourhub.json` / `overview.pickRecord.event_count`: `None` → `EVENTS`
- `public/locales/en/tourhub.json` / `overview.pickRecord.top10`: `TOP 10` → `TOP 10S`
- `public/locales/en/tourhub.json` / `overview.pickRecord.winsLabel`: `None` → `WINS`
- `public/locales/en/tourhub.json` / `overview.pickRecord.top10Column`: `None` → `TOP 10`
- `public/locales/en/tourhub.json` / `overview.pickRecord.beatTitle`: `BEAT THE MODEL · PEOPLE YOU FOLLOW` → `YOUR CIRCLE · THIS SEASON`
- `public/locales/en/tourhub.json` / `overview.pickRecord.beatCaption`: `"Beat" is the share of the field your pick finished ahead of, averaged over the season. Same measure for everyone, us included.` → `Most wins first, then top 10s, then Beat: the share of the field a pick finished ahead of, averaged over the season. For clbhouz we count our best pick each week, so everyone has one pick per event.`
- `public/locales/en/tourhub.json` / `overview.picksSheet.method.independentLead`: `Three AI models pick independently.` → `Our in-house AI prediction engine reads the whole field.`
- `public/locales/en/tourhub.json` / `overview.picksSheet.method.independentBody`: `Claude, GPT and Gemini each get the same research: every player's season stats, recent results, history at this course, and what the betting market and tipsters think.` → `Every player's season stats, recent results, history at this course, and what the betting market and tipsters think.`
- `public/locales/en/tourhub.json` / `overview.picksSheet.method.combineLead`: `We combine their rankings.` → `It reads it three times, independently.`
- `public/locales/en/tourhub.json` / `overview.picksSheet.method.combineBody`: `A player ranked high by all three beats one ranked first by only one. The top three are our picks.` → `A player high in all three reads beats one who comes out first in only one. The top three are our picks.`
- `public/locales/en/tourhub.json` / `overview.picksSheet.method.checkLead`: `We check their working.` → `We check its working.`
- `public/locales/en/tourhub.json` / `overview.picksSheet.method.checkBody`: `The bars above are our own numbers, not the models'. If a model quotes a figure that doesn't match our stats, we don't show it.` → `The bars above are our own numbers. If a read quotes a figure that doesn't match our stats, we don't show it.`
- `public/locales/en-XA/tourhub.json` / `overview.picksSheet.models`: `THE THREE MODELS` → `AGREEMENT`
- `public/locales/en-XA/tourhub.json` / `overview.picksSheet.modelRead`: `The models’ read:` → `OUR READ`
- `public/locales/en-XA/tourhub.json` / `overview.pickRecord.event_count`: `None` → `EVENTS`
- `public/locales/en-XA/tourhub.json` / `overview.pickRecord.top10`: `TOP 10` → `TOP 10S`
- `public/locales/en-XA/tourhub.json` / `overview.pickRecord.winsLabel`: `None` → `WINS`
- `public/locales/en-XA/tourhub.json` / `overview.pickRecord.top10Column`: `None` → `TOP 10`
- `public/locales/en-XA/tourhub.json` / `overview.pickRecord.beatTitle`: `BEAT THE MODEL · PEOPLE YOU FOLLOW` → `YOUR CIRCLE · THIS SEASON`
- `public/locales/en-XA/tourhub.json` / `overview.pickRecord.beatCaption`: `"Beat" is the share of the field your pick finished ahead of, averaged over the season. Same measure for everyone, us included.` → `Most wins first, then top 10s, then Beat: the share of the field a pick finished ahead of, averaged over the season. For clbhouz we count our best pick each week, so everyone has one pick per event.`
- `public/locales/en-XA/tourhub.json` / `overview.picksSheet.method.independentLead`: `Three AI models pick independently.` → `Our in-house AI prediction engine reads the whole field.`
- `public/locales/en-XA/tourhub.json` / `overview.picksSheet.method.independentBody`: `Claude, GPT and Gemini each get the same research: every player's season stats, recent results, history at this course, and what the betting market and tipsters think.` → `Every player's season stats, recent results, history at this course, and what the betting market and tipsters think.`
- `public/locales/en-XA/tourhub.json` / `overview.picksSheet.method.combineLead`: `We combine their rankings.` → `It reads it three times, independently.`
- `public/locales/en-XA/tourhub.json` / `overview.picksSheet.method.combineBody`: `A player ranked high by all three beats one ranked first by only one. The top three are our picks.` → `A player high in all three reads beats one who comes out first in only one. The top three are our picks.`
- `public/locales/en-XA/tourhub.json` / `overview.picksSheet.method.checkLead`: `We check their working.` → `We check its working.`
- `public/locales/en-XA/tourhub.json` / `overview.picksSheet.method.checkBody`: `The bars above are our own numbers, not the models'. If a model quotes a figure that doesn't match our stats, we don't show it.` → `The bars above are our own numbers. If a read quotes a figure that doesn't match our stats, we don't show it.`
- `src/features/admin/pages/CourseMatchingPage.tsx` / `visible matching copy`: `WHS courses the model couldn't confidently match.` → `WHS courses our prediction engine couldn't confidently match.`
- `src/features/admin/pages/CourseMatchingPage.tsx` / `visible matching copy`: `'model agrees' : 'models agree'` → `'read agrees' : 'reads agree'`
- `src/features/admin/pages/CourseMatchingPage.tsx` / `visible matching copy`: `'Hide model reasoning' : 'Show model reasoning'` → `'Hide prediction engine reasoning' : 'Show prediction engine reasoning'`
- `src/features/admin/pages/CourseMatchingPage.tsx` / `visible matching copy`: `Model suggestion` → `Prediction engine suggestion`
- `src/features/admin/pages/CourseMatchingPage.tsx` / `visible matching copy`: `{seg.model}:` → `Read {i + 1}:`

PicksSheet additionally removes the literal visible Claude/GPT/Gemini labels and modelVoteNote provider-name sentences; ranks remain keyed claude/gpt4/gemini internally. Staff course-matching copy also uses prediction engine/read wording, with provider segment labels replaced by numbered Read labels. Other src/public-locale matches were internal fields/keys, comments, unrelated signal-model terminology, or test fixtures; those remain. No SQL, migration, deployed function, feed_config, round_pool_cap, native/Median or news/story-template changes.

## Verification limits
Managed authentication is external_unmanaged: authenticated circle readback and hosted write flows unavailable, not claimed. Existing tests cover real providers with controlled RPC payloads, not a hosted session. The live public /tourhub check records whether the Our record door was present; screenshot is available only if opened. Hosted JSON contract is not independently queried; missing best does not fall back to all-pick averages. Latest automatic build checked separately.

### Live browser outcome
At1280×1800 the real record door existed but GuestJoinCard's `data-guest-gate-shade` intercepted its click. Playwright `Locator.click: Timeout 30000ms exceeded` at /tmp/browser/our-record-v2/check_record.py:12. No forced click or gate bypass; no sheet screenshot or live parity claim. Latest automatic build OK08:03:10Z. This is an unavailable guest-gated environmental check, not a test failure; all shards remain clean.
