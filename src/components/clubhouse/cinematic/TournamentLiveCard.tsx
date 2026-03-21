// TournamentLiveCard — Phase 2 Cinema Rebuild
// Single-file implementation. No other files touched.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TournamentLiveFeedPost, LiveLeaderboardEntry } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';

/* ── Colour tokens ── */
const AMBER        = '#f59e0b';
const GREEN        = '#22c55e';
const AMBER_DIM    = 'rgba(245,158,11,0.08)';
const AMBER_BORDER = 'rgba(245,158,11,0.18)';

const TOUR_LABELS: Record<string, string> = {
  pga:   'PGA TOUR',
  liv:   'LIV GOLF',
  euro:  'DP WORLD',
  dpw:   'DP WORLD',
  lpga:  'LPGA',
  kft:   'KORN FERRY',
  champ: 'CHAMPIONS',
};

/* ── Keyframe injection ── */
function injectKeyframes() {
  const ID = 'clb-live-card-kf';
  if (document.getElementById(ID)) return;
  const s = document.createElement('style');
  s.id = ID;
  s.textContent = `
    @keyframes clb-live-pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%     { opacity:0.4; transform:scale(0.75); }
    }
    @keyframes clb-live-fadeUp {
      from { opacity:0; transform:translateY(12px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes clb-live-heart {
      0%   { transform:scale(1); }
      30%  { transform:scale(1.35); }
      60%  { transform:scale(0.9); }
      100% { transform:scale(1); }
    }
  `;
  document.head.appendChild(s);
}

/* ── Helpers ── */
function roundLabel(round: number, total: number): string {
  if (round === total) return 'Final Round';
  if (round === 3) return 'Moving Day';
  if (round === 2) return 'Cut Day';
  return `Round ${round}`;
}

function volatilityInsight(
  volatilityIndex: number,
  leader: LiveLeaderboardEntry | null,
  leaderboard: LiveLeaderboardEntry[],
): string {
  const lastName = leader?.playerName.split(' ').pop() ?? 'The leader';
  const coLeaders = leaderboard.filter(e => e.position === 1);
  if (coLeaders.length >= 3) return `${coLeaders.length}-way tie at the top.`;
  if (coLeaders.length === 2) {
    const other = coLeaders.find(e => e.playerName !== leader?.playerName);
    return `${lastName} and ${other?.playerName.split(' ').pop()} in a duel.`;
  }
  if (volatilityIndex >= 80) return 'Tight race — anyone can make a move.';
  if (volatilityIndex >= 60) return 'The field is closing in. Expect drama.';
  if (volatilityIndex <= 25) return `${lastName} is in full control.`;
  return `${lastName} leads. The chasers need to move soon.`;
}

/* ── Sub-components ── */
function LiveBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
      borderRadius: 8, padding: '3px 8px',
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', background: GREEN,
        animation: 'clb-live-pulse 1.8s ease-in-out infinite',
      }} />
      <span style={{ fontSize: 10, fontWeight: 800, color: GREEN, letterSpacing: '0.06em' }}>
        LIVE
      </span>
    </div>
  );
}

function PlayerAvatar({ name, photoUrl, tourSlug, size }: {
  name: string; photoUrl: string | null; tourSlug: string; size: number;
}) {
  const src = photoUrl || getPlayerHeadshotUrl(name, tourSlug) || null;
  const initials = name.split(/[\s.]/).filter(Boolean)
    .map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
  return <SquircleAvatar src={src} alt={name} size={size} fallback={initials} hideRing />;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"
      fill={filled ? AMBER : 'none'}
      stroke={filled ? AMBER : 'rgba(255,255,255,0.5)'}
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/* ── Props ── */
export interface TournamentLiveCardProps {
  post:                  TournamentLiveFeedPost;
  isActive:              boolean;
  onComment:             () => void;
  onLike:                () => void;
  likeOverride?:         { isLiked: boolean; count: number };
  commentCountOverride?: number;
}

/* ── Main Component ── */
export const TournamentLiveCard: React.FC<TournamentLiveCardProps> = ({
  post, isActive, onComment, onLike, likeOverride, commentCountOverride,
}) => {
  const navigate = useNavigate();
  const meta = post.liveMeta;

  useEffect(() => { injectKeyframes(); }, []);

  /* State & derived */
  const isLiked     = likeOverride?.isLiked ?? post.isLikedByMe;
  const likeCount   = likeOverride?.count ?? post.likeCount;
  const commentCount = commentCountOverride ?? post.commentCount;
  const [heartPop, setHeartPop] = useState(false);

  const leader    = meta.leader;
  const tourLabel = TOUR_LABELS[meta.tourSlug] ?? meta.tourName ?? meta.tourSlug.toUpperCase();
  const rLabel    = roundLabel(meta.currentRound, meta.totalRounds);
  const coLeaders = meta.leaderboard?.filter(e => e.position === 1) ?? [];
  const isTied    = coLeaders.length > 1;

  const insight = useMemo(
    () => volatilityInsight(meta.volatilityIndex, leader, meta.leaderboard ?? []),
    [meta.volatilityIndex, leader, meta.leaderboard],
  );

  const chaserRows = useMemo(() => {
    if (!meta.leaderboard || meta.leaderboard.length < 2) return [];
    const byPos = new Map<number, LiveLeaderboardEntry[]>();
    meta.leaderboard.forEach(e => {
      if (e.position <= 1) return;
      const arr = byPos.get(e.position) ?? [];
      arr.push(e);
      byPos.set(e.position, arr);
    });
    return Array.from(byPos.entries())
      .sort(([a], [b]) => a - b)
      .slice(0, 3)
      .map(([pos, players]) => ({ pos, players, isTied: players.length > 1 }));
  }, [meta.leaderboard]);

  /* Handlers */
  const handleLike = useCallback(() => {
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 500);
    onLike();
  }, [onLike]);

  const handleFullLeaderboard = useCallback(() => {
    navigate(`/tourhub/tournament/${meta.tournamentId}`);
  }, [navigate, meta.tournamentId]);

  /* Stats tiles */
  const statTiles = useMemo(() => {
    if (!meta.leaderStats) return [];
    const raw = [
      { label: 'Eagles',  value: meta.leaderStats.totalEagles,  color: AMBER },
      { label: 'Birdies', value: meta.leaderStats.totalBirdies, color: GREEN },
      { label: 'Pars',    value: meta.leaderStats.totalPars,    color: '#94a3b8' },
      { label: 'Bogeys',  value: meta.leaderStats.totalBogeys,  color: '#ef4444' },
    ];
    return raw.filter(t => t.value > 0);
  }, [meta.leaderStats]);

  return (
    <div style={{
      height: '100dvh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: '#080a0e',
      color: '#fff',
    }}>
      {/* Zone 1 — Accent bar */}
      <div style={{
        height: 2.5,
        flexShrink: 0,
        background: `linear-gradient(90deg, ${AMBER}CC, transparent)`,
      }} />

      {/* Zone 2 — Header */}
      <div style={{
        flexShrink: 0,
        position: 'relative',
        background: 'linear-gradient(160deg, #141c2e 0%, #0a1020 55%, #080a0e 100%)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 16,
      }}>
        {/* Amber glow */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 220, height: 220,
          background: `radial-gradient(circle at 100% 0%, rgba(245,158,11,0.15), transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Live + Tour/Round */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <LiveBadge />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
            {tourLabel} · {rLabel}
          </span>
        </div>

        {/* Tournament name */}
        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>
          {meta.tournamentName}
        </div>

        {/* Venue */}
        {meta.venueName && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
            {meta.venueName}{meta.venueCity ? ` · ${meta.venueCity}` : ''}
          </div>
        )}

        {/* Leader spotlight card */}
        {leader && (
          <div style={{
            background: AMBER_DIM,
            border: `1px solid ${AMBER_BORDER}`,
            borderRadius: 16,
            padding: '13px 16px',
          }}>
            {/* Avatar + Name + Score row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <PlayerAvatar name={leader.playerName} photoUrl={leader.photoUrl} tourSlug={meta.tourSlug} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: AMBER, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                  {isTied ? `${coLeaders.length}-Way Tie` : 'Tournament Leader'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {leader.playerName}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  Thru {leader.thru ?? '-'}{leader.today ? ` · Today ${leader.today}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 38, fontWeight: 900, color: AMBER, lineHeight: 1 }}>
                  {leader.scoreDisplay}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                  vs par
                </div>
              </div>
            </div>

            {/* Row A — Stats tiles (inside leader card) */}
            {statTiles.length > 0 && (
              <>
                <div style={{
                  height: 1,
                  background: 'rgba(255,255,255,0.06)',
                  margin: '12px 0',
                }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {statTiles.map(t => (
                    <div key={t.label} style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '9px 0',
                      borderRadius: 12,
                      background: `${t.color}0A`,
                      border: `1px solid ${t.color}18`,
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: t.color }}>{t.value}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
                        {t.label}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Row B — Insight line (inside leader card) */}
            <div style={{
              ...(statTiles.length > 0
                ? { marginTop: 10 }
                : { borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 12 }),
              fontSize: 12,
              color: 'rgba(255,255,255,0.48)',
              lineHeight: 1.55,
              fontStyle: 'italic',
            }}>
              {insight}
            </div>
          </div>
        )}
      </div>

      {/* Zone 3 — Chasers */}
      {chaserRows.length > 0 && (
        <div style={{ flexShrink: 0, padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              In Contention
            </span>
            <button
              onClick={handleFullLeaderboard}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, color: AMBER, padding: 0,
              }}
            >
              Full leaderboard →
            </button>
          </div>
          {chaserRows.map((row, idx) => (
            <div
              key={row.pos}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12,
                padding: '10px 12px',
                marginBottom: 8,
                animation: `clb-live-fadeUp 0.4s ease-out ${0.15 + idx * 0.06}s both`,
              }}
            >
              {/* Position */}
              <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.35)', width: 20, textAlign: 'center', flexShrink: 0 }}>
                {row.isTied ? `T${row.pos}` : row.pos}
              </span>

              {/* Avatars */}
              <div style={{ display: 'flex', flexShrink: 0 }}>
                {row.players.slice(0, 3).map((p, i) => (
                  <div key={p.playerId} style={{ marginLeft: i > 0 ? -10 : 0, borderRadius: '34%', position: 'relative', zIndex: 3 - i }}>
                    <PlayerAvatar name={p.playerName} photoUrl={p.photoUrl} tourSlug={meta.tourSlug} size={28} />
                  </div>
                ))}
                {row.players.length > 3 && (
                  <div style={{
                    marginLeft: -10, width: 28, height: 28, borderRadius: '34%',
                    background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                    
                  }}>
                    +{row.players.length - 3}
                  </div>
                )}
              </div>

              {/* Name(s) */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row.players.length === 1
                    ? row.players[0].playerName
                    : row.players.slice(0, 2).map(p => p.playerName.split(' ').pop()).join(', ')
                      + (row.players.length > 2 ? ` +${row.players.length - 2}` : '')}
                </div>
                {row.players.length === 1 && row.players[0].thru && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                    Thru {row.players[0].thru}
                  </div>
                )}
              </div>

              {/* Score */}
              <span style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
                {row.players[0].scoreDisplay}
              </span>
            </div>
          ))}
        </div>
      )}




      {/* Zone 6 — Spacer */}
      <div style={{ flex: 1 }} />

      {/* Zone 7 — CTA bar */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 20px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Like button */}
        <button
          onClick={handleLike}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: isLiked ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isLiked ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 14,
            padding: '11px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            display: 'inline-flex',
            animation: heartPop ? 'clb-live-heart 0.5s ease-out' : 'none',
          }}>
            <HeartIcon filled={isLiked} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: isLiked ? AMBER : 'rgba(255,255,255,0.6)' }}>
            {likeCount > 0 ? likeCount : ''}
          </span>
        </button>

        {/* CTA button */}
        <button
          onClick={onComment}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: `linear-gradient(135deg, ${AMBER}, #d97706)`,
            border: 'none',
            borderRadius: 16,
            padding: '13px 16px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(245,158,11,0.18)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: '#000' }}>
            Who wins this?
          </span>
          {commentCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 800, color: '#000',
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 10,
              padding: '2px 7px',
            }}>
              {commentCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default TournamentLiveCard;
