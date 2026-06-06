import React from 'react';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import { useFriendRoundDetail } from '@/lib/whs/hooks';
import FlagSilhouetteOverlay from '@/components/whs/FlagSilhouetteOverlay';
import CinemaFriendEyebrow from '@/components/profile/handicap/whs/sections/recently-played/cinema-friend-card/CinemaFriendEyebrow';
import MiniGlass from './MiniGlass';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

const FALLBACK_BG =
  'linear-gradient(180deg, var(--hcp-bg-2) 0%, var(--hcp-bg-3) 100%)';

const LEGIBILITY_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.05) 22%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)';

interface Props {
  friend: FriendYesterday;
  rank: number;
  onClick: () => void;
}

export const MiniCard: React.FC<Props> = ({ friend, rank: _rank, onClick }) => {
  const { data: detail } = useFriendRoundDetail(
    friend.last_round_score_id,
    !!friend.last_round_score_id,
  );

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
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        width: 280,
        height: 192,
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#0F172A',
        border: '0.5px solid rgba(15,23,42,0.07)',
        boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
        scrollSnapAlign: 'start',
        cursor: 'pointer',
        padding: 0,
        textAlign: 'left',
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
          <FlagSilhouetteOverlay opacity={0.20} />
        </>
      )}

      <div style={{ position: 'absolute', inset: 0, background: ATMOSPHERIC, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: LEGIBILITY_SCRIM, pointerEvents: 'none' }} />

      <CinemaFriendEyebrow activity={eyebrowActivity} />

      <div
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          top: 36,
          bottom: 8,
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: '100%', pointerEvents: 'none' }}>
          <MiniGlass friend={friend} />
        </div>
      </div>
    </button>
  );
};

export default MiniCard;
