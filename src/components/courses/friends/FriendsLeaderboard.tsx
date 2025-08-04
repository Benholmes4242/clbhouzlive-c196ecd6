import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, Trophy, Target, Calendar, TrendingUp, UserPlus, ChevronDown } from 'lucide-react';
import { useFriendsLeaderboard } from '@/hooks/useFriendsLeaderboard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';

type SortBy = 'courses' | 'xp' | 'recent';

interface FriendsLeaderboardProps {
  onInviteFriends?: () => void;
  onCompareWith?: (friendId: string) => void;
}

const FriendsLeaderboard: React.FC<FriendsLeaderboardProps> = ({
  onInviteFriends,
  onCompareWith
}) => {
  const { user } = useSupabaseSession();
  const [sortBy, setSortBy] = useState<SortBy>('courses');
  const [isOpen, setIsOpen] = useState(false);
  
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

  const getInitials = (friend: any) => {
    const name = getDisplayName(friend);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Friends' Progress
                </div>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-muted rounded w-24" />
                      <div className="h-3 bg-muted rounded w-16" />
                    </div>
                    <div className="h-4 bg-muted rounded w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  if (friends.length === 0) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Friends' Progress
                </div>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="text-center py-8">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Invite your golf friends!</h3>
              <p className="text-muted-foreground mb-4">
                Compare your golfing journeys and see who's conquered the most legendary courses.
              </p>
              <Button onClick={onInviteFriends} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Friends to Clbhouz
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  const sortedFriends = getSortedFriends();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Friends' Progress
              </div>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardHeader className="pt-0">
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'courses' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('courses')}
                className="gap-1"
              >
                <Trophy className="h-3 w-3" />
                Most Courses
              </Button>
              <Button
                variant={sortBy === 'xp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('xp')}
                className="gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                Highest XP
              </Button>
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('recent')}
                className="gap-1"
              >
                <Calendar className="h-3 w-3" />
                Most Recent
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {sortedFriends.map((friend, index) => {
                const trophy = getTrophyLevel(friend.coursesPlayed);
                const isTopThree = index < 3;
                
                return (
                  <div
                    key={friend.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer",
                      isTopThree && "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20"
                    )}
                    onClick={() => onCompareWith?.(friend.id)}
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
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.profile_photo_url || ''} />
                      <AvatarFallback className="text-sm">
                        {getInitials(friend)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Friend Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
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

                    {/* Regional Progress */}
                    <div className="hidden md:flex items-center gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium">{friend.britainIrelandCompleted}</div>
                        <div className="text-muted-foreground">GB&I</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{friend.europeCompleted}</div>
                        <div className="text-muted-foreground">EUR</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{friend.usaCompleted}</div>
                        <div className="text-muted-foreground">USA</div>
                      </div>
                    </div>

                    {/* Compare Button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompareWith?.(friend.id);
                      }}
                    >
                      <Target className="h-3 w-3" />
                      Compare
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default FriendsLeaderboard;