/**
 * TournamentResultsCard — Dark cinematic results card matching live state design.
 * Zones: Header | Winner Block | Sparkline | Stats Grid | Leaderboard | AI Narrative | CTA | Called It
 */

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEventWinner } from '../../hooks/useEventWinner';
import { useWinnerScorecardStats } from '../../hooks/useWinnerScorecardStats';
import { useWinnerSeasonStats } from '../../hooks/useWinnerSeasonStats';
import { useTop5Leaderboard } from '../../hooks/useTop5Leaderboard';
import { useVenueImage } from '../../hooks/useVenueImage';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ClubhouzCalledItSection } from './ClubhouzCalledItSection';
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

const DK = {
  bg: '#0d1421',
  text: '#ffffff',
  muted: 'rgba(255,255,255,0.45)',
  mutedLight: 'rgba(255,255,255,0.4)',
  mutedFaint: 'rgba(255,255,255,0.3)',
  mutedGhost: 'rgba(255,255,255,0.25)',
  amber: '#F7931E',
  green: '#22c55e',
  red: '#ef4444',
  redDark: '#dc2626',
  divider: 'rgba(255,255,255,0.06)',
  chipBg: 'rgba(255,255,255,0.04)',
  chipBorder: 'rgba(255,255,255,0.07)',
  chipBgLight: 'rgba(255,255,255,0.06)',
  chipBorderLight: 'rgba(255,255,255,0.08)',
  rowBorder: 'rgba(255,255,255,0.05)',
  avatarBg: 'rgba(255,255,255,0.07)',
  avatarBorder: 'rgba(255,255,255,0.08)',
  amberBg: 'rgba(247,147,30,0.15)',
  amberBorder: 'rgba(247,147,30,0.3)',
  amberChipBg: 'rgba(247,147,30,0.12)',
  amberNarrativeBg: 'rgba(247,147,30,0.06)',
  amberNarrativeBorder: 'rgba(247,147,30,0.15)',
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatScoreDisplay(scoreToPar: number | null): string {
  if (scoreToPar === null || scoreToPar === undefined) return 'E';
  if (scoreToPar === 0) return 'E';
  return scoreToPar < 0 ? String(scoreToPar) : `+${scoreToPar}`;
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

function roundScoreColor(score: number | null, par = 72): string {
  if (score === null) return DK.muted;
  const diff = score - par;
  if (diff < 0) return DK.green;
  if (diff > 0) return DK.red;
  return 'rgba(255,255,255,0.5)';
}

// ─── Hook: fetch winner round scores from sr_leaderboards ────────────────────

function useWinnerRoundScores(tournamentId: string | undefined, playerId: string | undefined) {
  return useQuery({
    queryKey: ['winner-round-scores', tournamentId, playerId],
    queryFn: async () => {
      if (!tournamentId || !playerId) return null;
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select('round_1, round_2, round_3, round_4')
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)
        .maybeSingle();
      if (error || !data) return null;
      return {
        r1: (data as any).round_1 as number | null,
        r2: (data as any).round_2 as number | null,
        r3: (data as any).round_3 as number | null,
        r4: (data as any).round_4 as number | null,
      };
    },
    enabled: !!tournamentId && !!playerId,
    staleTime: 60_000,
  });
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
  const scoreDisplay = (effectiveWinner as any)?._scoreDisplayOverride
    ?? formatScoreDisplay(effectiveWinner?.score_to_par ?? null);
  const marginText = effectiveWinner?.is_playoff
    ? 'Playoff'
    : effectiveWinner?.margin === 1 ? '1 stroke'
    : effectiveWinner?.margin ? `${effectiveWinner.margin} strokes`
    : '';

  const winnerPhoto = (winnerName ? getPlayerHeadshotUrl(winnerName, 'pga') : null)
    ?? PLAYER_SILHOUETTE_URL;

  const winnerInitials = winnerName.split(' ').map(n => n[0]).join('').slice(0, 2);

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

  const venueName = courseName || 'Course';

  // Sparkline data
  const sparklineData = useMemo(() => {
    if (!roundScores) return null;
    const rounds = [roundScores.r1, roundScores.r2, roundScores.r3, roundScores.r4];
    const valid = rounds.filter((r): r is number => r !== null);
    if (valid.length < 2) return null;
    // cumulative score-to-par (assuming par 72)
    let cumulative = 0;
    const points = valid.map(r => {
      cumulative += (r - 72);
      return cumulative;
    });
    return { points, labels: valid.map((_, i) => `R${i + 1}`) };
  }, [roundScores]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (winnerLoading && top5.length === 0) {
    return (
      <div style={{ background: DK.bg, borderRadius: 16, overflow: 'hidden' }}>
        {[200, 140, 80, 60].map((h, i) => (
          <div key={i} style={{ height: h, background: DK.chipBg, margin: '8px 16px', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    );
  }

  if (!effectiveWinner) {
    return (
      <div style={{ background: DK.bg, borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: DK.mutedLight }}>Results not yet available.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: DK.bg, borderRadius: 16, overflow: 'hidden', paddingBottom: 0 }}
    >
      {/* ═══ SECTION 1 — TOURNAMENT HEADER ═══ */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: DK.text, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {tournamentName}
            </div>
            <div style={{ fontSize: 13, color: DK.muted, marginTop: 4 }}>
              {courseName}{location ? ` · ${location}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
            <div style={{ fontSize: 12, color: DK.mutedLight }}>Final Round</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: DK.amber, marginTop: 2 }}>
              🏆 FINAL
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: DK.divider, margin: '16px 20px 0' }} />

      {/* ═══ SECTION 2 — WINNER BLOCK ═══ */}
      <div style={{ padding: '16px 20px' }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: DK.amber, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            🏆 CHAMPION
          </span>
          {effectiveWinner?.player?.country && (
            <span style={{ fontSize: 13 }}>
              {/* Country shown as text since we're on dark bg */}
            </span>
          )}
        </div>

        {/* Leader row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <SquircleAvatar
            size={56}
            src={winnerPhoto}
            alt={winnerName}
            fallback={winnerInitials}
            ringColor={DK.amber}
          />

          {/* Name + subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: DK.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {winnerName}
            </div>
            <div style={{ fontSize: 12, color: DK.mutedLight, marginTop: 3 }}>
              72 Holes · {venueName}
            </div>
          </div>

          {/* Score */}
          <div style={{ fontSize: 52, fontWeight: 900, color: DK.text, letterSpacing: '-0.04em', lineHeight: 1, flexShrink: 0 }}>
            {scoreDisplay}
          </div>
        </div>

        {/* Round chips row */}
        {roundScores && (
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            {([
              { label: 'R1', value: roundScores.r1, isR4: false },
              { label: 'R2', value: roundScores.r2, isR4: false },
              { label: 'R3', value: roundScores.r3, isR4: false },
              { label: 'R4', value: roundScores.r4, isR4: true },
            ] as const).map(chip => (
              <div key={chip.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: chip.isR4 ? DK.amberChipBg : DK.chipBgLight,
                border: `1px solid ${chip.isR4 ? DK.amberBorder : DK.chipBorderLight}`,
                borderRadius: 8, padding: '5px 10px', minWidth: 44,
              }}>
                <span style={{ fontSize: 9, color: DK.mutedLight, fontWeight: 600, letterSpacing: '0.06em' }}>
                  {chip.label}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 800,
                  color: chip.isR4 ? DK.amber : (chip.value !== null ? roundScoreColor(chip.value) : DK.muted),
                }}>
                  {chip.value ?? '—'}
                </span>
              </div>
            ))}
            {/* Margin chip */}
            {marginText && (
              <div style={{
                display: 'flex', alignItems: 'center',
                background: DK.chipBgLight, border: `1px solid ${DK.chipBorderLight}`,
                borderRadius: 8, padding: '5px 10px',
              }}>
                <span style={{ fontSize: 11, color: DK.mutedLight }}>
                  {marginText}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ SECTION 3 — SCORE PROGRESSION SPARKLINE ═══ */}
      {sparklineData && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: DK.mutedFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Tournament · Score Progression
          </div>
          <svg width="100%" height="56" viewBox="0 0 300 56" preserveAspectRatio="none" style={{ display: 'block' }}>
            {(() => {
              const pts = sparklineData.points;
              const n = pts.length;
              const minV = Math.min(...pts, 0);
              const maxV = Math.max(...pts, 0);
              const range = maxV - minV || 1;
              const padY = 6;
              const h = 56 - padY * 2;
              const coords = pts.map((v, i) => ({
                x: (i / (n - 1)) * 280 + 10,
                y: padY + h - ((v - minV) / range) * h,
              }));
              const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
              const areaPath = `${linePath} L${coords[coords.length - 1].x},${56} L${coords[0].x},${56} Z`;
              const lastPt = coords[coords.length - 1];
              return (
                <>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(247,147,30,0.18)" />
                      <stop offset="100%" stopColor="rgba(247,147,30,0)" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#sparkGrad)" />
                  <path d={linePath} fill="none" stroke={DK.amber} strokeWidth="1.5" opacity="0.7" />
                  <circle cx={lastPt.x} cy={lastPt.y} r="3.5" fill={DK.amber} />
                </>
              );
            })()}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px 0' }}>
            {sparklineData.labels.map(l => (
              <span key={l} style={{ fontSize: 9, color: DK.mutedGhost }}>{l}</span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SECTION 4 — SCORECARD STATS GRID ═══ */}
      {tStats && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {([
              { v: tStats.eagles, label: 'Eagles', color: DK.amber },
              { v: tStats.birdies, label: 'Birdies', color: DK.green },
              { v: tStats.pars, label: 'Pars', color: DK.muted },
              { v: tStats.bogeys, label: 'Bogeys', color: DK.red },
              { v: tStats.doubleBogeys, label: 'Doubles', color: DK.redDark },
            ] as const).map(s => (
              <div key={s.label} style={{
                background: DK.chipBg, border: `1px solid ${DK.chipBorder}`,
                borderRadius: 10, padding: '9px 4px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                  {s.v ?? 0}
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, color: DK.mutedFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 1, background: DK.divider, margin: '0 20px' }} />

      {/* ═══ SECTION 5 — FINAL LEADERBOARD ═══ */}
      {podiumRows.length > 0 && (
        <div style={{ padding: '16px 20px' }}>
          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 8, borderBottom: `1px solid ${DK.divider}` }}>
            <span style={{ width: 28, fontSize: 10, fontWeight: 700, color: DK.mutedGhost, letterSpacing: '0.1em', textTransform: 'uppercase' }}>#</span>
            <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: DK.mutedGhost, letterSpacing: '0.1em', textTransform: 'uppercase' }}>PLAYER</span>
            <span style={{ width: 50, textAlign: 'right', fontSize: 10, fontWeight: 700, color: DK.mutedGhost, letterSpacing: '0.1em', textTransform: 'uppercase' }}>TOTAL</span>
            <span style={{ width: 36, textAlign: 'right', fontSize: 10, fontWeight: 700, color: DK.mutedGhost, letterSpacing: '0.1em', textTransform: 'uppercase' }}>THRU</span>
          </div>

          {/* Rows */}
          {podiumRows.map((entry, i) => {
            const photo = getPlayerHeadshotUrl(entry.playerName, 'pga') ?? PLAYER_SILHOUETTE_URL;
            const initials = entry.playerName.split(' ').map(n => n[0]).join('').slice(0, 2);
            const pos = entry.isTied ? `T${entry.position}` : `${entry.position}`;
            return (
              <div
                key={entry.playerId}
                style={{
                  display: 'flex', alignItems: 'center', padding: '11px 0',
                  borderBottom: i < podiumRows.length - 1 ? `1px solid ${DK.rowBorder}` : 'none',
                }}
              >
                <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: DK.mutedGhost, flexShrink: 0 }}>
                  {pos}
                </span>
                <SquircleAvatar
                  size={32}
                  src={photo}
                  alt={entry.playerName}
                  fallback={initials}
                  hideRing
                />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginLeft: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.playerName}
                </span>
                <span style={{ width: 50, textAlign: 'right', fontSize: 15, fontWeight: 800, color: DK.amber, flexShrink: 0 }}>
                  {entry.scoreDisplay}
                </span>
                <span style={{ width: 36, textAlign: 'right', fontSize: 12, color: DK.mutedFaint, flexShrink: 0 }}>
                  F
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ SECTION 6 — AI NARRATIVE ═══ */}
      {narrative && (
        <div style={{ margin: '12px 20px', background: DK.amberNarrativeBg, border: `1px solid ${DK.amberNarrativeBorder}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: DK.amber, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            ⚡ AI Recap
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', margin: 0 }}>
            {narrative}
          </p>
        </div>
      )}

      {/* ═══ SECTION 7 — CTA ═══ */}
      <div style={{ padding: '4px 20px 16px' }}>
        <button
          onClick={() => navigate(`/tourhub/tournament/${tournamentId}`)}
          style={{
            width: '100%', background: DK.chipBgLight,
            border: `1px solid rgba(255,255,255,0.1)`,
            borderRadius: 12, padding: 13, cursor: 'pointer',
            fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
          }}
        >
          Final Leaderboard →
        </button>
      </div>

      {/* ═══ SECTION 8 — CLBHOUZ CALLED IT ═══ */}
      {allPicks && allPicks.length > 0 && (
        <div style={{
          borderTop: `1px solid ${DK.divider}`,
        }}>
          <ClubhouzCalledItSection allPicks={allPicks} tourSlug={tourSlug} />
        </div>
      )}
    </motion.div>
  );
}
