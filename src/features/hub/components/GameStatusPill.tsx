/**
 * GameStatusPill - Shared status pill for game capacity
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface GameStatusPillProps {
  filled: number;
  total: number;
  status?: 'open' | 'full' | 'almost'; // Optional - auto-determined if not provided
}

export function GameStatusPill({ filled, total, status: providedStatus }: GameStatusPillProps) {
  // Auto-determine status if not provided
  const status = providedStatus ?? (
    filled === total ? 'full' :
    filled === total - 1 ? 'almost' :
    'open'
  );

  return (
    <span className={cn('gameStatusPill', `gameStatusPill--${status}`)}>
      {filled}/{total}
    </span>
  );
}
