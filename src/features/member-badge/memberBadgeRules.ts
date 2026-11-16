/** Pure copy and figure rules for the tap-a-badge card (BRIEF_MEMBER_BADGES_V2).
 * Figures come only from existing reads; null figures are dropped, never invented. */
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';

export type BadgeKind = 'teaching_pro' | 'tour_pro' | 'amateur';
export const BADGE_MOVE_GREEN = '#34D77F';
export const BADGE_MOVE_RED = TOPAR_UNDER_DARK;
export const BADGE_FACTS_STALE_MS = 600_000;

export interface BadgeFact { value: string; label: string; color?: string }

const BODY: Record<BadgeKind, string> = {
  teaching_pro: "A qualified golf coach, checked by clbhouz before the badge goes on. Teaching pros don't carry a handicap, so they don't appear on member leaderboards.",
  tour_pro: 'A professional who plays for prize money on a tour, checked by clbhouz. Their results come straight from the Official World Golf Ranking.',
  amateur: 'Ranked on the World Amateur Golf Ranking, the official list for the top amateurs in the game. Their ranking and results come straight from WAGR.',
};
const TITLE: Record<BadgeKind, string> = { teaching_pro: 'Teaching professional', tour_pro: 'Tour professional', amateur: 'Elite amateur' };

export function badgeCardCopy(kind: BadgeKind, name: string, extra: { club?: string | null; tour?: string | null } = {}) {
  const tail = kind === 'teaching_pro' ? extra.club : kind === 'tour_pro' ? extra.tour : null;
  return { title: TITLE[kind], who: [name.trim(), tail?.trim()].filter(Boolean).join(' · '), body: BODY[kind] };
}

/** A first name exists only for a multi-word display name; a handle ("golfingwithellie") reads "their". */
export function badgeProfileButton(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length >= 2 ? `Open ${words[0]}'s profile` : 'Open their profile';
}

export function tourFacts(rank: number | null, eventsThisYear: number | null): BadgeFact[] {
  const out: BadgeFact[] = [];
  if (rank != null) out.push({ value: `#${rank.toLocaleString('en-GB')}`, label: 'World ranking' });
  if (eventsThisYear != null) out.push({ value: String(eventsThisYear), label: 'Events this year' });
  return out;
}

/** history weeks are YYYYWW. Movement = earliest rank this calendar year − today's rank. */
export function amateurYearMove(history: Array<{ week: number; rank: number; id?: number }>, rank: number | null, year: number): number | null {
  if (rank == null) return null;
  const rows = history.filter(r => Math.floor(r.week / 100) === year).sort((a, b) => a.week - b.week || (a.id ?? 0) - (b.id ?? 0));
  return rows.length ? rows[0].rank - rank : null;
}

export function amateurFacts(rank: number | null, move: number | null): BadgeFact[] {
  const out: BadgeFact[] = [];
  if (rank != null) out.push({ value: `#${rank.toLocaleString('en-GB')}`, label: 'World amateur rank' });
  if (move != null && move !== 0) out.push(move > 0
    ? { value: `▲ ${move}`, label: 'This year', color: BADGE_MOVE_GREEN }
    : { value: `▼ ${-move}`, label: 'This year', color: BADGE_MOVE_RED });
  return out;
}

/** Plain text of a name node (string, number or nested element children). */
export function textOfNode(node: unknown): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOfNode).join('');
  if (typeof node === 'object' && 'props' in (node as object)) return textOfNode((node as { props?: { children?: unknown } }).props?.children);
  return '';
}
