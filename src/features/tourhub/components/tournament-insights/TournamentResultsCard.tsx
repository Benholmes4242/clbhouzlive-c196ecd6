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

// ─── Props ───────────────────────────────────────────────────────────────────

interface TournamentResultsCardProps {
  tournamentId: string;
  tournamentName: string;
  courseName: string;
  location?: string;
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl overflow-hidden border border-border bg-card"
      style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}
    >

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZONE 1 — WINNER HERO                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        {/* Player headshot background */}
        <img
          src={winnerPhoto}
          alt={winnerName}
          onError={e => { (e.target as HTMLImageElement).src = heroFallback; }}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover', objectPosition: 'top center' }}
        />

        {/* Bottom-to-top gradient for text legibility */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.05) 100%)',
        }} />

        {/* Top vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, transparent 30%)',
        }} />

        {/* LATEST RESULTS pill — top-left */}
        <div style={{
          position: 'absolute', top: 14, left: 14,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          padding: '4px 10px',
          fontSize: 10, fontWeight: 700,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: 1.5,
          textTransform: 'uppercase' as const,
        }}>
          LATEST RESULTS
        </div>

        {/* Winner info overlay — bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 16px 16px',
          animation: 'tric-fadeUp 0.6s ease-out both',
          animationDelay: '0.15s',
        }}>
          {/* Venue eyebrow */}
          {(courseName || location) && (
            <div style={{
              fontSize: 12, color: 'rgba(255,255,255,0.5)',
              marginBottom: 4, letterSpacing: 0.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {[courseName, location].filter(Boolean).join(' · ')}
            </div>
          )}

          {/* Tournament name */}
          <div style={{
            fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.80)',
            marginBottom: 8, lineHeight: 1.3,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {tournamentName}
          </div>

          {/* Winner name + score + margin */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' as const }}>
            <span style={{
              fontSize: 22, fontWeight: 800, color: '#fff',
              lineHeight: 1.1, letterSpacing: -0.5,
            }}>
              {winnerName}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 20, fontWeight: 700,
                color: 'hsl(var(--accent-amber))', lineHeight: 1,
              }}>
                {scoreDisplay}
              </span>
              {marginText && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                  background: 'rgba(232,152,10,0.18)',
                  border: '1px solid rgba(232,152,10,0.35)',
                  borderRadius: 6, padding: '2px 8px',
                }}>
                  {marginText}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZONE 2 — AI NARRATIVE STRIP                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {narrative && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 16px',
          background: 'hsl(var(--muted) / 0.6)',
          borderBottom: '1px solid hsl(var(--border))',
          animation: 'tric-fadeIn 0.5s ease-out both',
          animationDelay: '0.35s',
        }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚡</span>
          <p className="text-muted-foreground" style={{
            fontSize: 13, lineHeight: 1.55, fontStyle: 'italic', margin: 0,
          }}>
            {narrative}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZONE 3 — FINAL LEADERBOARD                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: '12px 16px 0' }}>
        {/* Section header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="text-muted-foreground" style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const,
          }}>
            Final Leaderboard
          </span>
          <button
            onClick={() => navigate(`/tourhub/tournament/${tournamentId}`)}
            className="text-primary"
            style={{ fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Full results →
          </button>
        </div>

        {/* Winner row — amber accent */}
        {effectiveWinner.player && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--accent-amber) / 0.05)',
            animation: 'tric-slideIn 0.4s ease-out both', animationDelay: '0.45s',
          }}>
            <span style={{ width: 28, textAlign: 'center' as const, fontSize: 15, fontWeight: 700, color: 'hsl(var(--accent-amber))' }}>1</span>
            <SquircleAvatar
              src={winnerPhoto}
              alt={winnerName}
              size={36}
              fallback={winnerName.split(' ').map((w: string) => w[0]).join('')}
              hideRing
            />
            <span className="text-foreground" style={{
              flex: 1, fontSize: 14, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {winnerName}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--accent-amber))', fontVariantNumeric: 'tabular-nums' as const }}>
              {scoreDisplay}
            </span>
          </div>
        )}

        {/* Positions 2–5 */}
        {podiumRows.map((row, idx) => (
          <div key={`${row.position}-${idx}`} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
            borderBottom: idx < podiumRows.length - 1 ? '1px solid hsl(var(--border))' : 'none',
            animation: 'tric-slideIn 0.4s ease-out both',
            animationDelay: `${0.5 + idx * 0.07}s`,
          }}>
            <span className="text-muted-foreground" style={{
              width: 28, textAlign: 'center' as const, fontSize: 13, fontWeight: 600,
            }}>
              {row.isTied ? `T${row.position}` : row.position}
            </span>
            <SquircleAvatar
              src={row.photoUrl}
              alt={row.playerName}
              size={34}
              fallback={row.playerName.split(' ').map((w: string) => w[0]).join('')}
              hideRing
            />
            <span className="text-foreground" style={{
              flex: 1, fontSize: 13, fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {row.playerName}
            </span>
            <span className="text-foreground" style={{
              fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' as const,
            }}>
              {row.scoreDisplay}
            </span>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZONE 4 — STATS STRIP                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(tStats || sStats) && (
        <div style={{
          display: 'flex', gap: 4, padding: '12px 16px',
          borderTop: '1px solid hsl(var(--border))',
          overflowX: 'auto' as const,
          animation: 'tric-fadeIn 0.5s ease-out both', animationDelay: '0.75s',
        }}>
          {[
            { v: tStats?.eagles, label: 'Eagles', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',
              show: !!(tStats?.eagles && tStats.eagles > 0) },
            { v: tStats?.birdies, label: 'Birdies', color: '#16A34A', bg: 'rgba(22,163,74,0.08)',
              show: !!tStats?.birdies },
            { v: tStats?.pars, label: 'Pars',
              color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted))',
              show: !!tStats?.pars },
            { v: tStats?.bogeys, label: 'Bogeys', color: '#DC2626', bg: 'rgba(220,38,38,0.08)',
              show: !!(tStats?.bogeys && tStats.bogeys > 0) },
          ].filter(s => s.show).map(stat => (
            <div key={stat.label} style={{
              flex: 1, textAlign: 'center' as const,
              padding: '7px 4px', borderRadius: 8, background: stat.bg, minWidth: 52,
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: stat.color }}>{stat.v}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: stat.color, opacity: 0.7, letterSpacing: 0.5, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}

          {/* Performance averages */}
          {sStats?.drivingDistance && (
            <div style={{ flex: 1, textAlign: 'center' as const, padding: '7px 4px', borderRadius: 8, background: 'rgba(232,152,10,0.07)', minWidth: 62 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#E8980A' }}>{Math.round(sStats.drivingDistance)}<span style={{ fontSize: 10, fontWeight: 500, opacity: 0.7 }}> yds</span></div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#E8980A', opacity: 0.7, letterSpacing: 0.5, marginTop: 2 }}>Driver</div>
            </div>
          )}
          {sStats?.greensInReg && (
            <div style={{ flex: 1, textAlign: 'center' as const, padding: '7px 4px', borderRadius: 8, background: 'rgba(22,163,74,0.07)', minWidth: 52 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#16A34A' }}>{Math.round(sStats.greensInReg)}<span style={{ fontSize: 10, fontWeight: 500, opacity: 0.7 }}>%</span></div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#16A34A', opacity: 0.7, letterSpacing: 0.5, marginTop: 2 }}>GIR</div>
            </div>
          )}
          {sStats?.puttingAverage && (
            <div style={{ flex: 1, textAlign: 'center' as const, padding: '7px 4px', borderRadius: 8, background: 'hsl(var(--muted))', minWidth: 52 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{sStats.puttingAverage.toFixed(2)}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--muted-foreground))', opacity: 0.7, letterSpacing: 0.5, marginTop: 2 }}>Putts</div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZONE 5 — CTA BAR                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: '12px 16px 16px' }}>
        <button
          onClick={() => navigate(`/tourhub/tournament/${tournamentId}`)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            background: 'linear-gradient(180deg, rgba(232,152,10,0.55) 0%, rgba(180,120,8,0.42) 100%)',
            border: '1px solid rgba(232,152,10,0.42)',
            borderTop: '1px solid rgba(255,210,130,0.22)',
            borderRadius: 20, padding: '11px 20px',
            cursor: 'pointer', color: '#fff',
            fontSize: 14, fontWeight: 700, letterSpacing: 0.2,
            boxShadow: '0 2px 10px rgba(232,152,10,0.18)',
            textShadow: '0 1px 2px rgba(0,0,0,0.25)',
          }}
        >
          View Full Results →
        </button>
      </div>
    </motion.div>
  );
}
