/** Signed-off bars use a real translation provider and real scoring/navigation rules. */
import React, { useRef, useState } from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import courses from '@/locales/en/courses.json';
import { OverallScrubber } from '@/features/review-v2/components/OverallScrubber';
import { CategoryGrid, type CategoryCopy } from '@/features/review-v2/components/CategoryGrid';
import { ReviewCategoriesHeading } from '@/features/review-v2/components/ReviewScoreHeadings';
import { SubmitBar } from '@/features/review-v2/components/SubmitBar';
import { barValueFromX, membersComparisonBase, scoreAction } from '@/features/review-v2/lib/scoreStepRules';
import { focusMissingScore } from '@/features/review-v2/lib/scoreStepNavigation';
import type { ReviewComposerState } from '@/features/review-v2/types';

const i18n = createInstance();
void i18n.init({ lng: 'en', fallbackLng: 'en', defaultNS: 'courses', initAsync: false, resources: { en: { courses } }, interpolation: { escapeValue: false } });
const empty: ReviewComposerState = { overall: null, scores: { design: null, condition: null, clubhouse: null, facilities: null }, verdict: null, reviewText: '', shareToFeed: true, teeLabel: null };
const cats: CategoryCopy[] = ['design', 'condition', 'clubhouse', 'facilities'].map(key => ({ key: key as CategoryCopy['key'], label: key, hint: '' }));
const complete = { ...empty.scores, design: 8.5, condition: 8.6, clubhouse: 8.4, facilities: 8.5 };
const props = { ariaLabel: 'Overall', caption: courses.review.wizard.step3.rulerHint };
function mount(node: React.ReactNode) { return render(<I18nextProvider i18n={i18n}>{node}</I18nextProvider>); }
function tap(slider: HTMLElement, x: number) {
  vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 200 } as DOMRect);
  const event = new Event('pointerdown', { bubbles: true });
  Object.defineProperties(event, { clientX: { value: x }, button: { value: 0 } });
  fireEvent(slider, event);
  fireEvent.pointerUp(window);
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('review step two bars', () => {
  it('(a) empty overall has dash, denominator and hint without a comparison', () => {
    const { container } = mount(<OverallScrubber value={null} onChange={vi.fn()} members={{ avg: 8.7, count: 4 }} {...props} />);
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.getByText('/ 10')).toBeTruthy();
    expect(screen.getByText(props.caption)).toBeTruthy();
    expect(container.querySelector('[data-members-comparison]')).toBeNull();
    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('Not scored');
  });
  it('(b) 85.5% rounds to 8.6 with eight full segments and 60% ninth; 2% floors at 1', () => {
    function Overall() { const [value, set] = useState<number | null>(null); return <OverallScrubber value={value} onChange={set} {...props} />; }
    const { container } = mount(<Overall />);
    tap(screen.getByRole('slider'), 171);
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('8.6');
    expect(Array.from(container.querySelectorAll<HTMLElement>('.review-score-segment-fill')).map(el => el.style.width)).toEqual(['100%', '100%', '100%', '100%', '100%', '100%', '100%', '100%', '60%', '0%']);
    tap(screen.getByRole('slider'), 4);
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('1');
  });
  it('(c) keyboard steps tenths and Shift whole points, clamped to 1–10', () => {
    function Overall() { const [value, set] = useState<number | null>(8.6); return <OverallScrubber value={value} onChange={set} {...props} />; }
    mount(<Overall />); const bar = screen.getByRole('slider');
    fireEvent.keyDown(bar, { key: 'ArrowRight' }); expect(bar.getAttribute('aria-valuenow')).toBe('8.7');
    fireEvent.keyDown(bar, { key: 'ArrowDown' }); expect(bar.getAttribute('aria-valuenow')).toBe('8.6');
    fireEvent.keyDown(bar, { key: 'ArrowUp', shiftKey: true }); expect(bar.getAttribute('aria-valuenow')).toBe('9.6');
    fireEvent.keyDown(bar, { key: 'ArrowRight', shiftKey: true }); expect(bar.getAttribute('aria-valuenow')).toBe('10');
    fireEvent.keyDown(bar, { key: 'ArrowLeft', shiftKey: true }); expect(bar.getAttribute('aria-valuenow')).toBe('9');
    fireEvent.keyDown(bar, { key: 'Home' }); fireEvent.keyDown(bar, { key: 'ArrowLeft' }); expect(bar.getAttribute('aria-valuenow')).toBe('1');
  });
  it('(d) compares below, above and Level against the header aggregate', () => {
    const { container, rerender } = mount(<OverallScrubber value={8.6} onChange={vi.fn()} members={{ avg: 8.7, count: 4 }} {...props} />);
    expect(container.querySelector('[data-members-comparison]')?.textContent).toBe("0.1 below the members'average of 8.7");
    rerender(<I18nextProvider i18n={i18n}><OverallScrubber value={8.8} onChange={vi.fn()} members={{ avg: 8.7, count: 4 }} {...props} /></I18nextProvider>);
    expect(container.querySelector('[data-members-comparison] b')?.textContent).toBe('0.1 above');
    rerender(<I18nextProvider i18n={i18n}><OverallScrubber value={8.7} onChange={vi.fn()} members={{ avg: 8.7, count: 4 }} {...props} /></I18nextProvider>);
    expect(container.querySelector('[data-members-comparison] b')?.textContent).toBe('Level');
  });
  it('(e) editing excludes the saved score and hides without other members', () => {
    expect(membersComparisonBase(8, 4, 5)).toBe(9);
    const { container, rerender } = mount(<OverallScrubber value={8.6} onChange={vi.fn()} members={{ avg: 8, count: 4 }} savedRating={5} {...props} />);
    expect(container.querySelector('[data-members-comparison]')?.getAttribute('data-difference')).toBe('-0.4');
    rerender(<I18nextProvider i18n={i18n}><OverallScrubber value={8.6} onChange={vi.fn()} members={{ avg: 5, count: 1 }} savedRating={5} {...props} /></I18nextProvider>);
    expect(container.querySelector('[data-members-comparison]')).toBeNull();
    expect(membersComparisonBase(8, 0)).toBeNull();
  });
  it('(f) categories show dash then the set value, without prompts or checks', () => {
    const { container, rerender } = mount(<CategoryGrid cats={cats} values={empty.scores} onChange={vi.fn()} />);
    expect(Array.from(container.querySelectorAll('.review-score-category-value')).map(el => el.textContent)).toEqual(['–', '–', '–', '–']);
    expect(container.querySelector('.review-score-check, .review-score-category-prompt')).toBeNull();
    rerender(<CategoryGrid cats={cats} values={complete} onChange={vi.fn()} />);
    expect(Array.from(container.querySelectorAll('.review-score-category-value')).map(el => el.textContent)).toEqual(['8.5', '8.6', '8.4', '8.5']);
  });
  it('(g) category average appears only after all four are scored', () => {
    const { container, rerender } = mount(<ReviewCategoriesHeading scores={{ ...complete, facilities: null }} />);
    expect(container.querySelector('[data-category-average]')).toBeNull();
    rerender(<I18nextProvider i18n={i18n}><ReviewCategoriesHeading scores={complete} /></I18nextProvider>);
    expect(container.querySelector('[data-category-average] b')?.textContent).toBe('8.5');
  });
  it('(h) action copy counts down overall, two, one, then Post review', () => {
    const states = [empty, { ...empty, overall: 8.6, scores: { ...complete, clubhouse: null, facilities: null } }, { ...empty, overall: 8.6, scores: { ...complete, facilities: null } }, { ...empty, overall: 8.6, scores: complete }];
    expect(states.map(state => { const action = scoreAction(state, false, false); return i18n.t(`review.wizard.${action.key}`, { count: action.count }); })).toEqual(['Set your overall score', 'Score 2 more to post', 'Score 1 more to post', 'Post review']);
  });
  it('(i) incomplete action scrolls and focuses the first missing score without flagging', () => {
    const scroll = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scroll });
    function Page() {
      const [state, set] = useState(empty); const overall = useRef<HTMLDivElement>(null); const rows = useRef<HTMLDivElement>(null);
      return <div id="root"><div ref={overall}><OverallScrubber value={state.overall} onChange={overall => set(old => ({ ...old, overall }))} {...props} /></div>
        <div ref={rows}><CategoryGrid values={state.scores} cats={cats} onChange={(key, value) => set(old => ({ ...old, scores: { ...old.scores, [key]: value } }))} /></div>
        <SubmitBar appearance="score" label="action" quiet enabled onPress={() => focusMissingScore(state, overall.current, rows.current)} /></div>;
    }
    const { container } = mount(<Page />);
    fireEvent.click(screen.getByRole('button')); expect(document.activeElement).toBe(screen.getByRole('slider', { name: 'Overall' }));
    expect(scroll).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'smooth' });
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Overall' }), { key: 'End' });
    fireEvent.click(screen.getByRole('button')); expect(document.activeElement).toBe(screen.getByRole('slider', { name: 'design' }));
    expect(container.querySelector('[data-flagged]')).toBeNull();
    delete (HTMLElement.prototype as unknown as { scrollTo?: unknown }).scrollTo;
  });
  it('(j) overall and categories use the same x-to-value mapping', () => {
    const overall = vi.fn(), category = vi.fn();
    mount(<><OverallScrubber value={null} onChange={overall} {...props} /><CategoryGrid cats={cats} values={empty.scores} onChange={category} /></>);
    for (const bar of screen.getAllByRole('slider')) tap(bar, 171);
    expect(barValueFromX(171, 200)).toBe(8.6);
    expect(overall).toHaveBeenCalledWith(8.6);
    for (const cat of cats) expect(category).toHaveBeenCalledWith(cat.key, 8.6);
  });
});