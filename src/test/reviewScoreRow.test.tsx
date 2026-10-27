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
    const breakdown = row.querySelector('[data-score-breakdown]') as HTMLElement;
    expect(breakdown.style.display).toBe('flex');
    expect(breakdown.style.justifyContent).toBe('space-between');
    expect(breakdown.style.columnGap).toBe('8px');
    for (const c of breakdown.querySelectorAll<HTMLElement>('[data-score-cell]')) { expect(c.style.alignItems).toBe('center'); expect(c.style.textAlign).toBe('center'); }
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
    expect(ov(both).style.borderRight).toBe('1px solid rgba(255,255,255,0.10)');
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
  it('card: two null breakdown values drop their cells; the remaining two render in order, centred', () => {
    const { container } = render(<ReviewScoreRow overall={7.4} breakdown={{ ...full, condition: null, facilities: null }} />);
    const breakdown = container.querySelector('[data-score-breakdown]') as HTMLElement;
    expect(breakdown.style.display).toBe('flex');
    expect(breakdown.style.justifyContent).toBe('space-between');
    const cells = [...breakdown.querySelectorAll('[data-score-cell]')] as HTMLElement[];
    expect(cells.map((c) => c.getAttribute('data-score-cell'))).toEqual(['design', 'clubhouse']);
    for (const c of cells) { expect(c.style.alignItems).toBe('center'); expect(c.style.textAlign).toBe('center'); }
  });
  it('card: full row wrapper is an inline-size container; caption is not', () => {
    const { container, rerender } = render(<ReviewScoreRow overall={9} breakdown={full} />);
    const wrapper = container.querySelector('[data-review-score-container]') as HTMLElement;
    expect(wrapper.style.containerType).toBe('inline-size');
    expect(wrapper.querySelector('[data-review-score-row]')).not.toBeNull();
    rerender(<ReviewScoreRow variant="caption" overall={9} breakdown={full} />);
    expect(container.querySelector('[data-review-score-container]')).toBeNull();
    expect(container.querySelector('[data-review-score-container-rules]')).toBeNull();
  });
  it('card: 400px container rule narrows divider spacing, gap and all label tracking', () => {
    const { container } = render(<ReviewScoreRow overall={9} breakdown={full} />);
    const css = container.querySelector('[data-review-score-container-rules]')?.textContent ?? '';
    const rule = css.match(/@container \(max-width: 400px\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(rule).toContain('[data-review-score-row][data-variant="card"] [data-score-cell="overall"][data-score-divider] { padding-right: 12px !important; margin-right: 12px !important; }');
    expect(rule).toContain('[data-score-breakdown] { column-gap: 6px !important; }');
    expect(rule).toContain('[data-score-label] { letter-spacing: 0.04em !important; }');
  });
  it('card: 330px container rule uses 8px labels and a 23px overall figure only', () => {
    const { container } = render(<ReviewScoreRow overall={9} breakdown={full} />);
    const css = container.querySelector('[data-review-score-container-rules]')?.textContent ?? '';
    const rule = css.match(/@container \(max-width: 330px\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(rule).toContain('[data-review-score-row][data-variant="card"] [data-score-label] { font-size: 8px !important; }');
    expect(rule).toContain('[data-review-score-row][data-variant="card"] [data-score-cell="overall"] [data-score-figure] { font-size: 23px !important; }');
  });
});
