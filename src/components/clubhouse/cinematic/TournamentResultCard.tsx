/**
 * TournamentResultCard v3 — Cinematic feed moment.
 * Winner portrait as full-bleed hero. AI insight strip. Leaderboard + stats. Engagement CTA.
 *
 * v3 changes (Results state redesign):
 *   Zone 1: 260px hero, 26px name, 38px score
 *   Zone 2: 28px stat values, 4-col colored grid, secondary stats row
 *   Zone 3: Course photo background, SVG flag icon, par/purse pills
 *   Zone 4: 52px winner avatar, surnames on ties
 *   Zone 5: CTA unchanged
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  TournamentResultFeedPost,
  TournamentResultMeta,
  PodiumRow as PodiumRowType,
} from '@/components/media-system/types/media';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// ─── Keyframes ────────────────────────────────────────────────────────────────

const STYLE_ID = 'trc-v2-keyframes';
function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes trc-fadeUp   { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes trc-fadeIn   { from { opacity: 0; } to { opacity: 1; } }
    @keyframes trc-slideIn  { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes trc-heartPop { 0% { transform: scale(1); } 30% { transform: scale(1.6); } 70% { transform: scale(0.9); } 100% { transform: scale(1); } }
    @keyframes trc-ctaPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(232,152,10,0); } 60% { box-shadow: 0 0 0 8px rgba(232,152,10,0.12); } }
    @keyframes trc-shimmer  { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  `;
  document.head.appendChild(s);
}

// ─── Tour identity system ──────────────────────────────────────────────────────

const TOUR_LABELS: Record<string, string> = {
  pga:   'PGA TOUR',
  liv:   'LIV GOLF',
  euro:  'DP WORLD',
  dpw:   'DP WORLD',
  lpga:  'LPGA',
  kft:   'KORN FERRY',
  champ: 'CHAMPIONS',
};

function getTourIdentity(slug: string) {
  return {
    label:       TOUR_LABELS[slug] ?? slug.toUpperCase(),
    accentColor: 'hsl(var(--accent-amber))',
    gradient:    'linear-gradient(180deg, #111418 0%, #080a0e 100%)',
    badgeBg:     'hsl(var(--accent-amber) / 0.15)',
  };
}

// ─── AI Insight generator ─────────────────────────────────────────────────────

function generateWinnerInsight(meta: TournamentResultMeta): string {
  const name = meta.winner_name.split(' ').pop() ?? meta.winner_name;
  const score = meta.winner_score_display;
  const birdies = meta.stat_birdies;
  const eagles = meta.stat_eagles;
  const bogeys = meta.stat_bogeys;
  const putts = meta.stat_putts;
  const fairways = meta.stat_fairways_pct;
  const gir = meta.stat_gir_pct;
  const driving = meta.stat_driving_distance;
  const winnerBy = meta.winner_by;
  const podium = meta.podium_rows;

  const fragments: string[] = [];

  if (birdies != null && birdies >= 25) {
    fragments.push(`${name} torched the field with ${birdies} birdies across 72 holes — one of the most aggressive winning performances of the season.`);
  } else if (birdies != null && birdies >= 20) {
    fragments.push(`${name}'s ${birdies}-birdie week at ${score} was a masterclass in attacking golf.`);
  }

  if (eagles != null && eagles >= 2) {
    fragments.push(`${name} made ${eagles} eagles this week — a rare display of power that proved decisive at ${score}.`);
  }

  if (bogeys != null && bogeys <= 3 && birdies != null && birdies >= 15) {
    fragments.push(`Just ${bogeys} bogey${bogeys === 1 ? '' : 's'} all week. ${name}'s ${score} was built on relentless consistency.`);
  }

  if (putts != null && putts < 1.6) {
    fragments.push(`${name} averaged just ${putts.toFixed(2)} putts per hole — the putter was the weapon that unlocked ${score}.`);
  }

  if (gir != null && gir >= 78 && fairways != null && fairways >= 70) {
    fragments.push(`${name} hit ${Math.round(gir)}% of greens and ${Math.round(fairways)}% of fairways — pure ball-striking dominance at ${score}.`);
  }

  if (driving != null && driving >= 320) {
    fragments.push(`${name}'s ${driving}-yard average off the tee gave the field no answer. Bombed to ${score}.`);
  }

  if (winnerBy && (winnerBy.toLowerCase().includes('playoff') || winnerBy.toLowerCase().includes('p/o'))) {
    fragments.push(`${name} refused to lose. After finishing tied at ${score}, the playoff proved what the final leaderboard couldn't — composure under fire.`);
  } else if (winnerBy && winnerBy.includes('1')) {
    const runner = podium?.[0]?.players?.[0]?.name?.split(' ').pop() ?? 'the field';
    fragments.push(`Just one shot separated ${name} from ${runner} at the end. A ${score} victory that wasn't decided until the final hole.`);
  } else if (winnerBy && (winnerBy.includes('3') || winnerBy.includes('4') || winnerBy.includes('5'))) {
    fragments.push(`A convincing ${winnerBy} wire-to-wire? Not quite — but ${name}'s ${score} made it look effortless down the stretch.`);
  }

  if (fragments.length === 0 && birdies != null) {
    const ratio = bogeys != null && bogeys > 0 ? (birdies / bogeys).toFixed(1) : null;
    if (ratio) {
      fragments.push(`${birdies} birdies, ${bogeys} bogeys. A ${ratio}:1 ratio tells the story of ${name}'s ${score} winning week.`);
    } else {
      fragments.push(`${name} fired ${birdies} birdies en route to ${score}. The rest of the field never found an answer.`);
    }
  }

  return fragments[0] ?? `${name} wins at ${score}. The conversation starts now.`;
}

// ─── Winner avatar (hero size) ────────────────────────────────────────────────

function HeroAvatar({ src, name }: { src: string | null; name: string }) {
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
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'top center',
        }}
      />
    );
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: 72, fontWeight: 700, color: 'rgba(255,255,255,0.2)',
      letterSpacing: 4,
    }}>
      <span>{initials}</span>
    </div>
  );
}

// ─── Small avatar for leaderboard rows (squircle) ───────────────────────────

function RowAvatar({ src, name, size = 34 }: { src: string | null; name: string; size?: number }) {
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

// ─── SVG Golf Flag Icon ──────────────────────────────────────────────────────

function GolfFlagIcon() {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 8,
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="3" x2="7" y2="21" />
        <polygon points="7,3 17,7 7,11" fill="none" />
        <line x1="5" y1="21" x2="9" y2="21" />
      </svg>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export const TournamentResultCard: React.FC<TournamentResultCardProps> = ({
  post, isActive, onLike, onComment, onViewResults,
  likeOverride, commentCountOverride,
}) => {
  const navigate = useNavigate();
  const meta = post.tournamentMeta;
  const isLiked = likeOverride?.isLiked ?? post.isLikedByMe;
  const likeCount = likeOverride?.count ?? post.likeCount;
  const commentCount = commentCountOverride ?? post.commentCount;
  const tour = getTourIdentity(meta.tour_slug);
  const [heartPopping, setHeartPopping] = useState(false);

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

  useEffect(() => { ensureKeyframes(); }, []);

  const insight = useMemo(() => generateWinnerInsight(meta), [meta]);

  const resolvePhoto = useCallback((name: string, photoUrl?: string | null) =>
    photoUrl || getPlayerHeadshotUrl(name, meta.tour_slug) || PLAYER_SILHOUETTE_URL,
  [meta.tour_slug]);

  const handleLike = useCallback(() => {
    setHeartPopping(true);
    setTimeout(() => setHeartPopping(false), 500);
    onLike();
  }, [onLike]);

  const handleViewResults = useCallback(() => {
    if (onViewResults) onViewResults();
    else navigate(`/tourhub/tournament/${meta.tournament_id}`);
  }, [onViewResults, navigate, meta.tournament_id]);

  const podiumRows = meta.podium_rows?.slice(0, 5) ?? [];

  const winnerPhotoSrc = meta.winner_photo_url
    || getPlayerHeadshotUrl(meta.winner_name, meta.tour_slug)
    || null;

  // ─── Stats data ──────────────────────────────────────────────────────
  const primaryStats = useMemo(() => [
    { v: meta.stat_eagles,  label: 'EAGLES',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.18)' },
    { v: meta.stat_birdies, label: 'BIRDIES', color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.18)'  },
    { v: meta.stat_pars,    label: 'PARS',    color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.14)' },
    { v: meta.stat_bogeys,  label: 'BOGEYS',  color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.18)'  },
  ].filter(s => s.v != null), [meta]);

  const secondaryStats = useMemo(() => [
    { v: meta.stat_driving_distance != null ? `${meta.stat_driving_distance}y` : null, label: 'DRIVER' },
    { v: meta.stat_fairways_pct != null ? `${Math.round(meta.stat_fairways_pct)}%` : null, label: 'ACCURACY' },
    { v: meta.stat_gir_pct != null ? `${Math.round(meta.stat_gir_pct)}%` : null, label: 'GIR' },
    { v: meta.stat_putts != null ? meta.stat_putts.toFixed(2) : null, label: 'PUTTS' },
  ].filter(s => s.v != null), [meta]);

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: '#000', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ═══ ZONE 1 — HERO (260px fixed) ═══ */}
      <div style={{
        position: 'relative', flex: '0 0 260px', overflow: 'hidden',
      }}>
        <div ref={heroRef} style={{
          position: 'absolute', inset: '-10px',
          background: tour.gradient,
          willChange: 'transform',
          transition: 'transform 0.1s linear',
        }}>
          <HeroAvatar src={winnerPhotoSrc} name={meta.winner_name} />
        </div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '25%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Winner name + score overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 20px 16px',
          animation: 'trc-fadeUp 0.7s ease-out both',
          animationDelay: '0.3s',
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
            marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.8,
          }}>
            CHAMPION
          </div>

          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' as const,
          }}>
            <div style={{
              fontSize: 26, fontWeight: 800, color: '#fff',
              lineHeight: 1.1, letterSpacing: -0.4,
            }}>
              {meta.winner_name}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 38, fontWeight: 900, color: '#E8980A',
                lineHeight: 1, letterSpacing: -1.5,
              }}>
                {meta.winner_score_display || 'E'}
              </span>
              {meta.winner_by && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                  background: 'rgba(232,152,10,0.2)',
                  border: '1px solid rgba(232,152,10,0.4)',
                  borderRadius: 8, padding: '2px 8px',
                }}>
                  {meta.winner_by}
                </span>
              )}
            </div>
          </div>

          {(meta.venue_name || meta.venue_city) && (
            <div style={{
              fontSize: 12, color: 'rgba(255,255,255,0.45)',
              letterSpacing: 0.3, marginTop: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {meta.tournament_name} · {[meta.venue_name, meta.venue_city].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* ═══ ZONE 2 — STATS GRID ═══ */}
      {primaryStats.length > 0 && (
        <div style={{
          flex: '0 0 auto', padding: '10px 16px 0',
          animation: 'trc-fadeIn 0.5s ease-out both',
          animationDelay: '0.5s',
        }}>
          {/* Primary stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}>
            {primaryStats.map(stat => (
              <div key={stat.label} style={{
                textAlign: 'center' as const,
                padding: '12px 6px 10px',
                borderRadius: 10,
                background: stat.bg,
                border: `1px solid ${stat.border}`,
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                  {stat.v}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                  letterSpacing: 1, textTransform: 'uppercase' as const, marginTop: 4,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Secondary stats row */}
          {secondaryStats.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 6, marginTop: 6,
            }}>
              {secondaryStats.map(stat => (
                <div key={stat.label} style={{
                  textAlign: 'center' as const,
                  padding: '10px 6px 8px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}>
                    {stat.v}
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                    letterSpacing: 1, textTransform: 'uppercase' as const, marginTop: 3,
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ ZONE 3 — COURSE CARD ═══ */}
      <div style={{
        flex: '0 0 72px', position: 'relative', overflow: 'hidden',
        margin: '8px 16px', borderRadius: 12,
        background: meta.course_image_url ? 'transparent' : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 12px',
        animation: 'trc-fadeIn 0.5s ease-out both',
        animationDelay: '0.6s',
      }}>
        {/* Course photo background */}
        {meta.course_image_url && (
          <>
            <img
              src={meta.course_image_url}
              alt=""
              draggable={false}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover',
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, rgba(8,10,14,0.88) 35%, rgba(8,10,14,0.3) 100%)',
            }} />
          </>
        )}

        {/* Flag icon */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <GolfFlagIcon />
        </div>

        {/* Course text */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: '#fff',
            maxWidth: '55vw', overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
          }}>
            {meta.venue_name || 'TBD'}
          </div>
          {meta.venue_city && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
              {meta.venue_city}
            </div>
          )}
        </div>

        {/* Par / Purse pills — not in TournamentResultMeta, omitted per brief instruction */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 4 }}>
          {/* Placeholder: par & purse would go here if added to meta */}
        </div>
      </div>

      {/* ═══ ZONE 4 — FINAL STANDINGS ═══ */}
      <div style={{
        flex: '1 1 auto', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: 'rgba(0,0,0,0.95)',
      }}>
        <div style={{
          flex: '1 1 auto', overflow: 'auto',
          WebkitOverflowScrolling: 'touch' as const,
          padding: '0 16px',
        }}>
          {/* Section header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 10,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
              color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const,
            }}>
              Final Standings
            </span>
            <button
              onClick={handleViewResults}
              style={{
                fontSize: 12, fontWeight: 600, color: tour.accentColor,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Full results →
            </button>
          </div>

          {/* Winner row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 11,
            background: 'rgba(232,152,10,0.08)',
            border: '1px solid rgba(232,152,10,0.18)',
            marginBottom: 5,
            animation: 'trc-slideIn 0.5s ease-out both',
            animationDelay: '0.6s',
          }}>
            <span style={{ width: 24, textAlign: 'center' as const, fontSize: 14, fontWeight: 800, color: '#E8980A' }}>1</span>
            <RowAvatar src={winnerPhotoSrc} name={meta.winner_name} size={52} />
            <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {meta.winner_name}
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#E8980A', fontVariantNumeric: 'tabular-nums' as const }}>
              {meta.winner_score_display || 'E'}
            </span>
          </div>

          {/* Podium rows 2–5 */}
          {podiumRows.slice(0, 4).map((row, idx) => {
            const isTied = row.isTied && row.players.length > 1;
            const primary = row.players[0];
            const stackedAvatars = row.players.slice(0, 4);

            return (
              <div key={`${row.position}-${idx}`} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 11, marginBottom: 5,
                background: 'rgba(255,255,255,0.03)',
                animation: 'trc-slideIn 0.5s ease-out both',
                animationDelay: `${0.65 + idx * 0.08}s`,
              }}>
                <span style={{
                  width: 24, textAlign: 'center' as const,
                  fontSize: isTied ? 11 : 14, fontWeight: isTied ? 700 : 600,
                  color: isTied ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.45)',
                }}>
                  {row.isTied ? `T${row.position}` : row.position}
                </span>

                {isTied ? (
                  <div style={{ display: 'flex', alignItems: 'center', marginLeft: 0 }}>
                    {stackedAvatars.map((p, i) => (
                      <div key={i} style={{
                        marginLeft: i === 0 ? 0 : -12,
                        zIndex: stackedAvatars.length - i,
                        borderRadius: 10,
                        border: '2px solid #080a0e',
                        overflow: 'hidden',
                      }}>
                        <RowAvatar src={resolvePhoto(p.name, p.photoUrl)} name={p.name} size={36} />
                      </div>
                    ))}
                    {row.players.length > 4 && (
                      <div style={{
                        marginLeft: -12, zIndex: 0,
                        width: 32, height: 32, borderRadius: 9,
                        background: 'rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                        border: '2px solid #080a0e',
                      }}>
                        +{row.players.length - 4}
                      </div>
                    )}
                  </div>
                ) : (
                  <RowAvatar src={resolvePhoto(primary.name, primary.photoUrl)} name={primary.name} size={40} />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: isTied ? 600 : 600,
                    color: isTied ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.8)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  }}>
                    {isTied ? `${row.players.length}-Way Tie` : primary.name}
                  </div>
                  {isTied && (
                    <div style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                    }}>
                      {row.players.map(p => p.name.split(' ').pop()).join(' · ')}
                    </div>
                  )}
                </div>

                <span style={{
                  fontSize: 18, fontWeight: 700,
                  color: 'rgba(255,255,255,0.7)',
                  fontVariantNumeric: 'tabular-nums' as const,
                }}>
                  {primary.score || 'E'}
                </span>
              </div>
            );
          })}
        </div>

        {/* ═══ AI INSIGHT ═══ */}
        <div style={{
          flex: '0 0 auto', padding: '8px 16px',
          background: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
          animation: 'trc-fadeIn 0.6s ease-out both',
          animationDelay: '0.8s',
        }}>
          <span style={{ fontSize: 12, marginTop: 1 }}>⚡</span>
          <div style={{
            fontSize: 13, lineHeight: 1.4, color: 'rgba(255,255,255,0.6)',
            fontStyle: 'italic' as const,
          }}>
            {insight}
          </div>
        </div>

        {/* ═══ ZONE 5 — CTA BAR ═══ */}
        <div style={{
          flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px 16px',
          paddingBottom: 'max(env(safe-area-inset-bottom, 10px), 16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button onClick={handleLike} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: isLiked ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
            border: isLiked ? '1px solid rgba(245,158,11,0.35)' : '1px solid transparent',
            borderRadius: 12,
            padding: '10px 16px', cursor: 'pointer', color: isLiked ? '#f59e0b' : 'rgba(255,255,255,0.6)',
            fontSize: 15, fontWeight: 600, transition: 'all 0.2s',
            animation: heartPopping ? 'trc-heartPop 0.5s ease-out' : 'none',
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
            animation: 'trc-ctaPulse 2.5s ease-in-out infinite',
            animationDelay: '1.5s',
            boxShadow: '0 2px 12px rgba(232,152,10,0.3), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.15)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}>
            <span>💬</span>
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              Join the conversation
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

export default TournamentResultCard;
