import React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';

type Top100RegionCardProps = {
  list: Top100ListSummary;
  onClick?: () => void;
};

export const Top100RegionCard: React.FC<Top100RegionCardProps> = ({
  list,
  onClick,
}) => {
  const total = list.total_courses ?? 0;
  const played = list.played_count ?? 0;
  const progress = total > 0 ? Math.min(100, Math.round((played / total) * 100)) : 0;
  const hero = list.hero_course;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full overflow-hidden',
        'text-left text-slate-50',
        'shadow-lg shadow-slate-900/30',
        'active:scale-[0.99] transition-transform duration-100',
        'h-[230px] sm:h-[250px]'
      )}
      style={{ borderRadius: 'var(--top100-card-radius)' }}
    >
      {/* Background image */}
      {hero?.cover_image_url ? (
        <div className="absolute inset-0">
          <img
            src={hero.cover_image_url}
            alt={hero.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {/* Bottom gradient only */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-neutral-900" />
      )}

      {/* Content */}
      <div className="relative px-5 py-4 space-y-3 h-full flex flex-col justify-between">
        {/* Row 1: Region name + location icon */}
        <div className="flex items-center justify-between">
          <div className="text-[19px] font-semibold text-white tracking-tight">
            {list.name}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 backdrop-blur">
            <MapPin className="h-4 w-4 text-white/80" />
          </div>
        </div>

        {/* Bottom section */}
        <div className="space-y-3">
          {/* Row 2: counts + hero course pill */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-white/80">
              {played} / {total} played
            </div>

            {hero && (
              <div 
                className="max-w-[56%] rounded-full bg-black/35 px-3 py-1 text-xs text-white/90 backdrop-blur truncate"
                style={{ border: 'var(--pill-border)' }}
              >
                <span className="font-semibold mr-1">#{hero.rank_in_list}</span>
                <span className="truncate">{hero.name}</span>
              </div>
            )}
          </div>

          {/* Row 3: progress bar + helper */}
          <div className="space-y-1">
            <div 
              className="w-full overflow-hidden bg-white/16"
              style={{ 
                height: 'var(--top100-progress-height)', 
                borderRadius: 'var(--top100-progress-radius)' 
              }}
            >
              <div
                className="h-full bg-amber-400"
                style={{ 
                  width: `${progress}%`,
                  borderRadius: 'var(--top100-progress-radius)'
                }}
              />
            </div>
            <div className="text-[11px] text-white/75">
              {progress === 0
                ? 'Start your journey on this list'
                : `${100 - progress}% remaining to complete this list`}
            </div>
          </div>

          {/* Row 4: CTA */}
          <div className="pt-1 text-sm font-medium text-white">
            View courses →
          </div>
        </div>
      </div>
    </button>
  );
};
