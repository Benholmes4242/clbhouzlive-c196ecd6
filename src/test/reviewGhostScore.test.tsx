import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  REVIEW_LABEL_COLOR_NEUTRAL_LIGHT,
  ReviewVerdictLabel,
  reviewLabelColor,
  reviewTierColor,
} from '@/components/shared/ReviewGhostScore';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { BAND_GREEN } from '@/features/courses/_shared/scoreBandTokens';

describe('shared displayed review score tones', () => {
  it('uses the canonical dark display rule for verdict labels', () => {
    expect(reviewLabelColor(9)).toBe(A.GREEN);
    expect(reviewLabelColor(9.9)).toBe(A.GREEN);
    expect(reviewLabelColor(8.3)).toBe(A.MUTE);
    expect(reviewLabelColor(4.1)).toBe(A.MUTE);
  });

  it('uses the light rating equivalents on a genuine light ground', () => {
    expect(reviewLabelColor(9, 'light')).toBe(BAND_GREEN);
    expect(reviewLabelColor(8.3, 'light')).toBe(REVIEW_LABEL_COLOR_NEUTRAL_LIGHT);
  });

  it('keeps the separate tier-name API wired through its retained midpoints', () => {
    expect(reviewTierColor('EXCEPTIONAL', 'dark')).toBe(A.GREEN);
    expect(reviewTierColor('EXCELLENT', 'dark')).toBe(A.MUTE);
    expect(reviewTierColor('GOOD', 'dark')).toBe(A.MUTE);
    expect(reviewTierColor('FAIR', 'dark')).toBe(A.MUTE);
    expect(reviewTierColor('POOR', 'dark')).toBe(A.MUTE);
  });

  it('renders the verdict label for both reported ratings', () => {
    const exceptional = renderToStaticMarkup(
      <div>
        <ReviewVerdictLabel rating={9} />
      </div>,
    );
    expect(exceptional).toContain('Exceptional');
    expect(exceptional).toContain('text-transform:uppercase');
    expect(exceptional).toContain(`color:${A.GREEN}`);

    const excellent = renderToStaticMarkup(
      <div>
        <ReviewVerdictLabel rating={8.3} />
      </div>,
    );
    expect(excellent).toContain('Excellent');
    expect(excellent).toContain('text-transform:uppercase');
    expect(excellent).toContain(`color:${A.MUTE}`);
  });
});