import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { mkdirSync, writeFileSync } from 'node:fs';
import en from '../../src/locales/en/tourhub.json';
import type { HeroState } from '@/features/tourhub/components/overview-v3/HybridHero.utils';
vi.mock('@/hooks/useSupabaseSession',()=>({useSupabaseSession:()=>({user:{id:'me',is_anonymous:false}})}));
vi.mock('@/features/guest/guestGateStore',()=>({getGuestUser:()=>null}));
vi.mock('@/features/guest/useGuestActionGate',()=>({useGuestActionGate:()=>()=>false}));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes',()=>({usePickTeeTimes:()=>({data:new Map()})}));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll',()=>({useTeeTimesAll:()=>({data:[]})}));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet',()=>({ScorecardSheet:()=>null}));
vi.mock('@/features/tourhub/context/TourSelectionContext',()=>({useTourSelection:()=>({viewingTournamentId:null,viewingTourSlug:'pga'})}));
vi.mock('@/features/tourhub/hooks/useAIPredictions',()=>({useAIPredictions:()=>({data:null})}));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes',()=>({useTournamentTeeTimes:()=>({data:[]})}));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4',()=>({useTournamentLastYearTop4:()=>({data:[]})}));
import { PhotoBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand';
import { MiniBoard } from '@/features/tourhub/tournament-v2/sections/MiniBoard';
import { HeroBoardSection, RoundMovementBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
const language=createInstance();
void language.use(initReactI18next).init({lng:'en',initAsync:false,resources:{en:{tourhub:en}},interpolation:{escapeValue:false}});
const mount=(node:React.ReactNode)=>render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><I18nextProvider i18n={language}>{node}</I18nextProvider></MemoryRouter></QueryClientProvider>);
const photo=(state:HeroState,tourLabel='PGA TOUR')=><PhotoBand title="World Wide Technology Championship" venueName="El Cardonal at Diamante" datesString="5–8 Nov" venueImageUrl={null} state={state} tourLabel={tourLabel} startDay="THURSDAY" countdown={[{value:4,label:'days'}]} leader={{score:-18,caps:'James',faces:[{key:'j',name:'Benjamin James',candidates:[]},{key:'b',name:'Blair',candidates:[]}]}} onOpen={()=>{}}/>;
afterEach(cleanup);
describe('Overview hero B and members strip',()=>{
  it.each([
    [{kind:'live',round:3,totalRounds:4},'PGA TOUR','PGA TOUR · ROUND 3'],
    [{kind:'live',round:4,totalRounds:4},'PGA TOUR','PGA TOUR · FINAL ROUND'],
    [{kind:'suspended',round:3,totalRounds:4},'PGA TOUR','PGA TOUR · ROUND 3 · SUSPENDED'],
    [{kind:'results',variant:'awaiting-playoff',finishDate:'2026-11-07',meta:''},'PGA TOUR','PGA TOUR · PLAYOFF'],
    [{kind:'results',variant:'standard',finishDate:'2026-11-07',meta:''},'PGA TOUR','PGA TOUR · FINAL'],
    [{kind:'upcoming',variant:'far',countdown:'',meta:''},'CHAMPIONS TOUR','CHAMPIONS TOUR · Starts THURSDAY'],
    [{kind:'live',round:3,totalRounds:4},'','ROUND 3'],
  ] as const)('joins the tour/state kicker for %j',(state,tour,label)=>{
    const v=mount(photo(state as HeroState,tour));
    const row=v.container.querySelector('[data-overview-photo-kicker-row]');
    expect(row?.firstElementChild?.textContent).toBe(label);
    expect(row?.querySelector('[data-overview-full-board]')).toBeNull(); // BUILD_TOUR_BUTTONS_UNDER_HERO §3: the kicker link is gone in every state
    expect(v.container.querySelector('[data-overview-photo-pill-row]')).toBeNull();
  });
  it('keeps leader B bottom aligned with 24px faces and a 21px score',()=>{
    const v=mount(photo({kind:'live',round:3,totalRounds:4}));
    const trio=v.container.querySelector<HTMLElement>('[data-overview-leader-trio]');
    expect(trio?.style.alignSelf).toBe('flex-end');
    expect(trio?.querySelector('[style*="width: 24px"]')).not.toBeNull();
    expect((trio?.children[1] as HTMLElement).style.fontSize).toBe('21px');
    expect((trio?.children[0] as HTMLElement).style.marginBottom).toBe('5px');
    expect(v.container.querySelectorAll<HTMLElement>('[data-overview-trio-face]')[1].style.marginLeft).toBe('-8px');
  });
  it.each([false,true])('board top padding opts in only after movers=%s',afterMovers=>{
    const v=mount(<MiniBoard tournamentId="event" entries={[]} theme="heroBoard" afterMovers={afterMovers}/>);
    expect(v.container.querySelector<HTMLElement>('[data-overview-board-header]')?.parentElement?.style.paddingTop).toBe(afterMovers?'0px':'12px');
  });
  it('movers own 10px bottom padding',()=>{
    const v=mount(<RoundMovementBand round={3} cards={[]}/>);
    expect(v.container.querySelector<HTMLElement>('[data-overview-movement]')?.style.paddingBottom).toBe('10px');
  });

  it('renders actual components for narrow-screen verification with caller board spacing',()=>{
    const entries=[{id:'j',position:1,score:-18,round_1:-8,round_2:-7,today:-3,today_round:3,thru:8,player:{id:'j',full_name:'Benjamin James'}},{id:'b',position:2,score:-16,round_1:-9,round_2:-6,today:-1,today_round:3,thru:8,player:{id:'b',full_name:'Peter Malnati'}}];
    const v=mount(<>{photo({kind:'live',round:3,totalRounds:4},'PGA TOUR WITH A VERY LONG TOUR NAME')}<HeroBoardSection tournamentId="event" entries={entries} phase="live" currentRound={3} totalRounds={4}/>{photo({kind:'upcoming',variant:'far',countdown:'',meta:''},'CHAMPIONS TOUR')}</>);
    const header=v.container.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(header?.parentElement?.style.paddingTop).toBe('0px');
    if(process.env.OVERVIEW_B_BROWSER==='1'){mkdirSync('/tmp/browser/overview-b',{recursive:true});writeFileSync('/tmp/browser/overview-b/components.html',v.container.innerHTML);}
  });
});