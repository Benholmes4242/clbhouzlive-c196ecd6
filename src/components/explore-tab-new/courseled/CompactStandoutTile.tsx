import React, { useState } from 'react';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

import { CourseImageFallback } from './CourseImageFallback';
import { TILE_SCRIM } from './StandoutTile';
import { A, CARD_SHELL, NEW_CARD_RING, NUMF, SANS } from './tokens';

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
 * Fixed chrome, in the order it renders (BRIEF_FEAT_SECTIONS_FINISHING §2):
 *
 *   PHOTO STRIP        78px, scrim + course name on it       = 78
 *   padding            11 top + 12 bottom                    = 23
 *   figure row         26px numeral at lineHeight 1           = 26
 *   WHO row            marginTop 9 + 18 (13/700 one line)      = 27
 *                                                         base = 154
 *
 * The strip is why the course name and the hairline are gone from the text
 * panel: the name now sits on the photograph, exactly as on the full tile. A
 * tile with no resolvable image still renders the strip at 78 (the gradient and
 * initials), so the tier's height stays predictable (§2.5).
 *
 * Then, only when present:
 *   detail   marginTop 2 + 16 a line (12/600 at lineHeight 1.32), max 2 lines
 *   subline  marginTop 3 + 15 a line (11/600 at lineHeight 1.3), max 2 lines
 *
 * The line counts use the SAME ~151px inner-width character thresholds as
 * `estimatePanelHeight` in AroundTheWorld, so the two shapes bill text alike.
 */
/** The strip height (§2.3). */
export const PHOTO_STRIP = 78;

export const COMPACT_BASE = 154;

export function estimateCompactHeight(
  detail: string,
  subline: string,
  who = '',
): number {
  const lines = detail ? Math.min(2, Math.ceil(detail.length / 24)) : 0;
  const subLines = subline ? Math.min(2, Math.ceil(subline.length / 25)) : 0;
  // The name row now wraps to a second line rather than truncating (~19 chars
  // fit one line at 13/700 in the ~151px inner width), and the detail row holds
  // the reaction control, so it is never shorter than 20px.
  const whoLines = who ? Math.min(2, Math.ceil(who.length / 19)) : 1;
  return (
    COMPACT_BASE +
    (whoLines - 1) * 18 +
    2 + Math.max(lines * 16, 20) +
    (subLines > 0 ? 3 + subLines * 15 : 0)
  );
}


interface Props {
  courseId: string;
  imageUrl?: string | null;
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
  /** See StandoutTile: 20px squircle left of the name, hashed on the USER ID. */
  avatarUrl?: string | null;
  avatarUserId?: string | null;
  onPress?: () => void;
}

export function CompactStandoutTile({
  courseId,
  imageUrl = null,
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
  avatarUrl = null,
  avatarUserId = null,
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
        padding: 0,
        textAlign: 'left',
        fontFamily: SANS,
        cursor: onPress ? 'pointer' : 'default',
        opacity: pressed ? 0.72 : 1,
        transition: 'opacity 120ms ease',
      }}
    >
      {/* THE PHOTO STRIP (§2.2) — same scrim, same course name treatment as the
          full tile, at 78px so the tier stays shorter than a photo tile without
          being photoless. */}
      <CourseImageFallback
        courseId={courseId}
        courseName={courseName}
        imageUrl={imageUrl}
        initialsSize={18}
        style={{ height: PHOTO_STRIP }}
      >
        <div style={{ position: 'absolute', inset: 0, background: TILE_SCRIM }} />
        <span
          style={{
            position: 'absolute',
            top: 7,
            right: 9,
            fontSize: 6.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.72)',
            textShadow: '0 1px 2px rgba(10,14,10,0.55)',
          }}
        >
          {whenLabel}
        </span>
        <div
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 8,
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.025em',
            lineHeight: 1.14,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {courseName}
        </div>
      </CourseImageFallback>

      <div style={{ padding: '11px 13px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, height: 26 }}>
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
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 9 }}>
        {who ? (
          <SquircleAvatar
            src={avatarUrl}
            userId={avatarUserId}
            alt={who}
            size={20}
            hideRing
          />
        ) : null}
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
    </div>
  );
}

export default CompactStandoutTile;
