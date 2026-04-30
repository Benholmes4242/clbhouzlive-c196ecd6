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

// ============================================
// ADMIN RPC-BASED HOOKS (bypass RLS via SECURITY DEFINER)
// ============================================

/**
 * Hook to send a friend request FROM the test user TO the target
 * Uses admin RPC to bypass RLS
 */
export function useSendFriendRequestFromTestUser() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Use admin RPC to create friend request
      const { data: requestId, error: requestError } = await supabase.rpc('test_lab_send_friend_request', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      if (requestError) throw requestError;

      // Create notification for target using batch insert RPC
      const { error: notifyError } = await supabase.rpc('test_lab_insert_notification', {
        p_user_id: targetUserId,
        p_actor_id: testUser.id,
        p_type: 'friend_request',
        p_title: 'Friend request',
        p_entity_type: 'friend_request',
        p_entity_id: requestId,
        p_is_read: false,
        p_data: { request_id: requestId },
      });

      if (notifyError) {
        console.warn('Failed to create notification:', notifyError);
      }

      return { id: requestId };
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

      // Use admin RPC to update friend request status
      const { error: updateError } = await supabase.rpc('test_lab_update_friend_request', {
        p_user_id: testUser.id,
        p_friend_id: targetUserId,
        p_new_status: 'accepted',
      });

      if (updateError) throw updateError;

      // Create acceptance notification for test user
      const { error: notifyError } = await supabase.rpc('test_lab_insert_notification', {
        p_user_id: testUser.id,
        p_actor_id: targetUserId,
        p_type: 'friend_accepted',
        p_title: 'Friend request accepted',
        p_entity_type: 'profile',
        p_entity_id: targetUserId,
        p_is_read: false,
      });

      if (notifyError) {
        console.warn('Failed to create notification:', notifyError);
      }

      return { success: true };
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
 * Hook to simulate: Target sends friend request to Test User, Test User accepts it
 * Creates a "friend_accepted" notification for the TARGET (Benjamin sees "Test User accepted your friend request")
 */
export function useTestUserAcceptsFriendRequestFromTarget() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // 1) Create a friend request FROM target TO test user (simulating target sent the request)
      const { error: requestError } = await supabase.rpc('test_lab_send_friend_request', {
        p_test_user_id: targetUserId, // target is the sender
        p_target_user_id: testUser.id, // test user is the recipient
      });

      if (requestError) throw requestError;

      // 2) Accept it (test user accepts)
      const { error: acceptError } = await supabase.rpc('test_lab_update_friend_request', {
        p_user_id: targetUserId, // original sender
        p_friend_id: testUser.id, // original recipient
        p_new_status: 'accepted',
      });

      if (acceptError) throw acceptError;

      // 3) Create friend_accepted notification for the TARGET (Benjamin)
      const { error: notifyError } = await supabase.rpc('test_lab_insert_notification', {
        p_user_id: targetUserId, // Benjamin receives the notification
        p_actor_id: testUser.id, // Test User is the actor who accepted
        p_type: 'friend_accepted',
        p_title: 'Friend request accepted',
        p_entity_type: 'profile',
        p_entity_id: testUser.id,
        p_is_read: false,
      });

      if (notifyError) {
        console.warn('Failed to create friend_accepted notification:', notifyError);
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success(`Test user accepted friend request from target`, {
        description: 'Target should see "accepted your friend request" notification',
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to simulate acceptance', {
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

      // Use admin RPC to update friend request status
      const { error: updateError } = await supabase.rpc('test_lab_update_friend_request', {
        p_user_id: testUser.id,
        p_friend_id: targetUserId,
        p_new_status: 'declined',
      });

      if (updateError) throw updateError;

      return { success: true };
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

      // Use admin RPC to remove the friend request
      const { error: deleteError } = await supabase.rpc('test_lab_update_friend_request', {
        p_user_id: testUser.id,
        p_friend_id: targetUserId,
        p_new_status: 'removed',
      });

      if (deleteError) throw deleteError;

      // Clear notifications between them
      await supabase.rpc('test_lab_clear_notifications', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      return { success: true };
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

      // Use admin RPC to create follow relationship
      const { error: followError } = await supabase.rpc('test_lab_follow', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      if (followError) throw followError;

      // Create notification for target
      const { error: notifyError } = await supabase.rpc('test_lab_insert_notification', {
        p_user_id: targetUserId,
        p_actor_id: testUser.id,
        p_type: 'follow',
        p_title: 'New follower',
        p_entity_type: 'profile',
        p_entity_id: testUser.id,
        p_is_read: false,
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
 * This uses the user's own auth, so no RPC needed
 */
export function useFollowTestUserFromTarget() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // This direction (target → test user) works with normal RLS since target = auth.uid()
      const { error: followError } = await supabase
        .from('user_follows')
        .insert({
          follower_id: targetUserId,
          follower_actor_id: targetUserId,
          follower_actor_type: 'personal',
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

      // Use admin RPC to unfollow in both directions
      const { error } = await supabase.rpc('test_lab_unfollow', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      if (error) throw error;

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

      // Use admin RPC to remove friendship
      const { error } = await supabase.rpc('test_lab_update_friend_request', {
        p_user_id: testUser.id,
        p_friend_id: targetUserId,
        p_new_status: 'removed',
      });

      if (error) throw error;

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

      const { error } = await supabase.rpc('test_lab_insert_notification', {
        p_user_id: targetUserId,
        p_actor_id: testUser.id,
        p_type: 'like',
        p_title: 'Liked your post',
        p_entity_type: 'post',
        p_entity_id: null, // No real post entity for mock
        p_is_read: false,
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

      const { error } = await supabase.rpc('test_lab_insert_notification', {
        p_user_id: targetUserId,
        p_actor_id: testUser.id,
        p_type: 'comment',
        p_title: 'Commented on your post',
        p_message: 'Incredible shot – which club did you use?',
        p_entity_type: 'post',
        p_entity_id: null, // No real post entity for mock
        p_is_read: false,
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

      const { error } = await supabase.rpc('test_lab_insert_notification', {
        p_user_id: targetUserId,
        p_actor_id: testUser.id,
        p_type: 'mention',
        p_title: 'Mentioned you in a post',
        p_message: 'Great round with @you yesterday!',
        p_entity_type: 'post',
        p_entity_id: null, // No real post entity for mock
        p_is_read: false,
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

      const { error } = await supabase.rpc('test_lab_clear_notifications', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

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
      await supabase.rpc('test_lab_clear_relationships', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      // Step 2: Test User sends friend request to target
      const { data: requestId, error: requestError } = await supabase.rpc('test_lab_send_friend_request', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      if (requestError) throw requestError;

      // Step 3: Create notification for target (friend request received)
      await supabase.rpc('test_lab_insert_notification', {
        p_user_id: targetUserId,
        p_actor_id: testUser.id,
        p_type: 'friend_request',
        p_title: 'Friend request',
        p_entity_type: 'friend_request',
        p_entity_id: requestId,
        p_is_read: false,
        p_data: { request_id: requestId },
      });

      // Small delay to make the flow feel more realistic
      await new Promise(r => setTimeout(r, 500));

      // Step 4: Target accepts the request
      await supabase.rpc('test_lab_update_friend_request', {
        p_user_id: testUser.id,
        p_friend_id: targetUserId,
        p_new_status: 'accepted',
      });

      // Step 5: Create acceptance notification for test user
      await supabase.rpc('test_lab_insert_notification', {
        p_user_id: testUser.id,
        p_actor_id: targetUserId,
        p_type: 'friend_accepted',
        p_title: 'Friend request accepted',
        p_entity_type: 'profile',
        p_entity_id: targetUserId,
        p_is_read: false,
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
      await supabase.rpc('test_lab_clear_notifications', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

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

      // Batch insert all notifications using admin RPC
      const { data: count, error } = await supabase.rpc('test_lab_insert_notifications_batch', {
        p_notifications: notifications,
      });

      if (error) throw error;

      // Also create follow relationship
      await supabase.rpc('test_lab_follow', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      return { success: true, count: count || notifications.length };
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

      // Clear existing follows using admin RPC
      await supabase.rpc('test_lab_unfollow', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      // Test User → Target
      await supabase.rpc('test_lab_follow', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      // Create follow notification
      await supabase.rpc('test_lab_insert_notification', {
        p_user_id: targetUserId,
        p_actor_id: testUser.id,
        p_type: 'follow',
        p_title: 'New follower',
        p_entity_type: 'profile',
        p_entity_id: testUser.id,
        p_is_read: false,
      });

      await new Promise(r => setTimeout(r, 300));

      // Target → Test User (this uses normal auth since target = auth.uid())
      await supabase
        .from('user_follows')
        .upsert({
          follower_id: targetUserId,
          follower_actor_id: targetUserId,
          follower_actor_type: 'personal',
          following_id: testUser.id,
        }, { onConflict: 'follower_id,following_id' });

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

      // Clear relationships using admin RPC
      await supabase.rpc('test_lab_clear_relationships', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      // Clear notifications using admin RPC
      await supabase.rpc('test_lab_clear_notifications', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

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
      await supabase.rpc('test_lab_clear_notifications', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      await supabase.rpc('test_lab_clear_relationships', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      const notifications = [];

      // Day 1 - Welcome follow (5 days ago)
      await supabase.rpc('test_lab_follow', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
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
      const { data: friendRequestId } = await supabase.rpc('test_lab_send_friend_request', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      if (friendRequestId) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'friend_request',
          title: 'Friend request',
          entity_type: 'friend_request',
          entity_id: friendRequestId,
          is_read: false,
          data: { request_id: friendRequestId },
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

      // Batch insert all notifications
      await supabase.rpc('test_lab_insert_notifications_batch', {
        p_notifications: notifications,
      });

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
      await supabase.rpc('test_lab_clear_notifications', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      const notifications = [];

      // Follow from Test User (start of day)
      await supabase.rpc('test_lab_follow', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

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
      await supabase.rpc('test_lab_clear_relationships', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      // Re-add the follow
      await supabase.rpc('test_lab_follow', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      const { data: friendRequestId } = await supabase.rpc('test_lab_send_friend_request', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      if (friendRequestId) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'friend_request',
          title: 'Friend request',
          entity_type: 'friend_request',
          entity_id: friendRequestId,
          is_read: false,
          data: { request_id: friendRequestId },
          created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 min ago
        });
      }

      // Batch insert all notifications
      await supabase.rpc('test_lab_insert_notifications_batch', {
        p_notifications: notifications,
      });

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
      await supabase.rpc('test_lab_clear_notifications', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

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
      await supabase.rpc('test_lab_follow', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

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
      await supabase.rpc('test_lab_clear_relationships', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      // Re-add the follow
      await supabase.rpc('test_lab_follow', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      const { data: friendRequestId } = await supabase.rpc('test_lab_send_friend_request', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      if (friendRequestId) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'friend_request',
          title: 'Friend request',
          entity_type: 'friend_request',
          entity_id: friendRequestId,
          is_read: false,
          data: { request_id: friendRequestId },
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

      // Batch insert all notifications
      await supabase.rpc('test_lab_insert_notifications_batch', {
        p_notifications: notifications,
      });

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

// ============================================
// FOCUS PRESETS (by channel/tab)
// ============================================

/**
 * Focus preset: Clubs-only day
 * Only club updates & golf course notifications
 */
export function useClubsOnlyDay() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      const now = new Date();

      // Clear existing test notifications
      await supabase.rpc('test_lab_clear_notifications', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      const notifications = [];

      const clubUpdates = [
        { title: 'Course open – temporary greens removed for the weekend', hoursAgo: 8 },
        { title: 'New competition: Saturday Roll-up – sign up now', hoursAgo: 6 },
        { title: "You've been added to the 'Clubhouse Athletes' watchlist", hoursAgo: 4 },
        { title: 'Winter league fixtures released – check your schedule', hoursAgo: 3 },
        { title: 'Course update: Back 9 now open after maintenance', hoursAgo: 2 },
        { title: 'Member event: Christmas Texas Scramble – book your spot', hoursAgo: 1 },
      ];

      for (const update of clubUpdates) {
        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'club_update',
          title: update.title,
          entity_type: 'club',
          entity_id: 'mock-club-test',
          is_read: update.hoursAgo > 4,
          created_at: new Date(now.getTime() - update.hoursAgo * 60 * 60 * 1000).toISOString(),
        });
      }

      await supabase.rpc('test_lab_insert_notifications_batch', {
        p_notifications: notifications,
      });

      return { success: true, count: notifications.length };
    },
    onSuccess: (data) => {
      toast.success(`Clubs-only day created`, {
        description: `${data?.count || 6} club notifications`,
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create clubs-only day', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Focus preset: Messages-heavy day
 * Lots of direct message notifications
 */
export function useMessagesHeavyDay() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      const now = new Date();

      // Clear existing test notifications
      await supabase.rpc('test_lab_clear_notifications', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      const notifications = [];

      const messages = [
        { preview: 'Fancy 9 holes after work this week?', hoursAgo: 10 },
        { preview: 'Got a spare 4-ball at your home club on Friday', hoursAgo: 8 },
        { preview: 'We should record one of your rounds for Clubhouse', hoursAgo: 6 },
        { preview: 'That last round looked class - rematch soon?', hoursAgo: 4 },
        { preview: 'Sending you my society schedule - keen to get you involved', hoursAgo: 3 },
        { preview: 'Did you see the new course photos? Amazing quality', hoursAgo: 2 },
        { preview: 'Up for Sunningdale next month? I can get us on', hoursAgo: 1 },
        { preview: 'Quick question about your swing video...', minsAgo: 30 },
        { preview: 'Just booked! You in?', minsAgo: 15 },
        { preview: 'See you on the first tee', minsAgo: 5 },
      ];

      for (const msg of messages) {
        const createdAt = msg.hoursAgo 
          ? new Date(now.getTime() - msg.hoursAgo * 60 * 60 * 1000)
          : new Date(now.getTime() - (msg.minsAgo || 0) * 60 * 1000);

        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'message',
          title: 'Sent you a message',
          message: msg.preview,
          entity_type: 'message',
          entity_id: `mock-message-${messages.indexOf(msg)}`,
          is_read: (msg.hoursAgo || 0) > 5,
          created_at: createdAt.toISOString(),
        });
      }

      await supabase.rpc('test_lab_insert_notifications_batch', {
        p_notifications: notifications,
      });

      return { success: true, count: notifications.length };
    },
    onSuccess: (data) => {
      toast.success(`DM-heavy day created`, {
        description: `${data?.count || 10} message notifications`,
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create DM-heavy day', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Focus preset: Mentions & tags day
 * Lots of @mentions in posts and comments
 */
export function useMentionsAndTagsDay() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      const now = new Date();

      // Clear existing test notifications
      await supabase.rpc('test_lab_clear_notifications', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      const notifications = [];

      const mentions = [
        { message: 'Had to tag you here – this looks like your kind of track', hoursAgo: 8 },
        { message: 'We NEED to play this together next season @you', hoursAgo: 6 },
        { message: 'Reminds me of our round at Sunningdale', hoursAgo: 5 },
        { message: "Can't believe @you hasn't played here yet", hoursAgo: 4 },
        { message: 'Rating this course highly – @you would love it', hoursAgo: 3 },
        { message: 'Best swing on Clbhouz belongs to @you', hoursAgo: 2 },
        { message: 'Getting the squad together @you @everyone', hoursAgo: 1 },
        { message: "Who's in for Friday? @you first on the list", minsAgo: 45 },
        { message: 'This is what @you was telling me about!', minsAgo: 20 },
        { message: 'Just posted your swing analysis @you', minsAgo: 5 },
      ];

      for (const mention of mentions) {
        const createdAt = mention.hoursAgo 
          ? new Date(now.getTime() - mention.hoursAgo * 60 * 60 * 1000)
          : new Date(now.getTime() - (mention.minsAgo || 0) * 60 * 1000);

        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'mention',
          title: 'Mentioned you in a post',
          message: mention.message,
          entity_type: 'post',
          entity_id: `mock-post-mention-focus-${mentions.indexOf(mention)}`,
          is_read: (mention.hoursAgo || 0) > 5,
          created_at: createdAt.toISOString(),
        });
      }

      await supabase.rpc('test_lab_insert_notifications_batch', {
        p_notifications: notifications,
      });

      return { success: true, count: notifications.length };
    },
    onSuccess: (data) => {
      toast.success(`Mentions & tags day created`, {
        description: `${data?.count || 10} @mentions`,
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create mentions day', {
        position: 'top-center',
      });
    },
  });
}

/**
 * Focus preset: Achievements burst
 * Simulates unlocking multiple achievements/milestones
 */
export function useAchievementsBurst() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      const now = new Date();

      // Clear existing test notifications
      await supabase.rpc('test_lab_clear_notifications', {
        p_test_user_id: testUser.id,
        p_target_user_id: targetUserId,
      });

      const notifications = [];

      const achievements = [
        { title: '🏌️ Single-figure handicap unlocked!', message: "You've dropped into single figures. Nice work.", hoursAgo: 6 },
        { title: '🏆 20 Club – Top 100', message: "You've played 20 Top 100 courses", hoursAgo: 5 },
        { title: '🎯 New personal best!', message: 'You set a new PB for 18 holes', hoursAgo: 4 },
        { title: '🌍 GB&I Explorer', message: "You've played 10 courses in Great Britain & Ireland", hoursAgo: 3 },
        { title: '📸 Content Creator', message: 'Your posts reached 1,000 views this month', hoursAgo: 2 },
        { title: '⭐ First Review', message: 'You submitted your first course review', hoursAgo: 1 },
        { title: '🔥 7-Day Streak', message: "You've posted for 7 days in a row", minsAgo: 30 },
      ];

      for (const achievement of achievements) {
        const createdAt = achievement.hoursAgo 
          ? new Date(now.getTime() - achievement.hoursAgo * 60 * 60 * 1000)
          : new Date(now.getTime() - (achievement.minsAgo || 0) * 60 * 1000);

        notifications.push({
          user_id: targetUserId,
          actor_id: testUser.id,
          type: 'achievement',
          title: achievement.title,
          message: achievement.message,
          entity_type: 'achievement',
          entity_id: `mock-achievement-${achievements.indexOf(achievement)}`,
          is_read: (achievement.hoursAgo || 0) > 4,
          created_at: createdAt.toISOString(),
        });
      }

      await supabase.rpc('test_lab_insert_notifications_batch', {
        p_notifications: notifications,
      });

      return { success: true, count: notifications.length };
    },
    onSuccess: (data) => {
      toast.success(`Achievements burst created`, {
        description: `${data?.count || 7} achievement unlocks`,
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create achievements burst', {
        position: 'top-center',
      });
    },
  });
}

// ============================================
// CINEMATIC LAYOUT SMOKE TEST
// ============================================

