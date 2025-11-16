import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFriendsWhoPlayedCourse } from '@/hooks/useFriendsWhoPlayedCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface CourseFriendsStripProps {
  courseId: string;
  courseName: string;
}

export const CourseFriendsStrip: React.FC<CourseFriendsStripProps> = ({ courseId, courseName }) => {
  const { user } = useSupabaseSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  
  const { data: friends = [] } = useFriendsWhoPlayedCourse(user?.id, courseId);

  if (!user || friends.length === 0) return null;

  const displayedFriends = friends.slice(0, 6);
  const remainingCount = Math.max(0, friends.length - 6);

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 cursor-pointer hover:bg-card/70 transition-colors"
      >
        <h3 className="text-sm font-medium mb-3">Friends who've played here</h3>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {displayedFriends.map((friend) => (
              <Avatar key={friend.user_id} className="w-8 h-8 border-2 border-background">
                <AvatarImage src={friend.profile.profile_photo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {friend.profile.display_name?.[0]?.toUpperCase() || 
                   friend.profile.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {friends.length} {friends.length === 1 ? 'friend has' : 'friends have'} logged a round here
            {remainingCount > 0 && ` (+${remainingCount} more)`}
          </span>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Friends who've played {courseName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {friends.map((friend) => (
              <div
                key={friend.user_id}
                onClick={() => {
                  navigate(`/profile/${friend.profile.username}`);
                  setIsModalOpen(false);
                }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={friend.profile.profile_photo_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {friend.profile.display_name?.[0]?.toUpperCase() || 
                     friend.profile.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {friend.profile.display_name || friend.profile.username}
                  </p>
                  {friend.last_played_at && (
                    <p className="text-xs text-muted-foreground">
                      Last played {formatDistanceToNow(new Date(friend.last_played_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
                {friend.has_review && (
                  <Badge variant="secondary" className="text-xs">
                    Left a review
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
