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
          className="w-8 h-8 rounded-lg object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const fb = (e.target as HTMLImageElement).parentElement?.querySelector('[data-fallback]') as HTMLElement;
            if (fb) fb.style.display = 'flex';
          }}
        />
        <div data-fallback className="w-8 h-8 rounded-lg bg-white/10 items-center justify-center" style={{ display: 'none' }}>
          <span className="text-[11px] text-white/40">⛳</span>
        </div>
      </div>
    ) : (
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
        <span className="text-[11px] text-white/40">⛳</span>
      </div>
    )}
    <div className="flex-1 text-[13px] font-semibold text-white/80 truncate">{chaser.playerName}</div>
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

        {/* Amber accent bar */}
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
                      className="w-[50px] h-[50px] rounded-xl object-cover"
                      style={{ boxShadow: '0 0 16px rgba(245,158,11,0.25)' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fb = (e.target as HTMLImageElement).parentElement?.querySelector('[data-fallback]') as HTMLElement;
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                    <div data-fallback className="w-[50px] h-[50px] rounded-xl bg-amber-900/30 items-center justify-center" style={{ display: 'none' }}>
                      <span className="text-amber-400 text-lg">⛳</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-[50px] h-[50px] rounded-xl bg-amber-900/30 flex items-center justify-center">
                    <span className="text-amber-400 text-lg">⛳</span>
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
                      className="w-[50px] h-[50px] rounded-xl object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fb = (e.target as HTMLImageElement).parentElement?.querySelector('[data-fallback]') as HTMLElement;
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                    <div data-fallback className="w-[50px] h-[50px] rounded-xl bg-slate-800 items-center justify-center" style={{ display: 'none' }}>
                      <Trophy className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                ) : (
                  <div className="w-[50px] h-[50px] rounded-xl bg-slate-800 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate">{cd.leader.playerName}</div>
                  <div className="text-[11px] text-white/50">🏆 Champion</div>
                </div>
                <div className="text-[34px] font-black text-slate-300 leading-none">
                  {cd.leader.scoreDisplay}
                </div>
              </div>
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

          {/* Stat tiles — live & result */}
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
      <div className="flex-shrink-0 px-5 py-2.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[16px]">⛳</div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate">{cd.venueName ?? 'TBD'}</div>
          <div className="text-[11px] text-white/40 truncate">{cd.venueCity ?? ''}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {cd.venuePar && (
            <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
              Par {cd.venuePar}
            </span>
          )}
          {cd.purse && (
            <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
              {formatPurse(cd.purse)}
            </span>
          )}
        </div>
      </div>

      {/* ── Chasers Section ── */}
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
          {cd.chasers.length > 0 ? (
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
        {/* Like button */}
        <button
          onClick={onLike}
          className="flex items-center gap-1.5 transition-transform active:scale-95"
        >
          <Heart
            className="w-6 h-6 transition-colors"
            style={{
              color: likeState.isLiked ? '#f59e0b' : '#6b7280',
              fill: likeState.isLiked ? '#f59e0b' : 'transparent',
            }}
          />
          {likeState.count > 0 && (
            <span className="text-[12px] font-bold" style={{ color: likeState.isLiked ? '#f59e0b' : '#6b7280' }}>
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
                ? 'linear-gradient(135deg, #64748b, #475569)'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff',
          }}
        >
          <MessageCircle className="w-4 h-4" />
          {ctaLabel}
          {commentCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold px-1.5"
              style={{ background: '#ef4444', color: '#fff' }}
            >
              {formatCount(commentCount)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
