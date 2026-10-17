/**
 * YOU_TAB_STATE_2 — branch B (no handicap) on a course WITH tracked rounds.
 * Source guards for the data-gated branch, plus a render check of the hole
 * facts rule (hardest / easiest = highest / lowest avg over par).
 */
import fs from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (o?.ordinal ? `${k}:${o.ordinal}` : k) }),
}));

import { FieldHoleFacts } from '@/components/courses/course-detail/you/NotConnectedInvitation';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';

const tab = fs.readFileSync(path.resolve(process.cwd(), 'src/components/courses/course-detail/CourseYouTab.tsx'), 'utf8');

describe('YOU_TAB_STATE_2', () => {
  it('Z1: the "Field average here" strip is gone from the tab', () => {
    expect(tab).not.toContain('CenteredStatStrip');
    expect(tab).not.toContain("youTab.fieldAverageHere");
  });

  it('Z2/Z3: the verdict renders only with rounds and a known inclusive over-par figure', () => {
    expect(tab).toContain('{!zeroRounds && fieldOverPar != null && fieldOverPar > 0');
    expect(tab).toContain('overPar={fieldOverPar}');
  });

  it('Z7: Up for grabs still renders on courses with rounds', () => {
    expect(tab).toContain('{zeroRounds ? null : upForGrabs}');
  });

  it('Z4: hardest is the highest avg over par, the let-off the lowest, the cost is the hardest figure', () => {
    const h = (hole_no: number, avg_to_par: number) => ({ hole_no, avg_to_par } as unknown as CourseHole);
    const { container } = render(<FieldHoleFacts holes={[h(1, 0.4), h(11, 0.1), h(7, 0.9), h(18, 1.12)]} />);
    const text = container.textContent ?? '';
    expect(text).toContain('18courseDetail.youTab.holeFacts.hardest');
    expect(text).toContain('11courseDetail.youTab.holeFacts.letOff');
    expect(text).toContain('+1.1courseDetail.youTab.holeFacts.costs:18th');
  });
});
