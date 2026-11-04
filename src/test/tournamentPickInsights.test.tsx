import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),guest:false,user:{id:'viewer',is_anonymous:false} as {id:string;is_anonymous:boolean}|null,gate:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:mocks.rpc}}));
vi.mock('@/hooks/useSupabaseSession',()=>({useSupabaseSession:()=>({user:mocks.user})}));
vi.mock('@/features/guest/guestGateStore',()=>({getGuestUser:()=>mocks.guest?{id:'guest'}:null}));
vi.mock('@/features/guest/useGuestActionGate',()=>({useGuestActionGate:()=>mocks.gate}));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes',()=>({usePickTeeTimes:()=>({data:new Map()})}));
import { finishedVerdict, compareLivePick, compareFinishedPick, chooseFitStats, ordinal, filterCheckedReasons, lowestFit, catchSentence, agreementNote, winningScoreRange, sortedBeatRows, type PickResult } from '@/features/tourhub/components/overview-v3/HybridHeroBands/pickInsightRules';
import { YourPickCard } from '@/features/tourhub/components/overview-v3/HybridHeroBands/YourPickCard';
import { pickStatusToken } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock';
import { PicksSheet } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet';
import { OurRecordSheet } from '@/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet';
import { PickMemberBands } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PickMemberBands';
import type { PickRecord, FitStat, BeatRow } from '@/features/tourhub/hooks/usePickInsights';
import type { TournamentPickState } from '@/features/tourhub/hooks/useTournamentPick';
import type { AITopContender } from '@/features/tourhub/hooks/useAIPredictions';
const language=createInstance();
void language.use(initReactI18next).init({lng:'en',resources:{en:{tourhub:en}},interpolation:{escapeValue:false},initAsync:false});
let client:QueryClient;
let record:PickRecord;
let members:BeatRow[];
let state:TournamentPickState;
const result=(id:string,position:number,status:string|null=null):PickResult=>({playerId:id,playerName:{a:'Wyndham Clark',b:'Doug Ghim',c:'Tom Kim',me:'Tony Finau'}[id]??id,position,status,score:-18,tied:true});
const ours=[result('a',20),result('b',8),result('c',11)];
const fits:FitStat[]=[['driving_distance',312.8,84],['driving_accuracy',58.1,24],['greens_in_reg',72.3,96],['strokes_gained_tee_green',1.1,96],['strokes_gained_putting',.04,53],['scoring_average',69.87,60]].map(([stat,value,percentile])=>({player_id:'a',stat:String(stat),value:Number(value),percentile:Number(percentile),players:222,wins:3}));
const picks:AITopContender[]=ours.map((r,i)=>({rank:i+1,playerId:r.playerId,playerName:r.playerName,photoUrl:null,pgaTourId:null,country:'United States',worldRanking:5+i,winProbability:99,courseFitScore:100,reasons:['Three wins this season.','Hits 72.3% of greens.','64.9% scrambling.'],concern:'',modelVotes:[{model:'claude',rank:i+1},{model:'gpt4',rank:i+1},{model:'gemini',rank:i+1}]}));
const wrapper=({children}:{children:React.ReactNode})=><QueryClientProvider client={client}><MemoryRouter><I18nextProvider i18n={language}>{children}</I18nextProvider></MemoryRouter></QueryClientProvider>;
const mount=(node:React.ReactNode)=>render(node,{wrapper});
beforeEach(()=>{
 client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}}); mocks.guest=false;mocks.user={id:'viewer',is_anonymous:false};mocks.gate.mockReset().mockReturnValue(false);
 state={my_player_id:null,locked:false,locks_at:'2026-11-05T07:40:00Z',followed_pickers:1,followed_top:[{player_id:'a',player_name:'Wyndham Clark',picks:1}]};
 record={tours:['liv','pgad','champ','lpga','euro','pga'],picks:30,event_count:10,best:{events:10,wins:3,top10:9,avg_percentile:94},won:3,top10:13,avg_percentile:73,first_event_date:'2026-03-15',events:[{tournament_id:'old',name:'Old event',end_date:'2026-10-01',picks:[{player_id:'a',player_name:'Clark',position:1,tied:false,status:null,percentile:100}]},{tournament_id:'new',name:'Mexico Open',end_date:'2026-11-01',picks:[{player_id:'a',player_name:'Clark',position:80,tied:false,status:'CUT',percentile:19},{player_id:'b',player_name:'Ghim',position:6,tied:true,status:null,percentile:95}]}]};
 members=[{user_id:'viewer',display_name:'Me',username:'me',profile_photo_url:null,picks:9,wins:1,top10:3,avg_percentile:81,is_viewer:true},{user_id:'other',display_name:'Danny',username:'danny',profile_photo_url:null,picks:10,wins:0,top10:2,avg_percentile:77,is_viewer:false}];
 mocks.rpc.mockReset().mockImplementation(async(name:string)=>({data:name==='get_our_pick_record'?record:name==='get_beat_the_model'?members:name==='get_tournament_pick_state'?[state]:name==='get_pick_fit'?fits:name==='get_pick_field'?picks.map(p=>({player_id:p.playerId,full_name:p.playerName,world_rank:p.worldRanking,photo_url:null,headshot_override:null,country:p.country})):name==='get_event_winning_scores'?[{winning_score:-24},{winning_score:-17}]:[],error:null}));
});
afterEach(()=>{cleanup();client.clear();});
describe('tournament picks pure rules',()=>{
 it.each([[3,'All three in the top 10.'],[2,'Two of three in the top 10.'],[1,'One of three in the top 10.'],[0,'None of our three in the top 10.']])('verdict counts %i of three',(n,line)=>{expect(finishedVerdict(ours.map((p,i)=>({...p,position:i<Number(n)?5:20})),[]).bold).toBe(line);});
 it('two-pick verdicts use both, of two and none of our two',()=>{
  expect(finishedVerdict([result('a',2),result('b',3)],[]).bold).toBe('Both in the top 10.');
  expect(finishedVerdict([result('a',2),result('b',30)],[]).bold).toBe('One of two in the top 10.');
  expect(finishedVerdict([result('a',20),result('b',30)],[]).bold).toBe('None of our two in the top 10.');
 });
 it('champion identity overrides bold count and cut/withdrawal clauses stay in rank order',()=>{
  expect(finishedVerdict([result('a',1),result('b',2,'cut'),result('c',3,'wd')],['a'])).toEqual({bold:'Clark won it.',rest:'One of three in the top 10. Ghim missed the cut. Kim withdrew.'});
 });
 it('all ahead and all behind comparisons use positions',()=>{
  expect(compareLivePick(result('me',1),ours)).toBe('Ahead of all our picks.');
  expect(compareLivePick(result('me',30),ours)).toBe('Behind all our picks.');
 });
 it('mixed comparisons name ahead and behind picks with level clauses',()=>{
  expect(compareLivePick(result('me',11),ours)).toBe('Behind Ghim, ahead of Clark. Level with Kim.');
 });
 it('resolved Kim example excludes MC Clark and never adds the one-of-ours prefix',()=>{
  expect(compareLivePick(result('c',11),[result('a',20,'MC'),result('b',8),result('c',11)])).toBe('Behind Ghim.');
 });
 it('no active other pick produces no comparison',()=>{expect(compareLivePick(result('c',11),[result('a',1,'cut'),result('b',2,'WD'),result('c',11)])).toBe('');});
 it.each([[1,'Ahead of our best pick.'],[8,'Level with our best.'],[20,'Behind our best pick.']])('final position %i compares with active best',(pos,text)=>{expect(compareFinishedPick(result('me',Number(pos)),ours)).toBe(text);});
 it('Mexico Open chooses distance, greens and tee-to-green for every player',()=>{expect(chooseFitStats(['Driving Distance','SG: Approach','SG: Tee-to-Green','Driving Distance'])).toEqual(['driving_distance','greens_in_reg','strokes_gained_tee_green']);});
 it('unknown key stats are skipped and defaults fill distinct slots',()=>{expect(chooseFitStats(['Scrambling','Putting','Putting'])).toEqual(['strokes_gained_putting','greens_in_reg','strokes_gained_tee_green']);});
 it.each([[1,'1st'],[2,'2nd'],[3,'3rd'],[11,'11th'],[12,'12th'],[13,'13th'],[84,'84th']])('percentile %i has correct ordinal',(value,text)=>{expect(ordinal(Number(value))).toBe(text);});
 it('reason filter accepts checked green percent and word wins, drops unsupported claims',()=>{
  expect(filterCheckedReasons(['Hits 72.3% of greens','64.9% scrambling','T4 here in 2025','won here by 7 strokes','Three wins this season','Strong approach play'],fits)).toEqual(['Hits 72.3% of greens','Three wins this season','Strong approach play']);
 });
 it('every numeric claim must match tolerance while years are ignored',()=>{
  expect(filterCheckedReasons(['Hits 72.7% of greens','Tee to green +1.10','Driving 314.0 yards','Three wins in 2025'],fits)).toEqual(['Tee to green +1.10','Three wins in 2025']);
 });
 it('ordinary number words do not invalidate a non-win reason',()=>{
  expect(filterCheckedReasons(['One of the longest hitters in the field'],fits)).toEqual(['One of the longest hitters in the field']);
 });
 it('three wins is kept when the checked wins count is three',()=>{
  expect(filterCheckedReasons(['Three wins this season'],fits)).toEqual(['Three wins this season']);
 });
 it('three wins is dropped when the checked wins count is one',()=>{
  expect(filterCheckedReasons(['Three wins this season'],fits.map(stat=>({...stat,wins:1})))).toEqual([]);
 });
 it('a digit stroke-margin claim is still dropped',()=>{
  expect(filterCheckedReasons(['Won here by 7 strokes'],fits)).toEqual([]);
 });
 it('catch selects lowest of all six and uses LPGA pronouns',()=>{const low=lowestFit(fits);expect(low?.stat).toBe('driving_accuracy');if(low)expect(catchSentence(low,'lpga')).toBe('She misses more fairways than most.');});
 it('a sixty-or-better floor gives the no-weakness line',()=>{expect(catchSentence({...fits[0],percentile:60},'pga')).toBe('No real weakness: his lowest number is still above the middle of the tour.');});
 it('putting middle 40–60 uses middle-of-pack copy',()=>{expect(catchSentence(fits[4],'pga')).toBe('Middle of the pack on the greens.');});
 it('agreement notes count anonymous reads without provider names',()=>{
  expect(agreementNote([{model:'claude',rank:1},{model:'gpt4',rank:1},{model:'gemini',rank:1}])).toBe('First in all three of our reads.');
  expect(agreementNote([{model:'claude',rank:3},{model:'gpt4',rank:4},{model:'gemini',rank:3}])).toBe('Third in two of our three reads, fourth in the other.');
 });
 it('winning scores omit none, distinguish one and span several',()=>{expect(winningScoreRange([])).toBeNull();expect(winningScoreRange([-18])).toEqual({single:true,best:-18,worst:-18});expect(winningScoreRange([-17,-24,-20])).toEqual({single:false,best:-24,worst:-17});});
 it('beat rows include weekly-best clbhouz sorted by wins top10 Beat then events',()=>{expect(sortedBeatRows([...members,{...members[1],user_id:'tie',avg_percentile:73,picks:31}],record).map(r=>r.user_id)).toEqual(['clbhouz','viewer','other','tie']);});
});
describe('tournament picks surfaces',()=>{
 it.each(['CUT','MC','WD','DQ'])('finished viewer and shared pick cards preserve the canonical %s token',(status)=>{
  const expected=status==='CUT'?'MC':status;
  mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:80,my_status:status,my_score:0}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);
  expect(document.querySelector('.pick-mine-figure')?.textContent).toBe(expected);
  expect(pickStatusToken(status)).toBe(expected);
 });
 it.each(['live','completed'] as const)('guest %s renders no pick card',(phase)=>{
  const view=mount(<YourPickCard guest state={null} phase={phase} ourResults={ours} tourCode="pga" onPick={vi.fn()}/>);
  expect(view.container).toBeEmptyDOMElement();
 });
 it('guest locked upcoming renders no pick card',()=>{
  const view=mount(<YourPickCard guest state={{...state,locked:true}} phase="upcoming" ourResults={ours} tourCode="pga" onPick={vi.fn()}/>);
  expect(view.container).toBeEmptyDOMElement();
 });
 it('guest upcoming renders the card and Pick goes to the guest gate',async()=>{
  mocks.guest=true;mocks.user=null;mocks.gate.mockReturnValue(true);
  const onPick=vi.fn();mount(<PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={ours} startedPlayers={new Set()} onPick={onPick} onRecord={()=>{}}/>);
  const pick=await screen.findByRole('button',{name:'Pick'});
  expect(document.querySelector('[data-your-pick-card]')).not.toBeNull();
  fireEvent.click(pick);expect(mocks.gate).toHaveBeenCalledWith('pick');expect(onPick).not.toHaveBeenCalled();
 });
 it('upcoming no-pick card opens Pick and named current pick opens Change',()=>{
  const tap=vi.fn();const v=mount(<YourPickCard state={state} phase="upcoming" ourResults={ours} tourCode="pga" onPick={tap}/>);
  fireEvent.click(screen.getByRole('button',{name:'Pick'}));expect(tap).toHaveBeenCalledOnce();
  v.rerender(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim'}} phase="upcoming" ourResults={ours} tourCode="pga" onPick={tap}/>);
  expect(screen.getByRole('button',{name:'Change'})).toBeInTheDocument();
 });
 it('withdrawn pre-lock pick offers a new pick with withdrawal copy',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_still_in_field:false}} phase="upcoming" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-name')?.textContent).toBe('Tom Kim has withdrawn');expect(screen.getByRole('button',{name:'Pick'})).toBeInTheDocument();});
 it('locked no-pick card is absent on live and finished',()=>{const v=mount(<YourPickCard state={{...state,locked:true}} phase="live" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-your-pick-card]')).toBeNull();v.rerender(<YourPickCard state={{...state,locked:true}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-your-pick-card]')).toBeNull();});
 it('live picked card shows resolved comparison, score and thru',()=>{mount(<YourPickCard state={{...state,locked:true,my_player_id:'c',my_player_name:'Tom Kim',my_position:11,my_tied:true,my_score:-12,my_thru:9}} phase="live" ourResults={[result('a',80,'MC'),result('b',8),result('c',11)]} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Behind Ghim.');expect(document.querySelector('.pick-mine-figure')?.textContent).toContain('T11 −12THRU 9');});
 it('not-started live pick has tee text and no figures',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:1,my_score:0}} phase="live" ourResults={ours} started={false} teeTime="2026-11-05T13:05:00Z" tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-sub')?.textContent).toMatch(/^Tees off/);expect(document.querySelector('.pick-mine-figure')).toBeNull();});
 it('missed-cut card prints muted MC without score',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:80,my_status:'CUT',my_score:-12}} phase="live" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Missed the cut.');expect(document.querySelector('.pick-mine-figure')?.textContent).toBe('MC');});
 it('finished card separates real percentile from the best-pick heading',()=>{mount(<YourPickCard state={{...state,my_player_id:'c',my_player_name:'Tom Kim',my_position:8,my_percentile:95}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Beat 95% of the field.');expect(document.querySelector('[data-pick-question]')?.textContent).toBe('You matched our best pick');});
 it('guest Pick calls the gate and never opens sheet',async()=>{
  mocks.guest=true;mocks.user=null;mocks.gate.mockReturnValue(true);const onPick=vi.fn();mount(<PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={ours} startedPlayers={new Set()} onPick={onPick} onRecord={()=>{}}/>);
  fireEvent.click(await screen.findByRole('button',{name:'Pick'}));expect(mocks.gate).toHaveBeenCalledWith('pick');expect(onPick).not.toHaveBeenCalled();
 });
 it('followed singular and record row use server counts; zero hides both',async()=>{
  record.won=1;record.top10=1;const onRecord=vi.fn();mount(<PickMemberBands tournamentId="event" tourCode="pga" seasonYear={2026} phase="upcoming" currentRound={null} pickResults={ours} startedPlayers={new Set()} onPick={()=>{}} onRecord={onRecord}/>);
  await waitFor(()=>expect(document.querySelector('[data-followed-picks]')?.textContent).toContain('1 of your circle has picked.'));
  const door=document.querySelector('[data-our-record-door]');expect(door?.textContent).toContain('1 win · 1 top 10');if(door)fireEvent.click(door);expect(onRecord).toHaveBeenCalledOnce();
 });
 it('Why tabs open on tapped player, switch names and expose anonymous reads without course fit or probability',async()=>{
  mount(<PicksSheet open onClose={()=>{}} picks={picks} predictions={null} eventName="Mexico Open" venueName="Vidanta" tournamentId="event" initialPlayerId="c"/>);
  expect(screen.getByRole('tab',{name:'Tom Kim'})).toHaveAttribute('aria-selected','true');
  fireEvent.click(screen.getByRole('tab',{name:'Wyndham Clark'}));expect(document.querySelector('.pick-panel-name')?.textContent).toBe('Wyndham Clark');
  await waitFor(()=>expect(document.querySelector('.pick-panel-votes')?.textContent).toBe('1st1st1st'));
  expect(document.querySelector('[data-overview-picks-sheet-fit]')).toBeNull();expect(document.querySelector('[data-overview-picks-sheet]')?.textContent).not.toContain('99%');
 });
 it('Why hides unchecked reason and keeps valid claim',async()=>{mount(<PicksSheet open onClose={()=>{}} picks={picks} predictions={null} eventName="Event" venueName={null} tournamentId="event"/>);await waitFor(()=>expect(document.querySelector('.pick-panel-case')?.textContent).toContain('Hits 72.3%'));expect(document.querySelector('.pick-panel-case')?.textContent).not.toContain('scrambling');});
 it('record tour chips have canonical order and switching uses event season',async()=>{mount(<OurRecordSheet open onClose={()=>{}} tour="pga" year={2026}/>);await screen.findByRole('button',{name:'PGA TOUR'});expect(Array.from(document.querySelectorAll('.pick-record-tours button')).map(b=>b.textContent)).toEqual(['PGA TOUR','DP World','LPGA','Champions','Korn Ferry','LIV Golf']);fireEvent.click(screen.getByRole('button',{name:'LPGA'}));await waitFor(()=>expect(mocks.rpc).toHaveBeenCalledWith('get_our_pick_record',{p_tour:'lpga',p_year:2026}));});
 it('record shows own dot, sorted board and newest-first ledger result tones',async()=>{mount(<OurRecordSheet open onClose={()=>{}} tour="pga" year={2026}/>);await waitFor(()=>expect(document.querySelector('[data-viewer-dot]')).not.toBeNull());expect(Array.from(document.querySelectorAll('[data-beat-user]')).map(row=>row.getAttribute('data-beat-user'))).toEqual(['clbhouz','viewer','other']);expect(Array.from(document.querySelectorAll('[data-record-event]')).map(row=>row.getAttribute('data-record-event'))).toEqual(['new','old']);expect(document.querySelector('[data-result-tone="out"]')?.textContent).toBe('MC');expect(document.querySelector('[data-result-tone="win"]')?.textContent).toBe('1st');});
 it('record has no viewer dot without scored own picks',async()=>{members=members.filter(m=>!m.is_viewer);mount(<OurRecordSheet open onClose={()=>{}} tour="pga" year={2026}/>);await screen.findByRole('button',{name:'PGA TOUR'});expect(document.querySelector('[data-viewer-dot]')).toBeNull();});
});