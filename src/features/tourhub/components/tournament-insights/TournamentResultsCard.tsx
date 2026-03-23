/**
 * TournamentResultsCard — Cinematic results card for Tournament Intelligence.
 * Light-mode adaptation of TournamentResultCard from the Clubhouse feed.
 * Zones: Hero | AI Narrative | Leaderboard (5 rows) | Stats | CTA
 */

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatScoreDisplay(scoreToPar: number | null): string {
  if (scoreToPar === null || scoreToPar === undefined) return 'E';
  if (scoreToPar === 0) return 'E';
  return scoreToPar < 0 ? String(scoreToPar) : `+${scoreToPar}`;
}

// Client-side narrative fallback — mirrors logic in TournamentResultCard.tsx.
// Used only when event_winners.narrative AND event_winners.headline are both null.
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

// ─── Keyframes ───────────────────────────────────────────────────────────────

const STYLE_ID = 'tric-keyframes';
function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes tric-fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes tric-fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes tric-slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  `;
  document.head.appendChild(s);
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
  useEffect(() => { ensureKeyframes(); }, []);

  // ── Data fetches ──────────────────────────────────────────────────────────
  const { data: winner, isLoading: winnerLoading } = useEventWinner(tournamentId);
  const { data: top5 = [] } = useTop5Leaderboard(tournamentId);

  // If event_winners is empty, synthesise a winner object from sr_leaderboards position 1
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

  const { data: tStats } = useWinnerScorecardStats(
    tournamentId, effectiveWinner?.player_id
  );
  const { data: sStats } = useWinnerSeasonStats(effectiveWinner?.player_id);
  const venueQuery = useVenueImage(courseName, null);
  const venueImageUrl = venueQuery.data?.imageUrl;

  // ── Derived values ────────────────────────────────────────────────────────
  const winnerName = effectiveWinner?.player?.full_name ?? '';
  const scoreDisplay = (effectiveWinner as any)?._scoreDisplayOverride
    ?? formatScoreDisplay(effectiveWinner?.score_to_par ?? null);
  const marginText = effectiveWinner?.is_playoff
    ? 'Playoff'
    : effectiveWinner?.margin === 1 ? 'Won by 1 stroke'
    : effectiveWinner?.margin ? `Won by ${effectiveWinner.margin} strokes`
    : '';

  // Player headshot — always use R2 via getPlayerHeadshotUrl, fallback to silhouette
  const winnerPhoto = (winnerName ? getPlayerHeadshotUrl(winnerName, 'pga') : null)
    ?? PLAYER_SILHOUETTE_URL;

  // Hero background: player headshot with venue image as img onError fallback
  const heroFallback = venueImageUrl ?? PLAYER_SILHOUETTE_URL;

  // AI Narrative — DB narrative first, then DB headline, then generated
  const narrative = useMemo(() => {
    if (effectiveWinner?.narrative) return effectiveWinner.narrative;
    if (effectiveWinner?.headline && !effectiveWinner.headline.includes('Champion crowned'))
      return effectiveWinner.headline;
    // Client-side fallback from available stats
    return generateFallbackNarrative(
      winnerName,
      scoreDisplay,
      tStats?.birdies,
      tStats?.bogeys,
      sStats?.puttingAverage,
      sStats?.drivingDistance,
      marginText,
    );
  }, [effectiveWinner, winnerName, scoreDisplay, tStats, sStats, marginText]);

  // Leaderboard: winner row (from event_winners) + rows 2–5 (from sr_leaderboards)
  // top5[0] is position 1 (confirmed winner), top5[1..4] are positions 2–5
  const podiumRows = top5.slice(1, 5); // positions 2–5 max

  // ── Loading skeleton ──────────────────────────────────────────────────────
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
      style={{ paddingBottom: 8, marginTop: -20 }}
    >
      {/* ── WINNER HERO — split layout ─────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'visible', minHeight: 280, zIndex: 1 }}>

        {/* Player portrait — right side, full bleed, behind everything */}
        <div style={{
          position: 'absolute', top: 0, right: -16,
          width: '60%', height: '100%',
          zIndex: 0,
        }}>
          <img
            src={winnerPhoto}
            alt={winnerName}
            onError={e => { (e.target as HTMLImageElement).src = heroFallback; }}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: '50% 8%',
              display: 'block',
            }}
          />
        </div>

        {/* Winner info — anchored top left */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '58%',
          padding: '28px 12px 0 16px',
          zIndex: 2,
        }}>

          {/* Eyebrow — course name in amber */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1.8,
            textTransform: 'uppercase' as const,
            color: 'hsl(var(--accent-amber))',
            marginBottom: 3, lineHeight: 1,
          }}>
            {courseName}
          </div>

          {/* Tournament name */}
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: 'hsl(var(--muted-foreground))',
            lineHeight: 1.3, marginBottom: 5,
          }}>
            {tournamentName}
          </div>

          {/* Winner name */}
          <div style={{
            fontSize: 26, fontWeight: 900,
            color: 'hsl(var(--foreground))',
            letterSpacing: -0.8, lineHeight: 1.05,
            marginBottom: 6,
          }}>
            {winnerName}
          </div>

          {/* Score */}
          <div style={{
            fontSize: 40, fontWeight: 900,
            color: 'hsl(var(--accent-amber))',
            letterSpacing: -2, lineHeight: 1,
            marginBottom: 8,
          }}>
            {scoreDisplay}
          </div>

        </div>
      </div>

      {/* ── STATS GRID ──────────────────────────────────────────────── */}
      {(tStats || sStats) && (
        <div style={{
          padding: '14px 16px 6px',
          marginTop: -28,
          position: 'relative',
          zIndex: 4,
        }}>

          {/* Row 1 — Scorecard stats */}
          {tStats && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
              marginBottom: 6,
            }}>
              {([
                { v: tStats.eagles,   label: 'Eagles',  num: '#F59E0B', bg: 'rgba(245,158,11,0.10)'  },
                { v: tStats.birdies,  label: 'Birdies', num: '#16A34A', bg: 'rgba(22,163,74,0.09)'   },
                { v: tStats.pars,     label: 'Pars',    num: 'hsl(var(--foreground))', bg: 'rgba(0,0,0,0.04)'  },
                { v: tStats.bogeys,   label: 'Bogeys',  num: '#DC2626', bg: 'rgba(220,38,38,0.08)'   },
              ] as const).map(s => (
                <div key={s.label} style={{
                  textAlign: 'center' as const,
                  padding: '9px 4px 7px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.75)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.num, lineHeight: 1 }}>
                    {s.v ?? 0}
                  </div>
                  <div style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
                    textTransform: 'uppercase' as const,
                    color: 'hsl(var(--muted-foreground))',
                    marginTop: 3,
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Row 2 — Season performance stats */}
          {sStats && (sStats.drivingDistance || sStats.greensInReg || sStats.puttingAverage) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${[sStats.drivingDistance, sStats.greensInReg, sStats.puttingAverage].filter(Boolean).length}, 1fr)`,
              gap: 6, marginBottom: 8,
            }}>
              {sStats.drivingDistance && (
                <div style={{ textAlign: 'center' as const, padding: '9px 4px 7px', borderRadius: 12, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.75)', boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'hsl(var(--foreground))', lineHeight: 1 }}>
                    {Math.round(sStats.drivingDistance)}<span style={{ fontSize: 9, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>yds</span>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>Driver</div>
                </div>
              )}
              {sStats.greensInReg && (
                <div style={{ textAlign: 'center' as const, padding: '9px 4px 7px', borderRadius: 12, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.75)', boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'hsl(var(--foreground))', lineHeight: 1 }}>
                    {Math.round(sStats.greensInReg)}<span style={{ fontSize: 9, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>%</span>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>GIR</div>
                </div>
              )}
              {sStats.puttingAverage && (
                <div style={{ textAlign: 'center' as const, padding: '9px 4px 7px', borderRadius: 12, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.75)', boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'hsl(var(--foreground))', lineHeight: 1 }}>
                    {sStats.puttingAverage.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>Putts/hole</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── AI NARRATIVE ────────────────────────────────────────────── */}
      {narrative && (
        <div style={{ padding: '4px 16px 14px', textAlign: 'center' }}>
          <p style={{
            fontSize: 13, lineHeight: 1.6,
            fontStyle: 'normal',
            fontWeight: 500,
            color: 'hsl(var(--foreground))',
            margin: 0,
          }}>
            {narrative}
          </p>
        </div>
      )}

      {/* ── DIVIDER ─────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: 'hsl(var(--border))', margin: '0' }} />

      {/* ── CLBHOUZ CALLED IT ───────────────────────────────────────── */}
      {allPicks && allPicks.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.015)',
          borderTop: '1px solid hsl(var(--border))',
          borderBottom: '1px solid hsl(var(--border))',
        }}>
          <ClubhouzCalledItSection allPicks={allPicks} tourSlug={tourSlug} />
        </div>
      )}

    </motion.div>
  );
}
