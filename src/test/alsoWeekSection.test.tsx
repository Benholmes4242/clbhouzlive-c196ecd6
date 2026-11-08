import { afterEach,describe,it,expect,vi } from 'vitest';
import { render,cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider,initReactI18next } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import en from '../../public/locales/en/tourhub.json';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
const fixtures=vi.hoisted(()=>({slides:[] as HeroSlide[],viewing:'viewed',guest:true,follows:new Set<string>()}));
vi.mock('@/features/tourhub/hooks/useHeroCarouselData',()=>({useHeroCarouselData:()=>({data:fixtures.slides})}));
vi.mock('@/features/tourhub/context/TourSelectionContext',()=>({useTourSelection:()=>({viewingTournamentId:fixtures.viewing})}));
vi.mock('@/features/tourhub/overview/sections/useAlsoWeekData',()=>({useAlsoWeekData:()=>({data:{boards:new Map(),draws:new Map()},isError:false})}));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows',()=>({useTourPlayerFollows:()=>({ids:fixtures.guest?new Set():fixtures.follows})}));
import { AlsoThisWeek } from '@/features/tourhub/overview/sections/AlsoThisWeek';
const i18n=createInstance();i18n.use(initReactI18next).init({lng:'en',resources:{en:{tourhub:en}},initAsync:false});
afterEach(()=>{cleanup();vi.useRealTimers();fixtures.slides=[];fixtures.guest=true;fixtures.follows.clear();});
function slide(id:string,type:HeroSlide['type']='live'):HeroSlide {return {type,tournament:{id,name:id,status:type==='live'?'inprogress':'closed',startDate:'2026-10-29',endDate:'2026-11-01',currentRound:3,tourSlug:'pga',tourName:'PGA Tour'} as HeroSlide['tournament']};}
function open(){vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));const qc=new QueryClient({defaultOptions:{queries:{retry:false}}});return render(<QueryClientProvider client={qc}><MemoryRouter><I18nextProvider i18n={i18n}><AlsoThisWeek/></I18nextProvider></MemoryRouter></QueryClientProvider>);}
describe('weekly section membership and heading',()=>{
  it('two live events count as two live in the section head',()=>{fixtures.slides=[slide('a'),slide('b'),slide('c','completed')];const v=open();expect(v.container.querySelector('.also-week-meta')?.textContent).toBe('2 live');expect(v.container.querySelectorAll('.also-event')).toHaveLength(3);});
  it('no live events hide the count',()=>{fixtures.slides=[slide('c','completed')];const v=open();expect(v.container.querySelector('.also-week-meta')).toBeNull();expect(v.container.querySelectorAll('.also-event')).toHaveLength(1);});
  it('viewed event is excluded from rows and live count',()=>{fixtures.slides=[slide('viewed'),slide('a')];const v=open();expect(v.container.querySelector('.also-week-meta')?.textContent).toBe('1 live');expect([...v.container.querySelectorAll('.also-title')].map(e=>e.textContent)).toEqual(['a']);});
  it('carousel order and four-event cap remain unchanged',()=>{fixtures.slides=['d','b','a','e','f'].map(id=>slide(id));const v=open();expect([...v.container.querySelectorAll('.also-title')].map(e=>e.textContent)).toEqual(['d','b','a','e']);expect(v.container.querySelector('.also-week-meta')?.textContent).toBe('4 live');});
  it('empty section renders nothing',()=>{const v=open();expect(v.container.querySelector('section')).toBeNull();});
  it('next-week upcoming event stays excluded',()=>{const s=slide('future','upcoming');s.tournament.startDate='2026-11-05';fixtures.slides=[s];const v=open();expect(v.container.querySelector('section')).toBeNull();});
});