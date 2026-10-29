import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useReviewComposer, writeDraft, DRAFT_VERSION } from '@/features/review-v2/hooks/useReviewComposer';
import { useReviewSubmit } from '@/features/review-v2/hooks/useReviewSubmit';
import { OverallScrubber } from '@/features/review-v2/components/OverallScrubber';
import { CategoryGrid } from '@/features/review-v2/components/CategoryGrid';
import { SubmitBar } from '@/features/review-v2/components/SubmitBar';
import { ShareToggle } from '@/features/review-v2/components/ShareToggle';
import { calibrationRank } from '@/features/review-v2/hooks/useMyRatedScores';
import { missingScores, scoreAction, scoreFooter, scoreShareKey, snapScore } from '@/features/review-v2/lib/scoreStepRules';
import type { ExistingReview, ReviewComposerState } from '@/features/review-v2/types';
import { categoryAverage } from '@/features/review-v2/lib/categoryAverage';
import { ReviewStepHeading, ReviewCategoriesHeading } from '@/features/review-v2/components/ReviewScoreHeadings';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc } }));
const state: ReviewComposerState = { overall: null, scores: { design: null, condition: null, clubhouse: null, facilities: null }, verdict: null, reviewText: '', shareToFeed: true, teeLabel: null };
const complete = { ...state, overall: 8.6, scores: { design: 9.2, condition: 8, clubhouse: 7.4, facilities: 8.8 } };
beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });
afterEach(cleanup);

describe('overall authority', () => {
  it('create starts null and cannot submit', () => {
    const { result } = renderHook(() => useReviewComposer(null, 'new'));
    expect(result.current.state.overall).toBeNull();
    expect(result.current.overallTouched).toBe(false);
    expect(result.current.canSubmit).toBe(false);
  });
  it('draft without overall restores null', () => {
    sessionStorage.setItem('review-draft:new', JSON.stringify({ v: DRAFT_VERSION, step: 3, savedAt: Date.now(), scores: state.scores }));
    const { result } = renderHook(() => useReviewComposer(null, 'new'));
    expect(result.current.state.overall).toBeNull();
  });
  it('draft with overall restores that score', () => {
    writeDraft('new', { v: DRAFT_VERSION, step: 3, savedAt: Date.now(), ...complete });
    const { result } = renderHook(() => useReviewComposer(null, 'new'));
    expect(result.current.state.overall).toBe(8.6);
    expect(result.current.canSubmit).toBe(true);
  });
  it('edit starts on the existing rating', () => {
    const existing: ExistingReview = { id: 'rating', rating: 7.8, design_score: 8, condition_score: 8, clubhouse_score: 8, facilities_score: 8, review: null, verdict: null, share_to_feed: true };
    const { result } = renderHook(() => useReviewComposer(existing, 'edit'));
    expect(result.current.state.overall).toBe(7.8);
    expect(result.current.canSubmit).toBe(true);
  });
  it.each(['submit', 'stage'] as const)('%s refuses null overall without invoking RPC', async method => {
    const { result } = renderHook(() => useReviewSubmit());
    await expect(result.current[method]({ courseId: 'course', state: { ...complete, overall: null }, mediaExpected: 1 })).rejects.toThrow('Overall score required');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe('score actions', () => {
  it('no overall is a quiet set-score action even with complete categories', () => {
    expect(scoreAction({ ...complete, overall: null }, false, false)).toEqual({ key: 'step3.setScore', quiet: true, count: 1 });
  });
  it('one missing category is named', () => {
    expect(scoreAction({ ...complete, scores: { ...complete.scores, facilities: null } }, false, false)).toEqual({ key: 'step3.oneLeft', quiet: true, count: 1, category: 'facilities' });
  });
  it('several missing categories are counted in existing order', () => {
    expect(scoreAction({ ...state, overall: 8 }, false, false)).toEqual({ key: 'step3.nLeft', quiet: true, count: 4 });
    expect(missingScores(state).categories).toEqual(['design', 'condition', 'clubhouse', 'facilities']);
  });
  it.each([[false, 'step3.post'], [true, 'step3.save']] as const)('ready edit=%s submits with %s', (edit, key) => {
    expect(scoreAction(complete, edit, false)).toEqual({ key, quiet: false, count: 0 });
  });
  it.each([[false, 'posting'], [true, 'saving']] as const)('submitting edit=%s uses %s', (edit, key) => {
    expect(scoreAction(state, edit, true).key).toBe(key);
  });
  it('incomplete button remains actionable, and score footer never renders a skip', () => {
    const press = vi.fn();
    const { container, rerender } = render(<SubmitBar appearance="score" label="x" enabled quiet onPress={press} skipLabel="skip" onSkip={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(press).toHaveBeenCalledOnce();
    expect(container.querySelectorAll('button')).toHaveLength(1);
    rerender(<SubmitBar appearance="score" label="x" enabled={false} onPress={press} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('footer priority and share content', () => {
  it('threshold is absent without overall', () => { expect(scoreFooter(state, 'threshold')).toBeNull(); });
  it('threshold wins when overall is set, even while incomplete', () => { expect(scoreFooter({ ...state, overall: 8 }, 'threshold')).toEqual({ threshold: 'threshold' }); });
  it('incomplete with overall and no threshold has no line', () => { expect(scoreFooter({ ...state, overall: 8 }, null)).toBeNull(); });
  it.each([true, false])('ready share=%s has no posting or saving line', shareToFeed => { expect(scoreFooter({ ...complete, shareToFeed }, null)).toBeNull(); });
  it.each([[3, true, 'shareMediaWords'], [3, false, 'shareMedia'], [0, true, 'shareWords'], [0, false, 'shareScore']] as const)('media=%s words=%s selects %s', (count, words, key) => { expect(scoreShareKey(count, words)).toBe(key); });
  it('share retains true-toggle behavior', () => {
    const change = vi.fn();
    render(<ShareToggle appearance="score" value onChange={change} title="x" sub="y" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(change).toHaveBeenCalledWith(false);
  });
});

describe('one-screen score composition', () => {
  it('uses a heading counter on step 2 and retains the shared strip on step 1', () => {
    const { container, rerender } = render(<ReviewStepHeading step={2} total={2} />);
    expect(container.querySelector('[data-score-step-heading] h1')).not.toBeNull();
    expect(container.querySelector('.review-score-step-label')).not.toBeNull();
    expect(container.querySelector('[aria-hidden]')).toBeNull();
    rerender(<ReviewStepHeading step={1} total={2} />);
    expect(container.querySelector('[data-score-step-heading]')).toBeNull();
    expect(container.querySelector('[aria-hidden]')?.children).toHaveLength(2);
  });
  it('rounds 9.2, 8.0, 7.4, 8.8 half up to 8.4 independently of overall', () => {
    expect(categoryAverage(complete.scores)).toBe(8.4);
  });
  it.each(['design', 'condition', 'clubhouse', 'facilities'] as const)('has no average with %s missing', key => {
    expect(categoryAverage({ ...complete.scores, [key]: null })).toBeNull();
  });
  it('hides average without a placeholder then shows the category mean', () => {
    const { container, rerender } = render(<ReviewCategoriesHeading scores={state.scores} />);
    expect(container.querySelector('[data-category-average]')).toBeNull();
    rerender(<ReviewCategoriesHeading scores={complete.scores} />);
    expect(container.querySelector('[data-category-average] b')?.textContent).toBe('8.4');
    rerender(<ReviewCategoriesHeading scores={{ ...complete.scores, design: null }} />);
    expect(container.querySelector('[data-category-average]')).toBeNull();
  });
  it('places the live share switch inside the footer above its action and retains threshold', () => {
    const change = vi.fn();
    const { container, rerender } = render(<SubmitBar appearance="score" label="action" enabled onPress={vi.fn()} summary="threshold"
      share={<ShareToggle appearance="score" value onChange={change} title="share" sub="context" />} />);
    const footer = container.querySelector('[data-submit-appearance="score"]');
    const share = footer?.querySelector('.review-score-footer-share');
    expect(share?.querySelector('[role="switch"]')).not.toBeNull();
    expect(share?.nextElementSibling?.classList.contains('review-score-action')).toBe(true);
    expect(footer?.firstElementChild?.classList.contains('review-score-footer-line')).toBe(true);
    fireEvent.click(screen.getByRole('switch'));
    expect(change).toHaveBeenCalledWith(false);
    rerender(<SubmitBar appearance="score" label="action" enabled onPress={vi.fn()} summary={scoreFooter(complete, null)?.threshold} />);
    expect(container.querySelector('.review-score-footer-line')).toBeNull();
  });
});

describe('ruler and category interactions', () => {
  it.each([[-2, 1], [1.06, 1.1], [8.64, 8.6], [12, 10]])('snaps %s to %s', (input, output) => { expect(snapScore(input)).toBe(output); });
  it('keyboard arrows refine by a tenth and Home/End reach bounds', () => {
    const change = vi.fn();
    render(<OverallScrubber value={8.6} onChange={change} caption="" ariaLabel="Overall" />);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' }); expect(change).toHaveBeenLastCalledWith(8.7);
    fireEvent.keyDown(slider, { key: 'ArrowLeft' }); expect(change).toHaveBeenLastCalledWith(8.5);
    fireEvent.keyDown(slider, { key: 'Home' }); expect(change).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(slider, { key: 'End' }); expect(change).toHaveBeenLastCalledWith(10);
  });
  it('unscored rows have no value and flag clears immediately on scoring', () => {
    function Rows() {
      const [values, setValues] = useState(state.scores);
      return <CategoryGrid values={values} onChange={(key, value) => setValues(old => ({ ...old, [key]: value }))} cats={[{ key: 'facilities', label: 'Facilities', hint: '' }]} flagged={['facilities']} tapToScore="" stillToScore="" />;
    }
    const { container } = render(<Rows />);
    const row = container.querySelector('[data-score-category]');
    expect(row?.getAttribute('data-flagged')).toBe('true');
    expect(screen.getByRole('slider').hasAttribute('aria-valuenow')).toBe(false);
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'End' });
    expect(row?.getAttribute('data-flagged')).toBe('false');
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('10');
  });
  it('calibration retains the five-peer minimum and first rank', () => {
    expect(calibrationRank(null, [8, 7, 6, 5, 4])).toBeNull();
    expect(calibrationRank(9, [8, 7, 6, 5])).toBeNull();
    expect(calibrationRank(9, [8, 7, 6, 5, 4])).toEqual({ ordinal: 1, total: 6 });
    expect(calibrationRank(8.6, [9.5, 9, 8, 7, 6])).toEqual({ ordinal: 3, total: 6 });
  });
});