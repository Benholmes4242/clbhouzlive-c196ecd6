import { fmtHcp } from '@/lib/whs/format';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';

export interface CircleHandicapDisclosure {
  hasActiveConnection: boolean;
  handicapVisibility: string | null | undefined;
  egVisible: boolean | null | undefined;
  handicapIndex: number | null | undefined;
  deltaIndex: number | null | undefined;
}

export interface CircleHandicapDisplay {
  index: string;
  delta: { text: string; arrow: string; tone: string } | null;
}

/**
 * THE CIRCLE RAIL'S OWN GATE. Unchanged behaviour: it holds raw profile
 * fields and must test them before formatting.
 *
 * The Circle rail's explicit disclosure gate. This intentionally does not rely
 * on whs_connection_publicly_visible() or table RLS: neither promises to enforce
 * handicap_visibility for this public rail. Index and movement are one
 * disclosure, so a failed gate withholds both.
 *
 * handicap_visibility and eg_visible currently live on user_profiles, while an
 * undeleted whs_connections row proves that the federation connection exists.
 *
 * The delta renders as an ARROW plus an UNSIGNED figure: a cut is the index
 * going DOWN and is green; a rise is UP and is red. The arrow replaces the sign,
 * so "↓0.2" never coexists with a minus.
 */
export function circleHandicapDisplay(input: CircleHandicapDisclosure): CircleHandicapDisplay | null {
  if (
    !input.hasActiveConnection ||
    input.handicapVisibility !== 'public' ||
    input.egVisible !== true ||
    input.handicapIndex == null ||
    !Number.isFinite(Number(input.handicapIndex))
  ) {
    return null;
  }

  return handicapPairDisplay({ handicapIndex: input.handicapIndex, deltaIndex: input.deltaIndex });
}

/**
 * HOW THE PAIR LOOKS. No gate, no permission test — the caller has already
 * decided. The ONE place the arrow, the unsigned figure, the 0.05 floor and
 * the improved/drifted tones are chosen, so two surfaces cannot disagree
 * about which direction is green. Returns null only when there is no index
 * to show (absent = not disclosed).
 */
export function handicapPairDisplay(input: {
  handicapIndex: number | null | undefined;
  deltaIndex: number | null | undefined;
}): CircleHandicapDisplay | null {
  if (input.handicapIndex == null || !Number.isFinite(Number(input.handicapIndex))) return null;

  const rawDelta = input.deltaIndex == null ? null : Number(input.deltaIndex);
  const delta = rawDelta == null || !Number.isFinite(rawDelta) || Math.abs(rawDelta) < 0.05
    ? null
    : {
        arrow: rawDelta < 0 ? '\u2193' : '\u2191',
        text: Math.abs(rawDelta).toFixed(1),
        tone: rawDelta < 0 ? INDEX_DELTA.dark.improved : INDEX_DELTA.dark.drifted,
      };

  return { index: fmtHcp(Number(input.handicapIndex)), delta };
}