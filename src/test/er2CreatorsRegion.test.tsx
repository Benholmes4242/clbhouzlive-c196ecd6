import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';

const h = vi.hoisted(() => ({ rpc: vi.fn(), toggle: vi.fn(), rows: [] as unknown[], activity: [] as unknown[] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutateAsync: h.toggle }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { CreatorSpotlight, __resetSpotlight } from '@/features/explore-magazine/watch/CreatorSpotlight';

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, interpolation: { escapeValue: false }, resources: { en: { courses } } });
const creator = (id: string, following = false) => ({
  actor_id: id, actor_type: 'personal', display_name: `Creator ${id}`, handle: id,
  avatar_url: null, is_verified: false, following, videos: 7,
});
const recent = (id: string, kind = 'post') => ({ actor_id: id, kind, post_id: `latest-${id}`, created_at: '2026-11-03T10:00:00Z', course_name: null });
const clients: QueryClient[] = [];
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
function wrap(visit = 'visit') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(<MemoryRouter initialEntries={['/amateur']}><QueryClientProvider client={client}><I18nextProvider i18n={i18n}>
    <CreatorSpotlight userId="viewer" visitKey={visit} /><Location />
  </I18nextProvider></QueryClientProvider></MemoryRouter>);
}
const card = (id: string) => document.querySelector<HTMLElement>(`[data-spotlight="${id}"]`);
const follow = (id: string) => {
  const button = card(id)?.querySelector<HTMLButtonElement>('[data-spotlight-follow]');
  if (!button) throw new Error(`No follow button for ${id}`);
  return button;
};
const ready = () => waitFor(() => expect(document.querySelectorAll('[data-spotlight]')).toHaveLength(h.rows.length));
const order = () => Array.from(document.querySelectorAll('[data-spotlight]'), el => el.getAttribute('data-spotlight'));

beforeEach(() => {
  __resetSpotlight(); h.rows = [creator('first'), creator('second', true), creator('third')];
  h.activity = [recent('second')]; h.rpc.mockReset(); h.toggle.mockReset(); h.toggle.mockResolvedValue(undefined);
  h.rpc.mockImplementation((name: string) => Promise.resolve({ data: name === 'get_watch_spotlights' ? h.rows : name === 'get_recent_activity' ? h.activity : [], error: null }));
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });

describe('ER2 creator rail', () => {
  it('renders the plural heading from the real English provider', async () => {
    wrap(); await ready();
    expect(screen.getByText('Creators to follow', { selector: 'b' })).toBeTruthy();
    expect(screen.queryByText('Creator to follow')).toBeNull();
  });
  it('reads five spotlights and preserves all five rows in server order', async () => {
    h.rows = [creator('five'), creator('three'), creator('one'), creator('four', true), creator('two', true)];
    wrap(); await ready();
    expect(h.rpc).toHaveBeenCalledWith('get_watch_spotlights', { p_limit: 5 });
    expect(order()).toEqual(['five', 'three', 'one', 'four', 'two']);
    expect(document.querySelectorAll('[data-spotlight-dots] button')).toHaveLength(5);
  });
  it('starts a following row as Following and other rows as Follow', async () => {
    wrap(); await ready();
    expect(follow('second')).toHaveAttribute('aria-pressed', 'true');
    expect(follow('second').textContent).toBe('Following');
    expect(follow('first')).toHaveAttribute('aria-pressed', 'false');
    expect(follow('first').textContent).toBe('Follow');
  });
  it('unfollowing affects only that card without reordering or repicking', async () => {
    wrap(); await ready();
    await act(async () => fireEvent.click(follow('second')));
    expect(follow('second')).toHaveAttribute('aria-pressed', 'false');
    expect(follow('first')).toHaveAttribute('aria-pressed', 'false');
    expect(follow('third')).toHaveAttribute('aria-pressed', 'false');
    expect(h.toggle).toHaveBeenCalledWith(expect.objectContaining({ targetActorId: 'second', isFollowing: true }));
    expect(order()).toEqual(['first', 'second', 'third']);
    expect(h.rpc.mock.calls.filter(([name]) => name === 'get_watch_spotlights')).toHaveLength(1);
    expect(screen.getByTestId('location')).toHaveTextContent('/amateur');
  });
  it('keeps per-card overrides when the same visit remounts', async () => {
    wrap(); await ready(); await act(async () => fireEvent.click(follow('first')));
    cleanup(); wrap(); await ready();
    expect(follow('first')).toHaveAttribute('aria-pressed', 'true');
    expect(follow('second')).toHaveAttribute('aria-pressed', 'true');
    expect(follow('third')).toHaveAttribute('aria-pressed', 'false');
    expect(order()).toEqual(['first', 'second', 'third']);
  });
  it('one activity RPC serves all five actor ids in card order', async () => {
    h.rows = ['z', 'a', 'b', 'y', 'x'].map(id => creator(id)); h.activity = [];
    wrap(); await ready();
    await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('get_recent_activity', { p_actor_ids: ['z', 'a', 'b', 'y', 'x'] }));
    expect(h.rpc.mock.calls.filter(([name]) => name === 'get_recent_activity')).toHaveLength(1);
  });
  it.each(['post', 'review', 'round'])('active %s avatar uses the canonical ring and opens its latest post, not its profile', async kind => {
    h.activity = [recent('second', kind)]; wrap(); await ready();
    const door = await screen.findByRole('button', { name: "Open Creator second's latest post" });
    expect(door.querySelector('[data-active-ring="on"] [data-active-ring-gap]')).not.toBeNull();
    fireEvent.keyDown(door, { key: 'Enter' });
    expect(screen.getByTestId('location')).toHaveTextContent('/amateur');
    fireEvent.click(door);
    expect(screen.getByTestId('location').textContent).toBe('/post/latest-second');
  });
  it('inactive avatars are not doors and retain the same padded head slot', async () => {
    wrap(); await ready(); await screen.findByRole('button', { name: "Open Creator second's latest post" });
    const inactive = card('first')?.querySelector<HTMLElement>('[data-active-ring="off"]');
    const band = inactive?.querySelector<HTMLElement>('[data-active-ring-band]');
    const active = card('second')?.querySelector<HTMLElement>('[data-active-ring="on"]');
    const gap = active?.querySelector<HTMLElement>('[data-active-ring-gap]');
    expect(inactive).toBeTruthy(); expect(active).toBeTruthy();
    expect(card('first')?.querySelector('button[aria-label*="latest post"]')).toBeNull();
    expect(card('first')?.querySelector('[data-active-ring="on"]')).toBeNull();
    expect(Number.parseFloat(inactive?.style.padding ?? '') + Number.parseFloat(band?.style.padding ?? '')).toBe(3.5);
    expect(Number.parseFloat(active?.style.padding ?? '') + Number.parseFloat(gap?.style.padding ?? '')).toBe(3.5);
    expect(card('first')?.querySelector<HTMLElement>('[data-spotlight-head]')?.style.alignItems).toBe('center');
    const head = card('first')?.querySelector('[data-spotlight-head]');
    if (!head) throw new Error('Missing inactive head');
    fireEvent.click(head);
    expect(screen.getByTestId('location').textContent).not.toBe('/amateur');
    expect(screen.getByTestId('location').textContent).not.toContain('/post/');
  });
});