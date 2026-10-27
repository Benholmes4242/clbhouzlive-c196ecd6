/** CB116: every privacy/measurement/result rule is returned by the seven RPCs, never derived here. */
export const COACH_CATEGORIES = ['Golf Academy', 'Coach / Instructor'] as const;
export const isCoachCategory = (category?: string | null) => COACH_CATEGORIES.some(c => c === category);
export interface CoachBusiness { id: string; name: string; logo_url?: string | null; slug?: string | null; category?: string | null }
export interface MemberCoach { business_id: string; name: string; logo_url: string | null; slug: string | null }
export interface MyCoach extends MemberCoach { link_id: string; started_at: string; start_index: number; current_index: number; measured: boolean; change: number | null; show_on_profile: boolean; share_name: boolean }
export interface CoachResults { n: number; threshold: number; avg_change?: number; down?: number; level?: number; up?: number; months?: Array<{ m: number; n: number; avg: number }> }
export interface CoachGolfers { active: number; named: Array<{ user_id: string; display_name: string; profile_photo_url: string | null; started_at: string; change: number | null }> }
export const coachKeys = {
  mine: (viewer?: string) => ['get_my_coach', viewer ?? null] as const,
  member: (id?: string, viewer?: string) => ['get_member_coach', id ?? null, viewer ?? null] as const,
  results: (id?: string, viewer?: string) => ['get_coach_results', id ?? null, viewer ?? null] as const,
  golfers: (id?: string, viewer?: string) => ['get_coach_golfers', id ?? null, viewer ?? null] as const,
};
export const formatCoachChange = (value: number) => value < 0 ? `−${Math.abs(value).toFixed(1)}` : value > 0 ? `+${value.toFixed(1)}` : '0.0';
export function coachWhen(start: string, now = new Date()) {
  const date = new Date(start);
  if (date.toDateString() === now.toDateString()) return { key: 'today', month: '', year: date.getFullYear() };
  return { key: date.getFullYear() === now.getFullYear() ? 'month' : 'year', month: date.toLocaleDateString('en-GB', { month: 'long' }), year: date.getFullYear() };
}
export const coachDate = (start: string) => new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
