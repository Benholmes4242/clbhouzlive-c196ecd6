import { afterEach,describe,expect,it,vi } from 'vitest';
import { cleanup,render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider,initReactI18next } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';
import { AlsoWeekEvent } from '@/features/tourhub/overview/sections/AlsoWeekEvent';
import { isAlsoThisWeek } from '@/features/tourhub/overview/sections/AlsoThisWeek';
import { chasePlayers,onCourse,situation,startsValues,weekFacts,weekRows,weekTotalRounds } from '@/features/tourhub/overview/sections/alsoWeekRules';
import { boardTieRole } from '@/features/tourhub/leaderboard/leaderboardRules';
import { todayFromEntry,fmtThru,type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
import { Movement } from '@/features/tourhub/overview/sections/WorldRankings';
const i18n=createInstance();i18n.use(initReactI18next).init({lng:'en',resources:{en:{tourhub:en}},interpolation:{escapeValue:false},initImmediate:false});
afterEach(cleanup);
function slide(type:HeroSlide['type']='live'):HeroSlide {return {type,tournament:{id:'event',name:'Weekly Event',status:type==='live'?'inprogress':type==='completed'?'closed':'scheduled',startDate:'2026-10-29',endDate:'2026-11-01',currentRound:3,venueName:'Venue',venueCourseName:'Course',venuePar:71,tourSlug:'pga',tourName:'PGA Tour',purse:2100000,currency:'USD',defendingChampion:'John Defender',winnerId:'sr-a'} as HeroSlide['tournament']};}
function row(id='a',position=1,score=-20,thru:number|null=14):BoardEntry {return {id,position,score,thru,today:-4,today_round:3,round_1:-8,round_2:-8,round_3:-4,player:{id,sr_id:`sr-${id}`,full_name:`John ${id.toUpperCase()}`}};}
const field=()=>[row(),row('b',2,-18),row('c',3,-17)];
function view(s=slide(),entries=field(),followed=new Set<string>(),draw?:{first:string|null;players:NonNullable<BoardEntry['player']>[]}) {return render(<MemoryRouter><I18nextProvider i18n={i18n}><div className="also-week"><AlsoWeekEvent slide={s} entries={entries} followed={followed} draw={draw}/></div></I18nextProvider></MemoryRouter>);}
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
  it('live board uses surname rows and canonical tie bracket roles',()=>{const f=field();f[2].position=2;const v=view(slide(),f);expect(v.container.querySelectorAll('.also-br')).toHaveLength(3);expect(v.container.querySelector('[data-tie-bracket=first]')).not.toBeNull();expect(v.container.querySelector('.also-name')?.textContent).toBe('A');});
  it('followed top row carries membership and extra row separated',()=>{const v=view(slide(),[...field(),row('d',7)],new Set(['a','d']));expect(v.container.querySelectorAll('[data-mine=true].also-br')).toHaveLength(2);expect(v.container.querySelector('.also-gap')).not.toBeNull();});
  it('finished event has winner block, no chase and F cells',()=>{const s=slide('completed');s.tournament.currentRound=3;const v=view(s);expect(v.container.querySelector('.also-win')).not.toBeNull();expect(v.container.querySelector('.also-chase')).toBeNull();expect([...v.container.querySelectorAll('.also-thru')].map(e=>e.textContent)).toEqual(['F','F','F']);});
  it('starting event omits field without draw and no board',()=>{const v=view(slide('upcoming'));expect(v.container.querySelector('[data-fact=field]')).toBeNull();expect(v.container.querySelector('.also-board')).toBeNull();expect(v.container.querySelector('.also-state')?.getAttribute('data-state')).toBe('upcoming');});
  it('starting followed-player stack uses published draw',()=>{const p=row().player;if(!p)throw Error('fixture');const v=view(slide('upcoming'),[],new Set(['a']),{first:null,players:[p]});expect(v.container.querySelector('.also-yours')).not.toBeNull();expect(v.container.querySelectorAll('.also-stack .also-avatar')).toHaveLength(1);});
  it('rank fall is muted and rank rise stays a rise',()=>{const v=render(<><Movement value={-3}/><Movement value={4}/></>);expect(v.container.querySelector('[data-movement-tone=fall]')?.textContent).toBe('▼3');expect(v.container.querySelector('[data-movement-tone=rise]')?.textContent).toBe('▲4');});
});