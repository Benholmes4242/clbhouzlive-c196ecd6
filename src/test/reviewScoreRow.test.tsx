import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ReviewScoreRow } from '@/components/shared/ReviewScoreRow';

const full = { design: 8.9, condition: 9, clubhouse: 8.7, facilities: 8 };
const labels = (c: HTMLElement) => [...c.querySelectorAll('[data-score-label]')].map((n) => n.textContent);

describe('ReviewScoreRow', () => {
  it('renders cells in order overall, design, condition, clubhouse, facilities', () => {
    const { container } = render(<ReviewScoreRow overall={9.2} breakdown={full} />);
    expect([...container.querySelectorAll('[data-score-cell]')].map((n) => n.getAttribute('data-score-cell')))
      .toEqual(['overall', 'design', 'condition', 'clubhouse', 'facilities']);
    expect([...container.querySelectorAll('[data-score-figure]')].map((n) => n.textContent)).toEqual(['9.2', '8.9', '9.0', '8.7', '8.0']);
  });
  it('omits null cells', () => {
    const { container } = render(<ReviewScoreRow overall={null} breakdown={{ ...full, condition: null, facilities: null }} />);
    expect(labels(container)).toEqual(['DESIGN', 'CLUBHOUSE']);
  });
  it('renders nothing when every value is null', () => {
    const { container } = render(<ReviewScoreRow overall={null} breakdown={{ design: null, condition: null, clubhouse: null, facilities: null }} />);
    expect(container.innerHTML).toBe('');
  });
  it('is a centred flex row with gap 15 by default, left when asked', () => {
    const { container, rerender } = render(<ReviewScoreRow overall={9} breakdown={full} />);
    const row = container.querySelector('[data-review-score-row]') as HTMLElement;
    expect(row.style.display).toBe('flex');
    expect(row.style.justifyContent).toBe('center');
    expect(row.style.gap).toBe('15px');
    expect(row.style.textShadow).toBe('');
    rerender(<ReviewScoreRow overall={9} breakdown={full} align="left" textShadow="0 1px 2px black" />);
    expect(row.style.justifyContent).toBe('flex-start');
    expect(row.style.textShadow).not.toBe('');
  });
  it('paints every figure #FFFFFF at 13.5px', () => {
    const { container } = render(<ReviewScoreRow overall={4.1} breakdown={full} />);
    for (const f of container.querySelectorAll<HTMLElement>('[data-score-figure]')) {
      expect(f.style.color).toBe('rgb(255, 255, 255)');
      expect(f.style.fontSize).toBe('13.5px');
    }
  });
  it('sets labels at 7px uppercase with positive tracking', () => {
    const { container } = render(<ReviewScoreRow overall={9} breakdown={full} />);
    for (const l of container.querySelectorAll<HTMLElement>('[data-score-label]')) {
      expect(l.style.fontSize).toBe('7px');
      expect(l.style.textTransform).toBe('uppercase');
      expect(l.style.letterSpacing).toBe('0.14em');
    }
  });
});
