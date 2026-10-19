/**
 * SHEET_HCP_1_R3: the connected preview is now a destination row.
 * State height parity is retired. Keep isFetched gating in ProfileSheetV2:
 * unsettled means nothing, never a skeleton or reserved card height.
 * The unconnected card and its geometry remain in PreIndexCards unchanged.
 * Movement uses A.IMPROVED / A.DRIFTED, never score colours or the dark pair.
 * The row reads the same ninety-day history and sentence as the former card.
 */
import { handicapSentence, type SheetHcpState } from '../sheetState';

export interface HandicapNavValue {
  index: number;
  subLabel?: string;
  direction?: 'down' | 'up';
}

export function handicapNavValue(
  state: SheetHcpState,
  history90: { observed_at: string; handicap_index: number }[] | null | undefined,
): HandicapNavValue | null {
  if (state.kind !== 'ready') return null;
  const points = (history90 ?? []).map((p) => ({ t: p.observed_at, v: p.handicap_index }));
  const sentence = handicapSentence(points, 90);
  // Only the existing opening movement clause, not the former plot caption.
  const subLabel = sentence?.slice(0, sentence[0]?.text === 'Level over ninety days' ? 1 : 3)
    .map((s) => s.text).join('');
  const delta = points.length >= 2 ? points[points.length - 1].v - points[0].v : null;
  return {
    index: points.length > 0 ? points[points.length - 1].v : state.index,
    subLabel,
    direction: delta == null || Math.abs(delta) < 0.05 ? undefined : delta < 0 ? 'down' : 'up',
  };
}
