import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { CareerRow } from '@/hooks/top100/useTop100Race';

const f = vi.hoisted(() => ({
  boards: {} as Record<string, { rows: CareerRow[] } | { error: true }>,
  placeholder: false,
  progressLen: 100,
  lastMetric: '' as string,
  progressSheet: null as null | { ownerUserId: string; listSlug: string; standing?: { place: number; fieldSize: number } | null },
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/top100/useTop100Race', () => ({
  TOP100_METRIC: { 'gb-i': 'top_100_gbni_distinct', global: 'top_100_worldwide_distinct', europe: 'top_100_europe_distinct', usa: 'top_100_usa_distinct' },
  useCareerBoard: (_viewerId: string | undefined, metric: string) => {
    f.lastMetric = metric;
    const b = f.boards[metric];
    return { data: b && 'rows' in b ? b.rows : [], isPlaceholderData: f.placeholder, isError: Boolean(b && 'error' in b), isFetched: true, status: 'success' };
  },
}));
vi.mock('@/hooks/gam/useTop100ListProgress', () => ({ useTop100ListProgress: () => ({ data: new Array(f.progressLen).fill(0), isPending: false }) }));
vi.mock('@/components/ui/BottomSheet', () => ({ BottomSheet: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div> }));
vi.mock('@/components/ui/SquircleAvatar', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/ui/SquircleAvatar')>()),
  SquircleAvatar: ({ hideRing, size }: { hideRing?: boolean; size: number }) => <span data-avatar-size={size} data-hide-ring={String(hideRing === true)} />,
}));
vi.mock('@/components/top100/sheets/Top100ListProgressSheet', () => ({ Top100ListProgressSheet: (props: object) => { f.progressSheet = props as typeof f.progressSheet; return <div data-progress-sheet />; } }));
import { Top100Leaderboard } from '@/components/courses/top100/Top100Leaderboard';

/* jsdom never applies this stylesheet, so divider and scoping checks read the file. */
const compareCss = readFileSync(resolve(__dirname, '../components/courses/top100/top100Compare.css'), 'utf8');

const row = (pos: number, name: string, v: number, opts: Partial<CareerRow> = {}): CareerRow => ({
  pos, is_tie: false, user_id: name, display_name: name, photo_url: null, home_club: null,
  value: v, field_avg: null, last_course_name: 'Royal County Down · Championship', total_members: 35, is_viewer: false, ...opts,
});
/** Live GB&I shape: 35 rows, leader 39, viewer 4th on 23. */
const gbiRows: CareerRow[] = [
  row(1, 'Andrew Yetzes', 39), row(2, 'AFC89', 38), row(3, 'Mark Eldridge', 28),
  row(4, 'Benjamin Holmes', 23, { user_id: 'me', is_viewer: true }),
  ...Array.from({ length: 31 }, (_, i) => row(i + 5, `Member ${i + 5}`, 20 - i > 0 ? 20 - i : 1)),
];
/** Live Europe shape: the viewer shares =3rd. */
const europeRows: CareerRow[] = [
  row(1, 'Andrew Yetzes', 14), row(2, 'Mark Eldridge', 7),
  row(3, 'AFC89', 4, { is_tie: true }), row(3, 'Benjamin Holmes', 4, { user_id: 'me', is_viewer: true, is_tie: true }), row(3, 'Thomas Holmes', 4, { is_tie: true }),
  row(6, 'Danny Blake', 3),
];
/** Live USA shape: one row, no viewer. */
const usaRows: CareerRow[] = [row(1, 'Lennon Hill', 1, { total_members: 1 })];
const METRIC = { 'gb-i': 'top_100_gbni_distinct', global: 'top_100_worldwide_distinct', europe: 'top_100_europe_distinct', usa: 'top_100_usa_distinct' } as const;
const useLiveBoards = () => { f.boards = { [METRIC['gb-i']]: { rows: gbiRows }, [METRIC.europe]: { rows: europeRows }, [METRIC.usa]: { rows: usaRows }, [METRIC.global]: { rows: [] } }; };

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider></MemoryRouter>;
}
const renderCard = (viewerId: string | undefined, list: 'gb-i' | 'global' | 'europe' | 'usa' = 'gb-i', listSize = 100) =>
  render(<Top100Leaderboard viewerId={viewerId} list={list} listSize={listSize} />, { wrapper });
const openSheet = () => { fireEvent.click(screen.getByRole('button', { name: /Who's played the most/ })); return screen.getByRole('dialog'); };

afterEach(cleanup);
beforeEach(() => { f.placeholder = false; f.progressLen = 100; f.lastMetric = ''; f.progressSheet = null; useLiveBoards(); });

describe('page card', () => {
  it('placeholder data after a settled board keeps the card mounted', () => {
    const { rerender } = renderCard(undefined);
    const card = screen.getByRole('button', { name: /Who's played the most/ });
    f.placeholder = true;
    rerender(<Top100Leaderboard viewerId={undefined} list="global" listSize={100} />);
    expect(screen.getByRole('button', { name: /Who's played the most/ })).toBe(card);
    expect(card.textContent).toContain('Andrew Yetzes leads on 39.');
    f.placeholder = false;
    rerender(<Top100Leaderboard viewerId={undefined} list="global" listSize={100} />);
    expect(screen.queryByRole('button', { name: /Who's played the most/ })).toBeNull();
  });
  it('a guest sees the leader and the member count', () => {
    const { container } = renderCard(undefined);
    const card = container.querySelector('.t100b-lb-card')!;
    expect(card.textContent).toContain("Who's played the most");
    expect(card.textContent).toBe("Who's played the mostAndrew Yetzes leads on 39. 35 members have played one.");
    expect(container.querySelectorAll('.t100b-lb-av')).toHaveLength(3);
  });
  it('a one-row board reads "1 member has played one."', () => {
    renderCard(undefined, 'usa');
    expect(screen.getByRole('button', { name: /Who's played the most/ }).textContent).toContain('Lennon Hill leads on 1. 1 member has played one.');
  });
  it('the viewer leading outright reads the gap ahead of second', () => {
    f.boards[METRIC['gb-i']] = { rows: [row(1, 'Benjamin Holmes', 39, { user_id: 'me', is_viewer: true }), row(2, 'AFC89', 38)] };
    renderCard('me');
    expect(screen.getByRole('button', { name: /Who's played the most/ }).textContent).toContain('You lead on 39, 1 ahead of AFC89.');
  });
  it('the viewer leading without a second row ends after the value', () => {
    f.boards[METRIC['gb-i']] = { rows: [row(1, 'Benjamin Holmes', 39, { user_id: 'me', is_viewer: true })] };
    renderCard('me');
    expect(screen.getByRole('button', { name: /Who's played the most/ }).textContent).toContain('You lead on 39.');
  });
  it('the viewer tied for the lead shares it', () => {
    f.boards[METRIC['gb-i']] = { rows: [row(1, 'Benjamin Holmes', 4, { user_id: 'me', is_viewer: true, is_tie: true }), row(1, 'AFC89', 4, { is_tie: true })] };
    renderCard('me');
    expect(screen.getByRole('button', { name: /Who's played the most/ }).textContent).toContain('You share the lead on 4.');
  });
  it('the viewer on the board reads their position of the field', () => {
    renderCard('me');
    expect(screen.getByRole('button', { name: /Who's played the most/ }).textContent).toContain("Andrew Yetzes leads on 39. You're 4th of 35.");
  });
  it('the viewer off the board has not played one yet', () => {
    renderCard('me', 'usa');
    expect(screen.getByRole('button', { name: /Who's played the most/ }).textContent).toContain("Lennon Hill leads on 1. You haven't played one yet.");
  });
  it('the card is absent with zero rows or an error', () => {
    f.boards[METRIC['gb-i']] = { rows: [] };
    const { container, unmount } = renderCard('me');
    expect(container.querySelector('.t100b-lb-card')).toBeNull();
    unmount();
    f.boards[METRIC['gb-i']] = { error: true };
    const again = renderCard('me');
    expect(again.container.querySelector('.t100b-lb-card')).toBeNull();
  });
});

describe('leaderboard sheet', () => {
  it('sheet row positions are 1, 2, =3 without ordinal suffixes', () => {
    renderCard(undefined, 'europe');
    const dialog = openSheet();
    expect(Array.from(dialog.querySelectorAll('.t100b-lb-pos'), el => el.textContent)).toEqual(['1', '2', '=3', '=3', '=3', '6']);
  });
  it('sheet avatars receive hideRing', () => {
    renderCard(undefined, 'europe');
    const dialog = openSheet();
    const avatars = dialog.querySelectorAll('[data-avatar-size="40"]');
    expect(avatars).toHaveLength(6);
    for (const avatar of avatars) expect(avatar).toHaveAttribute('data-hide-ring', 'true');
  });
  it('opens on the page list, and switching tabs changes the metric but not the page list', () => {
    const { container } = renderCard('me', 'gb-i');
    const dialog = openSheet();
    expect(f.lastMetric).toBe('top_100_gbni_distinct');
    expect(within(dialog).getByRole('button', { name: 'GB&I' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(dialog).getByRole('button', { name: 'USA' }));
    expect(f.lastMetric).toBe('top_100_usa_distinct');
    expect(within(dialog).getByRole('button', { name: 'USA' }).getAttribute('aria-pressed')).toBe('true');
    /* The page card still reads the page's GB&I board. */
    expect(container.querySelector('.t100b-lb-card')!.textContent).toContain("Andrew Yetzes leads on 39. You're 4th of 35.");
  });
  it('header copy appears exactly once', () => {
    renderCard('me');
    const dialog = openSheet();
    expect(within(dialog).getAllByText('TOP 100 LEADERBOARD')).toHaveLength(1);
    expect(within(dialog).getAllByText("Who's played the most")).toHaveLength(1);
  });
  it('guest summary names the leader and counts members, with no bar', () => {
    renderCard(undefined);
    const dialog = openSheet();
    expect(dialog.querySelector('.t100b-lb-sumt')!.textContent).toBe('Andrew Yetzes leads the GB&I Top 100 on 39. 35 members have played at least one.');
    expect(dialog.querySelector('.t100b-lb-bar')).toBeNull();
  });
  it('one-row guest summary singularises the member count', () => {
    renderCard(undefined, 'usa');
    const dialog = openSheet();
    expect(dialog.querySelector('.t100b-lb-sumt')!.textContent).toBe('Lennon Hill leads the USA Top 100 on 1. 1 member has played at least one.');
  });
  it('the viewer off the board is told so, and the leader follows', () => {
    renderCard('me', 'usa');
    const dialog = openSheet();
    expect(dialog.querySelector('.t100b-lb-sumt')!.textContent).toBe("You haven't played any of the USA Top 100 yet. Lennon Hill leads on 1.");
  });
  it('the leading viewer reads the gap ahead of second', () => {
    f.boards[METRIC['gb-i']] = { rows: [row(1, 'Benjamin Holmes', 39, { user_id: 'me', is_viewer: true }), row(2, 'AFC89', 38)] };
    renderCard('me');
    const dialog = openSheet();
    expect(dialog.querySelector('.t100b-lb-sumt')!.textContent).toBe('You lead the GB&I Top 100 on 39, 1 ahead of AFC89.');
  });
  it('the tied viewer shares the lead', () => {
    f.boards[METRIC['gb-i']] = { rows: [row(1, 'Benjamin Holmes', 4, { user_id: 'me', is_viewer: true, is_tie: true }), row(1, 'AFC89', 4, { is_tie: true })] };
    renderCard('me');
    const dialog = openSheet();
    expect(dialog.querySelector('.t100b-lb-sumt')!.textContent).toBe('You share the lead on the GB&I Top 100 on 4.');
  });
  it('the viewer on the board reads value, position and the gap behind the leader', () => {
    renderCard('me');
    const dialog = openSheet();
    expect(dialog.querySelector('.t100b-lb-sumt')!.textContent).toBe("You've played 23 of the GB&I Top 100. 4th of 35, 16 behind Andrew Yetzes.");
  });
  it('the leader label left-aligns and drops 0 when the tick is under 18%', () => {
    renderCard('me', 'usa');
    const dialog = openSheet();
    const labels = [...dialog.querySelectorAll('.t100b-lb-labels span')] as HTMLElement[];
    expect(labels.map(s => s.textContent)).toEqual(['LEADER 1', '100']);
    expect(labels[0].style.left).toBe('0px');
  });
  it('the leader label right-aligns and drops the list size when the tick is over 82%', () => {
    f.boards[METRIC['gb-i']] = { rows: [row(1, 'Andrew Yetzes', 95), row(2, 'Benjamin Holmes', 90, { user_id: 'me', is_viewer: true })] };
    renderCard('me');
    const dialog = openSheet();
    const labels = [...dialog.querySelectorAll('.t100b-lb-labels span')] as HTMLElement[];
    expect(labels.map(s => s.textContent)).toEqual(['0', 'LEADER 95']);
    expect(labels[1].style.right).toBe('0px');
  });
  it('the viewer row says You with the raised background, and ties print =3', () => {
    renderCard('me', 'europe');
    const dialog = openSheet();
    const you = dialog.querySelector('.t100b-lb-row.you')!;
    expect(you.querySelector('.t100b-lb-rn')!.textContent).toBe('You');
    expect(you.querySelector('.t100b-lb-pos')!.textContent).toBe('=3');
    expect(dialog.querySelector('.t100b-lb-rows')!.textContent).toContain('=3');
  });
  it('a row tap opens the member progress sheet with that member and standing', () => {
    renderCard('me');
    const dialog = openSheet();
    fireEvent.click(within(dialog).getByRole('button', { name: /AFC89/ }));
    expect(f.progressSheet).toMatchObject({ ownerUserId: 'AFC89', listSlug: 'gb-i', standing: { place: 2, fieldSize: 35 } });
  });
  it('the Your courses row opens the viewer’s sheet, and is absent when the viewer is off the board', () => {
    const { unmount } = renderCard('me');
    let dialog = openSheet();
    fireEvent.click(within(dialog).getByRole('button', { name: /Your 23 GB&I Top 100 courses/ }));
    expect(f.progressSheet).toMatchObject({ ownerUserId: 'me', listSlug: 'gb-i', standing: { place: 4, fieldSize: 35 } });
    unmount();
    f.progressSheet = null;
    renderCard('me', 'usa');
    dialog = openSheet();
    expect(within(dialog).queryByRole('button', { name: /Top 100 courses/ })).toBeNull();
    expect(f.progressSheet).toBeNull();
  });
  it('no sheet element carries a divider border, inline or in the scoped CSS', () => {
    renderCard('me');
    const dialog = openSheet();
    for (const el of dialog.querySelectorAll<HTMLElement>('*')) {
      expect(el.style.borderTop).toBe('');
      expect(el.style.borderBottom).toBe('');
    }
    const lbRules = compareCss.split('}').filter(r => r.includes('.t100b-lb')).join('}');
    expect(lbRules).not.toMatch(/border-(top|bottom)/);
  });
  it('every control is a native button without the shared Button classes', () => {
    renderCard('me');
    const dialog = openSheet();
    for (const button of document.querySelectorAll('button')) {
      expect(button.className).not.toMatch(/inline-flex|bg-primary|text-primary-foreground/);
      expect(button.className === '' || button.className.startsWith('t100b-')).toBe(true);
    }
    expect(dialog.querySelectorAll('button').length).toBeGreaterThan(0);
  });
});
