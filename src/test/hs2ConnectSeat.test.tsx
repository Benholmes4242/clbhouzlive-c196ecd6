import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmptyStateScreen, chooseCirclePeople } from '@/components/profile/handicap/whs/connect/EmptyStateScreen';
import { analyticsEvents } from '@/utils/analyticsEvents';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const st = vi.hoisted(() => ({ connected: 27, error: false, pending: false, profilePending: false, manual: 13, indexes: [2, 6, 11.2, 11.3, 16, 24] }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' }, loading: false }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: () => st.profilePending ? new Promise(() => {}) : Promise.resolve({ data: { eg_handicap_index: null, manual_handicap_index: st.manual }, error: null }) }) }) })),
  rpc: vi.fn(() => st.pending ? new Promise(() => {}) : Promise.resolve({ data: { connected: st.connected, circle: 30, people: st.indexes.map(index => ({ user_id: String(index), name: `Member ${index}`, avatar_url: null, club: index === 16 ? 'Sundridge Park Golf Club' : null, index })) }, error: st.error ? new Error('circle unavailable') : null })),
} }));

function mount(layout: 'page' | 'embedded' = 'page') {
  const pick = vi.fn();
  const decline = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(<QueryClientProvider client={qc}><EmptyStateScreen layout={layout} onPickCountry={pick} onDecline={decline} /></QueryClientProvider>);
  return { ...result, pick, decline };
}
beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(st, { connected: 27, error: false, pending: false, profilePending: false, manual: 13, indexes: [2, 6, 11.2, 11.3, 16, 24] });
});

describe('HS2 circle seat', () => {
  it('renders three nearest people plus You with a live full-state count', async () => {
    const { container } = mount();
    await screen.findByTestId('connect-seat-list');
    expect(screen.getByTestId('connect-seat-headline')).toHaveAttribute('data-connected', '27');
    expect(container.querySelectorAll('[data-seat-person]')).toHaveLength(4);
    expect([...container.querySelectorAll('[data-seat-person]')].map(el => el.getAttribute('data-seat-person'))).toEqual(['11.2', '11.3', 'you', '16']);
    expect(container.querySelectorAll('.connect-seat-cta')).toHaveLength(1);
    expect(container.querySelectorAll('.connect-seat-pills > span')).toHaveLength(4);
    expect(container.querySelector('.connect-seat-you button')).toBeNull();
    expect(container.querySelector('.connect-seat-slot')).toBeInTheDocument();
    expect(container.querySelectorAll('h2, [role="progressbar"]')).toHaveLength(0);
  });
  it('uses the singular full state for one connected golfer', async () => {
    st.connected = 1;
    mount();
    await screen.findByTestId('connect-seat-list');
    expect(screen.getByTestId('connect-seat-headline')).toHaveAttribute('data-connected', '1');
  });
  it('places You last if nobody has a higher index', async () => {
    st.indexes = [2, 6, 9];
    const { container } = mount();
    await screen.findByTestId('connect-seat-list');
    expect(container.querySelector('.connect-seat-list')?.lastElementChild).toHaveAttribute('data-seat-person', 'you');
  });
  it('renders an empty-state headline and lede without any list', async () => {
    st.connected = 0;
    const { container } = mount();
    await waitFor(() => expect(screen.queryByTestId('connect-seat-skeleton')).toBeNull());
    expect(screen.getByTestId('connect-seat-headline')).toHaveAttribute('data-connected', '0');
    expect(container.querySelector('.connect-seat-lede')).toBeInTheDocument();
    expect(screen.queryByTestId('connect-seat-list')).toBeNull();
    expect(container.querySelector('.connect-seat-cta')).toBeInTheDocument();
  });
  it('shows only a skeleton until circle settlement, never the empty state', () => {
    st.pending = true;
    const { container } = mount();
    expect(screen.getByTestId('connect-seat-skeleton')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByTestId('connect-seat-headline')).toBeNull();
    expect(container.querySelectorAll('button')).toHaveLength(0);
    expect(screen.queryByTestId('connect-seat-list')).toBeNull();
  });
  it('treats a failed circle read as empty even when it returns connected data', async () => {
    st.error = true;
    mount();
    await waitFor(() => expect(screen.queryByTestId('connect-seat-skeleton')).toBeNull());
    expect(screen.getByTestId('connect-seat-headline')).toHaveAttribute('data-connected', '0');
    expect(screen.queryByTestId('connect-seat-list')).toBeNull();
  });
  it('does not wait on the starting-handicap profile query', async () => {
    st.profilePending = true;
    mount();
    expect(await screen.findByTestId('connect-seat-list')).toBeInTheDocument();
  });
  it.each([27, 0])('advances and tracks footer CTA for circle count %s', async connected => {
    st.connected = connected;
    const { container, pick } = mount();
    await waitFor(() => expect(screen.queryByTestId('connect-seat-skeleton')).toBeNull());
    const cta = container.querySelector('.connect-seat-cta');
    if (!cta) throw new Error('missing CTA');
    fireEvent.click(cta);
    expect(pick).toHaveBeenCalledTimes(1);
    expect(analyticsEvents.track).toHaveBeenCalledWith('connect_intro_cta', { place: 'footer', circle_shown: connected > 0, h: 13 });
  });
  it('keeps CTA and decline in FooterBar outside Stage in both settled states', async () => {
    for (const connected of [27, 0]) {
      st.connected = connected;
      const { container, unmount } = mount();
      await waitFor(() => expect(screen.queryByTestId('connect-seat-skeleton')).toBeNull());
      const stage = screen.getByTestId('connect-seat-headline').parentElement?.parentElement;
      const footer = stage?.nextElementSibling;
      expect(stage).toHaveStyle({ flex: '1', overflowY: 'auto' });
      expect(footer).toHaveStyle({ flexShrink: '0' });
      expect(footer?.querySelectorAll('button')).toHaveLength(2);
      expect(footer?.querySelector('.connect-seat-cta')).toBeInTheDocument();
      expect(stage?.querySelectorAll('button')).toHaveLength(0);
      unmount();
    }
  });
  it('keeps the loading CTA bar in FooterBar outside the scrolling Stage', () => {
    st.pending = true;
    mount();
    const stage = screen.getByTestId('connect-seat-skeleton').parentElement?.parentElement;
    const footer = stage?.nextElementSibling;
    expect(footer).toHaveStyle({ flexShrink: '0' });
    expect(footer).toContainElement(screen.getByTestId('connect-seat-skeleton-cta'));
    expect(stage).not.toContainElement(screen.getByTestId('connect-seat-skeleton-cta'));
  });
  it('reuses setup embedded FooterBar spacing', async () => {
    mount('embedded');
    await screen.findByTestId('connect-seat-list');
    const stage = screen.getByTestId('connect-seat-headline').parentElement?.parentElement;
    expect(stage?.nextElementSibling).toHaveStyle({ padding: '16px 0 8px', paddingBottom: 'calc(34px + env(safe-area-inset-bottom, 0px))' });
  });
  it('keeps the decline action', async () => {
    const { container, decline } = mount();
    await screen.findByTestId('connect-seat-list');
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(decline).toHaveBeenCalledTimes(1);
  });
  it('keeps chooseCirclePeople default four', () => {
    const people = [2, 6, 9, 11, 13, 18, 22].map(index => ({ user_id: String(index), name: String(index), avatar_url: null, club: null, index }));
    expect(chooseCirclePeople(people, 12).map(p => p.index)).toEqual([9, 11, 13, 18]);
  });
  it('allows the intro to choose only three people', () => {
    const people = [2, 6, 9, 11, 13, 18, 22].map(index => ({ user_id: String(index), name: String(index), avatar_url: null, club: null, index }));
    expect(chooseCirclePeople(people, 12, 3).map(p => p.index)).toEqual([9, 11, 13]);
  });
});