import React, { useState } from 'react';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

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
  /**
   * FIGURE TONE — the glass chip's numeral colour. Defaults to flat white
   * (BRIEF_GLASS_BADGES_DARK). "Beating the course" passes the app's TOPAR red
   * so an under-par figure reads as under par here as it does everywhere else.
   */
  figureTone?: string;

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
  /**
   * THE MEMBER'S AVATAR (BRIEF_FEAT_SECTIONS_FINISHING §3) — 20px squircle to
   * the left of the name, on EVERY tier. `avatarUserId` must be the member's
   * user id: the deterministic fallback colour hashes it, so a photo-less
   * member matches their own initials tile in the Clubhouse feed and the
   * friends rail. Hashing the display name instead would still be stable but
   * would NOT match, which is the whole point.
   */
  avatarUrl?: string | null;
  avatarUserId?: string | null;
  /**
   * NEW PERSONAL HIGHS ONLY (§5): the improvement over the previous best, drawn
   * INSIDE the one glass chip after a hairline. A figure with an ARROW is a
   * MOVEMENT — green is better, red is worse — which is a different scale from
   * a SCORE, where under par is red. Do not "correct" this to red.
   *
   * There is deliberately NO red branch: these kinds only fire when the
   * previous best is beaten, so the delta is always positive (§5.7).
   */
  delta?: number | null;
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
  kicker = null,
  avatarUrl = null,
  avatarUserId = null,
  delta = null,
  figureTone,
  nameSize,
  chipScale = 'md',
  isNew = false,
  onPress,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const tall = photo >= TALL;
  const large = chipScale === 'lg';

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
              padding: large ? '6px 12px' : '5px 10px',
              borderRadius: large ? 12 : 10,
            }}
          >
            <span
              style={{
                ...NUMF,
                fontSize: large ? 22 : 16,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                /* The fill is now DARK glass (BRIEF_GLASS_BADGES_DARK), so the
                   figure carries itself — no shadow floor is needed against a
                   light tint any more. */
                color: figureTone ?? '#FFFFFF',
              }}
            >
              {figure}
            </span>
            {unit && (
              <span
                style={{
                  fontSize: large ? 7.5 : 6.5,
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
            {delta != null && delta > 0 ? (
              <>
                <span
                  aria-hidden
                  style={{
                    alignSelf: 'stretch',
                    width: 1,
                    marginLeft: 2,
                    background: 'rgba(255,255,255,0.24)',
                  }}
                />
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  {/* A DRAWN TRIANGLE, NOT AN EMOJI (§5.5): an emoji fights the
                      tabular figures and renders differently per platform. */}
                  <svg width="7" height="6" viewBox="0 0 7 6" aria-hidden>
                    <path d="M3.5 0 7 6H0z" fill="#4ADE80" />
                  </svg>
                  <span
                    style={{
                      ...NUMF,
                      fontSize: 13,
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      /* #4ADE80 survives a bright sky; BAND_GREEN #047857 does
                         not (§5.9) — the review chip's problem. */
                      color: '#4ADE80',
                    }}
                  >
                    {delta}
                  </span>
                </span>
              </>
            ) : null}
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
              fontSize: nameSize ?? 14,
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
        {/* HERO KICKER (§1.3) — the feat kind, so the hero says WHAT it is
            before it says who did it. Ink, not amber: amber means the viewer. */}
        {kicker ? (
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              lineHeight: 1,
              color: A.MUTE,
              marginBottom: 7,
            }}
          >
            {kicker}
          </div>
        ) : null}
        {/* THE NAME ROW owns the whole width now: the reaction control moved
            DOWN onto the detail line, so a long member name wraps to a second
            line instead of being cut off mid-word. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {who || detail}
          </div>
        </div>

        {/* THE FACT LINE, WITH THE REACTION ON IT. The heart rides the LAST
            wording line the tile renders — the detail ("Bogey-free round") when
            there is one, otherwise the reference line — never a bare row of its
            own between the name and the wording. */}
        {(() => {
          const detailText = who ? detail : '';
          const factText = detailText || subline || '';
          const factIsSubline = !detailText && !!subline;
          const press = factIsSubline ? undefined : onDetailPress;
          return (
            <>
              {(!!factText || !!trailing) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: factIsSubline ? 3 : 2,
                    minHeight: 20,
                  }}
                >
                  <div
                    role={press ? 'button' : undefined}
                    onClick={
                      press
                        ? (ev) => {
                            ev.stopPropagation();
                            press();
                          }
                        : undefined
                    }
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: factIsSubline ? 11 : 12,
                      fontWeight: 600,
                      lineHeight: factIsSubline ? 1.3 : 1.32,
                      color: factIsSubline ? 'rgba(104,112,123,0.78)' : A.MUTE,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      cursor: press ? 'pointer' : 'inherit',
                    }}
                  >
                    {factText}
                  </div>
                  {trailing}
                </div>
              )}

              {/* THE REFERENCE LINE (§3.5) — only when it did not already carry
                  the reaction above. Never a placeholder when absent. */}
              {subline && !factIsSubline ? (
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
            </>
          );
        })()}

        {footer}
      </div>
    </div>
  );
}

export default StandoutTile;
