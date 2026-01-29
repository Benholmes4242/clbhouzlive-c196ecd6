/**
 * MasteryTrack - Regional completion badges
 * Shows 4 regional badges with progress bars
 * Designed to sit directly on page background (no card wrapper)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';
import { REGION_TAGLINES, REGION_FULL_NAMES } from '@/config/achievementTaglines';
import { type Top100ListSlug } from '@/lib/regionTheme';

// Import region badge images
import gbiBadgeImage from '@/assets/badges/gbi-badge.png';
import europeBadgeImage from '@/assets/badges/europe-badge.png';
import usaBadgeImage from '@/assets/badges/usa-badge.png';
import globalBadgeImage from '@/assets/badges/global-badge.png';

// Region badge images
const REGION_BADGE_IMAGES: Record<Top100ListSlug, string> = {
  'gb-i': gbiBadgeImage,
  'europe': europeBadgeImage,
  'usa': usaBadgeImage,
  'global': globalBadgeImage,
};

interface RegionCompletionData {
  slug: Top100ListSlug;
  name: string;
  played: number;
  total: number;
}

interface MasteryTrackProps {
  regionCompletions: RegionCompletionData[];
  totalPlayed: number;
  onRegionClick?: (slug: string, played: number, total: number) => void;
}

export const MasteryTrack: React.FC<MasteryTrackProps> = ({
  regionCompletions,
  totalPlayed,
  onRegionClick,
}) => {
  // Check if Grand Slam is complete (400 courses)
  const coreComplete = totalPlayed >= 400;

  // Order regions consistently
  const orderedRegions = useMemo(() => {
    const order: Top100ListSlug[] = ['gb-i', 'europe', 'usa', 'global'];
    return order
      .map(slug => regionCompletions.find(r => r.slug === slug))
      .filter((r): r is RegionCompletionData => r !== null);
  }, [regionCompletions]);

  if (orderedRegions.length === 0) return null;

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {/* Section header - directly on page background */}
      <div 
        className="rounded-xl p-4 mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(193, 168, 76, 0.06) 0%, rgba(255,255,255,0.98) 100%)',
          border: '1px solid rgba(193, 168, 76, 0.15)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-4 h-4 text-[#C1A84C]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#8B7635]">
            Mastery Track
          </span>
        </div>
        <p className="text-sm text-[#64748b]">
          {coreComplete 
            ? 'Complete each regional Top 100 list to achieve mastery' 
            : 'Complete the Grand Slam Club to unlock regional mastery challenges'}
        </p>
      </div>

      {/* Regional items - directly on page background */}
      <div className="space-y-1">
        {orderedRegions.map((region, index) => (
          <RegionalNode
            key={region.slug}
            region={region}
            index={index}
            onClick={() => onRegionClick?.(region.slug, region.played, region.total)}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Individual regional node
interface RegionalNodeProps {
  region: RegionCompletionData;
  index: number;
  onClick?: () => void;
}

const RegionalNode: React.FC<RegionalNodeProps> = ({ region, index, onClick }) => {
  const badgeImage = REGION_BADGE_IMAGES[region.slug];
  const isComplete = region.played >= region.total && region.total > 0;
  const progressPercent = region.total > 0 ? (region.played / region.total) * 100 : 0;
  const fullName = REGION_FULL_NAMES[region.slug] || region.name;
  const tagline = REGION_TAGLINES[region.slug] || '';

  return (
    <motion.button
      className="w-full flex items-center gap-5 py-4 text-left"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      onClick={onClick}
    >
      {/* Region badge image (80px) */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative flex-shrink-0"
      >
        <img
          src={badgeImage}
          alt={fullName}
          className={cn(
            "w-20 h-20 object-contain",
            !isComplete && "opacity-40 grayscale-[60%]"
          )}
        />
      </motion.div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Region name */}
            <h4 className={cn(
              "font-bold text-base",
              isComplete ? "text-[#1e293b]" : "text-[#94a3b8]"
            )}>
              {fullName}
            </h4>
            
            {/* Description/tagline */}
            <p className={cn(
              "text-sm mt-0.5",
              isComplete ? "text-[#64748b]" : "text-[#cbd5e1]"
            )}>
              {tagline}
            </p>
            
            {/* Progress bar - always show for incomplete */}
            {!isComplete && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-[#E5D0A1]/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full bg-[#334E3D]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                </div>
                <span className="text-xs text-[#64748b] tabular-nums">
                  {region.played}/{region.total}
                </span>
              </div>
            )}
          </div>
          
          {/* Status */}
          {isComplete && (
            <span className="text-sm font-semibold text-[#334E3D] flex-shrink-0">
              Complete
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default MasteryTrack;
