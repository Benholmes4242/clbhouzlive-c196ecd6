/**
 * GameStatusPill - Shared status pill for game capacity
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface GameStatusPillProps {
  filled: number;
  total: number;
  status: 'open' | 'full' | 'almost';
}

export function GameStatusPill({ filled, total, status }: GameStatusPillProps) {
  return (
    <span className={cn('gameStatusPill', `gameStatusPill--${status}`)}>
      {filled}/{total}
    </span>
  );
}
