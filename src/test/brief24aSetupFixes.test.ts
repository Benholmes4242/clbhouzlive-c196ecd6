import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import i18next from 'i18next';
import enCourses from '@/locales/en/courses.json';
import enCommon from '@/locales/en/common.json';
import { resolveDialDefault } from '@/features/business-create/BusinessCreateStep3';
import { clubPlaceLine, searchResultPlace } from '@/features/business-create/step2Rules';

async function inst() {
  const i = i18next.createInstance();
  await i.init({ lng: 'en', resources: { en: { courses: enCourses, common: enCommon } }, ns: ['courses', 'common'], defaultNS: 'courses', interpolation: { escapeValue: false } });
  return i;
}

describe('Brief 24A A — claim sheet count grammar', () => {
  it('one review is waiting, three reviews are waiting', async () => {
    const i = await inst();
    const line = (n: number) => i.t('courseDetail.claim.sheet.unansweredCount', { count: n }) + i.t('courseDetail.claim.sheet.unansweredTail', { count: n });
    expect(line(1)).toBe('1 review is waiting for a reply from the club');
    expect(line(3)).toBe('3 reviews are waiting for a reply from the club');
  });
  it('the sheet passes count to the tail', () => {
    expect(readFileSync('src/components/courses/course-detail/ClaimCourseSheet.tsx', 'utf8')).toContain("unansweredTail', { count: unansweredCount }");
  });
});

describe('Brief 24A B — phone field', () => {
  it('the zero-padding rule targets the number input only', () => {
    const css = readFileSync('src/features/business-create/business-create.css', 'utf8');
    expect(css).not.toMatch(/\.bizc-phone input\{/);
    expect(css).toContain('.bizc-phone input.phone-number-input{');
    expect(readFileSync('src/components/business/PhoneInputWithDialCode.tsx', 'utf8')).toContain('paddingLeft: 32');
  });
  it('England opens on GB (+44), Spain on ES (+34), draft choice wins, GB last', () => {
    expect(resolveDialDefault({ selectedClub: { sub_country: 'England' } })).toBe('GB');
    expect(resolveDialDefault({ selectedClub: { sub_country: 'Spain' } })).toBe('ES');
    expect(resolveDialDefault({ selectedClub: { sub_country: 'Ireland' } })).toBe('IE');
    expect(resolveDialDefault({ countrySelection: 'FR', selectedClub: { sub_country: 'England' } })).toBe('FR');
    expect(resolveDialDefault({ address: { countryCode: 'us' } })).toBe('US');
  });
});

describe('Brief 24A D — self sheet titles', () => {
  it('own row reads Your job title; others read First\'s job title', async () => {
    const i = await inst();
    const k = 'business.team.sectionTwo.jobSheet';
    expect(i.t(`${k}.titleSelf`, { ns: 'common' })).toBe('Your job title');
    expect(i.t(`${k}.title`, { ns: 'common', name: 'Sam' })).toBe("Sam's job title");
    for (const s of ['roleSheet', 'ownerSheet', 'removeSheet']) expect(i.exists(`business.team.sectionTwo.${s}.titleSelf`, { ns: 'common' })).toBe(true);
  });
});

describe('Brief 24A E — place line order', () => {
  it('county first, then nation', () => {
    const club = { region: 'Kent', sub_country: 'England', country: 'Britain & Ireland' } as never;
    expect(clubPlaceLine(club, 1)).toBe('Kent, England');
    expect(clubPlaceLine(club, 2)).toBe('Kent, England · 2 courses');
    expect(searchResultPlace(club)).toBe('Kent, England');
  });
});
