import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { readFileSync } from 'node:fs';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const db = vi.hoisted(() => ({
  clubRows: [] as { thumbnail_image: string | null }[],
  reads: [] as string[],
  order: null as null | [string, boolean],
  hang: false,
}));

vi.mock('@/integrations/supabase/client', () => {
  const chainFor = (table: string): any => {
    const payload = () => (table === 'golf_courses' ? { data: db.clubRows, error: null } : { data: [], error: null });
    const self: any = new Proxy(function () {} as unknown as object, {
      get: (_t, prop) => {
        // db.hang leaves the read in flight forever, so isLoading stays true.
        if (prop === 'then') return (fn: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => (db.hang ? new Promise(() => {}) : Promise.resolve(payload()).then(fn, rej));
        if (prop === 'catch') return (fn: (e: unknown) => unknown) => (db.hang ? new Promise(() => {}) : Promise.resolve(payload()).catch(fn));
        if (prop === 'order') {
          return (col: string, cfg?: { ascending?: boolean }) => {
            if (table === 'golf_courses') db.order = [col, cfg?.ascending !== false];
            return self;
          };
        }
        return self;
      },
      apply: () => self,
    });
    return self;
  };
  const supabase: any = new Proxy(function () {} as unknown as object, {
    get: (_t, prop) => {
      if (prop === 'from') return (table: string) => { db.reads.push(table); return chainFor(table); };
      return supabase;
    },
    apply: () => supabase,
  });
  return { supabase };
});

const state = vi.hoisted(() => ({
  homeClub: null as { id: string; name: string; isPrimary: boolean } | null,
  topTen: [] as { position: number; thumbnail_image?: string | null }[],
}));

vi.mock('@/lib/whs/useDeclineHandicapChip', () => ({ useDeclineHandicapChip: () => vi.fn() }));
vi.mock('@/lib/whs/hooks', () => ({
  useWhsConnection: () => ({ data: null, isFetched: true, isError: false }),
  useHandicapTrend: () => ({ data: null, isFetched: true, isError: false }),
  useHandicapHistory: () => ({ data: null, isFetched: true, isError: false }),
}));
vi.mock('@/hooks/useHandicapTrend12mo', () => ({ useHandicapTrend12mo: () => ({ delta: null, direction: 'flat' }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ linked: false, connected: false, settled: true, connection: null, trend: null, anyError: false }) }));
vi.mock('@/lib/whs/usePercentile', () => ({ useHandicapPercentile: () => ({ data: null }) }));
vi.mock('@/components/profile/rounds/useProfileRounds', () => ({
  useProfileRounds: () => ({ isSuccess: true, data: [] }),
  useHandicapIndex: () => null,
  isFullEighteen: () => true,
}));
vi.mock('@/hooks/gam/useProfileAchievementFigures', () => ({ useProfileAchievementFigures: () => ({ isFetched: true, data: null }) }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({
  useProfileClubs: () => ({ homeClub: state.homeClub, secondaryClubs: [], isPrivate: false, isLoading: false }),
}));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: state.topTen, isLoading: false }) }));
vi.mock('@/features/amateur-ranking/useAmateurRanking', () => ({
  useAmateurSummary: () => ({ data: null, isSuccess: true }),
  useAmateurHistory: () => ({ data: [], isSuccess: true }),
  useAmateurEvents: () => ({ data: [], isSuccess: true }),
  useAmateurCareer: () => ({ data: [], isSuccess: true }),
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: vi.fn() }));


vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: (p: {isOpen:boolean;targetSecondaryId:string;initialCommentId:string}) => p.isOpen ? <div role="dialog" data-comment={p.initialCommentId} data-course={p.targetSecondaryId}/> : null }));
vi.mock('@/components/profile/hooks/useTopTenVisibility', () => ({ useTopTenVisibility: () => ({canView:true,visibility:'public',isLoading:false}) }));
vi.mock('@/hooks/useSupabaseSession', () => ({useSupabaseSession:()=>({user:null})}));
import { ProfileHero } from '@/components/profile/hero/ProfileHero';
import { ProfileTopTenRail } from '@/components/profile/hero/ProfileTopTenRail';
import { HeroHandicapDisplay } from '@/components/profile/hero/HeroHandicapDisplay';
import { indexLine } from '@/components/profile/hero/indexLine';
import { shortCoursePart } from '@/lib/courseMedia/memberShotPosts';
import { FALLBACK_COVER_GRADIENT } from '@/components/profile/hero/FallbackCover';
import { ClubProfileHero } from '@/components/business/hero/ClubProfileHero';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { FormBar } from '@/features/profile-sheet-v2/sheetState';
const TODAY=Date.parse('2026-11-16T00:00:00Z');
const series=[{value:20,observed_at:'2026-08-18'},{value:10,observed_at:'2026-11-06'},{value:15,observed_at:'2026-11-16'}];
const bars:FormBar[]=[{id:'old',date:'2026-08-01',value:3,movement:1},{id:'middle',date:'2026-11-01',value:-2,movement:-.2},{id:'new',date:'2026-11-12',value:1,movement:.1}];
const english=createInstance();void english.init({lng:'en'});
const byId=new Map([['old',{gross_score:90,course_name:'Old Golf Club'}],['middle',{gross_score:78,course_name:'Royal County Down Golf Club (Championship)'}],['new',{gross_score:81,course_name:'Sundridge Park Golf Club (East)'}]]);
function display(over:Partial<React.ComponentProps<typeof HeroHandicapDisplay>>={}) {
 return render(<HeroHandicapDisplay t={english.getFixedT('en','profile')} shownIndex={15} deltaLines={[]} slot={null} verdict={null} series={series} chartColor="currentColor" chartFillTop={.16} axisWindow="90 days" windowDays={90} bars={bars} byId={byId} countingKnown={false} countingN={0} loweredN={1} tilesWord="three" isSelf onStatTap={()=>{}} tap={()=>()=>{}} {...over}/>);
}
beforeEach(()=>{vi.spyOn(Date,'now').mockReturnValue(TODAY);db.hang=false;db.clubRows=[];state.homeClub=null;state.topTen=[];vi.mocked(analyticsEvents.track).mockClear();});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe('profile rail follow-up',()=>{
 it('time-scaled points preserve 80-day and 10-day proportions',()=>{
  const line=indexLine(series,TODAY);
  expect(line?.coords).toHaveLength(3);
  [0,361*80/90,361].forEach((x,i)=>expect(line?.coords[i]?.x).toBeCloseTo(x,6));
 });
 it('at interpolates between neighbouring points',()=>{
  const line=indexLine(series,TODAY);
  expect(line?.at('2026-11-11')?.x).toBeCloseTo(361*85/90);
  expect(line?.at('2026-11-11')?.y).toBeCloseTo(39.5);
 });
 it('each in-window round has an HTML marker at its interpolated position and lowering state',()=>{
  const {container}=display();const line=indexLine(series,TODAY);
  expect(container.querySelectorAll('[data-form-round-dot]')).toHaveLength(2);
  for(const bar of bars.slice(1)){
   const marker=container.querySelector<HTMLElement>(`[data-form-round-dot="${bar.id}"]`),point=line?.at(bar.date);
   expect(marker?.tagName).toBe('SPAN');expect(marker?.getAttribute('data-lowered')).toBe(String(bar.movement<0));
   expect(parseFloat(marker?.style.left??'')).toBeCloseTo((point?.x??0)/361*100);
   expect(parseFloat(marker?.style.top??'')).toBeCloseTo(point?.y??0);
  }
  expect(container.querySelector('svg circle')).toBeNull();
 });
 it('out-of-window round stays on the rail without a chart marker',()=>{
  const {container}=display();expect(container.querySelector('[data-form-round="old"]')).not.toBeNull();expect(container.querySelector('[data-form-round-dot="old"]')).toBeNull();
 });
 it('rail reverses oldest-first data and uses canonical short course names',()=>{
  const {container}=display();expect([...container.querySelectorAll('[data-form-round]')].map(e=>e.getAttribute('data-form-round'))).toEqual(['new','middle','old']);
  expect(container.querySelector('[data-form-round="middle"] .profile-form-course')?.textContent).toBe('Royal County Down (Championship)');
  expect(container.querySelector('[data-form-round="middle"] .profile-form-course')?.textContent).toBe(shortCoursePart('Royal County Down Golf Club (Championship)'));
 });
 it('the first form tile stacks top row, course and date in DOM order',()=>{
  const {container}=display();const tile=container.querySelector('[data-form-round]') as HTMLElement;
  expect([...tile.children].map(e=>e.className)).toEqual(['profile-form-top','profile-form-course','profile-form-date']);
  expect(tile.querySelector('.profile-form-course')?.textContent).toBe(shortCoursePart(tile.querySelector('.profile-form-course')?.textContent??''));
  expect(tile.querySelector('.profile-form-course')?.textContent).not.toBe('');
 });
 it('dates include a year only outside the current year',()=>{
  const {container}=display({bars:[{...bars[2],date:'2025-11-12'}]});
  expect(container.querySelector('.profile-form-date')?.textContent).toBe('12 Nov 2025');
  cleanup();const current=display();expect(current.container.querySelector('[data-form-round="new"] .profile-form-date')?.textContent).toBe('12 Nov');
 });
 it('rail tap tracks newest-first position and opens that round',()=>{
  const open=vi.fn();const {container}=display({onOpenRound:open});const button=container.querySelector('[data-form-round="middle"]');
  if(!button)throw new Error('Missing round');fireEvent.click(button);
  expect(analyticsEvents.track).toHaveBeenCalledWith('profile_form_tile_tap',{whs_score_id:'middle',position:2});expect(open).toHaveBeenCalledWith('middle');
 });
 it('end-point round marker is below the existing end marker',()=>{
  const {container}=display({bars:[{...bars[2],date:'2026-11-16'}]});const marker=container.querySelector('[data-form-round-dot="new"]');
  expect(marker?.parentElement?.lastElementChild).not.toBe(marker);expect(marker?.parentElement?.lastElementChild?.tagName).toBe('SPAN');
 });
 it('comment deep link still opens the course sheet with no reaction strip',async()=>{
  state.topTen=[1,2,3].map(position=>({id:'t'+position,course_id:'c'+position,position,name:'Course '+position,rating:8}));
  function Entry(){const [params]=useSearchParams();return <ProfileTopTenRail userId="u1" isOwnProfile={false} initialCourseId={params.get('course')} initialCommentId={params.get('top_ten_comment')}/>;}
  const {container}=render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/profile/member?tab=courses&course=c1&top_ten_comment=comment1']}><Entry/></MemoryRouter></QueryClientProvider>);
  await waitFor(()=>expect(container.querySelector('[role="dialog"]')).toHaveAttribute('data-comment','comment1'));
  expect(container.querySelector('[role="dialog"]')).toHaveAttribute('data-course','c1');
  expect(container.querySelector('[data-top-ten-reactions]')).toBeNull();
  const page=readFileSync('src/pages/ProfilePageV2.tsx','utf8');expect(page).toContain('initialCommentId={deepLinkTopTen.current?.commentId ?? null}');
 });
 it.each([true,false])('retired counter actions absent on own=%s',isSelf=>{
  const stat=vi.fn();const {container}=render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><ProfileHero userId="u1" displayName="Member" isSelf={isSelf} indexValue={null} onStatTap={stat}/></MemoryRouter></QueryClientProvider>);
  container.querySelectorAll('button').forEach(b=>fireEvent.click(b));expect(stat.mock.calls.flat()).not.toEqual(expect.arrayContaining(['rounds','courses','rated']));
  expect(readFileSync('src/components/profile/hero/ProfileHero.tsx','utf8')).not.toContain('CounterCell');
 });
 it.each(['member','business'])('%s no-photo cover uses the gradient token without SVG',kind=>{
  const {container}=kind==='member'?render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><ProfileHero userId="u1" displayName="Member" isSelf indexValue={null} hideConnectPrompt onStatTap={()=>{}}/></MemoryRouter></QueryClientProvider>):render(<ClubProfileHero name="Club" placeLine="Kent" coverUrl={null} onShare={()=>{}} renderMore={t=>t} team={null} isFollowing={false} onFollowToggle={()=>{}} onBookTeeTime={()=>{}} onMessage={()=>{}}/>);
  const cover=container.querySelector<HTMLElement>('[data-fallback-cover]');expect(cover).not.toBeNull();expect(cover?.querySelector('svg')).toBeNull();
  expect(FALLBACK_COVER_GRADIENT).toBe('var(--profile-fallback-cover-gradient)');
  expect(readFileSync('src/styles/style-tokens.css','utf8')).toContain('--profile-fallback-cover-gradient: linear-gradient(180deg, #1C2A22 0%, #131B16 58%, #0A0A0C 100%)');
 });
});
