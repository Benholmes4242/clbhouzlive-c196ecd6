import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeaderboardScope, LeaderboardTimeRange, useTop100Leaderboard } from '@/hooks/useTop100Leaderboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trophy, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getTop100PrestigeRing, getRingColorClass } from '@/lib/top100Prestige';

const Top100LeaderboardPanel = () => {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<'players' | 'courses'>('players');
  const [scope, setScope] = useState<LeaderboardScope>('worldwide');
  const [timeRange, setTimeRange] = useState<LeaderboardTimeRange>('all_time');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useTop100Leaderboard({
    scope,
    timeRange,
    page,
    pageSize: 20,
  });

  const scopeLabels: Record<LeaderboardScope, string> = {
    worldwide: 'Worldwide',
    'global-top-100': 'Global Top 100',
    'gb-i-top-100': 'GB&I Top 100',
    'usa-top-100': 'USA Top 100',
    'europe-top-100': 'Europe Top 100',
  };

  const timeRangeLabels: Record<LeaderboardTimeRange, string> = {
    all_time: 'All time',
    this_year: 'This year',
    this_month: 'This month',
  };

  const listShortLabels: Record<string, string> = {
    'global-top-100': 'Global',
    'gb-i-top-100': 'GB&I',
    'usa-top-100': 'USA',
    'europe-top-100': 'Europe',
  };

  const handleLoadMore = () => {
    setPage(p => p + 1);
  };

  const handleScopeChange = (newScope: string) => {
    setScope(newScope as LeaderboardScope);
    setPage(0);
  };

  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange as LeaderboardTimeRange);
    setPage(0);
  };

  if (isLoading && page === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 px-4 pb-6 animate-pulse">
        <div className="h-24 bg-surface-alt rounded-xl" />
        <div className="h-10 bg-surface-alt rounded-lg" />
        <div className="flex gap-3">
          <div className="h-10 bg-surface-alt rounded-lg flex-1" />
          <div className="h-10 bg-surface-alt rounded-lg flex-1" />
        </div>
        <div className="h-32 bg-surface-alt rounded-xl" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-alt rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 pb-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-primary-accent" />
          <h1 className="text-3xl font-bold text-foreground">Top 100 Club – Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Elite pilgrimage mode for the whales and hardcore nuts chasing the world's Top 100.
        </p>
      </div>

      {/* View Type Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-surface-alt p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewType('players')}
            className={`px-3 py-1 rounded-full transition-all ${
              viewType === 'players'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Players
          </button>
          <button
            type="button"
            onClick={() => setViewType('courses')}
            className={`px-3 py-1 rounded-full transition-all ${
              viewType === 'courses'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Courses
          </button>
        </div>
      </div>

      {viewType === 'courses' ? (
        <div className="text-center py-12 px-4 rounded-xl bg-card border border-border/50">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Coming soon</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Soon you'll see which Top 100 courses are most played and highest rated this month.
          </p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={scope} onValueChange={handleScopeChange}>
              <SelectTrigger className="flex-1 min-w-[180px] bg-card border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(scopeLabels) as LeaderboardScope[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {scopeLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="flex-1 min-w-[180px] bg-card border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(timeRangeLabels) as LeaderboardTimeRange[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {timeRangeLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

      {/* Your Position Card */}
      {data?.current_user_entry && (
        <div className="p-4 rounded-xl bg-primary-accent/10 border border-primary-accent/20 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Your position
          </p>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-accent" />
            <p className="text-lg font-bold text-foreground">
              #{data.current_user_entry.rank} · {data.current_user_entry.total_top100_played} Top 100 courses
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.current_user_entry.milestone_label
              ? `You're in the ${data.current_user_entry.milestone_label} – keep going.`
              : 'Log more Top 100 rounds to climb the leaderboard.'}
          </p>
        </div>
      )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-12 px-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive mb-3">
                Failed to load leaderboard data.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isError && data && data.entries.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No Top 100 rounds logged here yet.</p>
              <p className="text-sm mt-1">Be the first to start your pilgrimage.</p>
            </div>
          )}

          {/* Leaderboard List */}
          {!isError && data && data.entries.length > 0 && (
            <div className="space-y-2">
              {data.entries.map((entry) => {
                const ringColor = entry.rank <= 3 ? 'ring-primary-accent/60' : getRingColorClass(getTop100PrestigeRing(entry.total_top100_played));
                
                return (
                  <button
                    key={entry.user_id}
                    onClick={() => navigate(`/profile/${entry.user_id}?tab=top100`)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary-accent/40 hover:shadow-md transition-all text-left"
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-10 text-center">
                      <span className={`text-xl font-bold ${
                        entry.rank === 1 ? 'text-yellow-500' :
                        entry.rank === 2 ? 'text-slate-400' :
                        entry.rank === 3 ? 'text-amber-600' :
                        'text-foreground'
                      }`}>
                        #{entry.rank}
                      </span>
                    </div>

                    {/* Avatar + Ring */}
                    <div className="relative h-12 w-12 flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={entry.avatar_url || undefined} alt={entry.display_name} />
                        <AvatarFallback className="bg-surface-slate text-white">
                          {(entry.display_name || 'A').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span 
                        className={`pointer-events-none absolute inset-0 rounded-full ring-2 ring-offset-[2px] ring-offset-background ${ringColor}`}
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{entry.display_name}</p>
                        {entry.milestone_label && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-accent/10 text-primary-accent border border-primary-accent/20">
                            {entry.milestone_label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {entry.home_club || 'No club set'}
                      </p>
                    </div>

                    {/* Count */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-2xl font-bold text-foreground">{entry.total_top100_played}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        Top 100{entry.total_top100_played === 1 ? '' : 's'}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Load More */}
              {data.entries.length < data.total_count && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load more'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Top100LeaderboardPanel;
