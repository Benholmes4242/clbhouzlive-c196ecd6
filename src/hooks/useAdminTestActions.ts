import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TEST_USER_USERNAME, TEST_USER_DISPLAY_NAME } from '@/config/testUser';

interface TestUserProfile {
  id: string;
  username: string;
  display_name: string;
  profile_photo_url: string | null;
}

/**
 * Hook to fetch the test user profile
 */
export function useTestUser() {
  return useQuery({
    queryKey: ['test-user'],
    queryFn: async (): Promise<TestUserProfile | null> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .eq('is_test', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching test user:', error);
        return null;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to send a friend request FROM the test user TO the target
 */
export function useSendFriendRequestFromTestUser() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Check if request already exists
      const { data: existing } = await supabase
        .from('user_friends')
        .select('id, status')
        .or(`and(user_id.eq.${testUser.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${testUser.id})`)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'accepted') {
          throw new Error('Already friends');
        }
        if (existing.status === 'pending') {
          throw new Error('Friend request already pending');
        }
      }

      // Create friend request
      const { data: request, error: requestError } = await supabase
        .from('user_friends')
        .insert({
          user_id: testUser.id,
          friend_id: targetUserId,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create notification for target
      const { error: notifyError } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'friend_request',
          title: 'Friend request',
          entity_type: 'friend_request',
          entity_id: request.id,
          is_read: false,
          data: { request_id: request.id },
        });

      if (notifyError) {
        console.warn('Failed to create notification:', notifyError);
      }

      return request;
    },
    onSuccess: () => {
      toast.success(`Test user sent friend request`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send friend request', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Hook to accept the latest friend request from test user (as target)
 */
export function useAcceptFriendRequestAsTarget() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Find pending request from test user to target
      const { data: request, error: findError } = await supabase
        .from('user_friends')
        .select('id')
        .eq('user_id', testUser.id)
        .eq('friend_id', targetUserId)
        .eq('status', 'pending')
        .maybeSingle();

      if (findError) throw findError;
      if (!request) throw new Error('No pending friend request found');

      // Accept the request
      const { error: updateError } = await supabase
        .from('user_friends')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Create acceptance notification for test user
      const { error: notifyError } = await supabase
        .from('notifications')
        .insert({
          user_id: testUser.id,
          actor_id: targetUserId,
          type: 'friend_accepted',
          title: 'Friend request accepted',
          entity_type: 'profile',
          entity_id: targetUserId,
          is_read: false,
        });

      if (notifyError) {
        console.warn('Failed to create notification:', notifyError);
      }

      return request;
    },
    onSuccess: () => {
      toast.success(`Accepted friend request from test user`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to accept request', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Hook to decline the latest friend request from test user (as target)
 */
export function useDeclineFriendRequestAsTarget() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Find pending request from test user to target
      const { data: request, error: findError } = await supabase
        .from('user_friends')
        .select('id')
        .eq('user_id', testUser.id)
        .eq('friend_id', targetUserId)
        .eq('status', 'pending')
        .maybeSingle();

      if (findError) throw findError;
      if (!request) throw new Error('No pending friend request found');

      // Decline the request
      const { error: updateError } = await supabase
        .from('user_friends')
        .update({ status: 'declined' })
        .eq('id', request.id);

      if (updateError) throw updateError;

      return request;
    },
    onSuccess: () => {
      toast.success(`Declined friend request from test user`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to decline request', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Hook to cancel pending friend request from test user
 */
export function useCancelFriendRequestFromTestUser() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Find pending request from test user to target
      const { data: request, error: findError } = await supabase
        .from('user_friends')
        .select('id')
        .eq('user_id', testUser.id)
        .eq('friend_id', targetUserId)
        .eq('status', 'pending')
        .maybeSingle();

      if (findError) throw findError;
      if (!request) throw new Error('No pending friend request found');

      // Cancel (delete) the request
      const { error: deleteError } = await supabase
        .from('user_friends')
        .delete()
        .eq('id', request.id);

      if (deleteError) throw deleteError;

      // Remove notification for target
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', targetUserId)
        .eq('actor_id', testUser.id)
        .eq('type', 'friend_request');

      return request;
    },
    onSuccess: () => {
      toast.success(`Cancelled friend request from test user`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel request', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Hook to make test user follow the target
 */
export function useFollowTargetFromTestUser() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Create follow relationship
      const { error: followError } = await supabase
        .from('user_follows')
        .insert({
          follower_id: testUser.id,
          following_id: targetUserId,
        });

      if (followError) {
        if (followError.code === '23505') {
          throw new Error('Test user already follows this user');
        }
        throw followError;
      }

      // Create notification for target
      const { error: notifyError } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'follow',
          title: 'New follower',
          entity_type: 'profile',
          entity_id: testUser.id,
          is_read: false,
        });

      if (notifyError) {
        console.warn('Failed to create notification:', notifyError);
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Test user is now following target`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to follow', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Hook to make target follow the test user
 */
export function useFollowTestUserFromTarget() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Create follow relationship
      const { error: followError } = await supabase
        .from('user_follows')
        .insert({
          follower_id: targetUserId,
          following_id: testUser.id,
        });

      if (followError) {
        if (followError.code === '23505') {
          throw new Error('Target already follows test user');
        }
        throw followError;
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Target is now following test user`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to follow', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Hook to unfollow in both directions
 */
export function useUnfollowBoth() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Remove both follow directions
      await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', testUser.id)
        .eq('following_id', targetUserId);

      await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', targetUserId)
        .eq('following_id', testUser.id);

      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Unfollowed in both directions`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unfollow', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Hook to remove friend relationship
 */
export function useRemoveFriendship() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Remove friendship in both directions
      await supabase
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${testUser.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${testUser.id})`);

      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Removed friendship`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove friendship', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Hook to simulate a like notification
 */
export function useMockLikeNotification() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'like',
          title: 'Liked your post',
          entity_type: 'post',
          entity_id: 'mock-post-test',
          is_read: false,
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Simulated like notification`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create notification', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Hook to simulate a comment notification
 */
export function useMockCommentNotification() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'comment',
          title: 'Commented on your post',
          message: 'Incredible shot – which club did you use?',
          entity_type: 'post',
          entity_id: 'mock-post-test',
          is_read: false,
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Simulated comment notification`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create notification', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Hook to simulate a mention notification
 */
export function useMockMentionNotification() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'mention',
          title: 'Mentioned you in a post',
          message: 'Great round with @you yesterday!',
          entity_type: 'post',
          entity_id: 'mock-post-test',
          is_read: false,
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Simulated mention notification`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create notification', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Hook to clear all test notifications for target
 */
export function useClearTestNotifications() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', targetUserId)
        .eq('actor_id', testUser.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Cleared all test notifications`, {
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clear notifications', {
        position: 'top-center',
      });
    },
  });
}
