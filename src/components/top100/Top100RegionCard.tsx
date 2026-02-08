import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';
import { Top100RankBadge } from './Top100RankBadge';
import { getProgressInsight } from '@/lib/utils/progressInsightCopy';
import { AnimatedNumber, AnimatedProgressBar } from '@/components/ui/motion';

type Top100RegionCardProps = {
  list: Top100ListSummary;
  onClick?: () => void;
  showCta?: boolean;
  variant?: 'default' | 'hero';
  onBack?: () => void;
  userId?: string;
  usedPhrases?: Set<string>;
};

export const Top100RegionCard: React.FC<Top100RegionCardProps> = ({
  list,
  onClick,
  showCta = true,
  variant = 'default',
  onBack,
  userId,
  usedPhrases,
}) => {
  const total = list.total_courses ?? 0;
  const rated = list.played_count ?? 0;
  const completion = total > 0 ? Math.min(100, Math.round((rated / total) * 100)) : 0;
  const hero = list.hero_course;
  const topRank = hero?.rank_in_list ?? null;
  const listSlug = list.slug as 'global' | 'gb-i' | 'usa' | 'europe';

  // Check if this is the primary (Worldwide) journey
  const isPrimary = listSlug === 'global';
  
  // Get progress insight phrase using new milestone-aware copy system
  const getJourneyPhrase = () => {
    if (rated === 0) return 'Start your journey';
    if (rated >= total) return 'Journey complete';
    const phrase = getProgressInsight(completion, listSlug, userId, usedPhrases);
    // Add to used phrases set to prevent duplicates across cards in viewport
    usedPhrases?.add(phrase);
    return phrase;
  };
  const journeyPhrase = getJourneyPhrase();

  // Map short labels to full display names
  const getDisplayLabel = (shortLabel: string, slug: string) => {
    if (slug === 'global' || shortLabel === 'Global') return 'Global Top 100';
    if (shortLabel === 'GB&I') return 'GB&I Top 100';
    if (shortLabel === 'Europe') return 'Europe Top 100';
    if (shortLabel === 'USA') return 'USA Top 100';
    return `${shortLabel} Top 100`;
  };

  const displayLabel = getDisplayLabel(list.short_label || list.name, list.slug);

  const isHero = variant === 'hero';

  return (
    <div
      role="button"
      aria-label={`View ${displayLabel} courses`}
      className={cn(
        'group relative overflow-hidden',
        'bg-foreground text-white',
        isHero ? [
          // Full-width hero: no rounded corners, negative margins to break out of gutters
          'rounded-none -mx-4',
          'h-[17.5rem]' // Match course-hero-container height (280px)
        ] : [
          // Default card style with rounded corners - polished interactions
          'rounded-sq-lg',
          'shadow-[0_4px_20px_rgba(0,0,0,0.15)]',
          'transition-all duration-200 ease-out',
          'hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-[1.01]',
          'active:scale-[0.98]',
          'h-[300px] sm:h-[320px] cursor-pointer',
          // Subtle emphasis for primary (Worldwide) journey
          isPrimary && 'ring-1 ring-white/10'
        ]
      )}
      onClick={onClick}
    >
      {/* Background image */}
      {hero?.cover_image_url ? (
        <>
          <img
            src={hero.cover_image_url}
            alt={hero.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          {/* Top gradient for title legibility */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 via-black/25 to-transparent" />
          {/* Bottom gradient for content legibility - stronger */}
          <div className={cn(
            "absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t via-black/40 to-transparent",
            isPrimary ? "from-black/80" : "from-black/75"
          )} />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 to-foreground" />
      )}

      {/* Back button - only in hero variant */}
      {isHero && onBack && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="absolute top-3 left-3 z-20 h-9 w-9 bg-black/20 backdrop-blur-sm rounded-sq-sm flex items-center justify-center hover:bg-black/40 transition-colors focus:outline-none"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Top-right rank badge */}
      {topRank && (
        <div className="absolute right-4 top-4 z-10">
          <Top100RankBadge listSlug={listSlug} rank={topRank} />
        </div>
      )}

      {/* Hero variant: Title at bottom like Course Details */}
      {isHero ? (
        <div className="absolute bottom-8 left-6 text-white z-10">
          <h1 className="text-4xl md:text-5xl font-semibold mb-1.5 drop-shadow-2xl">
            {displayLabel}
          </h1>
        </div>
      ) : (
        <>
          {/* Default variant: Title at top */}
          <div className="absolute left-4 right-4 top-4 sm:top-5">
            <h2 className="truncate whitespace-nowrap text-lg sm:text-xl font-semibold tracking-tight text-white">
              {displayLabel}
            </h2>
          </div>

          {/* Bottom content for default variant */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-1.5 px-4 pb-4">
            {/* Progress summary with animated number */}
            <p className="text-[13px] text-white font-medium">
              Rated <AnimatedNumber value={rated} minCh={1} className="font-semibold" /> of {total} courses
            </p>

            {/* Progress bar + percentage - animated */}
            <div className="flex items-center gap-2.5">
              <AnimatedProgressBar
                percentage={completion}
                height="h-[5px]"
                bgColor="bg-white/30"
                fillColor="bg-white"
                className="flex-1"
                delay={0.15}
              />
              <AnimatedNumber 
                value={completion} 
                suffix="%" 
                minCh={2}
                delay={0.2}
                className="text-[11px] font-semibold text-white tabular-nums min-w-[28px] text-right"
              />
            </div>

            {/* Journey tone phrase - soft emotional reinforcement */}
            <p className="text-[11px] text-white/60 mt-0.5">
              {journeyPhrase}
            </p>

            {/* View courses button - premium glass styling */}
            {showCta && (
              <div className="mt-2.5 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    'rounded-sq-sm px-4 py-1.5 text-xs font-medium',
                    'bg-white/95 backdrop-blur-sm text-foreground',
                    'border border-white/20 shadow-sm',
                    'hover:bg-white hover:shadow-md',
                    'active:scale-[0.97] transition-all duration-150'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                >
                  View courses
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
