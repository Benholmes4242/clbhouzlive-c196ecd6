/**
 * TournamentLiveCard — Live tournament feed card.
 * Visually aligned with TournamentResultCard: full-bleed hero, leaderboard list, CTA bar.
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
    @keyframes trlive-fadeUp   { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes trlive-fadeIn   { from { opacity: 0; } to { opacity: 1; } }
    @keyframes trlive-slideIn  { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes trlive-livePulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
    @keyframes trlive-ctaPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(232,152,10,0); } 60% { box-shadow: 0 0 0 8px rgba(232,152,10,0.12); } }
    @keyframes trlive-heartPop { 0% { transform: scale(1); } 30% { transform: scale(1.6); } 70% { transform: scale(0.9); } 100% { transform: scale(1); } }
  `;
  document.head.appendChild(s);
}

// ─── Tour identity (shared with ResultCard) ───────────────────────────────────

const TOUR_LABELS: Record<string, string> = {
  pga: 'PGA TOUR', liv: 'LIV GOLF', euro: 'DP WORLD', dpw: 'DP WORLD',
  lpga: 'LPGA', kft: 'KORN FERRY', champ: 'CHAMPIONS',
};

function getTourIdentity(slug: string) {
  return {
    label:       TOUR_LABELS[slug] ?? slug.toUpperCase(),
    accentColor: 'hsl(var(--accent-amber))',
    gradient:    'linear-gradient(180deg, #111418 0%, #080a0e 100%)',
    badgeBg:     'hsl(var(--accent-amber) / 0.15)',
  };
}

// ─── Round label ──────────────────────────────────────────────────────────────
function roundLabel(round: number, total: number): string {
  if (round === total) return 'Final Round';
  if (round === 3)     return 'Moving Day';
  if (round === 2)     return 'Cut Day';
  return `Round ${round}`;
}

// ─── Volatility insight ───────────────────────────────────────────────────────
function generateVolatilityInsight(
  volatilityIndex: number,
  leader: LiveLeaderboardEntry | null,
  leaderboard: LiveLeaderboardEntry[],
): string {
  const name = leader?.playerName.split(' ').pop() ?? 'The leader';
  const coLeaders = leaderboard.filter(e => e.position === 1);

  if (coLeaders.length >= 3) return `🔥 ${coLeaders.length}-way tie at the top — this is anyone's tournament to win.`;
  if (coLeaders.length === 2) {
    const other = coLeaders.find(e => e.playerName !== leader?.playerName);
    return `${name} and ${other?.playerName.split(' ').pop() ?? 'a rival'} locked in a duel for the title.`;
  }
  if (volatilityIndex >= 80) return '🔥 Tight race — the leaderboard is packed and anyone can make a move.';
  if (volatilityIndex >= 60) return 'The field is closing in. Expect drama over the closing holes.';
  if (volatilityIndex <= 25) return `👑 ${name} is in full control — cruising toward the finish.`;
  return `⛳ ${name} leads the way. The chasers need to make a move soon.`;
}

// ─── Hero photo ───────────────────────────────────────────────────────────────
function HeroPhoto({ src, name }: { src: string | null; name: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setImgSrc(src); setFailed(false); }, [src]);
  const initials = name.split(/[\s.]/).filter(Boolean).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');

  if (imgSrc && !failed) {
    return (
      <img
        src={imgSrc}
        alt={name}
        draggable={false}
        onError={() => {
          if (imgSrc !== PLAYER_SILHOUETTE_URL) setImgSrc(PLAYER_SILHOUETTE_URL);
          else setFailed(true);
        }}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '-4%',
          width: '94%',
          height: '88%',
          transform: 'translateX(-50%)',
          objectFit: 'contain',
          objectPosition: 'center bottom',
        }}
      />
    );
  }
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: 72, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: 4,
    }}>
      <span>{initials}</span>
    </div>
  );
}

// ─── Row avatar (squircle) ───────────────────────────────────────────────────
function RowAvatar({ name, photoUrl, tourSlug, size = 34 }: {
  name: string; photoUrl: string | null; tourSlug: string; size?: number;
}) {
  const src = photoUrl || getPlayerHeadshotUrl(name, tourSlug) || null;
  const initials = name.split(/[\s.]/).filter(Boolean).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
  return <SquircleAvatar src={src} alt={name} size={size} fallback={initials} hideRing />;
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
  const tour = getTourIdentity(meta.tourSlug);
  const isLiked      = likeOverride?.isLiked ?? post.isLikedByMe;
  const likeCount    = likeOverride?.count   ?? post.likeCount;
  const commentCount = commentCountOverride  ?? post.commentCount;

  const [heartPopping, setHeartPopping] = useState(false);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const [avatarSize, setAvatarSize] = useState({ leader: 46, row: 42 });

  useEffect(() => { ensureKeyframes(); }, []);

  // Parallax on leader photo
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isActive) return;
    let raf: number;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const drift = Math.sin(t * 0.12) * 8;
      const scale = 1 + Math.abs(Math.sin(t * 0.08)) * 0.015;
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

  const insight = useMemo(
    () => generateVolatilityInsight(meta.volatilityIndex, leader, meta.leaderboard ?? []),
    [meta.volatilityIndex, leader, meta.leaderboard],
  );

  const rLabel = roundLabel(meta.currentRound, meta.totalRounds);

  // Build chaser rows (positions 2+, deduped by position, max 3 shown overall)
  const chaserRows = useMemo(() => {
    if (!meta.leaderboard || meta.leaderboard.length < 2) return [];
    const byPos = new Map<number, LiveLeaderboardEntry[]>();
    meta.leaderboard.forEach(e => {
      if (e.position <= 1) return;
      const arr = byPos.get(e.position) || [];
      arr.push(e);
      byPos.set(e.position, arr);
    });
    return Array.from(byPos.entries())
      .sort(([a], [b]) => a - b)
      .slice(0, 2)
      .map(([pos, players]) => ({ position: pos, players, isTied: players.length > 1 }));
  }, [meta.leaderboard]);

  // Count total leaderboard rows to compute responsive avatar sizes
  const totalRows = useMemo(() => {
    let count = leader ? 1 : 0;
    if (isTiedFirst) count += Math.min(coLeaders.length - 1, 2);
    count += chaserRows.length;
    return Math.max(count, 1);
  }, [leader, isTiedFirst, coLeaders.length, chaserRows.length]);

  // Responsive avatar sizing based on leaderboard container height
  useEffect(() => {
    const el = leaderboardRef.current;
    if (!el) return;
    const compute = () => {
      const h = el.clientHeight;
      // Reserve ~30px for header, then distribute remaining among rows
      // Each row has ~24px vertical padding + avatar height
      const available = h - 30;
      const perRow = available / totalRows;
      // Avatar = perRow - row padding (24px gap+borders)
      const raw = Math.floor(perRow - 24);
      const leaderSize = Math.max(28, Math.min(52, raw));
      const rowSize = Math.max(26, Math.min(48, raw - 2));
      setAvatarSize({ leader: leaderSize, row: rowSize });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [totalRows]);

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100dvh',
      background: '#000', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ══ ZONE 1: HERO — leader portrait (50%, matching Result card) ══ */}
      <div style={{
        position: 'relative', flex: '0 0 60%', overflow: 'hidden',
      }}>
        <div ref={heroRef} style={{
          position: 'absolute', inset: '-10px',
          background: tour.gradient,
          willChange: 'transform',
          transition: 'transform 0.1s linear',
        }}>
          {leader && <HeroPhoto src={leaderPhotoSrc} name={leader.playerName} />}
        </div>

        {/* Bottom gradient */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Top fade */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '25%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Top bar — LIVE badge + tour/round */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '52px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          animation: 'trlive-fadeIn 0.4s ease-out',
        }}>
          {/* LIVE pill */}
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
              {tour.label}
            </span>
            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
              {rLabel}
            </span>
          </div>
        </div>

        {/* Leader info — bottom of hero (matches Result card layout) */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 20px 20px',
          animation: 'trlive-fadeUp 0.7s ease-out both',
          animationDelay: '0.3s',
        }}>
          {/* Venue */}
          {(meta.venueName || meta.venueCity) && (
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,0.5)',
              letterSpacing: 0.5, marginBottom: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {[meta.venueName, meta.venueCity].filter(Boolean).join(' · ')}
            </div>
          )}

          {/* Tournament name */}
          <div style={{
            fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 600,
            color: 'rgba(255,255,255,0.85)', lineHeight: 1.25,
            marginBottom: 10, maxWidth: '90%',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}>
            {meta.tournamentName}
          </div>

          {/* Leader name + score */}
          {leader && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' as const }}>
              <div style={{
                fontSize: 'clamp(22px, 6vw, 28px)', fontWeight: 800,
                color: '#fff', lineHeight: 1.1, letterSpacing: -0.5,
              }}>
                {leader.playerName}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 'clamp(20px, 5.5vw, 24px)', fontWeight: 700,
                  color: tour.accentColor, lineHeight: 1,
                }}>
                  {leader.scoreDisplay}
                </span>
                {leader.thru && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                    background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)',
                    borderRadius: 6, padding: '2px 8px',
                  }}>
                    Thru {leader.thru}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ ZONE 2: INSIGHT STRIP (volatility) ══ */}
      <div style={{
        flex: '0 0 auto', padding: '12px 20px',
        background: 'rgba(255,255,255,0.03)',
        borderTop: `1px solid ${tour.accentColor}22`,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        animation: 'trlive-fadeIn 0.6s ease-out both',
        animationDelay: '0.5s',
      }}>
        <div style={{
          fontSize: 14, lineHeight: 1.45, color: 'rgba(255,255,255,0.72)',
          fontStyle: 'italic' as const,
        }}>
          {insight}
        </div>
      </div>

      {/* ══ ZONE 3: LEADERBOARD + CTA (matching Result card) ══ */}
      <div style={{
        flex: '1 1 auto', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: 'rgba(0,0,0,0.95)',
      }}>

        {/* Leaderboard */}
        <div ref={leaderboardRef} style={{
          flex: '1 1 auto', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          padding: '10px max(14px, 3vw) 0',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 8,
          }}>
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
              color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const,
            }}>
              Live Leaderboard
            </span>
            <button
              onClick={handleWatchLive}
              style={{
                fontSize: 12, fontWeight: 600, color: tour.accentColor,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Full leaderboard →
            </button>
          </div>

          {/* Leader row (highlighted, matches Result winner row) */}
          {leader && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0',
              borderBottom: chaserRows.length > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: `${tour.accentColor}08`,
              animation: 'trlive-slideIn 0.5s ease-out both',
              animationDelay: '0.6s',
            }}>
              <span style={{ width: 28, textAlign: 'center' as const, fontSize: 15, fontWeight: 700, color: tour.accentColor }}>
                {isTiedFirst ? 'T1' : '1'}
              </span>
              <RowAvatar name={leader.playerName} photoUrl={leader.photoUrl} tourSlug={meta.tourSlug} size={avatarSize.leader} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {leader.playerName}
              </span>
              {leader.thru && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginRight: 4 }}>
                  {leader.thru}
                </span>
              )}
              <span style={{ fontSize: 15, fontWeight: 700, color: tour.accentColor, fontVariantNumeric: 'tabular-nums' as const }}>
                {leader.scoreDisplay}
              </span>
            </div>
          )}

          {/* Co-leaders (if tied at 1st, show other co-leaders) */}
          {isTiedFirst && coLeaders
            .filter(e => e.playerName !== leader?.playerName)
            .slice(0, 2)
            .map((co, idx) => (
              <div key={`co-${idx}`} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: `${tour.accentColor}05`,
                animation: 'trlive-slideIn 0.5s ease-out both',
                animationDelay: `${0.65 + idx * 0.08}s`,
              }}>
                <span style={{ width: 28, textAlign: 'center' as const, fontSize: 14, fontWeight: 600, color: tour.accentColor }}>
                  T1
                </span>
                <RowAvatar name={co.playerName} photoUrl={co.photoUrl} tourSlug={meta.tourSlug} size={avatarSize.row} />
                <span style={{
                  flex: 1, fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: 500,
                  color: 'rgba(255,255,255,0.8)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                }}>
                  {co.playerName}
                </span>
                {co.thru && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginRight: 4 }}>
                    {co.thru}
                  </span>
                )}
                <span style={{
                  fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' as const,
                }}>
                  {co.scoreDisplay}
                </span>
              </div>
            ))}

          {/* Chaser rows (positions 2-3 only) */}
          {chaserRows.map((row, idx) => {
            const primary = row.players[0];
            const stackedAvatars = row.players.slice(0, 4);

            return (
              <div key={`${row.position}-${idx}`} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                animation: 'trlive-slideIn 0.5s ease-out both',
                animationDelay: `${0.65 + (isTiedFirst ? Math.min(coLeaders.length - 1, 2) : 0) * 0.08 + idx * 0.08}s`,
              }}>
                <span style={{
                  width: 28, textAlign: 'center' as const, fontSize: 14, fontWeight: 600,
                  color: 'rgba(255,255,255,0.45)',
                }}>
                  {row.isTied ? `T${row.position}` : row.position}
                </span>

                {row.isTied ? (
                  <div style={{ display: 'flex', alignItems: 'center', marginLeft: 0 }}>
                    {stackedAvatars.map((p, i) => (
                      <div key={i} style={{
                        marginLeft: i === 0 ? 0 : -12,
                        zIndex: stackedAvatars.length - i,
                        borderRadius: '34%',
                        border: '2px solid rgba(0,0,0,0.95)',
                        overflow: 'hidden',
                      }}>
                        <RowAvatar name={p.playerName} photoUrl={p.photoUrl} tourSlug={meta.tourSlug} size={avatarSize.row} />
                      </div>
                    ))}
                    {row.players.length > 4 && (
                      <div style={{
                        marginLeft: -10, zIndex: 0,
                        width: 38, height: 38, borderRadius: '34%',
                        background: 'rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
                        border: '2px solid rgba(0,0,0,0.95)',
                      }}>
                        +{row.players.length - 4}
                      </div>
                    )}
                  </div>
                ) : (
                  <RowAvatar name={primary.playerName} photoUrl={primary.photoUrl} tourSlug={meta.tourSlug} size={46} />
                )}

                <span style={{
                  flex: 1, fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: 500,
                  color: 'rgba(255,255,255,0.8)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                }}>
                  {row.isTied ? `${row.players.length}-Way Tie` : primary.playerName}
                </span>

                {!row.isTied && primary.thru && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginRight: 4 }}>
                    {primary.thru}
                  </span>
                )}

                <span style={{
                  fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  fontVariantNumeric: 'tabular-nums' as const,
                }}>
                  {primary.scoreDisplay}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stats strip (compact, matches Result card) */}
        {meta.leaderStats && (
          meta.leaderStats.totalBirdies > 0 ||
          meta.leaderStats.rounds.some(r => r !== null)
        ) && (
          <div style={{
            flex: '0 0 auto', display: 'flex', gap: 3,
            padding: '10px 16px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            overflowX: 'auto' as const,
            animation: 'trlive-fadeIn 0.5s ease-out both',
            animationDelay: '0.9s',
          }}>
            {[
              { v: meta.leaderStats.totalEagles,  label: 'Eagles',  color: '#F59E0B', show: meta.leaderStats.totalEagles > 0 },
              { v: meta.leaderStats.totalBirdies, label: 'Birdies', color: '#22C55E', show: meta.leaderStats.totalBirdies > 0 },
              { v: meta.leaderStats.totalPars,    label: 'Pars',    color: '#94A3B8', show: meta.leaderStats.totalPars > 0 },
              { v: meta.leaderStats.totalBogeys,  label: 'Bogeys',  color: '#EF4444', show: meta.leaderStats.totalBogeys > 0 },
            ].filter(s => s.show).map(stat => (
              <div key={stat.label} style={{
                flex: 1, textAlign: 'center' as const, padding: '6px 0',
                borderRadius: 8, background: `${stat.color}0A`,
              }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: stat.color }}>{stat.v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, marginTop: 1 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* CTA bar (matching Result card exactly) */}
        <div style={{
          flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px',
          paddingBottom: 'max(env(safe-area-inset-bottom, 10px), 10px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button onClick={handleLike} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: isLiked ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
            border: isLiked ? '1px solid rgba(245,158,11,0.35)' : '1px solid transparent',
            borderRadius: 12,
            padding: '10px 16px', cursor: 'pointer', color: isLiked ? '#f59e0b' : 'rgba(255,255,255,0.6)',
            fontSize: 15, fontWeight: 600, transition: 'all 0.2s',
            animation: heartPopping ? 'trlive-heartPop 0.5s ease-out' : 'none',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isLiked ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {likeCount}
          </button>

          <button onClick={onComment} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'linear-gradient(180deg, rgba(232,152,10,0.60) 0%, rgba(199,135,10,0.45) 50%, rgba(180,120,8,0.50) 100%)',
            border: '1px solid rgba(232,152,10,0.50)',
            borderTop: '1px solid rgba(255,210,130,0.30)',
            borderRadius: 22, padding: '10px 10px', cursor: 'pointer', color: '#fff',
            fontSize: 'clamp(12px, 3.2vw, 14px)', fontWeight: 700, letterSpacing: 0.3,
            animation: 'trlive-ctaPulse 2.5s ease-in-out infinite',
            animationDelay: '1.5s',
            boxShadow: '0 2px 12px rgba(232,152,10,0.3), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.15)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}>
            <span>💬</span>
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              Who wins this?
            </span>
            {commentCount > 0 && (
              <span style={{
                background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                padding: '1px 7px', fontSize: 12, fontWeight: 600,
              }}>
                {commentCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TournamentLiveCard;
