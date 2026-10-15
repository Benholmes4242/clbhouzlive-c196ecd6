import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { ReviewRailSlot } from '@/components/courses/ReviewRailSlot';
import { firstSentence } from '@/features/explore-magazine/useExploreStreamClient';
import { stripMentionMarkup } from '@/lib/mentions/format';

const QUOTE = 'Great to play West Kent with @[Danny Holmes](u:36f22cdf-4099-44f0-80cd-512647ef2f42) @[DPRJK](u:937386d7-0000-0000-0000-000000000000)';

describe('review previews render mentions', () => {
  it('rail card shows names, never markup, and one tap opens the review', () => {
    const onReviewPress = vi.fn();
    const review = { id: 'r1', quote: QUOTE, rating: 8, course_name: 'West Kent', course_id: 'c1' } as never;
    const { container } = render(
      <MemoryRouter><ReviewRailSlot reviews={[review]} onReviewPress={onReviewPress} /></MemoryRouter>,
    );
    const text = container.textContent ?? '';
    expect(text).toContain('@Danny Holmes');
    expect(text).toContain('@DPRJK');
    expect(text).not.toContain('](u:');
    expect(text).not.toContain('36f22cdf');
    fireEvent.click(screen.getByText('@Danny Holmes'));
    expect(onReviewPress).toHaveBeenCalledTimes(1);
  });

  it('stream first_sentence is cut from the plain names', () => {
    expect(firstSentence(stripMentionMarkup(QUOTE))).toBe('Great to play West Kent with @Danny Holmes @DPRJK');
  });
});
