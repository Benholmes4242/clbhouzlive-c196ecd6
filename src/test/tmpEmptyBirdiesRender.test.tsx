import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

const i18n = vi.hoisted(() => ({
  dict: {
    'courseDetail.youTab.sections.birdiesHere': 'Birdies here',
    'courseDetail.youTab.connect.birdiesCaption':
      'Every hole you have birdied here lights up — including rounds you played before you connected.',
  } as Record<string, string>,
}));

vi.mock('react-i18next', () => {
  const t = (key: string) => i18n.dict[key] ?? key;
  return { useTranslation: () => ({ t }), Trans: ({ i18nKey }: { i18nKey: string }) => <>{t(i18nKey)}</> };
});

import { EmptyBirdiesSection } from '@/components/courses/course-detail/you/NotConnectedInvitation';

describe('empty birdie strip (not connected)', () => {
  it('keeps the heading, the eighteen slots and the caption, and prints no counter', () => {
    const { container, getByText, queryByText } = render(<EmptyBirdiesSection />);
    expect(getByText('Birdies here')).toBeTruthy();
    expect(getByText(/lights up/)).toBeTruthy();
    expect(container.querySelectorAll('[aria-hidden="true"] span').length).toBe(18);
    expect(queryByText('0 of 18')).toBeNull();
  });
});
