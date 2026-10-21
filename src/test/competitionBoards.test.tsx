import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import en from '../../public/locales/en/courses.json';
import { CompetitionBoards } from '@/components/explore-tab-new/courseled/CompetitionBoards';
import { competitionRpcArgs, groupCompetitionCards, type CompetitionBoardRow } from '@/components/explore-tab-new/courseled/hooks/useCompetitionBoards';

const f = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));
const i18n = createInstance();
await i18n.init({ lng: 'en', fallbackLng: 'en', ns: ['courses'], defaultNS: 'courses', resources: { en: { courses: en } }, interpolation: { escapeValue: false } });

function row(over: Partial<CompetitionBoardRow> = {}): CompetitionBoardRow {
  return { comp_date: '2026-10-11', course_id: 'west', course_name: 'West', rounds: 8, members: 8, pos: 1, is_tie: false,
    user_id: 'u1', display_name: 'One', whs_score_id: 's1', profile_photo_url: null, net_score: 68, gross_score: 77, course_par: 72, ...over };
}
function mount(scope: 'everyone' | 'circle' = 'everyone', enabled = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><I18nextProvider i18n={i18n}><CompetitionBoards viewerId="v" scope={scope as never} enabled={enabled} onRowPress={() => {}} /></I18nextProvider></QueryClientProvider>);
}
const q = (s: string) => document.querySelectorAll(s);
beforeEach(() => { f.rpc.mockReset(); });

describe('CB1 competition boards', () => {
  it('follows scope, fixed 30-day window, whole field in one call', () => {
    expect(competitionRpcArgs('v', 'circle' as never)).toEqual({ p_viewer: 'v', p_scope: 'circle', p_window: '30', p_min_members: 3, p_podium: 100, p_limit: 3 });
  });
  it('groups by course and date together, in returned order', () => {
    const cards = groupCompetitionCards([
      row({ course_id: 'b', comp_date: '2026-10-11' }), row({ course_id: 'a', comp_date: '2026-10-11', pos: 1 }),
      row({ course_id: 'b', comp_date: '2026-10-11', pos: 2 }), row({ course_id: 'b', comp_date: '2026-09-26' }),
    ]);
    expect(cards.map((c) => [c.course_id, c.comp_date, c.rows.length])).toEqual([['b', '2026-10-11', 2], ['a', '2026-10-11', 1], ['b', '2026-09-26', 1]]);
  });
  it('renders nothing for an empty result and nothing while unsettled', async () => {
    f.rpc.mockResolvedValue({ data: [], error: null });
    const { container } = mount();
    await waitFor(() => expect(f.rpc).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
    f.rpc.mockReturnValue(new Promise(() => {}));
    const pending = mount('circle');
    expect(pending.container.innerHTML).toBe('');
  });
  it('renders cards, rows, tie markers and the uncounted CTA on every card', async () => {
    f.rpc.mockResolvedValue({ data: [
      row({ pos: 1 }), row({ pos: 2, is_tie: true, user_id: 'u2', whs_score_id: 's2' }), row({ pos: 2, is_tie: true, user_id: 'u3', whs_score_id: 's3' }),
      row({ course_id: 'east', comp_date: '2026-09-26', members: 3, pos: 1 }),
    ], error: null });
    mount();
    await waitFor(() => expect(q('[data-competitions-section]').length).toBe(1));
    expect(q('[data-competition-card]').length).toBe(2);
    expect(q('[data-competition-row]').length).toBe(4);
    const first = q('[data-competition-row]')[1].firstElementChild!.textContent;
    expect(first).toBe('T2');
    /* CB3: the "{n} more played" line is gone; every card carries the same
     * uncounted "See all players" CTA whatever the field size. */
    expect(screen.getAllByRole('button', { name: 'See all members' }).length).toBe(2);
    expect(document.querySelector('[data-competition-rest]')).toBeNull();
  });
  it('card shows three of the field; sheet shows every row from the same single call, tinting only the viewer', async () => {
    const field = [1, 2, 2, 4, 5].map((pos, i) => row({ pos, is_tie: pos === 2, user_id: i === 1 ? 'v' : `u${i}`, whs_score_id: `s${i}`, members: 5 }));
    f.rpc.mockResolvedValue({ data: field, error: null });
    mount();
    await waitFor(() => expect(q('[data-competition-card]').length).toBe(1));
    expect(q('[data-competition-row]').length).toBe(3);
    fireEvent.click(screen.getByRole('button', { name: 'See all members' }));
    await waitFor(() => expect(q('[data-competition-field]').length).toBe(1));
    expect(q('[data-competition-field-row]').length).toBe(5);
    expect([...q('[data-competition-field-row]')].map((r) => r.firstElementChild!.textContent)).toEqual(['1', 'T2', 'T2', '4', '5']);
    expect(q('[data-competition-field-row][data-self]').length).toBe(1);
    expect(f.rpc).toHaveBeenCalledTimes(1);
  });
  it('a card of three members carries the same CTA and still opens the sheet', async () => {
    f.rpc.mockResolvedValue({ data: [row({ members: 3 })], error: null });
    mount();
    await waitFor(() => expect(q('[data-competition-card]').length).toBe(1));
    expect(screen.getByRole('button', { name: 'See all members' })).toBeTruthy();
    /* CB4.7: the card root is no longer the button — the sheet opens from the
     * title/subtitle area (and the CTA); a podium row opens the scorecard. */
    fireEvent.click(q('[data-competition-open]')[0]);
    await waitFor(() => expect(q('[data-competition-field]').length).toBe(1));
  });
  /* CB10: the field sheet's subtitle is a sentence — it keeps the FULL word
   * "Competition" (never the row mark's "Comp") beside exactly one trophy. */
  it('field sheet subtitle carries the full word "Competition" and one trophy', async () => {
    f.rpc.mockResolvedValue({ data: [row({ members: 3 })], error: null });
    mount();
    await waitFor(() => expect(q('[data-competition-card]').length).toBe(1));
    fireEvent.click(screen.getByRole('button', { name: 'See all members' }));
    await waitFor(() => expect(q('[data-competition-field]').length).toBe(1));
    const subtitle = document.querySelector('#competition-field-title + div');
    if (!subtitle) throw new Error('Missing competition sheet subtitle');
    expect(subtitle.textContent).toContain('Competition');
    expect(subtitle.querySelectorAll('svg').length).toBe(1);
  });
  it('CB16 renders the member-field limit only in the sheet, never on the rail card', async () => {
    f.rpc.mockResolvedValue({ data: [row({ members: 3 })], error: null });
    mount();
    await waitFor(() => expect(q('[data-competition-card]').length).toBe(1));
    const limit = "Members who played this competition. Golfers not on clbhouz aren't shown.";
    expect(screen.queryByText(limit)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'See all members' }));
    await waitFor(() => expect(q('[data-competition-field]').length).toBe(1));
    expect(screen.getAllByText(limit)).toHaveLength(1);
    expect(screen.getByRole('dialog')).toContainElement(screen.getByText(limit));
    expect(q('[data-competition-card]')[0]).not.toContainElement(screen.getByText(limit));
  });
});

describe('CB33 competitions honour S5.4', () => {
  it('the viewer position and name are amber in the field sheet; another member is not', async () => {
    const { A } = await import('@/components/explore-tab-new/courseled/tokens');
    f.rpc.mockResolvedValue({ data: [row({ pos: 1, user_id: 'u1', whs_score_id: 's1' }), row({ pos: 2, user_id: 'v', whs_score_id: 's2', display_name: 'Me' })], error: null });
    mount();
    await waitFor(() => expect(q('[data-competition-card]').length).toBe(1));
    fireEvent.click(screen.getByRole('button', { name: 'See all members' }));
    await waitFor(() => expect(q('[data-competition-field]').length).toBe(1));
    const rows = [...q('[data-competition-field-row]')] as HTMLElement[];
    const parts = (r: HTMLElement) => { const s = r.querySelectorAll(':scope > span'); return { pos: s[0] as HTMLElement, name: s[2] as HTMLElement }; };
    const mine = parts(rows.find((r) => r.hasAttribute('data-self'))!);
    const other = parts(rows.find((r) => !r.hasAttribute('data-self'))!);
    expect(mine.pos).toHaveStyle({ color: A.AMBER });
    expect(mine.name).toHaveStyle({ color: A.AMBER });
    expect(other.pos).toHaveStyle({ color: A.FAINT });
    expect(other.pos).not.toHaveStyle({ color: A.AMBER });
    expect(other.name).not.toHaveStyle({ color: A.AMBER });
  });
});
