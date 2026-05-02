import { firstName as firstNameFromShare } from '../share';

/** Get the first name, e.g. "Tom Rashbrook" → "Tom". */
export const firstName = firstNameFromShare;

/** Get up-to-2-letter initials from first name only. */
export function initials(name: string): string {
  return firstName(name).slice(0, 2).toUpperCase();
}
