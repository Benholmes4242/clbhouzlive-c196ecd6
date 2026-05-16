import { firstName as firstNameFromShare } from '../share';

/** Get the first name, e.g. "Tom Rashbrook" → "Tom". */
export const firstName = firstNameFromShare;

/** Normalize EG-style "Surname, Given" to "Given Surname". Pass-through otherwise. */
export function displayName(name: string | null | undefined): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.includes(',')) {
    const [surname, ...rest] = trimmed.split(',');
    const given = rest.join(',').trim();
    if (given && surname) return `${given} ${surname.trim()}`;
  }
  return trimmed;
}

/** Get up-to-2-letter initials from first name only. */
export function initials(name: string): string {
  return firstName(name).slice(0, 2).toUpperCase();
}
