/**
 * PlayoffPendingPanel — Results · awaiting-playoff bottom band.
 * §6.4 of HYBRID_HERO_IMPLEMENTATION_BRIEF — tied players (gold tint) followed
 * by next clear chasers until 4 rows total.
 */

import React from 'react';
import { SoloLeaderRow } from './LeaderRow';
import { ChaserRow } from './ChaserRow';

export interface PlayoffPlayer {
  rank: string;
  name: string;
  country?: string;
  score: string;
  thru?: string;
  avatarCandidates?: (string | null | undefined)[];
  playerId?: string | null;
}

interface PlayoffPendingPanelProps {
  tied: PlayoffPlayer[];
  chasers: PlayoffPlayer[];
}

export function PlayoffPendingPanel({ tied, chasers }: PlayoffPendingPanelProps) {
  const all: { kind: 'tied' | 'chaser'; p: PlayoffPlayer }[] = [
    ...tied.slice(0, 4).map(p => ({ kind: 'tied' as const, p })),
  ];
  for (const c of chasers) {
    if (all.length >= 4) break;
    all.push({ kind: 'chaser', p: c });
  }

  return (
    <div>
      {all.map((item, i) => {
        const isLast = i === all.length - 1;
        if (item.kind === 'tied') {
          return (
            <SoloLeaderRow
              key={`t-${i}`}
              rank={item.p.rank}
              name={item.p.name}
              country={item.p.country}
              score={item.p.score}
              thru={item.p.thru ?? 'F'}
              avatarCandidates={item.p.avatarCandidates}
              playerId={item.p.playerId}
              isResults
              isLast={isLast}
            />
          );
        }
        return (
          <ChaserRow
            key={`c-${i}`}
            rank={item.p.rank}
            name={item.p.name}
            score={item.p.score}
            thru={item.p.thru ?? 'F'}
            avatarCandidates={item.p.avatarCandidates}
            playerId={item.p.playerId}
            isResults
            isLast={isLast}
          />
        );
      })}
    </div>
  );
}
