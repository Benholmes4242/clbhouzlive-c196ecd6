/** Signed-off rebuild replaces the four frozen cinematic-band tests by name. */
import {afterEach,describe,it,expect,vi} from 'vitest';
import {cleanup,render,fireEvent} from '@testing-library/react';
import {HeroSection} from '@/features/tourhub/player-v2/sections/HeroSection';
import type {TourPlayer} from '@/features/tourhub/hooks/useTourHubData';
import type {PlayerHeader,PlayerResult} from '@/features/tourhub/player-v2/data/usePlayerData';
vi.mock('react-i18next',()=>({initReactI18next:{type:'3rdParty',init:()=>{}},useTranslation:()=>({t:(_k:string,o?:{defaultValue?:string})=>o?.defaultValue??''})}));
vi.mock('@/features/tourhub/components/PlayerAvatar',()=>({PlayerAvatar:()=> <div data-avatar/>}));
afterEach(cleanup);
const player={id:'p1',full_name:'Rory McIlroy',country:null,college:null,photo_url:null,tour_codes:['pga']} as TourPlayer;
const header={season_year:2026,main_tour:'pga',world_rank:1} as PlayerHeader;
const rows=Array.from({length:3},(_,i)=>({tournament_id:`t${i}`,name:'Event',end_date:'2026-08-01',display_position:i===0?'1':'T4',is_winner:i===0,beat_percent:90})) as PlayerResult[];
const props=()=>({player,header,results:rows,tour:'pga',race:3,following:false,busy:false,onFollow:vi.fn(),onPick:vi.fn()});
describe('signed-off tour player hero',()=>{
 it('selects four recorded season figures for a ranked winner',()=>{const {container}=render(<HeroSection {...props()}/>);expect([...container.querySelectorAll('[data-player-figure]')].map(n=>n.getAttribute('data-player-figure'))).toEqual(['world','points','wins','top10']);expect(container.querySelector('[data-player-figure=wins] b')?.textContent).toBe('1');});
 it('renders only starts best and top10 for a one-start player',()=>{const {container}=render(<HeroSection {...props()} results={rows.slice(0,1)}/>);expect([...container.querySelectorAll('[data-player-figure]')].map(n=>n.getAttribute('data-player-figure'))).toEqual(['starts','best','top10']);});
 it('follow action remains explicit and does not run on mount',()=>{const p=props(),{container}=render(<HeroSection {...p}/>);expect(p.onFollow).not.toHaveBeenCalled();const button=container.querySelector('button');if(!button)throw Error('Missing follow');fireEvent.click(button);expect(p.onFollow).toHaveBeenCalledTimes(1);});
 it('next-start pick action opens only on an explicit tap',()=>{const p=props(),{container}=render(<HeroSection {...p} header={{...header,next_tournament_id:'next',next_name:'Event'}}/>);expect(p.onPick).not.toHaveBeenCalled();const button=container.querySelector('[data-next-start] button');if(!button)throw Error('Missing pick');fireEvent.click(button);expect(p.onPick).toHaveBeenCalledTimes(1);expect(container.querySelector('[data-next-start]')).not.toBeNull();});
});
