import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useFriendsOnTop100Journey } from '@/hooks/useFriendsOnTop100Journey';
import { Top100RecentRoundsFeed } from './Top100RecentRoundsFeed';
import SquircleImage from '@/components/ui/SquircleImage';
import { Search, Settings } from 'lucide-react';

const Top100CoursesHubPanel = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user's Top 100 progress
  const { data: progress } = useTop100ProgressForUser(user?.id);
  const { data: listSummaries = [] } = useTop100ListSummaries(user?.id);
  const { data: friends = [] } = useFriendsOnTop100Journey(user?.id);

  // Extract stats from progress
  const totalPlayed = progress?.total_played_top100 || 0;
  const regionsCount = progress?.regions_count || 0;
  const ringLabel = progress?.prestige_label;
  const clubTitle = totalPlayed >= 100 ? '100 Century Club' : totalPlayed >= 50 ? '50 Club' : totalPlayed >= 20 ? '20 Club' : null;
  const recentRounds = progress?.recent_rounds || [];

  // Calculate lists count from summaries (only lists where user has played at least one course)
  const listsCount = listSummaries.filter(list => list.played_count > 0).length;

  const handleOpenTop100Journey = () => {
    if (user) {
      navigate('/top100?tab=my-progress');
    } else {
      navigate('/auth?redirect=/top100?tab=my-progress');
    }
  };

  const handleOpenTop100Leaderboard = () => {
    navigate('/top100?tab=leaderboard');
  };

  const handleOpenRecentRounds = () => {
    navigate('/top100?tab=my-progress');
  };

  const hasFriends = friends && friends.length > 0;

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Top 100 Club hero */}
      <section className="rounded-3xl bg-slate-950/90 text-slate-50 shadow-lg shadow-black/30 border border-slate-800/80 px-4 py-5">
        {/* Title + subtitle */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <div>
            <h2 className="text-[18px] font-semibold">Top 100 Club</h2>
            <p className="text-[12px] text-slate-400">
              Your journey across the world&apos;s greatest courses.
            </p>
          </div>
        </div>

        {/* Big stat row */}
        <div className="mt-4">
          {user ? (
            <>
              <p className="text-[14px]">
                <span className="font-semibold text-slate-50">
                  You&apos;ve played {totalPlayed} Top 100 course{totalPlayed === 1 ? '' : 's'}
                </span>
                {listsCount > 0 && (
                  <span className="text-slate-400"> across {listsCount} Top 100 list{listsCount === 1 ? '' : 's'}.</span>
                )}
              </p>

              {/* Ring + Club badges if available */}
              {(ringLabel || clubTitle) && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  {ringLabel && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/70 bg-emerald-500/10 px-2 py-0.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      {ringLabel}
                    </span>
                  )}
                  {clubTitle && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/70 bg-amber-400/10 px-2 py-0.5">
                      🥇 {clubTitle}
                    </span>
                  )}
                </div>
              )}

              {/* Progress bar */}
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-400 transition-[width] duration-500"
                  style={{ width: `${Math.min(100, (totalPlayed / 100) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-[14px] text-slate-300">
              Sign in to track your progress and see where you rank on the global leaderboard.
            </p>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleOpenTop100Journey}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-100 text-slate-950 text-[14px] font-semibold py-2.5 active:scale-[0.98] transition"
        >
          {user ? 'Open your Top 100 Journey' : 'Sign in to join the Top 100 Club'}
          <span className="text-[16px]">↗</span>
        </button>
      </section>

      {/* 2. Region progress strip */}
      {user && listSummaries.length > 0 && (
        <section>
          <h3 className="mb-2 text-[13px] font-semibold text-slate-200">
            Your Top 100 region progress
          </h3>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {listSummaries.map((region) => {
              const pct = region.total_courses > 0 ? (region.played_count / region.total_courses) * 100 : 0;
              const label = region.name.replace(' Top 100', '');
              
              return (
                <div
                  key={region.id}
                  className="min-w-[150px] rounded-2xl border border-slate-800/80 bg-slate-950/80 px-3 py-2 text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">{label}</span>
                    <span className="text-slate-400">
                      {region.played_count}/{region.total_courses}
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Friends on this journey */}
      {user && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-200">
              Friends on the Top 100 journey
            </h3>
            {hasFriends && (
              <button
                type="button"
                onClick={handleOpenTop100Leaderboard}
                className="text-[11px] font-medium text-amber-300"
              >
                View leaderboard →
              </button>
            )}
          </div>

          {!hasFriends && (
            <p className="text-[12px] text-slate-500">
              None of your friends have started the Top 100 journey yet.
            </p>
          )}

          {hasFriends && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {friends.slice(0, 10).map((f) => {
                const displayName = f.profile.display_name || f.profile.username || '?';
                const initial = displayName[0]?.toUpperCase() || '?';
                
                return (
                  <button
                    key={f.user_id}
                    type="button"
                    onClick={() => navigate(`/profile/${f.profile.username}?tab=top100`)}
                    className="flex min-w-[110px] flex-col items-center rounded-2xl border border-slate-800/80 bg-slate-950/80 px-3 py-3 text-[11px] text-slate-200"
                  >
                    {f.profile.profile_photo_url ? (
                      <SquircleImage
                        src={f.profile.profile_photo_url}
                        alt={displayName}
                        size={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-[14px]">
                        {initial}
                      </div>
                    )}
                    <span className="mt-2 line-clamp-1 font-medium">{displayName}</span>
                    {typeof f.top100CoursesPlayed === 'number' && (
                      <span className="text-slate-400">
                        {f.top100CoursesPlayed} course{f.top100CoursesPlayed === 1 ? '' : 's'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 4. Search bar */}
      <section>
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Top 100 courses"
            className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/80 px-10 py-2.5 text-[13px] text-slate-100 placeholder:text-slate-500 shadow-[0_10px_25px_rgba(0,0,0,0.35)] focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-500">
            🔍
          </span>
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            onClick={() => {
              // Future: open filters
            }}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* 5. Recent Top 100 rounds */}
      {user && recentRounds.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-200">
              Recent Top 100 rounds
            </h3>
            <button
              type="button"
              onClick={handleOpenRecentRounds}
              className="text-[11px] font-medium text-amber-300"
            >
              View all →
            </button>
          </div>

          <Top100RecentRoundsFeed 
            rounds={recentRounds} 
            isOwnProfile={true}
            maxDisplay={5}
          />
        </section>
      )}

      {/* Empty state for recent rounds when user has none */}
      {user && recentRounds.length === 0 && (
        <section>
          <h3 className="mb-2 text-[13px] font-semibold text-slate-200">
            Recent Top 100 rounds
          </h3>
          <div className="text-center py-8 px-4 rounded-xl bg-slate-950/50 border border-slate-800/60">
            <p className="text-sm text-slate-400">
              You haven&apos;t logged any rounds at Top 100 courses yet.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Play a course from one of the lists above to get started.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Top100CoursesHubPanel;
