import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Trophy, Calendar, TrendingUp, UserPlus } from 'lucide-react';
import { useFriendsLeaderboard } from '@/hooks/useFriendsLeaderboard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';

type SortBy = 'courses' | 'xp' | 'recent';

interface FriendsLeaderboardProps {
  onInviteFriends?: () => void;
}

const FriendsLeaderboard: React.FC<FriendsLeaderboardProps> = ({
  onInviteFriends
}) => {
  const { user } = useSupabaseSession();
  const [sortBy, setSortBy] = useState<SortBy>('courses');
  
  
  const { data: friends = [], isLoading } = useFriendsLeaderboard(user?.id);

  const getSortedFriends = () => {
    const sorted = [...friends];
    switch (sortBy) {
      case 'courses':
        return sorted.sort((a, b) => b.coursesPlayed - a.coursesPlayed);
      case 'xp':
        return sorted.sort((a, b) => b.totalXP - a.totalXP);
      case 'recent':
        return sorted.sort((a, b) => {
          if (!a.lastPlayedDate && !b.lastPlayedDate) return 0;
          if (!a.lastPlayedDate) return 1;
          if (!b.lastPlayedDate) return -1;
          return new Date(b.lastPlayedDate).getTime() - new Date(a.lastPlayedDate).getTime();
        });
      default:
        return sorted;
    }
  };

  const getDisplayName = (friend: any) => {
    return friend.display_name || friend.username || 'Golf Friend';
  };




  const getTrophyLevel = (courses: number) => {
    if (courses >= 300) return { name: 'Legend', color: 'from-purple-500 to-violet-600', emoji: '👑' };
    if (courses >= 200) return { name: 'Elite', color: 'from-emerald-500 to-green-600', emoji: '🏆' };
    if (courses >= 100) return { name: 'Century', color: 'from-blue-500 to-indigo-600', emoji: '🥇' };
    if (courses >= 50) return { name: 'Turn', color: 'from-gray-400 to-slate-500', emoji: '🥈' };
    if (courses >= 20) return { name: 'Rookie', color: 'from-amber-500 to-yellow-600', emoji: '🥉' };
    return { name: 'Starter', color: 'from-gray-600 to-gray-700', emoji: '⭐' };
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted/50 rounded w-16" />
            </div>
            <div className="h-4 bg-muted rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2 text-foreground">Invite your golf friends!</h3>
        <p className="text-muted-foreground mb-4">
          Compare your golfing journeys and see who's conquered the most legendary courses.
        </p>
        <Button 
          onClick={onInviteFriends} 
          className="gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-400"
        >
          <UserPlus className="h-4 w-4" />
          Invite Friends to Clbhouz
        </Button>
      </div>
    );
  }

  const sortedFriends = getSortedFriends();

  return (
    <div className="space-y-4">
      {/* Sort Buttons */}
      <div className="flex gap-2">
        <Button
          variant={sortBy === 'courses' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('courses')}
          className="gap-1 bg-muted border-border text-foreground hover:bg-muted/80"
        >
          <Trophy className="h-3 w-3" />
          Most Courses
        </Button>
        <Button
          variant={sortBy === 'xp' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('xp')}
          className="gap-1 bg-muted border-border text-foreground hover:bg-muted/80"
        >
          <TrendingUp className="h-3 w-3" />
          Highest XP
        </Button>
        <Button
          variant={sortBy === 'recent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('recent')}
          className="gap-1 bg-muted border-border text-foreground hover:bg-muted/80"
        >
          <Calendar className="h-3 w-3" />
          Most Recent
        </Button>
      </div>
      
      {/* Friends List */}
      <div className="space-y-3">
        {sortedFriends.map((friend, index) => {
          const trophy = getTrophyLevel(friend.coursesPlayed);
          const isTopThree = index < 3;
          
          return (
            <div
              key={friend.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border border-border bg-muted",
                isTopThree && "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20"
              )}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-6">
                {index < 3 ? (
                  <span className="text-xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <SquircleAvatar
                src={friend.profile_photo_url || null}
                alt={getDisplayName(friend)}
                userId={friend.id}
                size="md"
              />

              {/* Friend Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate text-foreground">
                    {getDisplayName(friend)}
                  </p>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs bg-gradient-to-r text-white border-0",
                      trophy.color
                    )}
                  >
                    {trophy.emoji} {trophy.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{friend.coursesPlayed} courses</span>
                  <span>{friend.totalXP.toLocaleString()} XP</span>
                  {friend.lastPlayedDate && (
                    <span>
                      Last played: {new Date(friend.lastPlayedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Regional Progress - Flag Buttons */}
              <div className="hidden md:flex items-center gap-2 text-xs">
                <div className="text-center bg-muted border border-border rounded px-2 py-1">
                  <div className="font-medium text-foreground">{friend.britainIrelandCompleted}</div>
                  <div className="text-muted-foreground">🇬🇧</div>
                </div>
                <div className="text-center bg-muted border border-border rounded px-2 py-1">
                  <div className="font-medium text-foreground">{friend.europeCompleted}</div>
                  <div className="text-muted-foreground">🇪🇺</div>
                </div>
                <div className="text-center bg-muted border border-border rounded px-2 py-1">
                  <div className="font-medium text-foreground">{friend.usaCompleted}</div>
                  <div className="text-muted-foreground">🇺🇸</div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FriendsLeaderboard;