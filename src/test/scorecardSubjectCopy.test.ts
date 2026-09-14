import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { coursePlaceLine } from '@/features/explore-magazine/placeLine';

const locales = ['en', 'de', 'es', 'ja', 'ko', 'en-XA'] as const;

function coursesFor(locale: (typeof locales)[number]) {
  const file = path.resolve(process.cwd(), 'public', 'locales', locale, 'courses.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as {
    scorecard: Record<string, string>;
  };
}

describe('scorecard subject-aware copy', () => {
  it.each(locales)('%s provides the new owner-aware labels', (locale) => {
    const scorecard = coursesFor(locale).scorecard;
    expect(scorecard.atThisCourseSelf).toBeTruthy();
    expect(scorecard.atThisCourseOther).toContain('{{name}}');
    expect(scorecard.figOfRounds).toContain('{{count}}');
    expect(scorecard.figVsYourAvg).toBeTruthy();
    expect(scorecard.figVsTheirAvg).toBeTruthy();
    expect(scorecard.figHcpAtTime).toBeTruthy();
    expect(scorecard.beatFieldSelf.toLowerCase()).toContain('field');
    expect(scorecard.beatFieldOther).toContain('{{name}}');
    expect(scorecard.beatFieldOther.toLowerCase()).toContain('field');
  });

  it('keeps the approved English Richard Lawrence labels', () => {
    const scorecard = coursesFor('en').scorecard;
    expect(scorecard.figOfRounds.replace('{{count}}', '53')).toBe('of 53 rounds');
    expect(scorecard.figVsTheirAvg).toBe('vs their average');
    expect(scorecard.figHcpAtTime).toBe('HCP at the time');
    expect(scorecard.beatFieldOther.replace('{{name}}', 'Richard Lawrence')).toContain(
      'Richard Lawrence beat the field average',
    );
  });

  it('formats the canonical East Course place as Kent, England', () => {
    expect(coursePlaceLine({ region: 'Kent', subCountry: 'England', country: 'Britain & Ireland' }))
      .toBe('Kent, England');
  });
});