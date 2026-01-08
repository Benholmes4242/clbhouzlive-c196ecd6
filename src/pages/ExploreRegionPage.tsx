/**
 * ExploreRegionPage - Shows moments grid filtered by region
 * 
 * Phase 1: Uses explore_moments view with region_key filter
 * 
 * Polish: improved header, back navigation, loading states
 * Uses static region banner images instead of latest moment thumbnail
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RegionKey, useExploreRegionStats } from '@/hooks/useExploreMoments';
import { DiscoverMomentsGrid } from '@/components/explore-tab/DiscoverMomentsGrid';
import { Skeleton } from '@/components/ui/skeleton';

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

// Region metadata with banner images
const REGION_CONFIG: Record<RegionKey, { 
  title: string; 
  subtitle: string;
  gradient: string;
  bannerUrl: string;
}> = {
  GBI: { 
    title: 'Great Britain & Ireland', 
    subtitle: 'From the rugged links of Scotland to the rolling parklands of Ireland',
    gradient: 'from-slate-700 via-emerald-800 to-slate-900',
    // UK/Ireland composite flag banner
    bannerUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  },
  EU: { 
    title: 'Continental Europe', 
    subtitle: 'Sun-drenched Spain, majestic France, and beyond',
    gradient: 'from-amber-800 via-slate-700 to-slate-900',
    // European golf landscape
    bannerUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
  },
  USA: { 
    title: 'United States', 
    subtitle: 'From Pebble Beach to Pinehurst, coast to coast',
    gradient: 'from-blue-800 via-slate-700 to-slate-900',
    // American golf course
    bannerUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
  },
  ROW: { 
    title: 'Rest of World', 
    subtitle: 'Hidden gems and bucket-list courses worldwide',
    gradient: 'from-teal-800 via-slate-700 to-slate-900',
    // World/global golf image
    bannerUrl: 'https://images.unsplash.com/photo-1632845986643-f3d32ec8bd21?w=800&q=80',
  },
};

const ExploreRegionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const regionKey = slug ? SLUG_TO_REGION[slug.toLowerCase()] : undefined;
  const config = regionKey ? REGION_CONFIG[regionKey] : undefined;
  
  const { data: regionStats, isLoading: statsLoading } = useExploreRegionStats();
  const stats = regionStats?.find(s => s.region_key === regionKey);
  const momentCount = stats?.moments_last_30_days || 0;

  // Handle back navigation
  const handleBack = () => {
    // Try to go back, but if there's no history, go to explore
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/discover/explore');
    }
  };

  // Invalid region
  if (!regionKey || !config) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-5 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        <div className="px-5 py-16 text-center">
          <h2 className="text-lg font-serif text-foreground">Region not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This region doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="px-5 py-4 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-alt transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-serif text-foreground truncate">{config.title}</h1>
          </div>
        </div>
      </div>

      {/* Hero Section - Uses static region banner */}
      <div className="relative h-48">
        <img 
          src={config.bannerUrl} 
          alt={config.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            // Fallback to gradient on error
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", config.gradient)} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="text-2xl font-serif text-foreground drop-shadow-sm">{config.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">{config.subtitle}</p>
          <div className="mt-2 text-xs text-muted-foreground">
            {statsLoading ? (
              <Skeleton className="h-3 w-28" />
            ) : momentCount > 0 ? (
              `${momentCount} moment${momentCount === 1 ? '' : 's'} this month`
            ) : (
              'Be the first to share a moment'
            )}
          </div>
        </div>
      </div>

      {/* Moments Grid */}
      <DiscoverMomentsGrid regionKey={regionKey} />
    </div>
  );
};

export default ExploreRegionPage;
