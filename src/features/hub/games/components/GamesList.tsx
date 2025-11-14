/**
 * Games List Component
 * Displays list of games with empty states
 */
import React from 'react';
import { GameRow } from './GameRow';
import type { GolfCourse } from '@/features/nearby/hooks/useCourseSearch';

interface Game {
  id: string;
  course_name?: string;
  start_time: string;
  slots_total: number;
  slots_open: number;
  host_user_id: string;
}

interface GamesListProps {
  games: Game[];
  isLoading: boolean;
  selectedClub: GolfCourse | null;
  onCreateGame: () => void;
  onClearClub: () => void;
  onIncreaseDistance: () => void;
}

export function GamesList({
  games,
  isLoading,
  selectedClub,
  onCreateGame,
  onClearClub,
  onIncreaseDistance,
}: GamesListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center">
        <div className="text-[12px] text-[color:var(--hub-text-muted)]">Loading games...</div>
      </div>
    );
  }

  // Empty state - selected club but no games
  if (selectedClub && games.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center px-8">
        <div className="mb-3 text-[32px]">📍</div>
        <p className="text-[14px] font-semibold text-[color:var(--hub-text-bright)]">
          No games found at {selectedClub.name}
        </p>
        <p className="mt-1 text-[12px] text-[color:var(--hub-text-muted)]">
          Be the first to start one — tap <span className="font-medium">Create a Game</span>.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCreateGame}
            className="rounded-[999px] bg-[color:var(--hub-accent)] px-4 py-1.5 text-[12px] font-semibold text-black"
          >
            Create a Game
          </button>
          <button
            type="button"
            onClick={onClearClub}
            className="rounded-[999px] border border-[color:var(--hub-stroke-subtle)] bg-white/5 px-4 py-1.5 text-[12px] text-[color:var(--hub-text-muted)]"
          >
            Search another course
          </button>
        </div>
      </div>
    );
  }

  // Empty state - no filters & no games
  if (!selectedClub && games.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center px-8">
        <div className="mb-3 text-[32px]">⛳️</div>
        <p className="text-[14px] font-semibold text-[color:var(--hub-text-bright)]">
          No games nearby yet
        </p>
        <p className="mt-1 text-[12px] text-[color:var(--hub-text-muted)]">
          Try widening your distance or starting a new game for others to join.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onIncreaseDistance}
            className="rounded-[999px] border border-[color:var(--hub-stroke-subtle)] bg-white/5 px-4 py-1.5 text-[12px] text-[color:var(--hub-text-muted)]"
          >
            Increase distance
          </button>
          <button
            type="button"
            onClick={onCreateGame}
            className="rounded-[999px] bg-[color:var(--hub-accent)] px-4 py-1.5 text-[12px] font-semibold text-black"
          >
            Create a Game
          </button>
        </div>
      </div>
    );
  }

  // Games list
  return (
    <ul className="mt-1 divide-y divide-[color:var(--hub-divider-soft)] border-t border-[color:var(--hub-divider-soft)]">
      {games.map((game) => (
        <GameRow key={game.id} game={game} />
      ))}
    </ul>
  );
}
