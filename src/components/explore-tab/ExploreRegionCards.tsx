/**
 * ExploreRegionCards - Region cards for Explore page
 * 
 * Shows 4 regions: GBI, EU, USA, ROW
 * Each card shows: background image, title, moment count
 * 
 * Polish: skeleton shimmer, graceful image fallbacks, consistent sizing
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useExploreRegionStats, RegionKey } from '@/hooks/useExploreMoments';
import { Skeleton } from '@/components/ui/skeleton';

interface ExploreRegionCardsProps {
  className?: string;
}

// Region metadata
const REGION_CONFIG: Record<RegionKey, { 
  title: string; 
  slug: string; 
  gradient: string;
}> = {
  GBI: { 
    title: 'Great Britain & Ireland', 
    slug: 'gbi',
    gradient: 'from-slate-700 via-emerald-800 to-slate-900',
  },
  EU: { 
    title: 'Continental Europe', 
    slug: 'eu',
    gradient: 'from-amber-800 via-slate-700 to-slate-900',
  },
  USA: { 
    title: 'United States', 
    slug: 'usa',
    gradient: 'from-blue-800 via-slate-700 to-slate-900',
  },
  ROW: { 
    title: 'Rest of World', 
    slug: 'row',
    gradient: 'from-teal-800 via-slate-700 to-slate-900',
  },
};

// Skeleton card component with shimmer effect
const RegionCardSkeleton: React.FC = () => (
  <div className="flex-shrink-0 w-44 md:w-56 aspect-[4/3] rounded-xl overflow-hidden bg-surface-alt">
    <Skeleton className="w-full h-full" />
  </div>
);

// Region card with image fallback handling
const RegionCard: React.FC<{
  regionKey: RegionKey;
  thumbnailUrl: string | null;
  momentCount: number;
  onClick: () => void;
}> = ({ regionKey, thumbnailUrl, momentCount, onClick }) => {
  const config = REGION_CONFIG[regionKey];
  const [imageError, setImageError] = useState(false);
  const showGradient = !thumbnailUrl || imageError;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 group"
    >
      <div className="relative w-44 md:w-56 aspect-[4/3] rounded-xl overflow-hidden shadow-md">
        {/* Background - thumbnail or gradient fallback */}
        {!showGradient ? (
          <img 
            src={thumbnailUrl!} 
            alt={config.title}
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br",
            config.gradient
          )} />
        )}
        
        {/* Overlay for text legibility */}
        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors duration-200" />
        
        {/* Bottom gradient for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <h4 className="text-base font-medium text-white drop-shadow-sm">{config.title}</h4>
          
          {/* Moment count */}
          <p className="mt-1 text-xs text-white/80 drop-shadow-sm">
            {momentCount > 0 
              ? `${momentCount} moment${momentCount === 1 ? '' : 's'} this month`
              : 'Explore courses'
            }
          </p>
        </div>
        
        {/* Hover arrow indicator */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ChevronRight className="w-5 h-5 text-white/90 drop-shadow-sm" />
        </div>
      </div>
    </button>
  );
};

export const ExploreRegionCards: React.FC<ExploreRegionCardsProps> = ({
  className,
}) => {
  const navigate = useNavigate();
  const { data: regionStats, isLoading } = useExploreRegionStats();

  const handleRegionClick = (regionKey: RegionKey) => {
    navigate(`/discover/explore/region/${REGION_CONFIG[regionKey].slug}`);
  };

  const regions: RegionKey[] = ['GBI', 'EU', 'USA', 'ROW'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
      className={cn("py-6", className)}
    >
      {/* Section Header */}
      <div className="px-4 mb-4">
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </>
        ) : (
          <>
            <h3 className="text-lg font-serif text-foreground">Explore by Region</h3>
            <p className="mt-1.5 text-sm text-muted-foreground font-light leading-relaxed max-w-md">
              From rugged coastlines to rolling parkland, discover the world's greatest courses.
            </p>
          </>
        )}
      </div>
      
      {/* Horizontal scroll rail */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pl-4 pr-4 pb-2 scrollbar-hide scroll-smooth">
          {isLoading ? (
            // Skeleton cards during loading
            Array.from({ length: 4 }).map((_, i) => (
              <RegionCardSkeleton key={i} />
            ))
          ) : (
            // Actual region cards
            regions.map((regionKey) => {
              const stats = regionStats?.find(s => s.region_key === regionKey);
              return (
                <RegionCard
                  key={regionKey}
                  regionKey={regionKey}
                  thumbnailUrl={stats?.thumbnail_url || null}
                  momentCount={stats?.moments_last_30_days || 0}
                  onClick={() => handleRegionClick(regionKey)}
                />
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ExploreRegionCards;
