import React, { useState } from 'react';

import { CourseImageFallback } from './CourseImageFallback';
import { A, CARD_SHELL, LABEL, NEW_CARD_RING, NUMF, SANS } from './tokens';

/**
 * THE STANDOUT TILE — one card, two sections (BRIEF_PERSONAL_BESTS_SECTION §3.3).
 *
 * Extracted VERBATIM from AroundTheWorld's tile markup so Standout Rounds and
 * Personal Bests read as siblings by construction rather than by discipline. No
 * value was changed in the move: photo scrim, 10px glass figure chip top-left,
 * plain age label top-right, course name + region over the image, WHO line in
 * ink (amber when the viewer), quiet detail line beneath.
 *
 * The ONE addition Personal Bests needed is `subline` — the server's
 * reference_line, rendered under the detail in a quieter tone. Standout Rounds
 * passes nothing for it, so its tiles are byte-identical to before.
 */

import { SCRIM_STANDOUT } from './photoScrim';

/** The tile scrim, held once in ./photoScrim and shared with the photo rails. */
export const TILE_SCRIM = SCRIM_STANDOUT;

/** A photo at or above this height gets the larger chip and name sizes. */
export const TALL = 180;

interface Props {
  courseId: string;
  courseName: string | null;
  imageUrl: string | null;
  region: string | null;
  /** Photo height in px — a pure function of rank position in both sections. */
  photo: number;
  /** Figure chip. Rendered only when `figure` is present. */
  figure: string | null;
  unit?: string;
  /** Relative age, top-right. */
  whenLabel: string;
  /** Member name, already resolved ("You" for the viewer). */
  who: string;
  isOwn: boolean;
  /** Quiet line under the name. Empty string renders nothing. */
  detail?: string;
  onDetailPress?: () => void;
  /**
   * PERSONAL BESTS ONLY: the server's reference_line. Null renders NOTHING —
   * no dash, no placeholder (§3.5).
   */
  subline?: string | null;
  /** Fixed-width trailing slot on the WHO row (the reaction control). */
  trailing?: React.ReactNode;
  /** Anything below the detail line ("+n more here"). */
  footer?: React.ReactNode;
  /**
   * HERO ONLY (BRIEF_FEAT_SECTIONS_HIERARCHY §1.1, §1.3): names the feat kind
   * above the member row, and grows the course name and the figure chip. Every
   * masonry tile leaves all three undefined and is byte-identical to before.
   */
  kicker?: string | null;
  nameSize?: number;
  chipScale?: 'md' | 'lg';
  /** New-since ring. */
  isNew?: boolean;
  onPress?: () => void;
}


export function StandoutTile({
  courseId,
  courseName,
  imageUrl,
  region,
  photo,
  figure,
  unit,
  whenLabel,
  who,
  isOwn,
  detail = '',
  onDetailPress,
  subline = null,
  trailing,
  footer,
  isNew = false,
  onPress,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const tall = photo >= TALL;

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
      <CourseImageFallback
        courseId={courseId}
        courseName={courseName}
        imageUrl={imageUrl}
        initialsSize={tall ? 26 : 22}
        style={{ height: photo }}
      >
        <div style={{ position: 'absolute', inset: 0, background: TILE_SCRIM }} />

        {/* FIGURE CHIP — the reason the tile exists: 10px radius on a GLASS
            substrate, so the age beside it stops competing. The fill, hairline
            and blur live in `.standout-figure-chip` (liquid-glass.css) because
            the blur must be an @supports enhancement over a flat base fill —
            inline styles cannot express that (BRIEF_STANDOUT_TILE_MARGIN §5a). */}
        {figure && (
          <span
            className="standout-figure-chip"
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 10,
            }}
          >
            <span
              style={{
                ...NUMF,
                fontSize: 16,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                /* The fill is now DARK glass (BRIEF_GLASS_BADGES_DARK), so the
                   figure carries itself — no shadow floor is needed against a
                   light tint any more. */
                color: '#FFFFFF',
              }}
            >
              {figure}
            </span>
            {unit && (
              <span
                style={{
                  fontSize: 6.5,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                {unit}
              </span>
            )}
          </span>
        )}

        {/* AGE — the least important fact on the tile, so not a pill. */}
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
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

        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 9 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.025em',
              lineHeight: 1.14,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {courseName}
          </div>
          {region && (
            <div
              style={{
                ...LABEL,
                fontSize: 6.5,
                color: 'rgba(255,255,255,0.60)',
                marginTop: 3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {region}
            </div>
          )}
        </div>
      </CourseImageFallback>

      {/* TEXT PANEL — no figure here. One figure per tile. */}
      <div style={{ padding: '11px 13px 12px' }}>
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
            role={onDetailPress ? 'button' : undefined}
            onClick={
              onDetailPress
                ? (ev) => {
                    ev.stopPropagation();
                    onDetailPress();
                  }
                : undefined
            }
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
              cursor: onDetailPress ? 'pointer' : 'inherit',
            }}
          >
            {detail}
          </div>
        )}

        {/* THE REFERENCE LINE (§3.5). Quieter than the detail, never a
            placeholder when absent. */}
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

        {footer}
      </div>
    </div>
  );
}

export default StandoutTile;
