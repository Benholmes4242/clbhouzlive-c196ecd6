import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { SlotTournament, SlotSelection } from '@/features/clubhouse-tour/tourSlotRules';
import { advanceTourSlotCursor, bestOfThree, chaserSentence, CURSOR_KEY, orderTourSlots, pickScore, recordLine, resolveTourSlot, resultHeld, slotPosition, tourSlotPlacement } from '@/features/clubhouse-tour/tourSlotRules';
import { stripEventSponsorClause } from '@/features/tourhub/_shared/eventName';
import { INK } from '@/features/tourhub/_shared/tokens';

const h = vi.hoisted(() => ({ selection: null as SlotSelection | null, postId: 'post-123' as string | null, select: vi.fn(), invoke: vi.fn(), track: vi.fn(), onLike: vi.fn(), comments: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/clubhouse-tour/useTourSlotData', () => ({ useTourSlotData: () => ({ selection: h.selection, payload: h.selection ? { predictions: new Map([[h.selection.tournament.id, picks]]), boards: new Map([[h.selection.tournament.id, board]]) } : null }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ selectedTourSlug: 'pga', selectTour: h.select }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { id: 'viewer', type: 'personal', name: 'Viewer' }, availableActors: [{ id: 'viewer', type: 'personal', name: 'Viewer' }], setActiveActor: vi.fn() }) }));
vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ isFetched: true, data: new Map() }) }));
vi.mock('@/features/tourhub/hooks/usePickInsights', () => ({ useOurPickRecord: () => ({ isFetched: true, data: null }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHero', () => ({ formatOverviewDateRange: () => '12–15 Nov' }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: ({ postId }: { postId: string }) => <div data-likers-post={postId} /> }));
vi.mock('@/components/feed/FeedActorPicker', () => ({ FeedActorPicker: () => null }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({ useClubhouseLikes: () => ({ handleLike: h.onLike, getActiveLikeState: (post: { likeCount: number } | null) => ({ isLiked: false, count: post?.likeCount ?? 0 }) }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseShare', () => ({ useClubhouseShare: () => ({ handleShare: vi.fn() }) }));
vi.mock('@/features/guest/useGuestActionGate', () => ({ gateGuestActionNow: () => false }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  functions: { invoke: h.invoke },
  rpc: () => Promise.resolve({ data: false, error: null }),
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { user_id: 'system', created_at: '2026-11-13', like_count: 2, comment_count: 4 }, error: null }) }) }) }),
} }));
import { TourSlot, TourSlotView } from '@/features/clubhouse-tour/TourSlot';
import type { TourSlotVisit } from '@/features/clubhouse-tour/useTourSlotData';

function event(overrides: Partial<SlotTournament> = {}): SlotTournament {
  return { id: 'event', name: 'Austin Championship', status: 'scheduled', event_type: 'stroke', start_date: '2026-11-12', end_date: '2026-11-15', purse: 10000000, winning_share: null, currency: 'USD', venue_id: null, venue_name: 'Barton Creek', venue_course_name: null, venue_city: 'Austin', venue_state: null, venue_country: 'USA', venue_par: 72, venue_yardage: 7706, winner_id: null, defending_champion: 'Matt Fitzpatrick', champion_narrative: null, season_id: 'season', current_round: 2, current_round_status: null, season: { id: 'season', tour_id: 'tour', tour_name: 'pga', year: 2026 }, locksAt: '2026-11-12T12:00:00Z', ...overrides };
}
function row(position: number, name: string, score: number, tied = false): BoardEntry { return { id: name, position, position_tied: tied, score, thru: 18, player: { id: name, full_name: name } }; }
const board = [row(1,'Trace Crowe',-10), row(2,'Kris Ventura',-9,true), row(2,'Max Greyserman',-9,true)];
const picks = [{ rank: 1, playerId: 'Trace Crowe', playerName: 'Trace Crowe' }, { rank: 2, playerId: 'Kris Ventura', playerName: 'Kris Ventura' }, { rank: 3, playerId: 'Max Greyserman', playerName: 'Max Greyserman' }];
const predictionMap = new Map([['event',picks]]);
const beforeLock = new Date('2026-11-12T11:00:00Z');
const afterLock = new Date('2026-11-12T13:00:00Z');
const words = (key: string) => ({ 'overview.countWords.2': 'Two', 'overview.countWords.3': 'Three', 'overview.countWords.4': 'Four' }[key] ?? '');
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); h.selection = null; h.postId = 'post-123'; h.invoke.mockImplementation(() => Promise.resolve({ data: { postId: h.postId }, error: null })); });

describe('Tour slot resolver', () => {
  it('is Preview before the pick lock', () => { expect(resolveTourSlot([event()],predictionMap,new Map([['event',board]]),beforeLock)[0]?.state).toBe('preview'); });
  it('stays Preview after lock with fewer than three positioned rows', () => { expect(resolveTourSlot([event()],predictionMap,new Map([['event',board.slice(0,2)]]),afterLock)[0]?.state).toBe('preview'); });
  it('counts positioned rows only when deciding the three-row threshold', () => { expect(resolveTourSlot([event({ status:'inprogress' })],predictionMap,new Map([['event',[...board.slice(0,2), { ...board[2], position:null }]]]),afterLock)[0]?.state).toBe('preview'); });
  it('is Live with three positioned leaderboard rows', () => { expect(resolveTourSlot([event({ status:'inprogress' })],predictionMap,new Map([['event',board]]),afterLock)[0]?.state).toBe('live'); });
  it('requires published predictions for Preview', () => { expect(resolveTourSlot([event()],new Map(),new Map(),beforeLock)).toEqual([]); });
  it('holds a closed result through Tuesday 23:59 London', () => { expect(resultHeld('2026-11-08',new Date('2026-11-10T23:59:59Z'))).toBe(true); });
  it('removes a result at Wednesday midnight London', () => { expect(resultHeld('2026-11-08',new Date('2026-11-11T00:00:00Z'))).toBe(false); });
  it('uses London midnight during British summer time', () => { expect(resultHeld('2026-07-05',new Date('2026-07-07T22:59:59Z'))).toBe(true); expect(resultHeld('2026-07-05',new Date('2026-07-07T23:00:00Z'))).toBe(false); });
  it('accepts both closed and complete results', () => { expect(resolveTourSlot([event({status:'closed',end_date:'2026-11-08'}),event({id:'other',status:'complete',end_date:'2026-11-08'})],new Map(),new Map(),new Date('2026-11-10')).map(e=>e.state)).toEqual(['result','result']); });
  it('excludes LIV from every state', () => { expect(resolveTourSlot(['scheduled','inprogress','closed'].map(status=>event({status,season:{...event().season,tour_name:'liv'}})),predictionMap,new Map([['event',board]]),beforeLock)).toEqual([]); });
  it('orders the selected tour first then fixed tours and Live Result Preview', () => {
    const list = ['pgad','champ','euro','lpga','pga'].flatMap(tour => ['preview','result','live'].map(state => ({ tournament:event(), tour, state } as SlotSelection)));
    expect(orderTourSlots(list,'euro').map(e=>`${e.tour}:${e.state}`)).toEqual(['euro:live','euro:result','euro:preview','pga:live','pga:result','pga:preview','lpga:live','lpga:result','lpga:preview','champ:live','champ:result','champ:preview','pgad:live','pgad:result','pgad:preview']);
  });
  it('ignores all and major as tour priorities', () => { const list = ['lpga','pga'].map(tour=>({ tournament:event(), tour, state:'live' } as SlotSelection)); expect(orderTourSlots(list,'all')[0].tour).toBe('pga'); expect(orderTourSlots(list,'major')[0].tour).toBe('pga'); });
  it('rotates the cursor once per call and wraps modulo eligible length', () => { expect([advanceTourSlotCursor(localStorage)%2,advanceTourSlotCursor(localStorage)%2,advanceTourSlotCursor(localStorage)%2]).toEqual([0,1,0]); expect(localStorage.getItem(CURSOR_KEY)).toBe('3'); });
  it('falls back to zero when cursor reads throw', () => { expect(advanceTourSlotCursor({getItem:()=>{throw Error('blocked');},setItem:()=>{}})).toBe(0); });
  it('falls back to zero when cursor writes throw', () => { expect(advanceTourSlotCursor({getItem:()=> '7',setItem:()=>{throw Error('blocked');}})).toBe(0); });
});
describe('Tour slot formatting', () => {
  it('formats ties and ordinals including teen exceptions', () => { expect([slotPosition(row(2,'A',0,true)),...[1,3,8,11,12,13,21].map(n=>slotPosition(row(n,'A',0)))]).toEqual(['T2','1st','3rd','8th','11th','12th','13th','21st']); });
  it('keeps the cut score for MC and removes the score for WD', () => { const cut={...board[0],status:'cut',score:2}; const wd={...board[0],status:'withdrawn'}; expect([slotPosition(cut),pickScore(cut),slotPosition(wd),pickScore(wd)]).toEqual(['MC',2,'WD',null]); });
  it('names a sole chaser and a shot', () => { expect(chaserSentence(board.slice(0,2),words)).toBe('Ventura is a shot back.'); });
  it('names two chasers and two shots', () => { expect(chaserSentence([board[0],{...board[1],score:-8},{...board[2],score:-8}],words)).toBe('Ventura and Greyserman are two shots back.'); });
  it('counts three or more chasers and spells gap words', () => { expect(chaserSentence([board[0],{...board[1],score:-7},{...board[2],score:-7},row(2,'Other Player',-7,true)],words)).toBe('3 players are three shots back.'); });
  it('omits the chaser sentence for a shared lead', () => { expect(chaserSentence([board[0],row(1,'Other Leader',-10,true),board[1]],words)).toBeNull(); });
  it('reads the same best-pick record figures as the Tour picks block', () => { expect(recordLine('pga',{ tours:['pga'],picks:33,won:5,top10:21,avg_percentile:null,first_event_date:null,events:[],best:{wins:1,top10:9,events:13,avg_percentile:null} })).toBe('Our record on the PGA Tour: 1 win, 9 top 10s from 13 events.'); });
  it('formats the best-of-three result line', () => { expect(bestOfThree([picks[1],picks[2]],board)).toBe('Best of our three: Ventura, T2.'); });
  it('formats the picked-winner result line', () => { expect(bestOfThree(picks,board)).toBe('We picked the winner: Crowe.'); });
  it('strips sponsorship clauses but preserves Championship', () => { expect(['presented','driven','sponsored'].map(clause=>stripEventSponsorClause(`Austin Championship ${clause} by Company`))).toEqual(['Austin Championship','Austin Championship','Austin Championship']); });
  it('places the slot only before index twelve with more than twelve posts', () => { expect([tourSlotPlacement(12,13),tourSlotPlacement(12,12),tourSlotPlacement(11,20),tourSlotPlacement(13,20)]).toEqual([true,false,false,false]); });
});
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
function mount() {
  const visit: TourSlotVisit = { cursor:0,ready:true,selected:null,snapshot:null,shown:new Set() };
  return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/clubhouse']}><TourSlot visit={visit} onComment={h.comments} /><Location /></MemoryRouter></QueryClientProvider>);
}
describe('Tour slot rendering and post binding', () => {
  it('renders nothing without an eligible tournament', () => { const {container}=mount(); expect(container.querySelector('[data-tour-slot]')).toBeNull(); expect(h.invoke).not.toHaveBeenCalled(); });
  it('binds actions and liked-by to the returned persistent post id', async () => { h.selection={tournament:event(),tour:'pga',state:'preview'}; const {container}=mount(); await waitFor(()=>expect(container.querySelector('[data-tour-slot-actions]')).not.toBeNull()); expect(h.invoke).toHaveBeenCalledWith('upsert-live-tournament-post',{body:{tournamentId:'event',tournamentName:'Austin Championship'}}); expect(container.querySelector('[data-likers-post]')?.getAttribute('data-likers-post')).toBe('post-123'); const buttons=container.querySelectorAll('[data-tour-slot-actions] button'); fireEvent.pointerDown(buttons[0], { pointerId: 1 }); fireEvent.pointerUp(buttons[0], { pointerId: 1 }); expect(h.onLike.mock.calls[0]?.[0]?.id).toBe('post-123'); });
  it('hides actions and comment doors when no post id is returned', async () => { h.selection={tournament:event(),tour:'pga',state:'preview'}; h.postId=null; const {container}=mount(); await waitFor(()=>expect(container.querySelector('[data-tour-slot]')).not.toBeNull()); expect(container.querySelector('[data-tour-slot-actions]')).toBeNull(); expect(container.querySelector('[data-tour-slot-comment]')).toBeNull(); });
  it('selects the tournament tour and navigates when the body is tapped', async () => { h.selection={tournament:event(),tour:'pga',state:'preview'}; const {container}=mount(); await waitFor(()=>expect(container.querySelector('[data-tour-slot]')).not.toBeNull()); const article=container.querySelector('[data-tour-slot]'); if (!article) throw Error('slot missing'); fireEvent.click(article); expect(h.select).toHaveBeenCalledWith('pga',{tournamentId:'event'}); expect(screen.getByTestId('location').textContent).toBe('/tourhub'); expect(localStorage.getItem('tourhub:selectedTour')).toBe('pga'); });
  it('does not navigate when the action or comment row is tapped', async () => { h.selection={tournament:event(),tour:'pga',state:'preview'}; const {container}=mount(); await waitFor(()=>expect(container.querySelector('[data-tour-slot-actions]')).not.toBeNull()); const action=container.querySelector('[data-tour-slot-actions]'); const comment=container.querySelector('[data-tour-slot-comment] button'); if (!action || !comment) throw Error('doors missing'); fireEvent.click(action); fireEvent.click(comment); expect(h.select).not.toHaveBeenCalled(); expect(screen.getByTestId('location').textContent).toBe('/clubhouse'); expect(h.comments.mock.calls[0]?.[0]?.id).toBe('post-123'); });
  it('shows the first top tie marker only and keeps pick positions in ink', () => { const tied=[row(1,'A Player',-10,true),row(1,'B Player',-10,true),row(3,'C Player',2)]; const ps=tied.map((r,i)=>({rank:i+1,playerId:r.player?.id??'',playerName:r.player?.full_name??''})); const {container}=render(<TourSlotView selection={{tournament:event(),tour:'pga',state:'live'}} picks={ps} board={tied} image={null} record={null} sentence={null} chase={null} onOpen={()=>{}} />); const positions=container.querySelectorAll('[data-tour-slot-board] > div > span:first-child'); expect([...positions].map(p=>p.textContent)).toEqual(['T1','','3']); for (const p of container.querySelectorAll('[data-tour-slot-position]')) expect((p as HTMLElement).style.color).toBe('rgb(248, 250, 252)'); expect(INK).toBe('#F8FAFC'); });
});