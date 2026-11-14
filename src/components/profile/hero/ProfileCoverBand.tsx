/**
 * ProfileCoverBand — BRIEF_PROFILE_TOP_REBUILD §A. The ONE home for the
 * personal profile's aspect-ratio cover band (PERSONAL_COVER_ASPECT_CSS):
 * photograph, wash, ramp, status-bar guard and the identity row. This band
 * is personal-only and never carries HeroShell's square pinned-height logic.
 */
import React from 'react';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import '@/features/creator/profile-creator.css';
import { MoreHorizontal } from 'lucide-react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { INVERTED_CONTROL_SURFACE } from '@/lib/tokens/surfaces';
import { W_55 } from './HeroShell';
import { HERO_CONTENT_TOP, HERO_CONTENT_BOTTOM } from '@/lib/heroHeights';
import { MASTHEAD_KICKER } from '@/components/courses/CourseMasthead';
import { PhotoBandFade } from '@/features/tourhub/components/overview-v3/HybridHeroBands/photoBandMaterial';

/** Control skin over the band (EDIT pill and the overflow dots). */
export const BAND_CONTROL_BORDER = 'rgba(255,255,255,0.22)';
export const BAND_CONTROL_GROUND = 'rgba(10,14,10,0.40)';
const BAND_AVATAR_BORDER = 'rgba(255,255,255,0.14)';

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
      border: `1px solid ${solid ? INVERTED_CONTROL_SURFACE : BAND_CONTROL_BORDER}`,
      background: solid ? INVERTED_CONTROL_SURFACE : BAND_CONTROL_GROUND,
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
  /** HB5: page-owned observation; standalone band rendering remains inert. */
  nameRef?: React.Ref<HTMLHeadingElement>;
  isCreator?: boolean;
  isPro?: boolean;
  /** Pre-joined home club · region; null when neither resolves. */
  subline: string | null;
  /** Optional member coach line, privacy/read ownership remains with its caller. */
  afterSubline?: React.ReactNode;
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
  nameRef,
  isCreator = false,
  isPro = false,
  subline,
  afterSubline,
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
        paddingTop: HERO_CONTENT_TOP,
        paddingBottom: HERO_CONTENT_BOTTOM,
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
          <PhotoBandFade />
        </div>
      )}

      <div
        style={{
          position: 'relative',
          margin: '0 20px',
          zIndex: 1,
        }}
      >
        {/* Row 1: the home club as the amber kicker, controls on the right.
            With no club the controls sit alone on the right. */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, height: 11 * 1.2 }}>
          {subline ? (
            <span style={{ ...MASTHEAD_KICKER, minWidth: 0 }}>{subline}</span>
          ) : onAddHomeClub ? (
            <button
              type="button"
              onClick={onAddHomeClub}
              style={{ ...MASTHEAD_KICKER, minWidth: 0, color: W_55, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, textAlign: 'left' }}
            >
              {addHomeClubLabel}
            </button>
          ) : (
            <span />
          )}
          {action && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, margin: '-10px 0' }}>
              {action}
            </div>
          )}
        </div>

        {/* Row 2: the 56px avatar beside the name. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
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
            <div className={isPro ? 'pro-identity-row' : isCreator ? "profile-creator-identity" : undefined}>
            <h1
              ref={nameRef}
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 0,
                lineHeight: 1.1,
                color: '#FFFFFF',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                overflow: 'hidden',
              }}
            >
              {displayName}
            </h1>
            {(isPro || isCreator) && <span className="identity-badges">
              {isPro && <ProLabel size="large" />}
              {isCreator && <span className="profile-creator-label" data-size="large"><span className="pro-label-text">Creator</span></span>}
            </span>}
            </div>
            {afterSubline}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileCoverBand;
