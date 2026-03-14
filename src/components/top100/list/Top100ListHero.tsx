import React from 'react';

interface HeroCourse {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface ListMeta {
  name: string;
  regionEmoji: string;
  playedCount: number;
  totalCount: number;
  completionPercent: number;
  heroCourse: HeroCourse | null;
  nextMustPlay?: { name: string } | null;
}

interface Top100ListHeroProps {
  listMeta: ListMeta;
  onContinueJourney?: () => void;
}

export const Top100ListHero: React.FC<Top100ListHeroProps> = ({
  listMeta,
  onContinueJourney,
}) => {
  const heroImageUrl = listMeta.heroCourse?.imageUrl || '/placeholder.svg';

  return (
    <div className="mx-4 mt-4 rounded-3xl overflow-hidden relative shadow-lg">
      {/* Background image */}
      <img
        src={heroImageUrl}
        alt={listMeta.heroCourse?.name || listMeta.name}
        className="h-[220px] w-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10">
        {/* Region badge top-right */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-sm">
          <span className="text-lg">{listMeta.regionEmoji}</span>
          <span className="text-xs text-white/80">Top 100</span>
        </div>

        {/* Title */}
        <div className="text-white text-[22px] font-semibold leading-tight">
          {listMeta.name}
        </div>

        {/* Subtitle line */}
        <div className="mt-1 text-white/80 text-[13px]">
          You've played {listMeta.playedCount} of {listMeta.totalCount} courses in this list
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${listMeta.completionPercent * 100}%`, backgroundColor: 'hsl(var(--accent-amber))' }}
          />
        </div>

        {/* CTA + "most important missing" strip */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            onClick={onContinueJourney}
            className="px-4 py-2 rounded-xl bg-white text-[13px] font-semibold text-foreground active:opacity-80 transition-opacity"
          >
            Continue your journey
          </button>

          {/* optional: smallest text */}
          {listMeta.nextMustPlay && (
            <div className="text-[11px] text-white/85 text-right max-w-[150px] truncate">
              Top unplayed: <span className="font-semibold">{listMeta.nextMustPlay.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
