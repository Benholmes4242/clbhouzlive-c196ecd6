/**
 * ClubhouzCalledItSection — Dispatch-style results showing how AI picks performed.
 * Hero pick highlight + compact all-picks ruled table.
 */

import React from 'react';
import type { TrackedPrediction } from './types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface ClubhouzCalledItSectionProps {
  allPicks: TrackedPrediction[];
  tourSlug?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatScore(score: number | null): string {
  if (score === null || score === undefined) return 'E';
  if (score === 0) return 'E';
  return score < 0 ? String(score) : `+${score}`;
}

function getPositionColor(pos: number | null): string {
  if (pos === 1) return '#F7931E';
  if (pos !== null && pos <= 5) return '#16A34A';
  if (pos !== null && pos <= 10) return 'rgba(22,163,74,0.6)';
  return '#94A3B8';
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ClubhouzCalledItSection: React.FC<ClubhouzCalledItSectionProps> = ({
  allPicks,
  tourSlug,
}) => {
  if (!allPicks.length) return null;

  // Sort table by actual finishing position (best first), cuts/WDs/nulls at bottom
  const sorted = [...allPicks].sort((a, b) => {
    const aFinished = a.actualPosition !== null &&
      a.performanceStatus !== 'cut' &&
      a.performanceStatus !== 'withdrawn';
    const bFinished = b.actualPosition !== null &&
      b.performanceStatus !== 'cut' &&
      b.performanceStatus !== 'withdrawn';

    if (aFinished && bFinished) return (a.actualPosition!) - (b.actualPosition!);
    if (aFinished) return -1;
    if (bFinished) return 1;
    return 0;
  });

  const heroPick = sorted[0];
  const isWinner = heroPick?.actualPosition === 1 &&
    heroPick?.performanceStatus !== 'cut' &&
    heroPick?.performanceStatus !== 'withdrawn';

  return (
    <div>
      {/* Section header */}
      <div style={{ padding: '14px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Clbhouz Called It
          </span>
        </div>
      </div>

      {/* Best pick highlight — white ruled block */}
      <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
        <div style={{
          padding: '14px 16px',
          borderLeft: '3px solid #F7931E',
          background: 'rgba(247,147,30,0.03)',
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            {isWinner && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F7931E', borderRadius: 5, padding: '2px 8px' }}>
                <span style={{ fontSize: 9 }}>🏆</span>
                <span style={{ fontSize: 8.5, fontWeight: 900, color: '#fff', letterSpacing: '0.06em' }}>CLBHOUZ CALLED IT</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 4 }}>
                {heroPick.playerName}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: isWinner ? '#92400E' : '#16A34A' }}>
                {isWinner
                  ? 'Won the tournament'
                  : heroPick.actualPosition
                    ? `Finished ${heroPick.actualPositionTied ? 'T' : ''}${getOrdinal(heroPick.actualPosition)}`
                    : heroPick.performanceStatus === 'cut' ? 'Missed the cut'
                    : heroPick.performanceStatus === 'withdrawn' ? 'Withdrawn'
                    : 'Did not finish'}
              </div>
            </div>
            <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: isWinner ? '#F7931E' : '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {heroPick.score !== null ? (heroPick.score > 0 ? `+${heroPick.score}` : `${heroPick.score}`) : '—'}
              </div>
              {isWinner && (
                <div style={{ fontSize: 8.5, fontWeight: 900, color: '#B45309', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 2 }}>
                  Winner
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All picks table */}
        <div style={{ padding: '8px 16px', borderBottom: '0.5px solid rgba(15,23,42,0.07)', background: 'rgba(15,23,42,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 12, background: '#0F172A', borderRadius: 1 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
              Tournament Intelligence · Our Picks
            </span>
          </div>
        </div>

        {sorted.map((pick, idx) => {
          const pickIsWinner = pick.actualPosition === 1;
          const posColor = getPositionColor(pick.actualPosition);

          return (
            <div
              key={pick.playerId}
              style={{
                display: 'flex', alignItems: 'center', padding: '11px 16px',
                borderBottom: idx < sorted.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
                borderLeft: pickIsWinner ? '3px solid #F7931E' : '3px solid transparent',
                background: pickIsWinner ? 'rgba(247,147,30,0.03)' : 'transparent',
              }}
            >
              <span style={{
                flex: 1, fontSize: 14,
                fontWeight: pickIsWinner ? 800 : 600,
                color: '#0F172A',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              }}>
                {pick.playerName}
              </span>
              <span style={{ fontSize: 12, color: '#94A3B8', marginRight: 14, flexShrink: 0 }}>
                {formatScore(pick.score)}
              </span>
              <span style={{
                fontSize: pickIsWinner ? 15 : 13, fontWeight: 900, color: posColor,
                minWidth: 28, textAlign: 'right' as const, flexShrink: 0,
              }}>
                {pickIsWinner ? '🏆'
                  : pick.actualPosition
                    ? `${pick.actualPositionTied ? 'T' : ''}${pick.actualPosition}`
                    : pick.performanceStatus === 'cut' ? 'MC'
                    : pick.performanceStatus === 'withdrawn' ? 'WD'
                    : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
