/**
 * ProfileCoverBand — BRIEF_PROFILE_TOP_REBUILD §A. The ONE home for the
 * personal profile's 176px cover band: photograph, wash, ramp, status-bar
 * guard and the identity row. The business profile keeps HeroShell; this band
 * is personal-only and never carries HeroShell's square pinned-height logic.
 */
import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { COVER_TOP_GUARD, W_55 } from './HeroShell';
import { HERO_CANON_WASH } from '@/features/tourhub/_shared/heroGradient';

/**
 * Band height tracks the safe area: inset + 62 (HERO_CONTENT_INSET) + 104
 * (34 air + 56 avatar + 14 padding), floored at 200 for no-inset devices.
 */
export const BAND_HEIGHT = 'max(calc(var(--sat, env(safe-area-inset-top, 0px)) + 62px + 104px), 200px)';
/** Control skin over the band (EDIT pill and the overflow dots). */
export const BAND_CONTROL_BORDER = 'rgba(255,255,255,0.22)';
export const BAND_CONTROL_GROUND = 'rgba(10,14,10,0.40)';
const BAND_AVATAR_BORDER = 'rgba(255,255,255,0.14)';
const ON_AMBER = '#0A0A0C';

export const BandPill = React.forwardRef<
  HTMLButtonElement,
  { label: React.ReactNode; onClick?: () => void; disabled?: boolean; solid?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ label, onClick, disabled, solid, style, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    disabled={disabled}
    {...rest}
    style={{
      height: 32,
      padding: '0 14px',
      borderRadius: 999,
      border: `1px solid ${solid ? '#FFFFFF' : BAND_CONTROL_BORDER}`,
      background: solid ? '#FFFFFF' : BAND_CONTROL_GROUND,
      color: solid ? A.CANVAS : '#FFFFFF',
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: SANS,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      ...style,
    }}
  >
    {label}
  </button>
));
BandPill.displayName = 'BandPill';

export const BandDots = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ style, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label="More options"
      {...rest}
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        borderRadius: 999,
        border: `1px solid ${BAND_CONTROL_BORDER}`,
        background: BAND_CONTROL_GROUND,
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        ...style,
      }}
    >
      <MoreHorizontal size={15} strokeWidth={2.25} color="currentColor" />
    </button>
  ),
);
BandDots.displayName = 'BandDots';

interface Props {
  coverUrl: string | null;
  avatar: React.ReactNode;
  onAvatarTap?: () => void;
  displayName: string;
  /** Pre-joined home club · region; null when neither resolves. */
  subline: string | null;
  /** Own profile with no subline: "Add your home club" → edit route. */
  onAddHomeClub?: () => void;
  addHomeClubLabel?: string;
  action?: React.ReactNode;
}

export const ProfileCoverBand: React.FC<Props> = ({
  coverUrl,
  avatar,
  onAvatarTap,
  displayName,
  subline,
  onAddHomeClub,
  addHomeClubLabel,
  action,
}) => {
  const [broken, setBroken] = React.useState(false);
  React.useEffect(() => setBroken(false), [coverUrl]);
  const showCover = !!coverUrl && !broken;

  return (
    <section
      style={{
        position: 'relative',
        height: BAND_HEIGHT,
        overflow: 'hidden',
        background: A.CANVAS,
        fontFamily: SANS,
        isolation: 'isolate',
      }}
    >
      {showCover && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img
            src={coverUrl as string}
            alt=""
            decoding="async"
            onError={() => setBroken(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: HERO_CANON_WASH }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: COVER_TOP_GUARD }} />
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          zIndex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onAvatarTap}
          disabled={!onAvatarTap}
          aria-label={displayName}
          style={{
            width: 56,
            height: 56,
            borderRadius: 19,
            flexShrink: 0,
            overflow: 'hidden',
            border: `1px solid ${BAND_AVATAR_BORDER}`,
            padding: 0,
            background: 'transparent',
            lineHeight: 0,
            cursor: onAvatarTap ? 'pointer' : 'default',
          }}
        >
          {avatar}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 21,
              textShadow: '0 1px 10px rgba(0,0,0,0.55)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              color: '#FFFFFF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </h1>
          {subline ? (
            <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 600, color: W_55, textShadow: '0 1px 8px rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subline}
            </div>
          ) : onAddHomeClub ? (
            <button
              type="button"
              onClick={onAddHomeClub}
              style={{ display: 'block', marginTop: 3, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: W_55, textShadow: '0 1px 8px rgba(0,0,0,0.5)', textAlign: 'left' }}
            >
              {addHomeClubLabel}
            </button>
          ) : null}
        </div>

        {action && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 3 }}>
            {action}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProfileCoverBand;
