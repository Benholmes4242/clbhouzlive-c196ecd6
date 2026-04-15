/**
 * TournamentResultsCard — Dispatch-style flat ruled results card.
 * Zones: Winner header | Stats grid | Narrative | Called It
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEventWinner } from '../../hooks/useEventWinner';
import { useWinnerScorecardStats } from '../../hooks/useWinnerScorecardStats';
import { useWinnerSeasonStats } from '../../hooks/useWinnerSeasonStats';
import { useTop5Leaderboard } from '../../hooks/useTop5Leaderboard';
import { useVenueImage } from '../../hooks/useVenueImage';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
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
  const venueQuery = useVenueImage(courseName, null);
  const venueImageUrl = venueQuery.data?.imageUrl;

  const winnerName = effectiveWinner?.player?.full_name ?? '';
  const scoreDisplay = (effectiveWinner as any)?._scoreDisplayOverride
    ?? formatScoreDisplay(effectiveWinner?.score_to_par ?? null);
  const marginText = effectiveWinner?.is_playoff
    ? 'Playoff'
    : effectiveWinner?.margin === 1 ? 'Won by 1 stroke'
    : effectiveWinner?.margin ? `Won by ${effectiveWinner.margin} strokes`
    : '';

  const winnerPhoto = (winnerName ? getPlayerHeadshotUrl(winnerName, 'pga') : null)
    ?? PLAYER_SILHOUETTE_URL;
  const heroFallback = venueImageUrl ?? PLAYER_SILHOUETTE_URL;

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

  if (winnerLoading && top5.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border bg-card animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted/40 m-2 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!effectiveWinner) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Results not yet available.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ paddingBottom: 8 }}
    >
      {/* ── WINNER HEADER ── */}
      <div style={{ padding: '14px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Tournament Winner
          </span>
        </div>
      </div>

      {/* ── WINNER BLOCK ── */}
      <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
        {/* Hero row */}
        <div style={{ padding: '15px 16px 13px', borderBottom: '0.5px solid rgba(15,23,42,0.07)', borderLeft: '3px solid #F7931E' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 4 }}>
                {courseName}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>{tournamentName}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 5 }}>
                {winnerName}
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#F7931E', letterSpacing: '-0.05em', lineHeight: 1 }}>
                {scoreDisplay}
              </div>
            </div>

            {/* Headshot — contained squircle */}
            <div style={{ width: 72, height: 72, borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: 'rgba(15,23,42,0.06)' }}>
              <img
                src={winnerPhoto}
                alt={winnerName}
                onError={e => { (e.target as HTMLImageElement).src = heroFallback; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 8%' }}
              />
            </div>
          </div>
        </div>

        {/* Stats — flat 2-col grid */}
        {tStats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {([
              { v: tStats.eagles,  label: 'Eagles',  color: '#F7931E'  },
              { v: tStats.birdies, label: 'Birdies', color: '#16A34A'  },
              { v: tStats.pars,    label: 'Pars',    color: '#0F172A'  },
              { v: tStats.bogeys,  label: 'Bogeys',  color: '#DC2626'  },
            ] as const).map((s, i) => (
              <div key={s.label} style={{
                padding: '10px 16px',
                borderRight: i % 2 === 0 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
                borderBottom: i < 2 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: s.color, minWidth: 26 }}>{s.v ?? 0}</span>
                <span style={{ fontSize: 8.5, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Season stats — 3-col */}
        {sStats && (sStats.drivingDistance || sStats.greensInReg || sStats.puttingAverage) && (
          <div style={{ display: 'flex', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
            {[
              sStats.drivingDistance ? { label: 'Driver',     value: `${Math.round(sStats.drivingDistance)}yds` } : null,
              sStats.greensInReg     ? { label: 'GIR',        value: `${Math.round(sStats.greensInReg)}%`       } : null,
              sStats.puttingAverage  ? { label: 'Putts/Hole', value: sStats.puttingAverage.toFixed(2)           } : null,
            ].filter(Boolean).map((s, i, arr) => (
              <div key={s!.label} style={{ flex: 1, padding: '9px 16px', borderRight: i < arr.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{s!.value}</div>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 2 }}>{s!.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Narrative — centred pull quote */}
        {narrative && (
          <div style={{ padding: '12px 20px', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#475569', margin: 0, lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center' }}>
              "{narrative}"
            </p>
          </div>
        )}
      </div>

      {/* ── CLBHOUZ CALLED IT ── */}
      {allPicks && allPicks.length > 0 && (
        <ClubhouzCalledItSection allPicks={allPicks} tourSlug={tourSlug} />
      )}
    </motion.div>
  );
}
