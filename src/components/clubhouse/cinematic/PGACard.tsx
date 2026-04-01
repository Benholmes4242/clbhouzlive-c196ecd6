import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Trophy, Calendar, ChevronRight, MapPin, Shield } from 'lucide-react';
import type { PGACardFeedPost, PGACardChaser } from '@/components/media-system/types/media';
import { EchoContextualButton } from '@/components/echo/EchoContextualButton';

function getBestRoundLabel(leaderThru?: string | null): string | null {
  const roundFinished = leaderThru != null && String(leaderThru).toUpperCase() === 'F';
  if (!roundFinished) return null;
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  return now <= midnight ? 'BEST TODAY' : null;
}

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
const RowAvatar: React.FC<{ src?: string | null; name: string; size?: number; fluid?: string }> = ({ src, name, size, fluid }) => {
  const dim = fluid || `${size ?? 30}px`;
  return (
    <div style={{
      width: dim, height: dim, borderRadius: SQUIRCLE_RADIUS,
      overflow: 'hidden', background: 'rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      aspectRatio: '1',
    }}>
      {src ? (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 0%' }} />
      ) : (
        <span style={{ fontSize: `calc(${dim} * 0.35)`, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{getInitials(name)}</span>
      )}
    </div>
  );
};

// ── Digit Cell (upcoming countdown) ──
const DigitCell: React.FC<{ value: number; label: string; isAccent?: boolean }> = ({ value, label, isAccent }) => (
  <div style={{
    flex: 1, textAlign: 'center',
    padding: '10px 4px 8px',
    borderRadius: 10,
    background: isAccent ? `${ACCENT_LIGHT}14` : 'rgba(255,255,255,0.05)',
    border: `1px solid ${isAccent ? `${ACCENT_LIGHT}30` : 'rgba(255,255,255,0.09)'}`,
    position: 'relative',
    overflow: 'hidden',
  }}>
    {isAccent && (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        animation: 'shimmer 2s ease-in-out infinite',
      }} />
    )}
    <div style={{
      fontSize: 'clamp(22px, 5.5vw, 28px)', fontWeight: 900,
      color: isAccent ? ACCENT_LIGHT : '#fff',
      lineHeight: 1, position: 'relative',
    }}>
      {String(value).padStart(2, '0')}
    </div>
    <div style={{
      fontSize: 'clamp(8px, 2vw, 9px)', fontWeight: 700,
      color: isAccent ? `${ACCENT_LIGHT}90` : 'rgba(255,255,255,0.35)',
      textTransform: 'uppercase', letterSpacing: '0.8px',
      marginTop: 4, position: 'relative',
    }}>
      {label}
    </div>
  </div>
);

// ── Pulsing dot separator ──
const PulseDot: React.FC = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: '0 2px',
  }}>
    <div style={{
      width: 4, height: 4, borderRadius: '50%',
      background: 'rgba(255,255,255,0.3)',
      animation: 'tickPulse 1s ease-in-out infinite',
    }} />
    <div style={{
      width: 4, height: 4, borderRadius: '50%',
      background: 'rgba(255,255,255,0.3)',
      animation: 'tickPulse 1s ease-in-out infinite',
      animationDelay: '0.5s',
    }} />
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
      @keyframes courseScan { 0% { transform:scale(1); } 100% { transform:scale(1.04); } }
      @keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(200%); } }
      @keyframes tickPulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes shieldGlow { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
      @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
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

  // Force re-render every second for upcoming countdown
  const [countdownTick, setCountdownTick] = useState(0);
  useEffect(() => {
    if (cd.state !== 'upcoming') return;
    const id = setInterval(() => setCountdownTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [cd.state]);

  // Countdown for upcoming (now includes seconds)
  const countdown = useMemo(() => {
    if (cd.state !== 'upcoming' || !cd.startDate) return null;
    const startDateTime = cd.startDate.includes('T') ? cd.startDate : `${cd.startDate}T12:00:00`;
    const diff = new Date(startDateTime).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [cd.state, cd.startDate, countdownTick]);

  // Group tied chasers for result and live states
  const chaserGroups = useMemo(() => {
    if (cd.state !== 'result' && cd.state !== 'live') return null;
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

  // ── Skeleton state — only while cardData hasn't resolved ──
  const showSkeleton = isLoading && !post.cardData;

  if (showSkeleton) {
    return (
      <div className="h-full w-full flex flex-col" style={{ background: '#080a0e' }}>
        {/* Amber accent line */}
        <div style={{ height: 2.5, background: 'linear-gradient(90deg, rgba(245,158,11,0.8), transparent)', flexShrink: 0 }} />

        {/* Hero zone skeleton — 58% */}
        <div style={{ flex: '0 0 58%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #0a1628, #060c16)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(12px,3vw,16px) clamp(14px,3.5vw,18px)' }}>
          {/* Tournament name skeleton */}
          <div style={{ height: 'clamp(20px,5vw,26px)', width: '75%', borderRadius: 6, background: 'rgba(255,255,255,0.08)', marginBottom: 'clamp(8px,2vw,10px)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)' }} />

          {/* Leader glass panel skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 'clamp(9px,2.5vw,11px) clamp(10px,2.5vw,13px)', marginBottom: 'clamp(6px,1.5vw,8px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 'clamp(40px,11vw,50px)', height: 'clamp(42px,11.5vw,53px)', borderRadius: '34%', background: 'rgba(255,255,255,0.08)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)' }} />
              <div>
                <div style={{ height: 14, width: 'clamp(90px,25vw,120px)', borderRadius: 5, background: 'rgba(255,255,255,0.08)', marginBottom: 7, animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)' }} />
                <div style={{ height: 9, width: 60, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>
            <div style={{ height: 'clamp(26px,7vw,34px)', width: 44, borderRadius: 6, background: 'rgba(255,255,255,0.08)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)' }} />
          </div>

          {/* Stat strip skeleton — 5 chips */}
          <div style={{ display: 'flex', gap: 'clamp(3px,1vw,5px)' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ flex: 1, height: 'clamp(38px,10vw,46px)', borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)' }} />
            ))}
          </div>
        </div>

        {/* Leaderboard zone skeleton */}
        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.95)', padding: 'clamp(8px,2vw,12px) clamp(14px,3.5vw,18px)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(249,115,22,0.3)' }} />
              <div style={{ height: 8, width: 80, borderRadius: 4, background: 'rgba(249,115,22,0.15)' }} />
            </div>
            <div style={{ height: 8, width: 90, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Insight line */}
          <div style={{ height: 9, width: '55%', borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }} />

          {/* Separator */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />

          {/* 3 chaser row skeletons */}
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'clamp(5px,1.5vw,8px) 8px', marginBottom: 4 }}>
              <div style={{ width: 22, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
              <div style={{ width: 36, height: 36, borderRadius: '34%', background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: 11, borderRadius: 5, background: 'rgba(255,255,255,0.06)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)' }} />
              <div style={{ width: 30, height: 11, borderRadius: 5, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
            </div>
          ))}

          {/* Best today strip skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, padding: 'clamp(6px,1.8vw,8px) clamp(10px,2.5vw,12px)', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ height: 8, width: 60, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ height: 10, width: 70, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ height: 10, width: 70, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
            </div>
          </div>
        </div>

        {/* CTA bar skeleton */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px clamp(14px,3.5vw,18px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 64, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ flex: 1, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.15)' }} />
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
            position: 'absolute', top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)', left: 12,
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
                      background: 'rgba(0,0,0,0.45)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.10)',
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

          {/* Rows — each row grows to fill available space */}
          <div style={{
            flex: '1 1 auto',
            overflow: 'hidden',
            padding: '0 clamp(14px, 3.5vw, 20px)',
            display: 'flex', flexDirection: 'column', gap: 'clamp(3px, 0.6vh, 6px)', paddingBottom: 'clamp(4px, 1vh, 10px)',
          }}>
            {/* Winner row — highlighted, small avatar */}
            <div style={{
              flex: '1 1 0', minHeight: 0,
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 10px',
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
              <RowAvatar src={cd.leader.photoUrl} name={cd.leader.playerName} fluid="clamp(30px, 5vh, 44px)" />
              <span style={{
                flex: 1, fontSize: 'clamp(13px, 2vh, 18px)', fontWeight: 700,
                color: '#fff',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {cd.leader.playerName}
              </span>
              <span style={{
                fontSize: 'clamp(13px, 2vh, 18px)', fontWeight: 800,
                color: ACCENT,
              }}>
                {cd.leader.scoreDisplay || 'E'}
              </span>
            </div>

            {/* Positions 2+ */}
            {chaserGroups?.slice(0, 3).map((group, gi) => {
              const isTied = group.isTied && group.chasers.length > 1;
              const primary = group.chasers[0];
              const stackedAvatars = group.chasers.slice(0, 3);

              return (
                <div key={`${group.position}-${gi}`} style={{
                  flex: '1 1 0', minHeight: 0,
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0 10px',
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
                          <RowAvatar src={p.photoUrl} name={p.playerName} fluid="clamp(26px, 4.5vh, 40px)" />
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
                    <RowAvatar src={primary.photoUrl} name={primary.playerName} fluid="clamp(28px, 5vh, 44px)" />
                  )}

                  <span style={{
                    flex: 1,
                    fontSize: 'clamp(12px, 1.8vh, 17px)', fontWeight: 500,
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
                    fontSize: 'clamp(12px, 1.8vh, 17px)', fontWeight: 600,
                    color: 'rgba(255,255,255,0.55)',
                  }}>
                    {primary.scoreDisplay || 'E'}
                  </span>
                </div>
              );
            })}
            {chaserGroups && chaserGroups.length > 3 && (
              <div style={{ padding: '4px 10px', fontSize: 11,
                color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                +{chaserGroups.length - 3} more positions in contention
              </div>
            )}
          </div>
        </div>

        {/* Echo — live tournament intel */}
        <div style={{ padding: '6px 16px 2px' }}>
          <EchoContextualButton
            prompt={`It's ${new Date().getFullYear()} and ${cd.tournamentName} is happening live right now at ${cd.venueName || 'the course'}${cd.venueCity ? ` in ${cd.venueCity}` : ''}${cd.leader ? `. The current leader is ${cd.leader.playerName} at ${cd.leader.scoreDisplay}` : ''}${cd.chasers?.[0] ? `, with ${cd.chasers[0].playerName} close behind` : ''}. It's ${cd.roundLabel}. Search for the latest live leaderboard, tell me who is likely to win from here, what the key storylines are today, and which players I should be watching.`}
            label="Ask Echo for live intel"
            sublabel="Live leaderboard · who to watch"
            source="pga_card_live"
          />
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
  // ██ UPCOMING STATE — Cinematic 3-zone layout
  // ═══════════════════════════════════════════
  if (cd.state === 'upcoming') {
    const defendingChampion = cd.defendingChampion;
    const dateRange = cd.startDate && cd.endDate
      ? `${new Date(cd.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(cd.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : null;

    return (
      <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: '#080a0e', color: '#fff' }}>

        {/* ── ZONE 1: CINEMATIC HERO — 55% ── */}
        <div style={{
          position: 'relative',
          flex: '0 0 55%',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Base gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #0a1628, #0d2340, #0a1628, #060c16)',
          }} />

          {/* Topographic pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.07,
          }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="topo" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                  <path d="M20 100 Q60 60, 100 100 T180 100" fill="none" stroke="white" strokeWidth="0.8" />
                  <path d="M20 60 Q60 20, 100 60 T180 60" fill="none" stroke="white" strokeWidth="0.6" />
                  <path d="M20 140 Q60 100, 100 140 T180 140" fill="none" stroke="white" strokeWidth="0.6" />
                  <circle cx="140" cy="80" r="20" fill="none" stroke="white" strokeWidth="0.5" />
                  <circle cx="140" cy="80" r="35" fill="none" stroke="white" strokeWidth="0.4" />
                  <circle cx="60" cy="160" r="15" fill="none" stroke="white" strokeWidth="0.5" />
                  <circle cx="60" cy="160" r="28" fill="none" stroke="white" strokeWidth="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#topo)" />
            </svg>
          </div>

          {/* Amber radial glow */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 50% 35%, rgba(232,152,10,0.15) 0%, transparent 70%)',
          }} />

          {/* Slow scan animation layer */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.015), transparent, rgba(255,255,255,0.015))',
            animation: 'courseScan 8s ease-in-out alternate infinite',
          }} />

          {/* Course image if available */}
          {cd.courseImageUrl && (
            <img
              src={cd.courseImageUrl}
              alt=""
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', opacity: 0.35,
              }}
            />
          )}

          {/* Bottom gradient scrim */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '75%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Top gradient */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '30%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Tour badge — top left */}
          <div style={{
            position: 'absolute', top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)', left: 12,
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
              UPCOMING
            </span>
          </div>

          {/* Bottom content */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: 'clamp(12px, 3vw, 18px) clamp(14px, 3.5vw, 20px)',
            animation: 'trc-fadeUp 0.7s ease-out both',
            animationDelay: '0.3s',
          }}>
            {/* Date range */}
            {dateRange && (
              <div style={{
                fontSize: 'clamp(11px, 2.5vw, 13px)',
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: 0.3, marginBottom: 6,
              }}>
                {dateRange}
              </div>
            )}

            {/* Tournament name */}
            <div style={{
              fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 800,
              color: '#fff', lineHeight: 1.05, letterSpacing: -0.5,
              marginBottom: 6,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {cd.tournamentName}
            </div>

            {/* Venue line */}
            {cd.venueName && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                color: 'rgba(255,255,255,0.4)',
                fontSize: 'clamp(11px, 2.5vw, 13px)',
                marginBottom: 14,
              }}>
                <MapPin style={{ width: 13, height: 13, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cd.venueName}{cd.venueCity ? `, ${cd.venueCity}` : ''}
                </span>
              </div>
            )}

            {/* Countdown grid */}
            {countdown && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <DigitCell value={countdown.days} label="Days" />
                <PulseDot />
                <DigitCell value={countdown.hours} label="Hrs" />
                <PulseDot />
                <DigitCell value={countdown.minutes} label="Min" />
                <PulseDot />
                <DigitCell value={countdown.seconds} label="Sec" isAccent />
              </div>
            )}
          </div>
        </div>

        {/* ── ZONE 2: COURSE FACTS + PAST WINNERS ── */}
        <div style={{
          flex: '1 1 auto',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.95)',
          minHeight: 0,
        }}>
          {/* Course facts row */}
          <div style={{
            display: 'flex', gap: 5,
            padding: 'clamp(10px, 2.5vw, 14px) clamp(14px, 3.5vw, 20px) 8px',
          }}>
            {[
              { value: cd.venuePar ? `Par ${cd.venuePar}` : null, label: 'Course' },
              { value: cd.venueYardage ? `${cd.venueYardage.toLocaleString()}y` : null, label: 'Yardage' },
              { value: formatPurse(cd.purse), label: 'Purse' },
            ].filter(f => f.value).map(fact => (
              <div key={fact.label} style={{
                flex: 1, textAlign: 'center',
                padding: '8px 10px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                  {fact.value}
                </div>
                <div style={{
                  fontSize: 9, fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                  marginTop: 4,
                }}>
                  {fact.label}
                </div>
              </div>
            ))}
          </div>

          {/* Defending Champion Block — centered between course facts and CTA */}
          <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {defendingChampion ? (
            <div style={{
              position: 'relative',
              margin: '0 clamp(14px, 3.5vw, 20px)',
              padding: '16px 18px',
              borderRadius: 14,
              background: `linear-gradient(135deg, ${ACCENT}0d, ${ACCENT}05)`,
              border: `1px solid ${ACCENT}22`,
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', gap: 16,
              width: '100%',
              animation: 'slideUp 0.5s ease-out both',
              animationDelay: '0.35s',
            }}>
              {/* Avatar — squircle */}
              <div style={{
                width: 58, height: 58, borderRadius: SQUIRCLE_RADIUS, flexShrink: 0,
                overflow: 'hidden',
                border: `2px solid ${ACCENT}44`,
                background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              }}>
                {cd.defendingChampionPhotoUrl
                  ? <img src={cd.defendingChampionPhotoUrl} alt={defendingChampion} style={{
                      width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 0%',
                    }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  : <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                      {getInitials(defendingChampion)}
                    </span>
                }
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 'clamp(10px, 2.4vw, 12px)', fontWeight: 600,
                  color: ACCENT_LIGHT, textTransform: 'uppercase', letterSpacing: '1px',
                  marginBottom: 3,
                }}>
                  <Shield style={{ width: 12, height: 12 }} />
                  Defending Champion
                </div>
                <div style={{
                  fontSize: 'clamp(17px, 4.5vw, 20px)', fontWeight: 800,
                  color: '#fff', lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {defendingChampion}
                </div>
                <div style={{
                  fontSize: 'clamp(11px, 2.8vw, 13px)', fontWeight: 500,
                  color: 'rgba(255,255,255,0.35)', marginTop: 3,
                  fontStyle: 'italic',
                }}>
                  Can they go back-to-back?
                </div>
              </div>

              {/* Trophy emoji */}
              <span style={{ flexShrink: 0, fontSize: 30, position: 'relative', zIndex: 1 }}>🏆</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-white/30">
              <Calendar className="w-8 h-8" />
              <span className="text-[12px]">
                Tournament starts {cd.startDate ? new Date(cd.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'soon'}
              </span>
            </div>
          )}
          </div>
        </div>

        {/* Echo — completed tournament recap */}
        <div style={{ padding: '6px 16px 2px' }}>
          <EchoContextualButton
            prompt={`Search for the ${new Date().getFullYear()} ${cd.tournamentName} result${cd.venueName ? ` at ${cd.venueName}` : ''}${cd.leader ? `. The winner appears to be ${cd.leader.playerName} at ${cd.leader.scoreDisplay}${cd.winnerBy ? `, winning by ${cd.winnerBy}` : ''}` : ''}. Tell me what happened, how the winner played across the week, what the key moments were, and what this result means for their season.`}
            label="Ask Echo about the result"
            sublabel="Winner story · key moments"
            source="pga_card_result"
          />
        </div>

        {/* ── ZONE 3: CTA BAR ── */}
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
            Who takes it?
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
  // ██ LIVE STATE — Cinematic 3-zone layout
  // ═══════════════════════════════════════════

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: '#080a0e', color: '#fff' }}>

      {/* ── ZONE 1: CINEMATIC HERO — 58% ── */}
      <div style={{
        position: 'relative',
        flex: '0 0 58%',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Background: course image or gradient fallback */}
        {cd.courseImageUrl ? (
          <img src={cd.courseImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 1, animation: 'courseScan 10s ease-in-out infinite alternate' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #0a1628, #0d2340, #060c16)' }} />
        )}

        {/* Amber radial overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 20%, rgba(232,152,10,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Bottom gradient */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Top gradient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Live badge — top left */}
        <div style={{ position: 'absolute', top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)', left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '3px 8px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'dotPulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 'clamp(9px, 2.2vw, 11px)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#22C55E' }}>Live</span>
          </div>
          <span style={{ fontSize: 'clamp(9px, 2.2vw, 11px)', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
            PGA TOUR
          </span>
        </div>

        {/* Bottom content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(12px, 3vw, 16px) clamp(14px, 3.5vw, 18px)', animation: 'trc-fadeUp 0.7s ease-out both', animationDelay: '0.3s' }}>

          {/* Tournament name */}
          <div style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 800, color: '#fff', lineHeight: 1.05, letterSpacing: -0.5, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cd.tournamentName}
          </div>

          {cd.leader ? (
            <>
              {/* ── LEADER GLASS PANEL ── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.11)',
                borderRadius: 'clamp(10px, 2.5vw, 14px)',
                padding: 'clamp(9px, 2.5vw, 11px) clamp(10px, 2.5vw, 13px)',
                marginBottom: 'clamp(6px, 1.5vw, 8px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 10px)' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 'clamp(40px, 11vw, 50px)',
                    height: 'clamp(42px, 11.5vw, 53px)',
                    borderRadius: SQUIRCLE_RADIUS,
                    border: '1.5px solid rgba(255,255,255,0.20)',
                    background: 'rgba(255,255,255,0.07)',
                    overflow: 'hidden', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {cd.leader.photoUrl ? (
                      <img src={cd.leader.photoUrl} alt={cd.leader.playerName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 0%' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{getInitials(cd.leader.playerName)}</span>
                    )}
                  </div>
                  {/* Name + thru */}
                  <div>
                    <div style={{ fontSize: 'clamp(14px, 3.8vw, 16px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 'clamp(110px, 30vw, 150px)' }}>
                      {cd.leader.playerName}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                      {cd.leader.thru && (
                        <span style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: 'rgba(255,255,255,0.4)' }}>Thru {cd.leader.thru}</span>
                      )}
                      {cd.leader.today && (
                        <span style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: cd.leader.today.startsWith('-') ? '#22C55E' : cd.leader.today === 'E' ? 'rgba(255,255,255,0.4)' : '#EF4444' }}>
                          Today {cd.leader.today}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Score — right side */}
                <div style={{ fontSize: 'clamp(28px, 8vw, 36px)', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -1, flexShrink: 0 }}>
                  {cd.leader.scoreDisplay || 'E'}
                </div>
              </div>

              {/* ── STAT CHIPS — scaled down ── */}
              {cd.leader.scoringStats && (
                <div style={{ display: 'flex', gap: 'clamp(3px, 1vw, 5px)' }}>
                  {[
                    { v: cd.leader.scoringStats.eagles,       label: 'Eagles',  color: '#F59E0B' },
                    { v: cd.leader.scoringStats.birdies,      label: 'Birdies', color: '#22C55E' },
                    { v: cd.leader.scoringStats.pars,         label: 'Pars',    color: 'rgba(255,255,255,0.75)' },
                    { v: cd.leader.scoringStats.bogeys,       label: 'Bogeys',  color: '#F97316' },
                    { v: cd.leader.scoringStats.doubleBogeys, label: 'Doubles', color: '#EF4444' },
                  ].map(stat => (
                    <div key={stat.label} style={{ flex: 1, textAlign: 'center', padding: 'clamp(6px, 1.8vw, 9px) 2px clamp(5px, 1.5vw, 7px)', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: 'clamp(14px, 4vw, 17px)', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.v}</div>
                      <div style={{ fontSize: 'clamp(7px, 1.8vw, 8px)', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 3 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'dotPulse 1.4s ease-in-out infinite' }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Scores updating shortly...</span>
            </div>
          )}
        </div>
      </div>

      {/* ── ZONE 2: LEADERBOARD ── */}
      <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.95)', minHeight: 0 }}>

        {/* Header — orange dot + In Contention label + Full Leaderboard link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(7px, 2vw, 10px) clamp(14px, 3.5vw, 18px) 3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Orange pulse dot */}
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f97316', animation: 'dotPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 'clamp(9px, 2.2vw, 11px)', fontWeight: 700, letterSpacing: '1.2px', color: '#f97316', textTransform: 'uppercase' }}>
              In Contention
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/tourhub/tournament/${cd.tournamentId}`); }}
            style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Full Leaderboard <ChevronRight style={{ width: 12, height: 12 }} />
          </button>
        </div>

        {/* Insight line */}
        {cd.insight && (
          <p style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontStyle: 'italic', color: 'rgba(255,255,255,0.3)', margin: '0 0 3px', padding: '0 clamp(14px, 3.5vw, 18px)' }}>
            {cd.insight}
          </p>
        )}

        {/* Thin separator */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '2px clamp(14px, 3.5vw, 18px)' }} />

        {/* Chaser rows — with movement badges */}
        <div style={{ flex: '1 1 auto', overflow: 'hidden', padding: 'clamp(3px, 1vw, 6px) clamp(14px, 3.5vw, 18px) clamp(3px, 1vw, 6px)', display: 'flex', flexDirection: 'column', gap: 'clamp(3px, 1vw, 6px)', justifyContent: 'space-evenly' }}>
          {chaserGroups && chaserGroups.length > 0 ? (
            <>
              {chaserGroups.slice(0, 3).map((group, gi) => {
                const isTied = group.isTied && group.chasers.length > 1;
                const primary = group.chasers[0];
                const stackedAvatars = group.chasers.slice(0, 3);

                return (
                  <div key={`${group.position}-${gi}`} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', padding: 'clamp(6px, 2vw, 10px) 8px', borderRadius: 9, animation: 'trc-slideIn 0.5s ease-out both', animationDelay: `${0.3 + gi * 0.07}s` }}>
                    <span style={{ width: 'clamp(20px, 4.5vw, 26px)', textAlign: 'center', fontSize: 'clamp(11px, 2.8vw, 13px)', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
                      {group.isTied ? `T${group.position}` : group.position}
                    </span>

                    {isTied ? (
                      <div style={{ display: 'flex' }}>
                        {stackedAvatars.map((p, i) => (
                          <div key={i} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: stackedAvatars.length - i, border: '1.5px solid rgba(8,10,14,0.8)', borderRadius: SQUIRCLE_RADIUS, overflow: 'hidden' }}>
                            <RowAvatar src={p.photoUrl} name={p.playerName} size={32} />
                          </div>
                        ))}
                        {group.chasers.length > 3 && (
                          <div style={{ marginLeft: -8, zIndex: 0, width: 32, height: 32, borderRadius: SQUIRCLE_RADIUS, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', border: '1.5px solid rgba(8,10,14,0.8)' }}>
                            +{group.chasers.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <RowAvatar src={primary.photoUrl} name={primary.playerName} size={36} />
                    )}

                    <span style={{ flex: 1, fontSize: 'clamp(13px, 3.2vw, 15px)', fontWeight: 500, color: 'rgba(255,255,255,0.80)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isTied ? (
                        <>
                          {group.chasers.length}-Way Tie
                          <span style={{ display: 'block', fontSize: 'clamp(9px, 2.2vw, 11px)', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                            {group.chasers.map(c => getLastName(c.playerName)).join(' · ')}
                          </span>
                        </>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {primary.playerName}
                          {/* Movement badge — rendered when positionDelta available */}
                          {(primary as any).positionDelta > 0 && (
                            <span style={{ fontSize: 'clamp(8px, 2vw, 9px)', fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.12)', borderRadius: 4, padding: '1px 4px' }}>
                              ▲{(primary as any).positionDelta}
                            </span>
                          )}
                          {(primary as any).positionDelta < 0 && (
                            <span style={{ fontSize: 'clamp(8px, 2vw, 9px)', fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.12)', borderRadius: 4, padding: '1px 4px' }}>
                              ▼{Math.abs((primary as any).positionDelta)}
                            </span>
                          )}
                        </span>
                      )}
                    </span>

                    <span style={{ fontSize: 'clamp(13px, 3.2vw, 15px)', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
                      {primary.scoreDisplay || 'E'}
                    </span>
                  </div>
                );
              })}

              {/* Best today strip */}
              {(() => {
                const bestLabel = getBestRoundLabel(cd.leader?.thru);
                if (!bestLabel || !cd.bestToday || cd.bestToday.length === 0) return null;
                return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 0 0', padding: 'clamp(6px, 1.8vw, 8px) clamp(10px, 2.5vw, 12px)', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 'clamp(8px, 2vw, 9px)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                    {bestLabel}
                  </span>
                  <div style={{ display: 'flex', gap: 'clamp(8px, 2.5vw, 12px)', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {cd.bestToday.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <RowAvatar src={p.photoUrl} name={p.playerName} size={22} />
                        <span style={{ fontSize: 'clamp(11px, 2.8vw, 12px)', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>
                          {p.playerName.split(' ').pop()}
                        </span>
                        <span style={{ fontSize: 'clamp(11px, 2.8vw, 12px)', fontWeight: 700, color: '#4ade80' }}>
                          {p.todayDisplay}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })()}
            </>
          ) : (
            /* Empty state */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 28 }}>
                {[0.5, 0.8, 0.6, 1, 0.7, 0.9, 0.55].map((h, i) => (
                  <div key={i} style={{ width: 4, borderRadius: 2, height: `${h * 100}%`, background: 'rgba(255,255,255,0.12)', animation: `dotPulse ${0.8 + i * 0.15}s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', margin: 0 }}>Leaderboard updates as play begins</p>
            </div>
          )}
        </div>
      </div>

      {/* Echo — upcoming tournament preview */}
      <div style={{ padding: '6px 16px 2px' }}>
        <EchoContextualButton
          prompt={`Preview the ${new Date().getFullYear()} ${cd.tournamentName}${cd.venueName ? ` at ${cd.venueName}` : ''}${cd.venueCity ? ` in ${cd.venueCity}` : ''}${cd.purse ? `. Purse is $${(cd.purse / 1_000_000).toFixed(1)}M` : ''}${cd.venuePar ? `. The course plays Par ${cd.venuePar} at ${(cd.venueYardage || 0).toLocaleString()} yards` : ''}${cd.defendingChampion ? `. Defending champion is ${cd.defendingChampion}` : ''}. Search for the latest news, tell me who the favourites are, what type of player wins here, and what storylines to follow this week.`}
          label="Ask Echo to preview this event"
          sublabel="Favourites · course intel · storylines"
          source="pga_card_upcoming"
        />
      </div>

      {/* ── ZONE 3: CTA BAR — unchanged ── */}
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
          Who wins this?
          {commentCount > 0 && (
            <span style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>
              {formatCount(commentCount)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};