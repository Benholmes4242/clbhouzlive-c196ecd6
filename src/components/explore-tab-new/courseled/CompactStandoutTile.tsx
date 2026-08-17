import React, { useState } from 'react';

import { A, CARD_SHELL, LABEL, NEW_CARD_RING, NUMF, SANS } from './tokens';

/**
 * THE COMPACT STANDOUT TILE (BRIEF_FEAT_SECTIONS_HIERARCHY §1.7, §1.8).
 *
 * No photograph. The FIGURE leads at 26px, then the course name, a hairline,
 * then the member row and the detail. Two jobs:
 *
 *   §1.7  the two least-rare kinds (a round under par, a birdie haul) never
 *         take a photograph — they are the floor of the section's scale.
 *   §1.8  a course that has ALREADY appeared renders compact on every later
 *         tile, because five near-identical fairways is what made the section
 *         read as wallpaper.
 *
 * HEIGHT IS ESTIMATED, NOT MEASURED (§0.1) — see `estimateCompactHeight`, which
 * is billed from the very geometry written below and nothing else. If you change
 * a padding, a font size or a line height here, change the estimate in the same
 * edit or the masonry columns drift.
 */

/**
 * Fixed chrome, in the order it renders:
 *
 *   padding            11 top + 12 bottom                    = 23
 *   figure row         26px numeral at lineHeight 1           = 26
 *   course name        13/700 at lineHeight 1.2 (~16), mt 4   = 20
 *   hairline           1px rule with 9px either side          = 19
 *   WHO row            13/700 one line, matching the photo tile = 18
 *                                                         base = 106
 *
 * Then, only when present:
 *   detail   marginTop 2 + 16 a line (12/600 at lineHeight 1.32), max 2 lines
 *   subline  marginTop 3 + 15 a line (11/600 at lineHeight 1.3), max 2 lines
 *
 * The line counts use the SAME ~151px inner-width character thresholds as
 * `estimatePanelHeight` in AroundTheWorld, so the two shapes bill text alike.
 */
export const COMPACT_BASE = 106;

export function estimateCompactHeight(detail: string, subline: string): number {
  const lines = detail ? Math.min(2, Math.ceil(detail.length / 24)) : 0;
  const subLines = subline ? Math.min(2, Math.ceil(subline.length / 25)) : 0;
  return (
    COMPACT_BASE +
    (lines > 0 ? 2 + lines * 16 : 0) +
    (subLines > 0 ? 3 + subLines * 15 : 0)
  );
}

interface Props {
  courseName: string | null;
  region?: string | null;
  figure: string | null;
  unit?: string;
  whenLabel: string;
  who: string;
  isOwn: boolean;
  detail?: string;
  subline?: string | null;
  trailing?: React.ReactNode;
  isNew?: boolean;
  onPress?: () => void;
}

export function CompactStandoutTile({
  courseName,
  figure,
  unit,
  whenLabel,
  who,
  isOwn,
  detail = '',
  subline = null,
  trailing,
  isNew = false,
  onPress,
}: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPress}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        ...CARD_SHELL,
        ...(isNew ? NEW_CARD_RING : null),
        padding: '11px 13px 12px',
        textAlign: 'left',
        fontFamily: SANS,
        cursor: onPress ? 'pointer' : 'default',
        opacity: pressed ? 0.72 : 1,
        transition: 'opacity 120ms ease',
      }}
    >
      {/* FIGURE LEADS. The age sits on the same baseline row, right, where the
          photo tile put it in the top-right corner. */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ ...NUMF, fontSize: 26, lineHeight: 1, color: A.INK }}>
          {figure ?? '—'}
        </span>
        {unit ? (
          <span
            style={{
              fontSize: 7,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              lineHeight: 1,
              color: A.MUTE,
            }}
          >
            {unit}
          </span>
        ) : null}
        <span style={{ ...LABEL, fontSize: 6.5, marginLeft: 'auto', color: A.DIM }}>
          {whenLabel}
        </span>
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          color: A.INK,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {courseName}
      </div>

      <div
        style={{
          height: 1,
          margin: '9px 0',
          background: A.BORDER,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: isOwn ? A.AMBER_DEEP : A.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {who || detail}
        </div>
        {trailing}
      </div>

      {!!who && !!detail && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.32,
            color: A.MUTE,
            marginTop: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {detail}
        </div>
      )}

      {subline ? (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'rgba(104,112,123,0.78)',
            marginTop: 3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {subline}
        </div>
      ) : null}
    </div>
  );
}

export default CompactStandoutTile;
