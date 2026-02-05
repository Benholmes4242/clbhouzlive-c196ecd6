/**
 * ExploreRegionPage - Shows moments grid filtered by region
 * 
 * Polished design with:
 * - Hero using #1 ranked course image as background
 * - Floating back button
 * - Minimal section headers with emerald accent bar
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { RegionKey, useExploreRegionStats } from '@/hooks/useExploreMoments';
import { DiscoverGrid } from '@/components/explore-tab/DiscoverGrid';
import { supabase } from '@/integrations/supabase/client';

// Map slug to region_key
const SLUG_TO_REGION: Record<string, RegionKey> = {
  'gbi': 'GBI',
  'eu': 'EU',
  'usa': 'USA',
  'row': 'ROW',
  // Legacy slugs
  'uk-ireland': 'GBI',
  'continental-europe': 'EU',
  'rest-of-world': 'ROW',
};

// Region configuration
interface RegionConfig {
  title: string;
  subtitle: string;
  emoji: string;
  secondaryEmoji?: string;
  countries: string[];
  heroImage?: string; // Optional override for hero image
}

const REGION_CONFIG: Record<RegionKey, RegionConfig> = {
  GBI: { 
    title: 'Great Britain & Ireland', 
    subtitle: 'From the windswept links of Scotland to the emerald fairways of Ireland — where golf began.',
    emoji: '🇬🇧',
    secondaryEmoji: '🇮🇪',
    countries: ['United Kingdom', 'Ireland', 'Scotland', 'England', 'Wales', 'Northern Ireland'],
  },
  EU: { 
    title: 'Continental Europe', 
    subtitle: 'Sun-drenched Spanish resorts, majestic French châteaux, and hidden Alpine gems.',
    emoji: '🇪🇺',
    countries: ['Spain', 'France', 'Portugal', 'Italy', 'Germany', 'Netherlands', 'Belgium', 'Sweden', 'Denmark', 'Austria', 'Switzerland'],
  },
  USA: { 
    title: 'United States', 
    subtitle: "From Pebble Beach's ocean cliffs to Augusta's azaleas — America's golfing treasures.",
    emoji: '🇺🇸',
    countries: ['USA', 'United States', 'United States of America'],
  },
  ROW: { 
    title: 'Rest of World', 
    subtitle: 'Hidden gems and bucket-list courses from every corner of the globe.',
    emoji: '🌍',
    countries: ['Australia', 'New Zealand', 'Japan', 'South Africa', 'Canada', 'Mexico', 'South Korea', 'Thailand', 'UAE', 'Oceania', 'Africa'],
    // Hardcoded hero image - Royal Melbourne West Course
    heroImage: 'https://media.clbhouz.co.uk/e44b8cbe-1d40-48d3-978f-1fa5e250ddde/clbhouz-course-images/1764363996472-9h1ryjq2sre.jpeg',
  },
};

// Hook to fetch top course in region for hero image
function useTopCourseInRegion(regionKey: RegionKey | undefined) {
  const countries = regionKey ? REGION_CONFIG[regionKey]?.countries : undefined;
  
  return useQuery({
    queryKey: ['region-top-course', regionKey],
    queryFn: async () => {
      if (!countries?.length) return null;
      
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, thumbnail_image, global_rank')
        .in('country', countries)
        .not('thumbnail_image', 'is', null)
        .order('global_rank', { ascending: true, nullsFirst: false })
        .limit(1)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!countries?.length,
    staleTime: 10 * 60 * 1000,
  });
}


const ExploreRegionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const regionKey = slug ? SLUG_TO_REGION[slug.toLowerCase()] : undefined;
  const config = regionKey ? REGION_CONFIG[regionKey] : undefined;
  
  const { data: regionStats, isLoading: statsLoading } = useExploreRegionStats();
  const stats = regionStats?.find(s => s.region_key === regionKey);
  const momentCount = stats?.moments_last_30_days || 0;
  
  const { data: topCourse, isLoading: courseLoading } = useTopCourseInRegion(regionKey);
  

  const isLoading = statsLoading || courseLoading;

  // Invalid region
  if (!regionKey || !config) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-5 py-16 text-center">
          <h2 className="text-lg font-semibold text-foreground">Region not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This region doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      {isLoading ? (
        /* Hero Loading Skeleton - Watch tab standard left-to-right shimmer */
        <div className="relative h-64 bg-gray-200 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-white/20 overflow-hidden">
                <div className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animationDelay: '50ms' }} />
              </div>
              <div className="w-40 h-7 rounded bg-white/20 overflow-hidden">
                <div className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animationDelay: '100ms' }} />
              </div>
            </div>
            <div className="w-full h-4 rounded bg-white/20 overflow-hidden mb-1">
              <div className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animationDelay: '150ms' }} />
            </div>
            <div className="w-2/3 h-4 rounded bg-white/20 overflow-hidden mb-3">
              <div className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animationDelay: '200ms' }} />
            </div>
            <div className="flex gap-2">
              <div className="w-36 h-8 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animationDelay: '250ms' }} />
              </div>
              <div className="w-28 h-8 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Hero with Course Image - Priority loading */
        <div className="relative h-64 overflow-hidden will-change-transform">
          {/* Background Image - use config override or top-ranked course */}
          {(config.heroImage || topCourse?.thumbnail_image) ? (
            <img
              src={config.heroImage || topCourse?.thumbnail_image}
              alt={config.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-emerald-950" />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          
          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            {/* Region Flag + Name */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{config.emoji}</span>
              {config.secondaryEmoji && (
                <span className="text-xl">{config.secondaryEmoji}</span>
              )}
              <h1 className="text-2xl font-bold text-white">
                {config.title}
              </h1>
            </div>
            
            {/* Description */}
            <p className="text-sm text-white/80 leading-relaxed mb-3 line-clamp-2 max-w-[320px]">
              {config.subtitle}
            </p>
            
            {/* Stats Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {momentCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                  <Calendar className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-medium text-white">
                    {momentCount} moment{momentCount === 1 ? '' : 's'} this month
                  </span>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}
      
      {/* Latest Moments Section Header */}
      <div className="bg-card mt-2">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <span className="w-1 h-4 bg-emerald-500 rounded-full" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Latest Moments
          </span>
        </div>
      </div>
      
      {/* Moments Grid - uses same grid as Explore tab */}
      <DiscoverGrid regionKey={regionKey} />
    </div>
  );
};

export default ExploreRegionPage;
