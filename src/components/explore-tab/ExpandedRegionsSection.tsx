/**
 * ExpandedRegionsSection - Redesigned region cards with expanded data
 * 
 * Shows more regions with:
 * - Region hero imagery
 * - Course count and Top100 count
 * - Horizontal scroll layout
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ExpandedRegionsSectionProps {
  className?: string;
  isExpanded?: boolean; // Show full grid when Regions filter is active
}

interface RegionData {
  id: string;
  slug: string;
  title: string;
  hero_image_url: string | null;
  course_count: number;
  top100_count: number;
  gradient: string;
}

// Region configurations with gradients
const REGION_GRADIENTS: Record<string, string> = {
  'gbi': 'from-slate-700 via-emerald-800 to-slate-900',
  'eu': 'from-amber-800 via-slate-700 to-slate-900',
  'usa': 'from-blue-800 via-slate-700 to-slate-900',
  'asia-pacific': 'from-rose-800 via-slate-700 to-slate-900',
  'middle-east': 'from-orange-800 via-slate-700 to-slate-900',
  'row': 'from-teal-800 via-slate-700 to-slate-900',
};

/**
 * Hook to fetch region data with counts
 */
function useExpandedRegions() {
  return useQuery({
    queryKey: ['expanded-regions'],
    queryFn: async (): Promise<RegionData[]> => {
      // Fetch regions
      const { data: regions, error } = await supabase
        .from('explore_regions')
        .select('id, slug, title, hero_image_url, sort_order')
        .order('sort_order');

      if (error || !regions) return [];

      // For each region, get course and top100 counts
      const regionsWithCounts = await Promise.all(
        regions.map(async (region) => {
          // Get countries in this region
          const { data: members } = await supabase
            .from('explore_region_members')
            .select('country')
            .eq('region_id', region.id);

          const countries = members?.map(m => m.country) || [];
          
          let courseCount = 0;
          let top100Count = 0;

          if (countries.length > 0) {
            // Get course count
            const { count: cCount } = await supabase
              .from('golf_courses')
              .select('*', { count: 'exact', head: true })
              .in('country', countries);

            courseCount = cCount || 0;

            // Get top100 count
            const { count: t100Count } = await supabase
              .from('golf_courses')
              .select('*', { count: 'exact', head: true })
              .in('country', countries)
              .not('global_rank', 'is', null)
              .lte('global_rank', 100);

            top100Count = t100Count || 0;
          }

          return {
            id: region.id,
            slug: region.slug,
            title: region.title,
            hero_image_url: region.hero_image_url,
            course_count: courseCount,
            top100_count: top100Count,
            gradient: REGION_GRADIENTS[region.slug] || 'from-slate-700 to-slate-900',
          };
        })
      );

      return regionsWithCounts;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Region card component
const RegionCard: React.FC<{
  region: RegionData;
  isExpanded?: boolean;
  onClick: () => void;
}> = ({ region, isExpanded, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const showGradient = !region.hero_image_url || imageError;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl overflow-hidden group flex-shrink-0",
        isExpanded 
          ? "w-full aspect-[4/3]" 
          : "w-[180px] aspect-[4/3]"
      )}
    >
      {/* Background */}
      {!showGradient ? (
        <img
          src={region.hero_image_url!}
          alt={region.title}
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br",
          region.gradient
        )} />
      )}
      
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      
      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <h4 className="text-white font-bold text-sm mb-1 line-clamp-2">
          {region.title}
        </h4>
        <p className="text-white/60 text-xs">
          {region.course_count} courses
          {region.top100_count > 0 && (
            <span className="text-amber-400/80"> • {region.top100_count} Top 100</span>
          )}
        </p>
      </div>
      
      {/* Hover arrow */}
      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-white" />
      </div>
    </button>
  );
};

// Skeleton component
const RegionCardSkeleton: React.FC<{ isExpanded?: boolean }> = ({ isExpanded }) => (
  <div className={cn(
    "rounded-xl overflow-hidden bg-muted flex-shrink-0",
    isExpanded ? "w-full aspect-[4/3]" : "w-[180px] aspect-[4/3]"
  )}>
    <Skeleton className="w-full h-full" />
  </div>
);

export const ExpandedRegionsSection: React.FC<ExpandedRegionsSectionProps> = ({
  className,
  isExpanded = false,
}) => {
  const navigate = useNavigate();
  const { data: regions, isLoading } = useExpandedRegions();

  const handleRegionClick = (slug: string) => {
    navigate(`/discover/explore/region/${slug}`);
  };

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
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-bold text-foreground">
                {isExpanded ? 'All Regions' : 'Explore by Region'}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              From rugged coastlines to rolling parkland, discover golf destinations worldwide.
            </p>
          </>
        )}
      </div>

      {isExpanded ? (
        // Grid layout for expanded view
        <div className="px-4 grid grid-cols-2 gap-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <RegionCardSkeleton key={i} isExpanded />
            ))
          ) : (
            regions?.map((region) => (
              <RegionCard
                key={region.id}
                region={region}
                isExpanded
                onClick={() => handleRegionClick(region.slug)}
              />
            ))
          )}
        </div>
      ) : (
        // Horizontal scroll for compact view
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide scroll-smooth">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <RegionCardSkeleton key={i} />
              ))
            ) : (
              regions?.map((region) => (
                <RegionCard
                  key={region.id}
                  region={region}
                  onClick={() => handleRegionClick(region.slug)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ExpandedRegionsSection;
