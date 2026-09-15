/**
 * ENGLISH ONLY cutover.
 *
 * de/es/ja/ko are keyed but only ~26% translated, so they are switched off in
 * `ENABLED_LOCALES` until they have had native review. These tests pin the two
 * ways a member used to end up in a half-translated app:
 *   1. the device / OS language (navigator.language = de-DE),
 *   2. a `clbhouz.locale` value cached before the cutover.
 *
 * This is NOT the "value equals en" / "missing key" translation guard — that is
 * deliberately not added; it will be written per language when one is re-enabled.
 */
import { describe, it, expect, beforeAll } from 'vitest';

describe('locale: english only', () => {
  beforeAll(() => {
    // A device that already cached German before the cutover.
    window.localStorage.setItem('clbhouz.locale', 'de');
    Object.defineProperty(window.navigator, 'language', {
      value: 'de-DE',
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'languages', {
      value: ['de-DE', 'de'],
      configurable: true,
    });
  });

  it('clears a cached disabled locale and resolves English', async () => {
    const mod = await import('../i18n/index');
    expect(window.localStorage.getItem('clbhouz.locale')).not.toBe('de');
    expect(mod.getActiveLocale()).toBe('en');
    expect(mod.default.resolvedLanguage ?? 'en').toBe('en');
  });

  it('does not honour the device language', async () => {
    const mod = await import('../i18n/index');
    expect(mod.isLocaleEnabled('de')).toBe(false);
    expect(mod.isLocaleEnabled('es')).toBe(false);
    expect(mod.isLocaleEnabled('ja')).toBe(false);
    expect(mod.isLocaleEnabled('ko')).toBe(false);
    expect(mod.isLocaleEnabled('en')).toBe(true);
  });

  it('keeps every locale file listed as supported so nothing is lost', async () => {
    const mod = await import('../i18n/index');
    expect([...mod.SUPPORTED_LOCALES]).toEqual(['en', 'ja', 'ko', 'es', 'de', 'en-XA']);
  });
});
