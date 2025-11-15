import React from 'react';
import { GameRow, type GameData, type GameRowProps } from '@/features/games/components/GameRow';
import { usePendingRequestCount } from '@/features/nearby/hooks/usePendingRequestCount';

interface GameRowWithRequestCountProps extends Omit<GameRowProps, 'pendingRequestCount'> {
  game: GameData;
  isHost: boolean;
}

/**
 * Wrapper component that adds pending request count to GameRow
 * Only fetches count when in hosting mode
 */
export function GameRowWithRequestCount({ 
  game,
  isHost,
  mode,
  ...props 
}: GameRowWithRequestCountProps) {
  const { data: pendingCount } = usePendingRequestCount(
    mode === 'yourGames' && isHost ? game.id : ''
  );

  return (
    <GameRow
      {...props}
      mode={mode}
      game={game}
      isHost={isHost}
      pendingRequestCount={pendingCount || 0}
    />
  );
}
