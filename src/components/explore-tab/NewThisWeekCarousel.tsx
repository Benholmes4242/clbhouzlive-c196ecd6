/**
 * NewThisWeekCarousel - Horizontal carousel showing trending moments for a region
 * 
 * Shows top 10 moments from last 7 days (trending sort)
 * Hides if fewer than 3 items
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Play, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNewThisWeekByRegion, RegionKey, TrendingMoment } from '@/hooks/useExploreMoments';
import { Skeleton } from '@/components/ui/skeleton';

interface NewThisWeekCarouselProps {
  regionKey: RegionKey;
  regionTitle: string;
  onMomentClick?: (moment: TrendingMoment) => void;
  className?: string;
}

// Region slug mapping
const REGION_SLUGS: Record<RegionKey, string> = {
  GBI: 'gbi',
  EU: 'eu',
  USA: 'usa',
  ROW: 'row',
};

// Gradient fallbacks
const GRADIENTS = [
  "from-emerald-800 via-slate-700 to-slate-900",
  "from-blue-700 via-slate-600 to-slate-900",
  "from-amber-700 via-slate-600 to-slate-900",
  "from-teal-700 via-slate-600 to-slate-900",
];

// Single tile component
const MomentTile: React.FC<{
  moment: TrendingMoment;
  index: number;
  onClick: () => void;
}> = ({ moment, index, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const isVideo = moment.media_type === 'video';
  const gradientIndex = index % GRADIENTS.length;
  
  const imageUrl = moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : null);
  const showGradient = !imageUrl || imageError;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 group"
    >
      <div className="relative w-28 md:w-32 aspect-[3/4] rounded-xl overflow-hidden bg-surface-alt shadow-sm">
        {/* Background */}
        {!showGradient ? (
          <img 
            src={imageUrl!} 
            alt="Moment"
            loading="lazy"
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br",
            GRADIENTS[gradientIndex]
          )} />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        
        {/* Video indicator */}
        {isVideo && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
          </div>
        )}
      </div>
    </button>
  );
};

// Skeleton tile
const TileSkeleton: React.FC = () => (
  <div className="flex-shrink-0 w-28 md:w-32 aspect-[3/4] rounded-xl overflow-hidden bg-surface-alt">
    <Skeleton className="w-full h-full" />
  </div>
);

export const NewThisWeekCarousel: React.FC<NewThisWeekCarouselProps> = ({
  regionKey,
  regionTitle,
  onMomentClick,
  className,
}) => {
  const navigate = useNavigate();
  const { data: moments, isLoading } = useNewThisWeekByRegion(regionKey);

  const handleMomentClick = useCallback((moment: TrendingMoment) => {
    if (onMomentClick) {
      onMomentClick(moment);
    } else {
      if (moment.source_type === 'post') {
        navigate(`/post/${moment.source_id}`);
      } else {
        navigate(`/courses/${moment.course_id}`);
      }
    }
  }, [navigate, onMomentClick]);

  const handleSeeAll = useCallback(() => {
    navigate(`/discover/explore/region/${REGION_SLUGS[regionKey]}`);
  }, [navigate, regionKey]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("py-4", className)}>
        <div className="px-4 mb-3 flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-2 overflow-x-auto pl-4 pr-4 pb-2 scrollbar-hide scroll-smooth">
          {Array.from({ length: 6 }).map((_, i) => (
            <TileSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Hide if fewer than 3 items
  if (!moments || moments.length < 3) {
    return null;
  }

  return (
    <div className={cn("py-4", className)}>
      {/* Header */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          New this week in {regionTitle}
        </h4>
        <button
          onClick={handleSeeAll}
          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          See all
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Carousel */}
      <div className="flex gap-2 overflow-x-auto pl-4 pr-4 pb-2 scrollbar-hide scroll-smooth">
        {moments.slice(0, 10).map((moment, index) => (
          <MomentTile
            key={moment.moment_id}
            moment={moment}
            index={index}
            onClick={() => handleMomentClick(moment)}
          />
        ))}
      </div>
    </div>
  );
};

export default NewThisWeekCarousel;
