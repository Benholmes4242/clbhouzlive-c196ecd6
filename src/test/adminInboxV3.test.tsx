import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { InboxItem } from '@/features/admin/hooks/useInboxFeed';
import type { InboxFlow } from '@/features/admin/hooks/useInboxFlow';

vi.mock('@/integrations/supabase/client', () => {
  const chain: Record<string, unknown> = {};
  const fn = () => chain;
  Object.assign(chain, {
    select: fn, eq: fn, is: fn, ilike: fn, order: fn, limit: () => Promise.resolve({ data: [], error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (r: (v: unknown) => unknown) => Promise.resolve({ data: [], count: 0, error: null }).then(r),
  });
  return {
    supabase: {
      from: () => chain,
      rpc: () => Promise.resolve({ data: null, error: null }),
      functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
      auth: { getSession: () => Promise.resolve({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
    },
  };
});
vi.mock('@/hooks/useSupabaseSession', async (orig) => ({ ...(await orig<object>()), useSupabaseSession: () => ({ user: { id: 'admin' }, session: null, loading: false }) }));
vi.mock('@/features/admin/hooks/useVerifications', async (orig) => ({ ...(await orig<object>()), useVerifications: () => ({ reviewMutation: { mutate: vi.fn(), isPending: false } }) }));
vi.mock('@/features/admin/hooks/useCourseRequests', async (orig) => ({ ...(await orig<object>()), useCourseRequests: () => ({ resolveCourseRequest: { mutateAsync: vi.fn(), isPending: false } }) }));
vi.mock('@/features/admin/hooks/useAdminActionRequests', async (orig) => ({ ...(await orig<object>()), useAdminActionRequestActions: () => ({ approve: { mutate: vi.fn(), isPending: false } }) }));
vi.mock('@/features/admin/hooks/useModerationActions', async (orig) => ({ ...(await orig<object>()), useModerationActions: () => ({ dismiss: { mutate: vi.fn(), isPending: false } }) }));
vi.mock('@/features/admin/hooks/useSupportTicketActions', async (orig) => ({ ...(await orig<object>()), useSupportTicketActions: () => ({ sendReply: vi.fn(), setStatus: vi.fn() }) }));
vi.mock('@/features/admin/components/AddCourseSheet', () => ({ default: () => null }));
vi.mock('@/features/admin/components/ConfirmDialog', () => ({ default: () => null }));

import InboxQueueRow, { btnBrand, btnOutline } from '@/features/admin/components/InboxQueueRow';
import { OpenDoneControl, FigureTiles, QueueChips, FlowPanel, ToolRow } from '@/features/admin/components/InboxPanels';

const DAY = 86_400_000;
const ago = (d: number) => new Date(Date.now() - d * DAY).toISOString();
const item = (over: Partial<InboxItem>): InboxItem => ({
  id: 'x', type: 'support', title: 'Title', meta: '', createdAt: ago(1), isHighPriority: false, payload: {}, ...over,
});
const LONG_NAME = 'Wensum Valley Hotel Golf & Country Club (Valley Course, Championship Tees)';
const unmatched = (over: Record<string, unknown> = {}) => item({
  id: 'u1', type: 'unmatchedCourse', title: LONG_NAME, createdAt: ago(2),
  payload: { whs_course_id: 'w1', whs_course_name: LONG_NAME, round_count: 3, member_count: 2, status: 'open', last_tier_tried: null, echo_suggestion: null, whs_country_name: 'England', ...over },
});

const wrap = (ui: React.ReactNode) => render(
  <QueryClientProvider client={new QueryClient()}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>,
);
const row = (it: InboxItem, done = false) => wrap(
  <InboxQueueRow item={it} first done={done} onOpen={() => {}} onResolved={() => {}} isFullAdmin catalogueTotal={1234} />,
);
const flow: InboxFlow = {
  window_days: 14, came_in: 5, cleared: 3, median_wait_hours: 2, computed_at: '',
  daily: [{ date: new Date().toISOString().slice(0, 10), came_in: 4, cleared: 2 }],
};

describe('ADMIN_INBOX_V3', () => {
  it('Open/Done shows the open count as plain text with no badge, and switches', () => {
    const onChange = vi.fn();
    wrap(<OpenDoneControl view="open" openCount={7} onChange={onChange} />);
    const count = document.querySelector('[data-open-count]') as HTMLElement;
    expect(count.textContent).toBe('7');
    expect(count.style.background).toBe('');
    expect(count.style.padding).toBe('');
    expect(count.getAttribute('data-tone')).toBe('canvas');
    fireEvent.click(screen.getAllByRole('tab')[1]);
    expect(onChange).toHaveBeenCalledWith('done');
  });

  it('shows four figures in both views, Longest in bad for a 14-day item', () => {
    const { unmount } = wrap(<FigureTiles view="open" loading={false} openItems={[item({ createdAt: ago(14) })]} doneItems={[]} queueCount={1} flow7={flow} flow7Loading={false} />);
    const stats = document.querySelectorAll('[data-stat]');
    expect([...stats].map(s => s.getAttribute('data-stat'))).toEqual(['Open', 'Longest', 'Members', 'Done 7d']);
    const longest = document.querySelector('[data-stat="Longest"] [data-figure]') as HTMLElement;
    expect(longest.getAttribute('data-tone')).toBe('bad');
    unmount();
    wrap(<FigureTiles view="done" loading={false} openItems={[]} doneItems={[]} queueCount={0} flow7={flow} flow7Loading={false} />);
    expect([...document.querySelectorAll('[data-stat]')].map(s => s.getAttribute('data-stat'))).toEqual(['Done', 'Longest', 'Members', 'Median']);
  });

  it('queue chips wrap without horizontal scroll and show a red age on a long queue', () => {
    wrap(<QueueChips loading={false} total={2} selected="all" onSelect={() => {}} queues={[
      { type: 'courseRequest', count: 1, members: 1, oldestIso: ago(16) },
      { type: 'support', count: 1, members: 1, oldestIso: ago(1) },
    ] as never} />);
    const box = document.querySelector('.inbox-chips') as HTMLElement;
    expect(box.style.flexWrap).toBe('wrap');
    expect(box.style.overflowX).toBe('');
    const ages = document.querySelectorAll('[data-chip-age]');
    expect(ages).toHaveLength(1);
    expect(ages[0].getAttribute('data-tone')).toBe('bad');
  });

  it('an unmatched row renders a long course name in full with the tag starting the fact line', () => {
    row(unmatched());
    const title = document.querySelector('[data-row-title]') as HTMLElement;
    expect(title.textContent).toBe(LONG_NAME);
    expect(title.style.textOverflow).toBe('');
    expect(title.style.whiteSpace).toBe('');
    const fact = document.querySelector('[data-fact-line]') as HTMLElement;
    expect(fact.firstElementChild?.hasAttribute('data-queue-tag')).toBe(true);
    expect(fact.style.whiteSpace).toBe('');
  });

  it('a claim row APPROVE uses the ink fill', () => {
    row(item({ id: 'v1', type: 'verification', title: 'Fairway Films', payload: { id: 'v1', type: 'golfer', displayName: 'Fairway Films' } }));
    expect(screen.getByRole('button', { name: 'APPROVE' })).toBeTruthy();
    // jsdom drops var() colours from inline styles, so read the primary style the row applies.
    expect(btnBrand()).toMatchObject({ background: 'var(--cc3-ink)', color: 'var(--cc3-canvas)', height: 30 });
  });

  it('an Echo suggestion wraps', () => {
    row(unmatched({ last_tier_tried: 'echo_review', echo_suggestion: 'Royal Ashdown Forest Golf Club (Old Course and West Course combined)' }));
    const name = document.querySelector('[data-echo-name]') as HTMLElement;
    expect(name.style.whiteSpace).toBe('');
    expect(name.style.textOverflow).toBe('');
    expect(screen.getByRole('button', { name: 'MATCH' })).toBeTruthy();
  });

  it('a successful Done row carries a good tick; a decline stays mute', () => {
    const { unmount } = row(item({ closedOutcome: 'Resolved' }), true);
    const ok = document.querySelector('[data-outcome-ok]') as HTMLElement;
    expect(ok.textContent).toContain('\u2713');
    expect(ok.getAttribute('data-tone')).toBe('good');
    unmount();
    row(item({ closedOutcome: 'Rejected' }), true);
    expect(document.querySelector('[data-outcome-ok]')).toBeNull();
  });

  it('Flow draws 14 came-in and 14 cleared columns, cleared below the axis, with the key', () => {
    wrap(<FlowPanel flow={flow} loading={false} />);
    const inRow = document.querySelector('[data-flow-in]')!;
    const outRow = document.querySelector('[data-flow-cleared]')!;
    const axis = document.querySelector('[data-flow-axis]')!;
    expect(inRow.children).toHaveLength(14);
    expect(outRow.children).toHaveLength(14);
    expect(inRow.compareDocumentPosition(axis) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(axis.compareDocumentPosition(outRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector('[data-swatch="in"]')).not.toBeNull();
    expect(document.querySelector('[data-swatch="cleared"]')).not.toBeNull();
  });

  it('Tools rows link to their pages', () => {
    wrap(<><ToolRow to="/admin-v2/inbox/venues" title="Tour venue mapping" sub="link" /><ToolRow to="/admin-v2/inbox/ranking-events" title="Ranking event courses" sub="link" /></>);
    expect(screen.getAllByRole('link').map(a => a.getAttribute('href'))).toEqual(['/admin-v2/inbox/venues', '/admin-v2/inbox/ranking-events']);
  });

  it('every row control is 30px high and nothing uses amber or text under 10px', () => {
    const { container } = row(unmatched());
    const controls = container.querySelectorAll('[data-inbox-row] > div:last-child button, [data-inbox-row] > div:last-child label');
    expect(controls.length).toBeGreaterThan(0);
    expect(btnOutline().height).toBe(30);
    controls.forEach(c => {
      const h = (c as HTMLElement).style.height;
      if (h) expect(h).toBe('30px');
    });
    const html = container.innerHTML.toLowerCase();
    expect(html).not.toMatch(/#f7931e|#ffa83a|247,\s*147,\s*30|echo_ground|echo_edge/);
    container.querySelectorAll<HTMLElement>('*').forEach(el => {
      const fs = parseFloat(el.style.fontSize);
      if (!Number.isNaN(fs)) expect(fs).toBeGreaterThanOrEqual(10);
    });
  });
});
