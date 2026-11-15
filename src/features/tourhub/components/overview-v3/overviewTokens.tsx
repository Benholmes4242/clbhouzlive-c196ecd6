/**
 * Tour Overview section tokens (BRIEF_TOUR_OVERVIEW_MOCK_EXACT) — the same
 * family as rareAir.ts, theHundred.ts, whoLeads.ts and climb.ts. Where a value
 * coincides with an existing token (AMBER, INK) the token is read instead, so
 * no colour is declared twice. Used only by the Overview hero, its bands and
 * the heroBoard theme of MiniBoard.
 */
import { AMBER, INK, INK_FAINT, INK_MUTE, WHITE_ALPHA_08, INK_TINT_04, WHITE_ALPHA_18, WHITE_ALPHA_30, HAIRLINE_INK_10, TOUR_LIVE_GREEN } from '../../_shared/tokens';

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
    /** Green means LIVE (TOUR_LIVE_GREEN at 18%); amber is reserved for the viewer. */
    live: TOUR_LIVE_GREEN,
    liveHalo: '0 0 0 3px rgba(52,215,127,0.18)',
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

/**
 * THE EVEN ROW (BRIEF_TOUR_OVERVIEW_MOVERS_PICKS_EVEN) — three players across
 * the full screen width with the SAME gap at the left screen edge, between each
 * player and at the right screen edge. Seven tracks: the four 1fr spacers share
 * the free space equally and never drop below 12px, so a long surname ends in
 * "…" instead of squeezing a gap (every card keeps minWidth 0 and its own
 * ellipsis). Cards sit in columns 2, 4 and 6. The row spans the full width: it
 * cancels a 20px-padded parent with a negative side margin, or the parent has
 * no side padding. Owners: RoundMovementBand (movers), PicksBlock's picks grid
 * and the overview loading shells, so the skeleton and the real bands cannot
 * drift apart on reveal.
 */
export const EVEN_ROW_GRID =
  'minmax(12px,1fr) auto minmax(12px,1fr) auto minmax(12px,1fr) auto minmax(12px,1fr)';
/** Grid columns for the first, second and third card of an even row. */
export const EVEN_ROW_COLUMNS = [2, 4, 6] as const;

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
