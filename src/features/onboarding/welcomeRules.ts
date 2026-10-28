/** OB1 progress is identity-scoped and records completed screens, never draft
 * names or credentials. Existing profile validation defines username syntax. */
/** The one username length rule shared by setup and change_username (3–20). */
export const USERNAME_RULE_MIN = 3;
export const USERNAME_RULE_MAX = 20;
export const WELCOME_USERNAME_RE = new RegExp(`^[a-z0-9_.]{${USERNAME_RULE_MIN},${USERNAME_RULE_MAX}}$`);
export type WelcomeStep = 1 | 2 | 3 | 4 | 5;
export interface WelcomeCourse { id: string; name: string; region?: string | null; country?: string | null; thumbnail_image?: string | null; club_id?: string | null }
export interface WelcomeProgress { completed: number; course: WelcomeCourse | null; follows: number }
export function welcomeName(profile: { first_name?: string | null; last_name?: string | null } | null | undefined, metadata: Record<string, unknown> = {}) {
  if (profile?.first_name?.trim() || profile?.last_name?.trim()) return { first: profile.first_name?.trim() ?? '', last: profile.last_name?.trim() ?? '' };
  const full = String(metadata.full_name ?? metadata.name ?? '').trim();
  if (full) { const [first, ...rest] = full.split(/\s+/); return { first, last: rest.join(' ') }; }
  return { first: String(metadata.given_name ?? '').trim(), last: String(metadata.family_name ?? '').trim() };
}
export function usernameSeed(first: string, last: string) {
  const base = `${first}${last}`.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 20);
  return base ? base.padEnd(3, '1') : '';
}
export function usernameWithSuffix(base: string, suffix: number) { const digits = suffix ? String(suffix) : ''; return `${base.slice(0, 20 - digits.length)}${digits}`; }
export function canContinueIdentity(first: string, last: string, username: string, available: boolean) { return !!`${first} ${last}`.trim() && WELCOME_USERNAME_RE.test(username) && available; }
export function readWelcomeProgress(userId: string): WelcomeProgress {
  try { const value = JSON.parse(localStorage.getItem(`clbhouz.welcome.${userId}`) ?? 'null'); if (value && Number.isInteger(value.completed)) return { completed: Math.max(0, Math.min(4, value.completed)), course: value.course ?? null, follows: value.follows ?? 0 }; } catch { /* storage unavailable */ }
  return { completed: 0, course: null, follows: 0 };
}
export function writeWelcomeProgress(userId: string, progress: WelcomeProgress) { try { localStorage.setItem(`clbhouz.welcome.${userId}`, JSON.stringify(progress)); } catch { /* storage unavailable */ } }
export function courseStatsVisible(stats: { rounds_tracked: number | null } | null | undefined) { return (stats?.rounds_tracked ?? 0) >= 3; }