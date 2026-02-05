import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Heart, MapPin, Flame } from 'lucide-react';
import GlassPill, { formatPillDuration, getRankingInfo, RankingType } from '@/components/shared/GlassPill';
import {
  OVERLAY_TOP_LEFT,
  OVERLAY_TOP_RIGHT,
  OVERLAY_BOTTOM_LEFT,
  OVERLAY_BOTTOM_RIGHT,
  OVERLAY_GAP_CLASS,
  OVERLAY_PAD_X,
  OverlaySurface,
  TileVariant,
  getPillMaxWidth,
  getRankingMaxWidth,
  getTextMaxWidth,
  formatLikeCount,
} from './constants';

export interface OverlayCornersProps {
  // Surface context (affects max-widths and styling)
  surface: OverlaySurface;
  variant?: TileVariant; // Only for tile surface
  
  // Top-left content options
  isPopular?: boolean;
  isTrending?: boolean;
  
  // Club pill
  club?: {
    id: string;
    name: string;
  } | null;
  onClubClick?: (e: React.MouseEvent) => void;
  
  // Duration badge
  durationSeconds?: number | null;
  showDuration?: boolean; // Default true, set false for hero
  durationPlacement?: 'top-left' | 'top-right'; // Default 'top-left' for tiles
  
  // Hero: hot state (fire icon) - deprecated, use trendingLabel instead
  hotState?: boolean;
  
  // Hero: trending label text (e.g. "Trending Today", "Trending This Week")
  trendingLabel?: string;
  
  // Bottom-left: Creator + Likes (stacked)
  creatorName?: string;
  likes?: number;
  showCreator?: boolean;
  showLikes?: boolean;
  onCreatorClick?: (e: React.MouseEvent) => void;
  
  // Bottom-right: Avatar
  creatorAvatar?: string;
  showAvatar?: boolean;
  
  // Additional top-left content (milestone, multi-media indicator)
  topLeftOverride?: ReactNode;
  
  // Hide ranking if there's an override
  hideRankingIfOverride?: boolean;
}

/**
 * OverlayCorners - Single source of truth for overlay positioning
 * 
 * Standard pill ordering:
 * - Top-left: Ranking pill (or override content like milestone/multi-media)
 * - Top-right: Vertical stack of Club pill + Duration badge
 * - Bottom-left: Creator name + Like count (stacked)
 * - Bottom-right: Creator avatar squircle
 * 
 * Uses consistent spacing tokens across all surfaces:
 * - Trending Today Hero
 * - Watch grid (portrait + landscape)
 * - Profile Activity
 * - Shorts fullscreen player
 */
const OverlayCorners: React.FC<OverlayCornersProps> = ({
  surface,
  variant = 'portrait',
  isPopular,
  isTrending,
  club,
  durationSeconds,
  showDuration = true,
  durationPlacement = 'top-left',
  hotState = false,
  trendingLabel,
  onClubClick,
  creatorName,
  likes,
  showCreator = true,
  showLikes = false, // Default to false - likes removed from tile overlays
  onCreatorClick,
  creatorAvatar,
  showAvatar = true,
  topLeftOverride,
  hideRankingIfOverride = true,
}) => {
  const rankingInfo = getRankingInfo({ isPopular, isTrending });
  const hasValidDuration = showDuration && typeof durationSeconds === 'number' && Number.isFinite(durationSeconds) && durationSeconds > 0;
  const durationLabel = hasValidDuration ? formatPillDuration(durationSeconds) : null;
  
  const pillMaxWidth = getPillMaxWidth(surface);
  const rankingMaxWidth = getRankingMaxWidth(surface);
  const textMaxWidth = getTextMaxWidth(surface, variant);
  
  const showRanking = rankingInfo && !(topLeftOverride && hideRankingIfOverride);
  
  // Determine what goes in each corner based on surface
  // Club pill always top-right for both tiles and hero
  
  // Top-left: Ranking/Override only
  const hasTopLeftContent = topLeftOverride || showRanking;
  
  // Top-right: Club pill for both tiles and hero
  const hasTopRightContent = !!club;
  
  const hasBottomLeft = (showCreator && creatorName) || showLikes || trendingLabel;
  const hasBottomRight = showCreator && showAvatar && creatorAvatar;

  return (
    <>
      {/* ===== TOP-LEFT ===== */}
      {hasTopLeftContent && (
        <div className={cn(OVERLAY_TOP_LEFT, 'z-20 flex flex-col items-start', OVERLAY_GAP_CLASS)}>
          {/* Override takes priority */}
          {topLeftOverride ? (
            topLeftOverride
          ) : (
            <>
              {/* Ranking pill */}
              {showRanking && rankingInfo && (
                <div style={{ maxWidth: rankingMaxWidth }}>
                  <GlassPill
                    label={rankingInfo.label}
                    icon={rankingInfo.icon}
                    variant="ranking"
                    size={surface === 'tile' ? 'sm' : 'md'}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== TOP-RIGHT: Club pill ===== */}
      {hasTopRightContent && (
        <div 
          className={cn(OVERLAY_TOP_RIGHT, 'z-20 flex flex-col items-end overflow-hidden', OVERLAY_GAP_CLASS)}
          style={{ maxWidth: `calc(100% - ${OVERLAY_PAD_X * 2}px)` }}
        >
          {/* Club pill (top-right for all surfaces) */}
          {club && (
            <div className="max-w-full overflow-hidden">
              <GlassPill
                label={club.name}
                icon={<MapPin className="w-3 h-3 text-white" />}
                variant="club"
                size={surface === 'tile' ? 'sm' : 'md'}
                interactive={!!onClubClick}
                onClick={onClubClick}
                className="max-w-full"
              />
            </div>
          )}
        </div>
      )}

      {/* ===== BOTTOM-LEFT: Likes + Trending Label (for hero) or Creator + Likes ===== */}
      {hasBottomLeft && (
        <div 
          className={cn(OVERLAY_BOTTOM_LEFT, 'z-10 flex flex-col items-start gap-1 pointer-events-none')}
        >
          {/* Likes - glass style badge, hide number at zero (Watch tab standard) */}
          {showLikes && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full">
              <Heart className={cn("w-3 h-3 flex-shrink-0", (likes ?? 0) > 0 ? "fill-like text-like" : "text-white")} />
              {(likes ?? 0) > 0 && (
                <span className="text-[10px] text-white font-medium">{formatLikeCount(likes ?? 0)}</span>
              )}
            </div>
          )}
          
          {/* Trending label for hero */}
          {trendingLabel && (
            <span 
              className="flex items-center gap-1 text-white font-semibold text-sm leading-tight"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
            >
              {trendingLabel}
              <Flame className="w-3.5 h-3.5 text-orange-500" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
            </span>
          )}
          
          {/* Creator name (for non-hero surfaces) - clamped to 2 lines */}
          {showCreator && creatorName && !trendingLabel && (
            <button
              type="button"
              className="text-white font-semibold text-sm leading-tight pointer-events-auto hover:underline text-left line-clamp-2"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              onClick={onCreatorClick}
            >
              {creatorName}
            </button>
          )}
        </div>
      )}

      {/* ===== BOTTOM-RIGHT: Avatar ===== */}
      {hasBottomRight && (
        <button
          type="button"
          className={cn(
            OVERLAY_BOTTOM_RIGHT,
            'z-10 w-9 h-9 rounded-[8px] overflow-hidden',
            'border border-white/30 bg-black/40 backdrop-blur-sm',
            'pointer-events-auto shadow-lg'
          )}
          onClick={onCreatorClick}
        >
          <img
            src={creatorAvatar}
            alt={creatorName || 'Creator'}
            className="w-full h-full object-cover"
          />
        </button>
      )}
    </>
  );
};

export default OverlayCorners;
