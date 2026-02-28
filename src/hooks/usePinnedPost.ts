/**
 * Hook to manage pinned posts for business activity
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PinDuration = 7 | 14 | 30 | null; // null = indefinitely

export function usePinPost(businessId: string) {
  const queryClient = useQueryClient();

  const pinMutation = useMutation({
    mutationFn: async ({ postId, duration }: { postId: string; duration: PinDuration }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, unpin any currently pinned posts for this business
      const { error: unpinError } = await supabase
        .from('posts')
        .update({ 
          is_pinned: false, 
          pinned_until: null, 
          pinned_at: null, 
          pinned_by: null 
        })
        .eq('actor_type', 'business')
        .eq('actor_id', businessId)
        .eq('is_pinned', true);

      if (unpinError) throw unpinError;

      // Calculate pinned_until
      const pinnedUntil = duration 
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Pin the new post
      const { error: pinError } = await supabase
        .from('posts')
        .update({
          is_pinned: true,
          pinned_until: pinnedUntil,
          pinned_at: new Date().toISOString(),
          pinned_by: user.id,
        })
        .eq('id', postId);

      if (pinError) throw pinError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actor-posts', 'business', businessId] });
      toast.success('Post pinned');
    },
    onError: (error) => {
      console.error('Error pinning post:', error);
      toast.error("Couldn't pin post");
    },
  });

  const unpinMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .update({ 
          is_pinned: false, 
          pinned_until: null, 
          pinned_at: null, 
          pinned_by: null 
        })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actor-posts', 'business', businessId] });
      toast.success('Post unpinned');
    },
    onError: (error) => {
      console.error('Error unpinning post:', error);
      toast.error("Couldn't unpin post");
    },
  });

  return {
    pin: (postId: string, duration: PinDuration) => pinMutation.mutate({ postId, duration }),
    unpin: (postId: string) => unpinMutation.mutate(postId),
    isPinning: pinMutation.isPending,
    isUnpinning: unpinMutation.isPending,
  };
}
