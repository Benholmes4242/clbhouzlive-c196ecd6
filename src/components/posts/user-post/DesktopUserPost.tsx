import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { UserPostHeader } from './UserPostHeader';
import { UserPostContent } from './UserPostContent';
import { UserPostMedia } from './UserPostMedia';
import { UserPostActions } from './UserPostActions';
import EditPostDialog from '../EditPostDialog';
import { UserPostData, GolfCourse } from './types';

interface DesktopUserPostProps {
  post: UserPostData;
  displayName: string;
  timeAgo: string;
  isOwnPost: boolean;
  /** @deprecated Use courses array instead */
  golfCourse: GolfCourse | null;
  /** Array of golf courses for multi-course support */
  courses?: GolfCourse[];
  rawCourseId?: string | null;
  onProfileClick: () => void;
  onDeletePost: () => void;
  onPostUpdated?: () => void;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video', currentIndex?: number) => void;
}

export const DesktopUserPost: React.FC<DesktopUserPostProps> = ({
  post,
  displayName,
  timeAgo,
  isOwnPost,
  golfCourse,
  courses,
  rawCourseId,
  onProfileClick,
  onDeletePost,
  onPostUpdated,
  onMediaClick
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { ref: autoplayRef, shouldAutoplay, handleMouseEnter, handleMouseLeave } = useVideoAutoplay({
    enabled: true,
    threshold: 0.5, // 50% visibility for autoplay
    rootMargin: '300px' // Preload when within 300px
  });

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  return (
    <>
      <Card ref={autoplayRef} className="border-0 shadow-sm">
        <div className="p-4">
          <UserPostHeader
            displayName={displayName}
            timeAgo={timeAgo}
            profilePhotoUrl={post.user.profile_photo_url}
            username={post.user.username}
            isOwnPost={isOwnPost}
            onProfileClick={onProfileClick}
            onEditClick={handleEditClick}
            onDeleteClick={onDeletePost}
          />

          <UserPostContent
            content={post.content}
            tags={post.post_tags}
          />

          <UserPostMedia
            media={post.post_media}
            golfCourse={golfCourse}
            courses={courses}
            rawCourseId={rawCourseId}
            shouldAutoplay={shouldAutoplay}
            onMediaClick={onMediaClick}
            badges={post.badges}
          />

          <UserPostActions />
        </div>
      </Card>

      <EditPostDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        post={post}
        onPostUpdated={onPostUpdated}
      />
    </>
  );
};