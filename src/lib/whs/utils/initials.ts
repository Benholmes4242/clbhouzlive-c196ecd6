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

/** Get initials: first letter of first name + first letter of last name. */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const normalised = displayName(name).trim();
  if (!normalised) return '?';
  const parts = normalised.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  const first = parts[0]!.charAt(0).toUpperCase();
  const last = parts[parts.length - 1]!.charAt(0).toUpperCase();
  return `${first}${last}`;
}
