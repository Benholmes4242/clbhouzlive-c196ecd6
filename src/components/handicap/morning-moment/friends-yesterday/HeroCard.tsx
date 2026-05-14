import React from 'react';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import { useFriendRoundDetail } from '@/lib/whs/hooks';
import FlagSilhouetteOverlay from '@/components/whs/FlagSilhouetteOverlay';
import { deriveHeroState } from './deriveHeroState';
import TopEyebrow from './TopEyebrow';
import HeroGlassEnriched from './HeroGlassEnriched';
import HeroGlassSyncing from './HeroGlassSyncing';
import HeroGlassInvite from './HeroGlassInvite';
import HeroGlassNudge from './HeroGlassNudge';
import HeroBottomActions from './HeroBottomActions';

const FALLBACK_GRADIENT =
  'linear-gradient(140deg, #2d3a2d 0%, #4a5d4a 25%, #6b7a5a 50%, #8a9670 72%, #c4a574 88%, #d4956b 100%)';

const ATMOSPHERIC =
  'radial-gradient(ellipse 80% 60% at 50% 90%, rgba(0,0,0,0.55) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 70% 25%, rgba(255,200,140,0.18) 0%, transparent 60%)';

const LEGIBILITY_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.05) 22%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)';

interface Props {
  friend: FriendYesterday;
  onClick: () => void;
}

export const HeroCard: React.FC<Props> = ({ friend, onClick }) => {
  const state = deriveHeroState(friend);
  const isEnriched = state === 'enriched';
  const { data: detail } = useFriendRoundDetail(
    friend.last_round_score_id,
    isEnriched && !!friend.last_round_score_id,
  );

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
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        position: 'relative',
        height: 280,
        width: '100%',
        borderRadius: 22,
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

      <TopEyebrow friend={friend} variant="hero" rightPill="best" />

      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          top: 44,
          bottom: 44,
          display: 'flex',
          alignItems: 'center',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: '100%', pointerEvents: 'auto' }}>
          {state === 'enriched' && (
            <HeroGlassEnriched
              friend={friend}
              par={par}
              slope={slope}
              holes={showShape ? detail!.holes : null}
            />
          )}
          {state === 'syncing' && <HeroGlassSyncing friend={friend} />}
          {state === 'invite' && <HeroGlassInvite friend={friend} />}
          {state === 'nudge' && <HeroGlassNudge friend={friend} />}
        </div>
      </div>

      <HeroBottomActions state={state} friend={friend} />
    </div>
  );
};

export default HeroCard;
