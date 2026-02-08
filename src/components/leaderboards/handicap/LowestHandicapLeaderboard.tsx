import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { useLowestHandicapLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatHcp } from '@/lib/formatHcp';
import { HandicapPodium } from './HandicapPodium';
import { HandicapInsightBanner } from './HandicapInsightBanner';
import {
  LeaderboardRow,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import type { LeaderboardScope } from '@/types/leaderboards';
import { cn } from '@/lib/utils';

// Metallic palette matching MedalBadge
const RANK_COLORS: Record<number, string> = {
  1: '#C1A84C', // Gold
  2: '#B8C6C9', // Silver
  3: '#8B7355', // Bronze
};

interface LowestHandicapLeaderboardProps {
  scope: LeaderboardScope;
  clubId?: string | null;
  clubName?: string | null;
  country?: string | null;
  scopeSelector?: React.ReactNode;
}

export function LowestHandicapLeaderboard({ scope, clubId, clubName, country, scopeSelector }: LowestHandicapLeaderboardProps) {
  const { user } = useSupabaseSession();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data: entries, isLoading } = useLowestHandicapLeaderboard({ 
    scope,
    clubId: scope === 'club' ? clubId : undefined,
    country: scope === 'country' ? country : undefined,
  });

  // Scroll-to-top FAB visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="px-4">
        <LeaderboardLoading />
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <div className="px-4 space-y-4">
        {scopeSelector}
        <LeaderboardEmpty
          title={scope === 'club' ? "No handicaps from this club yet" : "No handicaps recorded"}
          description={
            scope === 'club' && clubName
              ? `Invite your club mates from ${clubName} to join!`
              : "Add your handicap to your profile to appear here!"
          }
        />
      </div>
    );
  }

  // Find current user's rank
  const currentUserEntry = entries.find(e => e.user_id === user?.id);
  const userRank = currentUserEntry?.rank;

  // Show ALL entries in the list (podium players included, like Championship)
  const listEntries = entries;

  return (
    <div className="space-y-5">
      {/* Podium for Top 3 - FIRST, before scope selector */}
      {entries.length >= 3 && (
        <HandicapPodium
          entries={entries.slice(0, 3)}
          currentUserId={user?.id}
          mode="lowest"
        />
      )}

      {/* Scope Selector (Global/Friends/Club) - passed from parent */}
      {scopeSelector && (
        <div className="py-4">
          {scopeSelector}
        </div>
      )}

      {/* Insight Banner */}
      <HandicapInsightBanner userRank={userRank} mode="lowest" />

      {/* Rankings List */}
      {listEntries.length > 0 && (
        <div className="space-y-2">
          {listEntries.map((entry) => {
            const rankColor = RANK_COLORS[entry.rank];
            
            return (
              <LeaderboardRow
                key={entry.user_id}
                rank={entry.rank}
                userId={entry.user_id}
                displayName={entry.display_name || 'Unknown'}
                profilePhotoUrl={entry.avatar_url}
                isCurrentUser={entry.user_id === user?.id}
              >
                {/* Handicap stat with rank-matched color for top 3, slate for 4+ */}
                <div className="text-right">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: rankColor || 'hsl(var(--muted-foreground))' }}
                  >
                    {formatHcp(entry.handicap_index)}
                  </div>
                </div>
              </LeaderboardRow>
            );
          })}
        </div>
      )}

      {/* End of list indicator */}
      {entries.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          You've reached the end
        </p>
      )}

      {/* Scroll-to-top FAB */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          "fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full",
          "bg-foreground/80 text-background shadow-lg backdrop-blur-sm",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out active:scale-[0.95]",
          showScrollTop 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
}
