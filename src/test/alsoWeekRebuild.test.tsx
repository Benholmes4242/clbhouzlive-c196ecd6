import { afterEach,describe,expect,it,vi } from 'vitest';
import { cleanup,render,fireEvent } from '@testing-library/react';
import { MemoryRouter,useLocation } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider,initReactI18next } from 'react-i18next';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import en from '../../public/locales/en/tourhub.json';
import { AlsoWeekEvent } from '@/features/tourhub/overview/sections/AlsoWeekEvent';
import { isAlsoThisWeek } from '@/features/tourhub/overview/sections/AlsoThisWeek';
import { chasePlayers,onCourse,situation,startsValues,weekFacts,weekRows,weekTotalRounds } from '@/features/tourhub/overview/sections/alsoWeekRules';
import { boardTieRole } from '@/features/tourhub/leaderboard/leaderboardRules';
import { todayFromEntry,fmtThru,type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
import { Movement } from '@/features/tourhub/overview/sections/WorldRankings';
import { tournamentRoute } from '@/features/tourhub/routes';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { DANGER,TREND_UP } from '@/features/tourhub/_shared/tokens';
const i18n=createInstance();i18n.use(initReactI18next).init({lng:'en',resources:{en:{tourhub:en}},interpolation:{escapeValue:false},initAsync:false});
afterEach(cleanup);
function slide(type:HeroSlide['type']='live'):HeroSlide {return {type,tournament:{id:'event',name:'Weekly Event',status:type==='live'?'inprogress':type==='completed'?'closed':'scheduled',startDate:'2026-10-29',endDate:'2026-11-01',currentRound:3,venueName:'Venue',venueCourseName:'Course',venuePar:71,tourSlug:'pga',tourName:'PGA Tour',purse:2100000,currency:'USD',defendingChampion:'John Defender',winnerId:'sr-a'} as HeroSlide['tournament']};}
function row(id='a',position=1,score=-20,thru:number|null=14):BoardEntry {return {id,position,score,thru,today:-4,today_round:3,round_1:-8,round_2:-8,round_3:-4,player:{id,sr_id:`sr-${id}`,full_name:`John ${id.toUpperCase()}`}};}
const field=()=>[row(),row('b',2,-18),row('c',3,-17)];
function view(s=slide(),entries=field(),followed=new Set<string>(),draw?:{first:string|null;players:NonNullable<BoardEntry['player']>[]}) {const qc=new QueryClient({defaultOptions:{queries:{retry:false}}});return render(<QueryClientProvider client={qc}><MemoryRouter><I18nextProvider i18n={i18n}><div className="also-week"><AlsoWeekEvent slide={s} entries={entries} followed={followed} draw={draw}/></div></I18nextProvider></MemoryRouter></QueryClientProvider>);}
describe('weekly eligibility',()=>{
  it('completed event ended two days ago shows',()=>{const s=slide('completed');s.tournament.endDate='2026-10-30';expect(isAlsoThisWeek(s,new Date('2026-11-01T06:00:00Z'))).toBe(true);});
  it('completed event ended four days ago does not',()=>{const s=slide('completed');s.tournament.endDate='2026-10-28';expect(isAlsoThisWeek(s,new Date('2026-11-01T06:00:00Z'))).toBe(false);});
  it('live remains eligible regardless of date',()=>expect(isAlsoThisWeek(slide(),new Date('2027-01-01'))).toBe(true));
  it('unknown schedule suppresses a total',()=>{const s=slide();s.tournament.endDate='';expect(weekTotalRounds(s)).toBeNull();});
  it('hero schedule supplies three rounds',()=>{const s=slide();s.tournament.startDate='2026-10-30';expect(weekTotalRounds(s)).toBe(3);});
});
describe('calculated situation',()=>{
  it('earlier round counts remaining rounds and holes',()=>{expect(situation(field(),3,4)).toMatchObject({key:'holesPlay',values:{name:'A',margin:2,holes:22}});});
  it('final round counts holes to finish',()=>expect(situation(field(),3,3)).toMatchObject({key:'finalPlay',values:{holes:4}}));
  it('leader in at score after finishing final round',()=>{const f=field();f[0].thru=18;expect(situation(f,3,3)).toMatchObject({key:'inAt',values:{score:-20,margin:2}});});
  it('between rounds uses going into next round',()=>{const f=field().map(e=>({...e,today:null,round_3:null}));expect(situation(f,3,4)).toMatchObject({key:'goingInto',values:{round:3}});});
  it('two tied leaders share lead',()=>{const f=field();f[1].score=-20;expect(situation(f,3,4)).toMatchObject({key:'shareTwo',values:{count:2,other:'B',score:-20}});});
  it('three tied leaders share lead',()=>expect(situation(field().map(e=>({...e,score:-20})),3,4)).toMatchObject({key:'shareMany',values:{count:3}}));
  it('nobody ever started means no sentence',()=>expect(situation([row()].map(e=>({...e,today:null,round_1:null,round_2:null,round_3:null})),3,4)).toBeNull());
  it('unknown total never counts holes',()=>{const s=situation(field(),3,null);expect(s?.key).toBe('leads');expect(s?.values).not.toHaveProperty('holes');});
  it('on-course count excludes finished and not-started rows',()=>expect(onCourse([row(),row('b',2,-18,18),{...row('c'),today:null,round_3:null}],3)).toBe(1));
});
describe('chase and followed board rules',()=>{
  it('groups by shots back and excludes seven shots back',()=>{const dots=chasePlayers([row(),row('b',2,-18),row('c',3,-13)],new Set());expect(dots.map(p=>p.back)).toEqual([0,2]);});
  it('caps ordinary dots at four per column',()=>{const f=[row(),...Array.from({length:7},(_,i)=>row(String(i),2,-18))];expect(chasePlayers(f,new Set()).filter(p=>p.back===2)).toHaveLength(4);});
  it('followed player takes top slot even after four ordinary players',()=>{const f=[row(),...Array.from({length:5},(_,i)=>row(String(i),2,-18))];const d=chasePlayers(f,new Set(['4'])).filter(p=>p.back===2);expect(d).toHaveLength(4);expect(d[3]).toMatchObject({mine:true,stack:3,entry:{id:'4'}});});
  it('top positions include ties with five-row cap',()=>{const f=Array.from({length:7},(_,i)=>row(String(i),i===0?1:2,-20+i));expect(weekRows(f,new Set()).top).toHaveLength(5);});
  it('tie roles share canonical bracket',()=>{const f=[row(),row('b',2),row('c',2),row('d',2)];expect(f.map((_,i)=>boardTieRole(f,i))).toEqual(['','first','middle','last']);});
  it('extra followed rows are best first and capped at two',()=>{const f=[...field(),row('z',15),row('y',7),row('x',8)];expect(weekRows(f,new Set(['z','y','x'])).extra.map(e=>e.id)).toEqual(['y','x']);});
  it('no follows yields no extra rows',()=>expect(weekRows(field(),new Set()).extra).toEqual([]));
  it('shared today and thru resolve current round only and F',()=>{expect(todayFromEntry({...row(),today_round:2},3)).toBeNull();expect(fmtThru(18)).toBe('F');});
});
describe('starting facts',()=>{
  it('unknown cells are omitted',()=>expect(weekFacts(null,null,null,null)).toEqual([]));
  it('field purse and defending values are calculated',()=>expect(weekFacts(78,2100000,'USD','John Takeda')).toEqual([{key:'field',value:'78'},{key:'purse',value:'$2.1m'},{key:'defending',value:'Takeda'}]));
  it('no tee time gives only weekday',()=>expect(startsValues('2026-11-05',null)).toEqual({day:'THU',time:null}));
  it('tee time uses device time zone',()=>{const tee='2026-11-05T01:30:00Z';expect(startsValues('2026-11-05',tee)?.time).toBe(new Intl.DateTimeFormat('en',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(tee)));});
});
describe('event structures and ranking polarity',()=>{
  it('live board uses surname rows with no faces and no tie bracket',()=>{const f=field();f[2].position=2;const v=view(slide(),f);expect(v.container.querySelectorAll('.also-br')).toHaveLength(3);expect(v.container.querySelector('[data-tie-bracket]')).toBeNull();expect(v.container.querySelector('.also-avatar')).toBeNull();expect(v.container.querySelector('.also-name')?.textContent).toBe('A');});
  it('followed top row carries membership and extra row separated',()=>{const v=view(slide(),[...field(),row('d',7)],new Set(['a','d']));expect(v.container.querySelectorAll('[data-mine=true].also-br')).toHaveLength(2);expect(v.container.querySelector('.also-gap')).not.toBeNull();});
  it('finished event has winner block, no chase and F cells',()=>{const s=slide('completed');s.tournament.currentRound=3;const v=view(s);expect(v.container.querySelector('.also-win')).not.toBeNull();expect(v.container.querySelector('.also-chase')).toBeNull();expect([...v.container.querySelectorAll('.also-thru')].map(e=>e.textContent)).toEqual(['F','F','F']);});
  it('starting event omits field without draw and no board',()=>{const v=view(slide('upcoming'));expect(v.container.querySelector('[data-fact=field]')).toBeNull();expect(v.container.querySelector('.also-board')).toBeNull();expect(v.container.querySelector('.also-state')?.getAttribute('data-state')).toBe('upcoming');});
  it('starting followed-player line uses published draw with no faces',()=>{const p=row().player;if(!p)throw Error('fixture');const v=view(slide('upcoming'),[],new Set(['a']),{first:null,players:[p]});expect(v.container.querySelector('.also-yours')).not.toBeNull();expect(v.container.querySelectorAll('.also-avatar')).toHaveLength(0);});
  it('rank fall is muted and rank rise stays a rise',()=>{const v=render(<><Movement value={-3}/><Movement value={4}/></>);expect(v.container.querySelector('[data-movement-tone=fall]')?.textContent).toBe('▼3');expect(v.container.querySelector('[data-movement-tone=rise]')?.textContent).toBe('▲4');});
});

describe('remaining signed-off event states',()=>{
  it('four-round event renders ROUND n',()=>{const v=view();expect(v.container.querySelector('.also-state')?.textContent).toBe('ROUND 3');});
  it('non-four-round event renders ROUND n OF total',()=>{const s=slide();s.tournament.startDate='2026-10-30';s.tournament.currentRound=2;const v=view(s);expect(v.container.querySelector('.also-state')?.textContent).toBe('ROUND 2 OF 3');});
  it('last scheduled round renders FINAL ROUND',()=>{const s=slide();s.tournament.currentRound=4;const v=view(s);expect(v.container.querySelector('.also-state')?.textContent).toBe('FINAL ROUND');});
  it('completed event renders FINAL',()=>{const v=view(slide('completed'));expect(v.container.querySelector('.also-state')?.textContent).toBe('FINAL');});
  it('unknown total renders no OF total',()=>{const s=slide();s.tournament.endDate='';const v=view(s);expect(v.container.querySelector('.also-state')?.textContent).toBe('ROUND 3');expect(v.container.querySelector('.also-sit')?.textContent).toBe('A leads by 2');});
  it('starts without tee time renders weekday only',()=>{const s=slide('upcoming');s.tournament.startDate='2026-11-05';const v=view(s);expect(v.container.querySelector('.also-state')?.textContent).toBe('STARTS THU');});
  it('starts with tee time renders device-local time',()=>{const s=slide('upcoming');const tee='2026-11-05T01:30:00Z';const v=view(s,[],new Set(),{first:tee,players:[]});const values=startsValues(s.tournament.startDate,tee);expect(v.container.querySelector('.also-state')?.textContent).toBe(`STARTS ${values?.day} · ${values?.time} YOUR TIME`);expect(v.container.querySelector('.also-state')?.getAttribute('data-state')).toBe('upcoming');});
  it('earlier round sentence renders calculated margin and holes',()=>{const v=view();expect(v.container.querySelector('.also-sit')?.textContent).toBe('A leads by 2, with 22 holes to play');});
  it('final-round sentence renders calculated holes remaining',()=>{const s=slide();s.tournament.startDate='2026-10-30';const v=view(s);expect(v.container.querySelector('.also-sit')?.textContent).toBe('A leads by 2, with 4 to play');});
  it('final-round finished leader renders in-at score',()=>{const s=slide();s.tournament.startDate='2026-10-30';const f=field();f[0].thru=18;const v=view(s,f);expect(v.container.querySelector('.also-sit')?.textContent).toBe('A leads by 2, in at −20');});
  it('between-round sentence renders next round number',()=>{const f=field().map(e=>({...e,today:null,round_3:null}));const v=view(slide(),f);expect(v.container.querySelector('.also-sit')?.textContent).toBe('A leads by 2 going into round 3');});
  it('two tied leaders render both surnames and shared score',()=>{const f=field();f[1].score=-20;const v=view(slide(),f);expect(v.container.querySelector('.also-sit')?.textContent).toBe('A and B share the lead at −20');});
  it('three tied leaders render player count and shared score',()=>{const v=view(slide(),field().map(e=>({...e,score:-20})));expect(v.container.querySelector('.also-sit')?.textContent).toBe('3 players share the lead at −20');});
  it('before any play renders no sentence or chase',()=>{const v=view(slide(),field().map(e=>({...e,today:null,round_1:null,round_2:null,round_3:null})));expect(v.container.querySelector('.also-sit')).toBeNull();expect(v.container.querySelector('.also-chase')).toBeNull();});
  it('winner block renders winning margin and closing strokes',()=>{const v=view(slide('completed'));expect(v.container.querySelector('.also-win-line')?.textContent).toBe('A wins by 2');expect(v.container.querySelector('.also-win-sub')?.textContent).toBe('−20 · closing 67');});
  it('confirmed tied-score winner renders playoff',()=>{const f=field();f[1].score=-20;const v=view(slide('completed'),f);expect(v.container.querySelector('.also-win-line')?.textContent).toBe('A wins in a playoff');});
  it('one followed player uses singular field sentence',()=>{const p=row().player;if(!p)throw Error('fixture');const v=view(slide('upcoming'),[],new Set(['a']),{first:null,players:[p]});expect(v.container.querySelector('.also-yours > span:last-child')?.textContent).toBe('1 of your players is in the field');});
  it('multiple followed players use plural field sentence with no faces',()=>{const players=['a','b','c','d'].map(id=>row(id).player).filter((p):p is NonNullable<BoardEntry['player']>=>p!=null);const v=view(slide('upcoming'),[],new Set(['a','b','c','d']),{first:null,players});expect(v.container.querySelector('.also-yours > span:last-child')?.textContent).toBe('4 of your players are in the field');expect(v.container.querySelectorAll('.also-avatar')).toHaveLength(0);});
  it('guest-equivalent empty follows suppress extra rows and field sentence',()=>{const p=row().player;if(!p)throw Error('fixture');const v=view(slide('upcoming'),[],new Set(),{first:null,players:[p]});expect(v.container.querySelector('.also-yours')).toBeNull();});
  it('followed row has the star and always shows its extra position',()=>{const e=row('d',9);e.position_tied=true;const v=view(slide(),[...field(),e],new Set(['d']));const added=v.container.querySelector('[data-player=d]');expect(added?.querySelector('.also-star')?.textContent).toBe('★');expect(added?.querySelector('.also-pos')?.textContent).toBe('T9');});
  it('today and total use the existing scoreColor for under over and level',()=>{const f=field().map((e,i)=>({...e,today:[-2,1,0][i],score:[-4,2,0][i]}));const v=view(slide(),f);for(const e of f){const r=v.container.querySelector(`[data-player=${e.player?.id}]`);expect((r?.querySelector('.also-today') as HTMLElement).style.color).toBe(normalizeColor(getScoreColor(e.today,'dark')));expect((r?.querySelector('.also-tot') as HTMLElement).style.color).toBe(normalizeColor(getScoreColor(e.score,'dark')));}});
  it('ranking falls use dim not danger and rises retain TREND_UP',()=>{const v=render(<><Movement value={-2}/><Movement value={2}/></>);const fall=v.container.querySelector('[data-movement-tone=fall]') as HTMLElement;const rise=v.container.querySelector('[data-movement-tone=rise]') as HTMLElement;expect(fall).toHaveAttribute('data-movement-tone','fall');expect(rise).toHaveAttribute('data-movement-tone','rise');expect(fall.style.color).not.toBe(normalizeColor(DANGER));expect(rise.style.color).toBe(normalizeColor(TREND_UP));});
  it('event tap opens canonical tournament overview destination with referrer',()=>{let location:{pathname:string;state:unknown}|undefined;function Probe(){location=useLocation();return null;}const s=slide();const qc=new QueryClient({defaultOptions:{queries:{retry:false}}});const v=render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/tourhub']}><I18nextProvider i18n={i18n}><AlsoWeekEvent slide={s} entries={field()} followed={new Set()}/><Probe/></I18nextProvider></MemoryRouter></QueryClientProvider>);fireEvent.click(v.getByRole('button'));const target=tournamentRoute('event',{kind:'overview'});expect(location?.pathname).toBe(target.to);expect(location?.state).toEqual(target.state);});
});

describe('no faces anywhere in the section',()=>{
  it('live board rows render no avatars',()=>{const v=view();expect(v.container.querySelectorAll('.also-avatar')).toHaveLength(0);});
  it('winner block renders no avatar',()=>{const v=view(slide('completed'));expect(v.container.querySelector('.also-win')).not.toBeNull();expect(v.container.querySelector('.also-win .also-avatar')).toBeNull();});
  it('followed-player line renders no avatar stack',()=>{const p=row().player;if(!p)throw Error('fixture');const v=view(slide('upcoming'),[],new Set(['a']),{first:null,players:[p]});expect(v.container.querySelector('.also-stack')).toBeNull();expect(v.container.querySelectorAll('.also-avatar')).toHaveLength(0);});
});
function normalizeColor(color:string){const el=document.createElement('span');el.style.color=color;return el.style.color;}