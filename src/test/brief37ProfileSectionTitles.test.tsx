import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
import { ProfileSectionTitle, profileTitles as T } from '@/components/profile/sections/profileSectionTitles';

const src = (p: string) => readFileSync(p, 'utf8');

describe('Brief 37 profile section titles', () => {
  it('own and visitor wording follows the ruling', () => {
    expect([T.otherClubs(true, 'Thomas'), T.otherClubs(false, 'Thomas')]).toEqual(['Your other clubs', "Thomas's other clubs"]);
    expect([T.courseLegacy(true, 'Thomas Holmes'), T.courseLegacy(false, 'Thomas Holmes')]).toEqual(["Every course you've played", 'Every course Thomas has played']);
    expect(T.tourYear(2026)).toBe('2026 results');
    expect([T.latestResults(), T.careerSoFar()]).toEqual(['Latest results', 'The career so far']);
    expect([T.proThisWeek(false, 'Rory McIlroy'), T.proThisWeek(true, 'Rory')]).toEqual(['Where Rory is playing', "Where you're playing"]);
    expect(T.proSeason()).toBe('The year so far');
    expect(T.proHowEyebrow(false, 'Rory')).toBe('How Rory plays');
    expect([T.proGame(false, 'Rory'), T.proGame(true, 'Rory')]).toEqual(["Rory's game in numbers", 'Your game in numbers']);
    expect(T.proBag()).toBe("What's in the bag");
    expect([T.proPartners(false, 'Rory'), T.proPartners(true, 'Rory')]).toEqual(["Rory's partners", 'Your partners']);
    expect([T.proCareer(false, 'Rory'), T.proCareer(true, 'Rory')]).toEqual(['How Rory got here', 'How you got here']);
    expect(T.proAsk('Rory')).toBe('Ask Rory anything');
  });
  it('the title renders SECTION_TITLE, SECTION_TITLE_GAP below its eyebrow', () => {
    const { container } = render(<ProfileSectionTitle>Latest results</ProfileSectionTitle>);
    const h = container.querySelector('[data-profile-section-title]') as HTMLElement;
    expect(h.style.fontSize).toBe(`${SECTION_TITLE.fontSize}px`);
    expect(h.style.fontWeight).toBe(String(SECTION_TITLE.fontWeight));
    expect(h.style.marginTop).toBe(`${SECTION_TITLE_GAP}px`);
  });
  it('every section draws its title under its eyebrow', () => {
    const uses: Array<[string, string[]]> = [
      ['src/components/profile/clubs/ClubsCard.tsx', ['profileTitles.otherClubs']],
      ['src/components/profile/courses/JourneySummaryCard.tsx', ['profileTitles.courseLegacy', 'SECTION_EYEBROW']],
      ['src/features/pro-verification/ProfileTourTab.tsx', ['profileTitles.tourYear']],
      ['src/features/amateur-ranking/ProfileRankingTab.tsx', ['profileTitles.latestResults', 'profileTitles.careerSoFar']],
      ['src/features/pro-profile/LinkedProSections.tsx', ['profileTitles.proThisWeek', 'profileTitles.proHowEyebrow', 'profileTitles.proGame']],
      ['src/features/pro-profile/ProSeasonSection.tsx', ['profileTitles.proSeason']],
      ['src/features/pro-profile/ProCollectionSections.tsx', ['profileTitles.proBag', 'profileTitles.proPartners', 'profileTitles.proCareer']],
      ['src/features/pro-profile/ProAskSection.tsx', ['profileTitles.proAsk']],
    ];
    for (const [file, keys] of uses) for (const k of keys) expect(src(file), `${file} ${k}`).toContain(k);
    expect(src('src/features/pro-profile/LinkedProSections.tsx')).not.toContain('HOW HE PLAYS');
    expect(SECTION_EYEBROW.lineHeight).toBe(1);
  });
  it('no title uses he, his, she or her', () => {
    const fs = [T.otherClubs, T.courseLegacy, T.proThisWeek, T.proHowEyebrow, T.proGame, T.proPartners, T.proCareer];
    const all = [...fs.flatMap((f) => [f(true, 'Rory'), f(false, 'Rory')]), T.tourYear(2026), T.latestResults(), T.careerSoFar(), T.proSeason(), T.proBag(), T.proAsk('Rory')];
    for (const title of all) expect(` ${title} `).not.toMatch(/ (he|his|she|her) /i);
  });
  it('the shared Panel kicker used by course pages is unchanged', () => {
    expect(src('src/features/courses/components/holes/analytical/tokens.tsx')).toContain("{kicker && <span style={KICKER}>{kicker}</span>}");
  });
});
