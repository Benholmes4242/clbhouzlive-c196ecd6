import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/components/profile/hero/HeroShell', () => ({
  W_55: 'var(--muted-foreground)',
  HeroShell: ({ subline }: { subline: ReactNode }) => <div data-profile-subline="">{subline}</div>,
}));

import { BusinessProfileHero } from '@/components/business/hero/BusinessProfileHero';

afterEach(cleanup);

const identity = (category: string) => render(
  <BusinessProfileHero name="Business" category={category} city="London" country="United Kingdom" isClub={false} courseNavEnabled={false} onStatTap={() => {}} />,
).container.querySelector('[data-profile-subline]')?.textContent;

describe('CB72 business profile identity category', () => {
  it('Other renders location alone with no leading separator', () => {
    expect(identity('Other')).toBe('London');
  });

  it('empty category renders location alone with no leading separator', () => {
    expect(identity('')).toBe('London');
  });

  it('other categories keep existing sentence case and location formatting', () => {
    expect(identity('Club Fitter')).toBe('Club fitter · London');
  });
});