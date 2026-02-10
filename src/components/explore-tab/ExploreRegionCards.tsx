/**
 * ExploreRegionCards - Enhanced region cards for Explore page
 * 
 * Shows 4 regions: GBI, EU, USA, ROW
 * Each card shows: background image, title, moment count
 * 
 * Polish: hover effects, arrow indicator, better gradients
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
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

// Skeleton card component - shimmer-down animation
const RegionCardSkeleton: React.FC<{ index: number }> = ({ index }) => (
  <div 
    className="flex-shrink-0 w-[200px] h-[140px] rounded-2xl overflow-hidden bg-muted motion-safe:animate-shimmer-down"
    style={{ animationDelay: `${index * 75}ms` }}
  />
);

// Region card with enhanced hover effects
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
      className="relative w-[200px] h-[140px] flex-shrink-0 rounded-2xl overflow-hidden group"
    >
      {/* Background - thumbnail or gradient fallback */}
      {!showGradient ? (
        <img 
          src={thumbnailUrl!} 
          alt={config.title}
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          decoding="async"
          loading="lazy"
        />
      ) : (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br",
          config.gradient
        )} />
      )}
      
      {/* Gradient overlay for text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      
      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <h3 className="text-white font-bold text-base mb-1">
          {config.title}
        </h3>
        <p className="text-white/70 text-xs">
          {momentCount > 0 
            ? `${momentCount} moment${momentCount === 1 ? '' : 's'} this month`
            : 'Explore courses'
          }
        </p>
      </div>
      
      {/* Arrow indicator on hover */}
      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowRight className="w-4 h-4 text-white" />
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
            <h2 className="text-lg font-bold text-foreground">
              Explore by Region
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              From rugged coastlines to rolling parkland, discover the world's greatest courses.
            </p>
          </>
        )}
      </div>
      
      {/* Horizontal scroll rail */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pl-4 pr-4 pb-4 scrollbar-hide scroll-smooth">
          {isLoading ? (
            // Skeleton cards during loading - staggered shimmer
            Array.from({ length: 4 }).map((_, i) => (
              <RegionCardSkeleton key={i} index={i} />
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
