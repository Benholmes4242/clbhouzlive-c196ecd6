import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import enCourses from '../../public/locales/en/courses.json';
import { RoundsGate, glimpseFits } from '@/features/explore-magazine/RoundsGate';

vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

const i18n = createInstance();
beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en', fallbackLng: 'en', resources: { en: { courses: enCourses } },
    interpolation: { escapeValue: false },
  });
});
afterEach(() => vi.restoreAllMocks());

describe('CB36 — the short-screen rule', () => {
  it('fits only when one whole row sits inside the glimpse', () => {
    expect(glimpseFits(120, 100)).toBe(true);
    expect(glimpseFits(89, 132)).toBe(false);
    expect(glimpseFits(89, null)).toBe(true);
  });

  it('renders no glimpse when a full row cannot fit, and the block still renders', () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(89);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const bottom = this.hasAttribute('data-board-row') ? 132 : 0;
      return { top: 0, bottom, left: 0, right: 0, width: 0, height: bottom, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
    });
    const { container } = render(<MemoryRouter><I18nextProvider i18n={i18n}>
      <RoundsGate><div>Section head</div><button data-board-row="">Round</button></RoundsGate>
    </I18nextProvider></MemoryRouter>);
    expect(container.querySelector('[data-rounds-gate-header]')).toBeNull();
    expect(container.querySelector('[data-board-row]')).toBeNull();
    expect(container.querySelector('[data-rounds-gate-card]')).not.toBeNull();
  });
});
