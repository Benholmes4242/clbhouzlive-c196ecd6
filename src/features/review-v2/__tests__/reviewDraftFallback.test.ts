import { describe, it, expect } from 'vitest';
import { mergeRestoredDraft, sameAsPublished, readDraft, writeDraft, DRAFT_VERSION, type DraftShape } from '../hooks/useReviewComposer';
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
  it('sameAsPublished: draft with no teeLabel is unchanged', () => {
    const d = draft({ overall: 8.5, scores: base.scores, shareToFeed: true, reviewText: 'Published words' });
    expect(sameAsPublished(d, base)).toBe(true);
  });
  it('draft with no shareToFeed keeps a published false and is unchanged', () => {
    const priv = { ...base, shareToFeed: false };
    const d = draft({ overall: 8.5, scores: base.scores, reviewText: 'Published words', teeLabel: 'White' });
    expect(mergeRestoredDraft(priv, d).shareToFeed).toBe(false);
    expect(sameAsPublished(d, priv)).toBe(true);
  });
  it('draft carrying shareToFeed false overrides a published true', () => {
    expect(mergeRestoredDraft(base, draft({ shareToFeed: false })).shareToFeed).toBe(false);
  });
  it('a present null tee overrides the published tee', () => {
    expect(mergeRestoredDraft(base, draft({ teeLabel: null })).teeLabel).toBeNull();
  });
  it('a cleared tee survives the real sessionStorage round trip', () => {
    writeDraft('course-rt', {
      v: DRAFT_VERSION, step: 2, overall: 8.5, scores: base.scores,
      reviewText: 'Published words', shareToFeed: true, teeLabel: null, savedAt: Date.now(),
    }, 'rating-rt');
    const back = readDraft('course-rt', 'rating-rt');
    expect(back).not.toBeNull();
    expect('teeLabel' in back!).toBe(true);
    expect(mergeRestoredDraft(base, back).teeLabel).toBeNull();
    expect(sameAsPublished(back!, base)).toBe(false);
  });
});
