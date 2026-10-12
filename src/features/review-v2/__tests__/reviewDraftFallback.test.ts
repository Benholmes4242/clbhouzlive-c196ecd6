import { describe, it, expect } from 'vitest';
import { mergeRestoredDraft, sameAsPublished, type DraftShape } from '../hooks/useReviewComposer';
import type { ReviewComposerState } from '../types';

const base: ReviewComposerState = {
  verdict: null, overall: 8.5,
  scores: { design: 8, condition: 7, clubhouse: 6, facilities: 5 },
  reviewText: 'Published words', shareToFeed: true, teeLabel: 'White',
};
const draft = (d: Partial<DraftShape>) => d as DraftShape;

describe('restored draft falls back to the published review', () => {
  it('draft without reviewText keeps the published text', () => {
    expect(mergeRestoredDraft(base, draft({ overall: 9 })).reviewText).toBe('Published words');
  });
  it('draft with reviewText overrides the published text', () => {
    expect(mergeRestoredDraft(base, draft({ reviewText: 'New' })).reviewText).toBe('New');
  });
  it('draft without teeLabel keeps the published tee', () => {
    expect(mergeRestoredDraft(base, draft({ overall: 9 })).teeLabel).toBe('White');
  });
  it('draft with teeLabel overrides the published tee', () => {
    expect(mergeRestoredDraft(base, draft({ teeLabel: 'Blue' })).teeLabel).toBe('Blue');
  });
  it('sameAsPublished: draft with no reviewText is unchanged', () => {
    const d = draft({ overall: 8.5, scores: base.scores, shareToFeed: true, teeLabel: 'White' });
    expect(sameAsPublished(d, base)).toBe(true);
  });
});
