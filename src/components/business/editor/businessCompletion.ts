/** BE2 completion is a pure saved-profile measure. Zero coordinates are a pin;
 * hours require a displayed, non-closed day with both times, never seeded copy. */
import type { OpeningHours } from './editorTypes';

export interface BusinessCompletionInput {
  logo: string | null; cover: string | null; description: string; foundedYear: string;
  lat?: number | null; lng?: number | null; phone: string; website: string;
  showOpeningHours: boolean; openingHours: OpeningHours;
}
export const BUSINESS_COMPLETION_ITEMS = [
  ['logo', 'Add a logo'], ['cover', 'Add a cover'], ['about', 'Write your about'],
  ['established', 'Add the year you started'], ['address', 'Pin your address'],
  ['phone', 'Add a phone number'], ['website', 'Add your website'], ['hours', 'Show your hours'],
] as const;
export type BusinessCompletionKey = typeof BUSINESS_COMPLETION_ITEMS[number][0];
export function businessCompletion(input: BusinessCompletionInput) {
  const done = [!!input.logo, !!input.cover, !!input.description.trim(), !!input.foundedYear,
    input.lat != null && input.lng != null, !!input.phone.trim(), !!input.website.trim(),
    input.showOpeningHours && Object.values(input.openingHours).some(day => !day.closed && !!day.open && !!day.close)];
  const missing = BUSINESS_COMPLETION_ITEMS.filter((_, index) => !done[index]);
  return { done, missing, remaining: missing.length };
}