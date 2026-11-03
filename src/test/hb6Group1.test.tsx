import React, { useRef } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' }, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { id: 'member', type: 'personal', name: 'Ben', avatarUrl: null }, isLoading: false }) }));
vi.mock('@/hooks/useActorUnreadCounts', () => ({ useActorUnreadCounts: () => ({ countFor: () => 0 }) }));
vi.mock('@/hooks/useUserProfile', () => ({ useUserProfile: () => ({ data: { hide_handicap_chip: false }, isFetched: true, isError: false }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ connected: false, settled: true, connection: null, trend: null, anyError: false }) }));
vi.mock('@/lib/whs/hooks', () => ({ useHandicapHistory: () => ({ data: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => null }));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({ SearchOverlayV2: () => null }));
vi.mock('@/components/header/PostingAsMenu', () => ({ PostingAsMenu: () => null }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => false }));
import { ChromeIsland } from '@/features/chrome-v2/ChromeIsland';
import { resolveChrome, CHROME_REGISTRY } from '@/features/chrome-v2/registry';
import { useIslandBackName } from '@/features/chrome-v2/useIslandBackName';
import { useIslandBackNameValue } from '@/features/chrome-v2/islandBackNameStore';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';
import { ClubProfileHero } from '@/components/business/hero/ClubProfileHero';

const routes = ['/business/abc','/business/abc/followers','/business/abc/following','/profile/abc/followers','/profile/abc/following','/profile/quest','/profile/abc/edit','/handicap','/handicap/abc','/handicap/rivalry/abc','/handicap/abc/rivalry/def','/tour/news','/tour/news/story','/tourhub/other','/tour/other','/media','/friends-activity','/discover/news','/discover/news/story','/discover/explore/theme/links','/discover?main=videos&section=clips','/round/abc','/discover/other'];
let callback: IntersectionObserverCallback;
let scroller: HTMLDivElement;let off: () => void;
const original = window.IntersectionObserver;
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
function Probe() {const loc=useLocation();const name=useIslandBackNameValue();return <><output data-testid="route">{loc.pathname}</output><output data-testid="name">{name?.name??''}</output></>;}
const mount = (path: string, content?: React.ReactNode) => render(<QueryClientProvider client={client()}><MemoryRouter initialEntries={[path]}><ChromeIsland />{content}<Probe /></MemoryRouter></QueryClientProvider>);
function Heading({ business=false }: { business?: boolean }) {
 const ref=useRef<HTMLHeadingElement>(null);useIslandBackName(business?'Full business name':'Media',ref);
 return <ClubProfileHero name="Full business name" nameRef={ref} placeLine="" onShare={()=>{}} renderMore={node=>node} team={null} isFollowing={false} onFollowToggle={()=>{}} onBookTeeTime={()=>{}} onMessage={()=>{}} />;
}
const move=async(top:number)=>{scroller.scrollTop=top;await act(async()=>{fireEvent.scroll(scroller);await new Promise(r=>requestAnimationFrame(()=>r(null)));});};
beforeEach(()=>{resetToExpanded();scroller=document.createElement('div');scroller.id='root';document.body.append(scroller);off=registerNavScroller(scroller);window.IntersectionObserver=class{constructor(cb:IntersectionObserverCallback){callback=cb;}observe(){}disconnect(){}unobserve(){}} as unknown as typeof IntersectionObserver;});
afterEach(()=>{cleanup();off();scroller.remove();resetToExpanded();window.IntersectionObserver=original;vi.restoreAllMocks();});
describe('HB6 group1',()=>{
 it.each(routes)('%s uses fixed soft folding squircle islands',path=>{
  const [pathname,search]=path.split('?');const spec=resolveChrome(pathname,new URLSearchParams(search));
  expect(spec).toMatchObject({chrome:'island',tone:'dark',scrim:'soft',condense:true});expect(spec.scrollAway).toBeUndefined();
  mount(path);expect(document.querySelector('[data-chrome="island-scrim-soft"]')).not.toBeNull();
  const right=document.querySelector<HTMLElement>('[data-island-right]');expect(right?.style.borderRadius).toBe('16px');
  if(spec.left?.kind==='back')expect(screen.getByRole('button',{name:spec.left.title?`Back from ${spec.left.title}`:'Go back'})).toHaveAttribute('data-island-back');
  else expect(screen.getByRole('button',{name:'Go to home'})).toBeTruthy();
 });
 it('all registered island entries opt in while none entries stay none',()=>{for(const {spec} of CHROME_REGISTRY){if(spec.chrome==='island'){expect(spec.condense).toBe(true);expect(spec.scrim).toBe('soft');expect(spec.scrollAway).toBeUndefined();}else{expect(spec.condense).toBeUndefined();expect(spec.scrim).toBeUndefined();}}expect(resolveChrome('/auth',new URLSearchParams())).toEqual({chrome:'none',tone:'dark',bleed:false});});
 it.each([true])('actual business/media heading observes full name and clears on unmount business=%s',business=>{
  const view=mount(business?'/business/abc':'/media',<Heading business={business}/>);expect(screen.getByRole('button',{name:'Go back'})).toHaveAttribute('data-named','false');
  act(()=>callback([{isIntersecting:false,boundingClientRect:{bottom:50},rootBounds:{top:56}} as IntersectionObserverEntry],{} as IntersectionObserver));
  expect(screen.getByRole('button',{name:`Back from ${business?'Full business name':'Media'}`})).toHaveAttribute('data-named','true');view.unmount();
  render(<MemoryRouter><Probe /></MemoryRouter>);expect(screen.getByTestId('name').textContent).toBe('');
 });
 it('static Next round shows open without anchor and folds away',async()=>{mount('/handicap');const button=screen.getByRole('button',{name:'Back from Next round'});expect(button).toHaveAttribute('data-named','true');await move(150);expect(button).toHaveAttribute('data-named','false');await move(130);expect(button).toHaveAttribute('data-named','true');});
 it('business history back falls back to home on cold entry',()=>{vi.spyOn(window.history,'length','get').mockReturnValue(1);mount('/business/abc');fireEvent.click(screen.getByRole('button',{name:'Go back'}));expect(screen.getByTestId('route').textContent).toBe('/');});
});