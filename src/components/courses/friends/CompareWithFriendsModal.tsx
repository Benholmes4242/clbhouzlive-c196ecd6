import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { X, Trophy, Target, Users, CheckCircle } from 'lucide-react';
import { useFriendsLeaderboard } from '@/hooks/useFriendsLeaderboard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserAchievements } from '@/hooks/useUserAchievements';

interface CompareWithFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserCourses: number;
  currentUserRegionalProgress?: {
    britainIrelandCompleted: number;
    europeCompleted: number;
    usaCompleted: number;
    worldwideCompleted: number;
  };
}

const CompareWithFriendsModal: React.FC<CompareWithFriendsModalProps> = ({
  isOpen,
  onClose,
  currentUserCourses,
  currentUserRegionalProgress = {
    britainIrelandCompleted: 0,
    europeCompleted: 0,
    usaCompleted: 0,
    worldwideCompleted: 0
  }
}) => {
  const { user } = useSupabaseSession();
  const { data: friends = [] } = useFriendsLeaderboard(user?.id);
  const { data: achievements = [] } = useUserAchievements(user?.id);

  const getDisplayName = (friend: any) => {
    return friend.display_name || friend.username || 'Golf Friend';
  };




  const getTrophyLevel = (courses: number) => {
    if (courses >= 300) return { name: 'Legend', emoji: '👑', color: 'text-purple-500' };
    if (courses >= 200) return { name: 'Elite', emoji: '🏆', color: 'text-emerald-500' };
    if (courses >= 100) return { name: 'Century', emoji: '🥇', color: 'text-blue-500' };
    if (courses >= 50) return { name: 'Turn', emoji: '🥈', color: 'text-gray-500' };
    if (courses >= 20) return { name: 'Rookie', emoji: '🥉', color: 'text-amber-500' };
    return { name: 'Starter', emoji: '⭐', color: 'text-gray-400' };
  };

  const getComparisonMessage = (yourCourses: number, friendCourses: number) => {
    const diff = yourCourses - friendCourses;
    if (diff > 0) {
      return `You're ahead by ${diff} course${diff === 1 ? '' : 's'}! 🎯`;
    } else if (diff < 0) {
      return `${Math.abs(diff)} course${Math.abs(diff) === 1 ? '' : 's'} behind - time to catch up! 🏃‍♂️`;
    } else {
      return "You're tied! Perfect competition! 🤝";
    }
  };

  const sortedFriends = friends.sort((a, b) => b.coursesPlayed - a.coursesPlayed);
  const yourRank = sortedFriends.findIndex(f => f.coursesPlayed <= currentUserCourses) + 1;
  const currentUserTrophy = getTrophyLevel(currentUserCourses);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto z-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Compare with Friends
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Add friends to see how you compare!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Your Stats */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        YOU
                      </div>
                      <div>
                        <h3 className="font-semibold">Your Progress</h3>
                        <p className="text-sm text-muted-foreground">
                          Rank #{yourRank} of {friends.length + 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`${currentUserTrophy.color} border-0 bg-white/10`}
                        >
                          {currentUserTrophy.emoji} {currentUserTrophy.name}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold">{currentUserCourses} courses</p>
                      <p className="text-sm text-muted-foreground">
                        {(currentUserCourses * 110).toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                  
                  {/* Regional Progress */}
                  <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold">{currentUserRegionalProgress.britainIrelandCompleted}</div>
                      <div className="text-xs text-muted-foreground">GB&I</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{currentUserRegionalProgress.europeCompleted}</div>
                      <div className="text-xs text-muted-foreground">Europe</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{currentUserRegionalProgress.usaCompleted}</div>
                      <div className="text-xs text-muted-foreground">USA</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{currentUserRegionalProgress.worldwideCompleted}</div>
                      <div className="text-xs text-muted-foreground">World</div>
                    </div>
                  </div>
                </div>

                {/* Friends Comparison */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg mb-4">Friends Comparison</h3>
                  {sortedFriends.map((friend) => {
                    const friendTrophy = getTrophyLevel(friend.coursesPlayed);
                    const comparisonMessage = getComparisonMessage(currentUserCourses, friend.coursesPlayed);
                    
                    return (
                      <div 
                        key={friend.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <SquircleAvatar
                              src={friend.profile_photo_url || null}
                              alt={getDisplayName(friend)}
                              userId={friend.id}
                              size="md"
                            />
                            <div>
                              <h4 className="font-medium">{getDisplayName(friend)}</h4>
                              <p className="text-sm text-muted-foreground">
                                {comparisonMessage}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant="secondary" 
                              className={`${friendTrophy.color} border-0 bg-muted`}
                            >
                              {friendTrophy.emoji} {friendTrophy.name}
                            </Badge>
                            <p className="text-lg font-bold mt-1">{friend.coursesPlayed} courses</p>
                          </div>
                        </div>
                        
                        {/* Regional Comparison */}
                        <div className="grid grid-cols-4 gap-4 text-center text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">{friend.britainIrelandCompleted}</span>
                              {friend.britainIrelandCompleted >= currentUserRegionalProgress.britainIrelandCompleted && (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">GB&I</div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">{friend.europeCompleted}</span>
                              {friend.europeCompleted >= currentUserRegionalProgress.europeCompleted && (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">Europe</div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">{friend.usaCompleted}</span>
                              {friend.usaCompleted >= currentUserRegionalProgress.usaCompleted && (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">USA</div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">{friend.worldwideCompleted}</span>
                              {friend.worldwideCompleted >= currentUserRegionalProgress.worldwideCompleted && (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">World</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CompareWithFriendsModal;