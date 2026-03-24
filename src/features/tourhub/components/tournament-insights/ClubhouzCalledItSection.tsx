/**
 * ClubhouzCalledItSection — Shows how AI picks performed after tournament completion.
 * Hero pick card + compact all-picks table.
 */

import React, { useEffect } from 'react';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
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
  if (pos === 1) return 'hsl(var(--accent-amber))';
  if (pos !== null && pos <= 5) return '#16A34A';
  if (pos !== null && pos <= 10) return 'rgba(22,163,74,0.6)';
  return 'hsl(var(--muted-foreground))';
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ─── Keyframes ───────────────────────────────────────────────────────────────

const STYLE_ID = 'clbhouz-called-it-keyframes';
function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes stampIn {
      0% { opacity: 0; transform: scale(1.3) rotate(-6deg); }
      60% { opacity: 1; transform: scale(0.96) rotate(1deg); }
      100% { opacity: 1; transform: scale(1) rotate(-1deg); }
    }
    @keyframes shimmerLight {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ClubhouzCalledItSection: React.FC<ClubhouzCalledItSectionProps> = ({
  allPicks,
  tourSlug,
}) => {
  useEffect(() => { ensureKeyframes(); }, []);

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

  // Hero = best finishing pick (first in sorted array)
  const heroPick = sorted[0];
  const isWinner = heroPick?.actualPosition === 1 &&
    heroPick?.performanceStatus !== 'cut' &&
    heroPick?.performanceStatus !== 'withdrawn';
  const heroAvatar = getPlayerHeadshotUrl(heroPick.playerName, tourSlug ?? 'pga') ?? PLAYER_SILHOUETTE_URL;

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Section label */}
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 1.8,
        textTransform: 'uppercase' as const,
        color: 'hsl(var(--muted-foreground))',
        marginBottom: 12, paddingLeft: 16,
      }}>
        clbhouz called it
      </div>

      {/* ── HERO PICK CARD ─────────────────────────────────────────── */}
      <div style={{
        margin: '0 16px 16px',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        background: isWinner
          ? 'linear-gradient(135deg, rgba(255,248,230,0.95) 0%, rgba(255,252,240,0.98) 100%)'
          : 'rgba(240,253,244,0.95)',
        border: isWinner
          ? '1.5px solid rgba(245,158,11,0.5)'
          : '1px solid rgba(22,163,74,0.3)',
        boxShadow: isWinner
          ? '0 0 20px rgba(245,158,11,0.12), 0 4px 16px rgba(0,0,0,0.06)'
          : '0 4px 16px rgba(0,0,0,0.06)',
      }}>
        {/* Amber top bar */}
        {isWinner && (
          <div style={{
            height: 3,
            background: 'linear-gradient(90deg, #F59E0B, rgba(245,158,11,0.2))',
          }} />
        )}

        {/* Gold shimmer overlay */}
        {isWinner && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(120deg, transparent 30%, rgba(245,158,11,0.06) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'shimmerLight 3s linear infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        )}

        <div style={{ padding: '16px 18px', position: 'relative', zIndex: 1 }}>
          {/* Stamp badge + pick rank */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px',
              borderRadius: 8,
              background: isWinner ? '#F59E0B' : 'rgba(22,163,74,0.12)',
              animation: 'stampIn 0.5s ease-out 0.3s both',
            }}>
              <span style={{ fontSize: 12 }}>{isWinner ? '🏆' : '✓'}</span>
              <span style={{
                fontSize: 11, fontWeight: 800,
                color: isWinner ? '#451A03' : '#16A34A',
                letterSpacing: '0.02em',
              }}>
                {isWinner ? 'clbhouz called it' : 'Top Pick'}
              </span>
            </div>

            <div style={{
              padding: '4px 8px',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.06)',
              fontSize: 11, fontWeight: 700,
              color: 'hsl(var(--muted-foreground))',
            }}>
              Pick #{heroPick.predictedRank}
            </div>
          </div>

          {/* Player name + result */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
            <div>
              <div style={{
                fontSize: 24, fontWeight: 900,
                color: 'hsl(var(--foreground))',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginBottom: 4,
                animation: 'fadeUp 0.4s ease-out 0.3s both',
              }}>
                {heroPick.playerName}
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: isWinner ? '#92400E' : '#16A34A',
                animation: 'fadeUp 0.4s ease-out 0.4s both',
              }}>
                {isWinner
                  ? 'Won the tournament'
                  : heroPick.actualPosition
                    ? `Finished ${heroPick.actualPositionTied ? 'T' : ''}${getOrdinal(heroPick.actualPosition)}`
                    : heroPick.performanceStatus === 'cut'
                      ? 'Missed the cut'
                      : heroPick.performanceStatus === 'withdrawn'
                        ? 'Withdrawn'
                        : 'Did not finish'
                }
              </div>
            </div>

            {/* Score — right-aligned */}
            <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
              <div style={{
                fontSize: 36, fontWeight: 900,
                color: isWinner ? '#D97706' : 'hsl(var(--foreground))',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}>
                {heroPick.score !== null && heroPick.score !== undefined
                  ? heroPick.score > 0 ? `+${heroPick.score}` : `${heroPick.score}`
                  : '—'}
              </div>
              {isWinner && (
                <div style={{
                  fontSize: 9, fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: '#B45309',
                  marginTop: 2,
                }}>
                  Winner
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ALL PICKS TABLE ────────────────────────────────────────── */}
      <div style={{ margin: '0 16px' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1,
          textTransform: 'uppercase' as const,
          color: 'hsl(var(--muted-foreground))',
          marginBottom: 8,
        }}>
          Tournament Intelligence · Our Picks
        </div>

        <div style={{
          overflow: 'hidden',
        }}>
          {sorted.map((pick, idx) => {
            const pickIsWinner = pick.actualPosition === 1;
            const posColor = getPositionColor(pick.actualPosition);

            return (
              <div
                key={pick.playerId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  borderBottom: idx < sorted.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  animation: `fadeUp 0.35s ease-out ${0.4 + idx * 0.07}s both`,
                }}
              >
                {/* Pick rank */}
                <span style={{
                  width: 22, textAlign: 'center' as const,
                  fontSize: 11, fontWeight: 600,
                  color: 'hsl(var(--muted-foreground))',
                  flexShrink: 0,
                }}>
                  #{pick.predictedRank}
                </span>

                {/* Player name */}
                <span style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: pickIsWinner ? 700 : 500,
                  color: 'hsl(var(--foreground))',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                }}>
                  {pick.playerName}
                </span>

                {/* Score to par */}
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: 'hsl(var(--muted-foreground))',
                  flexShrink: 0,
                }}>
                  {formatScore(pick.score)}
                </span>

                {/* Actual position */}
                <span style={{
                  fontSize: 15, fontWeight: 800,
                  color: posColor,
                  minWidth: 28, textAlign: 'right' as const,
                  flexShrink: 0,
                }}>
                  {pickIsWinner
                    ? '🏆'
                    : pick.actualPosition
                      ? `${pick.actualPositionTied ? 'T' : ''}${pick.actualPosition}`
                      : pick.performanceStatus === 'cut'
                        ? 'MC'
                        : pick.performanceStatus === 'withdrawn'
                          ? 'WD'
                          : '—'
                  }
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
