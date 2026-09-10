/**
 * SeeAllRow — THE ONE TERMINAL "SEE ALL" ROW for the handicap page
 * (BRIEF_HANDICAP_SNAGS_02 §2).
 *
 * Extracted from three hand-rolled copies that had already drifted:
 *   - CircleSection      "SEE ALL 24"  chevron pushed to the right edge
 *   - RecentlyPlayedFeed "SEE ALL 38"  chevron pushed to the right edge
 *   - StreaksCard        chevron attached to the label (UNMOUNTED — not
 *                        repointed, see the dead-file list)
 *
 * THE GRAMMAR, fixed by the brief:
 *   - Label 12 / 700 / 0.11em / uppercase / MUTE.
 *   - Chevron U+203A immediately FOLLOWING the label, never pushed to the
 *     right edge. The BUTTON still spans the full width, so the tap target is
 *     unchanged from the two rows this replaces — only the glyph moved.
 *   - A rule ABOVE itself only, NEVER below (the SNAGS_01 §E fix, carried
 *     into the extraction rather than being reintroduced by whichever copy
 *     this was based on). `rule={false}` is for the one caller whose
 *     preceding row already draws that same hairline; nothing can ask for a
 *     rule beneath.
 *
 * GUTTERS: the 20px gutter is owned by `HcpSection` (padding: 0 20px), which
 * wraps every caller. This row therefore carries NO horizontal padding of its
 * own — adding 20px here would inset it to 40px and break alignment with the
 * rows above it. The brief's "20px gutters" is satisfied by the shell.
 *
 * Tones are the existing CHART literals, so this renders correctly inside a
 * portalled sheet as well as on the page (no var(--hcp-*) dependency).
 */
import React from 'react';
import { CHART, CHART_FONT } from '../charts/tokens';

interface Props {
  /** The whole label, already counted and localised, e.g. "SEE ALL 38". */
  label: string;
  onPress: () => void;
  /**
   * Draw the 1px rule above the row. Default true. Pass false ONLY where the
   * row immediately above already draws that hairline itself.
   */
  rule?: boolean;
  /** Space between the rule (or the row above) and the label. */
  gap?: number;
}

export const SeeAllRow: React.FC<Props> = ({ label, onPress, rule = true, gap = 12 }) => (
  <button
    type="button"
    onClick={onPress}
    style={{
      width: '100%',
      display: 'block',
      textAlign: 'left',
      background: 'transparent',
      border: 0,
      borderTopStyle: rule ? 'solid' : undefined,
      borderTopWidth: rule ? 1 : undefined,
      borderTopColor: rule ? CHART.BORDER : undefined,
      marginTop: rule ? gap : 0,
      padding: `${rule ? 14 : gap}px 0 2px`,
      color: CHART.MUTE,
      fontFamily: CHART_FONT,
      cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent',
    }}
  >
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.11em',
        textTransform: 'uppercase',
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}
    >
      {label} &rsaquo;
    </span>
  </button>
);

export default SeeAllRow;
