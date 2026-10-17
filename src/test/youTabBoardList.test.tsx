/**
 * YOU_TAB_BOARD_LIST_1 AC6 — the open rows equal the unclaimed count on every
 * state that renders the list (all three draw the one BoardList with the same
 * holder map that unclaimedCount counts).
 */
import fs from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (o?.unclaimed != null ? `${k}:${o.unclaimed}` : k) }),
}));

import { BoardList } from '@/components/courses/course-detail/you/BoardList';
import UpForGrabsSection from '@/components/courses/course-detail/you/UpForGrabsSection';
import type { CourseLegendRow, LegendCategory } from '@/lib/gam/types';

const tab = fs.readFileSync(path.resolve(process.cwd(), 'src/components/courses/course-detail/CourseYouTab.tsx'), 'utf8');


describe('YOU_TAB_BOARD_LIST_1 AC6', () => {
  it('record and two other boards held: no held row, six open rows, heading reads 6', () => {
    const holders = new Map<LegendCategory, CourseLegendRow>();
    (['lowest_gross_all_time', 'most_rounds_all_time', 'most_eagles_all_time'] as LegendCategory[]).forEach((c) =>
      holders.set(c, { category: c, rank: 1 } as unknown as CourseLegendRow),
    );
    const list = render(<BoardList holders={holders} />);
    expect(list.container.querySelectorAll('[data-board-row="held"]').length).toBe(0);
    expect(list.container.querySelectorAll('[data-board-row="open"]').length).toBe(6);
    const section = render(
      <UpForGrabsSection recordValue={76} holders={[]} unclaimedCount={6} yourBest={null} boardHolders={holders} onAllBoards={() => {}} />,
    );
    expect(section.container.textContent).toContain('courseDetail.youTab.grabs.boardsTitle:6');
  });

  it('zero-round course: all nine boards render open', () => {
    const { container } = render(<BoardList holders={new Map()} />);
    expect(container.querySelectorAll('[data-board-row="open"]').length).toBe(9);
  });

  it('states 1, 2 and 3 all pass the same holder map to the one list', () => {
    expect(tab.match(/holders=\{boardHolders\}/g)?.length).toBe(2); // state 1 in branches B and C
    expect(tab).toContain('boardHolders={boardHolders}'); // states 2 and 3 via upForGrabsList
  });
});
