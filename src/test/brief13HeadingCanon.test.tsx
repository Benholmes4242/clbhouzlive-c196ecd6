/**
 * Brief 13: Courses leftovers, Review v2, two admin surfaces and number words
 * in section/sheet titles. Structural checks read the source so no surface is
 * mounted behind mocks; the number-word case resolves real en locale strings.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import i18next from 'i18next';
import common from '@/locales/en/common.json';
import tourhub from '@/locales/en/tourhub.json';
import { titleCountWords } from '@/features/tourhub/components/overview-v3/overviewTokens';

const src = (p: string) => readFileSync(resolve(process.cwd(), 'src', p), 'utf8');

describe('brief 13 heading canon', () => {
  it('Courses directory sheet title spreads SECTION_TITLE', () => {
    expect(src('components/courses/CourseDirectorySheet.tsx')).toMatch(/id="course-directory-title"\s*style=\{\{ \.\.\.SECTION_TITLE,/);
  });

  it('Review v2 Remove review sheet title spreads SECTION_TITLE', () => {
    expect(src('features/review-v2/components/RemoveReviewSheetV2.tsx')).toMatch(/\.\.\.SECTION_TITLE, color: RV2\.ink \}\}>Remove review\?/);
  });

  it('ReviewComposerV2 step heading keeps 24 and takes -0.035em / 1.05', () => {
    expect(src('features/review-v2/ReviewComposerV2.tsx')).toMatch(/<h1 style=\{\{ fontSize: 24, fontWeight: 700, letterSpacing: '-0\.035em', lineHeight: 1\.05,/);
  });

  it('admin Settings Diagnostics sheet title spreads SECTION_TITLE', () => {
    expect(src('features/admin/pages/SettingsPage.tsx')).toMatch(/\.\.\.SECTION_TITLE \}\}>Diagnostics<\/h2>/);
  });

  it('StorySection header eyebrow and title use the canon', () => {
    const s = src('features/admin/components/content/StorySection.tsx');
    expect(s).toMatch(/\.\.\.SECTION_EYEBROW, color: t\.inkFaint \}\}>Newsroom</);
    expect(s).toMatch(/marginTop: SECTION_TITLE_GAP, \.\.\.SECTION_TITLE, color: t\.ink \}\}>\{BEAT_NAME\[beat\]\} story/);
  });

  it('number-word title: 1 singular word, 4 as a word, 12 as a numeral', async () => {
    const i = i18next.createInstance();
    await i.init({ lng: 'en', resources: { en: { common, tourhub } }, defaultNS: 'common', interpolation: { escapeValue: false } });
    const t = i.t.bind(i) as unknown as (k: string, o?: Record<string, unknown>) => string;
    const title = (count: number) => t('handicap.form.archive.roundsTitle', { count, words: titleCountWords(count, (k, o) => t(k, { ...o, ns: 'tourhub' })) });
    expect(title(1)).toBe('One round');
    expect(title(4)).toBe('Four rounds');
    expect(title(12)).toBe('12 rounds');
  });
});
