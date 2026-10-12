/**
 * BRIEF_LOOP_THREE_ROWS — The loop panel shows exactly three bar rows and every
 * percentage is that row's figure as a share of JOINED (never of the row above).
 * Connected stays dangerText, Round in is inkMuted, and nothing in the panel is
 * green. The Never connected / D30 footer row is unchanged.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TheLoop } from '@/features/admin/pages/DashboardPage';
import { adminTheme as t } from '@/features/admin/theme';
import type { CommandCentre } from '@/features/admin/hooks/useCommandCentre';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

const DASH = '\u2014';

function cc(loop: CommandCentre['loop']): CommandCentre {
  return {
    loop,
    moat: { rounds_total: 0, holes_total: 0, courses_played: 0, catalogue_total: 23300, reviews_total: 0, rounds_7d: 0, holes_7d: 0, reviews_7d: 0, rounds_daily_28: [], reviews_daily_28: [], courses_played_daily_28: [] },
    do_now: { stuck_rounds: { rounds: 0, members: 0, oldest_days: 0 }, played_not_connected: { members: 0, oldest_days: 0 }, gone_quiet: { members: 0, oldest_days: 0, names: [] }, inbox: { claims: 0, course_requests: 0, tickets: 0, oldest_days: 0 } },
    growth: { signups_7d: 0, signups_prev_7d: 0, signups_daily_14: [], invites_sent_7d: 0, invites_joined_7d: 0 },
    rounds_by_day: [],
    rounds_7d_members: 0,
    rounds_prev_7d: 0,
    clubhouse: { posts_7d: 0, posts_prev_7d: 0, reactions_7d: 0, reactions_per_post: 0, reviews_7d: 0, reviews_prev_7d: 0, unseen_7d: 0, top: [] },
    computed_at: '2026-10-12T08:56:00Z',
  };
}

// Production figures, 12 Oct 2026: 111 joined, 25 connected, 25 with a round in.
const PRODUCTION = cc({ joined: 111, connected: 25, round_in: 25, posted: 25, weekly: 8, never_connected: 86, d30_connected_pct: 40, d30_not_connected_pct: 60 });

/** The row grid carrying `label`: [label, bar, figure, percentage]. */
function row(label: string) {
  const el = screen.getByText(label).parentElement as HTMLElement;
  return { bar: el.children[1] as HTMLElement, figure: el.children[2] as HTMLElement, pct: el.children[3] as HTMLElement };
}

/** jsdom serialises colours as rgb(); accept either spelling of a token. */
const isColor = (el: HTMLElement, token: string) => {
  if (el.style.color === token) return true;
  const n = parseInt(token.slice(1), 16);
  return el.style.color === `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

const panel = (data: CommandCentre) =>
  render(<TheLoop data={data} loading={false} failed={false} />).container as HTMLElement;

describe('The loop — three rows, share of joined', () => {
  it('shows Joined, Connected and Round in only', () => {
    panel(PRODUCTION);
    expect(screen.getByText('Joined')).toBeTruthy();
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.getByText('Round in')).toBeTruthy();
    expect(screen.queryByText('Posted')).toBeNull();
    expect(screen.queryByText('Weekly')).toBeNull();
  });

  it('states every percentage as a share of joined, and none for joined itself', () => {
    panel(PRODUCTION);
    expect(row('Joined').figure.textContent).toBe('111');
    expect(row('Joined').pct.textContent).toBe('');
    expect(row('Connected').figure.textContent).toBe('25');
    expect(row('Connected').pct.textContent).toBe('23%');
    expect(row('Round in').figure.textContent).toBe('25');
    expect(row('Round in').pct.textContent).toBe('23%');
  });

  it('draws each bar against joined, so bar and percentage agree', () => {
    panel(PRODUCTION);
    expect(row('Joined').bar.style.width).toBe('100%');
    expect(parseFloat(row('Connected').bar.style.width)).toBeGreaterThan(22);
    expect(parseFloat(row('Connected').bar.style.width)).toBeLessThan(23);
  });

  it('keeps connected dangerText, round in inkMuted, and no green anywhere', () => {
    const el = panel(PRODUCTION);
    expect(isColor(row('Connected').pct, t.dangerText)).toBe(true);
    expect(isColor(row('Round in').pct, t.inkMuted)).toBe(true);
    for (const span of Array.from(el.querySelectorAll('span'))) {
      expect(isColor(span as HTMLElement, t.okText)).toBe(false);
    }
  });

  it('labels the column share of all members', () => {
    panel(PRODUCTION);
    expect(screen.getByText('share of all members')).toBeTruthy();
  });

  it('leaves the never connected / D30 footer row intact, dashes for null', () => {
    panel(PRODUCTION);
    expect(screen.getByText('Never connected').parentElement?.textContent).toBe('Never connected86');
    expect(screen.getByText('D30 · connected').parentElement?.textContent).toBe('D30 · connected40%');
    expect(screen.getByText('D30 · not').parentElement?.textContent).toBe('D30 · not60%');

    render(<TheLoop data={cc({ joined: 111, connected: 25, round_in: 25, posted: 25, weekly: 8, never_connected: 86, d30_connected_pct: null, d30_not_connected_pct: null })} loading={false} failed={false} />);
    expect(screen.getAllByText(DASH)).toHaveLength(2);
  });
});
