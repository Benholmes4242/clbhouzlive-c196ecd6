/**
 * TournamentResultCard — SESSION 7 full redesign.
 * Full-bleed 100dvh cinematic card with parallax drift, gradient overlays,
 * top bar, overlaid tournament name, glass card with winner/stats/podium/engagement.
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import type { TournamentResultFeedPost, TournamentResultMeta, PodiumRow as PodiumRowType } from '@/components/media-system/types/media';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

// ─── Keyframe styles injected once ───
const STYLE_ID = 'trcard-keyframes';
function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes trcard-fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes trcard-slideIn { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes trcard-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(2); opacity: 0; } }
    @keyframes trcard-glowPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); } 50% { box-shadow: 0 0 0 6px rgba(249,115,22,0.15); } }
    @keyframes trcard-heartPop { 0% { transform: scale(1); } 25% { transform: scale(1.5); } 60% { transform: scale(0.9); } 100% { transform: scale(1); } }
  `;
  document.head.appendChild(s);
}

// ─── Tour gradient fallbacks ───
const TOUR_FALLBACKS: Record<string, string> = {
  pga: 'linear-gradient(160deg, #1e3a5f, #0f1f3d)',
  liv: 'linear-gradient(160deg, #3f1f1f, #1f0f0f)',
  euro: 'linear-gradient(160deg, #1a3f2a, #0f1f15)',
  dpw: 'linear-gradient(160deg, #1a3f2a, #0f1f15)',
  lpga: 'linear-gradient(160deg, #3f1a2a, #1f0f15)',
  kft: 'linear-gradient(160deg, #3f2a1a, #1f150f)',
  champ: 'linear-gradient(160deg, #3f2a1a, #1f150f)',
};

// ─── Tour label helper ───
function getTourLabel(slug: string): string {
  const map: Record<string, string> = {
    pga: 'PGA TOUR', liv: 'LIV GOLF', euro: 'DP WORLD', dpw: 'DP WORLD',
    lpga: 'LPGA', champ: 'CHAMPIONS', kft: 'KORN FERRY',
  };
  return map[slug] || slug.toUpperCase();
}

// ─── Avatar with fallback ───
function WinnerAvatar({ src, name, size }: { src: string | null; name: string; size: number }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [error, setError] = useState(false);
  const initials = name.split(/[\s.]/).filter(Boolean).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';

  useEffect(() => { setCurrentSrc(src); setError(false); }, [src]);

  return (
    <div style={{
      width: size, height: size, borderRadius: '22%', overflow: 'hidden', flexShrink: 0,
      border: '2px solid rgba(251,146,60,0.8)',
      boxShadow: '0 0 16px rgba(251,146,60,0.5), 0 0 32px rgba(251,146,60,0.2)',
      position: 'relative',
      background: 'rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {currentSrc && !error ? (
        <img
          src={currentSrc}
          alt={name}
          onError={() => {
            if (currentSrc !== PLAYER_SILHOUETTE_URL) setCurrentSrc(PLAYER_SILHOUETTE_URL);
            else setError(true);
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.32), fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{initials}</span>
      )}
      {/* Trophy badge */}
      <div style={{
        position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%',
        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
        border: '2px solid rgba(10,12,18,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, lineHeight: 1,
      }}>🏆</div>
    </div>
  );
}

// ─── Small avatar for podium rows ───
function SmallAvatar({ src, name, size }: { src: string | null; name: string; size: number }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [error, setError] = useState(false);
  const initials = name.split(/[\s.]/).filter(Boolean).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';

  useEffect(() => { setCurrentSrc(src); setError(false); }, [src]);

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      border: '1.5px solid rgba(255,255,255,0.2)',
      background: 'rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {currentSrc && !error ? (
        <img src={currentSrc} alt={name}
          onError={() => { if (currentSrc !== PLAYER_SILHOUETTE_URL) setCurrentSrc(PLAYER_SILHOUETTE_URL); else setError(true); }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.35), fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{initials}</span>
      )}
    </div>
  );
}

// ─── Props ───
export interface TournamentResultCardProps {
  post: TournamentResultFeedPost;
  isActive: boolean;
  isVisible: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onViewResults?: () => void;
  likeOverride?: { isLiked: boolean; count: number };
  commentCountOverride?: number;
}

// ─── Main Component ───
export const TournamentResultCard: React.FC<TournamentResultCardProps> = ({
  post, isActive, isVisible, onLike, onComment, onShare, onViewResults, likeOverride, commentCountOverride,
}) => {
  const navigate = useNavigate();
  const meta = post.tournamentMeta;
  const isLiked = likeOverride?.isLiked ?? post.isLikedByMe;
  const likeCount = likeOverride?.count ?? post.likeCount;
  const commentCount = commentCountOverride ?? post.commentCount;

  const hasImage = !!meta.course_image_url;
  const hasVenue = !!(meta.venue_name || meta.venue_city);
  const hasPodium = meta.podium_rows && meta.podium_rows.length > 0;

  // Heart pop state
  const [heartPopping, setHeartPopping] = useState(false);

  // Inject keyframes
  useEffect(() => { ensureKeyframes(); }, []);

  // Parallax drift via rAF
  const imgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isActive) return;
    let raf: number;
    const start = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const offset = Math.sin(elapsed * 0.15) * 12;
      if (imgRef.current) {
        imgRef.current.style.transform = `translateX(${offset}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isActive]);

  // No longer needed — grid always renders all 8 chips

  const handleViewResults = useCallback(() => {
    if (onViewResults) onViewResults();
    else navigate(`/tourhub/tournament/${meta.tournament_id}`);
  }, [onViewResults, navigate, meta.tournament_id]);

  const handleLike = useCallback(() => {
    setHeartPopping(true);
    setTimeout(() => setHeartPopping(false), 400);
    onLike();
  }, [onLike]);

  const resolvePhoto = (name: string, photoUrl?: string | null) =>
    photoUrl || getPlayerHeadshotUrl(name, meta.tour_slug) || PLAYER_SILHOUETTE_URL;

  // Score stat chip colours
  const STAT_COLORS: Record<string, { color: string; bg: string; border: string; glow: string }> = {
    eagles: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', glow: 'rgba(245,158,11,0.15)' },
    birdies: { color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', glow: 'rgba(34,197,94,0.15)' },
    pars: { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', glow: 'rgba(148,163,184,0.15)' },
    bogeys: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', glow: 'rgba(239,68,68,0.15)' },
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', background: '#000', overflow: 'hidden' }}>

      {/* ── LAYER 1: Course image with parallax drift ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div ref={imgRef} style={{ position: 'absolute', top: '-5%', left: '-8%', width: '116%', height: '110%' }}>
          {hasImage ? (
            <img
              src={meta.course_image_url!}
              alt={meta.venue_name || meta.tournament_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75) saturate(1.1)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: TOUR_FALLBACKS[meta.tour_slug] || 'linear-gradient(160deg, #1a1f2e, #0d0f18)' }} />
          )}
        </div>
      </div>

      {/* ── LAYER 2: Gradient overlays ── */}
      {/* Top fade */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
      {/* Bottom fade (strong) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '72%', background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.4) 70%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />

      {/* ── LAYER 3: Foreground content ── */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── TOP BAR ── */}
        <div style={{
          position: 'absolute', top: 56, left: 16, right: 16, zIndex: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          animation: 'trcard-fadeUp 0.5s ease-out both',
          animationDelay: '0ms',
        }}>
          {/* Tour badge pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, padding: '5px 12px 5px 6px',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#F97316',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1,
            }}>C</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.8 }}>
              {meta.tour_name || getTourLabel(meta.tour_slug)}
            </span>
          </div>

          {/* FINAL RESULT pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 20, padding: '5px 12px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          }}>
            <div style={{ position: 'relative', width: 8, height: 8 }}>
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%', background: '#EF4444',
                animation: 'trcard-pulse 2s ease-in-out infinite',
              }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#EF4444', width: 8, height: 8 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#FCA5A5', letterSpacing: 1.0 }}>FINAL RESULT</span>
          </div>
        </div>

        {/* ── SPACER — push tournament name to bottom of image area ── */}
        <div style={{ flex: 1 }} />

        {/* ── TOURNAMENT NAME (overlaid on image) ── */}
        <div style={{
          position: 'relative', zIndex: 10, padding: '0 20px',
          animation: 'trcard-fadeUp 0.5s ease-out both',
          animationDelay: '100ms',
        }}>
          {hasVenue && (
            <p style={{
              fontSize: 11, fontWeight: 600, color: 'rgba(251,146,60,0.9)',
              letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4,
            }}>
              {[meta.venue_name, meta.venue_city].filter(Boolean).join(' · ')}
            </p>
          )}
          <h2 style={{
            fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.15,
            letterSpacing: -0.5, margin: 0,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}>
            {meta.tournament_name}
          </h2>
        </div>

        {/* ── GLASS CARD ── */}
        <div style={{
          margin: '16px 16px 0',
          background: 'rgba(10,12,18,0.82)',
          backdropFilter: 'blur(28px) saturate(160%)', WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 20,
          overflow: 'hidden',
          animation: 'trcard-fadeUp 0.5s ease-out both',
          animationDelay: '200ms',
        }}>
          {/* Top accent line */}
          <div style={{ height: 2, width: '100%', background: 'linear-gradient(90deg, #F97316 0%, rgba(249,115,22,0.3) 60%, transparent 100%)' }} />

          {/* ── Winner block ── */}
          <div style={{
            padding: 16,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 14,
            animation: 'trcard-slideIn 0.5s ease-out both',
            animationDelay: '300ms',
          }}>
            <WinnerAvatar
              src={meta.winner_photo_url || getPlayerHeadshotUrl(meta.winner_name, meta.tour_slug) || PLAYER_SILHOUETTE_URL}
              name={meta.winner_name}
              size={60}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.3, lineHeight: 1.2 }}>
                {meta.winner_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{
                  fontSize: 22, fontWeight: 800, lineHeight: 1,
                  background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {meta.winner_score_display || 'E'}
                </span>
                {meta.winner_by && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#F97316',
                    background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)',
                    borderRadius: 10, padding: '2px 8px',
                  }}>
                    {meta.winner_by}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Stats 2×4 grid ── */}
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Tournament Stats
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              paddingBottom: 12,
            }}>
              {/* Row 1 — tournament stats (always show, dim if 0) */}
              <StatGlowChip value={meta.stat_eagles} label={meta.stat_eagles === 1 ? 'Eagle' : 'Eagles'} {...STAT_COLORS.eagles} dimmed={meta.stat_eagles === 0} />
              <StatGlowChip value={meta.stat_birdies} label="Birdies" {...STAT_COLORS.birdies} dimmed={meta.stat_birdies === 0} />
              <StatGlowChip value={meta.stat_pars} label="Pars" {...STAT_COLORS.pars} dimmed={meta.stat_pars === 0} />
              <StatGlowChip value={meta.stat_bogeys} label="Bogeys" {...STAT_COLORS.bogeys} dimmed={meta.stat_bogeys === 0} />

              {/* Row 2 — performance stats (placeholder if null) */}
              <PerfChip value={meta.stat_driving_distance != null ? String(meta.stat_driving_distance) : null} label="DRIVER" suffix="yds" />
              <PerfChip value={meta.stat_fairways_pct != null ? String(Math.round(meta.stat_fairways_pct)) : null} label="FAIRWAYS" suffix="%" />
              <PerfChip value={meta.stat_gir_pct != null ? String(Math.round(meta.stat_gir_pct)) : null} label="GIR" suffix="%" />
              <PerfChip value={meta.stat_putts != null ? meta.stat_putts.toFixed(2) : null} label="PUTTS" suffix="" />
            </div>
          </div>

          {/* ── Leaderboard rows ── */}
          {hasPodium && (
            <div style={{ padding: '0 16px 14px' }}>
              {meta.podium_rows.slice(0, 2).map((row) => (
                <PodiumRunnerRow key={row.position} row={row} resolvePhoto={resolvePhoto} />
              ))}
            </div>
          )}

          {/* ── Engagement bar ── */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', gap: 8, padding: '12px 16px', alignItems: 'center',
          }}>
            {/* Like button */}
            <button onClick={handleLike} style={{
              display: 'flex', alignItems: 'center', gap: 5, borderRadius: 22, padding: '8px 14px',
              background: isLiked ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${isLiked ? 'rgba(249,115,22,0.45)' : 'rgba(255,255,255,0.12)'}`,
              color: isLiked ? '#F97316' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer', lineHeight: 1,
            }}>
              <span style={{
                fontSize: 15,
                animation: heartPopping ? 'trcard-heartPop 0.4s ease-out' : undefined,
                display: 'inline-block',
              }}>
                {isLiked ? '♥' : '♡'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{likeCount}</span>
            </button>

            {/* Join conversation button */}
            <button onClick={onComment} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'linear-gradient(135deg, rgba(249,115,22,0.22), rgba(234,88,12,0.15))',
              border: '1px solid rgba(249,115,22,0.35)', borderRadius: 22, padding: '8px 16px',
              color: '#FB923C', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              animation: 'trcard-glowPulse 3s ease-in-out infinite',
            }}>
              <span style={{ fontSize: 14 }}>💬</span>
              <span>Join the conversation</span>
              {commentCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(251,146,60,0.6)' }}>{commentCount}</span>
              )}
            </button>

            {/* View Results button */}
            <button onClick={handleViewResults} style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 22, padding: '8px 12px', color: 'rgba(255,255,255,0.65)',
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
            }}>
              Results →
            </button>
          </div>
        </div>

        {/* ── Bottom gap for nav bar ── */}
        <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', flexShrink: 0 }} />
      </div>
    </div>
  );
};

// ─── Score stat chip with glow ───
function StatGlowChip({ value, label, color, bg, border, glow }: {
  value: number; label: string; color: string; bg: string; border: string; glow: string;
}) {
  return (
    <div style={{
      minWidth: 64, borderRadius: 12, padding: '10px 14px',
      background: bg, border: `1px solid ${border}`,
      boxShadow: `0 0 12px ${glow}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0,
    }}>
      <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// ─── Performance stat chip (neutral) ───
function PerfChip({ value, label, suffix }: { value: string; label: string; suffix: string }) {
  return (
    <div style={{
      minWidth: 64, borderRadius: 12, padding: '10px 14px',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0,
    }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>
        {value}
        {suffix && <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{suffix}</span>}
      </span>
      <span style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// ─── Podium runner row ───
function PodiumRunnerRow({ row, resolvePhoto }: { row: PodiumRowType; resolvePhoto: (name: string, photoUrl?: string | null) => string }) {
  const isSingle = !row.isTied || row.players.length === 1;
  const player = row.players[0];
  const shownAvatars = row.players.slice(0, 5);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      borderTop: '1px solid rgba(255,255,255,0.05)', padding: '9px 0',
    }}>
      {/* Position */}
      <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', width: 24, textAlign: 'center', flexShrink: 0 }}>
        {row.isTied ? `T${row.position}` : row.position}
      </span>

      {/* Avatars */}
      {isSingle ? (
        <SmallAvatar src={resolvePhoto(player.name, player.photoUrl)} name={player.name} size={32} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {shownAvatars.map((p, i) => (
            <div key={i} style={{ marginLeft: i === 0 ? 0 : -10, position: 'relative', zIndex: shownAvatars.length - i }}>
              <SmallAvatar src={resolvePhoto(p.name, p.photoUrl)} name={p.name} size={32} />
            </div>
          ))}
        </div>
      )}

      {/* Name */}
      {isSingle ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.name}
        </span>
      ) : (
        <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.35)', flex: 1 }}>
          {row.players.length}-way tie
        </span>
      )}

      {/* Score */}
      <span style={{ fontSize: 14, fontWeight: 700, color: '#22C55E', flexShrink: 0 }}>
        {player.score || 'E'}
      </span>
    </div>
  );
}

export default TournamentResultCard;
