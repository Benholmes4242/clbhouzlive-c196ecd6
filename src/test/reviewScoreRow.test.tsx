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
  it('caption is a centred flex row with gap 15 by default, left when asked', () => {
    const { container, rerender } = render(<ReviewScoreRow variant="caption" overall={9} breakdown={full} />);
    const row = container.querySelector('[data-review-score-row]') as HTMLElement;
    expect(row.style.display).toBe('flex');
    expect(row.style.justifyContent).toBe('center');
    expect(row.style.gap).toBe('15px');
    expect(row.style.textShadow).toBe('');
    rerender(<ReviewScoreRow variant="caption" overall={9} breakdown={full} align="left" textShadow="0 1px 2px black" />);
    expect(row.style.justifyContent).toBe('flex-start');
    expect(row.style.textShadow).not.toBe('');
  });
  it('caption paints every figure #FFFFFF at 13.5px', () => {
    const { container } = render(<ReviewScoreRow variant="caption" overall={4.1} breakdown={full} />);
    for (const f of container.querySelectorAll<HTMLElement>('[data-score-figure]')) {
      expect(f.style.color).toBe('rgb(255, 255, 255)');
      expect(f.style.fontSize).toBe('13.5px');
    }
  });
  it('caption sets labels at 7px uppercase with positive tracking', () => {
    const { container } = render(<ReviewScoreRow variant="caption" overall={9} breakdown={full} />);
    for (const l of container.querySelectorAll<HTMLElement>('[data-score-label]')) {
      expect(l.style.fontSize).toBe('7px');
      expect(l.style.textTransform).toBe('uppercase');
      expect(l.style.letterSpacing).toBe('0.14em');
    }
  });

  it("'card' is the default variant: left-edge grid auto 1fr, aligned to the end", () => {
    const row = render(<ReviewScoreRow overall={9.6} breakdown={full} />).container.querySelector('[data-review-score-row]') as HTMLElement;
    expect(row.getAttribute('data-variant')).toBe('card');
    expect(row.style.display).toBe('grid');
    expect(row.style.gridTemplateColumns).toBe('auto 1fr');
    expect(row.style.alignItems).toBe('end');
    expect(row.style.justifyContent).toBe('');
    expect((row.querySelector('[data-score-breakdown]') as HTMLElement).style.justifyContent).toBe('space-between');
  });
  it('card: overall 26/700, breakdown 16/600, labels 9px at 0.12em, all white', () => {
    const { container } = render(<ReviewScoreRow overall={9.6} breakdown={full} />);
    const ov = container.querySelector('[data-score-cell="overall"] [data-score-figure]') as HTMLElement;
    expect(ov.style.fontSize).toBe('26px'); expect(ov.style.fontWeight).toBe('700');
    const rest = [...container.querySelectorAll<HTMLElement>('[data-score-breakdown] [data-score-figure]')];
    expect(rest.length).toBe(4);
    for (const f of rest) { expect(f.style.fontSize).toBe('16px'); expect(f.style.fontWeight).toBe('600'); expect(f.style.color).toBe('rgb(255, 255, 255)'); }
    for (const l of container.querySelectorAll<HTMLElement>('[data-score-label]')) { expect(l.style.fontSize).toBe('9px'); expect(l.style.letterSpacing).toBe('0.12em'); }
    expect(labels(container)).toEqual(['OVERALL', 'DESIGN', 'CONDITION', 'CLUBHOUSE', 'FACILITIES']);
  });
  it('card: the divider shows only with an overall and at least one breakdown value', () => {
    const ov = (c: HTMLElement) => c.querySelector('[data-score-cell="overall"]') as HTMLElement;
    const both = render(<ReviewScoreRow overall={9} breakdown={{ ...full, design: null, condition: null, clubhouse: null }} />).container;
    expect(ov(both).style.borderRight).toBe('1px solid rgba(255, 255, 255, 0.1)');
    expect(ov(both).style.paddingRight).toBe('16px');
    expect(ov(both).style.marginRight).toBe('16px');
  });
  it('card: overall-only shows the overall alone with no divider', () => {
    const { container } = render(<ReviewScoreRow overall={9} breakdown={{ design: null, condition: null, clubhouse: null, facilities: null }} />);
    expect((container.querySelector('[data-score-cell="overall"]') as HTMLElement).style.borderRight).toBe('');
    expect(container.querySelector('[data-score-breakdown]')).toBeNull();
    expect(labels(container)).toEqual(['OVERALL']);
  });
  it('card: breakdown-only has no overall block and takes the full width', () => {
    const { container } = render(<ReviewScoreRow overall={null} breakdown={{ ...full, clubhouse: null }} />);
    const row = container.querySelector('[data-review-score-row]') as HTMLElement;
    expect(container.querySelector('[data-score-cell="overall"]')).toBeNull();
    expect(row.style.gridTemplateColumns).toBe('1fr');
    expect(labels(container)).toEqual(['DESIGN', 'CONDITION', 'FACILITIES']);
  });
});
