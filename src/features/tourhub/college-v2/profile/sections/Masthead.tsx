/**
 * Masthead — charcoal head for the college profile.
 *
 * Crest squircle 66 · eyebrow (THE FRANCHISE · No.R) · school name ·
 * meta (points · alumni · playing-now) · Follow button (right).
 *
 * Follow behaviour: ports the exact optimistic pattern from
 * useFollowCollegeMutations (insert/delete + invalidate followed-colleges).
 * Button state derived from useIsCollegeFollowed.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords } from 'lucide-react';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { collegeHubRoute } from '@/features/tourhub/routes';
import {
  useFollowCollegeMutations,
  useIsCollegeFollowed,
} from '@/features/tourhub/hooks/useCollegeMovers';
import { dominantColorFromImage, darkenTowardCharcoal } from '@/lib/dominantColor';
import {
  AMBER,
  CHARCOAL,
  FONT,
  GOLD,
  GOLD_DEEP,
  STATUS_LIVE,
  WHITE_ALPHA_10,
  WHITE_ALPHA_18,
  WHITE_ALPHA_55,
  WHITE_ALPHA_65,
} from '@/features/tourhub/_shared/tokens';

interface Props {
  slug: string;
  displayName: string;
  rank: number | null;
  pointsTotal: number;
  alumniCount: number;
  playingNow: number;
}

function formatPoints(n: number): string {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function Masthead({ slug, displayName, rank, pointsTotal, alumniCount, playingNow }: Props) {
  const { user } = useSupabaseSession();
  const isFollowed = useIsCollegeFollowed(user?.id, slug);
  const { follow, unfollow } = useFollowCollegeMutations(user?.id);
  const pending = follow.isPending || unfollow.isPending;

  const isRankOne = rank === 1;
  const logoUrl = getCollegeLogoUrl(displayName);

  // Brand gradient — sampled from the logo, mixed toward charcoal so white
  // text + gold accents keep AA contrast. Falls back to the charcoal gradient
  // if sampling fails (CORS taint, decode error, empty result).
  const [brand, setBrand] = useState<string | null>(null);
  useEffect(() => {
    if (!logoUrl) return;
    let cancelled = false;
    dominantColorFromImage(logoUrl).then((c) => {
      if (!cancelled) setBrand(c);
    });
    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  const heroBackground = brand
    ? `linear-gradient(180deg, ${darkenTowardCharcoal(brand, 0.4)} 0%, ${CHARCOAL} 100%)`
    : `linear-gradient(180deg, #262B33 0%, ${CHARCOAL} 100%)`;

  const handleFollow = () => {
    if (!user) return;
    if (isFollowed) unfollow.mutate(slug);
    else follow.mutate(slug);
  };

  const navigate = useNavigate();
  const handleCompare = () => {
    navigate(`${collegeHubRoute()}?compare=${encodeURIComponent(slug)}`);
  };

  return (
    <div
      style={{
        background: heroBackground,
        transition: 'background 240ms ease-out',
        minHeight:
          'calc(clamp(380px, 44dvh, 460px) + env(safe-area-inset-top, 0px))',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)',
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 20,
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Crest 66 */}
        <div
          style={{
            width: 66,
            height: 66,
            flexShrink: 0,
            borderRadius: '34%',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
            border: isRankOne ? `1.5px solid ${GOLD}` : `0.5px solid ${WHITE_ALPHA_18}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
            boxShadow: isRankOne ? '0 4px 12px rgba(255,184,0,0.20)' : 'none',
          }}
          aria-hidden
        >
          {logoUrl ? (
            <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: 15, fontWeight: 900, color: GOLD, letterSpacing: '0.04em' }}>
              {displayName.slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: WHITE_ALPHA_55,
              marginBottom: 4,
            }}
          >
            THE FRANCHISE {rank ? `\u00B7 No.${rank}` : ''}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </h1>
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              fontWeight: 600,
              color: WHITE_ALPHA_65,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{ color: isRankOne ? GOLD : AMBER, fontWeight: 800 }}>
              {formatPoints(pointsTotal)}
            </span>
            <span style={{ color: WHITE_ALPHA_55 }}>{'\u00B7'}</span>
            <span>{alumniCount} alumni on tour</span>
            {playingNow > 0 && (
              <>
                <span style={{ color: WHITE_ALPHA_55 }}>{'\u00B7'}</span>
                <span style={{ color: STATUS_LIVE, fontWeight: 700 }}>
                  {playingNow} playing now
                </span>
              </>
            )}
          </div>
        </div>

        {/* Follow */}
        {user && (
          <button
            type="button"
            onClick={handleFollow}
            disabled={pending}
            style={{
              flexShrink: 0,
              fontFamily: FONT,
              height: 30,
              padding: '0 12px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              border: `0.75px solid ${isFollowed ? GOLD_DEEP : WHITE_ALPHA_18}`,
              background: isFollowed ? GOLD : 'transparent',
              color: isFollowed ? CHARCOAL : '#FFFFFF',
              cursor: pending ? 'default' : 'pointer',
              opacity: pending ? 0.7 : 1,
              transition: 'all 120ms ease',
            }}
          >
            {isFollowed ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* subtle hairline base */}
      <div
        aria-hidden
        style={{
          marginTop: 16,
          height: 0.5,
          background: WHITE_ALPHA_10,
        }}
      />
    </div>
  );
}
