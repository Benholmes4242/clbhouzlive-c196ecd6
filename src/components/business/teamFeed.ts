import type { BusinessRole } from '@/hooks/useBusinessTeam';

/** CB78 section four: pure rules for the role table and Recent team activity.
 *
 * ROLE TABLE evidence (checked before building, CB78 + rulings):
 *  post     owner/admin/editor: insert_posts_as_valid_actor + ActiveActorContext.
 *  edit     owner/admin/editor: business_accounts UPDATE (TEAM_S4_V1) + the
 *           guard_business_protected_fields trigger; BusinessProfileEditor.
 *  insights all four: business_daily_metrics member SELECT; canViewInsights.
 *  reply    owner/admin: review_responses INSERT; BusinessReviewsPage canReply.
 *  team     owner/admin: deployed SECURITY DEFINER team functions (see teamList.ts).
 *  verify   owner/admin: can_manage_business, request_course_claim; verification page guard.
 *  delete   owner: business_accounts DELETE + soft_delete_business.
 * The feed (get_business_team_feed) is owner/admin only; 42501 otherwise. */

export const TABLE_ROLES: BusinessRole[] = ['owner', 'admin', 'editor', 'analyst'];
export type Ability = 'post' | 'edit' | 'insights' | 'reply' | 'team' | 'verify' | 'delete';
export const ROLE_TABLE: { ability: Ability; marks: [boolean, boolean, boolean, boolean] }[] = [
  { ability: 'post', marks: [true, true, true, false] },
  { ability: 'edit', marks: [true, true, true, false] },
  { ability: 'insights', marks: [true, true, true, true] },
  { ability: 'reply', marks: [true, true, false, false] },
  { ability: 'team', marks: [true, true, false, false] },
  { ability: 'verify', marks: [true, true, false, false] },
  { ability: 'delete', marks: [true, false, false, false] },
];

export interface FeedEvent {
  kind: string; at: string; ref_id?: string | null;
  actor_id: string | null; actor_name: string | null; actor_avatar_url: string | null;
  target_id?: string | null; target_name: string | null; role: string | null; old_role?: string | null;
}

/** Kinds that need a person, a role, or both. post/review_reply fold. */
const NEEDS: Record<string, { person?: boolean; role?: boolean }> = {
  post: {}, review_reply: {},
  team_invite_sent: { person: true, role: true },
  team_invite_resent: { person: true },
  team_invite_role_changed: { person: true, role: true },
  team_invite_accepted: { role: true },
  team_request_approved: { person: true, role: true },
  team_request_declined: { person: true },
  team_role_changed: { person: true, role: true },
  team_ownership_transferred: { person: true },
  team_member_removed: { person: true },
  team_member_left: {},
};
const FOLDS = new Set(['post', 'review_reply']);
const ROLES = new Set(['owner', 'admin', 'editor', 'analyst']);
export const MAX_FEED_LINES = 8;

export interface FeedLine {
  kind: string; at: string; count: number;
  actorId: string | null; actorName: string; avatarUrl: string | null; isViewer: boolean;
  person: string | null; role: BusinessRole | null;
}

/** First word of a display name; an email invite keeps the full address. */
export function personName(target: string | null | undefined): string | null {
  const v = target?.trim();
  if (!v) return null;
  return v.includes('@') && !v.startsWith('@') ? v : v.split(/\s+/)[0];
}

const sameLocalDay = (a: string, b: string) => {
  const x = new Date(a); const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};

/** Feed rows (newest first) to showable, folded lines. */
export function feedLines(events: FeedEvent[], viewerId: string | null | undefined): FeedLine[] {
  const out: FeedLine[] = [];
  for (const e of events) {
    const need = NEEDS[e.kind];
    if (!need) continue;
    const person = personName(e.target_name);
    const role = e.role && ROLES.has(e.role) ? (e.role as BusinessRole) : null;
    if ((need.person && !person) || (need.role && !role)) continue;
    const prev = out[out.length - 1];
    if (prev && FOLDS.has(e.kind) && prev.kind === e.kind && prev.actorId === e.actor_id && sameLocalDay(prev.at, e.at)) {
      prev.count += 1;
      continue;
    }
    out.push({
      kind: e.kind, at: e.at, count: 1, actorId: e.actor_id,
      actorName: personName(e.actor_name) || '', avatarUrl: e.actor_avatar_url,
      isViewer: !!viewerId && e.actor_id === viewerId, person, role,
    });
  }
  return out;
}

export type TimeLabel = { key: 'now' } | { key: 'hours'; count: number } | { key: 'today' } | { key: 'yesterday' } | { key: 'weekday'; text: string } | { key: 'date'; text: string };

export function feedTime(iso: string, now: Date, locale = 'en-GB'): TimeLabel {
  const d = new Date(iso);
  const ms = now.getTime() - d.getTime();
  if (ms < 3_600_000) return { key: 'now' };
  if (ms < 6 * 3_600_000) return { key: 'hours', count: Math.floor(ms / 3_600_000) };
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(now) - day(d)) / 86_400_000);
  if (days <= 0) return { key: 'today' };
  if (days === 1) return { key: 'yesterday' };
  if (days <= 6) return { key: 'weekday', text: d.toLocaleDateString(locale, { weekday: 'short' }) };
  const opts: Intl.DateTimeFormatOptions = d.getFullYear() === now.getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' };
  return { key: 'date', text: d.toLocaleDateString(locale, opts) };
}
