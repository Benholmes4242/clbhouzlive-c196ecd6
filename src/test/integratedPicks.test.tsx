import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';
import { YourPickCard } from '@/features/tourhub/components/overview-v3/HybridHeroBands/YourPickCard';
import { liveCircleHeading, liveOurLine, finishedCircleLine, finishedOurHeading } from '@/features/tourhub/components/overview-v3/HybridHeroBands/integratedPickRules';
import type { TournamentPickState } from '@/features/tourhub/hooks/useTournamentPick';
import { useTournamentCircleRank } from '@/features/tourhub/hooks/useTournamentCircleRank';
const f=vi.hoisted(()=>({rpc:vi.fn(),user:{id:'me',is_anonymous:false} as {id:string;is_anonymous:boolean}|null}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:f.rpc}}));
vi.mock('@/hooks/useSupabaseSession',()=>({useSupabaseSession:()=>({user:f.user})}));
vi.mock('@/features/guest/guestGateStore',()=>({getGuestUser:()=>null}));
const i18n=createInstance();
void i18n.use(initReactI18next).init({lng:'en',initAsync:false,resources:{en:{tourhub:en}},interpolation:{escapeValue:false}});
const copy=(key:string,options:Record<string,unknown>={})=>i18n.t(`overview.yourPick.${key}`,{ns:'tourhub',...options});
const mine={playerId:'me',playerName:'Tom Kim',position:9};
const ours=[{playerId:'best',playerName:'Doug Ghim',position:3}];
const state:TournamentPickState={my_player_id:'me',my_player_name:'Tom Kim',locks_at:'2026-11-05T03:19:00Z',locked:false,followed_pickers:6,followed_top:[{player_id:'best',player_name:'Doug Ghim',picks:3}],my_position:9,my_percentile:95,followed_best:{player_name:'Steven Fisk',position:3,tied:true}};
let client:QueryClient;
beforeEach(()=>{client=new QueryClient({defaultOptions:{queries:{retry:false}}});f.user={id:'me',is_anonymous:false};f.rpc.mockReset().mockResolvedValue({data:[{circle_pickers:7,ahead:2,level:0}],error:null});});
afterEach(()=>{cleanup();client.clear();});
function mount(node:React.ReactNode){return render(<MemoryRouter><QueryClientProvider client={client}><I18nextProvider i18n={i18n}>{node}</I18nextProvider></QueryClientProvider></MemoryRouter>);}
describe('integrated picks circle rules',()=>{
  it.each([[0,0,"You're top of your circle"],[0,1,"You're level top of your circle"],[1,0,'One of your circle is ahead of you'],[2,0,'Two of your circle are ahead of you'],[10,0,'Ten of your circle are ahead of you']])('ahead=%i level=%i gives authoritative heading',(ahead,level,text)=>{expect(liveCircleHeading({circle_pickers:7,ahead:Number(ahead),level:Number(level)},copy)).toBe(text);});
  it('nobody picked gives against-ours and percentile, missing rank invents nothing',()=>{expect(liveCircleHeading({circle_pickers:0,ahead:0,level:0},copy)).toBe('You against our picks');expect(finishedCircleLine({circle_pickers:0,ahead:0,level:0},state,copy)).toBe('Beat 95% of the field.');expect(liveCircleHeading(null,copy)).toBe('');});
  it.each([[1,'Your pick is ahead of all our picks.'],[3,'Your pick is level with Ghim, our best pick so far.'],[9,'Your pick is behind Ghim, our best pick so far.']])('live position %i compares with best active pick',(position,text)=>{expect(liveOurLine({...mine,position:Number(position)},ours,copy)).toBe(text);});
  it('own-model and eliminated cases take precedence',()=>{expect(liveOurLine(mine,[mine,...ours],copy)).toBe('Your pick is one of ours.');expect(liveOurLine({...mine,status:'MC'},ours,copy)).toBe('Your pick missed the cut.');expect(liveOurLine({...mine,status:'WD'},ours,copy)).toBe('Your pick withdrew.');});
  it.each([[1,'You beat our best pick'],[3,'You matched our best pick'],[9,'Our best pick beat yours']])('finished position %i compares with best',(position,text)=>{expect(finishedOurHeading({...mine,position:Number(position)},ours,copy)).toBe(text);});
  it.each([[0,0,'And you were the best pick in your circle of seven.'],[0,1,'And you were level best pick in your circle of seven.'],[1,0,'Only one of your circle of seven did better: their best pick was Fisk, T3.'],[2,0,'Two of your circle of seven did better: their best pick was Fisk, T3.']])('finished ahead=%i level=%i uses circle results',(ahead,level,text)=>{expect(finishedCircleLine({circle_pickers:7,ahead:Number(ahead),level:Number(level)},state,copy)).toBe(text);});
});
describe('integrated card states',()=>{
  it('no pick combines question, exact lock copy, digit circle count and action',()=>{mount(<YourPickCard state={{...state,my_player_id:null}} phase="upcoming" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-pick-question]')?.textContent).toBe("Who's your winner?");expect(document.querySelector('[data-pick-how]')?.textContent).toBe('Beat your circle. One pick before the first tee, 03:19 Thursday, scored the same way as ours.');expect(document.querySelector('[data-followed-picks]')?.textContent).toBe('6 of your circle have picked. Most picked: Ghim.');expect(screen.getByRole('button',{name:'Pick'})).toBeTruthy();});
  it('picked includes tee day and Change while circle line remains inside card',()=>{mount(<YourPickCard state={state} phase="upcoming" teeTime="2026-11-05T08:01:00Z" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-pick-question]')?.textContent).toBe("You're in. Now beat your circle.");expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Tees off 08:01 Thursday');expect(document.querySelector('[data-followed-picks]')?.closest('[data-your-pick-card]')).not.toBeNull();expect(screen.getByRole('button',{name:'Change'})).toBeTruthy();});
  it('live heading and sentence separate circle from our best; finished has no circle footer',()=>{const view=mount(<YourPickCard state={{...state,locked:true}} circleRank={{circle_pickers:7,ahead:2,level:0}} phase="live" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-pick-question]')?.textContent).toBe('Two of your circle are ahead of you');expect(document.querySelector('[data-pick-how]')?.textContent).toBe('Your pick is behind Ghim, our best pick so far.');view.rerender(<YourPickCard state={state} circleRank={{circle_pickers:0,ahead:0,level:0}} phase="completed" ourResults={ours} tourCode="pga" onPick={()=>{}}/>);expect(document.querySelector('[data-followed-picks]')).toBeNull();});
});
function Rank(){const q=useTournamentCircleRank('event',true);return <output>{q.data?.ahead}</output>;}
describe('circle rank read authority',()=>{
  it('reads the RPC and refetches on matching board success only',async()=>{mount(<Rank/>);await waitFor(()=>expect(f.rpc).toHaveBeenCalledTimes(1));expect(f.rpc).toHaveBeenCalledWith('get_tournament_circle_rank',{p_tournament_id:'event'});client.setQueryData(['tourhub','leaderboard','other'],[]);expect(f.rpc).toHaveBeenCalledTimes(1);client.setQueryData(['tourhub','leaderboard','event'],[]);await waitFor(()=>expect(f.rpc).toHaveBeenCalledTimes(2));});
  it('does not read for signed-out members',()=>{f.user=null;mount(<Rank/>);expect(f.rpc).not.toHaveBeenCalled();});
  it('does not read for anonymous members',()=>{f.user={id:'guest',is_anonymous:true};mount(<Rank/>);expect(f.rpc).not.toHaveBeenCalled();});
});