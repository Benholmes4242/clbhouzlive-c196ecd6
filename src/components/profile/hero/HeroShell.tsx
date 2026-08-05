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

export const HERO_INK = A.INK;
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
          fontWeight: 800,
          color: '#FFFFFF',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          ...FIGS,
        }}
      >
        {value == null ? '\u2014' : value.toLocaleString()}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 7.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
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
  subline?: string | null;
  /** Right-hand controls (EDIT / FOLLOW pill + glass circles). */
  action?: React.ReactNode;
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
        background: HERO_INK,
        marginTop: 0,
        padding: '0 16px 16px',
        paddingTop: `calc(${HERO_CONTENT_INSET} + 18px)`,
        fontFamily: SANS,
        color: '#FFFFFF',
        isolation: 'isolate',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                border: `2px solid ${W_12}`,
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
                fontWeight: 800,
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
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
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
                  fontWeight: 800,
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
      fontSize: 8,
      fontWeight: 800,
      letterSpacing: '0.14em',
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
