/**
 * Brief 37 — profile section titles. Every title under a profile section
 * eyebrow comes from here so own ("Your") and visitor (first name) wording,
 * and the no-pronoun rule, live once. Rendered as SECTION_TITLE,
 * SECTION_TITLE_GAP below its eyebrow row; actions stay on the eyebrow row.
 */
import type { CSSProperties } from 'react';
import { SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';

const poss = (first: string) => `${first}'s`;
const nameOf = (first?: string | null) => (first ?? '').trim().split(/\s+/)[0] || 'Their';

export const profileTitles = {
  otherClubs: (own: boolean, first?: string | null) => (own ? 'Your other clubs' : `${poss(nameOf(first))} other clubs`),
  courseLegacy: (own: boolean, first?: string | null) => (own ? "Every course you've played" : `Every course ${nameOf(first)} has played`),
  tourYear: (year: string | number) => `${year} results`,
  latestResults: () => 'Latest results',
  careerSoFar: () => 'The career so far',
  proThisWeek: (own: boolean, first?: string | null) => (own ? "Where you're playing" : `Where ${nameOf(first)} is playing`),
  proSeason: () => 'The year so far',
  proHowEyebrow: (own: boolean, first?: string | null) => (own ? 'How you play' : `How ${nameOf(first)} plays`),
  proGame: (own: boolean, first?: string | null) => (own ? 'Your game in numbers' : `${poss(nameOf(first))} game in numbers`),
  proBag: () => "What's in the bag",
  proPartners: (own: boolean, first?: string | null) => (own ? 'Your partners' : `${poss(nameOf(first))} partners`),
  proCareer: (own: boolean, first?: string | null) => (own ? 'How you got here' : `How ${nameOf(first)} got here`),
  proAsk: (first?: string | null) => `Ask ${nameOf(first)} anything`,
};

/** The title line. `after` restores the spacing the eyebrow row used to own. */
export function ProfileSectionTitle({ children, after = 0, color, style }: { children: string; after?: number; color?: string; style?: CSSProperties }) {
  return <h3 data-profile-section-title="" style={{ ...SECTION_TITLE, margin: 0, marginTop: SECTION_TITLE_GAP, marginBottom: after, ...(color ? { color } : {}), ...style }}>{children}</h3>;
}
