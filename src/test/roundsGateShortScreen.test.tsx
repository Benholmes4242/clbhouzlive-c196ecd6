import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import enCourses from '../../public/locales/en/courses.json';
import { RoundsGate } from '@/features/explore-magazine/RoundsGate';

vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

const i18n = createInstance();
beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en', fallbackLng: 'en', resources: { en: { courses: enCourses } },
    interpolation: { escapeValue: false },
  });
});
afterEach(() => vi.restoreAllMocks());

describe('Rounds gate short screens', () => {
  it('keeps the full page with no glimpse or spacer before locking', () => {
    const { container } = render(<MemoryRouter><I18nextProvider i18n={i18n}><RoundsGate><div data-board-row="">Round</div></RoundsGate></I18nextProvider></MemoryRouter>);
    expect(container.querySelector('[data-rounds-gate-header]')).toBeNull();
    expect(container.querySelector('[data-rounds-gate-spacer]')).toBeNull();
    expect(container.querySelector('[data-board-row]')).not.toBeNull();
    expect(document.querySelector('[data-rounds-gate-card]')).toBeNull();
    cleanup();
  });
  it('locks without removing rows and gives the fixed card an internal scrolling viewport', async () => {
    vi.useFakeTimers();
    const { container } = render(<MemoryRouter><I18nextProvider i18n={i18n}><RoundsGate><div data-board-row="">Round</div></RoundsGate></I18nextProvider></MemoryRouter>);
    act(() => vi.advanceTimersByTime(3000));
    expect(container.querySelector('[data-board-row]')).not.toBeNull();
    expect(document.querySelector('[data-rounds-gate-card]')).not.toBeNull();
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/features/explore-magazine/roundsGate.css', 'utf8');
    expect(css).toContain('max-height:');
    expect(css).toContain('overflow-y: auto');
    cleanup(); vi.useRealTimers();
  });
});
