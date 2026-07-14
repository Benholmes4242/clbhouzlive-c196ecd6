/**
 * Masthead — college profile head.
 *
 * Thin wrapper around the shared CollegeHeroMasthead. Owns the Follow /
 * Compare buttons + the follow-mutation wiring; the layout, gradient, and
 * meta line all come from the shared component so this hero reads as the
 * same family as the hub leader spotlight.
 */

import { useNavigate } from 'react-router-dom';
import { Swords } from 'lucide-react';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { collegeHubRoute } from '@/features/tourhub/routes';
import {
  useFollowCollegeMutations,
  useIsCollegeFollowed,
} from '@/features/tourhub/hooks/useCollegeMovers';
import {
  CHARCOAL,
  FONT,
  GOLD,
  GOLD_DEEP,
  WHITE_ALPHA_18,
} from '@/features/tourhub/_shared/tokens';
import { CollegeHeroMasthead } from '../../_shared/CollegeHeroMasthead';

interface Props {
  slug: string;
  displayName: string;
  rank: number | null;
  pointsTotal: number;
  alumniCount: number;
  playingNow: number;
  brandHex: string | null;
  rankChange?: number | null;
}

export function Masthead({
  slug,
  displayName,
  rank,
  pointsTotal,
  alumniCount,
  playingNow,
  brandHex,
  rankChange = null,
}: Props) {
  const { user } = useSupabaseSession();
  const isFollowed = useIsCollegeFollowed(user?.id, slug);
  const { follow, unfollow } = useFollowCollegeMutations(user?.id);
  const pending = follow.isPending || unfollow.isPending;

  const logoUrl = getCollegeLogoUrl(displayName);

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
    <CollegeHeroMasthead
      displayName={displayName}
      logoUrl={logoUrl}
      brandHex={brandHex}
      rank={rank}
      pointsTotal={pointsTotal}
      alumniCount={alumniCount}
      playingNow={playingNow}
      rankChange={rankChange}
      actions={
        <>
          <button
            type="button"
            onClick={handleCompare}
            style={{
              flexShrink: 0,
              fontFamily: FONT,
              height: 30,
              padding: '0 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              border: `0.75px solid ${WHITE_ALPHA_18}`,
              background: 'rgba(255,255,255,0.06)',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 120ms ease',
            }}
            aria-label="Compare vs another school"
          >
            <Swords size={12} strokeWidth={2.4} />
            Compare
          </button>
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
        </>
      }
    />
  );
}
