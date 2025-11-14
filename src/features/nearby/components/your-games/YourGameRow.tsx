/**
 * YourGameRow - Flat row component for Your Games list
 */
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameStatusPill } from '@/features/hub/components/GameStatusPill';
import { YourGameDetails } from './YourGameDetails';
import type { Game, Participant } from './types';
import { haptic } from '@/utils/haptics';

interface YourGameRowProps {
  game: Game;
  variant: 'hosting' | 'joined';
  host?: Participant | null;
  members?: Participant[];
  expanded: boolean;
  onToggle: () => void;
  onCancel?: (gameId: string) => void;
  onLeave?: (gameId: string) => void;
  onViewRequests?: (gameId: string) => void;
  index: number;
}

export function YourGameRow({
  game,
  variant,
  host,
  members = [],
  expanded,
  onToggle,
  onCancel,
  onLeave,
  onViewRequests,
  index,
}: YourGameRowProps) {
  const handleToggle = () => {
    haptic('light');
    onToggle();
  };

  // Derived data
  const filled = Math.max(0, (game.slots_total ?? 0) - (game.slots_open ?? 0));
  const start = new Date(game.start_time);
  const dateStr = start.toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  const timeStr = start.toLocaleTimeString(undefined, { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  
  const expires = new Date(game.expires_at);
  const now = new Date();
  const diffMs = expires.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const expiryLabel = diffHours > 0 ? `Expires in ${diffHours}h` : 'Expired';

  // Status logic
  const getStatus = (): 'open' | 'full' | 'almost' => {
    if (game.slots_open === 0) return 'full';
    if (game.slots_open === 1) return 'almost';
    return 'open';
  };

  return (
    <article
      className={cn('yourGameRow', expanded && 'yourGameRow--expanded')}
      data-game-id={game.id}
      style={{ animationDelay: `${index * 40}ms` }}
      aria-label={`${game.course_name}, ${dateStr}, ${timeStr}`}
    >
      <div className="yourGameRow__header" onClick={handleToggle}>
        <div className="yourGameRow__titleBlock">
          <div className="yourGameRow__courseName">{game.course_name}</div>
          <div className="yourGameRow__timeLine">
            <span className="yourGameRow__metaLine">🗓️ {dateStr} • {timeStr}</span>
            <span className="yourGameRow__metaLine">⏳ {expiryLabel}</span>
          </div>
        </div>

        <div className="yourGameRow__right">
          <GameStatusPill
            filled={filled}
            total={game.slots_total}
            status={getStatus()}
          />
          <ChevronDown
            className={cn(
              'yourGameRow__chevron',
              expanded && 'yourGameRow__chevron--expanded'
            )}
            size={16}
            aria-hidden="true"
          />
        </div>
      </div>

      {expanded && (
        <YourGameDetails
          game={game}
          variant={variant}
          host={host}
          members={members}
          onCancel={onCancel}
          onLeave={onLeave}
          onViewRequests={onViewRequests}
        />
      )}
    </article>
  );
}
