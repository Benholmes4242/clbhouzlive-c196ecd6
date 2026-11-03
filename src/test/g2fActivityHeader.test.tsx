import React from 'react';
import { act, cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityPageV2 } from '@/features/activity-v2/ActivityPageV2';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { BottomNavigationProvider, useBottomNavigation } from '@/contexts/BottomNavigationContext';
import { useChromeLeftSlot, useChromeSuppressed } from '@/features/chrome-v2/leftOverride';
import { resolveChrome } from '@/features/chrome-v2/registry';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';
type InitialEntry = NonNullable<React.ComponentProps<typeof MemoryRouter>['initialEntries']>[number];
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const f = vi.hoisted(() => ({ unread: 3, records: 1, filters: [] as unknown[], from: vi.fn(), success: vi.fn() }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useUnreadNotifications', () => ({ useUnreadNotifications: () => ({ unreadCount: f.unread }) }));
vi.mock('@/features/activity-v2/hooks/useRecordsUnreadCount', () => ({ useRecordsUnreadCount: () => ({ data: f.records }) }));
vi.mock('@/features/activity-v2/hooks/useActivityFeedV2', () => ({ useActivityFeedV2: (filter: unknown) => { f.filters.push(filter); return { data: { pages: [[{ notif_id: 'fixture', is_read: false, created_at: '2026-11-03T12:00:00Z' }]] }, isLoading: false, isError: false, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() }; } }));
vi.mock('@/features/activity-v2/hooks/useActivityRoundSummaries', () => ({ useActivityRoundPages: () => new Map(), activityRoundId: () => null }));
vi.mock('@/features/activity-v2/components/LedgerRow', () => ({ LedgerRow: () => <div>Fixture row</div> }));
vi.mock('@/features/activity-v2/components/FriendRequestsRail', () => ({ FriendRequestsRail: () => null }));
vi.mock('@/features/social-suggestions/SuggestedGolfersBlock', () => ({ SuggestedGolfersBlock: () => null }));
vi.mock('@/features/social-suggestions/NobodySawThatRound', () => ({ NobodySawThatRound: () => null }));
vi.mock('@/features/activity-v2/components/FeaturedMomentCard', () => ({ FeaturedMomentCard: () => null, pickFeaturedRow: () => null }));
vi.mock('@/features/activity-v2/components/ActivityActionsSheet', () => ({ ActivityActionsSheet: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: f.from } }));
vi.mock('@/lib/toast', () => ({ toast: { success: f.success, error: vi.fn() } }));
const callbacks = new Map<Element, IntersectionObserverCallback>();
const original = window.IntersectionObserver;
let scroller: HTMLDivElement; let unregister: () => void;
let calls: Array<[string, ...unknown[]]>;
function Probe() { const loc = useLocation(), navigate = useNavigate(), { isVisible } = useBottomNavigation(), suppressed = useChromeSuppressed(); return <><output data-testid="location">{loc.pathname}</output><output data-testid="nav">{String(isVisible)}</output><output data-testid="suppressed">{String(suppressed)}</output><button onClick={() => navigate(-1)}>History probe</button></>; }
function Slot() { return <>{useChromeLeftSlot()}</>; }
function node(selector: string) { const el = document.querySelector<HTMLElement>(selector); if (!el) throw new Error(`Missing ${selector}`); return el; }
function pass(selector: string, bottom: number, intersecting = false) { const target = node(selector), callback = callbacks.get(target); if (!callback) throw new Error('Missing observer'); act(() => callback([{ target, isIntersecting: intersecting, boundingClientRect: { bottom }, rootBounds: { top: 56 } } as unknown as IntersectionObserverEntry], {} as IntersectionObserver)); }
async function move(top: number) { scroller.scrollTop = top; await act(async () => { fireEvent.scroll(scroller); await new Promise(resolve => requestAnimationFrame(() => resolve(null))); }); }
function mount(entries: InitialEntry[] = ['/notificationmessages']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } }); const invalidation = vi.spyOn(qc, 'invalidateQueries');
  const view = render(<MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}><QueryClientProvider client={qc}><BottomNavigationProvider><Probe /><Slot /><Routes><Route path="/notificationmessages" element={<ActivityPageV2 />} /><Route path="*" element={<div>Other route</div>} /></Routes></BottomNavigationProvider></QueryClientProvider></MemoryRouter>);
  return { ...view, invalidation };
}
beforeEach(() => {
  f.unread = 3; f.records = 1; f.filters = []; f.from.mockReset(); f.success.mockClear(); calls = [];
  f.from.mockImplementation((table: string) => { calls.push(['from', table]); const chain: Record<string, unknown> = { then: (resolve: (v: unknown) => void) => resolve({ error: null }) }; for (const name of ['update', 'eq', 'neq', 'lte', 'or', 'not']) chain[name] = (...args: unknown[]) => { calls.push([name, ...args]); return chain; }; return chain; });
  resetToExpanded(); callbacks.clear(); scroller = document.createElement('div'); scroller.id = 'root'; document.body.appendChild(scroller); unregister = registerNavScroller(scroller);
  window.IntersectionObserver = class { cb: IntersectionObserverCallback; constructor(cb: IntersectionObserverCallback) { this.cb = cb; } observe(el: Element) { callbacks.set(el, this.cb); } disconnect() {} unobserve() {} } as unknown as typeof IntersectionObserver;
});
afterEach(() => { cleanup(); unregister(); scroller.remove(); resetToExpanded(); window.IntersectionObserver = original; });
describe('G2F Activity header', () => {
  it('registers dark soft condensing history-back islands', () => { expect(resolveChrome('/notificationmessages', new URLSearchParams())).toEqual({ chrome: 'island', tone: 'dark', bleed: true, scrim: 'soft', condense: true, left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/' } }); });
  it('opts Activity out of FixedPageHeader and spacer without suppression', () => { mount(); expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Activity'); expect(document.querySelector('[data-fixed-page-header]')).toBeNull(); expect(document.querySelector('[data-fixed-page-header-spacer]')).toBeNull(); expect(screen.getByTestId('suppressed')).toHaveTextContent('false'); });
  it('preserves the default ManagePageShell header and spacer', () => { render(<MemoryRouter><ManagePageShell title="Manage"><div>Child</div></ManagePageShell></MemoryRouter>); expect(document.querySelector('[data-fixed-page-header]')).toBeTruthy(); expect(document.querySelector('[data-fixed-page-header-spacer]')).toBeTruthy(); });
  it.each([
    ['default', [{ pathname: '/notificationmessages', key: 'default' }]],
    ['push', ['/before', { pathname: '/notificationmessages', state: { exitFromPushRound: true } }]],
  ] as Array<[string, InitialEntry[]]>)('replaces %s exits with /', (_kind, entries) => { mount(entries); fireEvent.click(screen.getByRole('button', { name: 'Go back' })); expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/); fireEvent.click(screen.getByRole('button', { name: 'History probe' })); expect(screen.getByTestId('location')).not.toHaveTextContent('/notificationmessages'); });
  it('uses history for a normal Activity entry and restores nav', () => { mount(['/before', '/notificationmessages']); expect(screen.getByTestId('nav')).toHaveTextContent('false'); fireEvent.click(screen.getByRole('button', { name: 'Go back' })); expect(screen.getByTestId('location')).toHaveTextContent('/before'); expect(screen.getByTestId('nav')).toHaveTextContent('true'); });
  it('shows Mark all read only when unread and preserves writes/invalidation/toast', async () => {
    const view = mount(); fireEvent.click(screen.getByRole('button', { name: 'Mark all read' })); await waitFor(() => expect(f.success).toHaveBeenCalledWith('All caught up'));
    expect(calls).toContainEqual(['update', { is_read: true, read: true }]); expect(calls).toContainEqual(['eq', 'recipient_actor_id', 'viewer']); expect(calls).toContainEqual(['neq', 'type', 'friend_request']);
    expect(view.invalidation.mock.calls.map(([arg]) => arg?.queryKey)).toEqual([['activity-v2'], ['activity-feed'], ['activity-unread-count'], ['actor-unread-counts'], ['records-unread-count']]);
    view.unmount(); f.unread = 0; mount(); expect(screen.queryByRole('button', { name: 'Mark all read' })).toBeNull();
  });
  it('observes the actual Activity title for the expanded back name', async () => { mount(); pass('h1', 160, true); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false'); pass('h1', 55); expect(screen.getByRole('button', { name: 'Back from Activity' })).toHaveAttribute('data-named', 'true'); await move(160); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false'); await move(140); expect(screen.getByRole('button', { name: 'Back from Activity' })).toBeTruthy(); });
  it('docks only past its chips and shares filters/counters across copies', async () => {
    mount(); const dock = node('[data-island-dock]'); expect(dock).toHaveAttribute('inert'); pass('[data-activity-chips="in-place"]', 160, true); expect(dock).toHaveAttribute('data-shown', 'false'); pass('[data-activity-chips="in-place"]', 55); expect(dock).toHaveAttribute('data-shown', 'true');
    expect(within(dock).getByRole('tab', { name: 'New 1' })).toBeTruthy(); fireEvent.click(within(dock).getByRole('tab', { name: 'Records 1' })); expect(f.filters.at(-1)).toBe('crowns');
    fireEvent.click(within(node('[data-activity-chips="in-place"]')).getByRole('button', { name: 'Friends' })); expect(within(dock).getByRole('tab', { name: 'Friends' })).toHaveAttribute('aria-selected', 'true'); expect(f.filters.at(-1)).toBe('friends');
    await move(160); expect(dock).toHaveAttribute('data-shown', 'false'); await move(140); expect(dock).toHaveAttribute('data-shown', 'true');
  });
});