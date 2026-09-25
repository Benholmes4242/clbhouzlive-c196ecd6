import fs from 'node:fs';
import path from 'node:path';

import i18next from 'i18next';
import { describe, expect, it } from 'vitest';

const EXPECTED = {
  en: ['1 rating', '2 ratings'],
  de: ['1 Bewertung', '2 Bewertungen'],
  es: ['1 valoración', '2 valoraciones'],
  ja: ['1件の評価', '2件の評価'],
  ko: ['평가 1건', '평가 2건'],
  'en-XA': ['[~~1 řáţíñĝ~~]', '[~~2 řáţíñĝš~~]'],
} as const;

describe('Explore course-shelf rating count', () => {
  it.each(Object.entries(EXPECTED))('%s supplies singular and plural copy', async (locale, expected) => {
    const file = path.resolve(process.cwd(), 'public', 'locales', locale, 'courses.json');
    const courses = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
    const instance = i18next.createInstance();
    await instance.init({ lng: locale, fallbackLng: false, resources: { [locale]: { courses } } });

    expect(instance.t('amateur.stream.ratingCount', { ns: 'courses', count: 1 })).toBe(expected[0]);
    expect(instance.t('amateur.stream.ratingCount', { ns: 'courses', count: 2 })).toBe(expected[1]);
    /* BRIEF_TEST_SUITE_TRIAGE_PART_2 §2 — the hand-copied expectation must be
       the value in the locale FILE, read here, so a corrected translation
       fails loudly against a stale copy instead of drifting silently. */
    const stream = (courses.amateur as Record<string, Record<string, string>>).stream;
    const fromFile = Object.entries(stream).filter(([k]) => k.startsWith('ratingCount_')).map(([, v]) => v);
    expect(fromFile.map((v) => v.replace('{{count}}', '1'))).toContain(expected[0]);
    expect(fromFile.map((v) => v.replace('{{count}}', '2'))).toContain(expected[1]);
  });
});