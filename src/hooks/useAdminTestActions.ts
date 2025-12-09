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

// ============================================
// QUICK SCENARIO HOOKS
// ============================================

/**
 * Scenario: Full friend request handshake
 * Test User sends request → Target accepts → Both get notifications
 */
export function useFriendRequestHandshake() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Step 1: Clear any existing friendship/requests between them
      await supabase
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${testUser.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${testUser.id})`);

      // Step 2: Test User sends friend request to target
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

      // Step 3: Create notification for target (friend request received)
      await supabase
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

      // Small delay to make the flow feel more realistic
      await new Promise(r => setTimeout(r, 500));

      // Step 4: Target accepts the request
      await supabase
        .from('user_friends')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      // Step 5: Create acceptance notification for test user
      await supabase
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

      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Friend request handshake completed`, {
        description: 'Request sent → Accepted → Both notified',
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete handshake', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Scenario: Busy day activity feed
 * Creates 20+ mixed notifications to test the Activity page
 */
export function useBusyDayActivity() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Clear existing test notifications first
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', targetUserId)
        .eq('actor_id', testUser.id);

      const notifications = [];
      const now = new Date();

      // Follow notification
      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'follow',
        title: 'New follower',
        entity_type: 'profile',
        entity_id: testUser.id,
        is_read: false,
        created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 min ago
      });

      // Friend request (pending)
      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'friend_request',
        title: 'Friend request',
        entity_type: 'friend_request',
        entity_id: 'mock-request-1',
        is_read: false,
        created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 min ago
      });

      // Likes (varied timestamps)
      const likeMessages = [
        'Loved your swing video!',
        'Great course shot!',
        'Amazing round!',
        'Beautiful scenery',
        'Perfect form!',
      ];
      for (let i = 0; i < 5; i++) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'like',
          title: 'Liked your post',
          entity_type: 'post',
          entity_id: `mock-post-${i}`,
          is_read: false,
          created_at: new Date(now.getTime() - (30 + i * 20) * 60 * 1000).toISOString(),
        });
      }

      // Comments
      const comments = [
        'Incredible shot - which club did you use?',
        'We should play together sometime!',
        'That is a tough hole, well played!',
        'Your short game is looking sharp',
      ];
      for (let i = 0; i < comments.length; i++) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'comment',
          title: 'Commented on your post',
          message: comments[i],
          entity_type: 'post',
          entity_id: `mock-post-comment-${i}`,
          is_read: false,
          created_at: new Date(now.getTime() - (60 + i * 45) * 60 * 1000).toISOString(),
        });
      }

      // Mentions
      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'mention',
        title: 'Mentioned you in a post',
        message: 'Great round with @you yesterday at St Andrews!',
        entity_type: 'post',
        entity_id: 'mock-post-mention-1',
        is_read: false,
        created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      });

      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'mention',
        title: 'Mentioned you in a post',
        message: 'Looking for a fourth this weekend with @you',
        entity_type: 'post',
        entity_id: 'mock-post-mention-2',
        is_read: false,
        created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      });

      // Add some older notifications (yesterday, this week)
      for (let i = 0; i < 6; i++) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: i % 2 === 0 ? 'like' : 'comment',
          title: i % 2 === 0 ? 'Liked your post' : 'Commented on your post',
          message: i % 2 === 1 ? 'Nice one! 🏌️' : undefined,
          entity_type: 'post',
          entity_id: `mock-post-old-${i}`,
          is_read: i > 2, // Some read, some unread
          created_at: new Date(now.getTime() - (24 + i * 12) * 60 * 60 * 1000).toISOString(),
        });
      }

      // Insert all notifications
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      // Also create follow relationship
      await supabase
        .from('user_follows')
        .upsert({
          follower_id: testUser.id,
          following_id: targetUserId,
        }, { onConflict: 'follower_id,following_id' });

      return { success: true, count: notifications.length };
    },
    onSuccess: (data) => {
      toast.success(`Created ${data?.count || 20}+ notifications`, {
        description: 'Check your Activity feed',
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create busy day', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Scenario: Follow swap (mutual follows)
 */
export function useFollowSwapScenario() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Clear existing follows
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

      // Test User → Target
      await supabase
        .from('user_follows')
        .insert({
          follower_id: testUser.id,
          following_id: targetUserId,
        });

      // Create follow notification
      await supabase
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

      await new Promise(r => setTimeout(r, 300));

      // Target → Test User (follow back)
      await supabase
        .from('user_follows')
        .insert({
          follower_id: targetUserId,
          following_id: testUser.id,
        });

      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Follow swap completed`, {
        description: 'Both users now follow each other',
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete follow swap', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Scenario: Reset all test state
 * Clears friendships, follows, and notifications between test user and target
 */
export function useResetTestState() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Clear friendships/requests
      await supabase
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${testUser.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${testUser.id})`);

      // Clear follows both directions
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

      // Clear notifications from test user to target
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', targetUserId)
        .eq('actor_id', testUser.id);

      // Clear notifications from target to test user
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', testUser.id)
        .eq('actor_id', targetUserId);

      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Test state reset`, {
        description: 'Friendships, follows, and notifications cleared',
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset test state', {
        position: 'top-center',
      });
    },
  });
}

// ============================================
// PRESET "LIVES" SCENARIOS
// ============================================

/**
 * Scenario: New user onboarding week
 * Light, friendly activity spread over several "days"
 */
export function useNewUserOnboardingWeek() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      const now = new Date();

      // Clear existing test data first
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', targetUserId)
        .eq('actor_id', testUser.id);

      await supabase
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${testUser.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${testUser.id})`);

      await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', testUser.id)
        .eq('following_id', targetUserId);

      const notifications = [];

      // Day 1 - Welcome follow (5 days ago)
      await supabase
        .from('user_follows')
        .insert({
          follower_id: testUser.id,
          following_id: targetUserId,
        });

      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'follow',
        title: 'New follower',
        entity_type: 'profile',
        entity_id: testUser.id,
        is_read: true,
        created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Day 2 - First like + comment (4 days ago)
      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'like',
        title: 'Liked your post',
        entity_type: 'post',
        entity_id: 'mock-post-welcome-1',
        is_read: true,
        created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      });

      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'comment',
        title: 'Commented on your post',
        message: 'Nice first post - swing is looking solid!',
        entity_type: 'post',
        entity_id: 'mock-post-welcome-1',
        is_read: true,
        created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      });

      // Day 3 - Friend request (3 days ago)
      const { data: friendRequest } = await supabase
        .from('user_friends')
        .insert({
          user_id: testUser.id,
          friend_id: targetUserId,
          status: 'pending',
        })
        .select()
        .single();

      if (friendRequest) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'friend_request',
          title: 'Friend request',
          entity_type: 'friend_request',
          entity_id: friendRequest.id,
          is_read: false,
          data: { request_id: friendRequest.id },
          created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Day 4 - Mention (2 days ago)
      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'mention',
        title: 'Mentioned you in a post',
        message: 'Great playing with @you this morning!',
        entity_type: 'post',
        entity_id: 'mock-post-mention-welcome',
        is_read: false,
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Day 5 - Another like (1 day ago)
      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'like',
        title: 'Liked your post',
        entity_type: 'post',
        entity_id: 'mock-post-welcome-2',
        is_read: false,
        created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Insert all notifications
      await supabase.from('notifications').insert(notifications);

      return { success: true, count: notifications.length };
    },
    onSuccess: (data) => {
      toast.success(`New user onboarding week created`, {
        description: `${data?.count || 6} activities spread over 5 days`,
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create onboarding week', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Scenario: High-engagement creator day
 * Many likes, comments, follows and mentions within 24 hours
 */
export function useHighEngagementCreatorDay() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      const now = new Date();

      // Clear existing test notifications
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', targetUserId)
        .eq('actor_id', testUser.id);

      const notifications = [];

      // Follow from Test User (start of day)
      await supabase
        .from('user_follows')
        .upsert({
          follower_id: testUser.id,
          following_id: targetUserId,
        }, { onConflict: 'follower_id,following_id' });

      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'follow',
        title: 'New follower',
        entity_type: 'profile',
        entity_id: testUser.id,
        is_read: false,
        created_at: new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString(),
      });

      // Burst of likes throughout the day (8 likes)
      for (let i = 0; i < 8; i++) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'like',
          title: 'Liked your post',
          entity_type: 'post',
          entity_id: `mock-post-creator-${i}`,
          is_read: i > 4, // Some read, most unread
          created_at: new Date(now.getTime() - (20 - i * 2) * 60 * 60 * 1000).toISOString(),
        });
      }

      // Engaged comments
      const comments = [
        'This angle of the 17th tee shot is unreal!',
        'Course looks pure, what did you shoot?',
        'Love the tempo on that swing.',
        'Your course content is the best on here.',
      ];
      
      for (let i = 0; i < comments.length; i++) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'comment',
          title: 'Commented on your post',
          message: comments[i],
          entity_type: 'post',
          entity_id: `mock-post-creator-comment-${i}`,
          is_read: false,
          created_at: new Date(now.getTime() - (10 - i * 2) * 60 * 60 * 1000).toISOString(),
        });
      }

      // Multiple mentions
      const mentions = [
        'Everyone should follow @you for the best course content',
        'Just played the course @you recommended - amazing!',
        'Tag @you if you want swing tips',
      ];

      for (let i = 0; i < mentions.length; i++) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'mention',
          title: 'Mentioned you in a post',
          message: mentions[i],
          entity_type: 'post',
          entity_id: `mock-post-creator-mention-${i}`,
          is_read: false,
          created_at: new Date(now.getTime() - (5 - i) * 60 * 60 * 1000).toISOString(),
        });
      }

      // Recent friend request
      await supabase
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${testUser.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${testUser.id})`);

      const { data: friendRequest } = await supabase
        .from('user_friends')
        .insert({
          user_id: testUser.id,
          friend_id: targetUserId,
          status: 'pending',
        })
        .select()
        .single();

      if (friendRequest) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'friend_request',
          title: 'Friend request',
          entity_type: 'friend_request',
          entity_id: friendRequest.id,
          is_read: false,
          data: { request_id: friendRequest.id },
          created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 min ago
        });
      }

      // Insert all notifications
      await supabase.from('notifications').insert(notifications);

      return { success: true, count: notifications.length };
    },
    onSuccess: (data) => {
      toast.success(`High-engagement creator day created`, {
        description: `${data?.count || 18}+ interactions in 24 hours`,
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create creator day', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Scenario: Quiet day then spike
 * Almost no activity, then a burst of notifications
 */
export function useQuietDayThenSpike() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      const now = new Date();

      // Clear existing test notifications
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', targetUserId)
        .eq('actor_id', testUser.id);

      const notifications = [];

      // QUIET PERIOD - just one old notification (12 hours ago)
      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'like',
        title: 'Liked your post',
        entity_type: 'post',
        entity_id: 'mock-post-quiet-1',
        is_read: true, // Already seen
        created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      });

      // SPIKE - Multiple notifications in the last 30 minutes
      
      // Follow
      await supabase
        .from('user_follows')
        .upsert({
          follower_id: testUser.id,
          following_id: targetUserId,
        }, { onConflict: 'follower_id,following_id' });

      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'follow',
        title: 'New follower',
        entity_type: 'profile',
        entity_id: testUser.id,
        is_read: false,
        created_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(), // 25 min ago
      });

      // Friend request
      await supabase
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${testUser.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${testUser.id})`);

      const { data: friendRequest } = await supabase
        .from('user_friends')
        .insert({
          user_id: testUser.id,
          friend_id: targetUserId,
          status: 'pending',
        })
        .select()
        .single();

      if (friendRequest) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'friend_request',
          title: 'Friend request',
          entity_type: 'friend_request',
          entity_id: friendRequest.id,
          is_read: false,
          data: { request_id: friendRequest.id },
          created_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString(), // 20 min ago
        });
      }

      // Quick burst of likes
      for (let i = 0; i < 3; i++) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'like',
          title: 'Liked your post',
          entity_type: 'post',
          entity_id: `mock-post-spike-${i}`,
          is_read: false,
          created_at: new Date(now.getTime() - (15 - i * 3) * 60 * 1000).toISOString(),
        });
      }

      // Comment that wakes things up
      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'comment',
        title: 'Commented on your post',
        message: 'Have not seen you post in a while - we miss your rounds!',
        entity_type: 'post',
        entity_id: 'mock-post-spike-comment',
        is_read: false,
        created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 min ago
      });

      // Mention (most recent)
      notifications.push({
        user_id: targetUserId,
        actor_id: testUser.id,
        type: 'mention',
        title: 'Mentioned you in a post',
        message: 'Need to get @you back on the course this weekend',
        entity_type: 'post',
        entity_id: 'mock-post-spike-mention',
        is_read: false,
        created_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2 min ago
      });

      // Insert all notifications
      await supabase.from('notifications').insert(notifications);

      return { success: true, count: notifications.length };
    },
    onSuccess: (data) => {
      toast.success(`Quiet day then spike created`, {
        description: `1 old notification + ${(data?.count || 9) - 1} new in last 30 min`,
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create spike scenario', {
        position: 'top-center',
      });
    },
  });
}
