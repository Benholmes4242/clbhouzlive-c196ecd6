import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';
import { Top100RankBadge } from './Top100RankBadge';

// Journey tone phrases - soft, encouraging, non-technical
const JOURNEY_PHRASES = [
  'Building momentum',
  'Your journey is underway',
  'Progress in motion',
  'Every course counts',
  'Early progress',
];

function getJourneyPhrase(rated: number, total: number): string {
  if (rated === 0) return 'Start your journey';
  if (rated >= total) return 'Journey complete';
  // Rotate phrases based on rated count for variety
  return JOURNEY_PHRASES[rated % JOURNEY_PHRASES.length];
}

type Top100RegionCardProps = {
  list: Top100ListSummary;
  onClick?: () => void;
  showCta?: boolean;
  variant?: 'default' | 'hero';
  onBack?: () => void;
};

export const Top100RegionCard: React.FC<Top100RegionCardProps> = ({
  list,
  onClick,
  showCta = true,
  variant = 'default',
  onBack,
}) => {
  const total = list.total_courses ?? 0;
  const rated = list.played_count ?? 0;
  const completion = total > 0 ? Math.min(100, Math.round((rated / total) * 100)) : 0;
  const hero = list.hero_course;
  const topRank = hero?.rank_in_list ?? null;
  const listSlug = list.slug as 'global' | 'gb-i' | 'usa' | 'europe';

  // Check if this is the primary (Worldwide) journey
  const isPrimary = listSlug === 'global';
  
  const journeyPhrase = useMemo(() => getJourneyPhrase(rated, total), [rated, total]);

  // Map short labels to full display names
  const getDisplayLabel = (shortLabel: string, slug: string) => {
    if (slug === 'global' || shortLabel === 'Global') return 'Worldwide Top 100';
    if (shortLabel === 'GB&I') return 'Great Britain & Ireland Top 100';
    if (shortLabel === 'Europe') return 'Continental Europe Top 100';
    if (shortLabel === 'USA') return 'USA Top 100';
    return `${shortLabel} Top 100`;
  };

  const displayLabel = getDisplayLabel(list.short_label || list.name, list.slug);

  const isHero = variant === 'hero';

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'bg-slate-900 text-white',
        isHero ? [
          // Full-width hero: no rounded corners, negative margins to break out of gutters
          'rounded-none -mx-4',
          'h-[17.5rem]' // Match course-hero-container height (280px)
        ] : [
          // Default card style with rounded corners
          'rounded-sq-lg shadow-md',
          'transition-all duration-200 ease-out',
          'hover:scale-[1.01] hover:shadow-lg',
          'active:scale-[0.99]',
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
          {/* Slightly stronger overlay for primary card */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t via-transparent to-transparent",
            isPrimary ? "from-black/70" : "from-black/60"
          )} />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
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
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-1.5 px-4 pb-4 pt-20">
            {/* Progress summary */}
            <p className="text-[13px] text-white/90">
              Rated <span className="font-semibold">{rated}</span> of {total} courses
            </p>

            {/* Progress bar + percentage */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-500 ease-out"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <span className="text-xs font-medium text-white/80 tabular-nums min-w-[32px] text-right">
                {completion}%
              </span>
            </div>

            {/* Journey tone phrase - soft emotional reinforcement */}
            <p className="text-[11px] text-white/50 mt-0.5">
              {journeyPhrase}
            </p>

            {/* View courses button */}
            {showCta && (
              <div className="mt-2.5 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-sq-sm px-4 py-1.5 text-xs font-medium bg-white/95 text-slate-900 hover:bg-white border-none shadow-sm"
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
