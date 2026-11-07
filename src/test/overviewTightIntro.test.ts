import { describe, expect, it } from 'vitest';
import { createInstance } from 'i18next';
import en from '../../public/locales/en/tourhub.json';

describe('tight overview picks intro', () => {
  it('reads James leads for us without a NEEDS explanation', async () => {
    const language = createInstance();
    await language.init({ lng: 'en', resources: { en: { tourhub: en } }, interpolation: { escapeValue: false } });
    expect(language.t('overview.picksIntro.leads', { ns: 'tourhub', name: 'James' })).toBe('James leads for us.');
  });
});