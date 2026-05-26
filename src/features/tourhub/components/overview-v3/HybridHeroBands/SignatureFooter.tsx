/**
 * SignatureFooter — Pass 7. Broadcast-style lower-third closing the hero zone.
 * Pass 7 renders only the state label + dot; right-side metadata wires in 7.1.
 */

import React from 'react';
import { INK } from '../HybridHero.constants';
import type { HeroState } from '../HybridHero.utils';

interface SignatureFooterProps {
  state: HeroState;
  lastSyncedAt?: string | null;
  playerCount?: number | null;
  cutLine?: string | null;
}

function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.floor((now - then) / 60_000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins} MIN AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} HR AGO`;
  const days = Math.floor(hrs / 24);
  return `${days} DAY AGO`;
}

export function SignatureFooter({
  state,
  lastSyncedAt,
  playerCount,
  cutLine,
}: SignatureFooterProps) {
  const stateLabel =
    state.kind === 'live' ? 'LIVE' : state.kind === 'results' ? 'FINAL' : 'UPCOMING';
  const dotColor = state.kind === 'live' ? '#10B981' : '#F7931E';
  const hasRightMeta = !!(playerCount || cutLine);

  return (
    <div
      style={{
        background: INK,
        height: 36,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dotColor,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          {stateLabel}
          {lastSyncedAt && (
            <>
              {' · '}
              <span style={{ color: 'rgba(255,255,255,0.50)', fontWeight: 700 }}>
                {formatTimeAgo(lastSyncedAt)}
              </span>
            </>
          )}
        </span>
      </div>

      {hasRightMeta && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          {playerCount && `${playerCount} PLAYERS`}
          {playerCount && cutLine && ' · '}
          {cutLine && `CUT ${cutLine}`}
        </span>
      )}
    </div>
  );
}
