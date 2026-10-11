/**
 * Tour Overview section tokens (BRIEF_TOUR_OVERVIEW_MOCK_EXACT) — the same
 * family as rareAir.ts, theHundred.ts, whoLeads.ts and climb.ts. Where a value
 * coincides with an existing token (AMBER, INK) the token is read instead, so
 * no colour is declared twice. Used only by the Overview hero, its bands and
 * the heroBoard theme of MiniBoard.
 */
import { AMBER, INK } from '../../_shared/tokens';

export const OVERVIEW = {
  /** Muted caps / secondary figures on the dark band ground. */
  mute: 'rgba(248,250,252,0.42)',
  /** Body copy one step down from INK. */
  soft: 'rgba(248,250,252,0.62)',
  hairline: 'rgba(255,255,255,0.08)',
  cardGround: 'rgba(255,255,255,0.05)',
  bracket: 'rgba(255,255,255,0.18)',
  spine: {
    done: 'rgba(255,255,255,0.72)',
    todo: 'rgba(255,255,255,0.30)',
    label: 'rgba(255,255,255,0.50)',
    connector: 'rgba(255,255,255,0.18)',
    liveHalo: '0 0 0 3px rgba(247,147,30,0.25)',
  },
  trio: {
    faceBorder: '1.5px solid rgba(8,12,16,0.9)',
    caps: 'rgba(255,255,255,0.72)',
  },
  shape: {
    level: 'rgba(248,250,252,0.62)',
    stub: 'rgba(255,255,255,0.14)',
    live: AMBER,
  },
  ink: INK,
  amber: AMBER,
} as const;

/** "Three", "Two"… from the locale; numerals past ten. Caps come from CSS. */
export function countInWords(count: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (count >= 2 && count <= 10) return t(`overview.countWords.${count}`);
  return String(count);
}

export interface MovementCard {
  key: string;
  name: string;
  candidates: string[];
  delta: number;
  /** Today's to-par for the round in progress; null when the player has none. */
  toPar: number | null;
  /** Gross for the round, only once the round is complete and par is known. */
  gross: number | null;
}

/**
 * §C.5 — the three largest movements by absolute size, gained first then
 * lost. Zero movements are not movements. Never padded to three.
 */
export function pickMovementCards<T extends { delta: number }>(cards: T[]): T[] {
  const top = cards.filter((c) => c.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);
  return [...top.filter((c) => c.delta > 0), ...top.filter((c) => c.delta < 0)];
}
