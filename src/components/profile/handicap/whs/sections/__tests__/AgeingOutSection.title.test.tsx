import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import common from '../../../../../../../public/locales/en/common.json';
import AgeingOutSection from '../AgeingOutSection';

const state = vi.hoisted(() => ({ isBest: true, inRounds: 1 }));
vi.mock('@/lib/whs/hooks', () => ({ useAllScores: () => ({ data: [] }) }));
vi.mock('@/lib/whs/counting', () => ({ counterWindow: () => [] }));
vi.mock('@/lib/whs/pickCourse', () => ({ pickCourse: () => null }));
vi.mock('@/lib/whs/ageingOut', () => ({
  deriveAgeingOut: () => ({
    ...state,
    current: 11.6,
    settleAt: 13.5,
    replacement: 17,
    expiring: { play_date: '2026-10-01', handicap_differential: 2 },
  }),
}));

const i18n = createInstance();
beforeAll(async () => {
  await i18n.init({ lng: 'en', fallbackLng: 'en', resources: { en: { common } }, interpolation: { escapeValue: false } });
});
afterEach(cleanup);

describe('Ageing-out title — BRIEF_HANDICAP_TAB_REBUILD_2D', () => {
  it.each([
    [true, 1, 'Next round, your best drops out'],
    [false, 1, 'Next round, a counting round drops out'],
    [true, 3, 'In 3 rounds, your best drops out'],
    [false, 3, 'In 3 rounds, a counting round drops out'],
  ] as const)('isBest=%s, horizon=%i uses the English plural form', (isBest, inRounds, title) => {
    Object.assign(state, { isBest, inRounds });
    render(<I18nextProvider i18n={i18n}><AgeingOutSection connectionId="local" currentHandicap={11.6} /></I18nextProvider>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(title);
    expect(screen.getByRole('heading', { level: 3 })).not.toHaveTextContent('In 1 rounds');
  });
});