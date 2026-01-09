import React from 'react';
import { MapPin } from 'lucide-react';

export type NextUpGame = {
  id: string;
  courseId: string;
  courseName: string;
  region?: string | null;
  startTimeISO: string;
  playersJoined?: number;
  playersTotal?: number;
  heroImageUrl?: string | null;
};

export interface NextUpHeroCardProps {
  game: NextUpGame | null;
  onPress: () => void;
}

/**
 * NextUpHeroCard
 * - 10% taller than before.
 * - Pull hero image from the linked course (golf_courses.hero_image_url).
 */
export function NextUpHeroCard({ game, onPress }: NextUpHeroCardProps) {
  if (!game) {
    return (
      <div className="nextUpHero nextUpHero--empty">
        <div className="px-4 py-3">
          <div className="text-sm font-semibold text-black/80">No upcoming game</div>
          <div className="text-xs text-black/50 mt-1">Create a game or join one nearby.</div>
        </div>
      </div>
    );
  }

  const dateLabel = new Date(game.startTimeISO).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = new Date(game.startTimeISO).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <button
      type="button"
      onClick={onPress}
      className="nextUpHero"
      aria-label={`Next up: ${game.courseName}`}
    >
      <div className="nextUpHero__imgWrap">
        {game.heroImageUrl ? (
          <img
            src={game.heroImageUrl}
            alt={`${game.courseName} hero`}
            className="nextUpHero__img"
            loading="lazy"
          />
        ) : (
          <div className="nextUpHero__imgFallback" />
        )}
        <div className="nextUpHero__overlay" />
      </div>

      <div className="nextUpHero__content">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-white/90" />
          <div className="nextUpHero__title">{game.courseName}</div>
        </div>

        <div className="nextUpHero__meta">
          <span>{dateLabel}</span>
          <span className="mx-1">·</span>
          <span>{timeLabel}</span>
          {game.region ? (
            <>
              <span className="mx-1">·</span>
              <span className="truncate">{game.region}</span>
            </>
          ) : null}
        </div>

        {(game.playersJoined != null && game.playersTotal != null) && (
          <div className="nextUpHero__pill">
            {game.playersJoined}/{game.playersTotal} players
          </div>
        )}
      </div>
    </button>
  );
}
