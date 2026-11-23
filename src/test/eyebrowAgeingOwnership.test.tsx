import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import common from '@/locales/en/common.json';
import AgeingOutSection from '@/components/profile/handicap/whs/sections/AgeingOutSection';

vi.mock('@/lib/whs/hooks', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/whs/hooks')>(), useAllScores: () => ({ data: [] }) }));
vi.mock('@/lib/whs/counting', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/whs/counting')>(), counterWindow: () => [] }));
vi.mock('@/lib/whs/pickCourse', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/whs/pickCourse')>(), pickCourse: () => null }));
vi.mock('@/lib/whs/ageingOut', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/whs/ageingOut')>(), deriveAgeingOut: () => ({ isBest: false, inRounds: 1, current: 11.6, settleAt: 13.5, replacement: 17, expiring: { play_date: '2026-10-01', handicap_differential: 2 } }) }));

const i18n = createInstance();
beforeAll(async () => {
  await i18n.init({ lng: 'en', fallbackLng: 'en', resources: { en: { common } }, interpolation: { escapeValue: false } });
});
afterEach(cleanup);

describe('AgeingOut eyebrow follows parent-supplied ownership', () => {
  it('own-profile ageing-out eyebrow computes to amber', () => {
    const { container } = render(<I18nextProvider i18n={i18n}><AgeingOutSection connectionId="local" currentHandicap={11.6} isOwnProfile /></I18nextProvider>);
    const kicker = container.querySelector('section > div:first-child');
    if (!(kicker instanceof HTMLElement)) throw new Error('Missing ageing-out eyebrow');
    expect(getComputedStyle(kicker).color).toBe('rgb(247, 147, 30)');
  });

  it('visitor-profile ageing-out eyebrow computes to ink', () => {
    const { container } = render(<I18nextProvider i18n={i18n}><AgeingOutSection connectionId="local" currentHandicap={11.6} isOwnProfile={false} /></I18nextProvider>);
    const kicker = container.querySelector('section > div:first-child');
    if (!(kicker instanceof HTMLElement)) throw new Error('Missing ageing-out eyebrow');
    expect(getComputedStyle(kicker).color).toBe('rgb(248, 250, 252)');
  });
});