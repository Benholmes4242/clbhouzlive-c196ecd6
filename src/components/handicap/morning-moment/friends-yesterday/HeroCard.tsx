import React from 'react';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import { useFriendRoundDetail } from '@/lib/whs/hooks';
import FlagSilhouetteOverlay from '@/components/whs/FlagSilhouetteOverlay';
import CinemaFriendEyebrow from '@/components/profile/handicap/whs/sections/recently-played/cinema-friend-card/CinemaFriendEyebrow';
import CinemaFriendGlass from '@/components/profile/handicap/whs/sections/recently-played/cinema-friend-card/CinemaFriendGlass';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

const FALLBACK_BG =
  'linear-gradient(180deg, var(--hcp-bg-2) 0%, var(--hcp-bg-3) 100%)';

const LEGIBILITY_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.05) 22%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)';

interface Props {
  friend: FriendYesterday;
  onClick: () => void;
  showLowestRound?: boolean;
}

export const HeroCard: React.FC<Props> = ({ friend, onClick, showLowestRound }) => {
  const { data: detail } = useFriendRoundDetail(
    friend.last_round_score_id,
    !!friend.last_round_score_id,
  );

  const par = React.useMemo(() => {
    if (!detail?.holes?.length) return null;
    const played = detail.holes.filter((h) => h.played && h.par != null);
    if (!played.length) return null;
    return played.reduce((sum, h) => sum + (h.par ?? 0), 0);
  }, [detail]);

  const slope = detail?.slope_rating ?? null;
  const showShape = !!detail?.hole_by_hole_fetched && (detail.holes?.length ?? 0) > 0;

  // Adapter for CinemaFriendEyebrow (uses WhsFriendActivityWithImage shape)
  const eyebrowActivity = React.useMemo(
    () =>
      ({
        friend_name: friend.name,
        friend_thumbnail_url: friend.thumbnail_url,
        friend_handicap_index: friend.friend_handicap_index,
        handicap_index_at_time: friend.handicap_index_at_time,
        is_counter: friend.is_counter,
        last_round_played_at: friend.played_at,
        last_round_course_name: friend.course_name,
      }) as unknown as WhsFriendActivityWithImage,
    [friend],
  );

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        position: 'relative',
        height: 224,
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#0F172A',
        border: '0.5px solid rgba(15,23,42,0.07)',
        boxShadow: '0 2px 20px rgba(15,23,42,0.10)',
        cursor: 'pointer',
      }}
    >
      {friend.course_thumbnail_image ? (
        <img
          src={friend.course_thumbnail_image}
          alt={friend.course_name ?? ''}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <>
          <div style={{ position: 'absolute', inset: 0, background: FALLBACK_GRADIENT }} />
          <FlagSilhouetteOverlay opacity={0.12} />
        </>
      )}

      <div style={{ position: 'absolute', inset: 0, background: ATMOSPHERIC, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: LEGIBILITY_SCRIM, pointerEvents: 'none' }} />

      <CinemaFriendEyebrow activity={eyebrowActivity} showLowestRound={showLowestRound} />

      <div
        style={{
          position: 'absolute',
          left: 11,
          right: 11,
          top: 36,
          bottom: 10,
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: '100%', pointerEvents: 'none' }}>
          <CinemaFriendGlass
            courseName={friend.course_name}
            par={par}
            slope={slope}
            gross={friend.score ?? null}
            stableford={friend.stableford}
            differential={friend.differential}
            holes={showShape ? detail!.holes : null}
            isCounter={!!friend.is_counter}
            nonEnriched={friend.stableford == null || friend.differential == null}
            onInviteClick={onClick}
            inviteLabel={friend.is_clbhouz_user && friend.user_id ? 'Ask to sync' : 'Invite'}
          />
        </div>
      </div>
    </div>
  );
};

export default HeroCard;
