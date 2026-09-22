import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import {
  RoundCardHoleStrip,
  type HoleRow,
} from '@/components/profile/handicap/whs/sections/round-card/RoundCardHoleStrip';

const holes = (count: number, playedTo = count): HoleRow[] =>
  Array.from({ length: count }, (_, index) => ({
    hole_no: index + 1,
    par: 4,
    actual_gross: index + 1 <= playedTo ? 5 : null,
    adjusted_gross: null,
    played: index + 1 <= playedTo,
  }));

function rowSummary(container: HTMLElement, label: 'OUT' | 'IN'): string {
  const labelNode = Array.from(container.querySelectorAll('div')).find(
    (node) => node.textContent === label,
  );
  return labelNode?.parentElement?.lastElementChild?.textContent ?? '';
}

describe('RoundCardHoleStrip nine completeness', () => {
  it('keeps the complete front nine and suppresses the incomplete back-nine delta', () => {
    const { container } = render(<RoundCardHoleStrip holes={holes(18, 10)} />);

    expect(rowSummary(container, 'OUT')).toBe('45+9');
    expect(rowSummary(container, 'IN')).toBe('5');
  });

  it('keeps both complete nines unchanged on a complete eighteen', () => {
    const { container } = render(<RoundCardHoleStrip holes={holes(18)} />);

    expect(rowSummary(container, 'OUT')).toBe('45+9');
    expect(rowSummary(container, 'IN')).toBe('45+9');
  });

  it('keeps the one complete nine unchanged on a nine-hole round', () => {
    const { container } = render(<RoundCardHoleStrip holes={holes(9)} />);

    expect(rowSummary(container, 'OUT')).toBe('45+9');
    expect(container.textContent).not.toContain('IN');
  });
});