/** BC4 draft-only identity and input rules. The year range mirrors IdentitySection's input bounds. */
import { categoryDisplayLabel, type BusinessCreateDraft } from './createRules';
import { businessPlaceLine } from '@/lib/business/businessHero';

export const ABOUT_LIMIT = 2500;
export const FOUNDED_YEAR_MIN = 1800;
export function foundedYearError(value: string, currentYear = new Date().getFullYear()): string | null {
  if (!value) return null;
  return /^\d{4}$/.test(value) && Number(value) >= FOUNDED_YEAR_MIN && Number(value) <= currentYear
    ? null : `Enter a year between ${FOUNDED_YEAR_MIN} and ${currentYear}.`;
}
export function draftHeroIdentity(d: BusinessCreateDraft) {
  const name = d.category === 'Golf Club' ? d.selectedClub?.name ?? ''
    : d.category === 'University / College' ? d.selectedCollege?.name ?? '' : d.businessName;
  const place = d.category === 'Golf Club' ? d.selectedClub?.sub_country || d.selectedClub?.region || '' : d.address?.city ?? '';
  return { name, line: businessPlaceLine(categoryDisplayLabel(d.category) ?? '', place) };
}