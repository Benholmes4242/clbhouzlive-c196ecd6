import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,cleanup,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const rows=Array.from({length:148*18},(_,i)=>({player_id:`p${String(Math.floor(i/18)).padStart(3,'0')}`,round_number:2,hole_number:i%18+1,strokes:4,par:4,starting_hole:1}));
const mocks=vi.hoisted(()=>({calls:[] as [number,number][]}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:()=>{const chain:Record<string,unknown>={};for(const n of ['select','eq','order'])chain[n]=()=>chain;chain.range=(a:number,b:number)=>{mocks.calls.push([a,b]);const end=Math.min(b,a+999);return Promise.resolve({data:rows.slice(a,end+1),error:null});};return chain;}}}));
import {readBoardHoles} from '@/features/tourhub/leaderboard/useBoardHoles';
import {HeroRoundPanel} from '@/features/tourhub/tournament-v2/sections/HeroRoundPanel';
afterEach(()=>{cleanup();mocks.calls.length=0;});
describe('Brief 21 C — board round panel reads the whole round',()=>{
 it('a 1000-row-capped client returns all 148 × 18 rows across three pages',async()=>{
  const out=await readBoardHoles('t',2);
  expect(out).toHaveLength(2664);expect(mocks.calls).toEqual([[0,999],[1000,1999],[2000,2999]]);
 });
 it('a finished round panel shows 18 holes, IN and OUT and no THRU',async()=>{
  const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
  const {container}=render(<QueryClientProvider client={client}><HeroRoundPanel tournamentId="t" playerId="p147" round={2} rounds={4} startedRounds={[1,2]} boardUpdatedAt={0} onRound={()=>{}} onFull={()=>{}}/></QueryClientProvider>);
  await waitFor(()=>expect(container.querySelector('[data-hero-in]')?.textContent).toBe('36'));
  expect(container.querySelector('[data-hero-out]')?.textContent).toBe('36');
  expect(container.querySelectorAll('.hero-round-numbers span')).toHaveLength(18);
  expect(container.textContent).not.toContain('THRU');
 });
});
