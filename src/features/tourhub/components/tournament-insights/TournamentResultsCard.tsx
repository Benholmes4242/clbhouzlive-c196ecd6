/**
 * TournamentResultsCard — Dark cinematic results card matching live state design language.
 * Sections: Header | Winner Block | Sparkline | Stats Grid | Leaderboard | AI Narrative | CTA
 */

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEventWinner } from '../../hooks/useEventWinner';
import { useWinnerScorecardStats } from '../../hooks/useWinnerScorecardStats';
import { useWinnerSeasonStats } from '../../hooks/useWinnerSeasonStats';
import { useWinnerRoundScores } from '../../hooks/useWinnerRoundScores';
import { useTop5Leaderboard } from '../../hooks/useTop5Leaderboard';
import { useVenueImage } from '../../hooks/useVenueImage';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ClubhouzCalledItSection } from './ClubhouzCalledItSection';
import CountryFlag from '@/components/ui/country-flag';
import type { TrackedPrediction } from './types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface TournamentResultsCardProps {
  tournamentId: string;
  tournamentName: string;
  courseName: string;
  location?: string;
  allPicks?: TrackedPrediction[];
  tourSlug?: string;
}

// ─── Design tokens ───────────────────────────────────────────────────────────

const C = {
  bg: '#0d1421',
  white: '#ffffff',
  muted: 'rgba(255,255,255,0.45)',
  mutedLight: 'rgba(255,255,255,0.4)',
  mutedDim: 'rgba(255,255,255,0.3)',
  mutedFaint: 'rgba(255,255,255,0.25)',
  amber: '#F7931E',
  green: '#22c55e',
  red: '#ef4444',
  redDark: '#dc2626',
  divider: 'rgba(255,255,255,0.06)',
  chipBg: 'rgba(255,255,255,0.04)',
  chipBorder: 'rgba(255,255,255,0.07)',
  rowBorder: 'rgba(255,255,255,0.05)',
  chipSurfaceBg: 'rgba(255,255,255,0.06)',
  chipSurfaceBorder: 'rgba(255,255,255,0.08)',
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatScoreDisplay(scoreToPar: number | null): string {
  if (scoreToPar === null || scoreToPar === undefined) return 'E';
  if (scoreToPar === 0) return 'E';
  return scoreToPar < 0 ? String(scoreToPar) : `+${scoreToPar}`;
}

function roundScoreColor(score: number | null): string {
  if (score === null) return C.muted;
  if (score < 0) return C.green;
  if (score > 0) return C.red;
  return 'rgba(255,255,255,0.5)';
}

function formatRoundScore(score: number | null): string {
  if (score === null) return '—';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

function generateFallbackNarrative(
  winnerName: string,
  scoreDisplay: string,
  birdies?: number | null,
  bogeys?: number | null,
  putts?: number | null,
  driving?: number | null,
  marginText?: string,
): string {
  const last = winnerName.split(' ').pop() ?? winnerName;
  if (marginText?.toLowerCase().includes('playoff'))
    return `${last} refused to lose. The playoff proved what the final leaderboard couldn't — composure under fire.`;
  if (birdies != null && birdies >= 20)
    return `${last}'s ${birdies}-birdie week at ${scoreDisplay} was a masterclass in attacking golf.`;
  if (bogeys != null && bogeys <= 3 && birdies != null && birdies >= 15)
    return `Just ${bogeys} bogey${bogeys === 1 ? '' : 's'} all week. ${last}'s ${scoreDisplay} was built on relentless consistency.`;
  if (putts != null && putts < 1.6)
    return `${last} averaged just ${putts.toFixed(2)} putts per hole — the putter was the weapon that unlocked ${scoreDisplay}.`;
  if (driving != null && driving >= 320)
    return `${last}'s ${driving}-yard average off the tee gave the field no answer. Bombed to ${scoreDisplay}.`;
  if (birdies != null)
    return `${last} fired ${birdies} birdies en route to ${scoreDisplay}. The rest of the field never found an answer.`;
  return `${last} wins at ${scoreDisplay}. The conversation starts now.`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TournamentResultsCard({
  tournamentId,
  tournamentName,
  courseName,
  location,
  allPicks,
  tourSlug,
}: TournamentResultsCardProps) {
  const navigate = useNavigate();

  // ── Data fetches ──────────────────────────────────────────────────────────
  const { data: winner, isLoading: winnerLoading } = useEventWinner(tournamentId);
  const { data: top5 = [] } = useTop5Leaderboard(tournamentId);

  const effectiveWinner = useMemo(() => {
    if (winner) return winner;
    const pos1 = top5[0];
    if (!pos1) return null;
    return {
      player_id: pos1.playerId,
      score_to_par: null as number | null,
      margin: null as number | null,
      is_playoff: false,
      headline: null as string | null,
      narrative: null as string | null,
      player: {
        id: pos1.playerId,
        full_name: pos1.playerName,
        country: null,
        photo_url: pos1.photoUrl,
      },
      _scoreDisplayOverride: pos1.scoreDisplay,
    };
  }, [winner, top5]);

  const { data: tStats } = useWinnerScorecardStats(tournamentId, effectiveWinner?.player_id);
  const { data: sStats } = useWinnerSeasonStats(effectiveWinner?.player_id);
  const { data: roundScores } = useWinnerRoundScores(tournamentId, effectiveWinner?.player_id);
  const venueQuery = useVenueImage(courseName, null);

  // ── Derived values ────────────────────────────────────────────────────────
  const winnerName = effectiveWinner?.player?.full_name ?? '';
  const winnerCountry = effectiveWinner?.player?.country ?? '';
  const scoreDisplay = (effectiveWinner as any)?._scoreDisplayOverride
    ?? formatScoreDisplay(effectiveWinner?.score_to_par ?? null);
  const marginText = effectiveWinner?.is_playoff
    ? 'Playoff'
    : effectiveWinner?.margin === 1 ? '1 stroke'
    : effectiveWinner?.margin ? `${effectiveWinner.margin} strokes`
    : '';

  const winnerPhoto = (winnerName ? getPlayerHeadshotUrl(winnerName, 'pga') : null)
    ?? PLAYER_SILHOUETTE_URL;

  const narrative = useMemo(() => {
    if (effectiveWinner?.narrative) return effectiveWinner.narrative;
    if (effectiveWinner?.headline && !effectiveWinner.headline.includes('Champion crowned'))
      return effectiveWinner.headline;
    return generateFallbackNarrative(
      winnerName, scoreDisplay,
      tStats?.birdies, tStats?.bogeys,
      sStats?.puttingAverage, sStats?.drivingDistance,
      marginText,
    );
  }, [effectiveWinner, winnerName, scoreDisplay, tStats, sStats, marginText]);

  const podiumRows = top5.slice(1, 5); // positions 2–5

  // Round scores for chips & sparkline
  const r1 = roundScores?.round_1 ?? null;
  const r2 = roundScores?.round_2 ?? null;
  const r3 = roundScores?.round_3 ?? null;
  const r4 = roundScores?.round_4 ?? null;
  const hasRoundScores = r1 !== null || r2 !== null || r3 !== null || r4 !== null;

  // Cumulative scores for sparkline
  const cumulativeScores = useMemo(() => {
    if (!hasRoundScores) return null;
    const rounds = [r1, r2, r3, r4];
    const cumulative: number[] = [];
    let total = 0;
    for (const r of rounds) {
      if (r === null) break;
      total += r;
      cumulative.push(total);
    }
    return cumulative.length >= 2 ? cumulative : null;
  }, [r1, r2, r3, r4, hasRoundScores]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (winnerLoading && top5.length === 0) {
    return (
      <div style={{ background: C.bg, borderRadius: 16, overflow: 'hidden' }}>
        {[200, 140, 80, 60].map((h, i) => (
          <div key={i} style={{
            height: h, background: 'rgba(255,255,255,0.04)',
            margin: '8px 16px', borderRadius: 12,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    );
  }

  if (!effectiveWinner) {
    return (
      <div style={{ background: C.bg, borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: C.mutedLight }}>Results not yet available.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: C.bg, borderRadius: 16, overflow: 'hidden', paddingBottom: 0 }}
    >
      {/* ═══ SECTION 1 — TOURNAMENT HEADER ═══ */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.white, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 4 }}>
            {tournamentName}
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.3 }}>
            {courseName}{location ? ` · ${location}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <div style={{ fontSize: 12, color: C.mutedLight, marginBottom: 4 }}>Final Round</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.amber }}>
            🏆 FINAL
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.divider, margin: '14px 20px' }} />

      {/* ═══ SECTION 2 — WINNER BLOCK ═══ */}
      <div style={{ padding: '0 20px' }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
            🏆 CHAMPION
          </span>
          {winnerCountry && <CountryFlag country={winnerCountry} size="sm" />}
        </div>

        {/* Leader row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{ background: 'rgba(247,147,30,0.15)', border: '1.5px solid rgba(247,147,30,0.3)', borderRadius: '34%', overflow: 'hidden', flexShrink: 0 }}>
            <SquircleAvatar
              size="md"
              src={winnerPhoto}
              alt={winnerName}
              hideRing
              fallback={winnerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            />
          </div>

          {/* Name + subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {winnerName}
            </div>
            <div style={{ fontSize: 12, color: C.mutedLight, marginTop: 3 }}>
              72 Holes · {courseName}
            </div>
          </div>

          {/* Score */}
          <div style={{ fontSize: 52, fontWeight: 900, color: C.white, letterSpacing: '-0.04em', lineHeight: 1, flexShrink: 0 }}>
            {scoreDisplay}
          </div>
        </div>

        {/* Round chips row */}
        {hasRoundScores && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[
              { label: 'R1', value: r1 },
              { label: 'R2', value: r2 },
              { label: 'R3', value: r3 },
              { label: 'R4', value: r4, isR4: true },
            ].map((chip) => (
              <div
                key={chip.label}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: chip.isR4 ? 'rgba(247,147,30,0.12)' : C.chipSurfaceBg,
                  border: `1px solid ${chip.isR4 ? 'rgba(247,147,30,0.3)' : C.chipSurfaceBorder}`,
                  borderRadius: 8, padding: '5px 10px', minWidth: 44,
                }}
              >
                <span style={{ fontSize: 9, color: C.mutedLight, fontWeight: 600, letterSpacing: '0.06em' }}>
                  {chip.label}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 800,
                  color: chip.isR4 ? C.amber : roundScoreColor(chip.value),
                }}>
                  {formatRoundScore(chip.value)}
                </span>
              </div>
            ))}

            {/* Margin chip */}
            {marginText && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: C.chipSurfaceBg,
                border: `1px solid ${C.chipSurfaceBorder}`,
                borderRadius: 8, padding: '5px 10px', minWidth: 44,
              }}>
                <span style={{ fontSize: 11, color: C.mutedLight }}>
                  {marginText}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ SECTION 3 — SCORE PROGRESSION SPARKLINE ═══ */}
      {cumulativeScores && (
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.mutedDim,
            letterSpacing: '0.1em', textTransform: 'uppercase' as const,
            marginBottom: 8,
          }}>
            Tournament · Score Progression
          </div>
          <SparklineChart scores={cumulativeScores} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {['R1', 'R2', 'R3', 'R4'].slice(0, cumulativeScores.length).map(label => (
              <span key={label} style={{ fontSize: 9, color: C.mutedFaint }}>{label}</span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SECTION 4 — SCORECARD STATS GRID ═══ */}
      {tStats && (
        <div style={{ padding: '0 20px', marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {([
              { v: tStats.eagles,       label: 'Eagles',  color: C.amber },
              { v: tStats.birdies,      label: 'Birdies', color: C.green },
              { v: tStats.pars,         label: 'Pars',    color: C.muted },
              { v: tStats.bogeys,       label: 'Bogeys',  color: C.red },
              { v: tStats.doubleBogeys, label: 'Doubles', color: C.redDark },
            ] as const).map(s => (
              <div key={s.label} style={{
                background: C.chipBg,
                border: `1px solid ${C.chipBorder}`,
                borderRadius: 10, padding: '9px 4px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                  {s.v ?? 0}
                </div>
                <div style={{
                  fontSize: 8, fontWeight: 700, color: C.mutedDim,
                  letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: 4,
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: C.divider, margin: '0 20px' }} />

      {/* ═══ SECTION 5 — FINAL LEADERBOARD ═══ */}
      {podiumRows.length > 0 && (
        <div style={{ padding: '12px 20px' }}>
          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 8, borderBottom: `1px solid ${C.divider}` }}>
            <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: C.mutedFaint, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
              PLAYER
            </span>
            <span style={{ width: 50, textAlign: 'right', fontSize: 10, fontWeight: 700, color: C.mutedFaint, letterSpacing: '0.1em' }}>
              TOTAL
            </span>
            <span style={{ width: 36, textAlign: 'right', fontSize: 10, fontWeight: 700, color: C.mutedFaint, letterSpacing: '0.1em' }}>
              THRU
            </span>
          </div>

          {podiumRows.map((row, i) => {
            const photo = getPlayerHeadshotUrl(row.playerName, 'pga') ?? PLAYER_SILHOUETTE_URL;
            return (
              <div
                key={row.playerId}
                style={{
                  display: 'flex', alignItems: 'center', padding: '11px 0',
                  borderBottom: i < podiumRows.length - 1 ? `1px solid ${C.rowBorder}` : 'none',
                }}
              >
                {/* Position */}
                <span style={{ fontSize: 12, fontWeight: 700, color: C.mutedFaint, width: 28, flexShrink: 0 }}>
                  {row.isTied ? 'T' : ''}{row.position}
                </span>
                {/* Avatar */}
                <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, marginRight: 10 }}>
                  <SquircleAvatar
                    size="sm"
                    src={photo}
                    alt={row.playerName}
                    hideRing
                    fallback={row.playerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  />
                </div>
                {/* Name */}
                <span style={{
                  flex: 1, fontSize: 14, fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {row.playerName}
                </span>
                {/* Total */}
                <span style={{ width: 50, textAlign: 'right', fontSize: 15, fontWeight: 800, color: C.amber }}>
                  {row.scoreDisplay}
                </span>
                {/* Thru */}
                <span style={{ width: 36, textAlign: 'right', fontSize: 12, color: C.mutedDim }}>
                  F
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ SECTION 6 — AI NARRATIVE BLOCK ═══ */}
      {narrative && (
        <div style={{
          background: 'rgba(247,147,30,0.06)',
          border: '1px solid rgba(247,147,30,0.15)',
          borderRadius: 12, padding: 14,
          margin: '12px 20px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.amber,
            letterSpacing: '0.1em', textTransform: 'uppercase' as const,
            marginBottom: 8,
          }}>
            ⚡ AI Recap
          </div>
          <p style={{
            fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.6)',
            fontStyle: 'italic', margin: 0,
          }}>
            {narrative}
          </p>
        </div>
      )}

      {/* ═══ SECTION 7 — CTA ═══ */}
      <div style={{ padding: '0 20px 16px' }}>
        <button
          onClick={() => navigate(`/tourhub/tournament/${tournamentId}`)}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: 13,
            fontSize: 13, fontWeight: 700,
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
          }}
        >
          Final Leaderboard →
        </button>
      </div>

      {/* ═══ SECTION 8 — CLBHOUZ CALLED IT ═══ */}
      {allPicks && allPicks.length > 0 && (
        <ClubhouzCalledItSection allPicks={allPicks} tourSlug={tourSlug} />
      )}
    </motion.div>
  );
}

// ─── Sparkline SVG ───────────────────────────────────────────────────────────

function SparklineChart({ scores }: { scores: number[] }) {
  const width = 320;
  const height = 56;
  const padX = 4;
  const padY = 6;

  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const points = scores.map((s, i) => {
    const x = padX + (i / (scores.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (s - min) / range) * (height - padY * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 56, display: 'block' }}>
      <defs>
        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(247,147,30,0.18)" />
          <stop offset="100%" stopColor="rgba(247,147,30,0)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkline-fill)" />
      <path d={linePath} fill="none" stroke={C.amber} strokeWidth={1.5} opacity={0.7} />
      <circle cx={lastPoint.x} cy={lastPoint.y} r={3.5} fill={C.amber} />
    </svg>
  );
}
