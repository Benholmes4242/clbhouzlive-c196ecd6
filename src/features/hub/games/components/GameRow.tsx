/**
 * Game Row Component
 * Individual game list item with status badge
 */
import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';

interface GameRowProps {
  game: {
    id: string;
    course_name?: string;
    start_time: string;
    slots_total: number;
    slots_open: number;
  };
}

export function GameRow({ game }: GameRowProps) {
  const joinedSlots = game.slots_total - game.slots_open;
  const isFull = game.slots_open === 0;
  
  const statusLabel = isFull ? 'Full' : `${joinedSlots}/${game.slots_total} filled`;
  const statusClass = isFull
    ? 'bg-red-500/15 border-red-400/40 text-red-200'
    : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200';

  // Format date and time
  const date = new Date(game.start_time);
  const dateLabel = format(date, 'MMM d');
  const timeLabel = format(date, 'h:mm a');
  
  // Placeholder for holes (could come from game data)
  const holes = '18';

  const handlePress = () => {
    haptic('light');
    // TODO: Navigate to game details
  };

  return (
    <li>
      <button
        type="button"
        onClick={handlePress}
        className="flex w-full items-center justify-between gap-3 py-2.5 active:scale-[0.99] transition-transform duration-100"
      >
        <div className="min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-[color:var(--hub-text-body)]">
              {game.course_name || 'Unknown Course'}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-[color:var(--hub-text-muted)]">
            {dateLabel} · {timeLabel} · {holes} holes
          </p>
        </div>

        <span
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-[3px] text-[10px] font-medium uppercase tracking-[0.1em]',
            statusClass
          )}
        >
          {statusLabel}
        </span>
      </button>
    </li>
  );
}
