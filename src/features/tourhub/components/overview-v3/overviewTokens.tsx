/**
 * Tour Overview section tokens (BRIEF_TOUR_OVERVIEW_MOCK_EXACT) — the same
 * family as rareAir.ts, theHundred.ts, whoLeads.ts and climb.ts. Where a value
 * coincides with an existing token (AMBER, INK) the token is read instead, so
 * no colour is declared twice. Used only by the Overview hero, its bands and
 * the heroBoard theme of MiniBoard.
 */
import { AMBER, INK, INK_FAINT, INK_MUTE, WHITE_ALPHA_08, INK_TINT_04, WHITE_ALPHA_18, WHITE_ALPHA_30, HAIRLINE_INK_10 } from '../../_shared/tokens';

export const OVERVIEW = {
  /** Muted caps / secondary figures on the dark band ground. */
  mute: INK_FAINT,
  /** Body copy one step down from INK. */
  soft: INK_MUTE,
  hairline: WHITE_ALPHA_08,
  cardGround: INK_TINT_04,
  bracket: WHITE_ALPHA_18,
  spine: {
    done: 'rgba(255,255,255,0.72)',
    todo: WHITE_ALPHA_30,
    label: 'rgba(255,255,255,0.50)',
    connector: WHITE_ALPHA_18,
    liveHalo: '0 0 0 3px rgba(247,147,30,0.25)',
  },
  trio: {
    faceBorder: '1.5px solid rgba(8,12,16,0.9)',
    caps: 'rgba(255,255,255,0.72)',
  },
  shape: {
    level: INK_MUTE,
    stub: HAIRLINE_INK_10,
    live: AMBER,
  },
  ink: INK,
  amber: AMBER,
  /** The board's scorecard hint beneath the last row. */
  footer: {
    size: 11,
    weight: 700,
    tracking: '0.12em',
    padding: '12px 20px',
  },
  teeAlert: {
    border: 'rgba(247,147,30,0.45)',
    armedGround: 'rgba(247,147,30,0.14)',
    radius: 10,
    padding: 12,
    marginTop: 12,
    size: 11.5,
    weight: 700,
    tracking: '0.1em',
  },
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
