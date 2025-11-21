import React, { useState } from 'react';
import { LeaderboardScope, LeaderboardTimeRange, useTop100Leaderboard } from '@/hooks/useTop100Leaderboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trophy, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Top100LeaderboardPanel = () => {
  const [scope, setScope] = useState<LeaderboardScope>('worldwide');
  const [timeRange, setTimeRange] = useState<LeaderboardTimeRange>('all_time');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useTop100Leaderboard({
    scope,
    timeRange,
    page,
    pageSize: 20,
  });

  const scopeLabels: Record<LeaderboardScope, string> = {
    'worldwide': 'Worldwide',
    'global-top-100': 'Global Top 100',
    'gb-i-top-100': 'GB&I Top 100',
    'usa-top-100': 'USA Top 100',
    'europe-top-100': 'Europe Top 100',
  };

  const timeRangeLabels: Record<LeaderboardTimeRange, string> = {
    'all_time': 'All time',
    'this_year': 'This year',
    'this_month': 'This month',
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
        <div className="h-24 bg-muted rounded-xl" />
        <div className="flex gap-3">
          <div className="h-10 bg-muted rounded-lg flex-1" />
          <div className="h-10 bg-muted rounded-lg flex-1" />
        </div>
        <div className="h-32 bg-muted rounded-xl" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
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

      {/* Leaderboard List */}
      {data && data.entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No Top 100 rounds logged here yet.</p>
          <p className="text-sm mt-1">Be the first to start your pilgrimage.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.entries.map((entry) => (
            <div
              key={entry.user_id}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 text-center">
                <span className="text-2xl font-bold text-primary">#{entry.rank}</span>
              </div>

              {/* Avatar + Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={entry.avatar_url || undefined} alt={entry.display_name} />
                  <AvatarFallback>{entry.display_name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground truncate">{entry.display_name}</p>
                    {entry.milestone_label && (
                      <Badge variant="outline" className="text-xs bg-primary-accent/10 border-primary-accent/20">
                        {entry.milestone_label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {entry.home_club || entry.country || 'Location not set'}
                  </p>
                  {entry.lists_completed.length > 0 && (
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {entry.lists_completed.map((listSlug) => (
                        <span
                          key={listSlug}
                          className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {listSlug.replace('-top-100', '').toUpperCase()} 100/100
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Count */}
              <div className="flex-shrink-0 text-right">
                <p className="text-2xl font-bold text-foreground">{entry.total_top100_played}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Top 100 courses</p>
              </div>
            </div>
          ))}

          {/* Load More */}
          {data && data.entries.length < data.total_count && (
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
    </div>
  );
};

export default Top100LeaderboardPanel;
