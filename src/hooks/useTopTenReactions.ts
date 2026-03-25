import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export type ReactionType = 'agree' | 'interesting' | 'want_to_play';

export const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: string }> = {
  agree: { emoji: '🔥', label: 'Great pick' },
  interesting: { emoji: '👀', label: 'Interesting' },
  want_to_play: { emoji: '⭐', label: 'On my list' },
};

export function useTopTenReactions(targetUserId: string, courseId: string) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const qk = ['top-ten-reactions', targetUserId, courseId];

  const { data, isLoading } = useQuery({
    queryKey: qk,
    enabled: !!targetUserId && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('top_ten_reactions')
        .select('id, reactor_id, reaction_type')
        .eq('target_user_id', targetUserId)
        .eq('course_id', courseId);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const counts = (data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] ?? 0) + 1;
    return acc;
  }, {});

  const myReaction = user
    ? (data ?? []).find(r => r.reactor_id === user.id)?.reaction_type as ReactionType | undefined
    : undefined;

  const toggleReaction = useMutation({
    mutationFn: async (reactionType: ReactionType) => {
      if (!user) throw new Error('Not authenticated');
      if (myReaction === reactionType) {
        await supabase.from('top_ten_reactions').delete()
          .eq('reactor_id', user.id)
          .eq('target_user_id', targetUserId)
          .eq('course_id', courseId);
      } else {
        await supabase.from('top_ten_reactions').upsert({
          reactor_id: user.id,
          target_user_id: targetUserId,
          course_id: courseId,
          reaction_type: reactionType,
        }, { onConflict: 'reactor_id,target_user_id,course_id' });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  return { counts, myReaction, toggleReaction: toggleReaction.mutate, isLoading };
}
