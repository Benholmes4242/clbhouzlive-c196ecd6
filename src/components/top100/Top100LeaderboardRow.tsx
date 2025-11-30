import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Top100LeaderboardEntry } from '@/hooks/useTop100Leaderboard';
import { getRingLabel } from '@/lib/top100Prestige';

interface Top100LeaderboardRowProps {
  entry: Top100LeaderboardEntry;
}

export const Top100LeaderboardRow: React.FC<Top100LeaderboardRowProps> = ({
  entry,
}) => {
  const navigate = useNavigate();
  const isTop3 = entry.rank <= 3;
  const isMe = entry.is_current_user;

  const accentClass =
    entry.rank === 1
      ? 'from-amber-300/80 via-amber-200/40 to-amber-100/0'
      : entry.rank === 2
      ? 'from-slate-200/60 via-slate-100/30 to-slate-50/0'
      : entry.rank === 3
      ? 'from-amber-500/50 via-amber-400/25 to-amber-300/0'
      : '';

  const initials = (entry.display_name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <li
      className={cn(
        'relative flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-3 py-2.5 sm:px-4 sm:py-3 cursor-pointer transition-all hover:border-slate-700',
        isMe && 'border-emerald-400/70 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]'
      )}
      onClick={() => navigate(`/profile/${entry.user_id}?tab=top100`)}
    >
      {/* Subtle radial for top 3 only */}
      {isTop3 && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r opacity-70',
            accentClass
          )}
        />
      )}

      {/* Left: rank + avatar + name */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Rank */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[13px] font-semibold text-slate-100">
          {entry.rank}
        </div>

        {/* Avatar + name */}
        <div className="flex min-w-0 items-center gap-2">
          {entry.avatar_url ? (
            <img
              src={entry.avatar_url}
              alt={entry.display_name ?? 'Golfer'}
              className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-100">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-slate-50">
              {entry.display_name ?? 'Unknown golfer'}
              {isMe && (
                <span className="ml-1 text-[11px] font-normal text-emerald-300">
                  · You
                </span>
              )}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {entry.home_club || 'No home club set'}
            </p>
          </div>
        </div>
      </div>

      {/* Middle: country / region (desktop only) */}
      <div className="hidden min-w-[120px] flex-1 items-center justify-end gap-1 text-right text-[11px] text-slate-400 sm:flex">
        {entry.country_code && (
          <span className="rounded-full border border-slate-800/80 bg-slate-950/80 px-2 py-0.5">
            {entry.country_code.toUpperCase()}
          </span>
        )}
      </div>

      {/* Right: stats chip */}
      <div className="flex flex-shrink-0 flex-col items-end gap-1 text-right">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950 px-2.5 py-1">
          <span className="text-[11px] text-slate-300">
            {entry.total_top100_played} Top 100
          </span>
        </div>

        {entry.prestige_ring && (
          <p className="text-[11px] font-medium text-emerald-300">
            {getRingLabel(entry.prestige_ring as any)}
          </p>
        )}
      </div>
    </li>
  );
};
