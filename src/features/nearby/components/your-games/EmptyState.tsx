import React from 'react';
import { TapButton } from '@/components/ui/TapButton';

type EmptyStateProps = {
  type: 'hosting' | 'joined';
  onCreateGame?: () => void;
  onFindGame?: () => void;
};

export function EmptyState({ type, onCreateGame, onFindGame }: EmptyStateProps) {
  if (type === 'hosting') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="text-4xl mb-3">⛳</div>
        <p className="text-sm text-white/60 mb-4">
          You're not hosting any games yet.
        </p>
        {onCreateGame && (
          <TapButton
            onClick={onCreateGame}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/14 active:bg-white/18 border border-white/15 text-sm font-medium text-white/90"
          >
            Create a Game
          </TapButton>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-4xl mb-3">🔍</div>
      <p className="text-sm text-white/60 mb-4">
        You haven't joined any games yet.
      </p>
      {onFindGame && (
        <TapButton
          onClick={onFindGame}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/14 active:bg-white/18 border border-white/15 text-sm font-medium text-white/90"
        >
          Find a Game
        </TapButton>
      )}
    </div>
  );
}
