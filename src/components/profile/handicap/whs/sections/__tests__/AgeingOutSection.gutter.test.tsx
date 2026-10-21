/**
 * BRIEF_HCP_AGEING_OUT_GUTTER — the ageing-out section renders its own <section>
 * rather than the HcpSection shell, so it must carry the same 0 20px gutter
 * itself. Without it the eyebrow, heading, amber box and footnote run edge to
 * edge while every neighbouring section sits inside the page gutter.
 *
 * The assertion is structural: the root section's horizontal padding must equal
 * HcpSection's, and the 34px lead-in must survive the fix.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import common from '../../../../../../../public/locales/en/common.json';
import AgeingOutSection from '../AgeingOutSection';
import { HcpSection } from '../HcpSection';

vi.mock('@/lib/whs/hooks', () => ({ useAllScores: () => ({ data: [] }) }));
vi.mock('@/lib/whs/counting', () => ({ counterWindow: () => [] }));
vi.mock('@/lib/whs/pickCourse', () => ({ pickCourse: () => null }));
vi.mock('@/lib/whs/ageingOut', () => ({
  deriveAgeingOut: () => ({
    isBest: false,
    inRounds: 1,
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

const rootSection = (container: HTMLElement) => container.querySelector('section') as HTMLElement;

describe('Ageing-out gutter — BRIEF_HCP_AGEING_OUT_GUTTER', () => {
  it('pads its root section 0 20px exactly like HcpSection', () => {
    const ageing = render(
      <I18nextProvider i18n={i18n}>
        <AgeingOutSection connectionId="local" currentHandicap={11.6} />
      </I18nextProvider>,
    );
    const shell = render(
      <HcpSection heading="Shell">
        <div>content</div>
      </HcpSection>,
    );

    const a = getComputedStyle(rootSection(ageing.container));
    const h = getComputedStyle(rootSection(shell.container));

    expect(a.paddingLeft).toBe('20px');
    expect(a.paddingRight).toBe('20px');
    // Same gutter as the shell every other section uses.
    expect(a.paddingLeft).toBe(h.paddingLeft);
    expect(a.paddingRight).toBe(h.paddingRight);
    // The 34px lead-in is untouched by the fix.
    expect(a.marginTop).toBe('34px');
    expect(h.marginTop).toBe('34px');
  });
});
