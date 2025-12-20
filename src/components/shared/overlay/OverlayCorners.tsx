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
  showLikes = true,
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
  
  // Determine what goes in each corner based on surface and placement
  // For tiles: club top-left, duration top-right (matching hero layout)
  // For hero: club top-left, hot icon top-right
  
  // Top-left: Club (tiles & hero) or Ranking/Override
  const hasTopLeftContent = topLeftOverride || club || showRanking;
  
  // Top-right: Duration (tiles only, no fire icon)
  const hasTopRightContent = surface === 'tile' && durationLabel;
  
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
              {/* Club pill (tiles & hero: top-left) */}
              {club && (
                <div style={{ maxWidth: pillMaxWidth }}>
                  <GlassPill
                    label={club.name}
                    icon={<MapPin className="w-3 h-3 text-white" />}
                    variant="club"
                    size={surface === 'tile' ? 'sm' : 'md'}
                    interactive={!!onClubClick}
                    onClick={onClubClick}
                  />
                </div>
              )}
              
              {/* Ranking pill (if no club) */}
              {!club && showRanking && rankingInfo && (
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

      {/* ===== TOP-RIGHT ===== */}
      {hasTopRightContent && (
        <div className={cn(OVERLAY_TOP_RIGHT, 'z-20 flex flex-col items-end', OVERLAY_GAP_CLASS)}>
          {/* Hot state fire icon (hero only) */}
          {hotState && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
          )}
          
          {/* Duration badge (tiles: top-right) */}
          {surface === 'tile' && durationLabel && (
            <GlassPill
              label={durationLabel}
              variant="duration"
              size="sm"
            />
          )}
        </div>
      )}

      {/* ===== BOTTOM-LEFT: Likes + Trending Label (for hero) or Creator + Likes ===== */}
      {hasBottomLeft && (
        <div 
          className={cn(OVERLAY_BOTTOM_LEFT, 'z-10 flex flex-col gap-1 pointer-events-none')}
          style={{ maxWidth: textMaxWidth }}
        >
          {/* Likes - shown above trending label for hero */}
          {showLikes && (
            <div 
              className="flex items-center gap-1 text-white/70 text-[10px] leading-none font-medium"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
            >
              <Heart className="w-3 h-3" />
              <span>{formatLikeCount(likes ?? 0)}</span>
            </div>
          )}
          
          {/* Trending label for hero */}
          {trendingLabel && (
            <span 
              className="text-white font-semibold text-sm leading-tight"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
            >
              {trendingLabel}
            </span>
          )}
          
          {/* Creator name (for non-hero surfaces) */}
          {showCreator && creatorName && !trendingLabel && (
            <button
              type="button"
              className="text-white font-semibold text-sm leading-tight truncate block pointer-events-auto hover:underline text-left"
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
