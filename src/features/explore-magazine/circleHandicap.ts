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
  delta: { text: string; tone: string } | null;
}

/**
 * The Circle rail's explicit disclosure gate. This intentionally does not rely
 * on whs_connection_publicly_visible() or table RLS: neither promises to enforce
 * handicap_visibility for this public rail. Index and movement are one
 * disclosure, so a failed gate withholds both.
 *
 * handicap_visibility and eg_visible currently live on user_profiles, while an
 * undeleted whs_connections row proves that the federation connection exists.
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

  const rawDelta = input.deltaIndex == null ? null : Number(input.deltaIndex);
  const delta = rawDelta == null || !Number.isFinite(rawDelta) || Math.abs(rawDelta) < 0.05
    ? null
    : {
        text: rawDelta < 0 ? `\u2212${Math.abs(rawDelta).toFixed(1)}` : `+${rawDelta.toFixed(1)}`,
        tone: rawDelta < 0 ? INDEX_DELTA.dark.improved : INDEX_DELTA.dark.drifted,
      };

  return { index: fmtHcp(Number(input.handicapIndex)), delta };
}