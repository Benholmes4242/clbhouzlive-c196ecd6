import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RoundCardHoleStrip } from '@/components/profile/handicap/whs/sections/round-card/RoundCardHoleStrip';

afterEach(cleanup);
describe('round strip actual strokes', () => {
  it('(e) renders six for a hole with actual 6 and adjusted 5', () => {
    const { container } = render(<RoundCardHoleStrip holes={[
      { hole_no: 1, par: 4, actual_gross: 6, adjusted_gross: 5, played: true },
    ]} />);
    const mark = container.querySelector('[data-score-fill="doub"]')?.parentElement;
    expect(mark?.textContent).toBe('6');
  });
});