/**
 * HeroShell - the ONE dark profile hero block, shared by the personal profile
 * (ProfileHero); business profiles use ClubProfileHero (CB112).
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
import { HERO_CONTENT_TOP, HERO_CONTENT_BOTTOM } from '@/lib/heroHeights';
import { PhotoBandFade } from '@/features/tourhub/components/overview-v3/HybridHeroBands/photoBandMaterial';

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
/** Pro tallest case: kicker13.2+gap10, avatar72, headline gap20+39.6,
 * counters gap14+rule1+pad13+value18.7+gap4+label15,
 * actions gap16+height44. Round up once; bottom belongs to the shell. */
export const HERO_TALLEST_CONTENT = Math.ceil(11 * 1.2 + 10 + 72 + 20 + 44 * .9 + 14 + 1 + 13 + 17 * 1.1 + 4 + 10 * 1.5 + 16 + 44) + HERO_CONTENT_BOTTOM;

export interface HeroCounter {
  key: string;
  label: string;
  value: number | null;
  displayValue?: React.ReactNode;
  /**
   * BRIEF_PROFILE_PASS_ONE §A — THREE STATES, NOT TWO.
   *  'ok'      figure renders; 0 is a real zero and renders as 0.
   *  'loading' the read is in flight; a quiet dash holds the line.
   *  'error'   nothing is known: the LABEL RENDERS WITHOUT A FIGURE. No zero,
   *            no dash, no placeholder. A fabricated zero is a false fact.
   * Omitted defaults to 'ok', so every existing caller is unchanged.
   */
  state?: 'ok' | 'loading' | 'error';
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
  displayValue?: React.ReactNode;
  state?: 'ok' | 'loading' | 'error';
  onTap?: () => void;
}> = ({ label, value, displayValue, state = 'ok', onTap }) => {
  const inert = !onTap || state === 'error';
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
          letterSpacing: 0,
          ...FIGS,
        }}
      >
        {/* §A — the error branch renders an EMPTY figure line: the label still
            reads, the cell keeps its height, and no number is claimed. */}
        {state === 'error' ? '\u00A0' : displayValue ?? (value == null ? '\u2014' : formatNumber(value))}
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

const HeadlineBlock: React.FC<{
  headline: HeroHeadline;
  headlineAction?: React.ReactNode;
}> = ({ headline, headlineAction }) => {
  const content = (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
        }}
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
        {headlineAction}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 4 }}>
        <span
          style={{
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 0,
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
    </>
  );

  const style = {
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
  } as const;

  return headline.onTap ? (
    <button
      type="button"
      onClick={headline.onTap}
      aria-label={headline.ariaLabel ?? headline.label}
      style={style}
      onPointerDown={(e) => { e.currentTarget.style.opacity = '0.72'; }}
      onPointerUp={(e) => { e.currentTarget.style.opacity = '1'; }}
      onPointerLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
    >
      {content}
    </button>
  ) : (
    <div style={style}>{content}</div>
  );
};

interface HeroShellProps {
  /** Pro-profile opt-ins preserve shell cover/scrim/insets and other callers. */
  nameRef?: React.Ref<HTMLHeadingElement>;
  /** Amber tour-style kicker line above the identity row (pro hero). */
  kicker?: React.ReactNode;
  avatarSize?: number;
  identityContent?: React.ReactNode;
  headlineContent?: React.ReactNode;
  footer?: React.ReactNode;
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
  avatarSize = 56,
  identityContent,
  kicker,
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
  nameRef,
  headlineContent,
  footer,
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
        padding: '0 20px 14px',
        /* The hero pays ONE horizontal inset on both sides and nothing inside
           it may escape that box: an over-wide identity row (long club name +
           badge + FOLLOW + overflow control) used to push its controls past
           the right padding, which read as an asymmetric page. Clipping here
           keeps the left and right gaps identical at every width. */
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        paddingTop: HERO_CONTENT_TOP,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
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
        minHeight: coverUrl ? HERO_CONTENT_TOP + HERO_TALLEST_CONTENT : undefined,



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
          <PhotoBandFade />
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {kicker}
        {/* Identity row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: identityContent ? 14 : 12, minWidth: 0, maxWidth: '100%' }}>
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
                width: avatarSize,
                // No ring on the hero avatar: it sits on the cover photograph,
                // where a hairline reads as an outline rather than a surface.
              }}
            >
              {avatar}
            </div>
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            {identityContent ?? <>
            <h1
              ref={nameRef}
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 0,
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
            </>}
          </div>

          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>

        {/* Headline figure. Omitted entirely when the surface has none - the
            counter strip simply moves up. */}
        {headlineContent ?? (headline && (
          <HeadlineBlock headline={headline} headlineAction={headlineAction} />
        ))}

        {/* Counter strip */}
        {(counters.length > 0 || footer === undefined) && <div
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
            <HeroCell key={c.key} label={c.label} value={c.value} displayValue={c.displayValue} state={c.state} onTap={c.onTap} />
          ))}
        </div>}
        {footer}
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
