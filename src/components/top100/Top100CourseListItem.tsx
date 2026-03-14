import React from 'react';
import CountryFlag from '@/components/ui/country-flag';
import { cn } from '@/lib/utils';

export interface Top100CourseListItemProps {
  position: number;
  courseName: string;
  countryLabel: string;
  country: string;
  thumbnailUrl: string | null;
  officialRankChipLeft?: string | null;
  officialRankChipRight?: string | null;
  isPlayed: boolean;
  onTogglePlayed?: () => void;
  onClick?: () => void;
}

export const Top100CourseListItem: React.FC<Top100CourseListItemProps> = ({
  position,
  courseName,
  countryLabel,
  country,
  thumbnailUrl,
  officialRankChipLeft,
  officialRankChipRight,
  isPlayed,
  onTogglePlayed,
  onClick,
}) => {
  return (
    <article className="px-4 pb-3">
      <div className="flex items-stretch rounded-[22px] bg-card shadow-sm border border-border/60 overflow-hidden">
        {/* Rank column */}
        <div className="flex w-14 items-center justify-center flex-shrink-0 bg-card">
          <span className="text-xl font-semibold" style={{ color: 'hsl(var(--accent-amber))' }}>
            #{position}
          </span>
        </div>

        {/* Content column */}
        <button
          type="button"
          className="flex flex-1 items-stretch gap-3 py-3 pr-3 text-left"
          onClick={onClick}
        >
          {/* Thumbnail */}
          <div className="relative aspect-[1.77/1] w-28 flex-shrink-0 overflow-hidden rounded-[18px]">
            <img
              src={thumbnailUrl || '/placeholder.svg'}
              alt={courseName}
              className="h-full w-full object-cover"
              loading="lazy"
            />

            {/* Rank chips over thumbnail */}
            {(officialRankChipLeft || officialRankChipRight) && (
              <div className="absolute left-1.5 top-1.5 flex gap-1">
                {officialRankChipLeft && (
                  <span className="rounded-full bg-slate-900/75 px-2 py-[2px] text-[11px] font-semibold text-white backdrop-blur-sm">
                    {officialRankChipLeft}
                  </span>
                )}
                {officialRankChipRight && (
                  <span className="rounded-full bg-slate-900/75 px-2 py-[2px] text-[11px] font-semibold text-white backdrop-blur-sm">
                    {officialRankChipRight}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Text + status */}
          <div className="flex flex-1 flex-col justify-between min-w-0">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2">
                {courseName}
              </h3>
              <p className="mt-1 text-[12px] text-muted-foreground flex items-center gap-1.5">
                <CountryFlag country={country} size="sm" />
                <span className="truncate">{countryLabel}</span>
              </p>
            </div>

            {/* Played pill aligned to the right */}
            <div className="mt-1 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlayed?.();
                }}
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-[4px] text-[11px] font-medium transition-colors',
                  isPlayed
                    ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                )}
              >
                {isPlayed ? (
                  <>
                    <span className="mr-1.5 inline-block h-3 w-3 rounded-full border border-amber-500 bg-amber-400" />
                    Played
                  </>
                ) : (
                  <>
                    <span className="mr-1.5 inline-block h-3 w-3 rounded-full border border-slate-400 bg-slate-100" />
                    Not played yet
                  </>
                )}
              </button>
            </div>
          </div>
        </button>
      </div>
    </article>
  );
};
