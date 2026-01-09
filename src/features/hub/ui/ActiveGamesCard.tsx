import React from 'react';
import { Users } from 'lucide-react';

export type ActiveGameSummary = {
  title: string;
  subtitle: string;
  courseName?: string;
  startTimeISO?: string;
  slotsOpen?: number;
  slotsTotal?: number;
};

export interface ActiveGamesCardProps {
  summary: ActiveGameSummary;
  onPress: () => void;
}

/**
 * ActiveGamesCard
 * - Compact left tile.
 * - Shows "No games nearby" empty state cleanly.
 */
export function ActiveGamesCard({ summary, onPress }: ActiveGamesCardProps) {
  const hasSlots = summary.slotsOpen != null && summary.slotsTotal != null;

  return (
    <button type="button" className="hubTile hubTile--left" onClick={onPress}>
      <div className="text-base font-semibold text-black/85 leading-tight">
        Active Games
        <br />
        Near You
      </div>

      <div className="mt-2 text-sm text-black/45">{summary.subtitle}</div>

      {summary.courseName && (
        <div className="mt-3 text-sm font-medium text-black/70 truncate">{summary.courseName}</div>
      )}

      {hasSlots && (
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-xs text-black/55">
          <Users className="h-3.5 w-3.5" />
          {summary.slotsOpen}/{summary.slotsTotal}
        </div>
      )}
    </button>
  );
}
