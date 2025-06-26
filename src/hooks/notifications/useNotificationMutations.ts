
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleFriendRequestMutation = useMutation({
    mutationFn: async ({ friendRequestId, action }: { friendRequestId: string; action: 'accept' | 'decline' }) => {
      console.log('Processing friend request:', { friendRequestId, action });
      
      if (action === 'accept') {
        // Update friend request status to accepted
        const { error: friendError } = await supabase
          .from('user_friends')
          .update({ status: 'accepted' })
          .eq('id', friendRequestId);

        if (friendError) {
          console.error('Error accepting friend request:', friendError);
          throw friendError;
        }

        // Get the friend request details to create mutual follows
        const { data: friendRequest } = await supabase
          .from('user_friends')
          .select('user_id, friend_id')
          .eq('id', friendRequestId)
          .single();

        if (friendRequest) {
          console.log('Friend request details:', friendRequest);
          
          // Create mutual follow relationships
          const followPromises = [
            // User follows friend
            supabase
              .from('user_follows')
              .upsert({
                follower_id: friendRequest.user_id,
                following_id: friendRequest.friend_id
              }, { 
                onConflict: 'follower_id,following_id',
                ignoreDuplicates: true 
              }),
            // Friend follows user  
            supabase
              .from('user_follows')
              .upsert({
                follower_id: friendRequest.friend_id,
                following_id: friendRequest.user_id
              }, { 
                onConflict: 'follower_id,following_id',
                ignoreDuplicates: true 
              })
          ];

          const followResults = await Promise.allSettled(followPromises);
          console.log('Follow relationships created:', followResults);

          // Get the friend's username for the toast
          const { data: friendProfile } = await supabase
            .from('user_profiles')
            .select('username, display_name')
            .eq('id', friendRequest.user_id)
            .single();

          const friendName = friendProfile?.username ? `@${friendProfile.username}` : 
                           friendProfile?.display_name || 'User';

          // Show enhanced toast message
          toast({
            title: `🎉 You're now friends with ${friendName}`,
            description: "You're automatically following each other!",
            duration: 3000,
          });

          // Invalidate ALL related queries for both users to ensure counts update
          console.log('Invalidating queries for users:', friendRequest.user_id, 'and', friendRequest.friend_id);
          
          // Invalidate count queries for both users
          const queryKeys = [
            ['followerCount', friendRequest.user_id],
            ['followingCount', friendRequest.user_id], 
            ['friendsCount', friendRequest.user_id],
            ['followerCount', friendRequest.friend_id],
            ['followingCount', friendRequest.friend_id],
            ['friendsCount', friendRequest.friend_id],
            // Also invalidate the lists themselves
            ['followers', friendRequest.user_id],
            ['following', friendRequest.user_id],
            ['friends', friendRequest.user_id],
            ['followers', friendRequest.friend_id],
            ['following', friendRequest.friend_id],
            ['friends', friendRequest.friend_id],
          ];

          queryKeys.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey });
          });

          // Force refetch with no cache
          queryKeys.forEach(queryKey => {
            queryClient.removeQueries({ queryKey });
          });
        }
      } else {
        console.log('Declining friend request:', friendRequestId);
        const { error } = await supabase
          .from('user_friends')
          .delete()
          .eq('id', friendRequestId);

        if (error) {
          console.error('Error declining friend request:', error);
          throw error;
        }

        toast({
          title: "Friend request declined",
          duration: 1500,
        });
      }

      // Remove the notification by friend_request_id immediately
      console.log('Removing notification for friend request:', friendRequestId);
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('data->>friend_request_id', friendRequestId);

      if (deleteError) {
        console.error('Error removing notification:', deleteError);
      } else {
        console.log('Successfully removed notification for friend request:', friendRequestId);
      }
    },
    onSuccess: () => {
      // Invalidate all relevant queries to refresh the UI immediately
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['relationshipStatus'] });
      queryClient.invalidateQueries({ queryKey: ['followerCount'] });
      queryClient.invalidateQueries({ queryKey: ['followingCount'] });
      queryClient.invalidateQueries({ queryKey: ['friendsCount'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      
      // Force a complete cache clear for all relationship data
      queryClient.removeQueries({ queryKey: ['followerCount'] });
      queryClient.removeQueries({ queryKey: ['followingCount'] });
      queryClient.removeQueries({ queryKey: ['friendsCount'] });
    },
    onError: (error) => {
      console.error('Friend request mutation error:', error);
      toast({
        title: "Error processing friend request",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  });

  return {
    markAsReadMutation,
    handleFriendRequestMutation
  };
};
