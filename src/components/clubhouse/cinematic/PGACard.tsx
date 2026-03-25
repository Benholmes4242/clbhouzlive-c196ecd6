import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Trophy, Calendar, ChevronRight } from 'lucide-react';
import type { PGACardFeedPost, PGACardChaser } from '@/components/media-system/types/media';

interface PGACardProps {
  post: PGACardFeedPost;
  onComment: () => void;
  onLike: () => void;
  getLikeState?: (post: any) => { isLiked: boolean; count: number };
  getCommentCount?: (post: any) => number;
}

// ── Helpers ──
const formatPurse = (purse: number | null) => {
  if (!purse) return null;
  if (purse >= 1_000_000) return `$${(purse / 1_000_000).toFixed(1)}M`;
  return `$${(purse / 1_000).toFixed(0)}K`;
};

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
};

const getLastName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
};

const SQUIRCLE_RADIUS = '34%';
const ACCENT = '#E8980A';
const ACCENT_LIGHT = '#F59E0B';

// ── Stat Tile (live state) ──
const StatTile: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex-1 text-center">
    <div className="text-[22px] font-black" style={{ color }}>{value}</div>
    <div className="text-[10px] font-medium text-white/50 uppercase tracking-wider mt-0.5">{label}</div>
  </div>
);

// ── Season Stat Tile ──
const SeasonTile: React.FC<{ label: string; value: string | number | null }> = ({ label, value }) => (
  <div className="flex-1 text-center">
    <div className="text-[13px] font-bold text-white/80">{value ?? '—'}</div>
    <div className="text-[9px] font-medium text-white/40 uppercase tracking-wider mt-0.5">{label}</div>
  </div>
);

// ── Scoring Strip (live leader) ──
const ScoringStrip: React.FC<{ stats: { eagles: number; birdies: number; pars: number; bogeys: number; doubleBogeys: number } }> = ({ stats }) => (
  <div style={{ display: 'flex', gap: 5, marginBottom: 6, marginTop: 2 }}>
    {([
      { value: stats.eagles, label: 'Eagles', color: '#F59E0B' },
      { value: stats.birdies, label: 'Birdies', color: '#22C55E' },
      { value: stats.pars, label: 'Pars', color: '#94A3B8' },
      { value: stats.bogeys, label: 'Bogeys', color: '#EF4444' },
      { value: stats.doubleBogeys, label: 'Doubles', color: 'rgba(239,68,68,0.7)' },
    ] as const).map(({ value, label, color }) => (
      <div key={label} style={{ flex: 1, textAlign: 'center', padding: '9px 3px 7px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.7px', marginTop: 3 }}>{label}</div>
      </div>
    ))}
  </div>
);

// ── Chaser Row (live state) ──
const ChaserRow: React.FC<{ chaser: PGACardChaser }> = ({ chaser }) => (
  <div className="flex items-center gap-3 px-4 min-h-[44px] flex-1">
    <div className="text-[13px] font-bold text-white/50 w-5 text-center">
      {chaser.isTied ? 'T' : ''}{chaser.position}
    </div>
    {chaser.photoUrl ? (
      <div className="relative">
        <img src={chaser.photoUrl} alt="" className="w-8 h-8 object-cover" style={{ borderRadius: SQUIRCLE_RADIUS }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const fb = (e.target as HTMLImageElement).parentElement?.querySelector('[data-fallback]') as HTMLElement;
            if (fb) fb.style.display = 'flex';
          }}
        />
        <div data-fallback className="w-8 h-8 bg-white/10 items-center justify-center" style={{ display: 'none', borderRadius: SQUIRCLE_RADIUS }}>
          <span className="text-[11px] text-white/40">{getInitials(chaser.playerName)}</span>
        </div>
      </div>
    ) : (
      <div className="w-8 h-8 bg-white/10 flex items-center justify-center" style={{ borderRadius: SQUIRCLE_RADIUS }}>
        <span className="text-[11px] text-white/40">{getInitials(chaser.playerName)}</span>
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="text-[13px] font-semibold text-white/80 truncate">{chaser.playerName}</div>
      {chaser.scoringStats && (
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>E:{chaser.scoringStats.eagles}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>B:{chaser.scoringStats.birdies}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>P:{chaser.scoringStats.pars}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Bo:{chaser.scoringStats.bogeys}</span>
          {chaser.scoringStats.doubleBogeys > 0 && (
            <span style={{ fontSize: 10, color: 'rgba(239,68,68,0.5)' }}>D:{chaser.scoringStats.doubleBogeys}</span>
          )}
        </div>
      )}
    </div>
    <div className="text-[13px] font-bold text-white/60">{chaser.scoreDisplay ?? ''}</div>
  </div>
);

// ── Countdown Tile ──
const CountdownTile: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex-1 text-center">
    <div className="text-[28px] font-black text-indigo-300">{value}</div>
    <div className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-widest">{label}</div>
  </div>
);

// ── Golf Flag SVG Icon ──
const GolfFlagIcon: React.FC = () => (
  <div style={{
    width: 34, height: 34, borderRadius: 8,
    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }}>
    <svg width="18" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.8" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M12 2 L20 7 L12 12" />
    </svg>
  </div>
);

// ── Hero Avatar (full-bleed, no squircle) ──
const HeroAvatar: React.FC<{ src?: string | null; name: string }> = ({ src, name }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 0%' }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          const fb = (e.target as HTMLImageElement).parentElement?.querySelector('[data-fallback]') as HTMLElement;
          if (fb) fb.style.display = 'flex';
        }}
      />
    );
  }
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 64, fontWeight: 800, color: 'rgba(255,255,255,0.15)' }}>
        {getInitials(name)}
      </span>
    </div>
  );
};

// ── Row Avatar (small, for leaderboard) ──
const RowAvatar: React.FC<{ src?: string | null; name: string; size: number }> = ({ src, name, size }) => (
  <div style={{
    width: size, height: size, borderRadius: SQUIRCLE_RADIUS,
    overflow: 'hidden', background: 'rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }}>
    {src ? (
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
    ) : (
      <span style={{ fontSize: size * 0.35, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{getInitials(name)}</span>
    )}
  </div>
);

// ── Keyframes (injected once) ──
const ensureKeyframes = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes trc-fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes trc-slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes trc-fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes ctaPulse { 0%, 100% { box-shadow: 0 2px 14px rgba(232,152,10,0.35); } 50% { box-shadow: 0 4px 24px rgba(232,152,10,0.55); } }
    `;
    document.head.appendChild(style);
  };
})();

export const PGACard: React.FC<PGACardProps> = ({
  post,
  onComment,
  onLike,
  getLikeState,
  getCommentCount,
}) => {
  const cd = post.cardData;
  const isLoading = post.isLoading ?? false;
  const navigate = useNavigate();
  const likeState = getLikeState?.(post) ?? { isLiked: cd.isLikedByMe, count: cd.likeCount };
  const commentCount = getCommentCount?.(post) ?? cd.commentCount;

  // Inject keyframes
  ensureKeyframes();

  // Countdown for upcoming
  const countdown = useMemo(() => {
    if (cd.state !== 'upcoming' || !cd.startDate) return null;
    const diff = new Date(cd.startDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
    };
  }, [cd.state, cd.startDate]);

  // Group tied chasers for result state
  const chaserGroups = useMemo(() => {
    if (cd.state !== 'result') return null;
    const groups: Array<{ position: number; isTied: boolean; chasers: PGACardChaser[] }> = [];
    for (const c of cd.chasers) {
      const last = groups[groups.length - 1];
      if (last && last.position === c.position && c.isTied) {
        last.chasers.push(c);
      } else {
        groups.push({ position: c.position, isTied: !!c.isTied, chasers: [c] });
      }
    }
    return groups;
  }, [cd.state, cd.chasers]);

  // ── Skeleton state ──
  const showSkeleton = isLoading ||
    (cd.state === 'live' && !cd.leader) ||
    (cd.state === 'result' && !cd.leader);

  if (showSkeleton) {
    return (
      <div className="h-full w-full flex flex-col" style={{ background: '#080a0e' }}>
        <div style={{ height: 2.5, background: 'linear-gradient(90deg, rgba(245,158,11,0.8), transparent)', flexShrink: 0 }} />
        <div className="flex-1 flex flex-col gap-4 p-5 pt-14">
          <div className="rounded-lg animate-pulse" style={{ height: 24, width: '70%', background: 'rgba(255,255,255,0.08)' }} />
          <div className="rounded-2xl animate-pulse" style={{ height: 180, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }} />
          <div className="rounded-xl animate-pulse" style={{ height: 62, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
          <div className="flex flex-col gap-3 flex-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-xl animate-pulse flex-1" style={{ minHeight: 44, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        </div>
        <div className="flex gap-3 px-5 pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div className="rounded-2xl animate-pulse" style={{ width: 64, height: 44, background: 'rgba(255,255,255,0.06)' }} />
          <div className="rounded-2xl animate-pulse flex-1" style={{ height: 44, background: 'rgba(245,158,11,0.15)' }} />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // ██ RESULT STATE — Full-bleed 4-zone layout
  // ═══════════════════════════════════════════
  if (cd.state === 'result' && cd.leader) {
    const leaderStats = cd.leader.scoringStats;
    const seasonStats = cd.championSeasonStats;

    return (
      <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: '#080a0e', color: '#fff' }}>

        {/* ── ZONE 1: HERO — 55% ── */}
        <div style={{
          position: 'relative',
          flex: '0 0 55%',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Full-bleed winner headshot */}
          <div style={{
            position: 'absolute', inset: '-10px',
            background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
            willChange: 'transform',
          }}>
            <HeroAvatar src={cd.leader.photoUrl} name={cd.leader.playerName} />
            {/* Fallback for error */}
            <div data-fallback style={{
              display: 'none', position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 64, fontWeight: 800, color: 'rgba(255,255,255,0.15)' }}>
                {getInitials(cd.leader.playerName)}
              </span>
            </div>
          </div>

          {/* Bottom gradient */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '70%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Top gradient */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '30%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Tour badge — top left */}
          <div style={{
            position: 'absolute', top: 'calc(env(safe-area-inset-top, 44px) + 16px)', left: 'clamp(14px, 3.5vw, 20px)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              fontSize: 'clamp(9px, 2.2vw, 11px)', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: ACCENT_LIGHT,
              background: `${ACCENT_LIGHT}18`,
              border: `1px solid ${ACCENT_LIGHT}40`,
              borderRadius: 6, padding: '3px 8px',
            }}>
              PGA TOUR
            </span>
            <span style={{
              fontSize: 'clamp(9px, 2.2vw, 11px)', fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
            }}>
              FINAL
            </span>
          </div>

          {/* Winner info — bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: 'clamp(12px, 3vw, 18px) clamp(14px, 3.5vw, 20px)',
            animation: 'trc-fadeUp 0.7s ease-out both',
            animationDelay: '0.3s',
          }}>
            {/* Tournament name */}
            <div style={{
              fontSize: 'clamp(11px, 2.5vw, 13px)',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 0.3, marginBottom: 6,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {cd.tournamentName}
              {cd.venueName && ` · ${cd.venueName}`}
            </div>

            {/* Winner name */}
            <div style={{
              fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 800,
              color: '#fff', lineHeight: 1.05, letterSpacing: -0.5,
              marginBottom: 6,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {cd.leader.playerName}
            </div>

            {/* Score + margin */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 'clamp(20px, 5.5vw, 26px)', fontWeight: 800,
                color: ACCENT, lineHeight: 1,
              }}>
                {cd.leader.scoreDisplay || 'E'}
              </span>
              {cd.winnerBy && (
                <span style={{
                  fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 600,
                  color: 'rgba(255,255,255,0.65)',
                  background: `${ACCENT}22`,
                  border: `1px solid ${ACCENT}44`,
                  borderRadius: 6, padding: '2px 8px',
                }}>
                  {cd.winnerBy}
                </span>
              )}
            </div>

            {/* Scoring stats row — directly under score */}
            {leaderStats && (
              <div style={{
                display: 'flex', gap: 4, marginTop: 12,
              }}>
                {[
                  { v: leaderStats.eagles, label: 'Eagles', color: '#F59E0B' },
                  { v: leaderStats.birdies, label: 'Birdies', color: '#22C55E' },
                  { v: leaderStats.pars, label: 'Pars', color: 'rgba(255,255,255,0.75)' },
                  { v: leaderStats.bogeys, label: 'Bogeys', color: '#F97316' },
                  { v: leaderStats.doubleBogeys, label: 'Doubles', color: '#EF4444' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    flex: 1, textAlign: 'center',
                    padding: '7px 2px 5px',
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}>
                    <div style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                      {stat.v}
                    </div>
                    <div style={{ fontSize: 'clamp(7px, 1.8vw, 9px)', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 3 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Season averages row */}
            {seasonStats && (
              <div style={{ marginTop: 8 }}>
                <div style={{
                  fontSize: 'clamp(8px, 2vw, 9px)', fontWeight: 700,
                  color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                  letterSpacing: '1px', marginBottom: 4,
                }}>
                  Season Averages
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[
                    { v: seasonStats.drivingDistance ? `${Math.round(seasonStats.drivingDistance)}y` : null, label: 'Driver' },
                    { v: seasonStats.drivingAccuracy ? `${Math.round(seasonStats.drivingAccuracy)}%` : null, label: 'Accuracy' },
                    { v: seasonStats.greensInReg ? `${Math.round(seasonStats.greensInReg)}%` : null, label: 'GIR' },
                    { v: seasonStats.puttingAverage != null ? Number(seasonStats.puttingAverage).toFixed(1) : null, label: 'Putting' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      flex: 1, textAlign: 'center',
                      padding: '5px 2px 4px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>
                        {stat.v ?? '—'}
                      </div>
                      <div style={{ fontSize: 'clamp(7px, 1.8vw, 9px)', fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 3 }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── ZONE 3: LEADERBOARD ── */}
        <div style={{
          flex: '1 1 auto',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.95)',
          minHeight: 0,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3.5vw, 20px) 4px',
          }}>
            <span style={{
              fontSize: 'clamp(9px, 2.2vw, 11px)', fontWeight: 700,
              letterSpacing: '1.2px', color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
            }}>
              Final Standings
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/tourhub/tournament/${cd.tournamentId}`); }}
              className="flex items-center gap-1 text-amber-500 text-xs font-semibold active:opacity-70 transition-opacity"
            >
              Full Results
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Rows — fills remaining space evenly */}
          <div style={{
            flex: '1 1 auto',
            overflow: 'hidden',
            padding: '0 clamp(14px, 3.5vw, 20px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly',
          }}>
            {/* Winner row — highlighted, small avatar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px',
              borderRadius: 10,
              background: `${ACCENT}10`,
              border: `1px solid ${ACCENT}22`,
              animation: 'trc-slideIn 0.5s ease-out both',
              animationDelay: '0.5s',
            }}>
              <span style={{
                width: 22, textAlign: 'center',
                fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 700,
                color: ACCENT,
              }}>1</span>
              <RowAvatar src={cd.leader.photoUrl} name={cd.leader.playerName} size={30} />
              <span style={{
                flex: 1, fontSize: 'clamp(13px, 3.2vw, 15px)', fontWeight: 700,
                color: '#fff',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {cd.leader.playerName}
              </span>
              <span style={{
                fontSize: 'clamp(13px, 3.2vw, 15px)', fontWeight: 800,
                color: ACCENT,
              }}>
                {cd.leader.scoreDisplay || 'E'}
              </span>
            </div>

            {/* Positions 2+ */}
            {chaserGroups?.map((group, gi) => {
              const isTied = group.isTied && group.chasers.length > 1;
              const primary = group.chasers[0];
              const stackedAvatars = group.chasers.slice(0, 3);

              return (
                <div key={`${group.position}-${gi}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 10px',
                  borderRadius: 8,
                  animation: 'trc-slideIn 0.5s ease-out both',
                  animationDelay: `${0.55 + gi * 0.07}s`,
                }}>
                  <span style={{
                    width: 22, textAlign: 'center',
                    fontSize: 'clamp(11px, 2.8vw, 13px)', fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    {group.isTied ? `T${group.position}` : group.position}
                  </span>

                  {isTied ? (
                    <div style={{ display: 'flex' }}>
                      {stackedAvatars.map((p, i) => (
                        <div key={i} style={{
                          marginLeft: i === 0 ? 0 : -8,
                          zIndex: stackedAvatars.length - i,
                          border: '1.5px solid rgba(8,10,14,0.8)',
                          borderRadius: SQUIRCLE_RADIUS, overflow: 'hidden',
                        }}>
                          <RowAvatar src={p.photoUrl} name={p.playerName} size={28} />
                        </div>
                      ))}
                      {group.chasers.length > 3 && (
                        <div style={{
                          marginLeft: -6, zIndex: 0, width: 26, height: 26,
                          borderRadius: SQUIRCLE_RADIUS, background: 'rgba(255,255,255,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                          border: '1.5px solid rgba(8,10,14,0.8)',
                        }}>
                          +{group.chasers.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <RowAvatar src={primary.photoUrl} name={primary.playerName} size={30} />
                  )}

                  <span style={{
                    flex: 1,
                    fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 500,
                    color: 'rgba(255,255,255,0.75)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {isTied ? (
                      <>
                        {group.chasers.length}-Way Tie
                        <span style={{ display: 'block', fontSize: 'clamp(9px, 2.2vw, 11px)', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                          {group.chasers.map(c => getLastName(c.playerName)).join(' · ')}
                        </span>
                      </>
                    ) : primary.playerName}
                  </span>

                  <span style={{
                    fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 600,
                    color: 'rgba(255,255,255,0.55)',
                  }}>
                    {primary.scoreDisplay || 'E'}
                  </span>
                </div>
              );
            })}

            {/* Stats moved to hero zone */}
          </div>
        </div>

        {/* ── ZONE 4: CTA BAR ── */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-5 pt-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          <button
            onClick={onLike}
            className="flex items-center gap-1.5 transition-transform active:scale-95"
            style={{
              background: likeState.isLiked ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${likeState.isLiked ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.10)'}`,
              borderRadius: 14, padding: '11px 16px',
            }}
          >
            <Heart style={{ width: 17, height: 17, color: likeState.isLiked ? '#f59e0b' : '#6b7280', fill: likeState.isLiked ? '#f59e0b' : 'transparent' }} />
            {likeState.count > 0 && (
              <span className="text-[14px] font-bold" style={{ color: likeState.isLiked ? '#f59e0b' : '#6b7280' }}>
                {formatCount(likeState.count)}
              </span>
            )}
          </button>
          <button
            onClick={onComment}
            className="flex-1 relative flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] transition-transform active:scale-[0.98]"
            style={{
              background: 'linear-gradient(180deg, #E8A012 0%, #C77008 100%)',
              border: '1px solid rgba(232,152,10,0.55)',
              borderTopColor: 'rgba(255,210,100,0.4)',
              boxShadow: '0 2px 14px rgba(232,152,10,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.15)',
              animation: 'ctaPulse 2.5s ease-in-out infinite',
              color: '#fff',
            }}
          >
            <MessageCircle className="w-4 h-4" />
            Your reaction?
            {commentCount > 0 && (
              <span style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>
                {formatCount(commentCount)}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // ██ LIVE + UPCOMING STATES (existing layout)
  // ═══════════════════════════════════════════
  const glowColor = cd.state === 'live'
    ? 'rgba(245,158,11,0.13)'
    : 'rgba(99,102,241,0.09)';

  const ctaLabel = cd.state === 'live' ? 'Who wins this?' : 'Who takes it?';

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: '#080a0e', color: '#fff' }}>
      {/* ── Gradient Header ── */}
      <div className="flex-shrink-0 relative" style={{ background: 'linear-gradient(180deg, #141c2e 0%, #0d1525 45%, #080a0e 100%)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)` }} />
        <div className="w-full" style={{
          height: '2.5px',
          background: cd.state === 'live'
            ? 'linear-gradient(90deg, #f59e0bCC, transparent)'
            : 'linear-gradient(90deg, #6366f1CC, transparent)',
        }} />

        <div className="px-5 pt-3.5 pb-4">
          {/* Badge row */}
          <div className="flex items-center gap-2 mb-2">
            {cd.state === 'live' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] font-bold text-green-400 uppercase tracking-wider">Live</span>
              </div>
            )}
            {cd.state === 'upcoming' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Upcoming</span>
              </div>
            )}
            <span className="text-[11px] font-medium text-white/40">
              PGA TOUR{cd.roundLabel ? ` · ${cd.roundLabel}` : ''}
            </span>
          </div>

          <h2 className="text-[17px] font-extrabold leading-tight mb-3">{cd.tournamentName}</h2>

          {/* ── LIVE: Leader card ── */}
          {cd.state === 'live' && cd.leader && (
            <div className="rounded-2xl p-3.5 mb-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="flex items-center gap-3">
                {cd.leader.photoUrl ? (
                  <div className="relative">
                    <img src={cd.leader.photoUrl} alt={cd.leader.playerName} className="w-[50px] h-[50px] object-cover" style={{ borderRadius: SQUIRCLE_RADIUS, boxShadow: '0 0 16px rgba(245,158,11,0.25)' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fb = (e.target as HTMLImageElement).parentElement?.querySelector('[data-fallback]') as HTMLElement;
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                    <div data-fallback className="w-[50px] h-[50px] bg-amber-900/30 items-center justify-center" style={{ display: 'none', borderRadius: SQUIRCLE_RADIUS }}>
                      <span className="text-amber-400 text-sm font-bold">{getInitials(cd.leader.playerName)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-[50px] h-[50px] bg-amber-900/30 flex items-center justify-center" style={{ borderRadius: SQUIRCLE_RADIUS }}>
                    <span className="text-amber-400 text-sm font-bold">{getInitials(cd.leader.playerName)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate">{cd.leader.playerName}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {cd.leader.thru && <span className="text-[11px] text-white/50">Thru {cd.leader.thru}</span>}
                    {cd.leader.today && <span className="text-[11px] text-white/50">Today {cd.leader.today}</span>}
                  </div>
                </div>
                <div className="text-[34px] font-black text-amber-400 leading-none">{cd.leader.scoreDisplay}</div>
              </div>
              {cd.leader.scoringStats && <ScoringStrip stats={cd.leader.scoringStats} />}
            </div>
          )}

          {/* ── UPCOMING: Countdown ── */}
          {cd.state === 'upcoming' && countdown && (
            <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="flex items-center justify-around">
                <CountdownTile value={countdown.days} label="Days" />
                <div className="text-indigo-400/30 text-lg font-thin">:</div>
                <CountdownTile value={countdown.hours} label="Hrs" />
                <div className="text-indigo-400/30 text-lg font-thin">:</div>
                <CountdownTile value={countdown.minutes} label="Min" />
              </div>
            </div>
          )}

          {/* Stat tiles — live only */}
          {cd.leaderStats && (
            <>
              <div className="h-px bg-white/5 my-2.5" />
              <div className="flex items-center gap-1 mb-2">
                <StatTile label="Eagles" value={cd.leaderStats.totalEagles} color="#f59e0b" />
                <StatTile label="Birdies" value={cd.leaderStats.totalBirdies} color="#22c55e" />
                <StatTile label="Pars" value={cd.leaderStats.totalPars} color="#94a3b8" />
                <StatTile label="Bogeys" value={cd.leaderStats.totalBogeys} color="#ef4444" />
              </div>
              <div className="flex items-center gap-1 mb-2">
                <SeasonTile label="Driver" value={cd.leaderStats.drivingDistance ? `${cd.leaderStats.drivingDistance}y` : null} />
                <SeasonTile label="Accuracy" value={cd.leaderStats.drivingAccuracy ? `${cd.leaderStats.drivingAccuracy}%` : null} />
                <SeasonTile label="GIR" value={cd.leaderStats.greensInReg ? `${cd.leaderStats.greensInReg}%` : null} />
                <SeasonTile label="Putts" value={cd.leaderStats.puttingAverage} />
              </div>
            </>
          )}

          {/* Insight */}
          {cd.insight && (
            <p className="text-[11.5px] italic text-white/40 mt-1.5">{cd.insight}</p>
          )}
        </div>
      </div>

      {/* ── Course Strip ── */}
      <div className="flex-shrink-0" style={{ margin: '10px 16px 0', borderRadius: 12, overflow: 'hidden', position: 'relative', height: 72, border: '1px solid rgba(255,255,255,0.08)' }}>
        {cd.courseImageUrl ? (
          <>
            <img src={cd.courseImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,10,14,0.9) 35%, rgba(8,10,14,0.3) 100%)' }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)' }} />
        )}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, height: '100%', padding: '0 14px' }}>
          <GolfFlagIcon />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', maxWidth: '55vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cd.venueName ?? 'TBD'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{cd.venueCity ?? ''}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {cd.venuePar && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '3px 8px' }}>Par {cd.venuePar}</span>
            )}
            {cd.purse && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '3px 8px' }}>{formatPurse(cd.purse)}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Chasers ── */}
      <div className="flex-1 flex flex-col min-h-0 px-1">
        <div className="flex items-center justify-between px-4 pt-2 pb-1">
          <span className="text-[12px] font-bold text-white/50 uppercase tracking-wider">
            {cd.state === 'upcoming' ? 'Course Info' : 'In Contention'}
          </span>
          {cd.state === 'live' && (
            <span className="text-[11px] font-semibold text-amber-400/80">Full leaderboard →</span>
          )}
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {cd.chasers.length > 0 ? (
            cd.chasers.map((c, i) => <ChaserRow key={i} chaser={c} />)
          ) : cd.state === 'upcoming' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-white/30">
              <Calendar className="w-8 h-8" />
              <span className="text-[12px]">Tournament starts {cd.startDate ? new Date(cd.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'soon'}</span>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/20 text-[12px]">No data available</div>
          )}
        </div>
      </div>

      {/* ── CTA Bar ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <button onClick={onLike} className="flex items-center gap-1.5 transition-transform active:scale-95" style={{
          background: likeState.isLiked ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.07)',
          border: `1px solid ${likeState.isLiked ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.10)'}`,
          borderRadius: 14, padding: '11px 16px',
        }}>
          <Heart style={{ width: 17, height: 17, color: likeState.isLiked ? '#f59e0b' : '#6b7280', fill: likeState.isLiked ? '#f59e0b' : 'transparent' }} />
          {likeState.count > 0 && (
            <span className="text-[14px] font-bold" style={{ color: likeState.isLiked ? '#f59e0b' : '#6b7280' }}>{formatCount(likeState.count)}</span>
          )}
        </button>
        <button onClick={onComment} className="flex-1 relative flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] transition-transform active:scale-[0.98]" style={{
          background: cd.state === 'live' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
          animation: cd.state === 'live' ? 'ctaPulse 2.5s ease-in-out infinite' : undefined,
          color: '#fff',
        }}>
          <MessageCircle className="w-4 h-4" />
          {ctaLabel}
          {commentCount > 0 && (
            <span style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>{formatCount(commentCount)}</span>
          )}
        </button>
      </div>
    </div>
  );
};
