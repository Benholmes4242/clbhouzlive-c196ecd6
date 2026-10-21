import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../public/locales/en/courses.json';
import { ExploreSheetShell } from '@/components/explore-tab-new/courseled/ExploreSheetShell';
import { BoardSeeAllSheet } from '@/components/explore-tab-new/courseled/BoardSeeAllSheet';
import { BoardHeaderRow } from '@/components/explore-tab-new/courseled/BoardRows';
import { CompetitionBoards } from '@/components/explore-tab-new/courseled/CompetitionBoards';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { A } from '@/components/explore-tab-new/courseled/tokens';

const data = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: data.rpc } }));
const i18n = createInstance();
await i18n.init({ lng: 'en', ns: ['courses'], defaultNS: 'courses', resources: { en: { courses: en } } });
function mount(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><I18nextProvider i18n={i18n}>{ui}</I18nextProvider></QueryClientProvider>);
}
beforeEach(() => data.rpc.mockReset());
const subtitleOf = (id: string) => {
  const node = document.querySelector(`#${id} + div`);
  if (!(node instanceof HTMLElement)) throw new Error('Missing subtitle');
  return node;
};

describe('Explore sheet canonical shell', () => {
  it('keeps the original Top 100/Most improved title, cap, columns, above and body structure', () => {
    mount(<ExploreSheetShell open onClose={vi.fn()} titleId="canonical" title="Title" subtitle="Subtitle" valueHeading="Value"
      above={<div data-above />} footnote="Footnote"><div data-body /></ExploreSheetShell>);
    const title = screen.getByRole('heading');
    expect(title).toHaveStyle({ fontSize: '14.5px', fontWeight: '700', color: A.INK });
    expect(subtitleOf('canonical')).toHaveStyle({ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: '2px' });
    const header = title.parentElement?.parentElement;
    expect(header).toHaveStyle({ padding: '12px 16px 13px', flexShrink: '0' });
    const above = document.querySelector('[data-above]');
    expect(header?.nextElementSibling).toBe(above);
    const cols = above?.nextElementSibling;
    expect(cols).toHaveStyle({ padding: '10px 16px 6px', fontSize: '10.5px', letterSpacing: '0.16em' });
    expect(cols?.lastElementChild?.textContent).toBe('Value');
    const body = cols?.nextElementSibling;
    expect(body).toHaveStyle({ flex: '1', overflowY: 'auto', padding: '0 16px 32px' });
    expect(body?.lastElementChild).toHaveStyle({ fontSize: '11.5px', lineHeight: '1.45', padding: '14px 0 8px' });
  });
  it('DONE calls onClose and custom columns replace member/value row', () => {
    const close = vi.fn();
    mount(<ExploreSheetShell open onClose={close} titleId="custom" title="Title" subtitle={<span>Subtitle</span>}
      valueHeading="Unused" columns={<div data-custom-columns />} bodyPadding="0 0 32px"><div /></ExploreSheetShell>);
    expect(screen.queryByText('Unused')).toBeNull();
    expect(document.querySelector('[data-custom-columns]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common.done') }));
    expect(close).toHaveBeenCalledTimes(1);
  });
  it.each(['recent', 'clean_card', 'net'] as const)('board %s moves applied parts and plain count to cap subtitle, without count band', async (board) => {
    data.rpc.mockResolvedValue({ error: null, data: [{ pos: 1, user_id: 'u', whs_score_id: 's', display_name: 'Member', play_date: '2026-10-18', total_count: 22 }] });
    mount(<BoardSeeAllSheet open onClose={vi.fn()} userId="viewer" board={board} filters={DEFAULT_FILTERS}
      appliedParts={['Your circle', 'Last 14 days']} title="Title" />);
    const countKey = board === 'net' ? 'discover.filterBoard.nMembers' : 'discover.filterBoard.nRounds';
    await waitFor(() => expect(subtitleOf('board-see-all-title').textContent).toBe(`Your circle · Last 14 days · ${i18n.t(countKey, { count: 22 })}`));
    const dialog = screen.getByRole('dialog');
    expect(Array.from(dialog.querySelectorAll<HTMLElement>('*')).filter((el) => el.style.fontSize === '24px')).toHaveLength(0);
    const member = screen.getByText(i18n.t('discover.filterBoard.col.member'));
    expect(member).toHaveStyle({ fontSize: '10.5px', letterSpacing: '0.16em' });
  });
  it('on-page column sizing remains unchanged', () => {
    mount(<BoardHeaderRow board="net" />);
    expect(screen.getByText(i18n.t('discover.filterBoard.col.member'))).toHaveStyle({ fontSize: '9.5px', letterSpacing: '0.13em' });
  });
  it('competition DONE closes, footnote follows rows, and only sheet rows use16px insets', async () => {
    data.rpc.mockResolvedValue({ error: null, data: [{ comp_date: '2026-10-18', course_id: 'c', course_name: 'Course', rounds: 3, members: 3, pos: 1,
      is_tie: false, user_id: 'viewer', display_name: 'Member', whs_score_id: 's', profile_photo_url: null, net_score: 72, gross_score: 75, course_par: 72 }] });
    const press = vi.fn();
    mount(<CompetitionBoards viewerId="viewer" scope="everyone" enabled onRowPress={press} />);
    await waitFor(() => expect(screen.queryByRole('button', { name: i18n.t('amateur.leaderboards.seeAllMembers') })).not.toBeNull());
    fireEvent.click(screen.getByRole('button', { name: i18n.t('amateur.leaderboards.seeAllMembers') }));
    const row = document.querySelector('[data-competition-field-row]');
    expect(row).toHaveStyle({ padding: '9px 16px' });
    const foot = screen.getByText(i18n.t('amateur.competitions.fieldLimit'));
    expect(row?.parentElement?.nextElementSibling).toContainElement(foot);
    expect(foot.parentElement).toHaveStyle({ padding: '14px 0 8px', lineHeight: '1.45' });
    if (!(row instanceof HTMLElement)) throw new Error('Missing field row');
    fireEvent.click(row);
    expect(press).toHaveBeenCalledWith(expect.objectContaining({ whs_score_id: 's' }));
    expect(data.rpc).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common.done') }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});