/**
 * TournamentLiveCard — Live tournament feed card.
 * Full-bleed leader portrait. Real-time leaderboard. Pulsing LIVE badge.
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TournamentLiveFeedPost, LiveLeaderboardEntry } from '@/components/media-system/types/media';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// ─── Keyframes ────────────────────────────────────────────────────────────────

const STYLE_ID = 'trlive-keyframes';
function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes trlive-fadeUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes trlive-fadeIn   { from { opacity: 0; } to { opacity: 1; } }
    @keyframes trlive-livePulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
    @keyframes trlive-rowFlash { 0% { background: hsl(var(--accent-amber) / 0.18); } 100% { background: transparent; } }
    @keyframes trlive-ctaPulse { 0%,100% { box-shadow: 0 0 0 0 hsl(var(--accent-amber) / 0); } 60% { box-shadow: 0 0 0 8px hsl(var(--accent-amber) / 0.1); } }
    @keyframes trlive-heartPop { 0% { transform: scale(1); } 30% { transform: scale(1.6); } 70% { transform: scale(0.9); } 100% { transform: scale(1); } }
  `;
  document.head.appendChild(s);
}

// ─── Score colour helper ──────────────────────────────────────────────────────
function scoreColor(_display: string): string {
  return 'rgba(255,255,255,0.9)';
}

// ─── Round label ──────────────────────────────────────────────────────────────
function roundLabel(round: number, total: number): string {
  if (round === total) return 'Final Round';
  if (round === 3)     return 'Moving Day';
  if (round === 2)     return 'Cut Day';
  return `Round ${round}`;
}

// ─── Round chip (for leader stats strip) ──────────────────────────────────────
function RoundChip({ round, score }: { round: number; score: number | null }) {
  const display = score == null ? '—'
    : score > 0 ? `+${score}`
    : score === 0 ? 'E'
    : `${score}`;
  return (
    <div style={{
      flex: 1, padding: '7px 4px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    }}>
      <span style={{ fontSize: 'clamp(12px, 3.5vw, 14px)', fontWeight: 800, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>{display}</span>
      <span style={{ fontSize: 'clamp(7px, 2vw, 8.5px)', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.6, textTransform: 'uppercase' }}>R{round}</span>
    </div>
  );
}

// ─── Live stat chip (for leader stats strip) ─────────────────────────────────
function LiveStatChip({ value, label, color, bg, border }: {
  value: number; label: string; color: string; bg: string; border: string;
}) {
  return (
    <div style={{
      flex: 1, padding: '7px 4px',
      background: bg, border: `1px solid ${border}`,
      borderRadius: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    }}>
      <span style={{ fontSize: 'clamp(12px, 3.5vw, 14px)', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 'clamp(7px, 2vw, 8.5px)', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// ─── Leader photo ─────────────────────────────────────────────────────────────
function LeaderPhoto({ src, name }: { src: string | null; name: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setImgSrc(src); setFailed(false); }, [src]);
  const initials = name.split(/[\s.]/).filter(Boolean).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');

  if (imgSrc && !failed) {
    return (
      <img
        src={imgSrc}
        alt={name}
        onError={() => {
          if (imgSrc !== PLAYER_SILHOUETTE_URL) setImgSrc(PLAYER_SILHOUETTE_URL);
          else setFailed(true);
        }}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'top center',
        }}
      />
    );
  }
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #111418 0%, #080a0e 100%)',
    }}>
      <span style={{ fontSize: 64, fontWeight: 700, color: 'rgba(255,255,255,0.15)' }}>
        {initials}
      </span>
    </div>
  );
}

// ─── Row avatar (squircle) ────────────────────────────────────────────────────
function RowAvatar({ src, name, size = 30 }: { src: string | null; name: string; size?: number }) {
  const initials = name.split(/[\s.]/).filter(Boolean).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
  return (
    <SquircleAvatar
      src={src}
      alt={name}
      size={size}
      fallback={initials}
      hideRing
    />
  );
}

// ─── Leaderboard row with flash animation on update ───────────────────────────
function LeaderboardRow({
  entry,
  isLeader,
  flashKey,
  tourSlug,
}: {
  entry: LiveLeaderboardEntry;
  isLeader: boolean;
  flashKey: number;
  tourSlug: string;
}) {
  const [flashing, setFlashing] = useState(false);
  const prevFlashKey = useRef(flashKey);

  useEffect(() => {
    if (flashKey !== prevFlashKey.current) {
      prevFlashKey.current = flashKey;
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 800);
      return () => clearTimeout(t);
    }
  }, [flashKey]);

  const photoSrc = entry.photoUrl || getPlayerHeadshotUrl(entry.playerName, tourSlug) || null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 10px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: isLeader ? 'hsl(var(--accent-amber) / 0.06)' : 'transparent',
      animation: flashing ? 'trlive-rowFlash 0.8s ease-out' : undefined,
      transition: 'background 0.3s ease',
    }}>
      {/* Position */}
      <span style={{
        width: 28, textAlign: 'center', fontSize: 'clamp(9px, 2.5vw, 11px)', fontWeight: 600,
        color: isLeader ? 'hsl(var(--accent-amber))' : 'rgba(255,255,255,0.5)',
      }}>
        {entry.positionTied ? `T${entry.position}` : entry.position}
      </span>

      <RowAvatar src={photoSrc} name={entry.playerName} size={30} />

      {/* Name */}
      <span style={{
        flex: 1, fontSize: 13, fontWeight: isLeader ? 600 : 400,
        color: 'rgba(255,255,255,0.92)', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {entry.playerName}
      </span>

      {/* Thru */}
      {entry.thru && (
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', minWidth: 24, textAlign: 'center' }}>
          {entry.thru === '18' || entry.thru === 'F' ? 'F' : entry.thru}
        </span>
      )}

      {/* Score */}
      <span style={{
        fontSize: 14, fontWeight: 700, minWidth: 36, textAlign: 'right',
        color: scoreColor(entry.scoreDisplay),
        fontVariantNumeric: 'tabular-nums',
      }}>
        {entry.scoreDisplay}
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface TournamentLiveCardProps {
  post:                  TournamentLiveFeedPost;
  isActive:              boolean;
  onComment:             () => void;
  onLike:                () => void;
  likeOverride?:         { isLiked: boolean; count: number };
  commentCountOverride?: number;
}

// ─── Main component ───────────────────────────────────────────────────────────
export const TournamentLiveCard: React.FC<TournamentLiveCardProps> = ({
  post, isActive, onComment, onLike, likeOverride, commentCountOverride,
}) => {
  const navigate = useNavigate();
  const meta = post.liveMeta;
  const isLiked      = likeOverride?.isLiked ?? post.isLikedByMe;
  const likeCount    = likeOverride?.count   ?? post.likeCount;
  const commentCount = commentCountOverride  ?? post.commentCount;

  const [heartPopping, setHeartPopping] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const prevLastUpdated = useRef(meta.lastUpdated);

  useEffect(() => { ensureKeyframes(); }, []);

  useEffect(() => {
    if (meta.lastUpdated !== prevLastUpdated.current) {
      prevLastUpdated.current = meta.lastUpdated;
      setFlashKey(k => k + 1);
    }
  }, [meta.lastUpdated]);

  // Parallax on leader photo
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isActive) return;
    let raf: number;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const drift = Math.sin(t * 0.11) * 6;
      const scale = 1 + Math.abs(Math.sin(t * 0.07)) * 0.012;
      if (heroRef.current) {
        heroRef.current.style.transform = `translateX(${drift}px) scale(${scale})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isActive]);

  const handleLike = useCallback(() => {
    setHeartPopping(true);
    setTimeout(() => setHeartPopping(false), 500);
    onLike();
  }, [onLike]);

  const handleWatchLive = useCallback(() => {
    navigate(`/tourhub/tournament/${meta.tournamentId}`);
  }, [navigate, meta.tournamentId]);

  const leader = meta.leader;
  const leaderPhotoSrc = leader
    ? leader.photoUrl || getPlayerHeadshotUrl(leader.playerName, meta.tourSlug) || null
    : null;

  const volatilityBanner = useMemo(() => {
    if (meta.volatilityIndex >= 80) return '🔥 Tight race — anyone can win this';
    if (meta.volatilityIndex >= 60) return '⚡ The field is closing in';
    if (meta.volatilityIndex <= 25 && leader) return `👑 ${leader.playerName.split(' ').pop()} in full control`;
    return null;
  }, [meta.volatilityIndex, leader]);

  const rLabel = roundLabel(meta.currentRound, meta.totalRounds);

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100dvh',
      background: '#080a0e', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ══ ZONE 1: HERO — leader portrait ══ */}
      <div style={{
        position: 'relative', flex: '0 0 46%', overflow: 'hidden',
        touchAction: 'none',
      }}>

        {/* Portrait */}
        <div ref={heroRef} style={{
          position: 'absolute', inset: '-8px',
          willChange: 'transform', transition: 'transform 0.3s ease-out',
        }}>
          {leader && <LeaderPhoto src={leaderPhotoSrc} name={leader.playerName} />}
        </div>

        {/* Bottom gradient */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          background: 'linear-gradient(to top, #080a0e 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Top fade */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '25%',
          background: 'linear-gradient(to bottom, rgba(8,10,14,0.6) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Top bar — LIVE badge left, tour + round right */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '52px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          animation: 'trlive-fadeIn 0.4s ease-out',
        }}>
          {/* LIVE pill — green */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(34,197,94,0.15)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(34,197,94,0.40)',
            padding: '5px 12px', borderRadius: 20,
            fontSize: 11, fontWeight: 800, color: '#22C55E',
            letterSpacing: '0.08em',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#22C55E',
              boxShadow: '0 0 6px 2px rgba(34,197,94,0.45)',
              animation: 'trlive-livePulse 1.5s ease-in-out infinite',
            }} />
            LIVE
          </div>

          {/* Tour + Round badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)',
            padding: '5px 12px', borderRadius: 20,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em' }}>
              {meta.tourName}
            </span>
            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
              {rLabel}
            </span>
          </div>
        </div>

        {/* Leader info — bottom of hero */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 18px 14px',
          animation: 'trlive-fadeUp 0.5s ease-out 0.15s both',
        }}>
          {/* Venue */}
          {(meta.venueName || meta.venueCity) && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3, letterSpacing: '0.02em' }}>
              {[meta.venueName, meta.venueCity].filter(Boolean).join(' · ')}
            </div>
          )}

          {/* Tournament name */}
          <div style={{
            fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.95)',
            letterSpacing: '-0.01em', marginBottom: 8, lineHeight: 1.2,
          }}>
            {meta.tournamentName}
          </div>

          {/* Leader name + score */}
          {leader && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{
                  fontSize: 28, fontWeight: 800, color: '#fff',
                  letterSpacing: '-0.02em', lineHeight: 1.1,
                }}>
                  {leader.playerName}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  Leads the field
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 32, fontWeight: 800,
                  color: scoreColor(leader.scoreDisplay),
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {leader.scoreDisplay}
                </span>
                {leader.thru && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                    Thru {leader.thru}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ ZONE 2: VOLATILITY BANNER (conditional) ══ */}
      {volatilityBanner && (
        <div style={{
          padding: '8px 18px',
          borderTop: '1px solid hsl(var(--accent-amber) / 0.12)',
          borderBottom: '1px solid hsl(var(--accent-amber) / 0.12)',
          background: 'hsl(var(--accent-amber) / 0.05)',
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'hsl(var(--accent-amber))',
            textAlign: 'center', letterSpacing: '0.01em',
          }}>
            {volatilityBanner}
          </div>
        </div>
      )}

      {/* ══ LEADER STATS STRIP ══ */}
      {meta.leaderStats && (
        meta.leaderStats.totalBirdies > 0 ||
        meta.leaderStats.rounds.some(r => r !== null)
      ) && (
        <div style={{
          flexShrink: 0,
          margin: '6px 16px 0',
          animation: 'trlive-fadeUp 0.5s ease-out both',
          animationDelay: '180ms',
          touchAction: 'none',
        }}>
          {/* Round scores row */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            {meta.leaderStats.rounds.map((score, i) => (
              <RoundChip key={i} round={i + 1} score={score} />
            ))}
          </div>

          {/* Birdies / Eagles / Pars / Bogeys row */}
          <div style={{ display: 'flex', gap: 4 }}>
            {meta.leaderStats.totalEagles > 0 && (
              <LiveStatChip
                value={meta.leaderStats.totalEagles}
                label={meta.leaderStats.totalEagles === 1 ? 'Eagle' : 'Eagles'}
                color="#F59E0B"
                bg="rgba(245,158,11,0.08)"
                border="rgba(245,158,11,0.25)"
              />
            )}
            <LiveStatChip
              value={meta.leaderStats.totalBirdies}
              label="Birdies"
              color="#22C55E"
              bg="rgba(34,197,94,0.08)"
              border="rgba(34,197,94,0.25)"
            />
            <LiveStatChip
              value={meta.leaderStats.totalPars}
              label="Pars"
              color="#94A3B8"
              bg="rgba(148,163,184,0.08)"
              border="rgba(148,163,184,0.25)"
            />
            <LiveStatChip
              value={meta.leaderStats.totalBogeys}
              label="Bogeys"
              color="#EF4444"
              bg="rgba(239,68,68,0.08)"
              border="rgba(239,68,68,0.25)"
            />
          </div>
        </div>
      )}

      {/* ══ ZONE 3: LEADERBOARD + CTA ══ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '10px 14px 0', overflow: 'hidden',
        animation: 'trlive-fadeUp 0.5s ease-out 0.25s both',
        overscrollBehavior: 'contain',
        touchAction: 'pan-y',
      }}>

        {/* Leaderboard card */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: 280,
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
        }}>
          {/* Header row — just label, no momentum pills (shown in top badge) */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 12px 6px',
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
              Leaderboard
            </span>

            <button
              onClick={handleWatchLive}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, color: 'hsl(var(--accent-amber))',
              }}
            >
              Full leaderboard →
            </button>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'flex', padding: '4px 10px', gap: 8,
            fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span style={{ width: 28, textAlign: 'center' }}>#</span>
            <span style={{ width: 30 }} />
            <span style={{ flex: 1 }}>Player</span>
            {meta.leaderboard.some(e => e.thru) && (
              <span style={{ minWidth: 24, textAlign: 'center' }}>Thru</span>
            )}
            <span style={{ minWidth: 36, textAlign: 'right' }}>Score</span>
          </div>

          {/* Rows */}
          {meta.leaderboard.slice(0, 10).map((entry) => (
            <LeaderboardRow
              key={entry.playerId}
              entry={entry}
              isLeader={entry.position === 1}
              flashKey={flashKey}
              tourSlug={meta.tourSlug}
            />
          ))}
        </div>

        {/* CTA bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 0 20px', flexShrink: 0,
        }}>
          {/* Like */}
          <button onClick={handleLike} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer',
            borderRadius: 20, padding: '8px 14px',
            fontSize: 14, color: isLiked ? '#F87171' : 'rgba(255,255,255,0.7)',
            animation: heartPopping ? 'trlive-heartPop 0.4s ease-out' : undefined,
          }}>
            <span style={{ fontSize: 16 }}>
              {isLiked ? '♥' : '♡'}
            </span>
            {likeCount}
          </button>

          {/* Join conversation */}
          <button onClick={onComment} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'hsl(var(--accent-amber))', border: 'none', cursor: 'pointer',
            borderRadius: 22, padding: '10px 16px',
            fontSize: 14, fontWeight: 700, color: '#000',
            animation: 'trlive-ctaPulse 2.5s ease-in-out infinite',
          }}>
            💬
            <span>Join the conversation</span>
            {commentCount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: 'rgba(0,0,0,0.15)', padding: '1px 6px', borderRadius: 8,
              }}>
                {commentCount}
              </span>
            )}
          </button>

          {/* Watch live */}
          <button onClick={handleWatchLive} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer',
            borderRadius: 20, padding: '8px 14px',
            fontSize: 12, fontWeight: 700, color: 'hsl(var(--accent-amber))',
          }}>
            TourHub →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TournamentLiveCard;
