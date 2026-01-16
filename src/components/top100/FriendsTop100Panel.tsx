import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFriendsTop100Progress } from '@/hooks/useFriendsTop100Progress';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getProfilePathById } from '@/lib/profileRoutes';

interface FriendsTop100PanelProps {
  listId: string;
  listName: string;
}

export const FriendsTop100Panel: React.FC<FriendsTop100PanelProps> = ({ listId, listName }) => {
  const { user } = useSupabaseSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  
  const { data: friendsProgress = [] } = useFriendsTop100Progress(user?.id, listId);

  if (!user) return null;

  if (friendsProgress.length === 0) {
    return (
      <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-6 mb-6">
        <p className="text-sm text-muted-foreground text-center">
          None of your friends have started this list yet.
        </p>
      </div>
    );
  }

  const topThree = friendsProgress.slice(0, 3);

  return (
    <>
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Your friends on this list</h3>
            <p className="text-sm text-muted-foreground">
              {friendsProgress.length} {friendsProgress.length === 1 ? 'friend has' : 'friends have'} played at least one course.
            </p>
          </div>
          {friendsProgress.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              View all
            </Button>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto">
          {topThree.map((friend) => (
            <div
              key={friend.user_id}
              onClick={() => {
                const path = getProfilePathById(friend.user_id, (friend as any).creator_only, friend.profile.username);
                navigate(path);
              }}
              className="flex-shrink-0 bg-background/50 rounded-xl p-4 cursor-pointer hover:bg-background/70 transition-colors min-w-[160px]"
            >
              <div className="flex flex-col items-center gap-2">
                <SquircleAvatar
                  size={48}
                  src={friend.profile.profile_photo_url}
                  alt={friend.profile.display_name || friend.profile.username || ''}
                  fallback={(friend.profile.display_name?.[0] || friend.profile.username?.[0] || '?').toUpperCase()}
                  thinRing
                />
                <div className="text-center">
                  <p className="font-medium text-sm truncate max-w-[140px]">
                    {friend.profile.display_name || friend.profile.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {friend.courses_played_in_list}/100 played
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{listName} – Your Friends</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {friendsProgress.map((friend, index) => (
              <div
                key={friend.user_id}
                onClick={() => {
                  const path = getProfilePathById(friend.user_id, (friend as any).creator_only, friend.profile.username);
                  navigate(path);
                  setIsModalOpen(false);
                }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="text-sm font-medium text-muted-foreground w-6">
                  #{index + 1}
                </div>
                <SquircleAvatar
                  size={40}
                  src={friend.profile.profile_photo_url}
                  alt={friend.profile.display_name || friend.profile.username || ''}
                  fallback={(friend.profile.display_name?.[0] || friend.profile.username?.[0] || '?').toUpperCase()}
                  thinRing
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {friend.profile.display_name || friend.profile.username}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  {friend.courses_played_in_list}/100
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
