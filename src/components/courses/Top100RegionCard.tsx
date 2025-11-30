import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Top100ListSummary } from '@/hooks/useTop100ListsWithHero';

interface Top100RegionCardProps {
  list: Top100ListSummary;
}

export function Top100RegionCard({ list }: Top100RegionCardProps) {
  const navigate = useNavigate();
  const total = list.total_courses ?? 0;
  const played = list.played_count ?? 0;
  const progress = total > 0 ? Math.min(100, Math.round((played / total) * 100)) : 0;
  const hero = list.hero_course;

  const handleClick = () => {
    navigate(`/courses?tab=top100&list=${list.slug}`);
  };

  return (
    <button
      onClick={handleClick}
      className="relative w-full overflow-hidden rounded-[var(--top100-card-radius)] transition-transform active:scale-[0.98]"
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
      <div className="relative px-5 py-4 space-y-3">
        {/* Row 1: Region + icon */}
        <div className="flex items-center justify-between">
          <div className="text-[19px] font-semibold text-white tracking-tight">
            {list.name}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 backdrop-blur">
            <MapPin className="h-4 w-4 text-white/80" />
          </div>
        </div>

        {/* Row 2: counts + hero course pill */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-white/80">
            {played} / {total} played
          </div>

          {hero && (
            <div className="max-w-[56%] rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-white/90 backdrop-blur line-clamp-1">
              <span className="font-semibold mr-1">#{hero.rank_in_list}</span>
              <span>{hero.name}</span>
            </div>
          )}
        </div>

        {/* Row 3: progress bar + helper */}
        <div className="space-y-1">
          <div className="h-[var(--top100-progress-height)] w-full overflow-hidden rounded-full bg-white/16">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${progress}%` }}
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
    </button>
  );
}
