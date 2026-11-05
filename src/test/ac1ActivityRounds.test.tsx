import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ rpc: vi.fn(), user: { id: 'viewer' } as { id: string } | null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.user }) }));
vi.mock('@/features/activity-v2/hooks/useSharePrompt', () => ({ useSharePromptFor: () => null }));
import { LedgerRow } from '@/features/activity-v2/components/LedgerRow';
import { activityRoundId, useActivityRoundPages, useActivityRoundSummaries, type ActivityRoundSummary } from '@/features/activity-v2/hooks/useActivityRoundSummaries';
import { activityHoleColor, betterThanAverage } from '@/features/activity-v2/components/ActivityRoundContent';
import { RAMP_DIST } from '@/features/courses/components/holes/analytical/tokens';
import type { ActivityFeedRowV2 } from '@/features/activity-v2/hooks/useActivityFeedV2';

const summary: ActivityRoundSummary = { whs_score_id: 's1', user_id: 'actor', course_id: 'c1', course_name: 'Abridge Golf Club', gross: 84, course_par: 72, to_par: 12, holes_played: 18, hole_to_par: [-3,-2,-1,0,1,2,3,null], avg_to_par_here: 14, other_rounds_here: 3, at_viewer_club: true };
const row: ActivityFeedRowV2 = { notif_id: 'n1', notif_type: 'new_post', created_at: new Date().toISOString(), is_read: false, message: 'Danny shared a round.', title: null, entity_id: 'post', entity_type: 'post', data: { is_round: true, whs_score_id: 's1' }, actor_user_id: 'actor', actor_username: 'danny', actor_display_name: 'Danny Blake', actor_avatar_url: null, actor_kind: 'personal', actor_route_id: 'actor', liker_avatar_urls: [], target_course_name: 'Abridge Golf Club', target_course_image: '/course.jpg', target_poster_url: '/photo.jpg', target_review_rating: null };
afterEach(() => { cleanup(); h.rpc.mockReset(); h.user = { id: 'viewer' }; });
function queryWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function mount(overrides: Partial<ActivityRoundSummary> | undefined = {}, notification = row) {
  return render(<MemoryRouter><LedgerRow row={notification} roundSummary={overrides === undefined ? undefined : { ...summary, ...overrides }} onMarkRead={vi.fn()} onLongPress={vi.fn()} /></MemoryRouter>);
}
describe('AC1 summary page reads', () => {
  it('reads once with sorted deduplicated ids and returns a Map by score id', async () => {
    h.rpc.mockResolvedValue({ data: [summary], error: null });
    const hook = renderHook(({ ids }) => useActivityRoundSummaries(ids), { initialProps: { ids: ['s2','s1','s1'] }, wrapper: queryWrapper() });
    await waitFor(() => expect(hook.result.current.get('s1')?.gross).toBe(84));
    hook.rerender({ ids: ['s1','s2'] });
    expect(h.rpc).toHaveBeenCalledTimes(1);
    expect(h.rpc).toHaveBeenCalledWith('get_activity_round_summaries', { p_score_ids: ['s1','s2'] });
    expect(hook.result.current.has('s2')).toBe(false);
  });
  it('returns not-ready while the read is loading', () => {
    h.rpc.mockReturnValue(new Promise(() => {}));
    const hook = renderHook(() => useActivityRoundSummaries(['s1']), { wrapper: queryWrapper() });
    expect(hook.result.current.size).toBe(0);
  });
  it('returns not-ready on an RPC error without retries or guessed values', async () => {
    h.rpc.mockResolvedValue({ data: [summary], error: { message: 'denied' } });
    const hook = renderHook(() => useActivityRoundSummaries(['s1']), { wrapper: queryWrapper() });
    await waitFor(() => expect(h.rpc).toHaveBeenCalledTimes(1));
    expect(hook.result.current.size).toBe(0);
  });
  it('reads each loaded page once and does not reread page one on append', async () => {
    h.rpc.mockImplementation((_name, args) => Promise.resolve({ data: args.p_score_ids.map((id: string) => ({ ...summary, whs_score_id: id })), error: null }));
    const hook = renderHook(({ pages }) => useActivityRoundPages(pages), { initialProps: { pages: [[row, { ...row, notif_type: 'like' }, { ...row, data: { is_round: true } }]] }, wrapper: queryWrapper() });
    await waitFor(() => expect(hook.result.current.size).toBe(1));
    hook.rerender({ pages: [[row], [{ ...row, data: { is_round: true, whs_score_id: 's2' } }]] });
    await waitFor(() => expect(hook.result.current.size).toBe(2));
    expect(h.rpc.mock.calls).toEqual([['get_activity_round_summaries', { p_score_ids: ['s1'] }], ['get_activity_round_summaries', { p_score_ids: ['s2'] }]]);
  });
  it('makes no read without a signed-in viewer or round ids', () => {
    h.user = null;
    renderHook(() => useActivityRoundSummaries(['s1']), { wrapper: queryWrapper() });
    h.user = { id: 'viewer' };
    renderHook(() => useActivityRoundSummaries([]), { wrapper: queryWrapper() });
    expect(h.rpc).not.toHaveBeenCalled();
  });
  it('only qualifies new_post with is_round true and a score id', () => {
    expect(activityRoundId(row)).toBe('s1');
    expect(activityRoundId({ ...row, notif_type: 'like' })).toBeNull();
    expect(activityRoundId({ ...row, data: { is_round: 'true', whs_score_id: 's1' } })).toBeNull();
    expect(activityRoundId({ ...row, data: { is_round: true } })).toBeNull();
  });
});
describe('AC1 average threshold', () => {
  it.each([
    [3,13,1], [3,14.6,3], [2,14,null], [3,12.9,null], [3,11,null], [3,null,null],
  ])('other rounds %s and average %s produce %s', (other, average, expected) => {
    expect(betterThanAverage({ ...summary, other_rounds_here: other, avg_to_par_here: average })).toBe(expected);
  });
});
describe('AC1 round rows', () => {
  it('uses the shortened course sentence and qualified club/average meta without a course thumbnail', () => {
    const { container } = mount();
    expect(container.querySelector('.activity-round-sentence')).toHaveTextContent('Danny Blake shot 84 at Abridge');
    expect(container.querySelector('.activity-round-meta')).toHaveTextContent('your club · 2 better than their average there');
    expect(container.querySelector('[style*="course.jpg"], [style*="photo.jpg"]')).toBeNull();
    expect(screen.getByTestId('activity-score-tile')).toHaveTextContent('84+12');
  });
  it.each([{ other_rounds_here: 2 }, { avg_to_par_here: 11 }])('omits average wording outside qualification %j', overrides => {
    const { container } = mount(overrides);
    expect(container.querySelector('.activity-round-meta')).not.toHaveTextContent('better');
  });
  it('omits your-club meta for other clubs', () => {
    const { container } = mount({ at_viewer_club: false });
    expect(container.querySelector('.activity-round-meta')).not.toHaveTextContent('your club');
  });
  it.each([[0,18,'E'],[-2,18,'−2'],[3,9,'9 holes']])('formats to-par %s over %s holes as %s', (toPar, holes, label) => {
    mount({ to_par: toPar as number, holes_played: holes as number });
    expect(screen.getByTestId('activity-score-tile').querySelector('span')).toHaveTextContent(label as string);
  });
  it('keeps every hole entry including unplayed holes and settled score colours', () => {
    mount();
    expect(screen.getByTestId('activity-hole-strip').children).toHaveLength(8);
    expect([...screen.getByTestId('activity-hole-strip').children].map(el => el.getAttribute('data-hole-value'))).toEqual(['-3','-2','-1','0','1','2','3','missing']);
    expect([-3,-2,-1,0,1,2,3,null].map(activityHoleColor)).toEqual([RAMP_DIST.eagles,RAMP_DIST.eagles,RAMP_DIST.birdie,'var(--activity-hole-par)',RAMP_DIST.bogey,RAMP_DIST.double,RAMP_DIST.double,'var(--activity-hole-missing)']);
  });
  it.each<[number[] | null]>([[null], [[]]])('omits a missing or empty strip %j', holes => {
    mount({ hole_to_par: holes });
    expect(screen.queryByTestId('activity-hole-strip')).toBeNull();
  });
  it('renders not-ready text without score tile or thumbnail', () => {
    const { container } = render(<MemoryRouter><LedgerRow row={row} onMarkRead={vi.fn()} onLongPress={vi.fn()} /></MemoryRouter>);
    expect(container.querySelector('.activity-round-sentence')).toHaveTextContent(/^Danny Blake shared a round$/);
    expect(container.querySelector('.activity-round-meta')).toHaveTextContent('scorecard not ready yet');
    expect(screen.queryByTestId('activity-score-tile')).toBeNull();
    expect(container.querySelector('[style*="course.jpg"], [style*="photo.jpg"]')).toBeNull();
  });
  it('preserves scorecard-over-Activity navigation and marks the round read on tap', () => {
    const read = vi.fn();
    function Location() { const location = useLocation(); return <output>{location.pathname}|{(location.state?.backgroundLocation)?.pathname}</output>; }
    render(<MemoryRouter initialEntries={['/notificationmessages']}><LedgerRow row={row} roundSummary={summary} onMarkRead={read} onLongPress={vi.fn()} /><Location /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /shot 84/ }));
    expect(screen.getByRole('status')).toHaveTextContent('/round/s1|/notificationmessages');
    expect(read).toHaveBeenCalledWith('n1');
  });
  it('uses only the left unread indicator class and removes it when read', () => {
    const { container, rerender } = mount();
    expect(container.querySelector('.activity-unread')).not.toBeNull();
    expect(container.querySelector('[style*="247, 147, 30"], [style*="rgb(247, 147, 30)"]')).toBeNull();
    rerender(<MemoryRouter><LedgerRow row={{ ...row, is_read: true }} roundSummary={summary} onMarkRead={vi.fn()} onLongPress={vi.fn()} /></MemoryRouter>);
    expect(container.querySelector('.activity-unread')).toBeNull();
  });
});
describe('AC1 Tour system rows', () => {
  const system = { ...row, notif_type: 'tour_roundup', data: { tour_short_name: 'DPWT' }, actor_user_id: null, actor_display_name: null, message: 'Tour result' };
  it('uses the trophy tile and carried short-name meta', () => {
    const { container } = mount(undefined, system);
    expect(screen.getByTestId('activity-tour-tile').querySelector('svg')).not.toBeNull();
    expect(screen.getByTestId('activity-tour-tile').textContent).toBe('');
    expect(container.querySelector('.activity-round-meta')).toHaveTextContent(/^DPWT · /);
    expect(container.querySelector('.lucide-bell')).toBeNull();
  });
  it('falls back to Tour without inventing a short name', () => {
    const { container } = mount(undefined, { ...system, data: {} });
    expect(screen.getByTestId('activity-tour-tile').querySelector('svg')).not.toBeNull();
    expect(screen.getByTestId('activity-tour-tile').textContent).toBe('');
    expect(container.querySelector('.activity-round-meta')).toHaveTextContent(/^Tour · /);
  });
  it('keeps the Bell on a non-Tour system row', () => {
    const { container } = mount(undefined, { ...system, notif_type: 'system', data: {} });
    expect(screen.queryByTestId('activity-tour-tile')).toBeNull();
    expect(container.querySelector('.lucide-bell')).not.toBeNull();
  });
});