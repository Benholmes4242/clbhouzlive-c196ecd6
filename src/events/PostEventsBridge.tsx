// Global post event listener - mounted once at app root
// Handles cache invalidation uniformly for all post events

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { postEventBus } from '@/events/postEventBus';
import { postKeys } from '@/queryKeys/posts';

interface PostEventsBridgeProps {
  children: React.ReactNode;
}

export function PostEventsBridge({ children }: PostEventsBridgeProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Handle post:created events
    const offCreated = postEventBus.on('post:created', (evt) => {
      // Invalidate actor-scoped feed
      queryClient.invalidateQueries({
        queryKey: postKeys.actorPosts(evt.actorType, evt.actorId),
      });

      // Invalidate profile page posts query
      queryClient.invalidateQueries({
        queryKey: postKeys.profilePosts(evt.actorType, evt.actorId),
      });

      // Invalidate actor post count
      queryClient.invalidateQueries({
        queryKey: postKeys.actorPostsCount(evt.actorType, evt.actorId),
      });

      // Invalidate trending/global feed
      queryClient.invalidateQueries({
        queryKey: postKeys.trending(),
      });

      // Invalidate followed users posts feed (for the author)
      queryClient.invalidateQueries({
        queryKey: postKeys.followedUsersPosts(evt.userId),
      });

      // Invalidate user posts (legacy useUserPosts hook)
      queryClient.invalidateQueries({
        queryKey: postKeys.userPosts(evt.userId),
      });

      // For personal posts, also invalidate the activity feed
      if (evt.actorType === 'personal') {
        queryClient.invalidateQueries({
          queryKey: postKeys.activityPosts(evt.actorId),
        });
      }
    });

    // Handle post:updated events (e.g., after studio edits)
    const offUpdated = postEventBus.on('post:updated', (evt) => {
      // Invalidate actor-scoped feed
      queryClient.invalidateQueries({
        queryKey: postKeys.actorPosts(evt.actorType, evt.actorId),
      });

      // Invalidate trending/global feed
      queryClient.invalidateQueries({
        queryKey: postKeys.trending(),
      });

      // For personal posts, also invalidate the activity feed
      if (evt.actorType === 'personal') {
        queryClient.invalidateQueries({
          queryKey: postKeys.activityPosts(evt.actorId),
        });
      }
    });

    // Handle post:deleted events
    const offDeleted = postEventBus.on('post:deleted', (evt) => {
      queryClient.invalidateQueries({
        queryKey: postKeys.actorPosts(evt.actorType, evt.actorId),
      });

      queryClient.invalidateQueries({
        queryKey: postKeys.actorPostsCount(evt.actorType, evt.actorId),
      });

      queryClient.invalidateQueries({
        queryKey: postKeys.trending(),
      });

      if (evt.actorType === 'personal') {
        queryClient.invalidateQueries({
          queryKey: postKeys.activityPosts(evt.actorId),
        });
      }
    });

    return () => {
      offCreated();
      offUpdated();
      offDeleted();
    };
  }, [queryClient]);

  return <>{children}</>;
}
