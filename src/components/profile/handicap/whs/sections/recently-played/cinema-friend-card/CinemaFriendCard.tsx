import React from 'react';
import { firstName } from '@/lib/whs/utils/initials';
import { useFriendRoundDetail } from '@/lib/whs/hooks';
import FlagSilhouetteOverlay from '@/components/whs/FlagSilhouetteOverlay';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';
import CinemaFriendEyebrow from './CinemaFriendEyebrow';
import CinemaFriendGlass from './CinemaFriendGlass';
import CinemaFriendActions from './CinemaFriendActions';

const FALLBACK_GRADIENT =
  'linear-gradient(140deg, #2d3a2d 0%, #4a5d4a 25%, #6b7a5a 50%, #8a9670 72%, #c4a574 88%, #d4956b 100%)';

const ATMOSPHERIC =
  'radial-gradient(ellipse 80% 60% at 50% 90%, rgba(0,0,0,0.55) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 70% 25%, rgba(255,200,140,0.18) 0%, transparent 60%)';

const LEGIBILITY_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.05) 22%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)';

interface Props {
  activity: WhsFriendActivityWithImage;
  onClick: () => void;
}

export const CinemaFriendCard: React.FC<Props> = ({ activity, onClick }) => {
  const { data: detail } = useFriendRoundDetail(activity.last_round_score_id);

  const par = React.useMemo(() => {
    if (!detail?.holes?.length) return null;
    const played = detail.holes.filter((h) => h.played && h.par != null);
    if (!played.length) return null;
    return played.reduce((sum, h) => sum + (h.par ?? 0), 0);
  }, [detail]);

  const slope = detail?.slope_rating ?? null;
  const showShape = !!detail?.hole_by_hole_fetched && (detail.holes?.length ?? 0) > 0;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Open ${firstName(activity.friend_name)}'s round at ${activity.last_round_course_name ?? 'a course'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        position: 'relative',
        height: 280,
        margin: '0 20px 12px',
        borderRadius: 22,
        overflow: 'hidden',
        background: '#0F172A',
        border: '0.5px solid rgba(15,23,42,0.07)',
        boxShadow: '0 2px 20px rgba(15,23,42,0.10)',
        cursor: 'pointer',
      }}
    >
      {/* Image / fallback */}
      {activity.course_thumbnail_image ? (
        <img
          src={activity.course_thumbnail_image}
          alt={activity.last_round_course_name ?? ''}
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

      {/* Scrims */}
      <div style={{ position: 'absolute', inset: 0, background: ATMOSPHERIC, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: LEGIBILITY_SCRIM, pointerEvents: 'none' }} />

      {/* Top eyebrow */}
      <CinemaFriendEyebrow activity={activity} />

      {/* Centered glass tile */}
      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          top: 44,
          bottom: 44,
          display: 'flex',
          alignItems: 'center',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: '100%', pointerEvents: 'auto' }}>
          <CinemaFriendGlass
            courseName={activity.last_round_course_name}
            par={par}
            slope={slope}
            gross={activity.last_round_adjusted_gross}
            stableford={activity.last_round_stableford}
            differential={activity.last_round_differential}
            holes={showShape ? detail!.holes : null}
            isCounter={detail?.is_counter ?? false}
          />
        </div>
      </div>

      {/* Bottom actions */}
      <CinemaFriendActions
        scoreId={activity.last_round_score_id}
        reactionCount={activity.reaction_count}
        viewerHasReacted={activity.viewer_has_reacted}
      />
    </div>
  );
};

export default CinemaFriendCard;
