import React from 'react';
import { cn } from '@/lib/utils';

type Top100RegionCardProps = {
  title: string;              // "Global", "GB&I", "USA", "Europe"
  eyebrow: string;            // "GLOBAL TOP 100" etc
  played: number;             // 26
  total: number;              // 77
  heroImageUrl?: string | null;
  onClick?: () => void;
};

export const Top100RegionCard: React.FC<Top100RegionCardProps> = ({
  title,
  eyebrow,
  played,
  total,
  heroImageUrl,
  onClick,
}) => {
  const hasImage = Boolean(heroImageUrl);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full overflow-hidden rounded-3xl',
        'bg-slate-900 text-left text-slate-50',
        'shadow-lg shadow-slate-900/30',
        'active:scale-[0.99] transition-transform duration-100',
        'h-[230px] sm:h-[250px]'
      )}
    >
      {/* Background image */}
      {hasImage && (
        <div className="absolute inset-0">
          <img
            src={heroImageUrl!}
            alt={`${title} Top 100 hero`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
        </div>
      )}

      {/* Fallback gradient if no image */}
      {!hasImage && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      )}

      {/* Location pin pill (top-right) */}
      <div className="relative flex justify-end px-4 pt-3">
        <div className="inline-flex items-center justify-center rounded-full bg-slate-900/60 px-2 py-1 backdrop-blur-sm">
          <span className="text-xs text-slate-200">📍</span>
        </div>
      </div>

      {/* Content block (bottom) */}
      <div className="relative px-5 pb-5 pt-10">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
          {eyebrow}
        </div>

        <div className="mt-1 text-2xl font-semibold tracking-tight">
          {title}
        </div>

        <div className="mt-3 inline-flex items-center rounded-full bg-slate-950/70 px-3 py-1 text-[12px] font-medium text-slate-100">
          {played} / {total} played
        </div>

        <div className="mt-3 text-[13px] font-medium text-slate-100/90">
          View courses <span aria-hidden="true">→</span>
        </div>
      </div>
    </button>
  );
};
