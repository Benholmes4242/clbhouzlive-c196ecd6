/**
 * EmptyJoinedState - Empty state for joined games
 */
import React from 'react';
import { PrimaryCTAButton } from '@/features/hub/components/HubButtons';

interface EmptyJoinedStateProps {
  onFindGame: () => void;
}

export function EmptyJoinedState({ onFindGame }: EmptyJoinedStateProps) {
  return (
    <div className="yourGamesEmpty">
      <div className="yourGamesEmpty__icon">🔍</div>
      <h2 className="yourGamesEmpty__title">
        You haven't joined any games yet.
      </h2>
      <p className="yourGamesEmpty__body">
        Browse public games near you and request to join.
      </p>
      <PrimaryCTAButton
        label="Find a Game"
        onClick={onFindGame}
      />
    </div>
  );
}
