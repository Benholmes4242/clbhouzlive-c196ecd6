/**
 * HeroShell - the ONE dark profile hero block, shared by the personal profile
 * (ProfileHero) and the business profile (BusinessProfileHero).
 *
 * BRIEF_BUSINESS_PROFILE_HERO rule 5: extract, do not fork. Everything that is
 * geometry, scrim, cover fallback, identity row, headline block and counter
 * strip lives here; each surface passes its own labels, figures and controls.
 *
 * This is the app's ONLY dark block outside media chrome - a deliberate
 * exception to the light-only rule. Do not copy it elsewhere.
 */
import React from 'react';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { formatNumber } from '@/i18n/format';

/* The hero's FALLBACK GROUND, shown only when there is no cover photo.
   Named HERO_INK while the app was light, which hid the fact that it was a
   background: after the dark flip it painted a near-white band under five
   #FFFFFF labels. It is never used as an ink — the labels stay white because
   they also sit over the cover photograph. */
export const HERO_GROUND = A.CANVAS;
export const W_55 = 'rgba(255,255,255,0.55)';
export const W_45 = 'rgba(255,255,255,0.45)';
export const W_40 = 'rgba(255,255,255,0.40)';
export const W_35 = 'rgba(255,255,255,0.35)';
export const W_25 = 'rgba(255,255,255,0.25)';
export const W_12 = 'rgba(255,255,255,0.12)';
export const W_10 = 'rgba(255,255,255,0.10)';

/** Flat wash, then vertical ramp. If a figure ever loses contrast on a bright
 *  cover, DEEPEN these - never lighten the text. */
export const COVER_WASH = 'rgba(14,18,22,0.58)';
export const COVER_RAMP =
  'linear-gradient(180deg, rgba(14,18,22,0.42) 0%, rgba(14,18,22,0.80) 100%)';

/** The hero ARTWORK bleeds to the very top of the viewport (behind the status
 *  bar and both floating islands); only the CONTENT is inset by safe-area +
 *  island row (top offset 10 + ISLAND_H 44) + 8px. */
export const HERO_CONTENT_INSET =
  'calc(var(--sat, env(safe-area-inset-top, 0px)) + 62px)';

/* ------------------------------------------------------------------ *
 * PINNED BLOCK HEIGHT
 *
 * The block must NOT grow as the index, trend and history resolve - the
 * cover would reflow under the member mid-render, and the crop ratio
 * would be unknowable. So the shell carries a MIN-HEIGHT equal to its
 * TALLEST content case: personal profile with index, trend chip AND
 * sparkline.
 *
 * Every figure below is the literal the component itself renders, so
 * this stays honest if the type scale moves. Text line boxes are
 * fontSize x LINE (SF Pro resolves `line-height: normal` to 1.5) except
 * where a lineHeight is stated inline.
 * ------------------------------------------------------------------ */
const LINE = 1.5;
const H_PAD_TOP = 18;          // content gap below HERO_CONTENT_INSET
const H_PAD_BOTTOM = 16;       // section padding-bottom
const H_IDENTITY_ROW = 56;     // 56px avatar floors the row (name + subline are shorter)
const H_HEADLINE_GAP = 18;     // headline button marginTop
const H_HEADLINE_LABEL = 8.5 * LINE;
const H_FIGURE_GAP = 4;
const H_FIGURE = 40;           // fontSize 40, lineHeight 1
const H_SPARKLINE = 10 + 42;   // ProfileHero sparkline: marginTop 10 + H 42
const H_STRIP_GAP = 14;        // counter strip marginTop
const H_STRIP_RULE = 1;        // 1px borderTop
const H_STRIP_PAD = 13;        // counter strip paddingTop
const H_CELL_VALUE = 17 * 1.1; // HeroCell figure, lineHeight 1.1
const H_CELL_LABEL_GAP = 4;
const H_CELL_LABEL = 7.5 * LINE;

/** Tallest content stack, rounded up to a whole pixel. */
const HERO_TALLEST_CONTENT = Math.ceil(
  H_PAD_TOP +
    H_IDENTITY_ROW +
    H_HEADLINE_GAP +
    H_HEADLINE_LABEL +
    H_FIGURE_GAP +
    H_FIGURE +
    H_SPARKLINE +
    H_STRIP_GAP +
    H_STRIP_RULE +
    H_STRIP_PAD +
    H_CELL_VALUE +
    H_CELL_LABEL_GAP +
    H_CELL_LABEL +
    H_PAD_BOTTOM,
);

/** A FLOOR, not a height. The hero's SHAPE is set by the 1/1 aspectRatio
 *  applied alongside this (see the root style), so the block renders as the
 *  LARGER of viewport width and this floor - square on 390/430, slightly
 *  taller on 320. The floor survives because the aspect alone would let the
 *  block reflow as the index, trend chip and sparkline resolve, and on the
 *  narrowest phones a square box is shorter than the content stack. Tracks the
 *  safe area because HERO_CONTENT_INSET carries `var(--sat)` rather than a
 *  measured number. */
export const HERO_MIN_HEIGHT =
  `calc(${HERO_CONTENT_INSET} + ${HERO_TALLEST_CONTENT}px)`;

/** Short top gradient so white status-bar text stays legible over a bright
 *  cover; fades out by 60px. */
export const COVER_TOP_GUARD =
  'linear-gradient(180deg, rgba(14,18,22,0.45) 0%, rgba(14,18,22,0) 60px)';

export interface HeroCounter {
  key: string;
  label: string;
  value: number | null;
  onTap?: () => void;
}

export interface HeroHeadline {
  label: string;
  /** Pre-formatted figure; the shell never rounds or formats a value. */
  value: string;
  /** Band colour on dark, or white for the handicap index. */
  color?: string;
  /** Trend chip / rating count, rendered baseline-aligned to the figure. */
  aside?: React.ReactNode;
  ariaLabel?: string;
  onTap?: () => void;
  /** Optional sparkline row; omitted when no series exists. */
  below?: React.ReactNode;
}

export const HeroCell: React.FC<{
  label: string;
  value: number | null;
  onTap?: () => void;
}> = ({ label, value, onTap }) => {
  const inert = !onTap;
  return (
    <button
      type="button"
      onClick={(e) => {
        // Counter cells must never bubble into the hero or headline tap.
        e.stopPropagation();
        onTap?.();
      }}
      disabled={inert}
      onPointerDown={(e) => { e.currentTarget.style.opacity = '0.72'; }}
      onPointerUp={(e) => { e.currentTarget.style.opacity = '1'; }}
      onPointerLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      style={{
        flex: 1,
        minWidth: 0,
        background: 'transparent',
        border: 'none',
        padding: 0,
        textAlign: 'center',
        cursor: inert ? 'default' : 'pointer',
        fontFamily: SANS,
        transition: 'opacity 120ms ease',
      }}
    >
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: '#FFFFFF',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          ...FIGS,
        }}
      >
        {value == null ? '\u2014' : formatNumber(value)}
      </div>
      <div
        style={{
          marginTop: 4,
          // AXIS floor 10 exception: labels a counter figure over the cover photo.
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: W_45,
        }}
      >
        {label}
      </div>
    </button>
  );
};

interface HeroShellProps {
  /** Resolved cover image; the shell handles the broken-image fallback. */
  coverUrl?: string | null;
  /** 56px avatar node (SquircleAvatar on personal, logo on business). */
  avatar: React.ReactNode;
  onAvatarTap?: () => void;
  avatarLabel?: string;
  displayName: string;
  /** Verified badge or similar, inline after the name. */
  nameSuffix?: React.ReactNode;
  /** PHASE 5B §2 — a node, so the business hero can add its evidence line. */
  subline?: React.ReactNode;
  /** Right-hand controls in the identity row (EDIT / FOLLOW pill + glass circles). */
  action?: React.ReactNode;
  /** Right-hand controls inside the headline block (e.g. business profile actions
   *  aligned with the community rating). */
  headlineAction?: React.ReactNode;
  headline?: HeroHeadline | null;
  counters: HeroCounter[];
  /** Two-cell counter sets read better centred than stretched. */
  centreCounters?: boolean;
}

export const HeroShell: React.FC<HeroShellProps> = ({
  coverUrl,
  avatar,
  onAvatarTap,
  avatarLabel,
  displayName,
  nameSuffix,
  subline,
  action,
  headlineAction,
  headline,
  counters,
  centreCounters = false,
}) => {
  const [coverBroken, setCoverBroken] = React.useState(false);
  React.useEffect(() => setCoverBroken(false), [coverUrl]);
  const showCover = !!coverUrl && !coverBroken;

  return (
    <section
      style={{
        position: 'relative',
        background: HERO_GROUND,
        marginTop: 0,
        padding: '0 16px 16px',
        /* The hero pays ONE horizontal inset on both sides and nothing inside
           it may escape that box: an over-wide identity row (long club name +
           badge + FOLLOW + overflow control) used to push its controls past
           the right padding, which read as an asymmetric page. Clipping here
           keeps the left and right gaps identical at every width. */
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        /* MINIMUM top inset - it clears the status bar and ChromeIsland and
           still does under bottom-anchoring: `justify-content: flex-end`
           packs content against the padding box's BOTTOM edge and can only
           ever overflow downwards, never up past padding-top. */
        paddingTop: `calc(${HERO_CONTENT_INSET} + 18px)`,
        /* Content bottom-anchors. The floor below is set by the TALLEST
           content case (personal hero with index, trend and sparkline), which
           fills it exactly - so this is a no-op there. Heroes with less inside
           them (business, personal with no handicap connection) used to strand
           their identity block at the top with the slack collecting beneath
           it; now the slack collects ABOVE as photograph. Heroes with no cover
           have no floor, so there is no slack and nothing moves. */
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        fontFamily: SANS,
        color: '#FFFFFF',
        isolation: 'isolate',
        /* The floor exists to make the crop knowable and to stop a cover
           reflowing mid-render. Both need a photograph, so with no cover and
           no fallback the block returns to CONTENT height rather than paying
           127px of flat ink. Gated on the resolved URL, NOT on `showCover`:
           `coverBroken` is set by onError after first paint, so gating on it
           would collapse the block post-paint - a worse jump than the one the
           floor removes. A URL that 404s keeps the floor and shows ink. */
        /* The SHAPE: the cropper takes a 1:1 crop, so the hero holds 1:1 too.
           Box renders as the larger of width and the floor. */
        aspectRatio: coverUrl ? '1 / 1' : undefined,
        minHeight: coverUrl ? HERO_MIN_HEIGHT : undefined,



      }}
    >
      {/* Cover photograph under a heavy scrim - decoration only, never a
          control, and it never changes the height of the block. */}
      {showCover && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <img
            src={coverUrl as string}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setCoverBroken(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: COVER_WASH }} />
          <div style={{ position: 'absolute', inset: 0, background: COVER_RAMP }} />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 60,
              background: COVER_TOP_GUARD,
            }}
          />
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Identity row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, maxWidth: '100%' }}>
          <button
            type="button"
            onClick={onAvatarTap}
            disabled={!onAvatarTap}
            aria-label={avatarLabel ?? displayName}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              flexShrink: 0,
              borderRadius: 16,
              cursor: onAvatarTap ? 'pointer' : 'default',
              lineHeight: 0,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                overflow: 'hidden',
                // No ring on the hero avatar: it sits on the cover photograph,
                // where a hairline reads as an outline rather than a surface.
              }}
            >
              {avatar}
            </div>
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#FFFFFF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
              {nameSuffix}
            </h1>
            {subline && (
              <div
                style={{
                  marginTop: 3,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: W_55,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {subline}
              </div>
            )}
          </div>

          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>

        {/* Headline figure. Omitted entirely when the surface has none - the
            counter strip simply moves up. */}
        {headline && (
          <button
            type="button"
            onClick={headline.onTap}
            disabled={!headline.onTap}
            aria-label={headline.ariaLabel ?? headline.label}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 18,
              padding: 0,
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              color: 'inherit',
              fontFamily: SANS,
              cursor: headline.onTap ? 'pointer' : 'default',
              transition: 'opacity 120ms ease',
            }}
            onPointerDown={(e) => { e.currentTarget.style.opacity = '0.72'; }}
            onPointerUp={(e) => { e.currentTarget.style.opacity = '1'; }}
            onPointerLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: W_45,
              }}
            >
              {headline.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 4 }}>
              <span
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  color: headline.color ?? '#FFFFFF',
                  ...FIGS,
                }}
              >
                {headline.value}
              </span>
              {headline.aside}
            </div>
            {headline.below}
          </button>
        )}

        {/* Counter strip */}
        <div
          style={{
            marginTop: 14,
            borderTop: `1px solid ${W_10}`,
            paddingTop: 13,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: centreCounters ? 'center' : undefined,
          }}
        >
          {counters.map((c) => (
            <HeroCell key={c.key} label={c.label} value={c.value} onTap={c.onTap} />
          ))}
        </div>
      </div>
    </section>
  );
};

/** The EDIT pill (own profile) and the shell for other-member controls. */
export const HeroPill: React.FC<{
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ label, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      background: 'transparent',
      border: `1px solid ${W_25}`,
      borderRadius: 999,
      color: '#FFFFFF',
      fontFamily: SANS,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      padding: '9px 14px',
      minHeight: 34,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

/** 28px glass circle used for MANAGE / "..." style hero controls. */
export const HeroGlassCircle: React.FC<{
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ label, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    style={{
      width: 28,
      height: 28,
      flexShrink: 0,
      borderRadius: 999,
      background: W_12,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      padding: 0,
    }}
  >
    {children}
  </button>
);

export default HeroShell;
