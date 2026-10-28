/** EP2 pure rules for the You group (ep2-you.html 2A–2F). Values match the
 * columns useProfileSave writes; username syntax is the setup rule. */
export { WELCOME_USERNAME_RE as USERNAME_RE } from '@/features/onboarding/welcomeRules';

/** Same values as ManageProfile / GenderPromptSheet; the column CHECK owns them. */
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export const USERNAME_COOLDOWN_DAYS = 30;
const DAY = 86_400_000;

export function genderLabel(value: string | null | undefined) {
  return GENDER_OPTIONS.find(o => o.value === value)?.label ?? '';
}

export function locationValue(city: string | null | undefined, country: string | null | undefined) {
  return [city?.trim(), country?.trim()].filter(Boolean).join(', ');
}

export function fullName(first: string, last: string) {
  return `${first.trim()} ${last.trim()}`.trim();
}

/** The toggle starts on when the stored display name differs from first + last. */
export function startsWithDifferentName(display: string, first: string, last: string) {
  return !!display.trim() && display.trim() !== fullName(first, last);
}

export function shownName(first: string, last: string, different: boolean, display: string) {
  return different ? display.trim() : fullName(first, last);
}

const shortDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Inside the 30 days returns the two en-GB short dates; otherwise null. */
export function usernameTooSoon(changedAt: string | null | undefined, now = Date.now()) {
  if (!changedAt) return null;
  const at = new Date(changedAt).getTime();
  if (!Number.isFinite(at) || now - at >= USERNAME_COOLDOWN_DAYS * DAY) return null;
  return { changed: shortDate(new Date(at)), next: shortDate(new Date(at + USERNAME_COOLDOWN_DAYS * DAY)) };
}
