// Hook for managing scheduled posts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchScheduledPosts,
  fetchScheduledPostForEdit,
  reschedulePost,
  publishNow,
  deleteScheduledPost,
  getScheduledPostCount,
  updateScheduledPost,
  type ScheduledPost,
  type ScheduledPostForEdit,
  type UpdateScheduledPostData,
} from '@/services/posts/scheduledPosts';

const SCHEDULED_POSTS_KEY = ['scheduled-posts'];
const SCHEDULED_COUNT_KEY = ['scheduled-posts-count'];

export type { ScheduledPost, ScheduledPostForEdit };

export function useScheduledPosts() {
  const queryClient = useQueryClient();

  // Fetch scheduled posts
  const { data: scheduledPosts = [], isLoading, refetch } = useQuery({
    queryKey: SCHEDULED_POSTS_KEY,
    queryFn: fetchScheduledPosts,
    staleTime: 30_000,
  });

  // Get count
  const { data: count = 0 } = useQuery({
    queryKey: SCHEDULED_COUNT_KEY,
    queryFn: getScheduledPostCount,
    staleTime: 30_000,
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: ({ postId, newTime }: { postId: string; newTime: Date }) =>
      reschedulePost(postId, newTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULED_POSTS_KEY });
      toast.success('Post rescheduled');
    },
    onError: () => {
      toast.error('Failed to reschedule');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: UpdateScheduledPostData }) =>
      updateScheduledPost(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULED_POSTS_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULED_COUNT_KEY });
    },
    onError: () => {
      toast.error('Failed to update');
    },
  });

  // Publish now mutation
  const publishNowMutation = useMutation({
    mutationFn: publishNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULED_POSTS_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULED_COUNT_KEY });
    },
    onError: () => {
      toast.error("Couldn't publish");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteScheduledPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULED_POSTS_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULED_COUNT_KEY });
      toast.success('Scheduled post deleted');
    },
    onError: () => {
      toast.error('Failed to delete');
    },
  });

  return {
    scheduledPosts,
    count,
    isLoading,
    refetch,
    fetchForEdit: fetchScheduledPostForEdit,
    reschedule: (postId: string, newTime: Date) =>
      rescheduleMutation.mutateAsync({ postId, newTime }),
    update: (postId: string, data: UpdateScheduledPostData) =>
      updateMutation.mutateAsync({ postId, data }),
    publishNow: publishNowMutation.mutateAsync,
    deletePost: deleteMutation.mutateAsync,
    isRescheduling: rescheduleMutation.isPending,
    isUpdating: updateMutation.isPending,
    isPublishing: publishNowMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
