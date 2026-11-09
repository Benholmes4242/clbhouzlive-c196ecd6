import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import type { StandoutFeat } from '@/features/explore-magazine/watch/useStandoutFeats';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';

const h = vi.hoisted(() => ({
  geography: { county:'Kent' as string | null, nation:'England' as string | null, country:'Scotland' },
  scopeFetched:true, error:false, pending:false,
  pools: {} as Record<string, { rounds:unknown[]; feats:unknown[] }>,
  shapes:new Map<string, unknown>(), holes:vi.fn(), rounds:vi.fn(), roundOptions:vi.fn(), feats:vi.fn(), rpc:vi.fn(),
  profile: { primary_club_id:'club' as string | null, country:'Scotland' },
  clubCourses: [] as unknown[], played: [] as unknown[], mostPlayed: {} as unknown,
}));
vi.mock('@/features/explore-magazine/useViewerScoreScope', () => ({ useViewerScoreScope: () => ({ scope:h.geography, isFetched:h.scopeFetched, unresolved:false }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useStandoutRounds', async original => ({
  ...await original<typeof import('@/components/explore-tab-new/courseled/hooks/useStandoutRounds')>(),
  useStandoutRounds: (viewer: string, filters: { regionValue:string | null }, enabled: boolean, limit:number, options?: { keepPrevious?: boolean }) => {
    h.rounds(viewer, filters, enabled, limit);
    h.roundOptions(options);
    return { data:h.pools[filters.regionValue ?? 'everyone']?.rounds ?? [], isFetched:!h.pending, isError:h.error };
  },
}));
vi.mock('@/features/explore-magazine/watch/useStandoutFeats', async original => ({
  ...await original<typeof import('@/features/explore-magazine/watch/useStandoutFeats')>(),
  useStandoutFeats: (viewer:string, kind:string | null, value:string | null, enabled:boolean) => {
    h.feats(viewer, kind, value, enabled);
    return { data:h.pools[value ?? 'everyone']?.feats ?? [], isFetched:!h.pending, isError:h.error };
  },
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({ useRoundHoleShapes: (ids:unknown[]) => { h.holes(ids); return h.shapes; } }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: ({ size }: { size:number }) => <span data-avatar-size={size} /> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc:h.rpc,
  from:(table:string) => {
    let id:string | null = null;
    const result = () => ({ error:null, data:table === 'user_profiles' ? h.profile : table === 'gam_round_stats' ? h.played : id === 'club' ? h.clubCourses : h.mostPlayed });
    const chain: any = { select:() => chain, eq:(_key:string, value:string) => { if (_key === 'club_id' || _key === 'id') id = value; return chain; }, not:() => chain, order:() => Promise.resolve(result()), maybeSingle:() => Promise.resolve(result()), then:(resolve: (value:unknown) => unknown) => Promise.resolve(result()).then(resolve) };
    return chain;
  },
} }));

import { StandoutRoundsShelf } from '@/features/explore-magazine/watch/StandoutRoundsShelf';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { standoutRpcArgs } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import { featHeadlineParts, featRarity, interleaveStandouts, shortStandoutDate } from '@/features/explore-magazine/watch/standoutShelfRules';
import { mapStandoutFeat } from '@/features/explore-magazine/watch/useStandoutFeats';

const i18n = createInstance();
void i18n.init({ lng:'en', initAsync:false, interpolation:{ escapeValue:false }, resources:{ en:{ courses:{} } } });
const round = (id:string, extra:Partial<StandoutRound> = {}): StandoutRound => ({
  pos:1, user_id:`u-${id}`, display_name:`Player ${id}`, profile_photo_url:null, whs_score_id:id,
  play_date:'2026-10-31', course_id:'course', course_name:'The Addington', gross_score:75,
  course_par:72, net_score:71, course_handicap:4, is_competition:false,
  prior_n:10, avg_topar:3, best_topar:0, last_better:null, delta:-4, ...extra,
});
const feat = (id:string, extra:Partial<StandoutFeat> = {}): StandoutFeat => ({
  feat_kind:'eagle', events_window:2, denominator_unit:'holes', year_events:10, year_denominator:5700,
  viewer_year_events:1, hole_no:4, hole_par:5, hole_strokes:3,
  latest_user_id:`u-${id}`, latest_display_name:`Player ${id}`, latest_photo_url:null,
  latest_score_id:id, latest_course_id:'course', latest_course_name:'The Addington', latest_play_date:'2026-10-28', ...extra,
});
const shape: HoleShape = { coursePar:72, series:[], beads:[], played:18, birdies:1,
  holes:Array.from({ length:18 }, (_, i) => ({ holeNo:i+1, par:5, strokes:i === 3 ? 3 : 5, sheetStrokes:5 })) };
const rounds = (count:number, prefix:string) => Array.from({ length:count }, (_, i) => round(`${prefix}${i}`));
function Wrapper({ children }: { children:React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions:{ queries:{ retry:false } } })}><I18nextProvider i18n={i18n}>{children}</I18nextProvider></QueryClientProvider>;
}
const mount = (props:Partial<React.ComponentProps<typeof StandoutRoundsShelf>> = {}) => render(<Wrapper><StandoutRoundsShelf userId="me" {...props} /></Wrapper>);
const selected = (label:string) => expect(screen.getByRole('button', { name:label })).toHaveAttribute('aria-pressed', 'true');
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); h.error=false; h.pending=false; h.scopeFetched=true;
  h.geography={ county:'Kent', nation:'England', country:'Scotland' };
  h.pools={ Kent:{ rounds:rounds(4,'k'), feats:[] }, England:{ rounds:rounds(4,'n'), feats:[] }, everyone:{ rounds:rounds(4,'w'), feats:[] } };
  h.shapes=new Map(); h.rpc.mockResolvedValue({ data:[], error:null });
  h.profile={ primary_club_id:'club', country:'Scotland' }; h.clubCourses=[]; h.played=[]; h.mostPlayed={};
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe('SAR1 scope ladder and retention', () => {
  it('holds previous query data only by opt-in and keeps shelf tiles during a chip change', async () => {
    const actual = await vi.importActual<typeof import('@/components/explore-tab-new/courseled/hooks/useStandoutRounds')>('@/components/explore-tab-new/courseled/hooks/useStandoutRounds');
    const client = new QueryClient({ defaultOptions:{ queries:{ retry:false } } });
    const QueryWrapper = ({ children }: { children:React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    h.rpc.mockResolvedValue({ data:[round('old')], error:null });
    const query = renderHook(({ region }) => ({
      defaultRead:actual.useStandoutRounds('me', { ...DEFAULT_FILTERS, regionKind:'region', regionValue:region }),
      shelfRead:actual.useStandoutRounds('me', { ...DEFAULT_FILTERS, regionKind:'region', regionValue:region }, true, 10, { keepPrevious:true }),
    }), { wrapper:QueryWrapper, initialProps:{ region:'Kent' } });
    await waitFor(() => {
      expect(query.result.current.defaultRead.isSuccess).toBe(true);
      expect(query.result.current.shelfRead.isSuccess).toBe(true);
    });
    h.rpc.mockImplementation(() => new Promise(() => {}));
    query.rerender({ region:'Fife' });
    expect(query.result.current.defaultRead.data).toBeUndefined();
    expect(query.result.current.defaultRead.isPending).toBe(true);
    expect(query.result.current.defaultRead.isPlaceholderData).toBe(false);
    expect(query.result.current.shelfRead.data?.map(row => row.whs_score_id)).toEqual(['old']);
    expect(query.result.current.shelfRead.isPlaceholderData).toBe(true);
    query.unmount();
    client.clear();

    const shelf = mount();
    expect(h.roundOptions).toHaveBeenCalledTimes(3);
    expect(h.roundOptions.mock.calls.map(([options]) => options)).toEqual([{ keepPrevious:true }, { keepPrevious:true }, { keepPrevious:true }]);
    const tiles = [...shelf.container.querySelectorAll('[data-standout-tile]')];
    expect(tiles).toHaveLength(4);
    h.pending=true;
    h.pools.England={ rounds:[], feats:[] };
    fireEvent.click(screen.getByRole('button', { name:'England' }));
    expect([...shelf.container.querySelectorAll('[data-standout-tile]')]).toEqual(tiles);
    expect(shelf.container.querySelector('[data-score-id="k0"]')).toBeInTheDocument();
  });
  it('defaults to county with at least four rounds', () => { mount(); selected('Kent'); });
  it('county with three rounds falls to nation', () => { h.pools.Kent.rounds=rounds(3,'k'); mount(); selected('England'); });
  it('both narrow scopes under four default to Everyone even with feats', () => {
    h.pools.Kent={ rounds:rounds(3,'k'), feats:[feat('f')] }; h.pools.England.rounds=rounds(3,'n'); mount(); selected('Everyone');
  });
  it('hides scopes with no rounds and no feats', () => { h.pools.Kent={ rounds:[], feats:[] }; mount(); expect(screen.queryByRole('button', { name:'Kent' })).toBeNull(); });
  it('keeps a scope with feats but no rounds', () => { h.pools.Kent={ rounds:[], feats:[feat('f')] }; mount(); expect(screen.getByRole('button', { name:'Kent' })).toBeInTheDocument(); selected('England'); });
  it('hides a single remaining scope row', () => { h.geography={ county:null, nation:null, country:'Scotland' }; const { container }=mount(); expect(container.querySelector('[data-standout-scopes]')).toBeNull(); });
  it('remembers a tap per viewer and overrides the ladder', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name:'England' })); selected('England'); expect(localStorage.getItem('standout-scope:me')).toBe('nation');
  });
  it('restores a nonempty remembered scope', () => { localStorage.setItem('standout-scope:me','nation'); mount(); selected('England'); });
  it('an empty remembered scope falls back to default', () => { localStorage.setItem('standout-scope:me','nation'); h.pools.England={ rounds:[], feats:[] }; mount(); selected('Kent'); });
  it('a missing remembered scope falls back to default', () => { localStorage.setItem('standout-scope:me','retired'); mount(); selected('Kent'); });
  it('storage exceptions do not prevent selection', () => { vi.spyOn(Storage.prototype,'getItem').mockImplementation(() => { throw new Error('blocked'); }); vi.spyOn(Storage.prototype,'setItem').mockImplementation(() => { throw new Error('blocked'); }); mount(); fireEvent.click(screen.getByRole('button',{ name:'England' })); selected('England'); });
  it('scope taps do not carry to a different viewer', () => { const view=mount(); fireEvent.click(screen.getByRole('button',{ name:'England' })); view.rerender(<Wrapper><StandoutRoundsShelf userId="other" /></Wrapper>); selected('Kent'); });
  it('keeps previous tiles while a tapped scope loads', () => {
    const view=mount(); h.pending=true; h.pools.England={ rounds:[], feats:[] }; fireEvent.click(screen.getByRole('button',{ name:'England' }));
    view.rerender(<Wrapper><StandoutRoundsShelf userId="me" /></Wrapper>); expect(screen.getByText('Player k0')).toBeInTheDocument();
  });
  it('calls county nation and world reads with the specified filters and limit', () => {
    mount(); expect(h.rounds).toHaveBeenCalledWith('me', { ...DEFAULT_FILTERS,regionKind:'region',regionValue:'Kent' },true,10);
    expect(h.rounds).toHaveBeenCalledWith('me', { ...DEFAULT_FILTERS,regionKind:'sub_country',regionValue:'England' },true,10);
    expect(h.rounds).toHaveBeenCalledWith('me',DEFAULT_FILTERS,true,10);
    expect(h.feats).toHaveBeenCalledWith('me','region','Kent',true);
  });
});
describe('SAR1 rail and scorecard doors', () => {
  it('interleaves R F R F R R without changing RPC order', () => {
    expect(interleaveStandouts(rounds(4,'r'),[feat('f1'),feat('f2')]).map(tile => tile.kind)).toEqual(['round','feat','round','feat','round','round']);
  });
  it('remaining feats follow when rounds run out', () => { expect(interleaveStandouts([round('r')],[feat('f1'),feat('f2')]).map(tile => tile.kind)).toEqual(['round','feat','feat']); });
  it('round tile reuses sentence parts, eighteen holes and net/gross with competition/date', () => {
    h.pools.Kent.rounds=[round('r',{ is_competition:true })]; localStorage.setItem('standout-scope:me','county'); h.shapes.set('r',shape);
    const { container }=mount(); const card=container.querySelector('[data-standout-tile="round"]'); expect(card).not.toBeNull(); if (!card) return;
    expect(within(card as HTMLElement).getByText('Best ever at The Addington')).toBeInTheDocument();
    expect(card.querySelectorAll('[data-hole-mark]')).toHaveLength(18); expect(card.querySelector('[data-kind="net"]')).toHaveTextContent('NET71−1');
    expect(card.querySelector('[data-kind="gross"]')).toHaveTextContent('GROSS75+3'); expect(card.querySelector('.standout-comp')).toHaveTextContent('COMP'); expect(card.querySelector('.standout-when')).toHaveTextContent('Oct 31');
  });
  it('noncompetition round retains date but no COMP tag', () => { const { container }=mount(); expect(container.querySelector('.standout-comp')).toBeNull(); expect(container.querySelector('.standout-when')).toHaveTextContent('Oct 31'); });
  it('unknown hole shapes draw no marks and invent no holes', () => { const { container }=mount(); expect(container.querySelector('[data-standout-strip]')).toBeNull(); expect(container.querySelectorAll('[data-hole-mark]')).toHaveLength(0); });
  it('a viewer without a handicap opens any round scorecard directly', () => { const open=vi.fn(); const { container }=mount({ onOpenRound:open }); const card=container.querySelector('[data-score-id="k0"]'); if (!card) throw new Error('round missing'); fireEvent.click(card); expect(open).toHaveBeenCalledWith('k0','u-k0'); });
  it('feat tile opens its latest scorecard directly', () => { h.pools.Kent.feats=[feat('f')]; const open=vi.fn(); const { container }=mount({ onOpenRound:open }); const card=container.querySelector('[data-score-id="f"]'); if (!card) throw new Error('feat missing'); fireEvent.click(card); expect(open).toHaveBeenCalledWith('f','u-f'); });
  it('member name taps open member without opening scorecard', () => { const open=vi.fn(); const member=vi.fn(); mount({ onOpenRound:open,onOpenMember:member }); fireEvent.click(screen.getByRole('button',{ name:'Player k0' })); expect(member).toHaveBeenCalledWith('u-k0'); expect(open).not.toHaveBeenCalled(); });
  it('batches round and feat score ids in one hole-shapes hook call', () => { h.pools.Kent.feats=[feat('f')]; mount(); expect(h.holes).toHaveBeenCalledTimes(1); expect(h.holes).toHaveBeenCalledWith(['k0','k1','k2','k3','f']); });
});
describe('SAR1 feats and states', () => {
  it('eagle headline uses strokes par and English ordinal', () => { h.pools.Kent.feats=[feat('f')]; mount(); expect(screen.getByText('3 on the par-5 4th at The Addington')).toBeInTheDocument(); });
  it('ace headline uses its hole', () => { h.pools.Kent.feats=[feat('f',{ feat_kind:'ace',hole_no:11 })]; mount(); expect(screen.getByText('Hole in one on the 11th at The Addington')).toBeInTheDocument(); });
  it('missing hole uses the feat course fallback', () => { expect(featHeadlineParts(feat('f',{ hole_no:null })).defaultValue).toBe('Eagle at {{course}}'); expect(featHeadlineParts(feat('f',{ feat_kind:'albatross',hole_no:null })).defaultValue).toBe('Albatross at {{course}}'); expect(featHeadlineParts(feat('f',{ feat_kind:'ace',hole_no:null })).defaultValue).toBe('Hole in one at {{course}}'); });
  it('clean card headline and strip raise no hole', () => { h.pools.Kent.feats=[feat('f',{ feat_kind:'clean_card' })]; h.shapes.set('f',shape); const { container }=mount(); expect(screen.getByText('Not one bogey at The Addington')).toBeInTheDocument(); expect(container.querySelector('[data-raised="true"]')).toBeNull(); });
  it('feat hole alone is raised and rarity is rounded using server unit', () => { h.pools.Kent.feats=[feat('f',{ year_denominator:5704 })]; h.shapes.set('f',shape); const { container }=mount(); expect(container.querySelectorAll('[data-raised="true"]')).toHaveLength(1); expect(container.querySelector('[data-raised="true"]')).toHaveAttribute('data-hole-mark','4'); expect(screen.getByText('Oct 28 · 1 in 570 holes')).toBeInTheDocument(); });
  it('clean card uses rounds rarity and own positive count', () => { h.pools.Kent.feats=[feat('f',{ feat_kind:'clean_card', denominator_unit:'rounds',year_denominator:2530 })]; mount(); expect(screen.getByText('Oct 28 · 1 in 253 rounds')).toBeInTheDocument(); expect(screen.getByText('You have 1 this year')).toHaveClass('standout-you'); });
  it('zero or null year events show only date and zero own count is absent', () => { expect(featRarity(feat('f',{ year_events:0 }))).toBeNull(); expect(featRarity(feat('f',{ year_events:null }))).toBeNull(); h.pools.Kent.feats=[feat('f',{ year_events:0,viewer_year_events:0 })]; const { container }=mount(); expect(container.querySelector('.standout-rarity')).toHaveTextContent('Oct 28'); expect(container.querySelector('.standout-you')).toBeNull(); });
  it('adds a date year only outside the current year', () => { expect(shortStandoutDate('2026-10-31','en',new Date('2026-11-05'))).toBe('Oct 31'); expect(shortStandoutDate('2025-10-31','en',new Date('2026-11-05'))).toBe('Oct 31, 2025'); });
  it('loading reserves two shelf cards', () => { h.pending=true; const { container }=mount(); expect(container.querySelector('[data-standout-shelf="loading"]')).toBeInTheDocument(); expect(container.querySelectorAll('.standout-card')).toHaveLength(2); });
  it('empty Everyone and all scopes render nothing', () => { Object.values(h.pools).forEach(pool => { pool.rounds=[]; pool.feats=[]; }); const { container }=mount(); expect(container).toBeEmptyDOMElement(); });
  it('read errors hide the shelf even with stale rows', () => { h.error=true; vi.spyOn(console,'warn').mockImplementation(() => {}); const { container }=mount(); expect(container).toBeEmptyDOMElement(); });
  it('no userId renders nothing and disables every scope read', () => { const { container }=mount({ userId:undefined }); expect(container).toBeEmptyDOMElement(); expect(h.rounds.mock.calls.every(call => call[2] === false)).toBe(true); expect(h.feats.mock.calls.every(call => call[3] === false)).toBe(true); });
});
describe('SAR1 RPC and geography contracts', () => {
  it('default limit remains four and explicit shelf limit is ten', () => { expect(standoutRpcArgs('me',DEFAULT_FILTERS).p_limit).toBe(4); expect(standoutRpcArgs('me',DEFAULT_FILTERS,10).p_limit).toBe(10); });
  it('feat mapper converts numeric RPC values and preserves server order', () => { const row=mapStandoutFeat({ ...feat('f'),year_events:'10',viewer_year_events:'2',hole_no:'4' } as unknown as StandoutFeat); expect(row.year_events).toBe(10); expect(row.viewer_year_events).toBe(2); expect(row.hole_no).toBe(4); });
  it('new feat hook sends only viewer and geographic axes', async () => {
    const actual=await vi.importActual<typeof import('@/features/explore-magazine/watch/useStandoutFeats')>('@/features/explore-magazine/watch/useStandoutFeats');
    h.rpc.mockResolvedValue({ data:[feat('f2'),feat('f1')],error:null });
    const { result }=renderHook(() => actual.useStandoutFeats('me','region','Kent'),{ wrapper:Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true)); expect(h.rpc).toHaveBeenCalledWith('get_standout_feats',{ p_viewer:'me',p_region_kind:'region',p_region_value:'Kent' }); expect(result.current.data?.map(row => row.latest_score_id)).toEqual(['f2','f1']);
  });
  it('nation comes from the primary club course, leaving profile country intact', async () => {
    const actual=await vi.importActual<typeof import('@/features/explore-magazine/useViewerScoreScope')>('@/features/explore-magazine/useViewerScoreScope');
    h.clubCourses=[{ id:'c',name:'Course',region:'Kent',sub_country:'England',golf_clubs:{ id:'club',name:'Club' } }];
    const { result }=renderHook(() => actual.useViewerScoreScope('me'),{ wrapper:Wrapper });
    await waitFor(() => expect(result.current.isFetched).toBe(true)); expect(result.current.scope).toMatchObject({ county:'Kent',nation:'England',country:'Scotland',countySource:'primary_club' });
  });
  it('nation follows most-played fallback when club course has no region', async () => {
    const actual=await vi.importActual<typeof import('@/features/explore-magazine/useViewerScoreScope')>('@/features/explore-magazine/useViewerScoreScope');
    h.clubCourses=[{ id:'c',name:'Course',region:null,sub_country:'England',golf_clubs:{ id:'club',name:'Club' } }]; h.played=[{ course_id:'p' }]; h.mostPlayed={ region:'Fife',sub_country:'Scotland' };
    const { result }=renderHook(() => actual.useViewerScoreScope('me'),{ wrapper:Wrapper });
    await waitFor(() => expect(result.current.isFetched).toBe(true)); expect(result.current.scope).toMatchObject({ county:'Fife',nation:'Scotland',country:'Scotland',countySource:'most_played' });
  });
  it('retired rounds route uses the actual Navigate element to Explore', () => {
    const source=readFileSync('src/App.tsx','utf8'); const match=source.match(/<Route path="\/rounds" element=\{<Navigate to="([^"]+)" replace \/>\} \/>/); expect(match?.[1]).toBe('/amateur');
    const Probe=() => { const loc=useLocation(); return <output>{loc.pathname}</output>; };
    render(<MemoryRouter initialEntries={['/rounds']}><Routes><Route path="/rounds" element={<Navigate to={match?.[1] ?? '/wrong'} replace />} /><Route path="/amateur" element={<Probe />} /></Routes></MemoryRouter>); expect(screen.getByText('/amateur')).toBeInTheDocument();
  });
});