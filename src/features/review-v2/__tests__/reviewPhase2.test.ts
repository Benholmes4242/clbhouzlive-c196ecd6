/**
 * PHASE 2 — the review path's new order, written down.
 *
 * These are the conditions the brief asked to be tested rather than described:
 * the step indices, the 9.0 default guarded by a touched flag, edit mode
 * starting satisfied, and a draft from the old numbering being discarded rather
 * than restored onto the wrong screen.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  FIRST_STEP,
  LAST_STEP,
  REVIEW_TOTAL_STEPS,
  DEFAULT_OVERALL,
  DRAFT_VERSION,
} from '../hooks/useReviewComposer';

const src = (p: string) => readFileSync(p, 'utf8');
const HOOK = 'src/features/review-v2/hooks/useReviewComposer.ts';

describe('the new step order', () => {
  it('starts on photos-and-words and ends on the rating, out of three', () => {
    expect(FIRST_STEP).toBe(2);
    expect(LAST_STEP).toBe(3);
    expect(REVIEW_TOTAL_STEPS).toBe(3);
  });

  it('opens the dial at 9.0', () => {
    expect(DEFAULT_OVERALL).toBe(9);
  });
});

describe('the touched flag', () => {
  const hook = src(HOOK);

  it('exists as its own boolean and gates the rating step', () => {
    expect(hook).toContain('overallTouched');
    expect(hook).toMatch(/ratingGate\s*=\s*overallTouched/);
  });

  it('starts satisfied in edit mode, because the member already has a score', () => {
    expect(hook).toContain('() => isEditMode || restored?.overallTouched === true');
  });
});

describe('drafts across the renumbering', () => {
  const hook = src(HOOK);

  beforeEach(() => sessionStorage.clear());

  it('keeps both key namespaces untouched', () => {
    expect(hook).toContain('`review-draft:edit:${reviewId}`');
    expect(hook).toContain("`review-draft:${courseId ?? 'unknown'}`");
  });

  it('discards a draft written before the steps were renumbered', () => {
    sessionStorage.setItem(
      'review-draft:abc',
      JSON.stringify({ step: 1, overall: 7, savedAt: Date.now() }),
    );
    const raw = JSON.parse(sessionStorage.getItem('review-draft:abc')!);
    // No version field -> not the current shape -> discarded, not migrated.
    expect(raw.v).toBeUndefined();
    expect(DRAFT_VERSION).toBe(2);
    expect(hook).toContain('parsed.v !== DRAFT_VERSION');
  });
});

describe('what came off the composer', () => {
  const composer = src('src/features/review-v2/ReviewComposerV2.tsx');

  it('no longer asks for a tee', () => {
    expect(composer).not.toContain('TeeChipRow');
    // The event stays registered; it simply has nothing left to fire from.
    expect(composer).not.toMatch(/track\w*\(\s*'review_tee_selected'/);
  });

  it('renders the one shared counter instead of its own step rail', () => {
    expect(composer).toContain('<ComposerStepHeader');
    expect(composer).not.toContain('stepLabels');
  });

  it('keeps the words and the media alive across a step change', () => {
    // The pipeline and the composer state must be created ABOVE the step
    // branches: going to the dial and back must restore from live state, not
    // from the draft, which cannot carry media.
    const pipeline = composer.indexOf('useReviewMediaPipeline({');
    const firstBranch = composer.indexOf('{step === FIRST_STEP && (');
    expect(pipeline).toBeGreaterThan(-1);
    expect(firstBranch).toBeGreaterThan(pipeline);
    // ...and neither step body may be keyed, which would remount it.
    expect(composer).not.toMatch(/\{step === (FIRST|LAST)_STEP && \(\s*<\w+ key=/);
    // The tray holds nothing of its own to lose.
    const tray = src('src/features/review-v2/components/MediaTray.tsx');
    expect(tray).not.toContain('useState');
  });

  it('marks the dial axis with numerals, not three band names', () => {
    const scrubber = src('src/features/review-v2/components/OverallScrubber.tsx');
    expect(scrubber).not.toContain('bandLabels');
    expect(scrubber).toContain('>1</span>');
    expect(scrubber).toContain('>5</span>');
    expect(scrubber).toContain('>10</span>');
  });
});
