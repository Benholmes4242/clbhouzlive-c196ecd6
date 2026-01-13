import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, MapPin, Star, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyStateType = 
  | 'friends-no-friends'
  | 'friends-no-activity'
  | 'around-you-no-rank'
  | 'rising-no-data'
  | 'rising-coming-soon'
  | 'courses-friends-no-friends'
  | 'courses-friends-no-activity'
  | 'courses-trending'
  | 'courses-highest-rated'
  | 'courses-most-played'
  | 'no-matches';

interface LeaderboardEmptyStateProps {
  type: EmptyStateType;
  onResetFilters?: () => void;
}

const EMPTY_STATES: Record<EmptyStateType, {
  icon: React.ElementType;
  title: string;
  body: string;
  cta?: { label: string; action: 'find-friends' | 'invite-friend' | 'show-top100' | 'switch-list' | 'reset-filters' };
}> = {
  'friends-no-friends': {
    icon: Users,
    title: 'Friends leaderboard',
    body: 'Add a few friends to see how you stack up.',
    cta: { label: 'Find friends', action: 'find-friends' },
  },
  'friends-no-activity': {
    icon: Users,
    title: 'Friends leaderboard',
    body: "Your friends haven't logged any Top 100 courses yet.",
    cta: { label: 'Invite a friend', action: 'invite-friend' },
  },
  'around-you-no-rank': {
    icon: MapPin,
    title: 'Around you',
    body: 'Log your first Top 100 course to unlock your position.',
    cta: { label: 'Show Top 100 courses', action: 'show-top100' },
  },
  'rising-no-data': {
    icon: TrendingUp,
    title: 'Rising players',
    body: 'Not enough recent activity to show movers yet. Check back soon.',
  },
  'rising-coming-soon': {
    icon: TrendingUp,
    title: 'Most Active This Month',
    body: 'No players have logged Top 100 courses in the last 30 days. Be the first!',
    cta: { label: 'Explore Top 100', action: 'show-top100' },
  },
  'courses-friends-no-friends': {
    icon: Users,
    title: 'Friends playing',
    body: "Add friends to see what they're playing and rating.",
    cta: { label: 'Find friends', action: 'find-friends' },
  },
  'courses-friends-no-activity': {
    icon: Users,
    title: 'Friends playing',
    body: 'No friend activity on this Top 100 list yet.',
    cta: { label: 'Switch list', action: 'switch-list' },
  },
  'courses-trending': {
    icon: TrendingUp,
    title: 'Trending',
    body: "Not enough recent ratings to show what's trending yet.",
  },
  'courses-highest-rated': {
    icon: Star,
    title: 'Highest rated',
    body: 'Ratings are still building. Check back soon.',
  },
  'courses-most-played': {
    icon: Star,
    title: 'Most played',
    body: 'Plays are still building. Check back soon.',
  },
  'no-matches': {
    icon: Filter,
    title: 'No matches',
    body: 'Try a different list, region, or time range.',
    cta: { label: 'Reset filters', action: 'reset-filters' },
  },
};

export function LeaderboardEmptyState({ type, onResetFilters }: LeaderboardEmptyStateProps) {
  const navigate = useNavigate();
  const state = EMPTY_STATES[type];
  const Icon = state.icon;

  const handleCta = () => {
    if (!state.cta) return;
    
    switch (state.cta.action) {
      case 'find-friends':
        navigate('/golferstofollow');
        break;
      case 'invite-friend':
        // Could open share sheet or invite flow
        navigate('/golferstofollow');
        break;
      case 'show-top100':
        navigate('/courses?tab=top100');
        break;
      case 'switch-list':
        // Handled by parent component
        break;
      case 'reset-filters':
        onResetFilters?.();
        break;
    }
  };

  return (
    <div className="max-w-[520px] w-full mx-auto px-6 py-12">
      <div className="flex flex-col items-center text-center gap-5">
        {/* Icon disc with glass feel - matching FriendsCoursesEmpty */}
        <div className="w-20 h-20 rounded-full bg-white/40 backdrop-blur-sm border border-white/40 flex items-center justify-center">
          <Icon className="w-9 h-9 text-muted-foreground" />
        </div>

        {/* Headline */}
        <h2 className="text-xl font-semibold text-foreground">
          {state.title}
        </h2>

        {/* Body */}
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px]">
          {state.body}
        </p>

        {/* Primary CTA */}
        {state.cta && (
          <Button
            onClick={handleCta}
            className="w-full h-12 rounded-xl"
          >
            {state.cta.label}
          </Button>
        )}
      </div>
    </div>
  );
}
