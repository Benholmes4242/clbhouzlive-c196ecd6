import React, { useMemo } from 'react';
import { Heart, MessageCircle, Trophy, Calendar, Radio } from 'lucide-react';
import type { PGACardFeedPost, PGACardData, PGACardChaser } from '@/components/media-system/types/media';
import { Squircle } from '@/components/ui/squircle';

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

// ── Stat Tile ──
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

// ── Scoring Strip (leader) — no emoji, colored values ──
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

// ── Chaser Row ──
const ChaserRow: React.FC<{ chaser: PGACardChaser; isResult?: boolean }> = ({ chaser, isResult }) => (
  <div className="flex items-center gap-3 px-4 min-h-[44px] flex-1">
    <div className="text-[13px] font-bold text-white/50 w-5 text-center">
      {chaser.isTied ? 'T' : ''}{chaser.position}
    </div>
    {chaser.photoUrl ? (
      <div className="relative">
        <img
          src={chaser.photoUrl}
          alt=""
          className="w-8 h-8 object-cover"
          style={{ borderRadius: SQUIRCLE_RADIUS }}
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

// ── Tied Row (overlapping avatars + surnames) ──
const TiedRow: React.FC<{ position: number; chasers: PGACardChaser[] }> = ({ position, chasers }) => {
  const shownAvatars = chasers.slice(0, 3);
  const overflow = chasers.length - 3;
  const surnames = chasers.map(c => getLastName(c.playerName)).join(' · ');
  const score = chasers[0]?.scoreDisplay ?? '';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,0.03)', borderRadius: 11,
      padding: '8px 10px', marginBottom: 5, marginLeft: 4, marginRight: 4,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', width: 22, textAlign: 'center' }}>
        T{position}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {shownAvatars.map((c, i) => (
          <div key={i} style={{
            width: 36, height: 36, borderRadius: SQUIRCLE_RADIUS,
            border: '2px solid #080a0e', marginLeft: i > 0 ? -10 : 0,
            zIndex: shownAvatars.length - i, position: 'relative',
            overflow: 'hidden', background: 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {c.photoUrl ? (
              <img src={c.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{getInitials(c.playerName)}</span>
            )}
          </div>
        ))}
        {overflow > 0 && (
          <div style={{
            width: 30, height: 30, borderRadius: SQUIRCLE_RADIUS,
            marginLeft: -8, background: 'rgba(255,255,255,0.08)',
            border: '2px solid #080a0e', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', position: 'relative', zIndex: 0,
          }}>
            +{overflow}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
          {chasers.length}-Way Tie
        </div>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {surnames}
        </div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>{score}</div>
    </div>
  );
};

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

export const PGACard: React.FC<PGACardProps> = ({
  post,
  onComment,
  onLike,
  getLikeState,
  getCommentCount,
}) => {
  const cd = post.cardData;
  const isLoading = post.isLoading ?? false;
  const likeState = getLikeState?.(post) ?? { isLiked: cd.isLikedByMe, count: cd.likeCount };
  const commentCount = getCommentCount?.(post) ?? cd.commentCount;

  // Countdown for upcoming (must be before early return)
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

  // Gradient glow color per state
  const glowColor = cd.state === 'live'
    ? 'rgba(245,158,11,0.13)'
    : cd.state === 'result'
      ? 'rgba(148,163,184,0.07)'
      : 'rgba(99,102,241,0.09)';


  const ctaLabel = cd.state === 'live'
    ? 'Who wins this?'
    : cd.state === 'result'
      ? 'Your reaction?'
      : 'Who takes it?';

  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden"
      style={{ background: '#080a0e', color: '#fff' }}
    >
      {/* ── Gradient Header ── */}
      <div
        className="flex-shrink-0 relative"
        style={{
          background: 'linear-gradient(180deg, #141c2e 0%, #0d1525 45%, #080a0e 100%)',
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{
            background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)`,
          }}
        />

        {/* Accent bar */}
        <div
          className="w-full"
          style={{
            height: '2.5px',
            background: cd.state === 'live'
              ? 'linear-gradient(90deg, #f59e0bCC, transparent)'
              : cd.state === 'result'
                ? 'linear-gradient(90deg, #94a3b8CC, transparent)'
                : 'linear-gradient(90deg, #6366f1CC, transparent)',
          }}
        />

        <div className="px-5 pt-3.5 pb-4">
          {/* Badge row */}
          <div className="flex items-center gap-2 mb-2">
            {cd.state === 'live' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] font-bold text-green-400 uppercase tracking-wider">Live</span>
              </div>
            )}
            {cd.state === 'result' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <Trophy className="w-3 h-3 text-white/50" />
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Final</span>
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

          {/* Tournament name */}
          <h2 className="text-[17px] font-extrabold leading-tight mb-3">{cd.tournamentName}</h2>

          {/* ── LIVE: Leader card ── */}
          {cd.state === 'live' && cd.leader && (
            <div
              className="rounded-2xl p-3.5 mb-3"
              style={{
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}
            >
              <div className="flex items-center gap-3">
                {cd.leader.photoUrl ? (
                  <div className="relative">
                    <img
                      src={cd.leader.photoUrl}
                      alt={cd.leader.playerName}
                      className="w-[50px] h-[50px] object-cover"
                      style={{ borderRadius: SQUIRCLE_RADIUS, boxShadow: '0 0 16px rgba(245,158,11,0.25)' }}
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
                    {cd.leader.thru && (
                      <span className="text-[11px] text-white/50">Thru {cd.leader.thru}</span>
                    )}
                    {cd.leader.today && (
                      <span className="text-[11px] text-white/50">Today {cd.leader.today}</span>
                    )}
                  </div>
                </div>
                <div className="text-[34px] font-black text-amber-400 leading-none">
                  {cd.leader.scoreDisplay}
                </div>
              </div>

              {/* Leader scoring stats */}
              {cd.leader.scoringStats && <ScoringStrip stats={cd.leader.scoringStats} />}
            </div>
          )}

          {/* ── RESULT: Champion card ── */}
          {cd.state === 'result' && cd.leader && (
            <div
              className="rounded-2xl p-3.5 mb-3"
              style={{
                background: 'rgba(148,163,184,0.06)',
                border: '1px solid rgba(148,163,184,0.15)',
              }}
            >
              <div className="flex items-center gap-3">
                {cd.leader.photoUrl ? (
                  <div className="relative">
                    <img
                      src={cd.leader.photoUrl}
                      alt=""
                      className="object-cover"
                      style={{
                        width: 54, height: 54,
                        borderRadius: SQUIRCLE_RADIUS,
                        border: '2px solid rgba(232,152,10,0.45)',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fb = (e.target as HTMLImageElement).parentElement?.querySelector('[data-fallback]') as HTMLElement;
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                    <div data-fallback className="items-center justify-center" style={{
                      display: 'none', width: 54, height: 54,
                      borderRadius: SQUIRCLE_RADIUS, background: 'rgba(30,30,40,0.8)',
                      border: '2px solid rgba(232,152,10,0.45)',
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{getInitials(cd.leader.playerName)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center" style={{
                    width: 54, height: 54, borderRadius: SQUIRCLE_RADIUS,
                    background: 'rgba(30,30,40,0.8)', border: '2px solid rgba(232,152,10,0.45)',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{getInitials(cd.leader.playerName)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate">{cd.leader.playerName}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Champion</div>
                  {cd.winnerBy && (
                    <div style={{ fontSize: 11, fontStyle: 'italic', color: 'rgba(255,255,255,0.55)' }}>{cd.winnerBy}</div>
                  )}
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#E8980A', letterSpacing: -1.5, lineHeight: 1 }}>
                  {cd.leader.scoreDisplay}
                </div>
              </div>

              {/* Champion scoring stats */}
              {cd.leader.scoringStats && <ScoringStrip stats={cd.leader.scoringStats} />}

              {/* Champion season stats */}
              {cd.championSeasonStats && (
                <div className="flex items-center gap-1 mt-2">
                  <SeasonTile label="Driver" value={cd.championSeasonStats.drivingDistance ? `${Math.round(cd.championSeasonStats.drivingDistance)}y` : null} />
                  <SeasonTile label="Accuracy" value={cd.championSeasonStats.drivingAccuracy ? `${Math.round(cd.championSeasonStats.drivingAccuracy)}%` : null} />
                  <SeasonTile label="GIR" value={cd.championSeasonStats.greensInReg ? `${Math.round(cd.championSeasonStats.greensInReg)}%` : null} />
                  <SeasonTile label="Putts" value={cd.championSeasonStats.puttingAverage ? cd.championSeasonStats.puttingAverage.toFixed(2) : null} />
                </div>
              )}
            </div>
          )}

          {/* ── UPCOMING: Countdown ── */}
          {cd.state === 'upcoming' && countdown && (
            <div
              className="rounded-2xl p-4 mb-3"
              style={{
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}
            >
              <div className="flex items-center justify-around">
                <CountdownTile value={countdown.days} label="Days" />
                <div className="text-indigo-400/30 text-lg font-thin">:</div>
                <CountdownTile value={countdown.hours} label="Hrs" />
                <div className="text-indigo-400/30 text-lg font-thin">:</div>
                <CountdownTile value={countdown.minutes} label="Min" />
              </div>
            </div>
          )}

          {/* Stat tiles — live only (leaderStats is null for result) */}
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
        {/* Background image or fallback */}
        {cd.courseImageUrl ? (
          <>
            <img src={cd.courseImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,10,14,0.9) 35%, rgba(8,10,14,0.3) 100%)' }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)' }} />
        )}
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, height: '100%', padding: '0 14px' }}>
          <GolfFlagIcon />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', maxWidth: '55vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cd.venueName ?? 'TBD'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
              {cd.venueCity ?? ''}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {cd.venuePar && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '3px 8px' }}>
                Par {cd.venuePar}
              </span>
            )}
            {cd.purse && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '3px 8px' }}>
                {formatPurse(cd.purse)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Chasers / Standings Section ── */}
      <div className="flex-1 flex flex-col min-h-0 px-1">
        <div className="flex items-center justify-between px-4 pt-2 pb-1">
          <span className="text-[12px] font-bold text-white/50 uppercase tracking-wider">
            {cd.state === 'result' ? 'Final Standings' : cd.state === 'upcoming' ? 'Course Info' : 'In Contention'}
          </span>
          {cd.state === 'live' && (
            <span className="text-[11px] font-semibold text-amber-400/80">Full leaderboard →</span>
          )}
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {cd.state === 'result' && chaserGroups ? (
            <>
              {/* Winner row */}
              {cd.leader && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(232,152,10,0.08)', border: '1px solid rgba(232,152,10,0.18)',
                  borderRadius: 11, padding: '9px 10px', margin: '0 4px 5px',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', width: 22, textAlign: 'center' }}>1</div>
                  <div style={{
                    width: 50, height: 50, borderRadius: SQUIRCLE_RADIUS,
                    border: '2px solid rgba(232,152,10,0.4)', overflow: 'hidden',
                    background: 'rgba(30,30,40,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {cd.leader.photoUrl ? (
                      <img src={cd.leader.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{getInitials(cd.leader.playerName)}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{cd.leader.playerName}</div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#E8980A' }}>{cd.leader.scoreDisplay}</div>
                </div>
              )}
              {/* Chaser groups */}
              {chaserGroups.map((group, gi) => {
                if (group.isTied && group.chasers.length > 1) {
                  return <TiedRow key={gi} position={group.position} chasers={group.chasers} />;
                }
                return group.chasers.map((c, ci) => (
                  <ChaserRow key={`${gi}-${ci}`} chaser={c} isResult />
                ));
              })}
            </>
          ) : cd.chasers.length > 0 ? (
            cd.chasers.map((c, i) => (
              <ChaserRow key={i} chaser={c} isResult={cd.state === 'result'} />
            ))
          ) : cd.state === 'upcoming' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-white/30">
              <Calendar className="w-8 h-8" />
              <span className="text-[12px]">Tournament starts {cd.startDate ? new Date(cd.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'soon'}</span>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/20 text-[12px]">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* ── CTA Bar ── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-5 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {/* Like button — glass pill */}
        <button
          onClick={onLike}
          className="flex items-center gap-1.5 transition-transform active:scale-95"
          style={{
            background: likeState.isLiked ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${likeState.isLiked ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.10)'}`,
            borderRadius: 14, padding: '11px 16px',
          }}
        >
          <Heart
            style={{
              width: 17, height: 17,
              color: likeState.isLiked ? '#f59e0b' : '#6b7280',
              fill: likeState.isLiked ? '#f59e0b' : 'transparent',
            }}
          />
          {likeState.count > 0 && (
            <span className="text-[14px] font-bold" style={{ color: likeState.isLiked ? '#f59e0b' : '#6b7280' }}>
              {formatCount(likeState.count)}
            </span>
          )}
        </button>

        {/* Comment CTA */}
        <button
          onClick={onComment}
          className="flex-1 relative flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] transition-transform active:scale-[0.98]"
          style={{
            background: cd.state === 'live'
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : cd.state === 'result'
                ? 'linear-gradient(180deg, #E8A012 0%, #C77008 100%)'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
            border: cd.state === 'result' ? '1px solid rgba(232,152,10,0.55)' : undefined,
            borderTopColor: cd.state === 'result' ? 'rgba(255,210,100,0.4)' : undefined,
            boxShadow: cd.state === 'result'
              ? '0 2px 14px rgba(232,152,10,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.15)'
              : undefined,
            animation: (cd.state === 'live' || cd.state === 'result') ? 'ctaPulse 2.5s ease-in-out infinite' : undefined,
            color: '#fff',
          }}
        >
          <MessageCircle className="w-4 h-4" />
          {ctaLabel}
          {commentCount > 0 && (
            <span style={{
              background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '2px 7px',
              fontSize: 11, fontWeight: 700,
            }}>
              {formatCount(commentCount)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
