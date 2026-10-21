import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';
import { BoardRowView, boardValue, boardSecondary, boardColumns } from '@/components/explore-tab-new/courseled/BoardRows';
import { BoardSeeAllSheet } from '@/components/explore-tab-new/courseled/BoardSeeAllSheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LEADERBOARD_BOARDS } from '@/features/explore-magazine/LeaderboardsSection';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import { A } from '@/components/explore-tab-new/courseled/tokens';

const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', ns: ['courses'], resources: { en: { courses } } });
const row: BoardRow = {
  pos: 1, is_tie: true, user_id: 'member', display_name: 'Member', profile_photo_url: null,
  whs_score_id: 'score', play_date: '2026-10-18', course_id: 'course', course_name: 'Course',
  gross_score: 71, course_par: 72, net_score: 68, stableford_points: 40, delta_index: -1,
  birdies: 4, holes_in_one: 1, albatrosses: null, eagles: 2, clean_card: true, beat_par: true,
  sub_80: true, is_competition: true, hcp_at_time: 4, sort_value: -1, total_count: 1,
  pool_rounds: 1, pool_courses: 1, pool_members: 1,
};
describe('CB27 shared rows', () => {
  it.each([['topar', '71', '−1', 'GROSS'], ['net', '68', '−4', 'NET']] as const)('%s leads with raw score and its own to-par', (board, score, suffix, head) => {
    expect(boardValue(row, board, () => '')).toEqual({ text: score, tone: A.INK });
    expect(boardSecondary(row, board)).toEqual({ text: suffix, tone: A.RED });
    expect(boardColumns(board).value.label).toBe(head);
    expect(boardColumns(board).secondary).toBeNull();
    const { container } = render(<I18nextProvider i18n={i18n}><BoardRowView row={row} board={board} isSelf={false} /></I18nextProvider>);
    const main = container.querySelector('[data-board-main]');
    expect(main?.textContent).toBe(score);
    expect(main?.nextElementSibling?.textContent).toBe(suffix);
  });
  it('suppresses feats on all six choices while the Rare air eagle sheet retains its rarer feat', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    client.setQueryData(['discover', 'board-see-all', 'viewer', 'eagle', DEFAULT_FILTERS], [row]);
    const { container } = render(<MemoryRouter><QueryClientProvider client={client}><I18nextProvider i18n={i18n}>
      {LEADERBOARD_BOARDS.map((board) => <BoardRowView key={board} row={row} board={board} isSelf={false} />)}
      <BoardSeeAllSheet open onClose={() => {}} userId="viewer" board="eagle" filters={DEFAULT_FILTERS} appliedParts={[]} onRowPress={() => {}} />
    </I18nextProvider></QueryClientProvider></MemoryRouter>);
    expect(container.querySelectorAll('[data-board-feat]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-board-competition]')).toHaveLength(6);
    expect(document.querySelector('[role="dialog"] [data-board-feat]')).not.toBeNull();
  });
});