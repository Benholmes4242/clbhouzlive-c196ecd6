/**
 * ExploreRegionPage - Shows moments grid filtered by region
 * 
 * Polish pass: Region-specific visual identities with branded gradients,
 * decorative flag/icon backgrounds, and evocative copy.
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Film, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RegionKey, useExploreRegionStats } from '@/hooks/useExploreMoments';
import { DiscoverGrid } from '@/components/explore-tab/DiscoverGrid';
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

// Region configuration with branded visual identity
interface RegionConfig {
  title: string;
  subtitle: string;
  emoji: string;
  secondaryEmoji?: string;
  gradient: string;
  decorativeType: 'dual-flags' | 'single-flag' | 'globe';
}

const REGION_CONFIG: Record<RegionKey, RegionConfig> = {
  GBI: { 
    title: 'Great Britain & Ireland', 
    subtitle: 'From the windswept links of Scotland to the emerald fairways of Ireland — where golf began.',
    emoji: '🇬🇧',
    secondaryEmoji: '🇮🇪',
    gradient: 'from-[#1B4D3E] to-[#0D2818]',
    decorativeType: 'dual-flags',
  },
  EU: { 
    title: 'Continental Europe', 
    subtitle: 'Sun-drenched Spanish resorts, majestic French châteaux, and hidden Alpine gems.',
    emoji: '🇪🇺',
    gradient: 'from-[#1E3A5F] to-[#0F1F33]',
    decorativeType: 'single-flag',
  },
  USA: { 
    title: 'United States', 
    subtitle: "From Pebble Beach's ocean cliffs to Augusta's azaleas — America's golfing treasures.",
    emoji: '🇺🇸',
    gradient: 'from-[#1A237E] to-[#0D1442]',
    decorativeType: 'single-flag',
  },
  ROW: { 
    title: 'Rest of World', 
    subtitle: 'Hidden gems and bucket-list courses from every corner of the globe.',
    emoji: '🌍',
    gradient: 'from-[#5D4037] to-[#3E2723]',
    decorativeType: 'globe',
  },
};

// Decorative background component for each region
const RegionDecorativeBackground: React.FC<{ config: RegionConfig }> = ({ config }) => {
  switch (config.decorativeType) {
    case 'dual-flags':
      return (
        <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-[0.12]">
          <span className="text-[100px] select-none">{config.emoji}</span>
          {config.secondaryEmoji && (
            <span className="text-[100px] select-none">{config.secondaryEmoji}</span>
          )}
        </div>
      );
    case 'single-flag':
      return (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.12]">
          <span className="text-[120px] select-none">{config.emoji}</span>
        </div>
      );
    case 'globe':
      return (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.12]">
          <Globe className="w-40 h-40 text-white" strokeWidth={1} />
        </div>
      );
    default:
      return null;
  }
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
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1 -ml-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="font-medium text-foreground">{config.title}</span>
        </div>
      </div>

      {/* Hero Section - Branded gradient with decorative background */}
      <div className={cn(
        "relative overflow-hidden",
        `bg-gradient-to-b ${config.gradient}`
      )}>
        {/* Decorative background pattern */}
        <RegionDecorativeBackground config={config} />
        
        {/* Content */}
        <div className="relative z-10 px-4 pt-6 pb-8">
          {/* Region badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{config.emoji}</span>
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              Region
            </span>
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {config.title}
          </h1>
          
          {/* Subtitle */}
          <p className="text-sm text-white/75 leading-relaxed max-w-[300px]">
            {config.subtitle}
          </p>
          
          {/* Stats pill */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm">
            <Film className="w-4 h-4 text-white/80" />
            {statsLoading ? (
              <Skeleton className="h-4 w-24 bg-white/20" />
            ) : (
              <span className="text-sm font-medium text-white">
                {momentCount > 0 
                  ? `${momentCount} moment${momentCount === 1 ? '' : 's'} this month`
                  : 'Be the first to share'
                }
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section header */}
      <div className="px-4 pt-6 pb-3">
        <h2 className="text-lg font-bold text-foreground">
          Latest Moments
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Recent posts from {config.title}
        </p>
      </div>

      {/* Moments Grid - uses same grid as Explore tab */}
      <DiscoverGrid regionKey={regionKey} />
    </div>
  );
};

export default ExploreRegionPage;
