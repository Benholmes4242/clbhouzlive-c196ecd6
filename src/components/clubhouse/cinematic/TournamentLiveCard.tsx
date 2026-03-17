/**
 * TournamentLiveCard — Live tournament feed card.
 * Full-bleed leader portrait. Static podium trio. Pulsing LIVE badge.
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
          objectFit: 'cover', objectPosition: 'center top',
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

// ─── Row avatar (squircle, used by 2nd/3rd rows) ─────────────────────────────
function RowAvatar({ name, photoUrl, tourSlug, size = 32 }: {
  name: string; photoUrl: string | null; tourSlug: string; size?: number;
}) {
  const src = photoUrl || getPlayerHeadshotUrl(name, tourSlug) || null;
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

// ─── Performance chip ─────────────────────────────────────────────────────────
function PerfChip({ value, label, suffix }: { value: string | null; label: string; suffix: string }) {
  return (
    <div style={{
      borderRadius: 12, padding: '10px 0',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      opacity: value === null ? 0.4 : 1,
    }}>
      <span style={{ fontSize: 'clamp(12px, 3.8vw, 15px)', fontWeight: 800, color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>
        {value === null ? '—' : <>{value}{suffix && <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{suffix}</span>}</>}
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</span>
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

  useEffect(() => { ensureKeyframes(); }, []);

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
  const coLeaders = meta.leaderboard?.filter(e => e.position === 1) ?? [];
  const isTiedFirst = coLeaders.length > 1;
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
          marginTop: '8%',
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
            <div style={{ fontSize: 'clamp(11px, 3vw, 13px)', color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: '0.02em' }}>
              {[meta.venueName, meta.venueCity].filter(Boolean).join(' · ')}
            </div>
          )}

          {/* Tournament name */}
          <div style={{
            fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 700, color: 'rgba(255,255,255,0.95)',
            letterSpacing: '-0.01em', marginBottom: 10, lineHeight: 1.2,
          }}>
            {meta.tournamentName}
          </div>

          {/* Leader name + score */}
          {leader && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{
                  fontSize: 'clamp(26px, 7vw, 32px)', fontWeight: 800, color: '#fff',
                  letterSpacing: '-0.02em', lineHeight: 1.1,
                }}>
                  {leader.playerName}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                  {isTiedFirst ? `Tied for the lead (${coLeaders.length}-way)` : 'Leads the field'}
                </div>
                {isTiedFirst && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginTop: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {coLeaders
                        .filter(e => e.playerName !== leader!.playerName)
                        .slice(0, 4)
                        .map((co, i) => (
                          <div key={i} style={{
                            marginLeft: i === 0 ? 0 : -10,
                            position: 'relative', zIndex: 10 - i,
                          }}>
                            <RowAvatar name={co.playerName} photoUrl={co.photoUrl} tourSlug={meta.tourSlug} size={28} />
                          </div>
                        ))
                      }
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: 'rgba(255,255,255,0.55)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: 160,
                    }}>
                      {coLeaders
                        .filter(e => e.playerName !== leader!.playerName)
                        .slice(0, 3)
                        .map(e => e.playerName.split(' ').slice(-1)[0])
                        .join(', ')
                      }
                      {coLeaders.filter(e => e.playerName !== leader!.playerName).length > 3 && ' +more'}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 'clamp(30px, 8vw, 36px)', fontWeight: 800,
                  color: scoreColor(leader.scoreDisplay),
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {leader.scoreDisplay}
                </span>
                {leader.thru && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
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
          padding: '10px max(12px, 3vw)',
          borderTop: '1px solid hsl(var(--accent-amber) / 0.12)',
          borderBottom: '1px solid hsl(var(--accent-amber) / 0.12)',
          background: 'hsl(var(--accent-amber) / 0.05)',
        }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'hsl(var(--accent-amber))',
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
          margin: '8px max(12px, 3vw) 0',
          animation: 'trlive-fadeUp 0.5s ease-out both',
          animationDelay: '180ms',
          touchAction: 'none',
        }}>
          {/* Round scores row */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
            {meta.leaderStats.rounds.map((score, i) => (
              <RoundChip key={i} round={i + 1} score={score} />
            ))}
          </div>

          {/* Birdies / Eagles / Pars / Bogeys row */}
          <div style={{ display: 'flex', gap: 5 }}>
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

      {/* ══ ZONE 3: PERFORMANCE + CHASERS + CTA ══ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'trlive-fadeUp 0.5s ease-out 0.25s both',
        touchAction: 'none',
      }}>

        {/* Performance averages */}
        {(() => {
          const s = meta.leaderStats as Record<string, unknown> | null;
          if (!s) return null;
          const dd = s.drivingDistance as number | null ?? null;
          const fw = s.fairwaysPct as number | null ?? null;
          const gir = s.girPct as number | null ?? null;
          const putts = s.putts as number | null ?? null;
          if (dd == null && fw == null && gir == null && putts == null) return null;
          return (
            <div style={{ padding: 'clamp(10px, 1.5vh, 18px) 16px clamp(10px, 1.5vh, 18px)' }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
              }}>
                Performance Averages
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                <PerfChip value={dd != null ? String(dd) : null} label="DRIVER" suffix="yds" />
                <PerfChip value={fw != null ? String(Math.round(fw)) : null} label="FAIRWAYS" suffix="%" />
                <PerfChip value={gir != null ? String(Math.round(gir)) : null} label="GIR" suffix="%" />
                <PerfChip value={putts != null ? putts.toFixed(2) : null} label="PUTTS" suffix="" />
              </div>
            </div>
          );
        })()}

        {/* 2nd and 3rd place rows */}
        {meta.leaderboard?.length >= 2 && (() => {
          const distinctByPos = Array.from(
            new Map(meta.leaderboard.map(e => [e.position, e])).values()
          ).filter(e => e.position > 1).slice(0, 2);

          return (
            <div style={{ marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 0 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {distinctByPos.map((entry, i) => {
                const tiedEntries = meta.leaderboard.filter(e => e.position === entry.position);
                const isTie = tiedEntries.length > 1;
                const shown = tiedEntries.slice(0, 5);

                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: 'clamp(12px, 2.8vh, 24px) 20px',
                  }}>
                    {/* Position */}
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.35)', width: 24, flexShrink: 0, textAlign: 'center' }}>
                      {entry.positionTied ? `T${entry.position}` : entry.position}
                    </span>

                    {/* Avatar(s) */}
                    {isTie ? (
                      <div style={{ display: 'flex', flexShrink: 0 }}>
                        {shown.map((p, idx) => (
                          <div key={idx} style={{ marginLeft: idx === 0 ? 0 : -14, position: 'relative', zIndex: shown.length - idx }}>
                            <RowAvatar name={p.playerName} photoUrl={p.photoUrl} tourSlug={meta.tourSlug} size={56} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <RowAvatar name={entry.playerName} photoUrl={entry.photoUrl} tourSlug={meta.tourSlug} size={56} />
                    )}

                    {/* Name or tie label */}
                    {isTie ? (
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.35)', flex: 1 }}>
                        {tiedEntries.length}-way tie
                      </span>
                    ) : (
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.8)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.playerName}
                      </span>
                    )}

                    {/* Thru */}
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginRight: 8 }}>
                      {entry.thru}
                    </span>

                    {/* Score */}
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)', flexShrink: 0, minWidth: 36, textAlign: 'right' }}>
                      {entry.scoreDisplay}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}


        {/* CTA bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 16px', flexShrink: 0,
        }}>
          {/* Like */}
          <button onClick={handleLike} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: isLiked ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${isLiked ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.12)'}`,
            cursor: 'pointer', borderRadius: 20, padding: '10px 16px',
            fontSize: 15, fontWeight: 600, color: isLiked ? '#EF4444' : 'rgba(255,255,255,0.6)',
            animation: heartPopping ? 'trlive-heartPop 0.4s ease-out' : undefined,
          }}>
            <span style={{ fontSize: 18 }}>
              {isLiked ? '♥' : '♡'}
            </span>
            {likeCount}
          </button>

          {/* Centre CTA — shorter */}
          <button onClick={onComment} style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'linear-gradient(180deg, rgba(232,152,10,0.60) 0%, rgba(199,135,10,0.45) 50%, rgba(180,120,8,0.50) 100%)',
            border: '1px solid rgba(232,152,10,0.50)',
            borderTop: '1px solid rgba(255,210,130,0.30)',
            borderRadius: 22, padding: '10px 10px',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            minWidth: 0,
            boxShadow: '0 2px 12px rgba(232,152,10,0.3), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.15)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>💬</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Who wins?</span>
            {commentCount > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>{commentCount}</span>
            )}
          </button>

          {/* Leaderboard link */}
          <button onClick={handleWatchLive} style={{
            background: 'transparent', border: 'none',
            color: '#F59E0B', fontSize: 13, fontWeight: 700,
            whiteSpace: 'nowrap', cursor: 'pointer', padding: '10px 4px',
            flexShrink: 0,
          }}>
            Leaderboard →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TournamentLiveCard;
