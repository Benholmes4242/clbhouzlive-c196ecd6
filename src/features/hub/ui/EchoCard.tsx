import React from 'react';
import { Sparkles } from 'lucide-react';

export interface EchoCardProps {
  onPress: () => void;
}

/**
 * EchoCard
 * - Replaces the duplicate "Create a Game" small tile.
 */
export function EchoCard({ onPress }: EchoCardProps) {
  return (
    <button type="button" className="hubTile hubTile--right" onClick={onPress}>
      <div className="echoIconCircle">
        <Sparkles className="h-6 w-6 text-black/60" />
      </div>
      <div className="mt-3 text-base font-semibold text-black/85">Echo</div>
      <div className="mt-1 text-sm text-black/45">
        Ask anything — courses, gear, rules, shots
      </div>
    </button>
  );
}
