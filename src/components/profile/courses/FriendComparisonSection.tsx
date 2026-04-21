import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { useUserFriends } from '@/hooks/useUserFriends';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { MapPin, Globe, Trophy } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FriendComparisonSectionProps {
  userId: string;
}

export const FriendComparisonSection: React.FC<FriendComparisonSectionProps> = ({ userId }) => {
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { data: friends = [] } = useUserFriends(userId);
  const { totalCoursesPlayed: myCoursesPlayed, countriesPlayed: myCountriesPlayed, top100Progress: myTop100Progress } = useUserCourseSummary(userId);
  const { totalCoursesPlayed: friendCoursesPlayed, countriesPlayed: friendCountriesPlayed, top100Progress: friendTop100Progress } = useUserCourseSummary(selectedFriendId || undefined);

  if (friends.length === 0) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-2">Compare your journey</h2>
        <p className="text-sm text-muted-foreground">
          Follow other golfers to unlock comparison.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Compare your journey</h2>
        <p className="text-sm text-muted-foreground mb-4">
          See how your Golf Journey stacks up against a friend.
        </p>
        
        <Select value={selectedFriendId || ''} onValueChange={setSelectedFriendId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Search friends…" />
          </SelectTrigger>
          <SelectContent>
            {friends.map((friend) => (
              <SelectItem key={friend.id} value={friend.id}>
                <div className="flex items-center gap-2">
                  <SquircleAvatar
                    src={friend.profile_photo_url}
                    alt={friend.display_name || friend.username || ''}
                    userId={friend.id}
                    size={24}
                    hideRing
                  />
                  {friend.display_name || friend.username}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedFriendId && (
        <div className="space-y-4 mt-6">
          {/* Courses Played Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">You</span>
              </div>
              <p className="text-2xl font-bold">{myCoursesPlayed}</p>
              <p className="text-xs text-muted-foreground">Courses Played</p>
            </div>
            <div className="bg-background/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {friends.find(f => f.id === selectedFriendId)?.display_name || 'Friend'}
                </span>
              </div>
              <p className="text-2xl font-bold">{friendCoursesPlayed}</p>
              <p className="text-xs text-muted-foreground">Courses Played</p>
            </div>
          </div>

          {/* Countries Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">You</span>
              </div>
              <p className="text-2xl font-bold">{myCountriesPlayed}</p>
              <p className="text-xs text-muted-foreground">Countries</p>
            </div>
            <div className="bg-background/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {friends.find(f => f.id === selectedFriendId)?.display_name || 'Friend'}
                </span>
              </div>
              <p className="text-2xl font-bold">{friendCountriesPlayed}</p>
              <p className="text-xs text-muted-foreground">Countries</p>
            </div>
          </div>

          {/* Top 100 Progress Comparison */}
          <div className="bg-background/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Top 100 Progress</span>
            </div>
            <div className="space-y-3">
              {myTop100Progress.map((progress) => {
                const friendProgress = friendTop100Progress.find(fp => fp.listSlug === progress.listSlug);
                return (
                  <div
                    key={progress.listSlug}
                    onClick={() => navigate(`/top100/${progress.listSlug}`)}
                    className="cursor-pointer hover:bg-background/70 p-3 rounded-lg transition-colors"
                  >
                    <p className="text-xs text-muted-foreground mb-1">{progress.listName}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        You: <span className="font-semibold">{progress.played}/{progress.total}</span>
                      </span>
                      <span className="text-sm">
                        Them: <span className="font-semibold">{friendProgress?.played || 0}/{progress.total}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
