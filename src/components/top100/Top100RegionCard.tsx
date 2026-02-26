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
  const isPrimary = listSlug === 'global';
  const isZeroProgress = rated === 0;

  const getJourneyPhrase = () => {
    if (rated === 0) return 'Start your journey';
    if (rated >= total) return 'Conquered ✨';
    const phrase = getProgressInsight(completion, listSlug, userId, usedPhrases);
    usedPhrases?.add(phrase);
    return phrase;
  };
  const journeyPhrase = getJourneyPhrase();

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
          'rounded-none -mx-4',
          'h-[17.5rem]',
        ] : [
          'rounded-2xl',
          'shadow-[0_4px_20px_rgba(0,0,0,0.15)]',
          'transition-all duration-200 ease-out',
          'hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-[1.01]',
          'active:scale-[0.98]',
          'cursor-pointer',
          isPrimary && 'ring-1 ring-white/10',
        ]
      )}
      style={!isHero ? { aspectRatio: '16 / 10' } : undefined}
      onClick={onClick}
    >
      {/* Background image with conditional desaturation for 0% progress */}
      {hero?.cover_image_url ? (
        <>
          <img
            src={hero.cover_image_url}
            alt={hero.name}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-[filter] duration-500',
              isZeroProgress && !isHero && 'saturate-[0.7]'
            )}
            loading="lazy"
          />
          {/* Three-zone cinematic gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                linear-gradient(to bottom,
                  rgba(0,0,0,0.45) 0%,
                  rgba(0,0,0,0.15) 30%,
                  transparent 40%,
                  transparent 55%,
                  rgba(0,0,0,0.25) 65%,
                  rgba(0,0,0,0.65) 100%
                )
              `,
            }}
          />
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
          <h1
            className="text-4xl md:text-5xl font-semibold mb-1.5"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
          >
            {displayLabel}
          </h1>
        </div>
      ) : (
        <>
          {/* Default variant: Title at top */}
          <div className="absolute left-4 right-4 top-4 sm:top-5">
            <h2
              className="truncate whitespace-nowrap text-[22px] font-bold tracking-tight text-white"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
            >
              {displayLabel}
            </h2>
          </div>

          {/* Bottom content for default variant */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-1.5 px-4 pb-4">
            {/* Progress summary with animated number */}
            <p className="text-[15px] text-white font-medium" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              Rated <AnimatedNumber value={rated} minCh={1} className="font-bold text-[16px]" /> of {total} courses
            </p>

            {/* Progress bar + percentage - 4px white fill */}
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <AnimatedNumber
                value={completion}
                suffix="%"
                minCh={2}
                delay={0.2}
                className="text-[12px] font-semibold text-white/80 tabular-nums min-w-[28px] text-right"
              />
            </div>

            {/* Journey tone phrase */}
            <p className="text-[13px] text-white/70 mt-0.5" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
              {journeyPhrase}
            </p>

            {/* View courses button - elevated glass styling */}
            {showCta && (
              <div className="mt-2.5 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    'rounded-xl px-5 py-2.5 text-[14px] font-semibold',
                    'bg-white/95 backdrop-blur-sm text-foreground',
                    'border border-white/20',
                    'shadow-[0_2px_8px_rgba(0,0,0,0.15)]',
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
