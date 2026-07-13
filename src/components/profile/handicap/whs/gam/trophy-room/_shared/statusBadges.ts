/**
 * statusBadges -- LOSABLE STATUS layer (frontend-only, no persistence).
 *
 * Single Figures and Scratch are the two badges whose LIVE STATUS is
 * derived every render from the owner's current WHS handicap index.
 * The milestone (ever earned) is permanent -- these thresholds only
 * drive the visible status decoration on top.
 *
 * Boundaries (lower index is better):
 *
 *   single_figures  hold=9.9, risk=9.5
 *     held    : index <= 9.5           (e.g. 2.2, 8.9)
 *     at_risk : 9.5 < index <= 9.9     (e.g. 9.6, 9.7, 9.9)
 *     lost    : index > 9.9            (e.g. 10.0, 10.1)
 *
 *   scratch         hold=0.0, risk=0.5
 *     held    : index <= 0.0           (0.0, -0.2, +2 -> reads as <=0.0)
 *     at_risk : 0.0 < index <= 0.5     (0.1, 0.3, 0.5)
 *     lost    : index > 0.5            (0.6, 1.2)
 */

export const STATUS_BADGES: Record<string, { hold: number; risk: number }> = {
  single_figures: { hold: 9.9, risk: 9.5 },
  scratch: { hold: 0.0, risk: 0.5 },
};

export type BadgeStatus = 'held' | 'at_risk' | 'lost' | null;

export function statusFor(badgeId: string, index: number | null): BadgeStatus {
  const cfg = STATUS_BADGES[badgeId];
  if (!cfg || index == null) return null; // not a status badge, or no index
  if (index > cfg.hold) return 'lost';
  if (index > cfg.risk) return 'at_risk';
  return 'held';
}

export function isStatusBadge(badgeId: string): boolean {
  return badgeId in STATUS_BADGES;
}

export interface StatusCopy {
  chipLabel: string;
  chipColor: string;
  chipBg: string;
  chipBorder: string;
  subline: string;
  /** Whether the card border should pulse/glow (at_risk only). */
  pulse: boolean;
  /** Whether the whole card should render as dimmed/lost (status === 'lost'). */
  dimmed: boolean;
}

const AMBER = '#F7931E';
const AMBER_TINT = 'rgba(247,147,30,0.14)';
const AMBER_BORDER = 'rgba(247,147,30,0.55)';
const RED = '#EF4444';
const RED_TINT = 'rgba(239,68,68,0.12)';
const RED_BORDER = 'rgba(239,68,68,0.45)';

export function statusCopy(
  badgeId: string,
  status: Exclude<BadgeStatus, null>,
  index: number,
): StatusCopy {
  const cfg = STATUS_BADGES[badgeId];
  const cutoff = cfg?.hold ?? 0;
  const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : String(n));
  if (status === 'at_risk') {
    return {
      chipLabel: 'AT RISK',
      chipColor: AMBER,
      chipBg: AMBER_TINT,
      chipBorder: AMBER_BORDER,
      subline: `Defend it -- index ${fmt(index)}, cut-off ${fmt(cutoff)}`,
      pulse: true,
      dimmed: false,
    };
  }
  // lost
  return {
    chipLabel: 'LOST',
    chipColor: RED,
    chipBg: RED_TINT,
    chipBorder: RED_BORDER,
    subline: `Reclaim it -- currently ${fmt(index)}, need ${fmt(cutoff)}`,
    pulse: false,
    dimmed: true,
  };
}
